import { useState, useMemo } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useProducts } from '@/hooks/useProducts'
import { createProduct, updateProduct, deleteProduct } from '@/services/products'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import type { POSProduct } from '@/types/api'

function ProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  product: POSProduct | null
  onSuccess: () => void
}) {
  const { t } = useTranslation()

  const schema = useMemo(() => z.object({
    pos_product_id: z.string().min(1, t('validation.required')),
    name: z.string().min(1, t('validation.required')),
    description: z.string().optional(),
    price: z.coerce.number().positive(t('validation.mustBePositive')),
    category: z.string().optional(),
    is_active: z.boolean().optional(),
  }), [t])

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: product
      ? {
          pos_product_id: product.pos_product_id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          is_active: product.is_active,
        }
      : { pos_product_id: '', name: '', description: '', price: 0, category: '', is_active: true },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      if (product) {
        await updateProduct(product.id, values)
        toast.success(t('products.toast.updated'))
      } else {
        await createProduct(values)
        toast.success(t('products.toast.created'))
      }
      onSuccess()
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? t('products.editProduct') : t('products.addProduct')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('products.form.posProductId')}</Label>
              <Input
                placeholder="pos-latte"
                {...register('pos_product_id')}
                disabled={!!product}
              />
              {errors.pos_product_id && (
                <p className="text-xs text-destructive">{errors.pos_product_id.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{t('products.form.price')}</Label>
              <Input type="number" step="0.01" placeholder="65.00" {...register('price')} />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('products.form.name')}</Label>
            <Input placeholder="Cafe Latte" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('products.form.category')}</Label>
              <Input placeholder="beverages" {...register('category')} />
            </div>
            <div className="space-y-1">
              <Label>{t('products.form.description')}</Label>
              <Input placeholder="Optional" {...register('description')} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register('is_active')} className="h-4 w-4" />
            <Label htmlFor="is_active">{t('products.form.active')}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('products.form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('products.form.saving') : t('products.form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<POSProduct | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useProducts(search, page)
  const products = data?.items ?? []
  const total = data?.total ?? 0

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (p: POSProduct) => {
    setEditTarget(p)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('products.confirm.delete'))) return
    try {
      await deleteProduct(id)
      toast.success(t('products.toast.deleted'))
      qc.invalidateQueries({ queryKey: ['products'] })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const onSuccess = () => {
    setDialogOpen(false)
    qc.invalidateQueries({ queryKey: ['products'] })
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">{t('products.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('products.addProduct')}
        </Button>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder={t('products.searchPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{t('products.loading')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('products.table.name')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('products.table.posId')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('products.table.category')}</TableHead>
              <TableHead>{t('products.table.price')}</TableHead>
              <TableHead>{t('products.table.status')}</TableHead>
              <TableHead className="w-20">{t('products.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {t('products.noProductsFound')}
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                    {p.pos_product_id}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell capitalize">{p.category}</TableCell>
                  <TableCell>฿{p.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? 'success' : 'secondary'}>
                      {p.is_active ? t('products.badge.active') : t('products.badge.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <span>{t('products.count', { count: total })}</span>
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

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editTarget}
        onSuccess={onSuccess}
      />
    </div>
  )
}
