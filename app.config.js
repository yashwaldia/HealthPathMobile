module.exports = {
  expo: {
    name: "PI HEALTH",
    slug: "pi-health",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/android-icon-512.png",
    scheme: "healthpathmobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,

    splash: {
      image: "./assets/images/android-icon-512.png",
      resizeMode: "contain",
      backgroundColor: "#FFF5F0",
    },

    ios: {
      bundleIdentifier: "com.ab1224.HealthPathMobile",
      supportsTablet: true,
    },

    android: {
      package: "com.ab1224.HealthPathMobile",
      adaptiveIcon: {
        foregroundImage: "./assets/images/ic_launcher.png",
        backgroundColor: "#FFF5F0",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.CAMERA",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM",
        "android.permission.RECORD_AUDIO",
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },

    web: {
      output: "static",
      favicon: "./assets/images/android-icon-512.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/android-icon-512.png",
          imageWidth: 250,
          resizeMode: "contain",
          backgroundColor: "#FFF5F0",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app needs access to your photos to upload medical documents.",
          cameraPermission:
            "The app needs access to your camera to capture medical documents.",
        },
      ],
      [
        "expo-notifications",
        {
          color: "#FFF5F0",
        },
      ],
      "expo-font",
      "expo-web-browser",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      eas: {
        projectId: "06dda70b-aa52-4902-a00b-08a6fca7e67d",
      },
    },
  },
};
