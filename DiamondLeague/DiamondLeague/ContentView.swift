import Combine
import Foundation
import SwiftUI

struct ContentView: View {
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
            Image(systemName: event.gender == "women" ? "figure.run" : "figure.run")
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
                        ResultRow(result: result)
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
                Text(result.country).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 3) {
                Text(result.mark ?? "—").font(.headline.monospacedDigit())
                if let note = result.note, !note.isEmpty {
                    Text(note).font(.caption2.weight(.bold)).foregroundStyle(.cyan)
                }
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

private enum DiamondLeagueAPI {
    private static let baseURL = URL(string: "https://app-diamond-league.vercel.app/api/v1/meetings")!

    static func fetchMeetings() async throws -> MeetingsResponse {
        try await request(url: baseURL, as: MeetingsResponse.self)
    }

    static func fetchMeeting(slug: String) async throws -> MeetingDetailResponse {
        try await request(url: baseURL.appendingPathComponent(slug), as: MeetingDetailResponse.self)
    }

    private static func request<T: Decodable>(url: URL, as type: T.Type) async throws -> T {
        var request = URLRequest(url: url)
        request.timeoutInterval = 15
        request.cachePolicy = .reloadRevalidatingCacheData
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

private struct MeetingsResponse: Decodable {
    let generatedAt: String
    let meetings: [Meeting]
}

private struct MeetingDetailResponse: Decodable {
    let meeting: MeetingDetail
}

private struct Meeting: Decodable, Identifiable {
    let slug: String
    let round: Int
    let name: String
    let city: String
    let countryName: String
    let stadium: String?
    let date: String
    let state: String
    let eventCount: Int
    let athleteCount: Int
    var id: String { slug }
}

private struct MeetingDetail: Decodable {
    let slug: String
    let round: Int
    let name: String
    let city: String
    let countryName: String
    let stadium: String?
    let date: String
    let state: String
    let athleteCount: Int
    let officialUrl: URL?
    let events: [MeetingEvent]
}

private struct MeetingEvent: Decodable, Identifiable {
    let id: String
    let discipline: String
    let gender: String
    let startTime: String?
    let wind: String?
    let results: [AthleteResult]
    let records: [EventRecord]

    var resultSummary: String {
        results.isEmpty ? "Aguardando resultado oficial" : "\(results.count) atletas com resultado"
    }
}

private struct AthleteResult: Decodable, Identifiable {
    let rank: Int?
    let athlete: String
    let athleteId: String?
    let country: String
    let mark: String?
    let note: String?

    var id: String { athleteId ?? "\(athlete)-\(country)-\(rank ?? 0)" }
}

private struct EventRecord: Decodable, Identifiable {
    let name: String
    let performance: String
    let holder: String

    var id: String { "\(name)-\(performance)-\(holder)" }
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
        let formatter = ISO8601DateFormatter()
        guard let value = formatter.date(from: self) else { return self }
        return value.formatted(date: .abbreviated, time: .omitted)
    }

    var displayTimestamp: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let value = formatter.date(from: self) else { return self }
        return value.formatted(date: .abbreviated, time: .shortened)
    }
}
