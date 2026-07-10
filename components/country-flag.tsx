import { cn } from '@/lib/utils'
import { countryIso2, countryName } from '@/lib/diamond-league/countries'

/** Bandeira do país a partir do código IOC, usando flagcdn (imagens reais). */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const iso2 = countryIso2(code)
  const name = countryName(code)

  if (!iso2) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-sm bg-muted font-mono text-[8px] font-bold text-muted-foreground',
          className,
        )}
        aria-label={name}
      >
        {code.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${iso2}.png`}
      srcSet={`https://flagcdn.com/w80/${iso2}.png 2x`}
      width={40}
      height={30}
      alt={name}
      loading="lazy"
      className={cn('rounded-sm object-cover', className)}
    />
  )
}
