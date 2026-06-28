import { Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/services/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/Login'
import POSPage from '@/pages/cashier/POS'
import ProductsPage from '@/pages/admin/Products'
import OrdersPage from '@/pages/admin/Orders'
import StockPage from '@/pages/admin/Stock'
import UsersPage from '@/pages/admin/Users'
import PayLaterPage from '@/pages/admin/PayLater'
import BankQRConfigPage from '@/pages/admin/BankQRConfig'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<POSPage />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin/products"  element={<ProductsPage />} />
            <Route path="/admin/orders"    element={<OrdersPage />} />
            <Route path="/admin/pay-later" element={<PayLaterPage />} />
            <Route path="/admin/stock"     element={<StockPage />} />
            <Route path="/admin/bank-qr"   element={<BankQRConfigPage />} />
            <Route path="/admin/users"     element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
