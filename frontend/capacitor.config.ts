import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nimbus.musicplayer',
  appName: 'Nimbus',
  webDir: 'dist',
  android: {
    backgroundColor: '#08080a',
    allowMixedContent: true,
  },
};

export default config;
