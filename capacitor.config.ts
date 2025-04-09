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
  }
};

export default config;
