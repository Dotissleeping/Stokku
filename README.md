# 🛒 Stokku — Inventory & Customer Tab Manager

Stokku is a fully offline Android app for small business owners to manage product inventory and customer tabs (running credit/utang). No internet required. All data is stored locally on the device using SQLite.

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

| Layer | Library |
|---|---|
| Framework | React Native + Expo ~51 |
| Database | expo-sqlite (local, offline) |
| Navigation | React Navigation (Bottom Tabs + Native Stack) |
| Animations | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Safe Area | react-native-safe-area-context |
| Screens | react-native-screens |
| Preferences | @react-native-async-storage/async-storage |
| Gallery Save | expo-media-library |
| Receipt Image | react-native-view-shot |
| Build | EAS Build |

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
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your Android device

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/stokku.git
cd stokku

# 2. Install dependencies
npm install

# 3. Start Expo dev server
npx expo start

# 4. Scan the QR code with Expo Go on your Android phone
```

> **Note:** expo-sqlite requires a development build or bare workflow to run properly — it does **not** work inside standard Expo Go. Use `npx expo run:android` or build via EAS (see below).

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

### 3. Configure your project
```bash
eas build:configure
```
> Update the `projectId` in `app.json` → `extra.eas.projectId` with your actual EAS project ID.

### 4. Build a preview APK (for testing)
```bash
eas build --platform android --profile preview
```

### 5. Build production APK
```bash
eas build --platform android --profile production
```

EAS will provide a download link for the `.apk` file when the build completes.

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
