# 🍕 Pizzas Viver Canoas — Sistema de Fidelidade (v2, direto no Supabase)

Cartão fidelidade digital + painel administrativo + gerador de pedidos para WhatsApp.
Next.js (App Router) + TypeScript + Supabase (banco + autenticação), pronto para deploy no Vercel.

Esta versão **não usa Prisma nem NextAuth** — tudo (tabelas, login do admin, dados) vive
direto no Supabase, e você pode mexer em qualquer coisa pelo painel deles a qualquer momento.

---

## 1. Crie o projeto no Supabase

Crie uma conta em https://supabase.com e um novo projeto (plano gratuito serve).

## 2. Rode o script SQL (cria todas as tabelas)

1. No painel do seu projeto, abra **SQL Editor** (ícone no menu lateral) → **New query**.
2. Abra o arquivo `sql/schema.sql` deste projeto, copie todo o conteúdo e cole lá.
3. Clique em **Run**.

Isso cria as tabelas `customers`, `loyalty_transactions`, `products`, `orders`, `settings`,
já com os 3 sabores iniciais e uma configuração padrão — tudo em um passo só.

Depois, sempre que quiser **ver ou editar os dados na unha**, use o **Table Editor** do
próprio Supabase (menu lateral) — não precisa passar pelo painel admin da aplicação.

## 3. Crie o usuário administrador

1. No menu lateral, vá em **Authentication → Users**.
2. Clique em **Add user → Create new user**.
3. Preencha e-mail e senha (essas serão as credenciais de login do `/admin`) e marque
   **Auto Confirm User** (assim não precisa confirmar por e-mail).

Pronto — não tem hash pra gerar, não tem variável de senha no `.env`. Se quiser trocar a
senha depois, ou adicionar um segundo administrador, é só voltar nessa tela.

## 4. Pegue as chaves da API

Em **Project Settings → API**, copie:

- **Project URL** → vai em `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (clique em "Reveal" para ver) → vai em `SUPABASE_SERVICE_ROLE_KEY`

⚠️ A `service_role key` dá acesso total ao banco — nunca cole ela em código que roda no
navegador, nunca suba ela pro GitHub. Neste projeto ela só é usada dentro das rotas de API
(`src/app/api/**`), que rodam no servidor.

## 5. Configure o `.env`

```bash
cp .env.example .env
```

Cole os 3 valores do passo 4, e deixe `NEXT_PUBLIC_BASE_URL="http://localhost:3000"` em dev.

## 6. Instale e rode

```bash
npm install
npm run dev
```

- Painel admin: http://localhost:3000/admin (login com o e-mail/senha do passo 3)
- Cartão de um cliente: cadastre um cliente no painel e clique em **"Enviar link"** para abrir o WhatsApp com a mensagem e o acesso do cliente.
  outra aba (ou no celular)

---

## 7. Deploy no Vercel

1. Suba este projeto para um repositório no GitHub.
2. Em https://vercel.com → **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, cole as mesmas 4 variáveis do seu `.env`, trocando
   `NEXT_PUBLIC_BASE_URL` pela URL que a Vercel vai te dar (ex:
   `https://atelier-do-pao.vercel.app`).
4. Clique em **Deploy**.

Não precisa rodar migration nenhuma antes do deploy — as tabelas já existem no Supabase
desde o passo 2, e o mesmo banco é usado tanto em dev quanto em produção.

---

## Estrutura do projeto

```
sql/
  schema.sql                      → script único que cria todas as tabelas no Supabase
src/
  app/
    page.tsx                      → página inicial simples
    fidelidade/[token]/page.tsx    → cartão do cliente (público, via token)
    admin/
      page.tsx                    → dashboard (protegido pelo middleware)
      login/page.tsx              → login do admin (Supabase Auth)
    api/
      customers/                  → listar/cadastrar clientes (admin)
      customers/[id]/actions/     → +1 / −1 / resgatar recompensa (admin)
      customers/[id]/history/     → histórico de fidelidade (admin)
      settings/                   → telefone do WhatsApp do negócio (admin)
      public/orders/               → registra o pedido do cliente (sem login, valida pelo token)
  components/
    CustomerCard.tsx               → cartão + modal de pedido (cliente)
    AdminDashboard.tsx             → tabela de clientes + ações (admin)
  lib/
    supabase/
      client.ts                   → cliente do navegador (só usado no login)
      server.ts                   → cliente de sessão (checa quem está logado)
      admin.ts                    → cliente com service_role (todas as consultas de dados)
    whatsapp.ts                    → geração da mensagem e link do WhatsApp
    notifications.ts               → abstração para notificação automática (ver abaixo)
    require-admin.ts               → helper usado em toda rota de API protegida
  middleware.ts                    → protege /admin, exceto /admin/login
```

## Sobre a integração futura com WhatsApp Business API

`src/lib/notifications.ts` isola toda notificação automática atrás de uma interface
(`NotificationService`). Hoje ela só registra um `console.log` no servidor sempre que:

- o admin adiciona um ponto (`notifyLoyaltyUpdate`)
- o cliente atinge 10/10 (`notifyRewardUnlocked`)

Quando a integração real estiver pronta, crie uma nova classe implementando a mesma
interface e troque o retorno de `getNotificationService()` — nenhuma outra parte do código
precisa mudar.

## Segurança

- Row Level Security (RLS) está ligado em todas as tabelas, sem nenhuma policy — ou seja,
  só a `service_role key` (usada exclusivamente no servidor) consegue ler ou escrever
  qualquer dado. O navegador nunca fala direto com o banco.
- O cliente nunca altera pontos: todas as rotas de fidelidade exigem um admin logado
  (`requireAdminUser`).
- O token do cliente é gerado com `nanoid(21)` (~126 bits de entropia) — não é adivinhável.
- A rota pública de pedido (`/api/public/orders`) só registra o pedido para conferência;
  ela nunca adiciona pontos de fidelidade.

## O que ainda não está implementado (por design, ver o MVP do briefing)

- Pagamento/checkout — o WhatsApp continua sendo o canal de venda.
- Envio automático real de WhatsApp — hoje é uma abstração pronta para plugar depois.
- Login do cliente — acesso é sempre via link único, sem conta.
