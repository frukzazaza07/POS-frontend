import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { registerUser } from '@/services/auth'
import { getErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function UsersPage() {
  const { t } = useTranslation()

  const schema = useMemo(() => z.object({
    name: z.string().min(1, t('validation.required')),
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(6, t('validation.minPassword')),
    role: z.enum(['admin', 'cashier']),
  }), [t])

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'cashier' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await registerUser(values)
      toast.success(t('users.toast.created', { name: user.name }))
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('users.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.form.title')}</CardTitle>
          <CardDescription>{t('users.form.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>{t('users.form.fullName')}</Label>
              <Input placeholder="Jane Doe" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>{t('users.form.email')}</Label>
              <Input type="email" placeholder="jane@pos.local" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>{t('users.form.password')}</Label>
              <Input type="password" placeholder="Min 6 characters" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>{t('users.form.role')}</Label>
              <select
                {...register('role')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="cashier">{t('users.form.roleCashier')}</option>
                <option value="admin">{t('users.form.roleAdmin')}</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('users.form.creating') : t('users.form.createUser')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
