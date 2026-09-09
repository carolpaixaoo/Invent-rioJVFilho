# Inventário — JV Filho Engenharia

Sistema de inventário, equipamentos locados e relatório semanal, para a equipe usar
direto pelo navegador (computador ou celular), sem precisar do Claude.

Este guia assume que você nunca publicou um site antes. Leva uns 20-30 minutos, é
gratuito, e não precisa saber programar — só seguir os passos.

## O que vamos usar (ambos gratuitos para esse tamanho de equipe)

- **Supabase** — o banco de dados onde ficam salvos os itens, locações e movimentações.
- **Vercel** — onde o site fica hospedado, com um link pra acessar.

---

## Passo 1 — Criar o banco de dados no Supabase

1. Acesse **https://supabase.com** e crie uma conta gratuita (dá pra entrar com GitHub ou Google).
2. Clique em **New project**. Dê um nome (ex.: `jvfilho-inventario`), crie uma senha
   para o banco (guarde essa senha em local seguro) e escolha a região mais próxima
   (ex.: São Paulo/`sa-east-1`).
3. Espere o projeto terminar de ser criado (1-2 minutos).
4. No menu lateral, clique em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` (está junto com esse projeto), copie todo o
   conteúdo, cole no editor do Supabase e clique em **Run**. Isso cria as tabelas e
   já deixa tudo protegido (só quem faz login consegue ver os dados).
6. No menu lateral, vá em **Project Settings** → **API**. Anote dois valores que
   vamos usar no Passo 3:
   - **Project URL**
   - **anon public key**

## Passo 2 — Criar os usuários da equipe (2 a 5 pessoas)

1. No Supabase, vá em **Authentication** → **Users**.
2. Clique em **Add user** → **Create new user**.
3. Preencha o e-mail e uma senha provisória para cada pessoa da equipe (repita para
   cada uma das 2-5 pessoas). Marque a opção de já confirmar o e-mail automaticamente
   (**Auto Confirm User**), já que não vamos configurar envio de e-mail agora.
4. Avise cada pessoa da senha provisória — elas podem trocar depois (se quiser, no
   futuro dá pra adicionar uma tela de "esqueci minha senha").

Não existe cadastro público nesse sistema — só quem você criar aqui consegue entrar.

## Passo 3 — Configurar o projeto com os dados do Supabase

1. Dentro da pasta do projeto, copie o arquivo `.env.example` e renomeie a cópia
   para `.env`.
2. Abra o `.env` e preencha com os dois valores que você anotou no Passo 1:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

## Passo 4 — Testar localmente (opcional, mas recomendado)

Se tiver o [Node.js](https://nodejs.org) instalado no computador:

```bash
npm install
npm run dev
```

Abra o link que aparecer no terminal (geralmente `http://localhost:5173`) e faça
login com um dos usuários que você criou no Passo 2. Se tudo estiver certo, você já
consegue cadastrar uma obra e testar o sistema antes de publicar.

## Passo 5 — Publicar no ar com a Vercel

1. Crie uma conta gratuita em **https://vercel.com** (pode entrar com GitHub).
2. Se ainda não tiver, crie uma conta no **https://github.com** e suba essa pasta
   do projeto como um novo repositório (dá pra fazer isso direto pelo site do GitHub,
   arrastando os arquivos, sem usar linha de comando).
3. Na Vercel, clique em **Add New → Project**, escolha o repositório que você acabou
   de criar no GitHub e clique em **Import**.
4. Antes de clicar em Deploy, abra **Environment Variables** e adicione as mesmas
   duas variáveis do `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**. Em 1-2 minutos, a Vercel te dá um link (algo como
   `jvfilho-inventario.vercel.app`) que já pode ser acessado por qualquer pessoa da
   equipe, em qualquer dispositivo.

## Passo 6 — Ativar o "mantenha vivo" do Supabase (recomendado)

O plano gratuito do Supabase pausa o projeto depois de 7 dias sem nenhuma atividade
(os dados não somem, só fica temporariamente inacessível até alguém entrar no painel
e clicar em "restore"). Pra vocês nunca precisarem se preocupar com isso, esse projeto
já vem com uma automação gratuita que "acorda" o banco sozinha a cada 5 dias, usando o
GitHub Actions (incluído de graça em qualquer repositório).

1. No GitHub, dentro do repositório que você criou no Passo 5, vá em **Settings →
   Secrets and variables → Actions**.
2. Clique em **New repository secret** e adicione dois segredos, com os mesmos
   valores que você usou no `.env`:
   - Nome `SUPABASE_URL`, valor: sua Project URL do Supabase.
   - Nome `SUPABASE_ANON_KEY`, valor: sua anon public key do Supabase.
3. Pronto — o arquivo `.github/workflows/keep-alive.yml` já está configurado pra
   rodar automaticamente a cada 5 dias. Se quiser testar na hora, vá na aba
   **Actions** do repositório, clique em **Manter Supabase ativo** e depois em
   **Run workflow**.

## Passo 7 — Domínio próprio (opcional)

Se um dia vocês quiserem um endereço como `inventario.jvfilhoengenharia.com.br`, na
Vercel vá em **Project → Settings → Domains** e siga as instruções — normalmente é
só apontar o domínio que vocês já têm (ou comprar um novo) para lá.

---

## Como funciona no dia a dia

- Cada pessoa da equipe entra com seu e-mail e senha.
- A obra ativa fica salva no navegador de cada pessoa (cada um pode estar olhando
  uma obra diferente, se vocês tiverem mais de uma).
- Os dados (itens, locações, movimentações) ficam salvos no banco e são
  compartilhados entre todo mundo da equipe em tempo real ao atualizar a página.
- O relatório semanal (aba "Relatório") já sai filtrado pela obra ativa.

## Se algo der errado

- **Tela de login não aparece / erro de conexão**: confira se `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY` estão certinhos, sem espaços extras, tanto no `.env`
  local quanto nas variáveis de ambiente da Vercel.
- **Login não funciona**: confirme que o usuário foi criado no Supabase com
  "Auto Confirm User" marcado.
- **Dados não aparecem**: confira se o script `supabase/schema.sql` rodou sem erro
  no SQL Editor (deve aparecer "Success" no final).
