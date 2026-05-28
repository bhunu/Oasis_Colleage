export default function StatCard({ label, value, icon: Icon, trend, color = 'gold' }) {
  const colorMap = {
    gold:   'bg-[#C9A84C]/15 text-[#C9A84C]',
    blue:   'bg-blue-500/15 text-blue-400',
    green:  'bg-emerald-500/15 text-emerald-400',
    red:    'bg-red-500/15 text-red-400',
    purple: 'bg-purple-500/15 text-purple-400',
  }

  return (
    <div className="bg-[#0D1C35] border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-montserrat mb-1">{label}</p>
          <p className="text-3xl font-bold text-white font-playfair">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-montserrat ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.text}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${colorMap[color] ?? colorMap.gold} p-3 rounded-lg shrink-0`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  )
}
