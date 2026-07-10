'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { athletePhoto } from '@/lib/diamond-league/athlete-photos'
import { initials } from '@/lib/diamond-league/format'
import { CountryFlag } from '@/components/country-flag'

interface Props {
  id: string
  name: string
  country: string
  className?: string
  showFlag?: boolean
}

/** Avatar do atleta: foto real quando disponível, senão monograma + bandeira. */
export function AthleteAvatar({ id, name, country, className, showFlag = false }: Props) {
  const photo = athletePhoto(id)
  const [errored, setErrored] = useState(false)
  const showPhoto = photo && !errored

  return (
    <span className={cn('relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary', className)}>
      {showPhoto ? (
        <img
          src={photo}
          alt={name}
          loading="lazy"
          crossOrigin="anonymous"
          onError={() => setErrored(true)}
          className="size-full object-cover"
        />
      ) : (
        <span className="font-mono text-[0.7em] font-bold uppercase text-muted-foreground">
          {initials(name)}
        </span>
      )}
      {showFlag && (
        <CountryFlag
          code={country}
          className="absolute bottom-0 right-0 size-[38%] rounded-full ring-2 ring-card"
        />
      )}
    </span>
  )
}
