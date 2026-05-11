package com.ccs.connect;

import android.content.Intent;
import android.content.SharedPreferences;
import android.app.NotificationManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import androidx.core.app.NotificationChannelCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final String NOTIFICATION_PREFS = "ccs_notification_prefs";
    private static final String NOTIFIED_IDS_KEY = "notified_ids";
    private static final String POLLING_CHANNEL_ID = "ccs-connect-live";

    private TextToSpeech textToSpeech;
    private boolean textToSpeechReady = false;
    private Handler notificationPollingHandler;
    private Runnable notificationPollingRunnable;
    private String pollingSupabaseUrl;
    private String pollingAnonKey;
    private String pollingAccessToken;
    private String pollingUserId;
    private String pollingUserRole;
    private boolean pollingSeeded = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        textToSpeech = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech.setLanguage(Locale.US);
                textToSpeech.setSpeechRate(0.94f);
                textToSpeechReady = true;
            }
        });

        bridge.getWebView().addJavascriptInterface(new CCSAndroidBridge(), "CCSAndroidBridge");
        createNativeNotificationChannel();
    }

    @Override
    public void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        stopNativeNotificationPolling();
        super.onDestroy();
    }

    private void createNativeNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationChannelCompat channel = new NotificationChannelCompat.Builder(
            POLLING_CHANNEL_ID,
            NotificationManager.IMPORTANCE_HIGH
        )
            .setName("CCS Connect")
            .setDescription("Realtime CCS Connect notifications")
            .setVibrationEnabled(true)
            .setLightsEnabled(true)
            .build();

        NotificationManagerCompat.from(this).createNotificationChannel(channel);
    }

    private void startNativeNotificationPolling() {
        stopNativeNotificationPolling();
        notificationPollingHandler = new Handler(Looper.getMainLooper());
        pollingSeeded = false;
        notificationPollingRunnable = new Runnable() {
            @Override
            public void run() {
                pollNotificationsOnce();
                if (notificationPollingHandler != null) {
                    notificationPollingHandler.postDelayed(this, 45_000);
                }
            }
        };
        notificationPollingHandler.post(notificationPollingRunnable);
    }

    private void stopNativeNotificationPolling() {
        if (notificationPollingHandler != null && notificationPollingRunnable != null) {
            notificationPollingHandler.removeCallbacks(notificationPollingRunnable);
        }
        notificationPollingHandler = null;
        notificationPollingRunnable = null;
    }

    private void pollNotificationsOnce() {
        final String supabaseUrl = pollingSupabaseUrl;
        final String anonKey = pollingAnonKey;
        final String accessToken = pollingAccessToken;

        if (supabaseUrl == null || anonKey == null || accessToken == null) {
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                String endpoint = supabaseUrl
                    + "/rest/v1/notifications"
                    + "?select=id,title,body,type,target_role,recipient_id,created_by,created_at"
                    + "&order=created_at.desc"
                    + "&limit=20";
                connection = (HttpURLConnection) new URL(endpoint).openConnection();
                connection.setRequestProperty("apikey", anonKey);
                connection.setRequestProperty("Authorization", "Bearer " + accessToken);
                connection.setRequestProperty("Accept", "application/json");

                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    return;
                }

                String response = readStream(connection.getInputStream());
                JSONArray rows = new JSONArray(response);
                SharedPreferences prefs = getSharedPreferences(NOTIFICATION_PREFS, MODE_PRIVATE);
                String notifiedIds = prefs.getString(NOTIFIED_IDS_KEY, "");
                StringBuilder nextIds = new StringBuilder(notifiedIds == null ? "" : notifiedIds);

                for (int index = rows.length() - 1; index >= 0; index -= 1) {
                    JSONObject row = rows.getJSONObject(index);
                    String id = row.optString("id", "");
                    if (id.isEmpty() || notifiedIds.contains("|" + id + "|")) {
                        continue;
                    }

                    if (!shouldShowNativeNotification(row)) {
                        continue;
                    }

                    nextIds.append("|").append(id).append("|");
                    if (pollingSeeded) {
                        showNativeNotification(row);
                    }
                }

                pollingSeeded = true;
                prefs.edit().putString(NOTIFIED_IDS_KEY, trimStoredIds(nextIds.toString())).apply();
            } catch (Exception ignored) {
                // Polling is best-effort; foreground realtime still handles active app delivery.
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).start();
    }

    private String readStream(InputStream inputStream) throws Exception {
        byte[] buffer = new byte[8192];
        StringBuilder builder = new StringBuilder();
        int read;
        while ((read = inputStream.read(buffer)) != -1) {
            builder.append(new String(buffer, 0, read));
        }
        return builder.toString();
    }

    private String trimStoredIds(String ids) {
        String[] parts = ids.split("\\|");
        StringBuilder builder = new StringBuilder();
        int kept = 0;
        for (int index = parts.length - 1; index >= 0 && kept < 120; index -= 1) {
            if (!parts[index].isEmpty()) {
                builder.insert(0, "|" + parts[index] + "|");
                kept += 1;
            }
        }
        return builder.toString();
    }

    private boolean shouldShowNativeNotification(JSONObject row) {
        String recipientId = row.optString("recipient_id", "");
        String targetRole = row.optString("target_role", "");
        String createdBy = row.optString("created_by", "");

        if (!recipientId.isEmpty() && recipientId.equals(pollingUserId)) {
            return true;
        }

        if (!recipientId.isEmpty()) {
            return false;
        }

        if ("admin".equals(pollingUserRole)) {
            return true;
        }

        if ("student".equals(pollingUserRole)) {
            return "student".equals(targetRole) || targetRole.isEmpty() || "null".equals(targetRole);
        }

        if ("faculty".equals(pollingUserRole)) {
            return "faculty".equals(targetRole)
                || targetRole.isEmpty()
                || "null".equals(targetRole)
                || createdBy.equals(pollingUserId);
        }

        if ("it_support".equals(pollingUserRole)) {
            return "it_support".equals(targetRole) || targetRole.isEmpty() || "null".equals(targetRole);
        }

        return false;
    }

    private void showNativeNotification(JSONObject row) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntentFlags.value();
        android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(
            this,
            row.optString("id", "").hashCode(),
            intent,
            flags
        );

        Bitmap largeIcon = BitmapFactory.decodeResource(
            getResources(),
            getResources().getIdentifier("school_logo_notification", "drawable", getPackageName())
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, POLLING_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_ccs_connect)
            .setLargeIcon(largeIcon)
            .setColor(0xFF8C1007)
            .setContentTitle(row.optString("title", "CCS Connect"))
            .setContentText(row.optString("body", "You have a new notification."))
            .setStyle(new NotificationCompat.BigTextStyle().bigText(row.optString("body", "")))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH);

        try {
            NotificationManagerCompat.from(this).notify(row.optString("id", "").hashCode(), builder.build());
        } catch (SecurityException ignored) {
            // Android 13+ permission may be denied; JS permission UI handles this.
        }
    }

    private static class PendingIntentFlags {
        static int value() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                return android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE;
            }
            return android.app.PendingIntent.FLAG_UPDATE_CURRENT;
        }
    }

    private class CCSAndroidBridge {
        @JavascriptInterface
        public void speak(String text) {
            runOnUiThread(() -> {
                if (!textToSpeechReady || textToSpeech == null || text == null || text.trim().isEmpty()) {
                    return;
                }

                textToSpeech.stop();
                textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ccs-route-guidance");
            });
        }

        @JavascriptInterface
        public void stopSpeech() {
            runOnUiThread(() -> {
                if (textToSpeech != null) {
                    textToSpeech.stop();
                }
            });
        }

        @JavascriptInterface
        public void shareBase64File(String filename, String mimeType, String base64Data) {
            runOnUiThread(() -> {
                try {
                    byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                    File exportDir = new File(getCacheDir(), "exports");
                    if (!exportDir.exists()) {
                        exportDir.mkdirs();
                    }

                    File exportFile = new File(exportDir, filename);
                    try (FileOutputStream outputStream = new FileOutputStream(exportFile)) {
                        outputStream.write(bytes);
                    }

                    Uri uri = FileProvider.getUriForFile(
                        MainActivity.this,
                        getPackageName() + ".fileprovider",
                        exportFile
                    );

                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                    shareIntent.setType(mimeType);
                    shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
                    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    Intent chooser = Intent.createChooser(shareIntent, "Share analytics export");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(chooser);
                } catch (Exception exception) {
                    Toast.makeText(
                        MainActivity.this,
                        "Unable to share analytics export.",
                        Toast.LENGTH_LONG
                    ).show();
                }
            });
        }

        @JavascriptInterface
        public void startNotificationPolling(
            String supabaseUrl,
            String anonKey,
            String accessToken,
            String userId,
            String userRole
        ) {
            pollingSupabaseUrl = supabaseUrl;
            pollingAnonKey = anonKey;
            pollingAccessToken = accessToken;
            pollingUserId = userId;
            pollingUserRole = userRole;
            runOnUiThread(() -> {
                createNativeNotificationChannel();
                startNativeNotificationPolling();
            });
        }

        @JavascriptInterface
        public void stopNotificationPolling() {
            runOnUiThread(() -> {
                stopNativeNotificationPolling();
                pollingSupabaseUrl = null;
                pollingAnonKey = null;
                pollingAccessToken = null;
                pollingUserId = null;
                pollingUserRole = null;
            });
        }
    }
}
