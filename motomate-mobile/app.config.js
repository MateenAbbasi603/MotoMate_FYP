import 'dotenv/config';

export default {
  expo: {
    name: 'Motomate',
    slug: 'motomate-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      eas: {
        projectId: "your-project-id"
      }
    }
  }
}; 