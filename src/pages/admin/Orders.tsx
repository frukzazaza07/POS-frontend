import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useOrders } from '@/hooks/useOrders'
import { cancelOrder } from '@/services/orders'
import { getErrorMessage } from '@/lib/errors'
import { getCurrentUser } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Order, OrderStatus } from '@/types/api'

type BadgeVariant = 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'outline'

function statusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'destructive'
    case 'CANCELLED': return 'secondary'
    case 'PENDING': return 'warning'
    default: return 'outline'
  }
}

function OrderDetailsDialog({
  order,
  onClose,
}: {
  order: Order | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const currentUser = getCurrentUser()

  if (!order) return null

  const canCancel =
    order.status === 'PENDING' &&
    (currentUser?.role === 'admin' || order.cashier_id === currentUser?.id)

  const handleCancel = async () => {
    try {
      await cancelOrder(order.id)
      toast.success(t('orders.toast.cancelled'))
      qc.invalidateQueries({ queryKey: ['orders'] })
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {order.pos_order_id}
            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
            {order.cashier && <span className="ml-2">· {order.cashier.name}</span>}
          </div>

          {order.notes && (
            <p className="text-sm border rounded-md px-3 py-2 bg-muted/30">
              {t('orders.detail.notes')} {order.notes}
            </p>
          )}

          {order.fail_reason && (
            <p className="text-sm text-destructive border border-destructive/30 rounded-md px-3 py-2 bg-destructive/5">
              {order.fail_reason}
            </p>
          )}

          <div className="space-y-1">
            {(order.items ?? []).map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-medium">฿{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {!!order.vat_amount && (
            <div className="text-sm space-y-0.5">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('orders.detail.subtotalExclVat')}</span>
                <span>฿{order.net_amount!.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('orders.detail.vat', { rate: order.vat_rate })}</span>
                <span>฿{order.vat_amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between font-bold text-base pt-1">
            <span>{t('orders.detail.total')}</span>
            <span>฿{order.total_amount.toFixed(2)}</span>
          </div>

          {order.total_cost != null && order.profit != null && (
            <div className="text-sm space-y-0.5 border-t pt-2">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('orders.detail.cost')}</span>
                <span>฿{order.total_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{t('orders.detail.profit')}</span>
                <span className={order.profit >= 0 ? 'text-green-700' : 'text-destructive'}>
                  ฿{order.profit.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {canCancel && (
            <Button variant="destructive" className="w-full" onClick={handleCancel}>
              {t('orders.detail.cancelOrder')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)
  const { data, isLoading } = useOrders({ page })

  const orders = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">{t('orders.title')}</h1>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{t('orders.loading')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('orders.table.orderId')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('orders.table.date')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('orders.table.cashier')}</TableHead>
              <TableHead>{t('orders.table.total')}</TableHead>
              <TableHead>{t('orders.table.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  {t('orders.noOrdersFound')}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(order)}
                >
                  <TableCell className="font-mono text-xs">{order.pos_order_id}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{order.cashier?.name ?? '—'}</TableCell>
                  <TableCell className="font-semibold">฿{order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground pt-2">
        <span>{t('orders.count', { count: total })}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            {t('orders.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('orders.next')}
          </Button>
        </div>
      </div>

      <OrderDetailsDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
