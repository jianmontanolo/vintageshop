import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function QRScannerView() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | scanning | found | error
  const [result, setResult] = useState('')

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false
    )

    scanner.render(
      (decodedText) => {
        setResult(decodedText)
        setStatus('found')
        scanner.clear().catch(() => {})
        // Try to extract rackId from URL pattern
        const match = decodedText.match(/\/rack\/([^/?#\s]+)/)
        if (match) {
          setTimeout(() => navigate(`/rack/${match[1]}`), 800)
        }
      },
      () => {
        // frame errors are normal, ignore
      }
    )
    scannerRef.current = scanner
    setStatus('scanning')

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [navigate])

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Escanear QR</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Apunta la cámara al código QR de un rack para abrirlo
        </p>
      </div>

      {status === 'found' ? (
        <div className="card p-8 text-center animate-slide-up">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 dark:text-white mb-1">¡QR detectado!</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 break-all">{result}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Abriendo rack...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div
            id="qr-reader"
            className="[&_video]:rounded-none [&_select]:input [&_select]:mb-2 [&_button]:btn-primary [&_button]:w-full [&_button]:mt-2"
          />
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
        Solo funciona con QRs generados por esta app
      </p>
    </div>
  )
}
