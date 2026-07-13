import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOfficialMeeting } from '../scripts/lib/normalize-official.mjs'
import { validateMeeting } from '../scripts/lib/validate-meeting.mjs'

const entry = {
  slug: 'teste', round: 1, name: 'Teste', city: 'Cidade', country: 'BRA',
  countryName: 'Brasil', stadium: 'Estádio', date: '2026-01-01',
  timezone: 'America/Sao_Paulo', isFinal: false,
}

const raw = {
  Info: { Date: '2026-01-01', City: 'Cidade', Arena: 'Estádio' },
  Data: { ResultData: {
    event1: { Name: '100m Men', Gender: 'Men', Diamond_Race: true, Data: {
      list1: { Info: { List_Name: 'Results', List_Type: 'ResultList', Date: '01 Jan 2026', Time: '20:10', Wind: '+1.0' }, Results: [
        { Rank: '1', Firstname: 'João', Lastname: 'SILVA', Nation: 'BRA', Performance: '9.99', Bib: '10', SB: '9.99', PB: '9.95' },
      ], Records: [{ Name: 'World Record', Performance: '9.58', Holder: 'BOLT Usain', Holder_Nation: 'JAM' }] },
    } },
  } },
}

test('normaliza feed oficial com atletas, horários e recordes', () => {
  const meeting = normalizeOfficialMeeting(raw, entry, { type: 'swiss_timing_json', url: 'https://official.test', state: 'confirmado_oficial' })
  assert.equal(meeting.timezone, 'America/Sao_Paulo')
  assert.equal(meeting.events[0].listType, 'resultados_finais')
  assert.equal(meeting.events[0].results[0].athlete, 'SILVA João')
  assert.equal(meeting.events[0].results[0].personalBest, '9.95')
  assert.equal(meeting.events[0].records[0].performance, '9.58')
})

test('rejeita queda brusca de cobertura', () => {
  const meeting = normalizeOfficialMeeting(raw, entry, { type: 'swiss_timing_json', url: 'https://official.test', state: 'confirmado_oficial' })
  const previous = { ...meeting, events: Array.from({ length: 8 }, (_, index) => ({ ...meeting.events[0], id: `event-${index}` })) }
  const validation = validateMeeting(meeting, previous)
  assert.equal(validation.valid, false)
  assert.match(validation.errors.join(' '), /Regressão anormal/)
})
