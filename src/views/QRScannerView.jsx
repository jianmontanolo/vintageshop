import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useLanguage } from '../context/LanguageContext'

export default function QRScannerView() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const scannerRef = useRef(null)
  const [status, setStatus] = useState('idle')
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
        const match = decodedText.match(/\/rack\/([^/?#\s]+)/)
        if (match) {
          setTimeout(() => navigate(`/rack/${match[1]}`), 800)
        }
      },
      () => {}
    )
    scannerRef.current = scanner
    setStatus('scanning')

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [navigate])

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('scanner', 'title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('scanner', 'subtitle')}</p>
      </div>

      {status === 'found' ? (
        <div className="card p-8 text-center animate-slide-up">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('scanner', 'detected')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 break-all">{result}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{t('scanner', 'opening')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-slide-up delay-50">
          <div
            id="qr-reader"
            className="[&_video]:rounded-none [&_select]:input [&_select]:mb-2 [&_button]:btn-primary [&_button]:w-full [&_button]:mt-2"
          />
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4 animate-fade-in delay-200">
        {t('scanner', 'onlyApp')}
      </p>
    </div>
  )
}
