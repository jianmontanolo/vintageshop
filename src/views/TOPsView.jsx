import { useEffect, useRef, useState } from 'react'
import {
  collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, query, where, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useHistory } from '../hooks/useHistory'

// ─── Color dot ────────────────────────────────────────────────
const COLOR_MAP = {
  'rojo': '#ef4444', 'roja': '#ef4444', 'azul': '#3b82f6', 'verde': '#22c55e',
  'negro': '#111827', 'negra': '#111827', 'blanco': '#e5e7eb', 'blanca': '#e5e7eb',
  'amarillo': '#eab308', 'amarilla': '#eab308', 'rosa': '#ec4899',
  'morado': '#a855f7', 'morada': '#a855f7', 'naranja': '#f97316',
  'gris': '#9ca3af', 'beige': '#d4b896', 'cafe': '#92400e', 'café': '#92400e',
  'crema': '#fef3c7', 'nude': '#d4a988', 'dorado': '#d97706', 'plateado': '#94a3b8',
}
function ColorDot({ color }) {
  const bg = COLOR_MAP[color?.toLowerCase().trim()]
  if (!bg) return null
  return <span className="inline-block w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500 mr-2 flex-shrink-0" style={{ backgroundColor: bg }} title={color} />
}

// ─── Modal ────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 animate-fade-in">
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

// ─── Main component ───────────────────────────────────────────
export default function TOPsView() {
  const user = useAuth()
  const { logHistory } = useHistory()
  const [searchParams, setSearchParams] = useSearchParams()

  const [racks, setRacks] = useState([])
  const [tops, setTops] = useState([])
  const [selectedRack, setSelectedRack] = useState(searchParams.get('rack') || '')
  const [filterEstilo, setFilterEstilo] = useState('')
  const [filterColor, setFilterColor] = useState('')

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [estilo, setEstilo] = useState('')
  const [color, setColor] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit modal
  const [editingTop, setEditingTop] = useState(null)
  const [editEstilo, setEditEstilo] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editRackId, setEditRackId] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirm
  const [confirmDeleteTop, setConfirmDeleteTop] = useState(null)

  // Seeder
  const [seeding, setSeeding] = useState(false)

  // ─── Firestore listeners ───────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bastidores'), (snap) => {
      setRacks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!selectedRack) { setTops([]); return }
    const q = query(collection(db, 'tops'), where('rackId', '==', selectedRack))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.creadoEn?.seconds ?? 0) - (a.creadoEn?.seconds ?? 0))
      setTops(data)
    })
    return unsub
  }, [selectedRack])

  // ─── Rack change ───────────────────────────────────────────
  const handleRackChange = (id) => {
    setSelectedRack(id)
    setSearchParams(id ? { rack: id } : {})
  }

  // ─── Add TOP ───────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!estilo.trim() || !color.trim() || !selectedRack) return
    setSaving(true)
    const tid = toast.loading('Guardando TOP...')
    try {
      const docRef = await addDoc(collection(db, 'tops'), {
        rackId: selectedRack,
        estilo: estilo.trim().toUpperCase(),
        color: color.trim(),
        descripcion: descripcion.trim(),
        creadoPor: user.email,
        creadoEn: serverTimestamp(),
      })
      await logHistory({ topId: docRef.id, accion: 'crear', despues: { estilo: estilo.trim().toUpperCase(), color: color.trim(), rackId: selectedRack }, usuario: user.email })
      toast.success('TOP agregado', { id: tid })
      setEstilo(''); setColor(''); setDescripcion('')
      setShowForm(false)
    } catch (err) {
      toast.error('Error: ' + err.message, { id: tid })
    } finally {
      setSaving(false)
    }
  }

  // ─── Edit TOP ──────────────────────────────────────────────
  const openEdit = (top) => {
    setEditingTop(top)
    setEditEstilo(top.estilo)
    setEditColor(top.color)
    setEditDescripcion(top.descripcion ?? '')
    setEditRackId(top.rackId)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editEstilo.trim() || !editColor.trim()) return
    setEditSaving(true)
    const tid = toast.loading('Actualizando...')
    try {
      const moved = editRackId !== editingTop.rackId
      await updateDoc(doc(db, 'tops', editingTop.id), {
        estilo: editEstilo.trim().toUpperCase(),
        color: editColor.trim(),
        descripcion: editDescripcion.trim(),
        rackId: editRackId,
        modificadoPor: user.email,
        modificadoEn: serverTimestamp(),
      })
      await logHistory({
        topId: editingTop.id,
        accion: moved ? 'mover' : 'editar',
        antes: { estilo: editingTop.estilo, color: editingTop.color, rackId: editingTop.rackId },
        despues: { estilo: editEstilo.trim().toUpperCase(), color: editColor.trim(), rackId: editRackId },
        usuario: user.email,
      })
      toast.success(moved ? 'TOP movido correctamente' : 'TOP actualizado', { id: tid })
      setEditingTop(null)
    } catch (err) {
      toast.error('Error: ' + err.message, { id: tid })
    } finally {
      setEditSaving(false)
    }
  }

  // ─── Delete TOP ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDeleteTop) return
    const tid = toast.loading('Eliminando...')
    try {
      await logHistory({ topId: confirmDeleteTop.id, accion: 'eliminar', antes: { estilo: confirmDeleteTop.estilo, color: confirmDeleteTop.color, rackId: confirmDeleteTop.rackId }, usuario: user.email })
      await deleteDoc(doc(db, 'tops', confirmDeleteTop.id))
      toast.success('TOP eliminado', { id: tid })
    } catch (err) {
      toast.error('Error: ' + err.message, { id: tid })
    }
    setConfirmDeleteTop(null)
  }

  // ─── Export CSV ────────────────────────────────────────────
  const handleExportCSV = () => {
    const rackName = racks.find(r => r.id === selectedRack)?.nombre ?? selectedRack
    const headers = ['Estilo', 'Color', 'Descripción', 'Rack', 'Fecha', 'Registrado por']
    const rows = filtered.map(t => [
      t.estilo, t.color, t.descripcion || '',
      rackName, formatDate(t.creadoEn), t.creadoPor
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tops-${rackName}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado')
  }

  // ─── Seed ─────────────────────────────────────────────────
  const SEED_TOPS = [
    { estilo: 'BL-2024-001', color: 'Blanco', descripcion: 'Blusa básica manga larga' },
    { estilo: 'BL-2024-002', color: 'Negro', descripcion: 'Blusa cuello V' },
    { estilo: 'BL-2024-003', color: 'Rojo', descripcion: 'Blusa con lazo' },
    { estilo: 'BL-2024-004', color: 'Azul', descripcion: 'Blusa estampado floral' },
    { estilo: 'BL-2024-005', color: 'Rosa', descripcion: 'Blusa sin mangas' },
    { estilo: 'VESTIDO-001', color: 'Negro', descripcion: 'Vestido midi formal' },
    { estilo: 'VESTIDO-002', color: 'Rojo', descripcion: 'Vestido cocktail' },
    { estilo: 'VESTIDO-003', color: 'Beige', descripcion: 'Vestido casual lino' },
    { estilo: 'VESTIDO-004', color: 'Azul', descripcion: 'Vestido wrap denim' },
    { estilo: 'VESTIDO-005', color: 'Verde', descripcion: 'Vestido maxi estampado' },
    { estilo: 'TOP-001', color: 'Blanco', descripcion: 'Top crop básico' },
    { estilo: 'TOP-002', color: 'Negro', descripcion: 'Top halter' },
    { estilo: 'TOP-003', color: 'Nude', descripcion: 'Top corset' },
    { estilo: 'TOP-004', color: 'Rosa', descripcion: 'Top manga globo' },
    { estilo: 'TOP-005', color: 'Morado', descripcion: 'Top drapeado' },
    { estilo: 'CAMISA-001', color: 'Blanco', descripcion: 'Camisa oversize' },
    { estilo: 'CAMISA-002', color: 'Azul', descripcion: 'Camisa de cuadros' },
    { estilo: 'CAMISA-003', color: 'Negro', descripcion: 'Camisa manga corta' },
    { estilo: 'CAMISA-004', color: 'Beige', descripcion: 'Camisa lino casual' },
    { estilo: 'CAMISA-005', color: 'Verde', descripcion: 'Camisa estampado tropical' },
    { estilo: 'FALDA-001', color: 'Negro', descripcion: 'Falda lápiz' },
    { estilo: 'FALDA-002', color: 'Beige', descripcion: 'Falda midi plisada' },
    { estilo: 'FALDA-003', color: 'Rojo', descripcion: 'Falda vuelo floral' },
    { estilo: 'FALDA-004', color: 'Azul', descripcion: 'Falda denim mini' },
    { estilo: 'FALDA-005', color: 'Verde', descripcion: 'Falda satinada midi' },
    { estilo: 'PANTALON-001', color: 'Negro', descripcion: 'Pantalón palazzo' },
    { estilo: 'PANTALON-002', color: 'Beige', descripcion: 'Pantalón lino ancho' },
    { estilo: 'PANTALON-003', color: 'Azul', descripcion: 'Pantalón recto denim' },
    { estilo: 'PANTALON-004', color: 'Gris', descripcion: 'Pantalón pinzas oficina' },
    { estilo: 'PANTALON-005', color: 'Blanco', descripcion: 'Pantalón cropped' },
    { estilo: 'CONJUNTO-001', color: 'Negro', descripcion: 'Set top + falda' },
    { estilo: 'CONJUNTO-002', color: 'Beige', descripcion: 'Set blusa + pantalón' },
    { estilo: 'CONJUNTO-003', color: 'Azul', descripcion: 'Set crop + shorts' },
    { estilo: 'CONJUNTO-004', color: 'Rosa', descripcion: 'Set coordinado pastel' },
    { estilo: 'CONJUNTO-005', color: 'Verde', descripcion: 'Set lino verano' },
    { estilo: 'JUMPSUIT-001', color: 'Negro', descripcion: 'Jumpsuit manga corta' },
    { estilo: 'JUMPSUIT-002', color: 'Beige', descripcion: 'Jumpsuit lino formal' },
    { estilo: 'JUMPSUIT-003', color: 'Azul', descripcion: 'Jumpsuit denim' },
    { estilo: 'JUMPSUIT-004', color: 'Blanco', descripcion: 'Jumpsuit verano' },
    { estilo: 'JUMPSUIT-005', color: 'Rojo', descripcion: 'Jumpsuit noche' },
    { estilo: 'CARDIGAN-001', color: 'Beige', descripcion: 'Cardigan oversize tejido' },
    { estilo: 'CARDIGAN-002', color: 'Gris', descripcion: 'Cardigan básico fino' },
    { estilo: 'CARDIGAN-003', color: 'Negro', descripcion: 'Cardigan largo' },
    { estilo: 'BLAZER-001', color: 'Negro', descripcion: 'Blazer entallado' },
    { estilo: 'BLAZER-002', color: 'Beige', descripcion: 'Blazer oversize' },
    { estilo: 'BLAZER-003', color: 'Azul', descripcion: 'Blazer structured' },
    { estilo: 'SHORTS-001', color: 'Negro', descripcion: 'Shorts tiro alto' },
    { estilo: 'SHORTS-002', color: 'Beige', descripcion: 'Shorts lino' },
    { estilo: 'SHORTS-003', color: 'Azul', descripcion: 'Shorts denim' },
    { estilo: 'SHORTS-004', color: 'Blanco', descripcion: 'Shorts casual' },
  ]

  const handleSeed = async () => {
    if (!selectedRack) return
    setSeeding(true)
    const tid = toast.loading('Cargando 50 TOPs de prueba...')
    try {
      for (const item of SEED_TOPS) {
        await addDoc(collection(db, 'tops'), { rackId: selectedRack, ...item, fotoUrl: null, creadoPor: user.email, creadoEn: serverTimestamp() })
      }
      toast.success('50 TOPs de prueba cargados', { id: tid })
    } catch (err) {
      toast.error('Error: ' + err.message, { id: tid })
    } finally {
      setSeeding(false)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────
  const formatDate = (ts) => {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const filtered = tops.filter(t =>
    t.estilo?.toLowerCase().includes(filterEstilo.toLowerCase()) &&
    t.color?.toLowerCase().includes(filterColor.toLowerCase())
  )

  const selectedRackName = racks.find(r => r.id === selectedRack)?.nombre

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">TOPs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Registro de muestras por rack</p>
        </div>
        {selectedRack && (
          <div className="flex items-center gap-2 flex-wrap">
            {filtered.length > 0 && (
              <button onClick={handleExportCSV} className="btn-secondary text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                CSV
              </button>
            )}
            <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Agregar TOP
            </button>
          </div>
        )}
      </div>

      {/* Rack selector */}
      <div className="card p-4 mb-4">
        <label className="label">Seleccionar Rack</label>
        <select className="input" value={selectedRack} onChange={e => handleRackChange(e.target.value)}>
          <option value="">— Selecciona un rack —</option>
          {racks.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>

      {/* Add form */}
      {showForm && selectedRack && (
        <div className="card p-5 mb-4 border-brand border">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Agregar TOP a {selectedRackName}</h3>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Estilo <span className="text-red-400">*</span></label>
                <input className="input" placeholder='"BL-2024"' value={estilo} onChange={e => setEstilo(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="label">Color <span className="text-red-400">*</span></label>
                <input className="input" placeholder='"Rojo"' value={color} onChange={e => setColor(e.target.value)} required />
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea className="input resize-none" rows={2} placeholder="Notas..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Registrado por: <strong className="text-gray-600 dark:text-gray-300">{user?.email}</strong></p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar TOP'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      {selectedRack && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input className="input flex-1" placeholder="Filtrar por Estilo..." value={filterEstilo} onChange={e => setFilterEstilo(e.target.value)} />
          <input className="input flex-1" placeholder="Filtrar por Color..." value={filterColor} onChange={e => setFilterColor(e.target.value)} />
        </div>
      )}

      {/* Table */}
      {selectedRack ? (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{selectedRackName} — {filtered.length} TOPs</h2>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
              {tops.length === 0 ? 'No hay TOPs en este rack aún.' : 'Sin resultados para ese filtro.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr>
                    <th className="table-th">Estilo</th>
                    <th className="table-th">Color</th>
                    <th className="table-th">Descripción</th>
                    <th className="table-th">Fecha</th>
                    <th className="table-th">Registrado por</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(top => (
                    <tr key={top.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-td font-medium text-gray-900 dark:text-white">{top.estilo}</td>
                      <td className="table-td">
                        <span className="flex items-center"><ColorDot color={top.color} />{top.color}</span>
                      </td>
                      <td className="table-td text-gray-500 dark:text-gray-400 max-w-[180px] truncate">{top.descripcion || '—'}</td>
                      <td className="table-td text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(top.creadoEn)}</td>
                      <td className="table-td text-gray-500 dark:text-gray-400 text-xs truncate max-w-[130px]">{top.creadoPor}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(top)} className="text-xs text-brand hover:underline font-medium">Editar</button>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <button onClick={() => setConfirmDeleteTop(top)} className="btn-danger text-xs px-2 py-1">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400 dark:text-gray-500 text-sm">
          Selecciona un rack para ver sus TOPs
        </div>
      )}

      {/* ── Edit modal ───────────────────────────── */}
      {editingTop && (
        <Modal title="Editar TOP" onClose={() => setEditingTop(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Estilo <span className="text-red-400">*</span></label>
                <input className="input" value={editEstilo} onChange={e => setEditEstilo(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="label">Color <span className="text-red-400">*</span></label>
                <input className="input" value={editColor} onChange={e => setEditColor(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input resize-none" rows={2} value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} />
            </div>
            <div>
              <label className="label">Mover a Rack</label>
              <select className="input" value={editRackId} onChange={e => setEditRackId(e.target.value)}>
                {racks.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            {editRackId !== editingTop.rackId && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                Este TOP se moverá a <strong>{racks.find(r => r.id === editRackId)?.nombre}</strong>
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditingTop(null)} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={editSaving} className="btn-primary flex-1">{editSaving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete confirm ───────────────────────── */}
      {confirmDeleteTop && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="card w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">¿Eliminar TOP?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Se eliminará <span className="font-semibold text-gray-700 dark:text-gray-200">{confirmDeleteTop.estilo}</span> permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteTop(null)} className="btn-secondary flex-1 py-2.5">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
