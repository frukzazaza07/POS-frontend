import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  useReportSummary,
  useDailyRevenue,
  useTopProducts,
  useCategoryRevenue,
  useCashierSales,
  useOverduePayLater,
} from '@/hooks/useReports'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777']

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from: toDateInput(from), to: toDateInput(to) }
}

export default function ReportsPage() {
  const { t } = useTranslation()
  const [range, setRange] = useState(defaultDateRange)

  const params = useMemo(() => range, [range])

  const { data: summary, isLoading: summaryLoading } = useReportSummary(params)
  const { data: daily, isLoading: dailyLoading } = useDailyRevenue(params)
  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts({ ...params, limit: 10 })
  const { data: categoryRevenue, isLoading: categoryLoading } = useCategoryRevenue(params)
  const { data: cashierSales, isLoading: cashierLoading } = useCashierSales(params)
  const { data: overdue, isLoading: overdueLoading } = useOverduePayLater()

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('reports.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t('reports.from')}</Label>
            <Input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('reports.to')}</Label>
            <Input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('reports.summary.totalRevenue')}</CardDescription>
            <CardTitle className="text-2xl">
              {summaryLoading ? '—' : `฿${(summary?.total_revenue ?? 0).toFixed(2)}`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('reports.summary.orderCount')}</CardDescription>
            <CardTitle className="text-2xl">
              {summaryLoading ? '—' : summary?.order_count ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('reports.summary.avgOrderValue')}</CardDescription>
            <CardTitle className="text-2xl">
              {summaryLoading ? '—' : `฿${(summary?.avg_order_value ?? 0).toFixed(2)}`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Breakdown by status / payment method */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.byStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!summaryLoading && (summary?.by_status.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">{t('reports.noData')}</p>
            )}
            {summary?.by_status.map((row) => (
              <div key={row.status} className="flex items-center justify-between text-sm">
                <Badge variant="outline">{row.status}</Badge>
                <span className="text-muted-foreground">
                  {row.count} · ฿{row.total_amount.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.byPaymentMethod')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!summaryLoading && (summary?.by_payment_method.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">{t('reports.noData')}</p>
            )}
            {summary?.by_payment_method.map((row) => (
              <div key={row.payment_method} className="flex items-center justify-between text-sm">
                <Badge variant="outline">{row.payment_method}</Badge>
                <span className="text-muted-foreground">
                  {row.count} · ฿{row.total_amount.toFixed(2)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Daily revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('reports.dailyRevenue')}</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.loading')}</div>
          ) : !daily || daily.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(0, 10)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} />
                <Tooltip
                  labelFormatter={(d) => String(d).slice(0, 10)}
                  formatter={(value) => `฿${Number(value).toFixed(2)}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top products + category revenue */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.topProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.loading')}</div>
            ) : !topProducts || topProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="product_name"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip />
                  <Bar dataKey="total_qty" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.categoryRevenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.loading')}</div>
            ) : !categoryRevenue || categoryRevenue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryRevenue}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) => entry.category}
                  >
                    {categoryRevenue.map((entry, i) => (
                      <Cell key={entry.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashier sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('reports.cashierSales')}</CardTitle>
        </CardHeader>
        <CardContent>
          {cashierLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.loading')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.table.cashier')}</TableHead>
                  <TableHead>{t('reports.table.orders')}</TableHead>
                  <TableHead>{t('reports.table.revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!cashierSales || cashierSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                      {t('reports.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  cashierSales.map((row) => (
                    <TableRow key={row.cashier_id}>
                      <TableCell className="font-medium">{row.cashier_name}</TableCell>
                      <TableCell>{row.order_count}</TableCell>
                      <TableCell className="font-semibold">฿{row.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Overdue pay-later orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('reports.overduePayLater')}</CardTitle>
          <CardDescription>{t('reports.overduePayLaterSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {overdueLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{t('reports.loading')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.table.customer')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('reports.table.phone')}</TableHead>
                  <TableHead>{t('reports.table.amount')}</TableHead>
                  <TableHead>{t('reports.table.dueDate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!overdue || overdue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                      {t('reports.noOverdue')}
                    </TableCell>
                  </TableRow>
                ) : (
                  overdue.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{order.pos_order_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{order.customer_phone}</TableCell>
                      <TableCell className="font-semibold">฿{order.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-destructive font-medium">
                        {order.payment_due_date ? new Date(order.payment_due_date).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
