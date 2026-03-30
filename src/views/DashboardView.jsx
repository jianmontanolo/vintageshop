import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardView() {
  const navigate = useNavigate()
  const [racks, setRacks] = useState([])
  const [topCounts, setTopCounts] = useState({})
  const [lastAdded, setLastAdded] = useState({})
  const [todayCount, setTodayCount] = useState(0)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'racks'),
      (snap) => { setRacks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLive(true) },
      () => setLive(false)
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tops'), (snap) => {
      const counts = {}, last = {}
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      let today = 0
      snap.docs.forEach(d => {
        const { rackId, creadoEn } = d.data()
        counts[rackId] = (counts[rackId] || 0) + 1
        const ts = creadoEn?.toDate?.()
        if (ts) {
          if (!last[rackId] || ts > last[rackId]) last[rackId] = ts
          if (ts >= todayStart) today++
        }
      })
      setTopCounts(counts); setLastAdded(last); setTodayCount(today)
    })
    return unsub
  }, [])

  const totalTops = Object.values(topCounts).reduce((a, b) => a + b, 0)

  const formatDate = (d) => {
    if (!d) return '—'
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Resumen general del inventario</p>
        </div>
        {live && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            En vivo
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total de Racks" value={racks.length} color="bg-brand-50 dark:bg-brand-900/30"
          icon={<svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
        <StatCard label="Total de TOPs registrados" value={totalTops} color="bg-violet-50 dark:bg-violet-900/30"
          icon={<svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard label="TOPs agregados hoy" value={todayCount} color="bg-emerald-50 dark:bg-emerald-900/30"
          icon={<svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
        />
      </div>

      {/* Racks table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Todos los Racks</h2>
        </div>
        {racks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
            No hay racks.{' '}
            <button onClick={() => navigate('/racks')} className="text-brand hover:underline">Crear el primero</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr>
                  <th className="table-th">Rack</th>
                  <th className="table-th"># TOPs</th>
                  <th className="table-th">Último registro</th>
                  <th className="table-th">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {racks.map(rack => (
                  <tr key={rack.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="table-td font-medium text-gray-900 dark:text-white">{rack.nombre}</td>
                    <td className="table-td">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand text-xs font-semibold">
                        {topCounts[rack.id] ?? 0}
                      </span>
                    </td>
                    <td className="table-td text-gray-500 dark:text-gray-400">{formatDate(lastAdded[rack.id])}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/tops?rack=${rack.id}`)} className="text-brand text-xs font-medium hover:underline">Ver</button>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <button onClick={() => navigate(`/imprimir-qr?rack=${rack.id}`)} className="text-gray-500 dark:text-gray-400 text-xs hover:text-brand hover:underline">QR</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
