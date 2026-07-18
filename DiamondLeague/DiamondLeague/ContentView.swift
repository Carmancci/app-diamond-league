import Combine
import Foundation
import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            MeetingsRootView()
                .tabItem { Label("Etapas", systemImage: "calendar") }

            AthletesDirectoryView()
                .tabItem { Label("Atletas", systemImage: "person.3") }
        }
        .tint(.cyan)
    }
}

private struct MeetingsRootView: View {
    @StateObject private var viewModel = MeetingsViewModel()

    var body: some View {
        NavigationStack {
            Group {
                switch viewModel.state {
                case .idle, .loading:
                    ProgressView("Consultando dados oficiais…")
                case let .loaded(meetings, generatedAt):
                    MeetingsList(meetings: meetings, generatedAt: generatedAt)
                case let .failed(message):
                    ContentUnavailableView {
                        Label("Não foi possível atualizar", systemImage: "exclamationmark.icloud")
                    } description: {
                        Text(message)
                    } actions: {
                        Button("Tentar novamente") { Task { await viewModel.load() } }
                            .buttonStyle(.borderedProminent)
                    }
                }
            }
            .navigationTitle("Diamond League")
            .toolbar {
                Button { Task { await viewModel.load() } } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .accessibilityLabel("Atualizar etapas")
            }
        }
        .task { await viewModel.load() }
    }
}

private struct MeetingsList: View {
    let meetings: [Meeting]
    let generatedAt: String

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 12) {
                    Label("DADOS OFICIAIS", systemImage: "checkmark.seal.fill")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.cyan)
                        .tracking(1)
                    Text("Atletismo mundial,\nem tempo certo.")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                    Text("Acompanhe as \(meetings.count) etapas da temporada 2026 com dados das fontes oficiais.")
                        .foregroundStyle(.secondary)
                    Label("Atualizado \(generatedAt.displayTimestamp)", systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(22)
                .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 28))
                .padding(.horizontal, 20)

                Text("ETAPAS DA TEMPORADA")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.secondary)
                    .tracking(1.2)
                    .padding(.horizontal, 20)

                ForEach(meetings) { meeting in
                    NavigationLink { MeetingDetailView(meeting: meeting) } label: {
                        MeetingCard(meeting: meeting)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)
                }
            }
            .padding(.vertical, 12)
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
}

private struct MeetingCard: View {
    let meeting: Meeting

    var body: some View {
        HStack(spacing: 14) {
            VStack(spacing: 2) {
                Text("ETAPA").font(.caption2.weight(.bold)).foregroundStyle(.secondary)
                Text("\(meeting.round)").font(.title2.weight(.bold)).foregroundStyle(.cyan)
            }
            .frame(width: 50, height: 54)
            .background(Color.cyan.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 5) {
                Text(meeting.name).font(.headline)
                Text("\(meeting.city) · \(meeting.countryName)")
                    .font(.subheadline).foregroundStyle(.secondary)
                Text("\(meeting.date.displayDate) · \(meeting.eventCount) provas · \(meeting.athleteCount) atletas")
                    .font(.caption).foregroundStyle(.secondary)
            }

            Spacer(minLength: 4)
            Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20))
        .overlay(alignment: .topTrailing) {
            Text(meeting.state.displayState)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(meeting.state == "confirmado_oficial" ? .green : .orange)
                .padding(.horizontal, 8).padding(.vertical, 5)
                .background(.ultraThinMaterial, in: Capsule())
                .padding(10)
        }
    }
}

private struct MeetingDetailView: View {
    let meeting: Meeting
    @StateObject private var viewModel: MeetingDetailViewModel

    init(meeting: Meeting) {
        self.meeting = meeting
        _viewModel = StateObject(wrappedValue: MeetingDetailViewModel(slug: meeting.slug))
    }

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle, .loading:
                ProgressView("Carregando provas e resultados oficiais…")
            case let .loaded(detail):
                MeetingDetailContent(meeting: detail)
            case let .failed(message):
                ContentUnavailableView {
                    Label("Detalhes indisponíveis", systemImage: "exclamationmark.icloud")
                } description: {
                    Text(message)
                } actions: {
                    Button("Tentar novamente") { Task { await viewModel.load() } }
                        .buttonStyle(.borderedProminent)
                }
            }
        }
        .navigationTitle(meeting.name)
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.load() }
    }
}

private struct MeetingDetailContent: View {
    let meeting: MeetingDetail

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("ETAPA \(meeting.round)")
                        .font(.caption.weight(.bold)).foregroundStyle(.cyan).tracking(1)
                    Text(meeting.name).font(.largeTitle.bold())
                    Text("\(meeting.city), \(meeting.countryName)")
                        .font(.title3).foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 12) {
                    MetricRow("Data", meeting.date.displayDate)
                    MetricRow("Estádio", meeting.stadium ?? "A confirmar pela fonte oficial")
                    MetricRow("Provas", "\(meeting.events.count)")
                    MetricRow("Atletas", "\(meeting.athleteCount)")
                    MetricRow("Status", meeting.state.displayState)
                }
                .padding(18)
                .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20))

                HStack {
                    Text("PROVAS E RESULTADOS")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.secondary)
                        .tracking(1.2)
                    Spacer()
                    Text("OFICIAIS")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.cyan)
                }

                if meeting.events.isEmpty {
                    ContentUnavailableView(
                        "Aguardando publicação oficial",
                        systemImage: "calendar.badge.clock",
                        description: Text("Esta etapa ainda não possui provas ou resultados publicados pela fonte oficial."))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                } else {
                    ForEach(meeting.events) { event in
                        NavigationLink { EventDetailView(event: event, meetingName: meeting.name) } label: {
                            EventCard(event: event)
                        }
                        .buttonStyle(.plain)
                    }
                }

                if let url = meeting.officialUrl {
                    Link(destination: url) {
                        Label("Abrir fonte oficial", systemImage: "arrow.up.right.square")
                            .frame(maxWidth: .infinity).padding()
                            .background(Color.cyan, in: RoundedRectangle(cornerRadius: 16))
                            .foregroundStyle(.black).fontWeight(.bold)
                    }
                    .padding(.top, 4)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
}

private struct EventCard: View {
    let event: MeetingEvent

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: "figure.run")
                .font(.title3.weight(.bold))
                .foregroundStyle(.cyan)
                .frame(width: 44, height: 44)
                .background(Color.cyan.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 5) {
                Text(event.discipline).font(.headline)
                Text(event.gender.displayGender)
                    .font(.subheadline).foregroundStyle(.secondary)
                Text(event.resultSummary)
                    .font(.caption).foregroundStyle(.secondary)
            }

            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 6) {
                if let time = event.startTime, !time.isEmpty {
                    Text(time).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                }
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
            }
        }
        .padding(16)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20))
    }
}

private struct EventDetailView: View {
    let event: MeetingEvent
    let meetingName: String

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 7) {
                    Text(event.gender.displayGender.uppercased())
                        .font(.caption.weight(.bold)).foregroundStyle(.cyan).tracking(1)
                    Text(event.discipline).font(.largeTitle.bold())
                    Text(meetingName).foregroundStyle(.secondary)
                    if let wind = event.wind, !wind.isEmpty {
                        Label("Vento \(wind)", systemImage: "wind")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }

                Text("RESULTADOS OFICIAIS")
                    .font(.caption.weight(.bold)).foregroundStyle(.secondary).tracking(1.2)

                if event.results.isEmpty {
                    ContentUnavailableView(
                        "Resultado aguardando fonte oficial",
                        systemImage: "clock.badge.questionmark",
                        description: Text("A programação foi identificada, mas a fonte oficial ainda não publicou resultados para esta prova."))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                } else {
                    ForEach(event.results) { result in
                        if let athleteId = result.athleteId, !athleteId.isEmpty {
                            NavigationLink { AthleteProfileView(athleteId: athleteId) } label: {
                                ResultRow(result: result)
                            }
                            .buttonStyle(.plain)
                        } else {
                            ResultRow(result: result)
                        }
                    }
                }

                if !event.records.isEmpty {
                    Text("REFERÊNCIAS DA PROVA")
                        .font(.caption.weight(.bold)).foregroundStyle(.secondary).tracking(1.2)
                        .padding(.top, 6)
                    ForEach(event.records) { record in
                        HStack(alignment: .firstTextBaseline) {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(record.name).font(.caption).foregroundStyle(.secondary)
                                Text(record.holder).font(.subheadline.weight(.medium))
                            }
                            Spacer()
                            Text(record.performance).font(.headline.monospacedDigit())
                        }
                        .padding(14)
                        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle(event.discipline)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ResultRow: View {
    let result: AthleteResult

    var body: some View {
        HStack(spacing: 12) {
            Text(result.rank.map(String.init) ?? "—")
                .font(.headline.monospacedDigit())
                .foregroundStyle(result.rank == 1 ? .cyan : .secondary)
                .frame(width: 30)
            VStack(alignment: .leading, spacing: 3) {
                Text(result.athlete).font(.subheadline.weight(.semibold))
                Text(result.summaryLine).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 3) {
                Text(result.mark ?? "—").font(.headline.monospacedDigit())
                if let note = result.note, !note.isEmpty {
                    Text(note).font(.caption2.weight(.bold)).foregroundStyle(.cyan)
                }
            }
            if result.athleteId != nil {
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
            }
        }
        .padding(15)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct AthletesDirectoryView: View {
    @StateObject private var viewModel = AthletesDirectoryViewModel()
    @State private var query = ""

    private var filteredAthletes: [AthleteSummary] {
        let text = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return viewModel.athletes }
        return viewModel.athletes.filter { athlete in
            [athlete.name, athlete.country, athlete.disciplines.joined(separator: " ")]
                .contains { $0.localizedCaseInsensitiveContains(text) }
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                switch viewModel.state {
                case .idle, .loading:
                    ProgressView("Carregando atletas oficiais…")
                case .loaded:
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 14) {
                            VStack(alignment: .leading, spacing: 8) {
                                Label("BASE OFICIAL", systemImage: "person.text.rectangle")
                                    .font(.caption.weight(.bold)).foregroundStyle(.cyan).tracking(1)
                                Text("Atletas")
                                    .font(.system(size: 34, weight: .bold, design: .rounded))
                                Text("Perfis montados somente com resultados e dados publicados nas fontes oficiais do projeto.")
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.horizontal, 20)
                            .padding(.top, 8)

                            if filteredAthletes.isEmpty {
                                ContentUnavailableView.search(text: query)
                                    .padding(.vertical, 48)
                            } else {
                                ForEach(filteredAthletes) { athlete in
                                    NavigationLink { AthleteProfileView(athleteId: athlete.id) } label: {
                                        AthleteDirectoryCard(athlete: athlete)
                                    }
                                    .buttonStyle(.plain)
                                    .padding(.horizontal, 20)
                                }
                            }
                        }
                        .padding(.vertical, 12)
                    }
                    .background(Color(uiColor: .systemGroupedBackground))
                case let .failed(message):
                    ContentUnavailableView {
                        Label("Atletas indisponíveis", systemImage: "person.crop.circle.badge.exclamationmark")
                    } description: {
                        Text(message)
                    } actions: {
                        Button("Tentar novamente") { Task { await viewModel.load() } }
                            .buttonStyle(.borderedProminent)
                    }
                }
            }
            .navigationTitle("Atletas")
            .searchable(text: $query, prompt: "Buscar atleta, país ou prova")
            .toolbar {
                Button { Task { await viewModel.load() } } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .accessibilityLabel("Atualizar atletas")
            }
        }
        .task { await viewModel.load() }
    }
}

private struct AthleteDirectoryCard: View {
    let athlete: AthleteSummary

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: athlete.gender == "women" ? "figure.run" : "figure.run")
                .font(.title3.weight(.bold))
                .foregroundStyle(.cyan)
                .frame(width: 46, height: 46)
                .background(Color.cyan.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))

            VStack(alignment: .leading, spacing: 5) {
                Text(athlete.name).font(.headline)
                Text(athlete.identityLine).font(.subheadline).foregroundStyle(.secondary)
                if !athlete.disciplines.isEmpty {
                    Text(athlete.disciplines.joined(separator: " · "))
                        .font(.caption).foregroundStyle(.secondary).lineLimit(1)
                }
                AthleteMarksLine(seasonBest: athlete.seasonBest, personalBest: athlete.personalBest)
            }
            Spacer(minLength: 4)
            Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20))
    }
}

private struct AthleteMarksLine: View {
    let seasonBest: String?
    let personalBest: String?

    var body: some View {
        HStack(spacing: 10) {
            if let seasonBest, !seasonBest.isEmpty {
                Text("SB \(seasonBest)").font(.caption.weight(.semibold)).foregroundStyle(.cyan)
            }
            if let personalBest, !personalBest.isEmpty {
                Text("PB \(personalBest)").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
            }
        }
    }
}

private struct AthleteProfileView: View {
    let athleteId: String
    @StateObject private var viewModel: AthleteProfileViewModel

    init(athleteId: String) {
        self.athleteId = athleteId
        _viewModel = StateObject(wrappedValue: AthleteProfileViewModel(athleteId: athleteId))
    }

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle, .loading:
                ProgressView("Carregando perfil oficial…")
            case let .loaded(athlete):
                AthleteProfileContent(athlete: athlete)
            case let .failed(message):
                ContentUnavailableView {
                    Label("Perfil indisponível", systemImage: "person.crop.circle.badge.exclamationmark")
                } description: {
                    Text(message)
                } actions: {
                    Button("Tentar novamente") { Task { await viewModel.load() } }
                        .buttonStyle(.borderedProminent)
                }
            }
        }
        .navigationTitle("Atleta")
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.load() }
    }
}

private struct AthleteProfileContent: View {
    let athlete: AthleteProfile

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(athlete.gender.displayGender.uppercased())
                        .font(.caption.weight(.bold)).foregroundStyle(.cyan).tracking(1)
                    Text(athlete.name).font(.largeTitle.bold())
                    Text(athlete.identityLine).font(.title3).foregroundStyle(.secondary)
                    if let dob = athlete.dob, let age = dob.officialAge {
                        Label(age, systemImage: "calendar")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                }

                HStack(spacing: 10) {
                    AthleteStat(title: "Pontos", value: "\(athlete.totalPoints)")
                    AthleteStat(title: "Vitórias", value: "\(athlete.wins)")
                    AthleteStat(title: "Pódios", value: "\(athlete.podiums)")
                    AthleteStat(title: "Etapas", value: "\(athlete.meetingsCount)")
                }

                Text("MARCAS E PROVAS")
                    .font(.caption.weight(.bold)).foregroundStyle(.secondary).tracking(1.2)

                ForEach(athlete.byDiscipline) { summary in
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(summary.discipline).font(.headline)
                                Text(summary.gender.displayGender).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text("\(summary.appearances) aparições")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        AthleteMarksLine(seasonBest: summary.seasonBest, personalBest: summary.personalBest)
                        HStack {
                            Text("\(summary.wins) vitórias").font(.caption).foregroundStyle(.secondary)
                            Spacer()
                            Text("\(summary.points) pontos").font(.caption.weight(.semibold)).foregroundStyle(.cyan)
                        }
                    }
                    .padding(16)
                    .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
                }

                Text("HISTÓRICO OFICIAL")
                    .font(.caption.weight(.bold)).foregroundStyle(.secondary).tracking(1.2)
                    .padding(.top, 4)

                ForEach(athlete.performances) { performance in
                    PerformanceCard(performance: performance)
                }

                Text("Campos ausentes não foram publicados pela fonte oficial; o app não os estima.")
                    .font(.caption).foregroundStyle(.secondary)
                    .padding(.top, 4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
}

private struct AthleteStat: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value).font(.headline.monospacedDigit())
            Text(title).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14))
    }
}

private struct PerformanceCard: View {
    let performance: AthletePerformance

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(performance.discipline).font(.headline)
                Text("\(performance.meetingName) · \(performance.city)")
                    .font(.subheadline).foregroundStyle(.secondary)
                Text(performance.date.displayDate).font(.caption).foregroundStyle(.secondary)
                if let note = performance.note, !note.isEmpty {
                    Text(note).font(.caption.weight(.semibold)).foregroundStyle(.cyan)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 5) {
                if let rank = performance.rank { Text("#\(rank)").font(.caption.weight(.bold)).foregroundStyle(.cyan) }
                Text(performance.mark).font(.headline.monospacedDigit())
                if let points = performance.points, points > 0 { Text("\(points) pts").font(.caption).foregroundStyle(.secondary) }
            }
        }
        .padding(15)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct MetricRow: View {
    let title: String
    let value: String
    init(_ title: String, _ value: String) { self.title = title; self.value = value }

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).foregroundStyle(.secondary)
            Spacer()
            Text(value).multilineTextAlignment(.trailing).fontWeight(.semibold)
        }
        .font(.subheadline)
    }
}

@MainActor
private final class MeetingsViewModel: ObservableObject {
    enum State { case idle, loading, loaded([Meeting], generatedAt: String), failed(String) }
    @Published private(set) var state: State = .idle

    func load() async {
        state = .loading
        do {
            let response = try await DiamondLeagueAPI.fetchMeetings()
            state = .loaded(response.meetings, generatedAt: response.generatedAt)
        } catch {
            state = .failed("Verifique sua conexão e tente novamente. O app usa somente a API oficial do projeto.")
        }
    }
}

@MainActor
private final class MeetingDetailViewModel: ObservableObject {
    enum State { case idle, loading, loaded(MeetingDetail), failed(String) }
    @Published private(set) var state: State = .idle
    private let slug: String

    init(slug: String) { self.slug = slug }

    func load() async {
        state = .loading
        do {
            let response = try await DiamondLeagueAPI.fetchMeeting(slug: slug)
            state = .loaded(response.meeting)
        } catch {
            state = .failed("Não foi possível carregar provas e resultados oficiais desta etapa. Verifique sua conexão e tente novamente.")
        }
    }
}

@MainActor
private final class AthletesDirectoryViewModel: ObservableObject {
    enum State { case idle, loading, loaded, failed(String) }
    @Published private(set) var state: State = .idle
    @Published private(set) var athletes: [AthleteSummary] = []

    func load() async {
        state = .loading
        do {
            athletes = try await DiamondLeagueAPI.fetchAthletes().athletes
            state = .loaded
        } catch {
            state = .failed("Não foi possível carregar os atletas oficiais. Verifique sua conexão e tente novamente.")
        }
    }
}

@MainActor
private final class AthleteProfileViewModel: ObservableObject {
    enum State { case idle, loading, loaded(AthleteProfile), failed(String) }
    @Published private(set) var state: State = .idle
    private let athleteId: String

    init(athleteId: String) { self.athleteId = athleteId }

    func load() async {
        state = .loading
        do {
            state = .loaded(try await DiamondLeagueAPI.fetchAthlete(id: athleteId).athlete)
        } catch {
            state = .failed("Não foi possível carregar este perfil com os dados oficiais disponíveis.")
        }
    }
}

private enum DiamondLeagueAPI {
    private static let meetingsURL = URL(string: "https://app-diamond-league.vercel.app/api/v1/meetings")!
    private static let athletesURL = URL(string: "https://app-diamond-league.vercel.app/api/v1/athletes")!

    static func fetchMeetings() async throws -> MeetingsResponse { try await request(url: meetingsURL, as: MeetingsResponse.self) }
    static func fetchMeeting(slug: String) async throws -> MeetingDetailResponse { try await request(url: meetingsURL.appendingPathComponent(slug), as: MeetingDetailResponse.self) }
    static func fetchAthletes() async throws -> AthletesResponse { try await request(url: athletesURL, as: AthletesResponse.self) }
    static func fetchAthlete(id: String) async throws -> AthleteProfileResponse { try await request(url: athletesURL.appendingPathComponent(id), as: AthleteProfileResponse.self) }

    private static func request<T: Decodable>(url: URL, as type: T.Type) async throws -> T {
        var request = URLRequest(url: url)
        request.timeoutInterval = 15
        request.cachePolicy = .reloadRevalidatingCacheData
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw URLError(.badServerResponse) }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

private struct MeetingsResponse: Decodable { let generatedAt: String; let meetings: [Meeting] }
private struct MeetingDetailResponse: Decodable { let meeting: MeetingDetail }
private struct AthletesResponse: Decodable { let athletes: [AthleteSummary] }
private struct AthleteProfileResponse: Decodable { let athlete: AthleteProfile }

private struct Meeting: Decodable, Identifiable {
    let slug: String; let round: Int; let name: String; let city: String; let countryName: String
    let stadium: String?; let date: String; let state: String; let eventCount: Int; let athleteCount: Int
    var id: String { slug }
}

private struct MeetingDetail: Decodable {
    let slug: String; let round: Int; let name: String; let city: String; let countryName: String
    let stadium: String?; let date: String; let state: String; let athleteCount: Int; let officialUrl: URL?; let events: [MeetingEvent]
}

private struct MeetingEvent: Decodable, Identifiable {
    let id: String; let discipline: String; let gender: String; let startTime: String?; let wind: String?
    let results: [AthleteResult]; let records: [EventRecord]
    var resultSummary: String { results.isEmpty ? "Aguardando resultado oficial" : "\(results.count) atletas com resultado" }
}

private struct AthleteResult: Decodable, Identifiable {
    let rank: Int?; let athlete: String; let athleteId: String?; let country: String; let mark: String?; let note: String?
    let dob: String?; let seasonBest: String?; let personalBest: String?; let points: Int?
    var id: String { athleteId ?? "\(athlete)-\(country)-\(rank ?? 0)" }
    var summaryLine: String {
        var values = [country]
        if let dob, let age = dob.officialAge { values.append(age) }
        if let seasonBest, !seasonBest.isEmpty { values.append("SB \(seasonBest)") }
        if let personalBest, !personalBest.isEmpty { values.append("PB \(personalBest)") }
        if let points, points > 0 { values.append("\(points) pts") }
        return values.joined(separator: " · ")
    }
}

private struct EventRecord: Decodable, Identifiable {
    let name: String; let performance: String; let holder: String
    var id: String { "\(name)-\(performance)-\(holder)" }
}

private struct AthleteSummary: Decodable, Identifiable {
    let id: String; let name: String; let country: String; let gender: String; let dob: String?
    let disciplines: [String]; let topDiscipline: String?; let seasonBest: String?; let personalBest: String?
    let totalPoints: Int; let wins: Int; let podiums: Int; let meetingsCount: Int
    var identityLine: String {
        var values = [country]
        if let dob, let age = dob.officialAge { values.append(age) }
        return values.joined(separator: " · ")
    }
}

private struct AthleteProfile: Decodable {
    let id: String; let name: String; let country: String; let gender: String; let dob: String?
    let disciplines: [String]; let performances: [AthletePerformance]; let byDiscipline: [DisciplineSummary]
    let totalPoints: Int; let wins: Int; let podiums: Int; let meetingsCount: Int
    var identityLine: String { country }
}

private struct AthletePerformance: Decodable, Identifiable {
    let athleteId: String; let athlete: String; let country: String; let gender: String; let dob: String?
    let discipline: String; let rank: Int?; let mark: String; let seasonBest: String?; let personalBest: String?
    let note: String?; let points: Int?; let meetingSlug: String; let meetingName: String; let city: String; let round: Int; let date: String
    var id: String { "\(athleteId)-\(meetingSlug)-\(discipline)-\(rank ?? 0)" }
}

private struct DisciplineSummary: Decodable, Identifiable {
    let discipline: String; let gender: String; let seasonBest: String?; let personalBest: String?
    let appearances: Int; let wins: Int; let points: Int
    var id: String { "\(discipline)-\(gender)" }
}

private extension String {
    var displayState: String {
        switch self {
        case "confirmado_oficial": "Confirmado"
        case "confirmado_programa_oficial": "Programa oficial"
        case "aguardando_fonte": "Aguardando fonte"
        default: replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    var displayGender: String {
        switch self {
        case "women": "Feminino"
        case "men": "Masculino"
        default: capitalized
        }
    }

    var displayDate: String {
        if let value = ISO8601DateFormatter().date(from: self) { return value.formatted(date: .abbreviated, time: .omitted) }
        let formatter = DateFormatter(); formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: self)?.formatted(date: .abbreviated, time: .omitted) ?? self
    }

    var displayTimestamp: String {
        let formatter = ISO8601DateFormatter(); formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: self)?.formatted(date: .abbreviated, time: .shortened) ?? self
    }

    var officialAge: String? {
        let iso = ISO8601DateFormatter()
        let fallback = DateFormatter(); fallback.locale = Locale(identifier: "en_US_POSIX"); fallback.dateFormat = "dd MMM yyyy"
        guard let birthDate = iso.date(from: self) ?? fallback.date(from: self) else { return nil }
        let years = Calendar.current.dateComponents([.year], from: birthDate, to: Date()).year ?? -1
        guard (0...120).contains(years) else { return nil }
        return "\(years) anos"
    }
}
