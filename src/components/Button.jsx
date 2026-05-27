export default function Button({ variant = 'primary', children, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-montserrat font-semibold uppercase tracking-wider text-sm rounded transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/50'

  const variants = {
    primary:  'bg-gold hover:bg-gold-light text-navy px-8 py-3 shadow-lg hover:shadow-xl',
    outlined: 'border-2 border-white text-white hover:bg-white hover:text-navy px-8 py-3',
    'outlined-gold': 'border-2 border-gold text-gold hover:bg-gold hover:text-navy px-8 py-3',
    ghost:    'text-gold hover:text-gold-light underline-offset-4 hover:underline px-2 py-1',
    sm:       'bg-gold hover:bg-gold-light text-navy px-5 py-2 text-xs shadow',
  }

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}
