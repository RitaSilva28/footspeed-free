import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ritasilva.footspeedfree',
  appName: 'Footspeed',
  webDir: 'dist',
  backgroundColor: '#0f0f0f',
  plugins: {
    SystemBars: {
      style: 'DARK',
      hidden: false,
      insetsHandling: 'css',
    },
  },
};

export default config;
