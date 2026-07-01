import { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useOrders } from '@/hooks/useOrders'
import { markOrderPaid } from '@/services/orders'
import { getErrorMessage } from '@/lib/errors'
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

export default function PayLaterPage() {
  const { t } = useTranslation()
  const [showOverdue, setShowOverdue] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useOrders({
    payment_method: 'PAY_LATER',
    overdue: showOverdue || undefined,
    limit: 50,
  })

  const orders = data?.items ?? []
  const total = data?.total ?? 0

  const handleMarkPaid = async (id: string) => {
    try {
      await markOrderPaid(id)
      toast.success(t('payLater.toast.markedPaid'))
      qc.invalidateQueries({ queryKey: ['orders'] })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">{t('payLater.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverdue(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !showOverdue ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {t('payLater.all')}
          </button>
          <button
            onClick={() => setShowOverdue(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              showOverdue ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {t('payLater.overdue')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{t('payLater.loading')}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('payLater.table.customer')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('payLater.table.phone')}</TableHead>
                <TableHead>{t('payLater.table.amount')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('payLater.table.dueDate')}</TableHead>
                <TableHead>{t('payLater.table.status')}</TableHead>
                <TableHead>{t('payLater.table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    {showOverdue ? t('payLater.noOverdueOrders') : t('payLater.noPayLaterOrders')}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const overdue = isOverdue(order.payment_due_date) && !order.is_paid
                  return (
                    <TableRow key={order.id} className={overdue ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {order.pos_order_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {order.customer_phone}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ฿{order.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {order.payment_due_date ? (
                          <span className={overdue ? 'text-destructive font-medium' : ''}>
                            {new Date(order.payment_due_date).toLocaleDateString()}
                            {overdue && ' ' + t('payLater.overdueLabel')}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {order.is_paid ? (
                          <Badge variant="success">{t('payLater.badge.paid')}</Badge>
                        ) : overdue ? (
                          <Badge variant="destructive">{t('payLater.badge.overdue')}</Badge>
                        ) : (
                          <Badge variant="warning">{t('payLater.badge.pending')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!order.is_paid && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkPaid(order.id)}
                            className="gap-1.5"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {t('payLater.markPaid')}
                          </Button>
                        )}
                        {order.is_paid && order.paid_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.paid_at).toLocaleDateString()}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <p className="text-sm text-muted-foreground">{t('payLater.count', { count: total })}</p>
        </>
      )}
    </div>
  )
}
