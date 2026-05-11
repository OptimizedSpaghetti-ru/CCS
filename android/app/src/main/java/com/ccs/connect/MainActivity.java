package com.ccs.connect;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech textToSpeech;
    private boolean textToSpeechReady = false;

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
    }

    @Override
    public void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
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
    }
}
