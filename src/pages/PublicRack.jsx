import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import toast, { Toaster } from 'react-hot-toast'

export default function PublicRack() {
  const { rackId } = useParams()
  const user = useAuth()

  const [rack, setRack] = useState(null)
  const [tops, setTops] = useState([])
  const [filterEstilo, setFilterEstilo] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Add form (only for authenticated users)
  const [showAddForm, setShowAddForm] = useState(false)
  const [estilo, setEstilo] = useState('')
  const [color, setColor] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'bastidores', rackId))
      .then(d => { d.exists() ? setRack({ id: d.id, ...d.data() }) : setNotFound(true) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [rackId])

  useEffect(() => {
    const q = query(collection(db, 'tops'), where('rackId', '==', rackId))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.creadoEn?.seconds ?? 0) - (a.creadoEn?.seconds ?? 0))
      setTops(data)
    })
    return unsub
  }, [rackId])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!estilo.trim() || !color.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'tops'), {
        rackId,
        estilo: estilo.trim().toUpperCase(),
        color: color.trim(),
        descripcion: descripcion.trim(),
        fotoUrl: null,
        creadoPor: user.email,
        creadoEn: serverTimestamp(),
      })
      toast.success('TOP agregado')
      setEstilo(''); setColor(''); setDescripcion(''); setShowAddForm(false)
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (ts) => {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const filtered = tops.filter(t =>
    t.estilo?.toLowerCase().includes(filterEstilo.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-lg font-semibold text-gray-700">Rack no encontrado</h1>
        <p className="text-sm text-gray-400 mt-1">El rack solicitado no existe.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-base leading-tight truncate">{rack?.nombre}</h1>
            <p className="text-xs text-gray-400">{tops.length} TOPs registrados</p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            En vivo
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {rack?.descripcion && (
          <p className="text-sm text-gray-500 mb-5 bg-white rounded-xl border border-gray-100 px-4 py-3">{rack.descripcion}</p>
        )}

        {/* Search filter */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="input pl-9" placeholder="Filtrar por Estilo..." value={filterEstilo} onChange={e => setFilterEstilo(e.target.value)} />
        </div>

        {/* Authenticated add form */}
        {user && (
          <div className="mb-4">
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Agregar TOP a este rack
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-brand p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Agregar TOP</h3>
                <form onSubmit={handleAdd} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Estilo <span className="text-red-400">*</span></label>
                      <input className="input" placeholder="BL-2024" value={estilo} onChange={e => setEstilo(e.target.value)} required autoFocus />
                    </div>
                    <div>
                      <label className="label">Color <span className="text-red-400">*</span></label>
                      <input className="input" placeholder="Rojo" value={color} onChange={e => setColor(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input className="input" placeholder="Notas..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">Cancelar</button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TOPs list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            {tops.length === 0 ? 'No hay TOPs registrados en este rack.' : 'Sin resultados.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(top => (
              <div key={top.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{top.estilo}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{top.color}</p>
                      {top.descripcion && <p className="text-sm text-gray-400 mt-1">{top.descripcion}</p>}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatDate(top.creadoEn)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-8">TOP Inventory · {user ? `Conectado como ${user.email}` : 'Solo lectura'}</p>
      </main>
    </div>
  )
}
