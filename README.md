# Zaiko — Inventory & Customer Tab Manager

Zaiko (在庫, Japanese for "inventory") is a fully offline Android app for small business owners to manage product inventory and customer tabs (running credit/utang). No internet required. All data is stored locally on the device using SQLite.

---

## Features

### Dashboard
- Total receivables at a glance
- Count of customers with unpaid balances
- Low stock alerts (≤ 5 units highlighted)
- Tappable profit cards — Collected, Restock Cost, and Estimated Profit, each linking to detailed views
- Quick stat cards for unpaid tabs, low stock, and sales statistics

### Products
- Add, edit, delete products (name, price, quantity, photo)
- Auto-generated unique barcode (SKU) per product in CODE128 format
- View, save to gallery, or share product barcode labels
- Initial stock cost tracking — enter cost per unit when adding a new product, automatically logged as a restock
- Stock auto-decrements when items are added to a customer tab
- Low stock and out-of-stock indicators per item
- Product photos from camera or file explorer
- Restock button per product — logs quantity added and cost paid
- Restock History — full log of all restocks with dates and costs

### Customers
- Add, edit, delete customers (name, phone optional, notes optional)
- Customer profile photos from camera or file explorer
- Search by name
- Sorted by highest balance first
- Balance shown per customer at a glance
- Undo delete — a 4-second toast lets you reverse an accidental delete
- Receipt History — all past receipts saved automatically

### Customer Tab
- Running tab per customer — items stack and accumulate
- Add items manually from inventory or scan barcodes
- Multi-item barcode scanner — scan multiple products in sequence, adjust quantities, then add all at once
- Audio and vibration feedback on successful barcode scan
- Void items — reduce or remove defective/returned items, automatically restocks inventory
- Record partial or full payments anytime
- Undo payments if entered incorrectly
- Payment log with timestamps in your device's local time and locale
- Auto-computes: total bill, total paid, remaining balance
- Audio cue when a tab becomes fully settled
- Marked complete when balance hits zero
- "Settle" button to pay full remaining balance in one tap

### Receipt
- Shareable receipt image: customer name, items, quantities, prices, total, paid, balance
- Save directly to device gallery
- Share via Messenger, Viber, or any Android share sheet
- Receipt History — receipts auto-saved on every payment, viewable anytime

### Sales Statistics
- Revenue breakdown by day, month, or year
- Top 5 best-selling products
- Total transactions and customer count

### Settings
- Dark mode toggle with persistent preference
- Export Backup — save all data to a JSON file
- Import Backup — restore data from a backup file
- App info

---

## Tech Stack

| | Library | Version |
|---|---|---|
| ![React Native](https://img.shields.io/badge/-React_Native-61DAFB?logo=react&logoColor=black&style=flat) | React Native + Expo | ~52.0.0 |
| ![SQLite](https://img.shields.io/badge/-SQLite-003B57?logo=sqlite&logoColor=white&style=flat) | expo-sqlite | ~15.1.4 |
| ![React Navigation](https://img.shields.io/badge/-React_Navigation-6B52AE?logo=react&logoColor=white&style=flat) | React Navigation | ^6 |
| ![Reanimated](https://img.shields.io/badge/-Reanimated-764ABC?logo=react&logoColor=white&style=flat) | react-native-reanimated | ~3.16.1 |
| ![Gesture Handler](https://img.shields.io/badge/-Gesture_Handler-FF6B6B?logo=react&logoColor=white&style=flat) | react-native-gesture-handler | ~2.20.2 |
| ![Expo](https://img.shields.io/badge/-Camera-000020?logo=expo&logoColor=white&style=flat) | expo-camera | latest |
| ![Expo](https://img.shields.io/badge/-Image_Picker-000020?logo=expo&logoColor=white&style=flat) | expo-image-picker | ~16.0.6 |
| ![Expo](https://img.shields.io/badge/-Media_Library-000020?logo=expo&logoColor=white&style=flat) | expo-media-library | ~17.0.6 |
| ![Expo](https://img.shields.io/badge/-File_System-000020?logo=expo&logoColor=white&style=flat) | expo-file-system | ~18.0.12 |
| ![Expo](https://img.shields.io/badge/-AV-000020?logo=expo&logoColor=white&style=flat) | expo-av | latest |
| ![Expo](https://img.shields.io/badge/-Document_Picker-000020?logo=expo&logoColor=white&style=flat) | expo-document-picker | ~13.0.3 |
| ![Expo](https://img.shields.io/badge/-Sharing-000020?logo=expo&logoColor=white&style=flat) | expo-sharing | ~13.0.1 |
| ![Android](https://img.shields.io/badge/-ViewShot-3DDC84?logo=android&logoColor=white&style=flat) | react-native-view-shot | ~4.0.3 |
| ![SVG](https://img.shields.io/badge/-SVG-FF6B6B?logo=svg&logoColor=white&style=flat) | react-native-svg | latest |
| ![Barcode](https://img.shields.io/badge/-Barcode-FF6B6B?style=flat) | react-native-barcode-svg | latest |
| ![EAS](https://img.shields.io/badge/-EAS_Build-000020?logo=expo&logoColor=white&style=flat) | EAS Build | — |

---

## Folder Structure

```
Zaiko/
├── assets/
│   ├── icon.png, splash.png, adaptive-icon.png
│   └── sounds/
│       ├── beep.mp3              # Barcode scan success
│       └── success.mp3           # Payment settled chime
├── src/
│   ├── components/
│   │   └── UI.js                 # Reusable theme-aware components
│   ├── screens/
│   │   ├── DashboardScreen.js
│   │   ├── ProductsScreen.js
│   │   ├── CustomersScreen.js
│   │   ├── CustomerTabScreen.js
│   │   ├── ReceiptScreen.js
│   │   ├── ReceiptHistoryScreen.js
│   │   ├── ReceiptHistoryDetailScreen.js
│   │   ├── RestockHistoryScreen.js
│   │   ├── StatsScreen.js
│   │   └── SettingsScreen.js
│   ├── database/
│   │   └── db.js                 # All SQLite logic (tables + queries)
│   ├── navigation/
│   │   └── AppNavigator.js
│   └── utils/
│       ├── theme.js               # Light + Dark colors, spacing, shadows
│       ├── ThemeContext.js        # Global dark mode context
│       ├── formatters.js          # Currency, locale-aware date formatters
│       └── backup.js              # Export/import backup logic
├── App.js                         # Entry point
├── app.json                       # Expo config
├── babel.config.js
├── eas.json                       # EAS Build config
├── package.json
├── .gitignore
└── README.md
```

---

## Running Locally

### Prerequisites
- Node.js **v20.x** (use [nvm-windows](https://github.com/coreybutler/nvm-windows) on Windows)
- EAS CLI: `npm install -g eas-cli`

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Dotissleeping/Stokku.git
cd Stokku

# 2. Install dependencies
npm install

# 3. Start Expo dev server
npx expo start
```

> **Note:** expo-sqlite and expo-camera barcode scanning require a development build — they do **not** work inside standard Expo Go. Use EAS Build to generate a testable APK.

---

## Building the APK with EAS

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Log in to Expo
```bash
eas login
```

### 3. Build a preview APK (for testing, no Play Store needed)
```bash
eas build --platform android --profile preview
```

### 4. Build production APK
```bash
eas build --platform android --profile production
```

EAS builds in the cloud and provides a download link for the `.apk` when done.

> **Tip:** On Windows, use Node 20. Node 24 is incompatible with Expo 52.

---

## Known Issues & Fixes

| Problem | Fix |
|---|---|
| `eas init` fails on Windows | Manually set `projectId` in `app.json` under `extra.eas.projectId` |
| Slug mismatch error | Match `"slug"` in `app.json` to the slug on expo.dev |
| App crashes on 32-bit devices | Add `"abiFilters": ["armeabi-v7a", "arm64-v8a"]` to `android` in `app.json` |
| `node_modules` won't delete on Windows | Use `cmd /c "rmdir /s /q node_modules"` |
| Image picker not working | Uninstall app, reinstall fresh — grant permissions on first launch |
| Camera not opening | Settings → Apps → Zaiko → Permissions → enable Camera |
| Status bar icons invisible | Uses dual StatusBar (Expo + RN native) for reliable Android icon colors |
| Estimated profit incorrect | Now computed as Total Collected minus Total Restock Cost, queried separately |
| Stock doubling on product add | Initial stock cost is logged directly to the restocks table without re-incrementing stock |
| Receivables not updating after customer delete | `PRAGMA foreign_keys = ON` enables proper cascade delete of tab items and payments |

---

## Database Schema

### `products`
| Column | Type |
|---|---|
| id | INTEGER PK |
| name | TEXT |
| price | REAL |
| quantity | INTEGER |
| image_uri | TEXT (optional) |
| sku | TEXT (auto-generated barcode value) |
| created_at | TEXT |

### `customers`
| Column | Type |
|---|---|
| id | INTEGER PK |
| name | TEXT |
| phone | TEXT (optional) |
| note | TEXT (optional) |
| image_uri | TEXT (optional) |
| created_at | TEXT |

### `tab_items`
| Column | Type |
|---|---|
| id | INTEGER PK |
| customer_id | INTEGER (FK, cascade delete) |
| product_id | INTEGER (nullable) |
| product_name | TEXT (snapshot) |
| price | REAL (snapshot) |
| quantity | INTEGER |
| created_at | TEXT |

### `payments`
| Column | Type |
|---|---|
| id | INTEGER PK |
| customer_id | INTEGER (FK, cascade delete) |
| amount | REAL |
| date | TEXT |

### `restocks`
| Column | Type |
|---|---|
| id | INTEGER PK |
| product_id | INTEGER (FK) |
| product_name | TEXT |
| quantity_added | INTEGER |
| cost | REAL |
| date | TEXT |

### `receipt_snapshots`
| Column | Type |
|---|---|
| id | INTEGER PK |
| customer_id | INTEGER (FK, cascade delete) |
| customer_name | TEXT |
| snapshot | TEXT (JSON) |
| total_bill | REAL |
| total_paid | REAL |
| balance | REAL |
| date | TEXT |

---

## License

MIT — free to use and modify for your business needs.