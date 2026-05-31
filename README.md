# 🛒 Stokku — Inventory & Customer Tab Manager

Stokku is a fully offline Android app for small business owners to manage product inventory and customer tabs (running credit/utang). No internet required. All data is stored locally on the device using SQLite.

---

## ✨ Features

### 🏠 Dashboard
- Total receivables at a glance
- Count of customers with unpaid balances
- Low stock alerts (≤ 5 units highlighted)

### 📦 Products
- Add, edit, delete products (name, price, quantity, photo)
- Stock auto-decrements when items are added to a customer tab
- Low stock and out-of-stock indicators per item
- Product photos from camera or gallery

### 👥 Customers
- Add, edit, delete customers (name, phone optional, notes optional)
- Search by name
- Sorted by highest balance first
- Balance shown per customer at a glance

### 📋 Customer Tab
- Running tab per customer — items stack and accumulate
- Add items from inventory (auto-decrements stock)
- Record partial or full payments anytime
- Undo payments if entered incorrectly
- Payment log with timestamps
- Auto-computes: total bill, total paid, remaining balance
- ✅ Marked complete when balance hits zero
- "Settle" button to pay full remaining balance in one tap

### 🧾 Receipt
- Shareable receipt image: customer name, items, quantities, prices, total, paid, balance
- Save directly to device gallery
- Share via Messenger, Viber, or any Android share sheet

---

## 🛠 Tech Stack

| | Library | Version |
|---|---|---|
| ![React Native](https://img.shields.io/badge/-React_Native-61DAFB?logo=react&logoColor=black&style=flat) | React Native + Expo | ~52.0.0 |
| ![SQLite](https://img.shields.io/badge/-SQLite-003B57?logo=sqlite&logoColor=white&style=flat) | expo-sqlite | ~15.1.4 |
| ![React Navigation](https://img.shields.io/badge/-React_Navigation-6B52AE?logo=react&logoColor=white&style=flat) | React Navigation | ^6 |
| ![Reanimated](https://img.shields.io/badge/-Reanimated-764ABC?logo=react&logoColor=white&style=flat) | react-native-reanimated | ~3.16.1 |
| ![Gesture Handler](https://img.shields.io/badge/-Gesture_Handler-FF6B6B?logo=react&logoColor=white&style=flat) | react-native-gesture-handler | ~2.20.2 |
| ![Expo](https://img.shields.io/badge/-Image_Picker-000020?logo=expo&logoColor=white&style=flat) | expo-image-picker | ~16.0.6 |
| ![Expo](https://img.shields.io/badge/-Media_Library-000020?logo=expo&logoColor=white&style=flat) | expo-media-library | ~17.0.6 |
| ![Android](https://img.shields.io/badge/-ViewShot-3DDC84?logo=android&logoColor=white&style=flat) | react-native-view-shot | ~4.0.3 |
| ![EAS](https://img.shields.io/badge/-EAS_Build-000020?logo=expo&logoColor=white&style=flat) | EAS Build | — |

---

## 📁 Folder Structure

```
Stokku/
├── assets/                  # Icons, splash screen
├── src/
│   ├── components/
│   │   └── UI.js            # Reusable components (Button, Card, Input, etc.)
│   ├── screens/
│   │   ├── DashboardScreen.js
│   │   ├── ProductsScreen.js
│   │   ├── CustomersScreen.js
│   │   ├── CustomerTabScreen.js
│   │   └── ReceiptScreen.js
│   ├── database/
│   │   └── db.js            # All SQLite logic (tables + queries)
│   ├── navigation/
│   │   └── AppNavigator.js
│   └── utils/
│       ├── theme.js         # Colors, spacing, shadows
│       └── formatters.js
├── App.js                   # Entry point
├── app.json                 # Expo config
├── babel.config.js
├── eas.json                 # EAS Build config
├── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Running Locally

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

> **Note:** expo-sqlite requires a development build — it does **not** work inside standard Expo Go. Use EAS Build to generate a testable APK.

---

## 📦 Building the APK with EAS

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

## 🔧 Known Issues & Fixes

| Problem | Fix |
|---|---|
| `eas init` fails on Windows | Manually set `projectId` in `app.json` under `extra.eas.projectId` |
| Slug mismatch error | Match `"slug"` in `app.json` to the slug on expo.dev |
| App crashes on 32-bit devices | Add `"abiFilters": ["armeabi-v7a", "arm64-v8a"]` to `android` in `app.json` |
| `node_modules` won't delete on Windows | Use `cmd /c "rmdir /s /q node_modules"` |
| Image picker not working | Uninstall app, reinstall fresh — grant permissions on first launch |
| Camera not opening | Settings → Apps → Stokku → Permissions → enable Camera |

---

## 🗄 Database Schema

### `products`
| Column | Type |
|---|---|
| id | INTEGER PK |
| name | TEXT |
| price | REAL |
| quantity | INTEGER |
| image_uri | TEXT (optional) |
| created_at | TEXT |

### `customers`
| Column | Type |
|---|---|
| id | INTEGER PK |
| name | TEXT |
| phone | TEXT (optional) |
| note | TEXT (optional) |
| created_at | TEXT |

### `tab_items`
| Column | Type |
|---|---|
| id | INTEGER PK |
| customer_id | INTEGER (FK) |
| product_id | INTEGER (nullable) |
| product_name | TEXT (snapshot) |
| price | REAL (snapshot) |
| quantity | INTEGER |
| created_at | TEXT |

### `payments`
| Column | Type |
|---|---|
| id | INTEGER PK |
| customer_id | INTEGER (FK) |
| amount | REAL |
| date | TEXT |

---

## 📝 License

MIT — free to use and modify for your business needs.