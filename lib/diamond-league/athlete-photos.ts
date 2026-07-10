/**
 * Fotos reais de atletas (Wikimedia Commons — licença livre), mapeadas por id.
 * Para os demais atletas usamos um avatar de monograma + bandeira.
 * Para adicionar mais: id do atleta -> URL da imagem.
 */
export const ATHLETE_PHOTOS: Record<string, string> = {
  'lyles-noah-usa':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Noah_Lyles_Olympic_Games_03.08.2024.jpg/330px-Noah_Lyles_Olympic_Games_03.08.2024.jpg',
  'duplantis-armand-swe':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Armand_Duplantis%28cropped%29_Budapest_2023.jpg/330px-Armand_Duplantis%28cropped%29_Budapest_2023.jpg',
  'warholm-karsten-nor':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Karsten_Warholm_at_Istanbul_2023.jpg/330px-Karsten_Warholm_at_Istanbul_2023.jpg',
  'kipyegon-faith-ken':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Faith_Kipyegon_London_2017_%28cropped2%29.jpg/330px-Faith_Kipyegon_London_2017_%28cropped2%29.jpg',
  'richardson-sha-carri-usa':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Sha%27Carri_Richardson_Budapest_2023_%28cropped%29.jpg/330px-Sha%27Carri_Richardson_Budapest_2023_%28cropped%29.jpg',
  'crouser-ryan-usa':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Ryan_Crouser_2019_%28cropped%29.jpg/330px-Ryan_Crouser_2019_%28cropped%29.jpg',
  'chopra-neeraj-ind':
    'https://upload.wikimedia.org/wikipedia/commons/f/fb/Neeraj_Chopra_Olympic_gold_medalist.jpg',
  'jacobs-lamont-marcell-ita':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Marcell_Jacobs_2021.jpg/330px-Marcell_Jacobs_2021.jpg',
  'tebogo-letsile-bot':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Atrletes_Botswanais_Championnats_d%27Afrique_d%27athl%C3%A9tisme_2024_%C3%A0_Douala_17_%28cropped%29.jpg/330px-Atrletes_Botswanais_Championnats_d%27Afrique_d%27athl%C3%A9tisme_2024_%C3%A0_Douala_17_%28cropped%29.jpg',
  'alfred-julien-lca':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Julien_Alfred_Glasgow_2024.jpg/330px-Julien_Alfred_Glasgow_2024.jpg',
  'wanyonyi-emmanuel-ken':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Emmanuel_Wanyonyi_Budapest_2023.jpg/330px-Emmanuel_Wanyonyi_Budapest_2023.jpg',
  'furlani-mattia-ita':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Mattia_Furlani_%28Metz_2026%29.jpg/330px-Mattia_Furlani_%28Metz_2026%29.jpg',
  'omanyala-ferdinand-ken':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Ferdinand_Omanyala_Oregon_2022.jpg/330px-Ferdinand_Omanyala_Oregon_2022.jpg',
  'hodgkinson-keely-gbr':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Keely_Hodgkinson_at_2023_European_Indoor_Championships2_%28cropped%29.jpg/330px-Keely_Hodgkinson_at_2023_European_Indoor_Championships2_%28cropped%29.jpg',
  'alekna-mykolas-ltu':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/2022-08-19_European_Championships_2022_%E2%80%93_Men%27s_Discus_Throw_by_Sandro_Halank%E2%80%93009.jpg/330px-2022-08-19_European_Championships_2022_%E2%80%93_Men%27s_Discus_Throw_by_Sandro_Halank%E2%80%93009.jpg',
  'seville-oblique-jam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Oblique_Seville_03.08.2024.jpg/330px-Oblique_Seville_03.08.2024.jpg',
  'bromell-trayvon-usa':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Trayvon_Bromell_Portland_2016.jpg/330px-Trayvon_Bromell_Portland_2016.jpg',
  'hocker-cole-usa':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Hocker_Cole-FH-USAind24_cropped.jpg/330px-Hocker_Cole-FH-USAind24_cropped.jpg',
  'mahuchikh-yaroslava-ukr':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/%D0%9C%D0%B0%D0%B3%D1%83%D1%87%D1%96%D1%85_%D0%AF%D1%80%D0%BE%D1%81%D0%BB%D0%B0%D0%B2%D0%B0_2024.jpg/330px-%D0%9C%D0%B0%D0%B3%D1%83%D1%87%D1%96%D1%85_%D0%AF%D1%80%D0%BE%D1%81%D0%BB%D0%B0%D0%B2%D0%B0_2024.jpg',
  'davis-woodhall-tara-usa':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tara_Davis-Woodhall_%28USA%29_2018.jpg/330px-Tara_Davis-Woodhall_%28USA%29_2018.jpg',
}

export function athletePhoto(id: string): string | null {
  return ATHLETE_PHOTOS[id] ?? null
}
