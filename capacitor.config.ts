import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.bowling',
  appName: 'BowlingStats',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    "SplashScreen": {
        "launchShowDuration": 3000,
        "launchAutoHide": true,
        "androidScaleType": "CENTER_CROP",
        "splashImmersive": true,
        "backgroundColor": "#ffffff"
    }
}
};

export default config;
