'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronRight } from 'lucide-react'
import { CountryFlag } from '@/components/country-flag'

interface Athlete {
  Lastname: string
  Firstname: string
  DL_ID: string
  Athlete: string
  DR_Points: number
  DR_Rank: number
  Rank: number
  Bib: number
  Nation: string
  BestPerformance: string
  RecordFlag?: string
}

interface EventData {
  Info: {
    Event_Name: string
    Date: string
    Time: string
    Heat_Count: number
    Diamond_Race: boolean
    Wind?: string
  }
  Results: Athlete[]
}

interface DisciplineData {
  Name: string
  Gender: string
  IsDiamondRace: boolean
  Data: Record<string, EventData>
}

interface Meeting {
  round: number
  slug: string
  name: string
  city: string
  state: 'confirmado_oficial' | 'aguardando_publicacao' | 'erro_coleta'
  events: {
    Data: {
      ResultData: Record<string, DisciplineData>
    }
  }
}

interface LiveData {
  season: number
  meetings: Meeting[]
}

// Mock data para atleta quando não encontrado no JSON
const mockAthleteDetails = {
  dob: '1999-05-17',
  pb: 19.84,
  sb: 21.51,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=athlete',
}

// Componente de Modal do Atleta
function AthleteModal({
  athlete,
  discipline,
  open,
  onOpenChange,
}: {
  athlete: Athlete | null
  discipline: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!athlete) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{athlete.Athlete}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar e Info Básica */}
          <div className="flex items-center gap-4">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.DL_ID}`}
              alt={athlete.Athlete}
              className="size-16 rounded-full bg-muted"
            />
            <div className="flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CountryFlag code={athlete.Nation} className="size-4" />
                {athlete.Nation}
              </p>
              <p className="text-xs text-muted-foreground">ID: {athlete.DL_ID}</p>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-card p-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Idade
              </p>
              <p className="mt-1 text-sm font-semibold">{mockAthleteDetails.dob}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Nacionalidade
              </p>
              <p className="mt-1 text-sm font-semibold">{athlete.Nation}</p>
            </div>
          </div>

          {/* Marcas - PB e SB */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Melhores Marcas em {discipline}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Personal Best</p>
                <p className="mt-1 text-lg font-bold text-primary">{mockAthleteDetails.pb}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Season Best</p>
                <p className="mt-1 text-lg font-bold text-accent">{mockAthleteDetails.sb}</p>
              </div>
            </div>
          </div>

          {/* Performance Atual */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Posição Nesta Etapa
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{athlete.Rank}º</span>
              <span className="text-sm font-medium text-muted-foreground">
                {athlete.BestPerformance}
              </span>
              {athlete.RecordFlag && (
                <Badge variant="outline" className="ml-auto">
                  {athlete.RecordFlag}
                </Badge>
              )}
            </div>
          </div>

          {/* Botão Ver Perfil */}
          <button className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
            Ver Perfil Completo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente Lista de Atletas
function AthleteList({
  athletes,
  onSelectAthlete,
  disciplineName,
}: {
  athletes: Athlete[]
  onSelectAthlete: (athlete: Athlete) => void
  disciplineName: string
}) {
  return (
    <div className="space-y-2">
      {athletes.map((athlete) => (
        <button
          key={athlete.DL_ID}
          onClick={() => onSelectAthlete(athlete)}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
        >
          {/* Ranking */}
          <div className="flex w-8 items-center justify-center font-bold text-accent">
            {athlete.Rank}
          </div>

          {/* Info Atleta */}
          <div className="flex-1">
            <p className="font-semibold leading-tight">{athlete.Athlete}</p>
            <p className="text-xs text-muted-foreground">{athlete.Nation}</p>
          </div>

          {/* Marca e Record Flag */}
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-primary">{athlete.BestPerformance}</span>
            {athlete.RecordFlag && (
              <Badge variant="outline" className="text-xs">
                {athlete.RecordFlag}
              </Badge>
            )}
          </div>

          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  )
}

// Componente Recordes
function RecordsDisplay() {
  return (
    <div className="grid gap-2 rounded-lg bg-card p-4 sm:grid-cols-3">
      <div className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          WR - World Record
        </p>
        <p className="font-mono text-sm font-bold text-primary">10.49</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          MR - Meet Record
        </p>
        <p className="font-mono text-sm font-bold text-accent">10.61</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          WL - World Lead
        </p>
        <p className="font-mono text-sm font-bold">10.72</p>
      </div>
    </div>
  )
}

// Componente Principal
export default function MeetsPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [selectedAthleteModal, setSelectedAthleteModal] = useState<Athlete | null>(null)
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://7xjypg3bbjvaaipt.public.blob.vercel-storage.com/diamond-league/live-data-Ty5Ewc8BS5Jb1PROi4OIxYzEj3kkCQ.json'
        )
        const data: LiveData = await response.json()
        setLiveData(data)
        if (data.meetings.length > 0) {
          setSelectedMeeting(data.meetings[0])
        }
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSelectAthlete = (athlete: Athlete) => {
    setSelectedAthleteModal(athlete)
    setIsModalOpen(true)
  }

  // Extrair disciplinas do meeting selecionado
  const disciplines = selectedMeeting
    ? Object.entries(selectedMeeting.events.Data.ResultData).map(([key, value]) => ({
        id: key,
        name: value.Name,
        data: value,
      }))
    : []

  // Definir primeira disciplina quando meeting mudar
  useEffect(() => {
    if (disciplines.length > 0 && !selectedDiscipline) {
      setSelectedDiscipline(disciplines[0].id)
    }
  }, [disciplines, selectedDiscipline])

  const currentDiscipline = disciplines.find((d) => d.id === selectedDiscipline)

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-20 sm:py-12">
      <section className="mb-8">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Etapas 2026
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Programação das Etapas
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Navegue pelos eventos, veja os atletas e suas marcas em tempo real
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* NÍVEL 1: Menu Lateral de Etapas */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Selecione uma Etapa
            </p>
            <div className="space-y-1 rounded-lg border border-border bg-card p-2">
              {liveData?.meetings.map((meeting) => (
                <button
                  key={meeting.slug}
                  onClick={() => {
                    setSelectedMeeting(meeting)
                    setSelectedDiscipline('')
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selectedMeeting?.slug === meeting.slug
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                      {meeting.round}
                    </span>
                    <span>{meeting.name}</span>
                  </div>
                  <p className="ml-7 text-xs text-muted-foreground">{meeting.city}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NÍVEIS 2, 3, 4: Conteúdo Principal */}
        <div className="lg:col-span-3 space-y-6">
          {selectedMeeting && currentDiscipline && (
            <>
              {/* NÍVEL 2: Tabs de Modalidades */}
              <div>
                <Tabs
                  value={selectedDiscipline}
                  onValueChange={setSelectedDiscipline}
                  className="w-full"
                >
                  <TabsList className="grid w-full auto-cols-max grid-flow-col overflow-x-auto">
                    {disciplines.map((discipline) => (
                      <TabsTrigger key={discipline.id} value={discipline.id} className="text-xs">
                        {discipline.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {disciplines.map((discipline) => (
                    <TabsContent key={discipline.id} value={discipline.id} className="space-y-6">
                      {/* NÍVEL 3: Recordes */}
                      <div>
                        <h2 className="mb-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          Recordes da Modalidade
                        </h2>
                        <RecordsDisplay />
                      </div>

                      {/* NÍVEL 4: Lista de Atletas */}
                      <div>
                        <h2 className="mb-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          Escalação
                        </h2>
                        <AthleteList
                          athletes={Object.values(discipline.data.Data).flatMap(
                            (event) => event.Results || []
                          )}
                          onSelectAthlete={handleSelectAthlete}
                          disciplineName={discipline.name}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Atleta */}
      <AthleteModal
        athlete={selectedAthleteModal}
        discipline={selectedDiscipline}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </main>
  )
}
