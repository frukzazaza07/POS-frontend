import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getBankQRConfig, setBankQRConfig, fetchQRCodeBlob } from '@/services/config'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const schema = z.object({
  bank_name: z.string().min(1, 'Required'),
  account_name: z.string().min(1, 'Required'),
  account_number: z.string().min(1, 'Required'),
  promptpay_id: z
    .string()
    .regex(/^(\d{10}|\d{13})$/, 'Must be 10-digit phone or 13-digit national ID')
    .or(z.literal('')),
  qr_image_url: z.string().url('Must be a valid URL').or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export default function BankQRConfigPage() {
  const qc = useQueryClient()
  const [previewQrUrl, setPreviewQrUrl] = useState('')

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

  // Load the generated QR preview whenever saved config changes
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
      toast.success('Bank QR config saved')
      qc.invalidateQueries({ queryKey: ['bank-qr-config'] })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Bank QR Config</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Shown to customers after a QR Code payment order.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Store Bank Account</CardTitle>
              <CardDescription>Cashiers will see this after QR Code orders.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1">
                  <Label>Bank Name</Label>
                  <Input placeholder="e.g. SCB, KBank, Krungthai" {...register('bank_name')} />
                  {errors.bank_name && (
                    <p className="text-xs text-destructive">{errors.bank_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Account Name</Label>
                  <Input placeholder="My Coffee Shop Co." {...register('account_name')} />
                  {errors.account_name && (
                    <p className="text-xs text-destructive">{errors.account_name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Account Number</Label>
                  <Input placeholder="111-2-34567-8" {...register('account_number')} />
                  {errors.account_number && (
                    <p className="text-xs text-destructive">{errors.account_number.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>
                    PromptPay ID{' '}
                    <span className="text-muted-foreground">(required for QR generation)</span>
                  </Label>
                  <Input
                    placeholder="0812345678 or 1234567890123"
                    inputMode="numeric"
                    {...register('promptpay_id')}
                  />
                  {errors.promptpay_id && (
                    <p className="text-xs text-destructive">{errors.promptpay_id.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave blank to keep existing value.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>QR Image URL <span className="text-muted-foreground">(optional fallback)</span></Label>
                  <Input placeholder="https://example.com/qr.png" {...register('qr_image_url')} />
                  {errors.qr_image_url && (
                    <p className="text-xs text-destructive">{errors.qr_image_url.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || !isDirty}>
                  {isSubmitting ? 'Saving...' : config ? 'Update Config' : 'Save Config'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Preview
                {config?.is_active && <Badge variant="success">Active</Badge>}
              </CardTitle>
              <CardDescription>Generated PromptPay QR (static, no amount).</CardDescription>
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
                      ? 'Set PromptPay ID and save to generate QR'
                      : 'Not configured yet'}
                  </p>
                )}
              </div>
              {config ? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{config.bank_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">{config.account_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number</span>
                    <span className="font-medium font-mono">{config.account_number || '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground">Not configured yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
