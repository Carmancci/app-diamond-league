export const SEASON = 2026

export const MEETINGS = [
  { round: 1, slug: 'shanghai', name: 'Xangai', city: 'Xangai', country: 'CHN', countryName: 'China', stadium: 'Shanghai Stadium', date: '2026-05-16', timezone: 'Asia/Shanghai' },
  { round: 2, slug: 'xiamen', name: 'Xiamen', city: 'Xiamen', country: 'CHN', countryName: 'China', stadium: 'Egret Stadium', date: '2026-05-23', timezone: 'Asia/Shanghai' },
  { round: 3, slug: 'rabat', name: 'Rabat', city: 'Rabat', country: 'MAR', countryName: 'Marrocos', stadium: 'Prince Moulay Abdellah', date: '2026-05-31', timezone: 'Africa/Casablanca' },
  { round: 4, slug: 'rome', name: 'Roma', city: 'Roma', country: 'ITA', countryName: 'Itália', stadium: 'Stadio Olimpico', date: '2026-06-04', timezone: 'Europe/Rome' },
  { round: 5, slug: 'stockholm', name: 'Estocolmo', city: 'Estocolmo', country: 'SWE', countryName: 'Suécia', stadium: 'Olympic Stadium', date: '2026-06-07', timezone: 'Europe/Stockholm' },
  { round: 6, slug: 'oslo', name: 'Oslo', city: 'Oslo', country: 'NOR', countryName: 'Noruega', stadium: 'Bislett Stadion', date: '2026-06-10', timezone: 'Europe/Oslo' },
  { round: 7, slug: 'doha', name: 'Doha', city: 'Doha', country: 'QAT', countryName: 'Catar', stadium: 'Suheim Bin Hamad', date: '2026-06-19', timezone: 'Asia/Qatar' },
  { round: 8, slug: 'paris', name: 'Paris', city: 'Paris', country: 'FRA', countryName: 'França', stadium: 'Stade Charléty', date: '2026-06-28', timezone: 'Europe/Paris' },
  { round: 9, slug: 'eugene', name: 'Eugene', city: 'Eugene', country: 'USA', countryName: 'Estados Unidos', stadium: 'Hayward Field', date: '2026-07-04', timezone: 'America/Los_Angeles' },
  { round: 10, slug: 'monaco', name: 'Mônaco', city: 'Mônaco', country: 'MON', countryName: 'Mônaco', stadium: 'Stade Louis II', date: '2026-07-10', timezone: 'Europe/Monaco' },
  { round: 11, slug: 'london', name: 'Londres', city: 'Londres', country: 'GBR', countryName: 'Reino Unido', stadium: 'London Stadium', date: '2026-07-18', timezone: 'Europe/London' },
  { round: 12, slug: 'lausanne', name: 'Lausanne', city: 'Lausanne', country: 'SUI', countryName: 'Suíça', stadium: 'Stade de la Pontaise', date: '2026-08-21', timezone: 'Europe/Zurich' },
  { round: 13, slug: 'silesia', name: 'Silésia', city: 'Chorzów', country: 'POL', countryName: 'Polônia', stadium: 'Silesian Stadium', date: '2026-08-23', timezone: 'Europe/Warsaw' },
  { round: 14, slug: 'zurich', name: 'Zurique', city: 'Zurique', country: 'SUI', countryName: 'Suíça', stadium: 'Letzigrund', date: '2026-08-27', timezone: 'Europe/Zurich' },
  { round: 15, slug: 'brussels', name: 'Final de Bruxelas', city: 'Bruxelas', country: 'BEL', countryName: 'Bélgica', stadium: 'King Baudouin', date: '2026-09-04', endDate: '2026-09-05', timezone: 'Europe/Brussels', isFinal: true },
]

export const officialJsonUrl = (slug, season = SEASON) =>
  `https://ath-wdl-archive.azureedge.net/${season}/${slug}.json`

export const officialPdfUrl = (slug) =>
  `https://ps-cache.web.swisstiming.com/node/binaryData/ATH_PROD/${slug.toUpperCase()}_${SEASON}/PDF_ATH-------------------------------_MUL.PDF`
