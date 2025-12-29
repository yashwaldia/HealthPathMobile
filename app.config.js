module.exports = {
  expo: {
    name: "PI HEALTH",
    slug: "pi-health",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/android-icon-512.png",
    scheme: "healthpathmobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/android-icon-512.png",
      resizeMode: "contain",
      backgroundColor: "#FFF5F0"
    },
    // ios: {
    //   supportsTablet: true,
    //   infoPlist: {
    //     NSPhotoLibraryUsageDescription: "This app needs access to your photo library to upload medical documents.",
    //     NSCameraUsageDescription: "This app needs access to your camera to capture medical documents.",
    //     NSPhotoLibraryAddUsageDescription: "This app needs access to save processed medical documents."
    //   },
    //   bundleIdentifier: "com.ab1224.HealthPathMobile",
    //   googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist"
    // },
    android: {
      package: "com.ab1224.HealthPathMobile",
      adaptiveIcon: {
        foregroundImage: "./assets/images/ic_launcher.png",
        backgroundColor: "#FFF5F0"
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
        "android.permission.RECORD_AUDIO"
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"
    },
    web: {
      output: "static",
      favicon: "./assets/images/android-icon-512.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/android-icon-512.png",
          imageWidth: 250,
          resizeMode: "contain",
          backgroundColor: "#FFF5F0"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "The app needs access to your photos to upload medical documents.",
          cameraPermission: "The app needs access to your camera to capture medical documents."
        }
      ],
      [
        "expo-notifications",
        {
          color: "#FFF5F0"
        }
      ],
      "expo-font",
      "expo-web-browser",
      "@react-native-firebase/app",
      [
        "@react-native-firebase/auth",
        {
          "android_task_executor_maximum_pool_size": 10,
          "android_task_executor_keep_alive_seconds": 3
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      eas: {
        "projectId": "06dda70b-aa52-4902-a00b-08a6fca7e67d"
      }
    }
  }
};
