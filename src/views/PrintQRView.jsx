import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useSearchParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'

export default function PrintQRView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [racks, setRacks] = useState([])
  const [selectedRack, setSelectedRack] = useState(searchParams.get('rack') || '')
  const [topCount, setTopCount] = useState(0)

  const rack = racks.find(r => r.id === selectedRack)
  const qrUrl = selectedRack ? `${window.location.origin}/rack/${selectedRack}` : ''

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bastidores'), (snap) => {
      setRacks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!selectedRack) { setTopCount(0); return }
    const q = query(collection(db, 'tops'), where('rackId', '==', selectedRack))
    const unsub = onSnapshot(q, (snap) => setTopCount(snap.size))
    return unsub
  }, [selectedRack])

  const handleRackChange = (id) => {
    setSelectedRack(id)
    setSearchParams(id ? { rack: id } : {})
  }

  const handleDownload = () => {
    const canvas = document.querySelector('#print-area canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${rack?.nombre ?? selectedRack}.png`
    a.click()
  }

  const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Imprimir QR</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Genera e imprime el código QR de un rack</p>
      </div>

      <div className="card p-4 mb-6 no-print">
        <label className="label">Seleccionar Rack</label>
        <select className="input" value={selectedRack} onChange={e => handleRackChange(e.target.value)}>
          <option value="">— Selecciona un rack —</option>
          {racks.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>

      {selectedRack && rack ? (
        <>
          <div id="print-area" className="card p-8 flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">TOP Inventory</p>
            </div>

            <QRCodeCanvas value={qrUrl} size={220} level="M" marginSize={2} bgColor="#ffffff" fgColor="#1f2937" style={{ borderRadius: 8 }} />

            <div className="mt-5">
              <p className="text-2xl font-bold text-gray-900">{rack.nombre}</p>
              {rack.descripcion && <p className="text-sm text-gray-500 mt-1">{rack.descripcion}</p>}
              <p className="text-sm text-gray-500 mt-1">{topCount} TOPs registrados</p>
              <p className="text-xs text-gray-400 mt-2">{today}</p>
            </div>

            <div className="mt-4 px-3 py-1.5 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 break-all">{qrUrl}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 no-print">
            <button onClick={() => window.print()} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimir
            </button>
            <button onClick={handleDownload} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar PNG
            </button>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center text-gray-400 dark:text-gray-500 text-sm">
          Selecciona un rack para generar su QR
        </div>
      )}
    </div>
  )
}
