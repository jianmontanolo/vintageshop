import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const ACCION_LABELS = {
  crear: { label: 'Agregado', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  editar: { label: 'Editado', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  eliminar: { label: 'Eliminado', color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  mover: { label: 'Movido', color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
}

export default function HistoryView() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAccion, setFilterAccion] = useState('')
  const [filterUsuario, setFilterUsuario] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'historial'), orderBy('fecha', 'desc'), limit(200))
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = entries.filter(e => {
    const matchAccion = !filterAccion || e.accion === filterAccion
    const matchUsuario = !filterUsuario || e.usuario?.toLowerCase().includes(filterUsuario.toLowerCase())
    return matchAccion && matchUsuario
  })

  const formatDate = (ts) => {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Historial</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Registro de cambios en TOPs (últimas 200 acciones)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          className="input sm:max-w-[200px]"
          value={filterAccion}
          onChange={e => setFilterAccion(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          <option value="crear">Agregado</option>
          <option value="editar">Editado</option>
          <option value="eliminar">Eliminado</option>
          <option value="mover">Movido</option>
        </select>
        <input
          className="input"
          placeholder="Filtrar por usuario..."
          value={filterUsuario}
          onChange={e => setFilterUsuario(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
            Sin registros en el historial.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr>
                  <th className="table-th">Acción</th>
                  <th className="table-th">TOP</th>
                  <th className="table-th">Usuario</th>
                  <th className="table-th">Fecha</th>
                  <th className="table-th">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => {
                  const meta = ACCION_LABELS[entry.accion] ?? { label: entry.accion, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-td">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="table-td font-medium text-gray-900 dark:text-white">
                        {entry.despues?.estilo ?? entry.antes?.estilo ?? entry.topId?.slice(0, 8) ?? '—'}
                      </td>
                      <td className="table-td text-gray-500 dark:text-gray-400 text-xs truncate max-w-[150px]">
                        {entry.usuario ?? '—'}
                      </td>
                      <td className="table-td text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {formatDate(entry.fecha)}
                      </td>
                      <td className="table-td">
                        {(entry.antes || entry.despues) && (
                          <button
                            onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                            className="text-xs text-brand hover:underline"
                          >
                            {expanded === entry.id ? 'Ocultar' : 'Ver'}
                          </button>
                        )}
                        {expanded === entry.id && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            {entry.antes && (
                              <p><span className="font-semibold text-red-500">Antes:</span> {entry.antes.estilo} · {entry.antes.color} {entry.antes.rackId ? `· Rack: ${entry.antes.rackId}` : ''}</p>
                            )}
                            {entry.despues && (
                              <p><span className="font-semibold text-emerald-500">Después:</span> {entry.despues.estilo} · {entry.despues.color} {entry.despues.rackId ? `· Rack: ${entry.despues.rackId}` : ''}</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
