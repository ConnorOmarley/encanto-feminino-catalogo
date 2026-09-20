# Encanto Feminino — ativação do catálogo e painel

A página pública está em `/` e o painel da cliente em `/admin`.

## Estado atual

- Sem configuração de Supabase, a página usa `src/data/products.json`, importado do projeto anterior. O painel explica que falta conectar a loja e não simula salvamentos.
- Com Supabase configurado, o catálogo lê o banco compartilhado e consulta atualizações a cada 30 segundos enquanto a página está aberta. Ao voltar à aba, também atualiza.
- Se a consulta falhar, a página informa o erro em vez de exibir disponibilidade antiga como se fosse atual.
- Logo, contatos, fotos principais e preços foram reaproveitados do projeto Encanto_feminino. A logo e as 12 fotos foram copiadas para `public/catalog` para evitar dependência dos links externos na vitrine. Há imagens de referência no cadastro antigo; não foi possível comprovar que todas sejam fotografias próprias. Conferir com a cliente antes de publicar.
- O visual, os textos e a organização da landing page seguem o modelo original do Lovable. Foram substituídos a logo, as fotos e os contatos; os cards exibem os produtos e a disponibilidade da cliente.
- A seção de depoimentos do modelo foi preservada e identificada como ilustrativa. Substituir os exemplos por avaliações reais antes de publicar. As fotos extras do Pexels não foram importadas.

## Conectar uma conta Supabase

1. Crie ou escolha o projeto Supabase da loja.
2. Execute `supabase/migrations/202609200001_catalog.sql` no editor SQL desse projeto. Isso cria produtos, a lista de administradoras e o armazenamento de imagens com controle de acesso. Depois execute `202609200002_product_options.sql` (tamanhos, cores, várias fotos) e `202609200003_brand_settings.sql` (nome, logo, WhatsApp e Instagram editáveis no painel).
3. Execute `supabase/seed.sql` para importar o catálogo inicial. Ele não sobrescreve produtos com os mesmos IDs.
4. Crie a conta da cliente em Authentication > Users usando o e-mail dela e uma senha definida de forma privada. Não existe cadastro público pelo site.
5. Copie o UUID da conta criada e execute:

```sql
insert into public.catalog_admins (user_id)
values ('UUID-DA-CONTA-DA-CLIENTE');
```

6. Copie `.env.example` para `.env.local` e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (a chave pública do projeto). `VITE_SUPABASE_ANON_KEY` também é aceito. Nunca use a chave service_role ou uma chave secreta no frontend.
7. Configure essas mesmas variáveis no ambiente que publica o site e gere uma nova versão. Para teste local, reinicie o servidor após alterar as variáveis.
8. Acesse `/admin`, entre com a conta autorizada e confira os produtos.

O acesso de edição depende da tabela `catalog_admins`. Uma conta autenticada que não está nessa lista não pode alterar produtos ou enviar fotos. Visitantes só leem produtos visíveis. A API não concede exclusão: para retirar um produto da vitrine, desmarque “Mostrar no catálogo”.

## Uso pela cliente

- “Adicionar produto”: nome, categoria, preço, descrição, foto, tamanhos e cores.
- “Editar”: alterar os dados, substituir a foto ou atualizar a disponibilidade.
- “Disponível”: produto para pronta entrega.
- “Sob encomenda”: pedido sujeito a prazo combinado.
- “Indisponível”: permanece visível, mas sem botão de pedido.
- “Mostrar no catálogo”: desmarcar oculta o produto.
- “Ajustes da marca”: nome, logo, WhatsApp e Instagram exibidos no site inteiro. A logo nova é enviada como imagem e substitui a atual ao salvar. O catálogo público atualiza sozinho.
- Fotos: JPG, PNG ou WebP de até 5 MB.

## Conferência antes da divulgação

- Confirmar nome da marca, logo, WhatsApp, Instagram, preços, fotografias, cores, tamanhos e disponibilidade com a cliente.
- Validar login autorizado e bloqueio de uma conta sem permissão.
- Salvar uma alteração pelo painel e confirmar o resultado em outro navegador sem login.
- Conferir upload de imagem, item oculto e os três status de disponibilidade.
- Publicar pelo fluxo já usado no Lovable. Nenhuma publicação ou reescrita de histórico Git foi feita nesta etapa.

Referências da integração: https://supabase.com/docs/guides/database/postgres/row-level-security e https://supabase.com/docs/guides/storage/security/access-control.

## Navegação da coleção

As categorias filtram a coleção e mostram a quantidade de produtos visíveis. A busca ignora acentos e pode ser combinada com categoria e disponibilidade. “Limpar filtros” retorna à coleção completa. Cada produto tem detalhes expansíveis com descrição, tamanhos e opções. O menu no celular dá acesso às seções sem mudar o layout do modelo.
