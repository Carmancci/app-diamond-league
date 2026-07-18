# Princípios e arquitetura do projeto

## Premissas obrigatórias

1. **Veracidade total dos dados.** Resultados, agenda e estatísticas só podem ser publicados a partir da fonte oficial rastreável. Quando a fonte ainda não publicou dados, a interface deve informar esse estado; nunca deve preencher lacunas com dados inventados.
2. **UI moderna, funcional, organizada e atualizada.** Toda tela deve respeitar a identidade visual existente, ser responsiva e apresentar hierarquia clara.
3. **UX amigável, moderna, eficiente e rápida.** Carregar apenas os dados necessários para cada tela, comunicar estados de carregamento/erro/vazio e priorizar o uso em dispositivos móveis.

## Fonte de verdade e publicação

- A coleta oficial é executada pelo GitHub Actions em `update-official-data.yml`.
- O workflow normaliza, valida, testa, executa lint e build antes de propor um Pull Request na branch `automation/official-data`.
- A publicação de dados ocorre somente após revisão e merge no `main`; a integração GitHub–Vercel publica o novo deployment.
- A Vercel hospeda a aplicação e as APIs. Ela não é uma segunda fonte de dados.

## APIs para clientes nativos

As APIs públicas versionadas são a fronteira entre o frontend web e futuros clientes iOS:

- `GET /api/v1/meetings`: lista leve da temporada.
- `GET /api/v1/meetings/{slug}`: detalhe de uma etapa, carregado sob demanda.

Cada resposta informa a versão da API, a temporada e a data da coleta validada (`generatedAt`).

## Operação necessária no GitHub

Em **Settings → Actions → General → Workflow permissions**, habilitar
**Allow GitHub Actions to create and approve pull requests**. Sem essa configuração,
o workflow consegue coletar e validar os dados, mas não consegue abrir o PR automático.
