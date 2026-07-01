import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { getBankQRConfig, setBankQRConfig, fetchQRCodeBlob } from '@/services/config'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BankQRConfigPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [previewQrUrl, setPreviewQrUrl] = useState('')

  const schema = useMemo(() => z.object({
    bank_name: z.string().min(1, t('validation.required')),
    account_name: z.string().min(1, t('validation.required')),
    account_number: z.string().min(1, t('validation.required')),
    promptpay_id: z
      .string()
      .regex(/^(\d{10}|\d{13})$/, t('validation.invalidPromptpay'))
      .or(z.literal('')),
    qr_image_url: z.string().url(t('validation.invalidUrl')).or(z.literal('')),
  }), [t])

  type FormValues = z.infer<typeof schema>

  const { data: config, isLoading } = useQuery({
    queryKey: ['bank-qr-config'],
    queryFn: getBankQRConfig,
    retry: false,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bank_name: '',
      account_name: '',
      account_number: '',
      promptpay_id: '',
      qr_image_url: '',
    },
  })

  useEffect(() => {
    if (config) {
      reset({
        bank_name: config.bank_name,
        account_name: config.account_name,
        account_number: config.account_number,
        promptpay_id: config.promptpay_id ?? '',
        qr_image_url: config.qr_image_url ?? '',
      })
    }
  }, [config, reset])

  useEffect(() => {
    if (!config) { setPreviewQrUrl(''); return }
    let objectUrl = ''
    fetchQRCodeBlob()
      .then((url) => { objectUrl = url; setPreviewQrUrl(url) })
      .catch(() => setPreviewQrUrl(''))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [config?.id])

  const onSubmit = async (values: FormValues) => {
    try {
      await setBankQRConfig({
        bank_name: values.bank_name,
        account_name: values.account_name,
        account_number: values.account_number,
        promptpay_id: values.promptpay_id || undefined,
        qr_image_url: values.qr_image_url || undefined,
      })
      toast.success(t('bankQR.toast.saved'))
      qc.invalidateQueries({ queryKey: ['bank-qr-config'] })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t('bankQR.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('bankQR.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('bankQR.loading')}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('bankQR.form.title')}</CardTitle>
              <CardDescription>{t('bankQR.form.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1">
                  <Label>{t('bankQR.form.bankName')}</Label>
                  <Input placeholder="e.g. SCB, KBank, Krungthai" {...register('bank_name')} />
                  {errors.bank_name && (
                    <p className="text-xs text-destructive">{errors.bank_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>{t('bankQR.form.accountName')}</Label>
                  <Input placeholder="My Coffee Shop Co." {...register('account_name')} />
                  {errors.account_name && (
                    <p className="text-xs text-destructive">{errors.account_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>{t('bankQR.form.accountNumber')}</Label>
                  <Input placeholder="111-2-34567-8" {...register('account_number')} />
                  {errors.account_number && (
                    <p className="text-xs text-destructive">{errors.account_number.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>
                    {t('bankQR.form.promptpayId')}{' '}
                    <span className="text-muted-foreground">({t('bankQR.form.promptpayIdNote')})</span>
                  </Label>
                  <Input
                    placeholder="0812345678 or 1234567890123"
                    inputMode="numeric"
                    {...register('promptpay_id')}
                  />
                  {errors.promptpay_id && (
                    <p className="text-xs text-destructive">{errors.promptpay_id.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{t('bankQR.form.promptpayIdHelp')}</p>
                </div>
                <div className="space-y-1">
                  <Label>
                    {t('bankQR.form.qrImageUrl')}{' '}
                    <span className="text-muted-foreground">({t('bankQR.form.qrImageUrlNote')})</span>
                  </Label>
                  <Input placeholder="https://example.com/qr.png" {...register('qr_image_url')} />
                  {errors.qr_image_url && (
                    <p className="text-xs text-destructive">{errors.qr_image_url.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
                  {isSubmitting
                    ? t('bankQR.form.saving')
                    : config
                    ? t('bankQR.form.update')
                    : t('bankQR.form.save')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {t('bankQR.preview.title')}
                {config?.is_active && <Badge variant="success">Active</Badge>}
              </CardTitle>
              <CardDescription>{t('bankQR.preview.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="mx-auto w-40 h-40 flex items-center justify-center rounded border bg-white p-1">
                {previewQrUrl ? (
                  <img
                    src={previewQrUrl}
                    alt="PromptPay QR Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center px-2">
                    {config
                      ? t('bankQR.preview.setPromptpay')
                      : t('bankQR.preview.notConfigured')}
                  </p>
                )}
              </div>
              {config ? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('bankQR.detail.bank')}</span>
                    <span className="font-medium">{config.bank_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('bankQR.detail.account')}</span>
                    <span className="font-medium">{config.account_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('bankQR.detail.number')}</span>
                    <span className="font-medium font-mono">{config.account_number || '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground">{t('bankQR.preview.notConfigured')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
