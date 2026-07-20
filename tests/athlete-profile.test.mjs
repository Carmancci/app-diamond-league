import assert from 'node:assert/strict'
import test from 'node:test'
import {
  markForDiscipline,
  markDetailsForDiscipline,
  normalizeDisciplineKey,
  parseAthleteProfileHtml,
} from '../scripts/lib/athlete-profile.mjs'

const PROFILE_HTML = `
  <h1>ALFRED Julien</h1>
  <p>Born</p><p><span>10 JUN 2001</span><span>(25y YRS)</span></p>
  <h3>Personal Best</h3>
  <a href="https://worldathletics.org/athletes/_/14646562">See more</a>
  <table><tbody><tr>
    <td>Women&#039;s 200 Metres</td><td>21.51</td>
    <td>Stade Louis II, Monaco (MON)</td><td>10 JUL 2026</td>
  </tr></tbody></table>
  <h3>Season&rsquo;s Best</h3>
  <table><tbody><tr>
    <td>Women&#039;s 200 Metres</td><td>21.71</td>
    <td>London Stadium, London (GBR)</td><td>18 JUL 2026</td>
  </tr></tbody></table>
`

test('normaliza disciplinas entre o perfil e o feed oficial', () => {
  assert.equal(normalizeDisciplineKey("Women's 100 Metres Hurdles"), '100m hurdles')
  assert.equal(normalizeDisciplineKey('200m'), '200m')
})

test('extrai DOB, PB, SB e proveniência do perfil oficial', () => {
  const profile = parseAthleteProfileHtml(PROFILE_HTML)
  assert.equal(profile.name, 'ALFRED Julien')
  assert.equal(profile.dob, '2001-06-10')
  assert.deepEqual(profile.pb['200m'], {
    discipline: "Women's 200 Metres",
    mark: '21.51',
    venue: 'Stade Louis II, Monaco (MON)',
    date: '10 JUL 2026',
  })
  assert.equal(profile.sb['200m'].mark, '21.71')
  assert.equal(profile.worldAthleticsUrl, 'https://worldathletics.org/athletes/_/14646562')
})

test('aceita tanto o cache novo quanto o cache legado', () => {
  assert.equal(markForDiscipline({ '200m': { mark: '21.51' } }, '200m'), '21.51')
  assert.equal(markForDiscipline({ 'Women&#039;s 200 Metres': '21.51' }, '200m'), '21.51')
  assert.deepEqual(markDetailsForDiscipline({ '200m': '21.51' }, '200m'), { mark: '21.51' })
})
