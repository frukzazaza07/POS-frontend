# POS Frontend — Integration Guide

How to set up, extend, and deploy this project.

---

## 1. Local Development Setup

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Go POS backend running on port 4000

### Steps

```bash
# Install dependencies
npm install

# Configure backend URL
# Edit .env.local:
VITE_API_URL=http://localhost:4000

# Start dev server
npm run dev
# → http://localhost:5173
```

Default admin credentials (seeded by the backend):

```
Email:    admin@pos.local
Password: admin123
```

---

## 2. Access from Phone / Tablet (LAN)

The Vite dev server already binds to all interfaces (`host: true` in `vite.config.ts`).

1. Find your machine's local IP:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." }
   # Look for your Wi-Fi IP, e.g. 192.168.1.122
   ```

2. Update `.env.local` so the phone can reach the backend:
   ```
   VITE_API_URL=http://192.168.1.122:4000
   ```
   > Without this, the phone would try to call `localhost:4000` — which resolves to itself, not your dev machine.

3. Restart the dev server (`npm run dev`).

4. Open on your phone: `http://192.168.1.122:5173`

> The backend must also listen on `0.0.0.0` (not just `127.0.0.1`) for the phone to reach it.

---

## 3. Connecting to a Different Backend

All API calls go through the single Axios instance in `src/lib/api.ts`. To point at a staging or production server, change `.env.local`:

```
VITE_API_URL=https://api.mystore.com
```

For production builds, use `.env.production`:

```
VITE_API_URL=https://api.mystore.com
```

No code changes are needed — Axios reads `import.meta.env.VITE_API_URL` at runtime.

---

## 4. Adding a New API Endpoint

**Step 1 — Add types** (`src/types/api.ts`):
```ts
export interface Promotion {
  id: string
  code: string
  discount_percent: number
  is_active: boolean
}
```

**Step 2 — Add service function** (`src/services/promotions.ts`):
```ts
import api from '@/lib/api'
import type { ApiResponse, Promotion } from '@/types/api'

export async function getPromotions(): Promise<Promotion[]> {
  const { data } = await api.get<ApiResponse<Promotion[]>>('/api/v1/promotions')
  return data.data!
}

export async function createPromotion(payload: Omit<Promotion, 'id'>): Promise<Promotion> {
  const { data } = await api.post<ApiResponse<Promotion>>('/api/v1/promotions', payload)
  return data.data!
}
```

**Step 3 — Add TanStack Query hook** (`src/hooks/usePromotions.ts`):
```ts
import { useQuery } from '@tanstack/react-query'
import { getPromotions } from '@/services/promotions'

export function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: getPromotions,
    staleTime: 1000 * 60,
  })
}
```

**Step 4 — Use in a component:**
```tsx
const { data: promotions, isLoading } = usePromotions()
```

**Step 5 — Invalidate after mutations:**
```ts
const qc = useQueryClient()
await createPromotion(payload)
qc.invalidateQueries({ queryKey: ['promotions'] })
```

---

## 5. Adding a New Admin Page

**Step 1 — Create the page** (`src/pages/admin/Promotions.tsx`):
```tsx
export default function PromotionsPage() {
  return <div className="p-3 sm:p-6">...</div>
}
```

**Step 2 — Register the route** (`src/App.tsx`):
```tsx
import PromotionsPage from '@/pages/admin/Promotions'

// Inside <Route element={<AdminRoute />}>:
<Route path="/admin/promotions" element={<PromotionsPage />} />
```

**Step 3 — Add to sidebar** (`src/components/Layout.tsx`):
```ts
import { Tag } from 'lucide-react'

const navItems = [
  // ...existing items...
  { label: 'Promotions', href: '/admin/promotions', icon: Tag, adminOnly: true },
]
```

---

## 6. Adding a New Payment Method

Payment methods are defined as a union type in `src/types/api.ts`:

```ts
export type PaymentMethod = 'CASH' | 'BANK_QRCODE' | 'PAY_LATER'
// Add new value:
export type PaymentMethod = 'CASH' | 'BANK_QRCODE' | 'PAY_LATER' | 'CREDIT_CARD'
```

Then update the `PAYMENT_OPTIONS` array in `src/pages/cashier/POS.tsx`:

```ts
const PAYMENT_OPTIONS = [
  { value: 'CASH',        label: 'Cash',        desc: 'Pay at counter' },
  { value: 'BANK_QRCODE', label: 'QR Code',     desc: 'Bank transfer' },
  { value: 'PAY_LATER',   label: 'Pay Later',   desc: 'Bill to customer' },
  { value: 'CREDIT_CARD', label: 'Credit Card', desc: 'Swipe card' },
]
```

If the new method needs extra fields (like `PAY_LATER` needs customer info), add them as state and pass them conditionally in `handleCheckout`.

---

## 7. Adding a UI Component (shadcn/ui)

Components live in `src/components/ui/`. Each is a standalone React file using Tailwind + Radix primitives. To add a new one, either:

**Option A — Write manually** (like the existing components):
Follow the pattern in `src/components/ui/button.tsx`. Use `cn()` from `@/lib/utils` for class merging.

**Option B — Use the shadcn CLI** (requires `components.json`):
```bash
npx shadcn@latest add select
npx shadcn@latest add tooltip
npx shadcn@latest add popover
```

New Radix packages are installed automatically.

---

## 8. Role-Based Access

Two roles: `'admin'` and `'cashier'`.

**Route guard** — wrap routes in `<AdminRoute />` in `src/App.tsx`:
```tsx
<Route element={<AdminRoute />}>
  <Route path="/admin/my-page" element={<MyPage />} />
</Route>
```

**Conditional UI** — use `isAdmin()` from `src/lib/auth`:
```tsx
import { isAdmin } from '@/lib/auth'

{isAdmin() && <Button onClick={syncStock}>Sync Stock</Button>}
```

**Current user** — use `getCurrentUser()` from `src/services/auth`:
```tsx
import { getCurrentUser } from '@/services/auth'

const user = getCurrentUser()
// { id, name, email, role, is_active, ... }
```

---

## 9. Form Validation Pattern

All forms use `react-hook-form` + `zod`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  price: z.coerce.number().positive('Must be positive'),
})
type FormValues = z.infer<typeof schema>

function MyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', price: 0 },
  })

  const onSubmit = async (values: FormValues) => {
    await myService(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      <Button type="submit" disabled={isSubmitting}>Save</Button>
    </form>
  )
}
```

---

## 10. Error Handling Pattern

All errors pass through `getErrorMessage()` (`src/lib/errors.ts`):

```ts
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'

try {
  await createOrder(payload)
  toast.success('Order created')
} catch (err) {
  toast.error(getErrorMessage(err, 'Failed to create order'))
}
```

The function extracts `err.response.data.message` from Axios errors (the backend always returns `{ status, message, data }`), falls back to `err.message`, and finally to the provided fallback string.

---

## 11. Cart Store

The cart is a Zustand store at `src/store/cart.ts`.

```ts
import { useCart, selectTotal } from '@/store/cart'

// In a component:
const items    = useCart(s => s.items)      // CartItem[]
const add      = useCart(s => s.add)        // (product) => void
const remove   = useCart(s => s.remove)     // (posProductId) => void
const updateQty = useCart(s => s.updateQty) // (posProductId, qty) => void
const clear    = useCart(s => s.clear)      // () => void
const total    = useCart(selectTotal)       // number — computed from items
```

Use **selectors** (not `useCart()` without args) to avoid re-rendering on every cart change.

The cart is in-memory only — it clears on page refresh. This is intentional for a POS.

---

## 12. Production Deployment

### Build

```bash
npm run build
# Output: dist/  (static files — index.html + assets/)
```

### Serve with Nginx

```nginx
server {
  listen 80;
  root /var/www/pos-frontend/dist;
  index index.html;

  # SPA fallback — all routes serve index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API calls to the Go backend
  location /api/ {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
  }
  location /auth/ {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
  }
}
```

With the Nginx proxy approach, set `VITE_API_URL=` (empty) so requests go to the same origin — no CORS needed.

### Serve with Caddy

```
:80 {
  root * /var/www/pos-frontend/dist
  try_files {path} /index.html
  file_server

  reverse_proxy /api/* localhost:4000
  reverse_proxy /auth/* localhost:4000
}
```

### Serve with `vite preview` (quick test only)

```bash
npm run preview
# Serves dist/ on http://localhost:4173
```

---

## 13. Environment Files Reference

| File | When used | Committed? |
|---|---|---|
| `.env.local` | Local dev override — highest priority | No |
| `.env` | Shared defaults | Yes (no secrets) |
| `.env.production` | Used during `npm run build` | Yes (no secrets) |

Vite only exposes variables prefixed with `VITE_` to the browser bundle.

---

## 14. Known Constraints

| Constraint | Detail |
|---|---|
| No refresh token | JWT expires in 24 h — user must log in again |
| Cart is in-memory | Refreshing the page empties the cart (intentional) |
| Stock page is cached | `GET /api/v1/stock` returns a 5-minute cache from the backend; use Sync Stock (admin) to force refresh |
| Bank QR image | URL must be publicly accessible — the browser fetches it directly. Upload to your own storage (S3, Cloudinary, etc.) |
| PAY_LATER alerts | The backend sends webhook alerts every hour for overdue orders. Configure `ALERT_WEBHOOK_URL` in the Go backend `.env` |
