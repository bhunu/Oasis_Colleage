export default function StatCard({ label, value, icon: Icon, color, loading }) {
  const colors = {
    blue:   { icon: 'bg-[#185FA5]',  text: 'text-[#185FA5]' },
    green:  { icon: 'bg-green-500',  text: 'text-green-600' },
    purple: { icon: 'bg-purple-500', text: 'text-purple-600' },
    amber:  { icon: 'bg-amber-500',  text: 'text-amber-600' },
  }
  const c = colors[color] ?? colors.blue
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="text-white text-2xl" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        {loading
          ? <div className="h-7 w-12 bg-slate-100 animate-pulse rounded mt-1" />
          : <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        }
      </div>
    </div>
  )
}
