import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ccs.connect",
  appName: "CCS Connect",
  webDir: "dist",
  backgroundColor: "#50131c",
  bundledWebRuntime: false,
  plugins: {
    App: {
      disableBackButtonHandler: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_ccs_connect",
      iconColor: "#8C1007",
    },
  },
};

export default config;
