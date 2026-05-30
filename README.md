# 🛒 Stokku — Inventory & Customer Tab Manager

Stokku is a fully offline Android app for small business owners to manage product inventory and customer tabs (running credit/utang). No internet required. All data is stored locally on the device using SQLite.

---

## ⚠️ Compatibility Notes

- **Minimum Android version:** Android 8.0 (API 26)
- **Tested on:** Android 16 (armeabi-v7a / 32-bit)
- **Architecture support:** `armeabi-v7a` (32-bit) and `arm64-v8a` (64-bit)
- **Node.js required:** v20.x (v24 is not supported with Expo 51)
- **expo-sqlite** does not run in standard Expo Go — use EAS Build or `npx expo run:android`

---

## ✨ Features

### 🏠 Dashboard
- Total receivables at a glance
- Count of customers with unpaid balances
- Low stock alerts (≤ 5 units highlighted)

### 📦 Products
- Add, edit, delete products (name, price, quantity)
- Stock auto-decrements when items are added to a customer tab
- Low stock and out-of-stock indicators per item

### 👥 Customers
- Add, edit, delete customers (name, phone optional, notes optional)
- Search by name
- Sorted by highest balance first
- Balance shown per customer at a glance

### 📋 Customer Tab
- Running tab per customer — items stack and accumulate
- Add items from inventory (auto-decrements stock)
- Record partial or full payments anytime
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

| Layer | Library | Version |
|---|---|---|
| Framework | React Native + Expo | ~51 |
| Database | expo-sqlite (local, offline) | ~14.0.6 |
| Navigation | React Navigation (Bottom Tabs + Native Stack) | ^6 |
| Animations | react-native-reanimated | 3.16.7 |
| Gestures | react-native-gesture-handler | 2.21.2 |
| Safe Area | react-native-safe-area-context | 4.10.1 |
| Screens | react-native-screens | 3.31.1 |
| Preferences | @react-native-async-storage/async-storage | 1.23.1 |
| Gallery Save | expo-media-library | ~16.0.4 |
| Receipt Image | react-native-view-shot | 3.8.0 |
| Build | EAS Build | — |

---

## 📁 Folder Structure

```
Stokku/
├── assets/              # Icons, splash screen
├── src/
│   ├── components/
│   │   └── UI.js        # Reusable components (Button, Card, Input, etc.)
│   ├── screens/
│   │   ├── DashboardScreen.js
│   │   ├── ProductsScreen.js
│   │   ├── CustomersScreen.js
│   │   ├── CustomerTabScreen.js
│   │   └── ReceiptScreen.js
│   ├── database/
│   │   └── db.js        # All SQLite logic (tables + queries)
│   ├── navigation/
│   │   └── AppNavigator.js
│   └── utils/
│       ├── theme.js     # Colors, spacing, shadows
│       └── formatters.js
├── App.js               # Entry point
├── app.json             # Expo config
├── babel.config.js
├── eas.json             # EAS Build config
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

> **Note:** expo-sqlite requires a development build — it does **not** work inside standard Expo Go. Use EAS Build to generate a testable APK (see below).

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

EAS builds in the cloud and provides a download link for the `.apk` when done. Install it directly on your Android device.

> **Tip:** If you're on Windows, make sure you're using Node 20. Node 24 is incompatible with Expo 51 and will cause `expo config` to silently fail.

---

## 🔧 Known Setup Issues & Fixes

| Problem | Fix |
|---|---|
| `expo config --json` returns nothing | Remove `"expo-sqlite"` from `plugins` in `app.json` — it doesn't need a plugin entry |
| `eas init` fails on Windows | Manually set `projectId` in `app.json` under `extra.eas.projectId` |
| Slug mismatch error | Match `"slug"` in `app.json` to the slug shown on expo.dev |
| Gradle build fails with `compileSdkVersion not specified` | Use `expo-sqlite@~14.0.6` via `npx expo install expo-sqlite` |
| App crashes on Android 16 | Upgrade `react-native-reanimated` to `3.16.7` and `react-native-gesture-handler` to `2.21.2` |
| App crashes on 32-bit devices | Add `"abiFilters": ["armeabi-v7a", "arm64-v8a"]` to the `android` section in `app.json` |
| `node_modules` won't delete on Windows | Use `cmd /c "rmdir /s /q node_modules"` instead of `Remove-Item` |

---

## 🗄 Database Schema

### `products`
| Column | Type |
|---|---|
| id | INTEGER PK |
| name | TEXT |
| price | REAL |
| quantity | INTEGER |
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