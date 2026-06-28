# POS Frontend — System Structure

## Overview

Single-Page Application (SPA) built with Vite + React 18 + TypeScript. Connects to a Go REST backend at `http://localhost:4000` (configurable via `.env.local`). Designed for use on desktop, iPad, and mobile phone on the same local network.

---

## Tech Stack

| Layer | Library | Version | Purpose |
|---|---|---|---|
| Bundler | Vite | 5.x | Dev server + production build |
| UI framework | React | 18.x | Component rendering |
| Language | TypeScript | 5.x | Static typing |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| UI components | shadcn/ui (Radix) | — | Accessible headless components |
| Routing | React Router | 6.x | Client-side navigation |
| Server state | TanStack Query | 5.x | Data fetching, caching, invalidation |
| Client state | Zustand | 5.x | Cart store |
| HTTP client | Axios | 1.x | API requests + interceptors |
| Forms | React Hook Form + Zod | 7.x / 3.x | Form state + validation |
| Toasts | Sonner | 1.x | Notifications |
| Icons | Lucide React | 0.454 | Icon set |

---

## Directory Structure

```
c:\projects\POS-frontend\
│
├── index.html                  # SPA entry point — single <div id="root">
├── vite.config.ts              # Vite config — @ alias, host:true for LAN access
├── tailwind.config.js          # Tailwind theme — CSS variable tokens
├── postcss.config.js
├── tsconfig.json               # Project references root
├── tsconfig.app.json           # App source TypeScript config
├── tsconfig.node.json          # vite.config.ts TypeScript config
├── package.json
├── .env.local                  # VITE_API_URL (git-ignored)
├── FRONTEND_API_GUIDE.md       # Backend API contract
├── SYSTEM_STRUCTURE.md         # This file
└── INTEGRATION_GUIDE.md        # How to extend and deploy
│
└── src/
    ├── main.tsx                # App bootstrap — QueryClient, BrowserRouter, Toaster
    ├── App.tsx                 # Route tree
    ├── index.css               # Tailwind directives + CSS variable theme
    ├── vite-env.d.ts           # import.meta.env types
    │
    ├── types/
    │   └── api.ts              # ALL shared TypeScript types mirroring the Go models
    │
    ├── lib/
    │   ├── api.ts              # Axios instance — baseURL, JWT interceptor, 401 redirect
    │   ├── auth.ts             # isAdmin() helper (reads localStorage)
    │   ├── errors.ts           # getErrorMessage() — extracts backend error strings
    │   └── utils.ts            # cn() — Tailwind class merge utility
    │
    ├── services/               # Pure API functions — no React, no state
    │   ├── auth.ts             # login(), logout(), getCurrentUser(), registerUser()
    │   ├── products.ts         # getProducts(), createProduct(), updateProduct(), deleteProduct()
    │   ├── orders.ts           # createOrder(), getOrders(), cancelOrder(), markOrderPaid()
    │   ├── stock.ts            # getStock(), checkAvailability(), syncStock()
    │   └── config.ts           # getBankQRConfig(), setBankQRConfig()
    │
    ├── hooks/                  # TanStack Query wrappers — data + loading + error
    │   ├── useProducts.ts      # useProducts(search, page)
    │   ├── useOrders.ts        # useOrders({ page, payment_method, overdue })
    │   └── useStock.ts         # useStock()
    │
    ├── store/
    │   └── cart.ts             # Zustand cart — items, add, remove, updateQty, clear
    │                           # selectTotal — exported selector for computed total
    │
    ├── components/
    │   ├── Layout.tsx          # App shell — sidebar nav + mobile hamburger + outlet
    │   ├── ProtectedRoute.tsx  # Redirects unauthenticated users to /login
    │   ├── AdminRoute.tsx      # Redirects non-admin users to /
    │   └── ui/                 # shadcn/ui components (written manually, no CLI)
    │       ├── button.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── card.tsx
    │       ├── badge.tsx
    │       ├── dialog.tsx
    │       └── table.tsx
    │
    └── pages/
        ├── Login.tsx           # /login — email/password form
        ├── cashier/
        │   └── POS.tsx         # / — product grid + cart + payment method selection
        └── admin/
            ├── Products.tsx    # /admin/products — CRUD table + create/edit dialog
            ├── Orders.tsx      # /admin/orders — paginated table + detail dialog + cancel
            ├── PayLater.tsx    # /admin/pay-later — PAY_LATER orders + mark as paid
            ├── Stock.tsx       # /admin/stock — stock levels + sync button
            ├── BankQRConfig.tsx # /admin/bank-qr — bank account/QR image setup
            └── Users.tsx       # /admin/users — create user form
```

---

## Route Map

| Path | Component | Guard | Roles |
|---|---|---|---|
| `/login` | `Login.tsx` | none (redirects to `/` if already authenticated) | public |
| `/` | `POS.tsx` | `ProtectedRoute` | any |
| `/admin/products` | `Products.tsx` | `AdminRoute` | admin |
| `/admin/orders` | `Orders.tsx` | `AdminRoute` | admin |
| `/admin/pay-later` | `PayLater.tsx` | `AdminRoute` | admin |
| `/admin/stock` | `Stock.tsx` | `AdminRoute` | admin |
| `/admin/bank-qr` | `BankQRConfig.tsx` | `AdminRoute` | admin |
| `/admin/users` | `Users.tsx` | `AdminRoute` | admin |
| `*` | — | — | redirects to `/` |

---

## Authentication Flow

```
User visits /                             User visits /login
       │                                         │
  isAuthenticated()?                      POST /auth/login
  (checks localStorage                          │
   for pos_token)                     ┌─────────┴──────────┐
       │                              │                     │
      no → redirect /login          success             failure
       │                              │                     │
      yes → render page        store token +           show error
                                user in localStorage
                                      │
                               navigate to /
```

**Token storage:** `localStorage` keys `pos_token` (JWT) and `pos_user` (JSON user object).

**Token lifetime:** 24 hours. No refresh token — user must log in again after expiry.

**401 handling:** The Axios response interceptor in `src/lib/api.ts` automatically clears storage and redirects to `/login` on any 401 response.

---

## Data Flow

```
Page component
    │
    ├── useProducts() / useOrders() / useStock()    ← TanStack Query hook
    │       │
    │       └── services/products.ts etc.           ← plain async function
    │               │
    │               └── src/lib/api.ts (Axios)      ← HTTP + JWT header
    │                       │
    │                       └── Go backend :4000
    │
    └── Mutations (create/update/delete)
            │
            ├── call service function directly (await createOrder(...))
            ├── show toast on success/error
            └── queryClient.invalidateQueries(...)  ← triggers refetch
```

---

## State Management

Two distinct state layers:

| State | Tool | What it holds |
|---|---|---|
| **Server state** | TanStack Query | Products list, orders, stock — fetched, cached, invalidated |
| **Cart** | Zustand | In-memory cart items + quantity. Cleared after checkout. |

Local `useState` is used for UI-only state: dialog open/close, form inputs, search text, page numbers.

---

## Payment Method System

Three methods supported, controlled by `PaymentMethod = 'CASH' | 'BANK_QRCODE' | 'PAY_LATER'`.

```
Cashier selects payment method in cart footer
          │
  ┌───────┼────────────┐
  │       │            │
CASH   BANK_QRCODE  PAY_LATER
  │       │            │
confirm  confirm    requires customer_name
  │       │         + customer_phone
  │    show Bank     + payment_due_days
  │    QR dialog          │
  │    (fetches        confirm
  │  /config/bank-qr)
  │
order created → cart cleared → toast shown
```

**Bank QR dialog** is shown only after a successful `BANK_QRCODE` order. It fetches the store's bank config from the backend and displays it to the cashier to show the customer.

---

## Responsive Breakpoints

| Breakpoint | Sidebar | POS Cart |
|---|---|---|
| `< lg` (mobile/iPad portrait) | Hidden; hamburger opens slide-in overlay | Floating FAB → full-screen overlay |
| `md+` (iPad landscape+) | — | Side-by-side panel (`w-80`) |
| `lg+` (desktop) | Always-visible fixed sidebar (`w-56`) | Side-by-side panel |

Admin table columns follow the same breakpoint pattern — secondary columns are hidden on smaller screens using `hidden sm:table-cell` and `hidden md:table-cell`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | Backend base URL |

Set in `.env.local` (never commit). For LAN access from phone/tablet, change to the machine's local IP, e.g. `http://192.168.1.122:4000`.

---

## Build

```bash
npm run dev        # Vite dev server — hot reload, LAN-accessible (host: true)
npm run build      # TypeScript check (tsc -b) then Vite production bundle → dist/
npm run preview    # Serve dist/ locally to verify production build
```

Production output: `dist/` — static files. Can be served by any static host (Nginx, Apache, Caddy, GitHub Pages).
