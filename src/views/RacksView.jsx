import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function RacksView() {
  const user = useAuth()
  const navigate = useNavigate()
  const [racks, setRacks] = useState([])
  const [topCounts, setTopCounts] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bastidores'), (snap) => {
      setRacks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tops'), (snap) => {
      const counts = {}
      snap.docs.forEach(d => {
        const rid = d.data().rackId
        counts[rid] = (counts[rid] || 0) + 1
      })
      setTopCounts(counts)
    })
    return unsub
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'bastidores'), {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        creadoPor: user.uid,
        creadoEn: serverTimestamp(),
      })
      toast.success(`Rack "${nombre.trim()}" creado`)
      setNombre(''); setDescripcion(''); setShowModal(false)
    } catch (err) {
      toast.error('Error al crear rack: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rack) => {
    try {
      await deleteDoc(doc(db, 'bastidores', rack.id))
      toast.success(`Rack "${rack.nombre}" eliminado`)
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
    setConfirmDelete(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Racks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administra los racks físicos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Rack
        </button>
      </div>

      {racks.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 dark:text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm">No hay racks. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {racks.map(rack => (
            <div key={rack.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-brand bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
                  {topCounts[rack.id] ?? 0} TOPs
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mt-2">{rack.nombre}</h3>
              {rack.descripcion && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{rack.descripcion}</p>}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap">
                <button onClick={() => navigate(`/tops?rack=${rack.id}`)} className="btn-secondary text-xs px-3 py-1.5">Ver TOPs</button>
                <button onClick={() => navigate(`/imprimir-qr?rack=${rack.id}`)} className="btn-secondary text-xs px-3 py-1.5">Generar QR</button>
                {rack.creadoPor === user?.uid && (
                  <button onClick={() => setConfirmDelete(rack)} className="ml-auto btn-danger text-xs px-3 py-1.5">Eliminar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nuevo Rack" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Nombre del rack <span className="text-red-400">*</span></label>
              <input className="input" placeholder='"Rack A", "Rack 12"' value={nombre} onChange={e => setNombre(e.target.value)} autoFocus required />
            </div>
            <div>
              <label className="label">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className="input" placeholder="Descripción corta" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Crear Rack'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Eliminar Rack" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            ¿Eliminar el rack <strong className="text-gray-900 dark:text-white">{confirmDelete.nombre}</strong>? Los TOPs no se eliminarán automáticamente.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
