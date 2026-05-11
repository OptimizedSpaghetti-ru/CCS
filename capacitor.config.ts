import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ccs.connect",
  appName: "CCS Connect",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_ccs_connect",
      iconColor: "#8C1007",
    },
  },
};

export default config;
