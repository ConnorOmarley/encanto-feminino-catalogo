# Catálogo Encanto Feminino

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)
![TanStack](https://img.shields.io/badge/TanStack_Start-1.168-FC4B22?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=flat-square)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square)

Catálogo online com **vitrine pública** e **painel administrativo**, para uma marca artesanal de lingeries, pijamas e sabonetes sob encomenda. A vitrine é renderizada no servidor; a conversão acontece no WhatsApp.

> **Case real**, entregue a uma cliente. Identidade, contatos e fotos de produto foram substituídos por dados fictícios neste repositório — ver [Dados fictícios](#dados-fictícios).
>
> ⚠️ **O nome do repositório não descreve o projeto.** "boutique-chat-chic" veio do template inicial e não há chat no código. A conversa é um deep-link para o WhatsApp. O repositório deve ser renomeado para `encanto-feminino-catalogo`.

---

## O problema e a decisão

A [v1 deste projeto](https://github.com/ConnorOmarley/Encanto_feminino) era uma landing page estática. O catálogo era um array fixo dentro do `script.js` e o painel administrativo estava comentado — `localStorage` não sincroniza entre dispositivos, então um painel baseado nele daria a impressão de uma gestão que não existe.

A v2 troca a arquitetura por dados de verdade:

| | v1 (estática) | v2 (este repo) |
|---|---|---|
| Catálogo | array no JS | Postgres com RLS |
| Painel | comentado | funcional, com auth |
| Preço/disponibilidade | fixo no código | editável pelo cliente |
| Deploy | qualquer host | Cloudflare Workers (SSR) |

---

## Funcionalidades

### Vitrine pública (`/`)
- Busca, filtro por **categoria** (4) e por **disponibilidade** (3), combináveis, com contador e "limpar filtros"
- Cards com preço, unidade, badge de disponibilidade, tamanhos e cores
- **Dialog de produto** com galeria, thumbnails, zoom, matriz de variantes **tamanho × cor**, compartilhamento via Web Share API e deep-link `?produto=<id>`
- Catálogo ao vivo: `refetchInterval` de 30s. Em falha de rede, **mostra o erro** em vez de exibir disponibilidade velha como se fosse atual
- **Fallback offline**: sem Supabase configurado, a vitrine funciona com `src/data/products.json`
- Deep-link de WhatsApp montado por produto e variante, com mensagem contextual
- `Como funciona` em 5 passos, FAQ em `<details>`, SEO completo (OG/Twitter, canonical, `robots.txt`, `sitemap.xml`)

### Painel administrativo (`/admin`)
- Login Supabase e verificação de permissão lendo `catalog_admins`
- Estatísticas: no catálogo, disponíveis, sob encomenda, ocultos
- CRUD de produtos com **galeria de até 8 fotos**, tamanhos, cores, disponibilidade, prazo e visibilidade
- Editor de variantes tamanho × cor × status (até 100 por produto)
- Ajustes da marca: nome, logo (upload), WhatsApp, Instagram
- Rascunho do formulário persistido em `sessionStorage` para não perder trabalho
- `noindex, nofollow`

---

## Segurança — o backend é o banco

Não existe servidor próprio: **o Supabase é a API**, e a autorização mora no Postgres.

**RLS ativa nas 3 tabelas** (`catalog_admins`, `products`, `brand_settings`):

```sql
grant select on public.products to anon, authenticated;
grant insert, update on public.products to authenticated;
-- nenhum grant de delete: "tirar da vitrine" = desmarcar "mostrar no catálogo"
```

O visitante anônimo só lê produtos com `visible = true`. Escrever exige sessão autenticada **e** presença em `catalog_admins`. Não há `delete` concedido de propósito —oul destroys, and "esconder o `delete` reduz a superfície de erro."

- O front usa **apenas** a chave `publishable`/`anon`. `CONFIGURACAO.md` alerta explicitamente para nunca usar `service_role` no cliente.
- Bucket de fotos é público com limite de 5 MB e 3 MIME types; só o `insert` é restringido a admin.
- Validação de dados em **PL/pgSQL**, com trigger `products_sync_options` que recalcula status, tamanhos e cores a partir das variantes — o banco nunca aceita estado inconsistente.

### Robustez de SSR
`src/server.ts` e `src/start.ts` convertem o 500 engolido pelo h3 numa **página HTML de erro de verdade**; `src/lib/error-capture.ts` recupera o stack original com TTL de 5s. Sem isso, o usuário veria uma página em branco.

### Acessibilidade
`aria-*` nos controles, `role="status"` com `aria-live` nas atualizações de catálogo, retorno de foco ao fechar dialogs, `prefers-reduced-motion` respeitado no CSS.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19.2 + TypeScript 5.8 |
| Framework | TanStack Start (SSR) + TanStack Router (rotas por arquivo) + TanStack Query |
| Build | Vite 8 |
| Estilo | Tailwind CSS 4 (tokens em `@theme inline`) + shadcn/ui (46 componentes, 26 pacotes Radix) |
| Backend | Supabase — Postgres, Auth, Storage |
| Deploy | Nitro → Cloudflare Workers |
| Validação | Zod · `bunfig.toml` com `minimumReleaseAge` (guarda de supply chain) |

---

## Rodar

```bash
bun install
cp .env.example .env.local     # VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
bun run dev
```

Sem as variáveis do Supabase a vitrine sobe com o JSON local e o painel explica que a loja não está conectada (sem simular salvamento). Para ativar de verdade, o passo a passo está em [`CONFIGURACAO.md`](CONFIGURACAO.md):

1. Rodar as 3 migrations + `seed.sql` no SQL Editor
2. Criar a conta em Supabase Auth
3. Inserir o UUID do usuário em `catalog_admins`

```bash
bun run build       # gera .output (nitro/Cloudflare)
bun run preview
```

---

## Dados fictícios

O repositório é público, então **nada de cliente está versionado**:

| Dado | Nesta versão |
|---|---|
| WhatsApp | `5511999999999` (placeholder) |
| Instagram | `encantofeminino.demo` |
| Logo | SVG local (`public/catalog/logo.svg`) |
| Fotos de produto | 12 SVG de demonstração, gerados com o nome e a categoria de cada item |

Os 12 produtos (nome, descrição, preço, cores) são fictícios e servem só para demonstrar o catálogo. As fotos reais foram removidas do repositório — inclusive do histórico, que foi reescrito.

---

## O que ainda não está pronto

Sendo honesto sobre os limites:

- **Não há teste automatizado.** O projeto não tem suíte de testes — o `package.json` não tem script de teste. A validação foi manual e por typecheck.
- **Nenhuma publicação foi feita.** O `CONFIGURACAO.md` registra que o site ainda não foi ao ar, então não há métricas de conversão reais.
- **Depoimentos estão ocultos de propósito.** A seção de depoimentos existe no layout mas só entra no ar quando a cliente fornecer avaliações reais — não foram inventadas.
- **Sem e-mail transacional:** a confirmação de encomenda é toda pelo WhatsApp.
- **Sem i18n:** tudo hardcoded em pt-BR, com `Intl.NumberFormat("pt-BR")` e moeda BRL fixos.
- **Dependências declaradas e não usadas:** `zod`, `date-fns` e `@electric-sql/pglite` estão no `package.json` sem nenhum import no código.

---

## Decisões que valem citar

1. **Não entregar painel falso.** A v1 tinha a tela de admin pronta e comentada. A alternativa era ligar o botão e fingir que funcionava, com `localStorage` que perde dado entre celular e desktop. Preferi expor a limitação no código e construir a v2 com persistência de verdade.
2. **O banco valida, não o formulário.** Variantes, imagens e disponibilidade passam por funções PL/pgSQL e um trigger, então a regra vale para qualquer cliente da API — inclusive se alguém chamar a API direto.
3. **Sem `delete` em produto.** Ocultar resolve o caso e reduz erro.
4. **Falhar visível.** Se o catálogo não atualiza, a interface mostra o erro. Mostrar disponibilidade velha sem avisar é pior que falhar.
5. **Depoimento inventado, nunca.** A seção existe no código e continua oculta até ter avaliação real.

---

## Estrutura

```
├── src/
│   ├── routes/
│   │   ├── index.tsx        # vitrine pública
│   │   └── admin.tsx        # painel administrativo
│   ├── components/ui/       # 46 componentes shadcn/ui
│   ├── components/product-photo.tsx
│   ├── data/
│   │   ├── products.json    # catálogo de fallback (offline)
│   │   ├── product-images.json
│   │   └── catalog.ts       # dados da marca e categorias
│   ├── lib/                 # error-capture, product-options, use-brand
│   ├── server.ts, start.ts  # tratamento de erro no SSR
│   └── styles.css           # tokens Tailwind 4
├── supabase/
│   ├── migrations/          # 3 migrations
│   ├── setup-encanto.sql    # script único consolidado
│   └── seed.sql
├── public/catalog/          # logo + 12 placeholders SVG
└── CONFIGURACAO.md          # passo a passo de instalação
```

---

## Licença

MIT
