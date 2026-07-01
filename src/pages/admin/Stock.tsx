import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStock } from '@/hooks/useStock'
import { syncStock } from '@/services/stock'
import { getErrorMessage } from '@/lib/errors'
import { isAdmin } from '@/lib/auth'
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

export default function StockPage() {
  const { t } = useTranslation()
  const { data: stock, isLoading, dataUpdatedAt } = useStock()
  const [syncing, setSyncing] = useState(false)
  const qc = useQueryClient()
  const admin = isAdmin()

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await syncStock()
      toast.success(t('stock.toast.syncComplete', { count: result.count }))
      qc.invalidateQueries({ queryKey: ['stock'] })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('stock.title')}</h1>
          {dataUpdatedAt > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('stock.lastRefreshed', { time: new Date(dataUpdatedAt).toLocaleTimeString() })}
            </p>
          )}
        </div>
        {admin && (
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            <RefreshCw className={syncing ? 'animate-spin h-4 w-4' : 'h-4 w-4'} />
            {syncing ? t('stock.syncing') : t('stock.syncStock')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{t('stock.loading')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">{t('stock.table.sku')}</TableHead>
              <TableHead>{t('stock.table.name')}</TableHead>
              <TableHead className="text-right">{t('stock.table.inStock')}</TableHead>
              <TableHead className="hidden sm:table-cell text-right">{t('stock.table.min')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('stock.table.unit')}</TableHead>
              <TableHead>{t('stock.table.status')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('stock.table.synced')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(stock ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  {t('stock.noStockData')}
                </TableCell>
              </TableRow>
            ) : (
              (stock ?? []).map((item) => (
                <TableRow key={item.inventory_item_id}>
                  <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
                    {item.sku}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantity_in_stock.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
                    {item.min_quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{item.unit}</TableCell>
                  <TableCell>
                    {item.is_out ? (
                      <Badge variant="destructive">{t('stock.badge.outOfStock')}</Badge>
                    ) : item.is_low ? (
                      <Badge variant="warning">{t('stock.badge.lowStock')}</Badge>
                    ) : (
                      <Badge variant="success">{t('stock.badge.inStock')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(item.synced_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
