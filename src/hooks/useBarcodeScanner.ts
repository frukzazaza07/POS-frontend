import { useEffect, useRef } from 'react'

const MIN_BARCODE_LENGTH = 3
const INTER_KEY_TIMEOUT_MS = 100

/**
 * Captures USB barcode scanner input emitted as rapid keystrokes outside any input field.
 * When Enter is received after ≥3 chars, calls onScan with the accumulated barcode string.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void, enabled = true) {
  const bufferRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return
      }

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim()
        bufferRef.current = ''
        clearTimeout(timerRef.current)
        if (barcode.length >= MIN_BARCODE_LENGTH) onScanRef.current(barcode)
        return
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          bufferRef.current = ''
        }, INTER_KEY_TIMEOUT_MS)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timerRef.current)
    }
  }, [enabled])
}
