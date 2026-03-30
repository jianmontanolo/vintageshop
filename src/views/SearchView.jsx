import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function SearchView() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tops, setTops] = useState([])
  const [racks, setRacks] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubRacks = onSnapshot(collection(db, 'bastidores'), (snap) => {
      const map = {}
      snap.docs.forEach(d => { map[d.id] = d.data().nombre })
      setRacks(map)
    })
    const unsubTops = onSnapshot(collection(db, 'tops'), (snap) => {
      setTops(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => { unsubRacks(); unsubTops() }
  }, [])

  const filtered = query.trim().length < 1 ? [] : tops.filter(t => {
    const q = query.toLowerCase()
    return t.estilo?.toLowerCase().includes(q) || t.color?.toLowerCase().includes(q)
  })

  const formatDate = (ts) => {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Buscar TOPs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Busca en todos los racks por Estilo o Color</p>
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input className="input pl-9 text-base py-3" placeholder="Buscar por Estilo o Color..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : query.trim().length < 1 ? (
        <div className="card p-12 text-center text-gray-400 dark:text-gray-500 text-sm">
          Escribe para buscar TOPs en todos los racks
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 dark:text-gray-500 text-sm">
          Sin resultados para "<strong>{query}</strong>"
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-sm text-gray-400 dark:text-gray-500 ml-1.5">para "{query}"</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px]">
              <thead>
                <tr>
                  <th className="table-th">Estilo</th>
                  <th className="table-th">Color</th>
                  <th className="table-th">Descripción</th>
                  <th className="table-th">Rack</th>
                  <th className="table-th">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(top => (
                  <tr key={top.id} className="hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors cursor-pointer" onClick={() => navigate(`/tops?rack=${top.rackId}`)}>
                    <td className="table-td font-medium text-gray-900 dark:text-white">{top.estilo}</td>
                    <td className="table-td">{top.color}</td>
                    <td className="table-td text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{top.descripcion || '—'}</td>
                    <td className="table-td">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full">
                        {racks[top.rackId] ?? top.rackId}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(top.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
