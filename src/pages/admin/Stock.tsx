import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'
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
  const { data: stock, isLoading, dataUpdatedAt } = useStock()
  const [syncing, setSyncing] = useState(false)
  const qc = useQueryClient()
  const admin = isAdmin()

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await syncStock()
      toast.success(`Sync complete — ${result.count} items updated`)
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
          <h1 className="text-xl sm:text-2xl font-bold">Stock</h1>
          {dataUpdatedAt > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last refreshed {new Date(dataUpdatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        {admin && (
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            <RefreshCw className={syncing ? 'animate-spin h-4 w-4' : 'h-4 w-4'} />
            {syncing ? 'Syncing...' : 'Sync Stock'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Min</TableHead>
              <TableHead className="hidden sm:table-cell">Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Synced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(stock ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No stock data
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
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : item.is_low ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
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
