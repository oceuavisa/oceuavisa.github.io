# Site mínimo do canal (para as URLs que o Google, a Meta e o TikTok exigem)

> Nasceu em 04/11/2026 porque o Google **não deixa publicar o app OAuth** sem URL de página inicial e de política de privacidade (checklist da ETAPA-31, §2.2.5). É a semente do site da F5 (ETAPA-30); quando houver domínio próprio (`oceuavisa.com.br`), estes arquivos vão para lá sem mudança.

Três páginas estáticas, sem JavaScript, sem cookie, sem dependência externa: `index.html`, `privacidade.html`, `termos.html` (+ a foto de perfil). **Antes de publicar, troque `CONTATO@EXEMPLO` pelo e-mail do canal nos três arquivos** (`grep -l CONTATO@EXEMPLO *.html`).

## Publicar no GitHub Pages (grátis, 15 min, sem domínio)

1. No GitHub, **logado com o e-mail do canal** (crie a conta `oceuavisa` se ainda não existir; assim a URL fica com o nome do canal, sem a JeqTech), crie o repositório **público** `oceuavisa.github.io` (o nome tem de ser exatamente esse).
2. "Add file → Upload files": suba os 4 arquivos desta pasta. Commit.
3. Settings → Pages: Source = "Deploy from a branch", branch `main`, pasta `/ (root)`. Em 1–2 minutos o site responde em `https://oceuavisa.github.io/`.
4. Confira `https://oceuavisa.github.io/privacidade.html`.

## Com domínio próprio (o caso do canal em 04/11: tem domínio, não tem site)

O GitHub Pages serve o site **no seu domínio**, de graça, com HTTPS automático. Depois dos passos acima:

5. No repositório: Settings → Pages → **Custom domain** → digite o domínio (ex.: `oceuavisa.com.br`) → Save. O GitHub cria um arquivo `CNAME` no repositório; deixe.
6. No painel de DNS de quem registrou o domínio (Registro.br: "Editar zona"; ou o provedor de DNS que você usa), crie:
   - **4 registros `A`** no domínio raiz (`@`), um para cada IP do GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`;
   - **1 registro `CNAME`** em `www` apontando para `oceuavisa.github.io` (ou o nome da conta que criou o repositório, `<conta>.github.io`).
7. Espere a propagação (minutos a algumas horas). Em Settings → Pages, quando aparecer "DNS check successful", marque **Enforce HTTPS**.
8. Confira `https://<dominio>/privacidade.html`.

(Conferir: os 4 IPs são os publicados na documentação do GitHub Pages em 2026; se a página de configuração mostrar outros, use os da página.)

## Depois, no Google Cloud (Google Auth Platform → Branding)

Com domínio próprio (recomendado):

- Página inicial do app: `https://<dominio>/`
- Política de privacidade: `https://<dominio>/privacidade.html`
- Termos de serviço: `https://<dominio>/termos.html`
- **Domínios autorizados:** `<dominio>`
- Depois: Audience → **Publish app**.

Sem domínio (plano B): as mesmas URLs em `https://oceuavisa.github.io/…` e o domínio autorizado `oceuavisa.github.io` (o `github.io` está na lista de sufixos públicos, então o subdomínio conta como domínio próprio; se o Google recusar, só com domínio).

As mesmas URLs servem para o app na Meta e no TikTok (que também pedem política e termos), e o domínio próprio é o que o TikTok verifica (registro `TXT` no DNS) antes da auditoria.
