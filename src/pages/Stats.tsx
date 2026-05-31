import { BarChart2, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getAdminTickets } from '../api/adminApi'
import { getApiErrorMessage } from '../api/axiosClient'
import { getTickets } from '../api/ticketsApi'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import type { Ticket } from '../types/ticket'
import { formatCurrency } from '../utils/tickets'

// ─── Helpers ────────────────────────────────────────────────

async function fetchAllTickets(signal?: AbortSignal, isAdmin = false) {
  const apiCall = isAdmin ? getAdminTickets : getTickets
  
  if (!isAdmin) {
    // Non-admin: load user tickets only
    const firstPage = await apiCall({ page: 1, pageSize: 100 }, { signal })
    const totalPages = firstPage.meta?.totalPages ?? 1
    const tickets = [...firstPage.data]
    for (let page = 2; page <= totalPages; page++) {
      const next = await apiCall({ page, pageSize: 100 }, { signal })
      tickets.push(...next.data)
    }
    return tickets
  }

  // Admin: load 2000 records in parallel
  const pageRequests = []
  for (let page = 1; page <= 20; page++) {
    pageRequests.push(apiCall({ page, pageSize: 100 }, { signal }))
  }
  
  const results = await Promise.all(pageRequests)
  const tickets: typeof results[0]['data'] = []
  for (const result of results) {
    tickets.push(...result.data)
  }
  
  return tickets.slice(0, 2000)
}

// ─── Bar Chart ───────────────────────────────────────────────

type BarDatum = { label: string; value: number; color: string }

function BarChart({ data }: { data: BarDatum[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="chart-bar-row">
      {data.map((d) => (
        <div key={d.label} className="chart-bar-item">
          <div className="chart-bar-label">
            <span>{d.label}</span>
            <span>{d.value}</span>
          </div>
          <div className="chart-bar-track">
            <div
              className="chart-bar-fill"
              style={{
                width: `${(d.value / maxValue) * 100}%`,
                background: d.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Donut Chart ─────────────────────────────────────────────

type DonutDatum = { label: string; value: number; color: string }

function DonutChart({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = 64
  const cx = 80
  const cy = 80
  const strokeWidth = 20

  let cumulative = 0
  const slices = data.map((d) => {
    const pct = total > 0 ? d.value / total : 0
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2
    const endAngle = (cumulative + pct) * 2 * Math.PI - Math.PI / 2
    cumulative += pct

    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)
    const largeArc = pct > 0.5 ? 1 : 0

    return {
      ...d,
      pct,
      path: pct === 0 || pct >= 1
        ? ''
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      full: pct >= 1,
    }
  })

  return (
    <div className="donut-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        ) : slices.map((s) =>
          s.full ? (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
            />
          ) : s.pct > 0 ? (
            <path
              key={s.label}
              d={s.path}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          ) : null,
        )}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="900" fill="var(--color-text-strong)">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">
          boletas
        </text>
      </svg>

      <div className="donut-legend">
        {data.map((d) => (
          <div key={d.label} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: d.color }} />
            <span>{d.label}</span>
            <span className="donut-legend-pct">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Area/Line Chart ─────────────────────────────────────────

type TimePoint = { month: string; pendiente: number; ganado: number; perdido: number }

function AreaChart({ data }: { data: TimePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(500)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const height = 140
  const paddingX = 40
  const paddingY = 16
  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  const maxVal = Math.max(...data.flatMap((d) => [d.pendiente, d.ganado, d.perdido]), 1)

  function toPath(key: keyof Omit<TimePoint, 'month'>, fill = false) {
    if (data.length === 0) return ''
    const points = data.map((d, i) => {
      const x = paddingX + (i / Math.max(data.length - 1, 1)) * chartW
      const y = paddingY + chartH - (d[key] / maxVal) * chartH
      return `${x},${y}`
    })
    const line = `M ${points.join(' L ')}`
    if (!fill) return line
    const last = data[data.length - 1]
    const first = data[0]
    const lastX = paddingX + ((data.length - 1) / Math.max(data.length - 1, 1)) * chartW
    const firstX = paddingX
    return `${line} L ${lastX},${paddingY + chartH} L ${firstX},${paddingY + chartH} Z`
  }

  const series: { key: keyof Omit<TimePoint, 'month'>; color: string; fillOpacity: number }[] = [
    { key: 'pendiente', color: '#f59e0b', fillOpacity: 0.1 },
    { key: 'ganado', color: '#10b981', fillOpacity: 0.12 },
    { key: 'perdido', color: '#ef4444', fillOpacity: 0.1 },
  ]

  return (
    <div ref={containerRef} className="area-chart-wrap">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = paddingY + chartH * (1 - pct)
          return (
            <line
              key={pct}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--color-border-light)"
              strokeWidth="1"
            />
          )
        })}

        {/* Areas */}
        {series.map((s) => (
          <path
            key={`fill-${s.key}`}
            d={toPath(s.key, true)}
            fill={s.color}
            fillOpacity={s.fillOpacity}
            stroke="none"
          />
        ))}

        {/* Lines */}
        {series.map((s) => (
          <path
            key={`line-${s.key}`}
            d={toPath(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = paddingX + (i / Math.max(data.length - 1, 1)) * chartW
          return (
            <text
              key={d.month}
              x={x}
              y={height - 2}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-text-muted)"
            >
              {d.month}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
        {series.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color, display: 'inline-block' }} />
            {s.key.charAt(0).toUpperCase() + s.key.slice(1)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Win Rate Gauge ──────────────────────────────────────────

function WinRateGauge({ won, total }: { won: number; total: number }) {
  const rate = total > 0 ? Math.round((won / total) * 100) : 0
  const r = 54
  const cx = 70
  const cy = 70
  const circumference = Math.PI * r // half circle
  const dashoffset = circumference - (rate / 100) * circumference

  return (
    <div className="win-rate-wrap">
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={rate >= 50 ? '#10b981' : rate >= 25 ? '#f59e0b' : '#ef4444'}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="900" fill="var(--color-text-strong)">
          {rate}%
        </text>
      </svg>
      <p className="win-rate-sub">
        {won} ganadas de {total} boletas totales
      </p>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export function Stats() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadStats(signal?: AbortSignal) {
    setIsLoading(true)
    setError(null)
    try {
      const isAdmin = user?.role === 'admin'
      const data = await fetchAllTickets(signal, isAdmin)
      if (signal?.aborted) return
      setTickets(data)
    } catch (err) {
      if (signal?.aborted) return
      setError(getApiErrorMessage(err, 'No pudimos cargar las estadísticas.'))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadStats(controller.signal)
    return () => controller.abort()
  }, [user?.role])

  const stats = useMemo(() => {
    const byStatus = [
      { label: 'Pendiente', value: tickets.filter((t) => t.status === 'Pendiente').length, color: '#f59e0b' },
      { label: 'Ganado', value: tickets.filter((t) => t.status === 'Ganado').length, color: '#10b981' },
      { label: 'Perdido', value: tickets.filter((t) => t.status === 'Perdido').length, color: '#ef4444' },
    ]

    // Count by game type
    const typeMap = new Map<string, number>()
    for (const t of tickets) {
      typeMap.set(t.gameType, (typeMap.get(t.gameType) ?? 0) + 1)
    }
    const typeColors = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb923c']
    const byType = Array.from(typeMap.entries()).map(([label, value], i) => ({
      label,
      value,
      color: typeColors[i % typeColors.length],
    }))

    // Monthly trend (last 6 months)
    const now = new Date()
    const months: TimePoint[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
      const monthTickets = tickets.filter((t) => {
        const td = new Date(t.createdAt ?? t.gameDate)
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
      })
      months.push({
        month: monthStr,
        pendiente: monthTickets.filter((t) => t.status === 'Pendiente').length,
        ganado: monthTickets.filter((t) => t.status === 'Ganado').length,
        perdido: monthTickets.filter((t) => t.status === 'Perdido').length,
      })
    }

    const wonTickets = tickets.filter((t) => t.status === 'Ganado')
    const totalAmount = tickets.reduce((s, t) => s + (t.amount ?? 0), 0)
    const wonAmount = wonTickets.reduce((s, t) => s + (t.amount ?? 0), 0)

    return { byStatus, byType, months, wonAmount, totalAmount, wonCount: wonTickets.length }
  }, [tickets])

  if (isLoading) return <Loading label="Calculando estadísticas..." />
  if (error) return <ErrorMessage message={error} onRetry={loadStats} />

  return (
    <main className="page-shell">
      <section className="page-header dashboard-hero">
        <div>
          <span className="section-kicker">Análisis</span>
          <h1>Estadísticas</h1>
          <p>
            Visualiza el rendimiento de tus boletas: distribución por estado, tipos de juego,
            tendencias mensuales y tu tasa de acierto.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span className="amount-badge">
            <TrendingUp size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {formatCurrency(stats.wonAmount)} ganados
          </span>
          <span className="amount-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#d9e9ff' }}>
            {formatCurrency(stats.totalAmount)} en juego total
          </span>
        </div>
      </section>

      <div className="stats-page-grid">
        {/* Bar Chart – Por estado */}
        <div className="chart-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BarChart2 size={18} color="var(--color-brand)" />
            <h3>Distribución por estado</h3>
          </div>
          <p>Cantidad de boletas según su resultado actual.</p>
          <BarChart data={stats.byStatus} />
        </div>

        {/* Donut – Por tipo de juego */}
        <div className="chart-panel">
          <h3>Tipos de juego</h3>
          <p>Reparto de tus boletas entre Lotería, Rifa, Sorteo y más.</p>
          {stats.byType.length > 0 ? (
            <DonutChart data={stats.byType} />
          ) : (
            <p style={{ color: 'var(--color-text-muted)' }}>Sin datos suficientes.</p>
          )}
        </div>

        {/* Area Chart – Tendencia mensual */}
        <div className="chart-panel" style={{ gridColumn: '1 / -1' }}>
          <h3>Tendencia mensual (últimos 6 meses)</h3>
          <p>Evolución de boletas pendientes, ganadas y perdidas por mes.</p>
          {tickets.length > 0 ? (
            <AreaChart data={stats.months} />
          ) : (
            <p style={{ color: 'var(--color-text-muted)' }}>Sin datos suficientes.</p>
          )}
        </div>

        {/* Win Rate Gauge */}
        <div className="chart-panel">
          <h3>Tasa de acierto</h3>
          <p>Porcentaje de boletas marcadas como Ganadas sobre el total.</p>
          <WinRateGauge won={stats.wonCount} total={tickets.length} />
        </div>

        {/* Resumen numérico */}
        <div className="chart-panel">
          <h3>Resumen financiero</h3>
          <p>Montos totales involucrados en tus boletas registradas.</p>
          <div className="chart-bar-row" style={{ marginTop: '8px' }}>
            {[
              { label: 'Total invertido', value: formatCurrency(stats.totalAmount), color: '#60a5fa' },
              { label: 'Total ganado', value: formatCurrency(stats.wonAmount), color: '#10b981' },
              {
                label: 'ROI',
                value: stats.totalAmount > 0
                  ? `${(((stats.wonAmount - stats.totalAmount) / stats.totalAmount) * 100).toFixed(1)}%`
                  : '—',
                color: stats.wonAmount >= stats.totalAmount ? '#10b981' : '#ef4444',
              },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '7px', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border-light)' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', fontWeight: 700 }}>{item.label}</span>
                <strong style={{ color: item.color, fontSize: '1rem' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
