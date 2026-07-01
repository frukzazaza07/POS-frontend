import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { ChecksumException, FormatException, NotFoundException } from '@zxing/library'
import { Camera, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function CameraScanner({ open, onClose, onScan }: Props) {
  const { t } = useTranslation()

  // Callback ref so the effect never restarts just because the parent re-rendered
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  onScanRef.current = onScan
  onCloseRef.current = onClose

  // Callback ref for the video element — fires only after the <video> is in the DOM,
  // unlike useRef which can be null when the Dialog is still mounting.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open || !videoEl) return

    let stream: MediaStream | null = null
    let rafId = 0
    let active = true
    const reader = new BrowserMultiFormatReader()

    setError('')
    setReady(false)

    const decode = () => {
      if (!active) return
      try {
        const result = reader.decode(videoEl)
        active = false
        onScanRef.current(result.getText())
        onCloseRef.current()
        return
      } catch (e) {
        const isRetryable =
          e instanceof NotFoundException ||
          e instanceof ChecksumException ||
          e instanceof FormatException
        if (!isRetryable) {
          active = false
          setError((e as Error).message ?? 'Decode error')
          return
        }
      }
      rafId = requestAnimationFrame(decode)
    }

    const startStream = () => {
      if (!active) return
      videoEl
        .play()
        .then(() => {
          if (active) {
            setReady(true)
            rafId = requestAnimationFrame(decode)
          }
        })
        .catch((err: Error) => {
          if (active) setError('Could not start camera: ' + err.message)
        })
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      .then((s) => {
        if (!active) { s.getTracks().forEach((track) => track.stop()); return }
        stream = s
        videoEl.srcObject = s
        if (videoEl.readyState >= 1 /* HAVE_METADATA */) {
          startStream()
        } else {
          videoEl.addEventListener('loadedmetadata', startStream, { once: true })
        }
      })
      .catch((err: Error) => {
        if (!active) return
        if (err.name === 'NotAllowedError') {
          setError(t('camera.permissionDenied'))
        } else if (err.name === 'NotFoundError') {
          setError(t('camera.noCamera'))
        } else {
          setError(err.message)
        }
      })

    return () => {
      active = false
      cancelAnimationFrame(rafId)
      videoEl.removeEventListener('loadedmetadata', startStream)
      stream?.getTracks().forEach((track) => track.stop())
      videoEl.srcObject = null
    }
  }, [open, videoEl]) // onScan / onClose intentionally omitted — handled via refs

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {t('camera.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black aspect-square w-full">
          <video
            ref={setVideoEl}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Scan frame overlay */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-44">
                {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
                  <span
                    key={corner}
                    className={[
                      'absolute w-8 h-8 border-white border-2',
                      corner === 'tl' && 'top-0 left-0 border-r-0 border-b-0 rounded-tl-sm',
                      corner === 'tr' && 'top-0 right-0 border-l-0 border-b-0 rounded-tr-sm',
                      corner === 'bl' && 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-sm',
                      corner === 'br' && 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-sm',
                    ].filter(Boolean).join(' ')}
                  />
                ))}
                {ready && (
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/80 animate-scan" />
                )}
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <p className="text-white text-sm text-center">{error}</p>
            </div>
          )}

          {/* Loading overlay */}
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <p className="text-white text-sm">{t('camera.starting')}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground text-center mb-3">
            {t('camera.pointCamera')}
          </p>
          <Button variant="outline" className="w-full" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('camera.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
