# app-diamond-league

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_Qb3PS0wi7HCC9UHHuxwVRCGXNk5I)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Dados da Diamond League

Os resultados são extraídos dos PDFs oficiais publicados pelo serviço de cronometragem Swiss Timing e ficam versionados em `lib/diamond-league/generated/`. O calendário e os metadados das 15 etapas de 2026 são mantidos no registro do projeto; a automação atualiza somente os resultados.

Para atualizar todas as etapas e validar os arquivos gerados:

```bash
pnpm ingest
pnpm validate:data
```

Também é possível atualizar apenas uma etapa pelo slug:

```bash
pnpm ingest paris
pnpm validate:data
```

A ingestão é idempotente: quando o PDF não está disponível, o download falha ou nenhum resultado é reconhecido, os dados válidos existentes são preservados. O campo `updatedAt` só muda quando a fonte ou os resultados da etapa realmente mudam.

## Atualização automática

O workflow `.github/workflows/update-results.yml` executa diariamente às 09:17 UTC e também pode ser iniciado manualmente pela aba **Actions** do GitHub. Ele instala as dependências, executa a ingestão, valida os 15 arquivos e o índice, roda lint e build e só cria um commit na branch `atualizacao-automatica-de-dados` quando existem mudanças reais em `lib/diamond-league/generated/`.

O agendamento do GitHub passa a funcionar depois que o arquivo do workflow estiver presente na branch padrão. Para uma execução sob demanda, abra **Actions**, selecione **Atualizar resultados** e use **Run workflow**.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
