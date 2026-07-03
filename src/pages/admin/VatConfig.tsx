import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { getVatConfig, setVatConfig } from '@/services/config'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function VatConfigPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const schema = useMemo(() => z.object({
    enabled: z.boolean(),
    rate: z.coerce.number().min(0, t('validation.mustBePositive')).max(100, t('vatConfig.form.rateMax')),
    price_includes_vat: z.boolean(),
  }), [t])

  type FormValues = z.infer<typeof schema>

  const { data: config, isLoading } = useQuery({
    queryKey: ['vat-config'],
    queryFn: getVatConfig,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { enabled: false, rate: 7, price_includes_vat: true },
  })

  useEffect(() => {
    if (config) {
      reset({
        enabled: config.enabled,
        rate: config.rate,
        price_includes_vat: config.price_includes_vat,
      })
    }
  }, [config, reset])

  const enabled = watch('enabled')
  const priceIncludesVat = watch('price_includes_vat')
  const rate = watch('rate') || 0

  const onSubmit = async (values: FormValues) => {
    try {
      await setVatConfig(values)
      toast.success(t('vatConfig.toast.saved'))
      qc.invalidateQueries({ queryKey: ['vat-config'] })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t('vatConfig.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('vatConfig.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('vatConfig.loading')}</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('vatConfig.form.title')}</CardTitle>
            <CardDescription>{t('vatConfig.form.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="enabled" {...register('enabled')} className="h-4 w-4" />
                <Label htmlFor="enabled">{t('vatConfig.form.enabled')}</Label>
              </div>

              <div className="space-y-1">
                <Label>{t('vatConfig.form.rate')}</Label>
                <Input type="number" step="0.1" min={0} max={100} disabled={!enabled} {...register('rate')} />
                {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="price_includes_vat"
                  disabled={!enabled}
                  {...register('price_includes_vat')}
                  className="h-4 w-4"
                />
                <Label htmlFor="price_includes_vat">{t('vatConfig.form.priceIncludesVat')}</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {priceIncludesVat
                  ? t('vatConfig.form.priceIncludesVatHelp')
                  : t('vatConfig.form.priceExcludesVatHelp')}
              </p>

              {enabled && (
                <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/30">
                  <p className="font-medium">{t('vatConfig.preview.title')}</p>
                  {priceIncludesVat ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('vatConfig.preview.productPrice')}</span>
                        <span>฿100.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('vatConfig.preview.customerPays')}</span>
                        <span className="font-semibold">฿100.00</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('vatConfig.preview.productPrice')}</span>
                        <span>฿100.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('vatConfig.preview.vatAdded', { rate })}</span>
                        <span>฿{(100 * (rate / 100)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('vatConfig.preview.customerPays')}</span>
                        <span className="font-semibold">฿{(100 + 100 * (rate / 100)).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? t('vatConfig.form.saving') : t('vatConfig.form.save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
