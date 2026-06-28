import { useState, useEffect } from 'react'
import { ArrowLeft, Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProducts } from '@/hooks/useProducts'
import { useCart, selectTotal } from '@/store/cart'
import { createOrder } from '@/services/orders'
import { getBankQRConfig, fetchQRCodeBlob } from '@/services/config'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BankQRConfig, PaymentMethod, POSProduct } from '@/types/api'

const CATEGORY_EMOJI: Record<string, string> = {
  beverages: '☕',
  food: '🍽️',
  desserts: '🍰',
  snacks: '🍿',
  drinks: '🥤',
}

function categoryEmoji(cat: string) {
  return CATEGORY_EMOJI[cat?.toLowerCase()] ?? '📦'
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string }[] = [
  { value: 'CASH',       label: 'Cash',     desc: 'Pay at counter' },
  { value: 'BANK_QRCODE', label: 'QR Code', desc: 'Bank transfer' },
  { value: 'PAY_LATER',  label: 'Pay Later', desc: 'Bill to customer' },
]

function ProductCard({ product, onClick }: { product: POSProduct; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all select-none hover:shadow-md hover:border-primary/50 active:scale-[0.97]',
        !product.is_active && 'opacity-40 pointer-events-none',
      )}
    >
      <CardContent className="p-2.5 sm:p-3">
        <div className="aspect-square rounded-md bg-muted mb-2 flex items-center justify-center text-2xl sm:text-3xl">
          {categoryEmoji(product.category)}
        </div>
        <p className="text-xs sm:text-sm font-semibold leading-tight mb-0.5 line-clamp-2">
          {product.name}
        </p>
        <p className="text-xs text-muted-foreground capitalize mb-1 hidden sm:block">
          {product.category}
        </p>
        <p className="text-xs sm:text-sm font-bold text-primary">฿{product.price.toFixed(2)}</p>
      </CardContent>
    </Card>
  )
}

function CartItems() {
  const items = useCart((s) => s.items)
  const remove = useCart((s) => s.remove)
  const updateQty = useCart((s) => s.updateQty)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
        <ShoppingCart className="h-10 w-10 opacity-20" />
        <p className="text-sm">Tap a product to add</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {items.map((item) => (
        <div key={item.product.id} className="px-4 py-3">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium leading-tight flex-1 mr-2 line-clamp-2">
              {item.product.name}
            </span>
            <button
              onClick={() => remove(item.product.pos_product_id)}
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateQty(item.product.pos_product_id, item.quantity - 1)}
                className="h-7 w-7 rounded border flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.product.pos_product_id, item.quantity + 1)}
                className="h-7 w-7 rounded border flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-sm font-semibold">
              ฿{(item.product.price * item.quantity).toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

interface CartFooterProps {
  notes: string
  onNotesChange: (v: string) => void
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (v: PaymentMethod) => void
  customerName: string
  onCustomerNameChange: (v: string) => void
  customerPhone: string
  onCustomerPhoneChange: (v: string) => void
  dueDays: number
  onDueDaysChange: (v: number) => void
  total: number
  onCheckout: () => void
  onClear: () => void
  loading: boolean
  hasItems: boolean
}

function CartFooter({
  notes, onNotesChange,
  paymentMethod, onPaymentMethodChange,
  customerName, onCustomerNameChange,
  customerPhone, onCustomerPhoneChange,
  dueDays, onDueDaysChange,
  total, onCheckout, onClear,
  loading, hasItems,
}: CartFooterProps) {
  return (
    <div className="p-4 border-t space-y-3">
      {/* Payment method */}
      <div className="grid grid-cols-3 gap-1.5">
        {PAYMENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPaymentMethodChange(opt.value)}
            className={cn(
              'py-2 px-1 rounded-md text-xs font-medium border transition-colors text-center leading-tight',
              paymentMethod === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* PAY_LATER extra fields */}
      {paymentMethod === 'PAY_LATER' && (
        <div className="space-y-2 p-3 rounded-md bg-muted/40 border border-dashed">
          <Input
            placeholder="Customer name *"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Phone *"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Due days"
              value={dueDays || ''}
              min={1}
              onChange={(e) => onDueDaysChange(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <Input
        placeholder="Order notes..."
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
      />

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">Total</span>
        <span className="text-xl font-bold">฿{total.toFixed(2)}</span>
      </div>

      {hasItems && (
        <Button variant="outline" size="sm" className="w-full" onClick={onClear}>
          Clear cart
        </Button>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={onCheckout}
        disabled={loading || !hasItems}
      >
        {loading
          ? 'Processing...'
          : paymentMethod === 'PAY_LATER'
          ? 'Confirm — Pay Later'
          : 'Confirm Sale'}
      </Button>
    </div>
  )
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_QRCODE: 'QR Code / Bank Transfer',
  PAY_LATER: 'Pay Later',
}

function ConfirmOrderDialog({
  open,
  onClose,
  onConfirm,
  paymentMethod,
  customerName,
  customerPhone,
  dueDays,
  notes,
  total,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  paymentMethod: PaymentMethod
  customerName: string
  customerPhone: string
  dueDays: number
  notes: string
  total: number
  loading: boolean
}) {
  const items = useCart((s) => s.items)
  const [qrUrl, setQrUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrConfig, setQrConfig] = useState<BankQRConfig | null>(null)

  // For BANK_QRCODE: fetch QR and bank details as soon as dialog opens
  useEffect(() => {
    if (!open || paymentMethod !== 'BANK_QRCODE') return
    let objectUrl = ''
    setQrLoading(true)
    Promise.all([fetchQRCodeBlob(total), getBankQRConfig()])
      .then(([url, cfg]) => { objectUrl = url; setQrUrl(url); setQrConfig(cfg) })
      .catch(() => { setQrUrl(''); setQrConfig(null) })
      .finally(() => setQrLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [open, paymentMethod, total])

  const isQR = paymentMethod === 'BANK_QRCODE'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isQR ? 'Scan to Pay' : 'Confirm Sale'}</DialogTitle>
          <DialogDescription>
            {isQR
              ? 'Show the QR to the customer. Confirm once payment is received.'
              : 'Review the order before submitting.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* BANK_QRCODE: QR image + bank details */}
          {isQR && (
            <>
              <div className="mx-auto w-52 h-52 flex items-center justify-center rounded-lg border bg-white p-2">
                {qrLoading ? (
                  <p className="text-xs text-muted-foreground">Generating QR...</p>
                ) : qrUrl ? (
                  <img src={qrUrl} alt="PromptPay QR" className="w-full h-full object-contain" />
                ) : (
                  <p className="text-xs text-muted-foreground text-center px-4">
                    QR unavailable — ask admin to set PromptPay ID.
                  </p>
                )}
              </div>

              {qrConfig && (
                <div className="rounded-md border p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{qrConfig.bank_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">{qrConfig.account_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number</span>
                    <span className="font-medium font-mono">{qrConfig.account_number}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Item list */}
          <div className="rounded-md border divide-y overflow-hidden text-sm">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between px-3 py-2">
                <span className="flex-1 mr-2 font-medium">
                  {item.product.name}
                  <span className="text-muted-foreground font-normal"> × {item.quantity}</span>
                </span>
                <span className="font-semibold shrink-0">
                  ฿{(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Payment method (non-QR only) */}
          {!isQR && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">{PAYMENT_LABELS[paymentMethod]}</span>
            </div>
          )}

          {/* PAY_LATER details */}
          {paymentMethod === 'PAY_LATER' && (
            <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due in</span>
                <span className="font-medium">{dueDays} days</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {notes.trim() && (
            <p className="text-sm text-muted-foreground">
              Notes: <span className="text-foreground">{notes}</span>
            </p>
          )}

          {/* Total */}
          <div className="flex justify-between items-center border-t pt-3 font-bold">
            <span>Total</span>
            <span className="text-primary text-xl">฿{total.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Back
          </Button>
          <Button onClick={onConfirm} disabled={loading || (isQR && qrLoading)}>
            {loading
              ? 'Processing...'
              : isQR
              ? 'Payment Received — Submit'
              : 'Confirm & Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default function POSPage() {
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [dueDays, setDueDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data, isLoading } = useProducts(search)
  const products = data?.items ?? []

  const items = useCart((s) => s.items)
  const add = useCart((s) => s.add)
  const clear = useCart((s) => s.clear)
  const total = useCart(selectTotal)
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  const resetForm = () => {
    setNotes('')
    setCustomerName('')
    setCustomerPhone('')
    setDueDays(7)
    setPaymentMethod('CASH')
  }

  // Step 1 — validate and open the review dialog
  const handleOpenConfirm = () => {
    if (items.length === 0) return
    if (paymentMethod === 'PAY_LATER') {
      if (!customerName.trim()) { toast.error('Customer name is required for Pay Later'); return }
      if (!customerPhone.trim()) { toast.error('Customer phone is required for Pay Later'); return }
    }
    setConfirmOpen(true)
  }

  // Step 2 — employee confirmed; call the API
  const handleSubmitOrder = async () => {
    setLoading(true)
    try {
      const payload = {
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          pos_product_id: i.product.pos_product_id,
          quantity: i.quantity,
        })),
        ...(paymentMethod === 'PAY_LATER' && {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          payment_due_days: dueDays || 7,
        }),
      }

      const order = await createOrder(payload)
      toast.success(`Order ${order.pos_order_id} — ฿${order.total_amount.toFixed(2)}`)
      setConfirmOpen(false)
      clear()
      setCartOpen(false)
      resetForm()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Checkout failed'))
    } finally {
      setLoading(false)
    }
  }

  const cartFooterProps: CartFooterProps = {
    notes, onNotesChange: setNotes,
    paymentMethod, onPaymentMethodChange: setPaymentMethod,
    customerName, onCustomerNameChange: setCustomerName,
    customerPhone, onCustomerPhoneChange: setCustomerPhone,
    dueDays, onDueDaysChange: setDueDays,
    total,
    onCheckout: handleOpenConfirm,
    onClear: () => { clear(); resetForm() },
    loading,
    hasItems: items.length > 0,
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Product grid ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No products found
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 pb-20 md:pb-2 pr-0.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => add(p)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop cart panel (md+) ───────────────────── */}
      <div className="hidden md:flex w-80 flex-col border-l bg-card shrink-0">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Cart</span>
          {itemCount > 0 && (
            <Badge variant="secondary" className="ml-auto">{itemCount}</Badge>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <CartItems />
        </div>
        <CartFooter {...cartFooterProps} />
      </div>

      {/* ── Mobile floating cart button ────────────────── */}
      <button
        onClick={() => setCartOpen(true)}
        className="md:hidden fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
        aria-label="Open cart"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold leading-none">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {/* ── Mobile full-screen cart overlay ───────────── */}
      {cartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
            <button
              onClick={() => setCartOpen(false)}
              className="p-1.5 -ml-1.5 rounded-md hover:bg-accent transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="font-semibold text-base">
              Cart {itemCount > 0 && `(${itemCount})`}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CartItems />
          </div>
          <CartFooter {...cartFooterProps} />
        </div>
      )}

      {/* ── Order review dialog (shown before API call) ── */}
      <ConfirmOrderDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmitOrder}
        paymentMethod={paymentMethod}
        customerName={customerName}
        customerPhone={customerPhone}
        dueDays={dueDays}
        notes={notes}
        total={total}
        loading={loading}
      />

    </div>
  )
}
