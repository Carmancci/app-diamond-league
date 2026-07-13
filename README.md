# Diamond League 2026

Aplicação editorial em português do Brasil para acompanhar calendário, programas, inscritos, resultados e estatísticas da Wanda Diamond League 2026.

## Fonte e veracidade

A fonte primária é o JSON estruturado oficial publicado pelo sistema Swiss Timing. Cada etapa registra URL, horário de coleta, checksum, versão do normalizador e estado de confiança. PDFs e páginas da Diamond League são referências secundárias; dados antigos são preservados quando a fonte ainda não foi publicada ou falha, e uma regressão anormal bloqueia a atualização.

Estados exibidos: `aguardando_fonte`, `coletado`, `validando`, `confirmado_oficial`, `parcial`, `divergente`, `falha_coleta` e `desatualizado`. Programas preservados de etapas ainda não publicadas não são apresentados como listas oficiais de inscritos.

## Atualização

```bash
pnpm ingest          # coleta e grava atomicamente
pnpm ingest:check    # verifica se existem mudanças, sem gravar
pnpm validate:data   # valida todos os arquivos gerados
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

O workflow `.github/workflows/update-official-data.yml` executa a cada seis horas e também pode ser disparado manualmente. Ele cria ou atualiza a branch `automation/official-data` e abre um PR somente depois de todas as validações; nunca publica diretamente na `main`. O Preview da Vercel associado ao PR é a etapa de revisão visual antes do merge.

## Horários e idioma

A interface usa `pt-BR`. Termos oficiais sem tradução segura permanecem no idioma da fonte. Cada horário do programa pode ser exibido como **horário da prova**, no fuso IANA da sede, ou **seu horário**, calculado pelo navegador; a indicação do fuso fica sempre visível.

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

O projeto usa Next.js 16, React 19, Tailwind CSS 4 e componentes shadcn/Base UI. O repositório está conectado ao projeto v0 e à Vercel.
