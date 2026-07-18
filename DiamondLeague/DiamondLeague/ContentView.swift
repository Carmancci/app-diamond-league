import Foundation
import Combine
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
                    NavigationLink { MeetingSummaryView(meeting: meeting) } label: {
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

private struct MeetingSummaryView: View {
    let meeting: Meeting

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("ETAPA \(meeting.round)")
                    .font(.caption.weight(.bold)).foregroundStyle(.cyan).tracking(1)
                Text(meeting.name).font(.largeTitle.bold())
                Text("\(meeting.city), \(meeting.countryName)")
                    .font(.title3).foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 12) {
                    MetricRow("Data", meeting.date.displayDate)
                    MetricRow("Estádio", meeting.stadium ?? "A confirmar pela fonte oficial")
                    MetricRow("Provas", "\(meeting.eventCount)")
                    MetricRow("Atletas", "\(meeting.athleteCount)")
                    MetricRow("Status", meeting.state.displayState)
                }
                .padding(18)
                .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 20))

                if let url = meeting.officialURL {
                    Link(destination: url) {
                        Label("Abrir fonte oficial", systemImage: "arrow.up.right.square")
                            .frame(maxWidth: .infinity).padding()
                            .background(Color.cyan, in: RoundedRectangle(cornerRadius: 16))
                            .foregroundStyle(.black).fontWeight(.bold)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
        .navigationTitle(meeting.name)
        .navigationBarTitleDisplayMode(.inline)
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

private enum DiamondLeagueAPI {
    static func fetchMeetings() async throws -> MeetingsResponse {
        var request = URLRequest(url: URL(string: "https://app-diamond-league.vercel.app/api/v1/meetings")!)
        request.timeoutInterval = 15
        request.cachePolicy = .reloadRevalidatingCacheData
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(MeetingsResponse.self, from: data)
    }
}

private struct MeetingsResponse: Decodable {
    let apiVersion: String
    let season: Int
    let generatedAt: String
    let meetings: [Meeting]
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
    let officialURL: URL?
    var id: String { slug }
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
