import { Camera } from '@capacitor/camera';
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.bowling',
  appName: 'BowlingStats',
  webDir: 'www/browser',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
