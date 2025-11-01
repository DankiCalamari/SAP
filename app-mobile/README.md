# SAP Mobile Stock App

React Native mobile application for inventory management and product browsing. Supports both iOS and Android platforms with offline functionality and push notifications.

## Features

- **Authentication**: Login with email/password, remember me, token refresh
- **Dashboard**: Role-based dashboards for staff and customers
- **Product Management**: Browse, search, filter products with barcode scanning
- **Inventory Management** (Staff only): View and adjust inventory with offline queue sync
- **Offline Mode**: SQLite local database with queue-based sync
- **Push Notifications**: Firebase Cloud Messaging for low stock and inventory alerts
- **Barcode Scanning**: Camera-based barcode scanning with manual entry fallback

## Tech Stack

- React Native 0.72
- Redux Toolkit (state management)
- React Navigation 6 (navigation)
- SQLite (offline storage)
- Firebase Cloud Messaging (push notifications)
- React Native Camera (barcode scanning)
- Axios (API calls)

## Prerequisites

- Node.js >= 16
- React Native development environment setup
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK
- Firebase project with FCM enabled

## Installation

### 1. Install Dependencies

\`\`\`bash
cd SAP/app-mobile
npm install
\`\`\`

### 2. iOS Setup

\`\`\`bash
cd ios
pod install
cd ..
\`\`\`

Configure Info.plist for camera permissions:
\`\`\`xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan barcodes</string>
\`\`\`

Add GoogleService-Info.plist to ios/ directory.

### 3. Android Setup

Add google-services.json to android/app/ directory.

Configure AndroidManifest.xml for camera and notification permissions:
\`\`\`xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />
\`\`\`

### 4. Environment Configuration

Update API base URL in \`src/services/api.js\`:
\`\`\`javascript
const BASE_URL = 'https://your-backend-url.com/api';
\`\`\`

## Running the App

### iOS
\`\`\`bash
npm run ios
\`\`\`

### Android
\`\`\`bash
npm run android
\`\`\`

### Start Metro bundler
\`\`\`bash
npm start
\`\`\`

## Project Structure

\`\`\`
src/
├── components/        # Reusable components
│   ├── ProductCard.js
│   ├── StockBadge.js
│   └── SyncIndicator.js
├── database/         # SQLite database
│   ├── schema.js
│   └── operations.js
├── navigation/       # Navigation configuration
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   └── MainNavigator.js
├── screens/          # App screens
│   ├── LoginScreen.js
│   ├── DashboardScreen.js
│   ├── ProductListScreen.js
│   ├── ProductDetailScreen.js
│   ├── InventoryScreen.js
│   ├── InventoryAdjustScreen.js
│   ├── BarcodeScannerScreen.js
│   └── ProfileScreen.js
├── services/         # API and Firebase services
│   ├── api.js
│   └── notifications.js
├── store/            # Redux store and slices
│   ├── index.js
│   ├── authSlice.js
│   ├── productsSlice.js
│   ├── inventorySlice.js
│   ├── syncSlice.js
│   └── settingsSlice.js
└── utils/            # Utility functions
    ├── format.js
    └── network.js
\`\`\`

## User Roles

- **Customer**: Browse products, scan barcodes, view profile
- **Stock Staff**: All customer features + inventory management
- **Manager**: All stock staff features + additional permissions
- **Admin**: Full access to all features

## Offline Functionality

The app uses SQLite for offline data storage. When offline:
- Products are loaded from local database
- Inventory adjustments are queued for sync
- Orange "Offline Mode" banner displays
- Sync happens automatically when connection restored

## Push Notifications

Notification types:
- **Low Stock**: Alerts when products reach low stock threshold
- **New Product**: Notifications about new products added
- **Inventory Alert**: Custom alerts from managers

## Testing

Test user credentials (use backend test accounts):
- Stock Staff: stockstaff@example.com / password
- Manager: manager@example.com / password
- Customer: customer@example.com / password

## Troubleshooting

### Camera not working
- Verify camera permissions in device settings
- Check Info.plist (iOS) or AndroidManifest.xml (Android) configuration

### Push notifications not received
- Verify Firebase configuration files are added
- Check FCM token is registered with backend
- Verify notification permissions granted

### Offline sync not working
- Check network status indicator
- Verify queue count in Profile screen
- Try manual sync from Profile > Sync Now

## Build for Production

### iOS
\`\`\`bash
npm run ios --configuration Release
\`\`\`

### Android
\`\`\`bash
cd android
./gradlew assembleRelease
\`\`\`

## License

Proprietary - SAP Platform
