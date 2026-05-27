export default function StatCard({ label, value, icon: Icon, color, loading }) {
  const colors = {
    blue:   { icon: 'bg-[#185FA5]',    text: 'text-[#C9A84C]' },
    green:  { icon: 'bg-emerald-600',  text: 'text-emerald-400' },
    purple: { icon: 'bg-purple-600',   text: 'text-purple-400' },
    amber:  { icon: 'bg-amber-600',    text: 'text-amber-400' },
  }
  const c = colors[color] ?? colors.blue
  return (
    <div className="bg-[#132140] rounded-xl border border-white/10 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="text-white text-2xl" />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider font-montserrat">{label}</p>
        {loading
          ? <div className="h-7 w-12 bg-white/10 animate-pulse rounded mt-1" />
          : <p className={`text-2xl font-bold ${c.text} font-playfair`}>{value}</p>
        }
      </div>
    </div>
  )
}
