import { motion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'

const RECOVERIES = [
  { gds: 'Amadeus BSP', route: 'JFK → LHR', amount: '+$3,240', status: 'recovered' },
  { gds: 'Sabre', route: 'LAX → CDG', amount: '+$1,820', status: 'recovered' },
  { gds: 'Galileo', route: 'ORD → FRA', amount: '+$950', status: 'pending' },
  { gds: 'Worldspan', route: 'MIA → NRT', amount: '+$2,180', status: 'recovered' },
]

const MINI_STATS = [
  { label: 'Discrepancies', value: '127' },
  { label: 'Disputes won', value: '94%' },
  { label: 'Active GDS', value: '4' },
]

export default function HeroMockup() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto lg:mx-0">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-gradient-to-r from-indigo-600/25 to-purple-600/20 blur-3xl" />

      {/* Main dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative rounded-2xl border border-white/10 bg-[#0D0F1E]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
          <span className="w-3 h-3 rounded-full bg-white/10" />
          <span className="w-3 h-3 rounded-full bg-white/10" />
          <span className="w-3 h-3 rounded-full bg-white/10" />
          <span className="ml-3 text-xs text-slate-500 font-mono">SyncRevenue — Commission Recovery</span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        <div className="p-5">
          {/* Header stat */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-1">Recovered this month</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white tracking-tight">$24,500</span>
                <span className="mb-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  ↑ 18%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-indigo-400" aria-hidden>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {MINI_STATS.map(s => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-center">
                <p className="text-base font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sparkline bar chart */}
          <div className="mb-5">
            <div className="flex items-end gap-1 h-12">
              {[40, 65, 45, 80, 55, 90, 70, 100, 75, 95, 85, 110].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.05 * i + 0.4, duration: 0.4, ease: 'easeOut' }}
                  style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                  className={`flex-1 rounded-t-sm ${i === 11 ? 'bg-indigo-400' : 'bg-indigo-500/30'}`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5">Last 12 months · commission recoveries</p>
          </div>

          {/* Recent recoveries list */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">Recent Recoveries</p>
            <div className="flex flex-col gap-2">
              {RECOVERIES.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.025] px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.status === 'recovered' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-[12px] font-semibold text-white leading-tight">{r.gds}</p>
                      <p className="text-[10px] text-slate-500">{r.route}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-emerald-400">{r.amount}</p>
                    <p className={`text-[10px] ${r.status === 'recovered' ? 'text-slate-600' : 'text-amber-500'}`}>
                      {r.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badge — top right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="absolute -top-4 -right-4 bg-[#1A1C2E] border border-white/10 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2.5"
      >
        <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-white">BSP Sync</p>
          <p className="text-[10px] text-slate-500">Active · 4 GDS</p>
        </div>
      </motion.div>

      {/* Floating badge — bottom left */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-4 -left-4 bg-[#1A1C2E] border border-white/10 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2.5"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-400" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white">Reconciliation complete</p>
          <p className="text-[10px] text-slate-500">127 discrepancies resolved</p>
        </div>
      </motion.div>
    </div>
  )
}
