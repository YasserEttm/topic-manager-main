import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'topic-list',
  webDir: 'www',
  server: {
    allowNavigation: [
      "*.blob.core.windows.net",
      "identitytoolkit.googleapis.com",
      "*.googleapis.com",
      "*.firebaseapp.com",
      "*.firebaseio.com"
    ]
  },
  plugins: {
    Keyboard: {
      resize: 'body'
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#4285f4",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      overlaysWebView: false
    }
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
