import api from '@/lib/api'
import type { ApiResponse, BankQRConfig, VatConfig } from '@/types/api'

export interface BankQRConfigPayload {
  bank_name: string
  account_name: string
  account_number: string
  promptpay_id?: string
  qr_image_url?: string
}

export async function getBankQRConfig(): Promise<BankQRConfig> {
  const { data } = await api.get<ApiResponse<BankQRConfig>>('/api/v1/config/bank-qr')
  return data.data!
}

export async function setBankQRConfig(body: BankQRConfigPayload): Promise<BankQRConfig> {
  const { data } = await api.put<ApiResponse<BankQRConfig>>('/api/v1/config/bank-qr', body)
  return data.data!
}

export interface VatConfigPayload {
  enabled: boolean
  rate: number
  price_includes_vat: boolean
}

export async function getVatConfig(): Promise<VatConfig> {
  const { data } = await api.get<ApiResponse<VatConfig>>('/api/v1/config/vat')
  return data.data!
}

export async function setVatConfig(body: VatConfigPayload): Promise<VatConfig> {
  const { data } = await api.put<ApiResponse<VatConfig>>('/api/v1/config/vat', body)
  return data.data!
}

// Returns a blob object URL for the PromptPay QR image.
// Pass amount to embed the exact value in the QR (Thai bank apps pre-fill it).
// Caller is responsible for revoking the URL with URL.revokeObjectURL().
export async function fetchQRCodeBlob(amount?: number): Promise<string> {
  const token = localStorage.getItem('pos_token')
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
  const qs = amount != null ? `?amount=${amount.toFixed(2)}` : ''
  const res = await fetch(`${baseUrl}/api/v1/config/bank-qr/qrcode${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('QR not available')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
