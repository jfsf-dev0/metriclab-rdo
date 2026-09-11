# Session Log — MetricLab RDO (PWA)

## Data: 09 de Setembro de 2026

### Objetivo
Criação do novo repositório e PWA completo de Relatório Diário de Obra (RDO) de campo para o Consórcio Lote 15 & 19 da MetricLab, com deploy em `rdo.metriclab.com.br` (Vercel + Cloudflare DNS CNAME), integrado ao Supabase `keadkoqnvabhyxbrfjax` e com automações N8N via Evolution API.

---

### Stack Tecnológica
- **Framework**: Next.js 14 App Router, TypeScript, React 18
- **Estilização**: Tailwind CSS com paleta clara oficial do `gestao.metriclab.com.br` (Fundo `#ffffff`, cards com bordas suaves, botões primários `#2563eb`)
- **Ícones**: Lucide React
- **PWA**: Web App Manifest (`manifest.json`), ícones de alta resolução 192x192 e 512x512
- **Leitura de Crachá**: Leitura automática de QR Code via biblioteca `jsQR`
- **Assinatura Digital**: Canvas interativo touch com traço `#1e3a5f`
- **Geolocalização**: Geolocation API com coordenadas georreferenciadas
- **Backend & Database**: Supabase PostgreSQL (`keadkoqnvabhyxbrfjax`) + Storage Bucket `demo-rdo-fotos`
- **Automação**: N8N Workflows para notificação WhatsApp via Evolution API

---

### Migrations e Banco de Dados (Supabase `keadkoqnvabhyxbrfjax`)
Executadas com sucesso via PostgreSQL direto:
- `demo_rdo_usuarios`: Usuários e encarregados/supervisores com chave de acesso
- `demo_rdo_registros`: Registros diários com dados de clima, turno, atividades, equipe, máquinas, fotos e assinatura
- `demo_rdo_ocorrencias`: Ocorrências de campo (acidente, quase-acidente, ambiental, patrimonial, operacional, outro) com gravidade e geolocalização
- `demo_rdo_equipe_membros`: Membros da equipe registrados via crachá QR ou manual
- `demo_rdo_maquinas_catalogo`: Catálogo de equipamentos da frota
- `demo_rdo_maquinas_check`: Checklist diário de equipamentos (operando, parada, manutenção, ausente)
- Políticas RLS públicas para operação da demonstração
- Storage Bucket `demo-rdo-fotos` criado com permissões públicas de leitura e gravação
- Seed dos usuários e máquinas demonstrativas inseridos

---

### Telas do PWA Implementadas
1. **Tela 1 — Splash (`/`)**:
   - Fundo branco limpo, logo MetricLab SVG centralizado
   - Tipografia bold display `"15 & 19"` em destaque (15 em `#2563eb`, & em `gray-400`, 19 em `gray-900`)
   - Subtítulo "Relatório Diário de Obra" e botão "ENTRAR" full-width
2. **Tela 2 — Login (`/login`)**:
   - Card centralizado com campos de Nome e Chave de Acesso
   - Validação com busca em `demo_rdo_usuarios`
   - Armazenamento de sessão em `localStorage` e Cookie `ml_rdo_session`
   - Atalhos rápidos de demonstração para os 4 perfis cadastrados
3. **Tela 3 — Menu Principal (`/menu`)**:
   - Header fixo com saudação e badge do pacote (Lote 15 / Lote 19)
   - Card com dados do encarregado, trecho vinculado e data de hoje
   - Botão 1: Registrar Ocorrência (`/ocorrencia`)
   - Botão 2: Fazer RDO (`/rdo/novo`), com detecção automática se já foi enviado hoje (redirecionando para visualização `/rdo/[id]`)
4. **Tela 4A — Nova Ocorrência (`/ocorrencia`)**:
   - Classificação em 6 tipos com botões visuais
   - 4 níveis de gravidade (baixa, média, alta, crítica)
   - Descrição detalhada e envio de fotos para Storage
   - Captura de GPS e disparo de webhook para `n8n.metriclab.com.br/webhook/rdo-ocorrencia`
5. **Tela 4B — RDO 5 Passos (`/rdo/novo`)**:
   - **Passo 1 (Identificação)**: Trecho, turno (Manhã, Tarde, Noite) e captura climática
   - **Passo 2 (Equipe)**: Fotografia de crachá com leitor QR Code (`jsQR`), extração de dados e fallback manual
   - **Passo 3 (Máquinas)**: Checklist dos 8 equipamentos do catálogo com 4 status compactos e campo de observação
   - **Passo 4 (Fotos do Dia)**: Upload de fotos de frentes de serviço e campo de descrição das atividades
   - **Passo 5 (Assinatura)**: Resumo consolidado, canvas touch de assinatura digital e geolocalização confirmada
6. **Tela 5 — Confirmação (`/rdo/[id]/confirmacao`)**:
   - Ícone de sucesso verde grande animado
   - Resumo detalhado dos dados gravados e georreferenciamento
   - Linha do tempo de notificações enviadas ao supervisor
7. **Tela de Visualização (`/rdo/[id]`)**:
   - Consulta detalhada do RDO para encarregados e supervisores

---

### Workflows N8N Criados
1. `n8n-workflows/WF-RDO-001-rdo-enviado.json`: Notificação via Evolution API ao supervisor do trecho com resumo do RDO e auto-aprovação.
2. `n8n-workflows/WF-RDO-002-ocorrencia.json`: Roteamento condicional por gravidade (Crítica/Alta x Média/Baixa) com disparo de alerta no WhatsApp do responsável.

---

### Infraestrutura e Deploy
- **Cloudflare DNS**: CNAME criado `rdo.metriclab.com.br` -> `cname.vercel-dns.com` (DNS Only / proxied: false).
- **GitHub**: Repositório `jfsf-dev0/metriclab-rdo`.
- **Vercel**: Deploy de produção vinculado ao domínio `rdo.metriclab.com.br`.

---

## 09 de Setembro de 2026 — Refatoração Design System 2.0 (Runway + Linear — Accordion Lists)
- **Implementação dos tokens de cor**: `--canvas: #F7F7F5`, `--surface: #FFFFFF`, `--hairline: #E5E5E3`, `--hairline-soft: #EFEFED`, `--ink: #111111`, `--ink-soft: #3A3A3A`, `--graphite: #6B6B6B`, `--stone: #9B9B9B`, `--ash: #C4C4C2`, `--accent: #F5A623`.
- **Layout Splash (`/`)**: Proporção 20%/50%/30%, logo `m.` 36px, Display `Pacote 15 e 19` 72px weight 500, botão preto 48px.
- **Login (`/login`)**: Tipografia precisa, inputs underline, remoção de botões rápidos demo, foco estritamente corporativo.
- **Menu (`/menu`)**: Layout flat em `--canvas`, accordion para "Registrar Ocorrência" e "Relatório Diário de Obra" com status dinâmico.
- **Ocorrência (`/ocorrencia`)**: Accordion para os 6 tipos de ocorrência (1 aberto por vez), 4 botões planos de gravidade, textarea underline, GPS texto puro.
- **RDO Novo (`/rdo/novo`)**: Fluxo em 5 passos com barra de progresso fina de 2px; crachá QR com câmera e membros em accordion; máquinas em accordion com 4 estados inline e observação underline; assinatura em canvas touch com GPS texto puro e resumo flat.
- **Confirmação (`/rdo/[id]/confirmacao`)**: Fundo `--canvas`, sem header, eyebrow ENVIADO, subtítulo 20px 400, lista flat com divisores hairline, botão preto 48px.
- **Build**: Next.js 14 production build testado e validado com sucesso (código 0).

---

## 10 de Setembro de 2026 — Fluxo de Login Unificado com Gestão (Chave + Código Único)
- **Design System & Layout**:
  - Fundo `#F0F0F0`, card centralizado `bg-white`, border 1px `#E5E5E3`, radius 12px, padding 32px, max-width 380px.
  - Logo `m.` com ponto `#F5A623`, título "Relatório Diário de Obra" e subtítulo "Pacote 15 e 19".
- **Fluxo com 3 Estados**:
  - **Estado 1 (Inicial)**: Campo underline "Nome do Usuário", dois botões lado a lado ("Entrar com chave" e "Código único"), divisor "ou" e botão preto full-width "Entrar".
  - **Estado 2A (Chave)**: Campo com chave de acesso (password, hint Demo: 123456 ou RDO001), validação com bypass demo 123456/RDO e consulta na tabela `demo_rdo_usuarios`. Shake animation caso inválido.
  - **Estado 2B (Código Único)**: Mensagem "Enviamos um código para...", campo de 6 dígitos com espaçamento monospace, bypass 123456 para demo e botão "Confirmar".
- **Splash (`/`)**:
  - Fundo `#F0F0F0`, display "Pacote 15 e 19", eyebrow "PROPOSTA", subtítulo "Relatório Diário de Obra" e botão "Entrar" full-width.
- **Build & Verificação**:
  - `npm run build` executado com 0 erros TypeScript.

---

### Implementação PWA Mobile Features (RFP: PWA-MOBILE-FEATURES-01)
- **1. Notificações Push**:
  - Solicitação de permissão de notificações nativas no primeiro acesso mobile via `PwaManager`.
  - Service Worker implementado em `public/sw.js` com listeners de eventos `push` (notificação rica com vibração, ícone e badge) e `notificationclick` (abertura/foco de aba).
  - Utilitário TypeScript `lib/pushNotifications.ts` com funções reutilizáveis:
    - `isPushSupported()`, `getNotificationPermission()`, `requestNotificationPermission()`.
    - `subscribeUserToPush(userId, contratoId)`: converte VAPID key para Uint8Array e registra inscrição push.
    - `sendNotification(title, body, data)`: dispara notificação local via Service Worker e remota via API.
  - Endpoint de API `app/api/pwa/subscription/route.ts` para persistência na tabela Supabase `pwa_subscriptions`.
  - Migration SQL `supabase/migrations/20260910000001_create_pwa_subscriptions.sql` com schema e RLS da tabela `pwa_subscriptions (id, user_id, contrato_id, endpoint, keys, created_at, updated_at)`.
  - Endpoint de integração `app/api/pwa/send-notification/route.ts` enviando payload para webhook do N8N (`N8N_PUSH_WEBHOOK_URL`).
  - Workflow exportável N8N criado em `n8n-workflows/WF-PWA-001-push-notifications.json`.

- **2. Bloqueio de Acesso por Computador**:
  - Middleware Next.js (`middleware.ts`) com detecção de User-Agent desktop aplicando bloqueio estritamente nas rotas protegidas (`/rdo/*`).
  - Exceção para PWA standalone: se acessado com `display-mode: standalone` ou cookie `ml_pwa_standalone=true` ou query param `?mode=standalone`, o acesso é liberado normalmente.
  - Redirecionamento 307 para página dedicada `/desktop-blocked` com a mensagem exata:
    *"Este sistema é exclusivo para acesso mobile. Acesse pelo seu celular."*
  - Página `/desktop-blocked` desenhada no Design System MetricLab 2.0 (fundo `#F0F0F0`, card centralizado `#FFFFFF`, borda `#E5E5E3`, QR Code SVG inline escaneável para abrir o sistema no celular).

- **3. Banner "Adicionar à tela inicial" (PWA Install Banner)**:
  - Componente `components/pwa/PwaInstallBanner.tsx` capturando evento nativo do navegador `beforeinstallprompt`.
  - Estilização estrita no Design System MetricLab 2.0: fundo `#F0F0F0`, surface card `#FFFFFF`, borda `#E5E5E3`, botão preto `#111111`, tipografia Inter, sem emojis.
  - Exibição condicional: browser compatível com PWA, fora do modo standalone, em dispositivos mobile e não dispensado anteriormente.
  - Suporte com instruções para iOS Safari ("Compartilhar -> Adicionar à Tela de Início").
  - Persistência de dispensa no `localStorage` sob `ml_pwa_install_banner_dismissed`.
  - Integração no `app/layout.tsx` através do `<PwaManager />`.

---

### Bloqueio Total de Desktop em Todas as Telas (`/login`, `/`, `/menu`, `/rdo`, etc.)
- **Problema**: O link `/login` e a rota raiz `/` ainda eram acessíveis no desktop porque a regra anterior limitava-se a `/rdo/*`.
- **Solução Implementada**:
  - `middleware.ts`: Configuração do matcher global para interceptar todas as requisições à aplicação (exceto assets estáticos `_next`, `api`, `favicon.ico`, `sw.js`, `manifest.json` e a própria página `/desktop-blocked`).
  - Bloqueio imediato no middleware com redirecionamento HTTP 307 para `/desktop-blocked` em qualquer tela (`/login`, `/`, `/menu`, `/rdo`, `/ocorrencia`, etc.) se o acesso for desktop e fora do modo standalone.
  - `PwaManager.tsx`: Adicionada proteção dupla no cliente (hydration guard) para redirecionar instantaneamente para `/desktop-blocked` caso ocorra renderização em navegador desktop sem modo standalone.
  - `app/desktop-blocked/page.tsx`: Se acessado por dispositivo móvel, redireciona automaticamente para `/login`; se em modo standalone no computador, redireciona para `/login`.

---

### Redesenho da Página /desktop-blocked (Tela Completa & QR Code Funcional)
- **Layout Desktop Tela Completa**:
  - Removido formato de "card mobile" centralizado; implementado layout desktop completo, imersivo e profissional no Design System MetricLab 2.0.
  - Header superior institucional com logo `m.`, divisor vertical, nome do produto e badge "Acesso Exclusivo Mobile".
  - Grid de 2 colunas:
    - **Coluna Esquerda**: Eyebrow "Dispositivo Não Suportado", título "Este sistema é exclusivo para acesso mobile. Acesse pelo seu celular.", contexto sobre controle de frentes de obra e 3 cards de recursos (Lançamento Diário, Ocorrências, Modo Offline), além de botão para copiar o link.
    - **Coluna Direita**: Card de destaque com QR Code real em alta definição.
- **QR Code Real & Funcional**:
  - Integração da biblioteca `qrcode` para renderização de QR Code escaneável codificando `https://rdo.metriclab.com.br`.
  - Fallback vetorial SVG instantâneo.
- **Limpeza de Texto**:
  - Removida completamente a frase "Se você instalou o app como PWA no seu computador, abra-o pela janela do aplicativo instalado para liberar o acesso.".
- **Expansão em Tela Cheia no Root Layout (`app/layout.tsx`)**:
  - Removido `max-w-md mx-auto`, `items-center` e bordas laterais simulando celular no desktop.
  - O root layout agora possui `w-full min-h-screen flex flex-col`, expandindo para 100% da largura da tela no computador com os avisos e QR Code destacados.

---

### Padronização de Favicons na Identidade Visual MetricLab (Fundo Claro `m.`)
- **Estética MetricLab 2.0**:
  - Ícone com fundo claro (`#FFFFFF`), cantos arredondados (squircle `rx="14"`), borda hairline sutil (`#E5E5E3`), letra `m` geométrica em negrito `#111111` e ponto `.` em laranja MetricLab `#F5A623`.
  - Visibilidade perfeita tanto em abas de navegadores no modo escuro quanto no modo claro.
- **Arquivos Gerados & Substituídos**:
  - `public/favicon.svg` (SVG vetorial escalável para navegadores modernos).
  - `public/favicon.ico` e `app/favicon.ico` (multi-resolução 16x16 e 32x32 para navegadores legados e Next.js App Router).
  - `public/favicon.png` (32x32).
  - `public/apple-touch-icon.png` (180x180 para iOS).
  - `public/icon-192.png` e `public/icon-512.png` (resoluções PWA de alta definição substituindo os ícones azuis antigos).
- **Metadata (`app/layout.tsx`)**:
  - `metadata.icons` configurado com referências completas a `favicon.ico`, `favicon.svg`, `icon-192.png` e `apple-touch-icon.png`.

---

### Unificação do Fluxo e Padrão de Acesso PWA (4 Etapas Progressivas em Tela Única)
- **Eliminação de Splash Separada (`app/page.tsx`)**:
  - Substituída a tela de splash duplicada por redirecionamento direto (`redirect('/login')`), unificando 100% o ponto de entrada da aplicação.
- **Refatoração do Login (`app/login/page.tsx`)**:
  - Implementado o mesmo padrão arquitetural e visual de Vistoria Cautelar com 4 etapas progressivas dentro de card centralizado único:
    - **Etapa 0 (Entrada)**: Logo `m.` (28px bold, ponto `#F5A623`), título "Relatório Diário de Obra" (22px bold `#111111`), subtítulo "Pacote 15 e 19" (13px `#9B9B9B`) e botão "Entrar" full-width.
    - **Etapa 1 (Identificador)**: Input underline sem caixa com placeholder `seu@email.com, telefone ou usuário` e link "← Voltar".
    - **Etapa 2 (Seleção de Método)**: Exibição automática ao digitar de dois botões de método: "Entrar com chave" (ícone Lock) e "Código único" (ícone Smartphone).
    - **Etapa 3 (Validação de Código)**: Campo com código de 6 dígitos, suporte ao bypass demo `123456` e códigos `RDO*`, e consulta à tabela `demo_rdo_usuarios` no Supabase com shake animation em caso de falha.
- **Utilitário de Autenticação (`lib/auth.ts`)**:
  - Criado helper tipado unificado `UserSession`, `getSession()`, `setSession()` e `clearSession()`, persistindo simultaneamente no `localStorage` e cookies HTTP com SameSite Lax.

---

### Open Graph Meta Tags e Imagem Social para WhatsApp (og-image.jpg)
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Configuração de meta tags Open Graph e Twitter Cards, e geração da imagem social (`og-image.jpg`) de 1200x630px para compartilhamento rico no WhatsApp e redes sociais.
- **Implementação Técnica**:
  - `app/layout.tsx`:
    - Adicionado objeto `openGraph` e `twitter` na exportação `metadata: Metadata` com `metadataBase: new URL('https://rdo.metriclab.com.br')`.
    - Adicionadas tags `<meta property="og:..." />` e `<meta name="twitter:..." />` estáticas no `<head>` para compatibilidade 100% com o scraper do WhatsApp e crawlers sem execução JavaScript.
    - Tags configuradas:
      - `og:title`: "RDO Digital · MetricLab"
      - `og:description`: "Diário de obra preenchido em campo e consolidado automaticamente no painel do supervisor. Acesse pelo celular."
      - `og:image`: "https://rdo.metriclab.com.br/og-image.jpg"
      - `og:url`: "https://rdo.metriclab.com.br"
      - `og:type`: "website"
      - `og:site_name`: "MetricLab"
      - `twitter:card`: "summary_large_image"
      - `twitter:title`: "RDO Digital · MetricLab"
      - `twitter:description`: "Diário de obra preenchido em campo e consolidado automaticamente no painel do supervisor."
      - `twitter:image`: "https://rdo.metriclab.com.br/og-image.jpg"
  - `public/og-image.jpg`:
    - Dimensões: 1200 x 630px em formato JPEG.
    - Fundo branco (`#FFFFFF`), barra superior de 8px em laranja MetricLab (`#F5A623`).
    - Top-left: Logo `m.` (`m` em `#111111`, `.` em `#F5A623`) + "MetricLab" em negrito.
    - Centro: Título "RDO Digital" (Inter Bold 72px `#111111`) e subtítulo "Diário de obra · Campo conectado ao painel em tempo real" (Inter Regular 28px `#6B7280`).
    - Rodapé direito: URL "rdo.metriclab.com.br" (Inter 20px `#F5A623`).
  - **Correção de Redirecionamento e Crawlers (WhatsApp / Facebook External Hit)**:
    - Identificado que o scraper da Meta/WhatsApp (`facebookexternalhit/1.1` e `WhatsApp/*`) era detectado como dispositivo desktop pelo middleware e recebia redirecionamento HTTP 307 para `/desktop-blocked`, impossibilitando a leitura das meta tags Open Graph e da imagem.
    - Adicionado bypass explícito no `middleware.ts` para robôs de preview social (`WhatsApp`, `facebookexternalhit`, `Facebot`, `Twitterbot`, `LinkedInBot`, `TelegramBot`, `Slackbot`, `meta-externalagent`, `Googlebot`, etc.).
    - Configurado `app/page.tsx` para renderizar diretamente a tela de acesso sem redirecionamento 307 no root `/`, retornando HTTP 200 diretamente para os scrapers.
    - Adicionadas tags `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height` e `og:image:alt` para enriquecimento do card.
    - Criado asset dedicado `public/og-preview.jpg` para quebra de cache prévio em proxies e CDNs de mensageiros (WhatsApp/Meta).
- **Validação**:
  - Compilação e build Next.js 14 executados com sucesso (código 0).

---

### Forçar Login ao Abrir o PWA & Eliminação de Acesso via LocalStorage
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Garantir que o PWA sempre exija login ao ser aberto ou iniciado, eliminando qualquer auto-login persistente via `localStorage` ou cookies de longa duração, permitindo acesso às áreas restritas unicamente a usuários autenticados na sessão ativa.
- **Implementação Técnica**:
  - `lib/auth.ts`:
    - Substituído armazenamento persistente em `localStorage` por `sessionStorage` e **Session Cookie** HTTP (sem atributos `max-age` ou `expires`, com descarte automático ao fechar a janela/PWA).
    - Adicionada rotina em `getSession()`, `setSession()` e `clearSession()` para remover ativamente chaves residuais de `localStorage` (`ml_rdo_session`).
  - `middleware.ts`:
    - Removido o bloco de redirecionamento automático que desviava requisições de `/` e `/login` diretamente para `/menu` quando havia cookie de sessão existente.
    - Adicionado purge do cookie de sessão ao carregar a página `/` ou `/login`, garantindo que todo novo acesso ao PWA exija autenticação.
    - Mantida proteção de rotas restritas (`/menu`, `/rdo/*`, `/ocorrencia`) exigindo cookie de sessão ativo.
  - `app/login/page.tsx`:
    - Adicionado hook de montagem (`useEffect`) que aciona `clearSession()` imediatamente, garantindo que qualquer estado residual de sessão seja destruído antes de nova autenticação.
  - `app/menu/page.tsx`, `app/rdo/novo/page.tsx`, `app/ocorrencia/page.tsx`, `components/pwa/PwaManager.tsx`:
    - Removidos acessos diretos a `localStorage.getItem('ml_rdo_session')`, padronizando o consumo através de `getSession()` do módulo `@/lib/auth`.
    - Adicionado botão "Sair" no header do menu principal (`/menu`) para encerramento explícito de sessão com redirecionamento para `/login`.
- **Validação**:
  - Build de produção (`next build`) executado e validado com sucesso (código de saída 0).

---

### Auditoria Visual Pré-Demo — Captura Automatizada de Screenshots (Playwright)
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Capturar screenshots em alta fidelidade de todas as telas acessíveis do PWA Relatório Diário de Obra (`rdo.metriclab.com.br`) em viewports Mobile (`390x844` — iPhone 14) e Desktop (`1440x900` com bypass `ml_pwa_standalone=true`) para auditoria visual antes da demonstração executiva.
- **Implementação Técnica**:
  - Script Playwright automatizado em `/Users/joaofreire/metriclab/scripts/screenshot-audit.mjs`.
  - Tratamento de autenticação via sessão ativa (`ml_rdo_session` e `sessionStorage`), simulador de etapas de login (Etapa 1 identificador e Etapa 3 código de bypass demo `123456`).
  - Supressão de banners intrusivos de instalação PWA via flag de persistência `ml_pwa_install_banner_dismissed` para registro limpo dos layouts.
  - Screenshots capturados:
    1. `01-splash.png`: Splash screen com display "Relatório Diário de Obra" e botão Entrar.
    2. `02-login.png`: Tela de login na Etapa 1 com input de telefone/email.
    3. `03-login-codigo.png`: Tela de login na Etapa 3 com campo de 6 dígitos preenchido (`123456`).
    4. `04-menu.png`: Menu principal com identificação do encarregado, trecho e atalhos rápidos.
    5. `05-rdo-novo.png`: Formulário de registro diário de obra (condições climáticas, equipe e equipamentos).
    6. `06-rdo-detalhes.png`: Visualização completa de RDO submetido com equipe, máquinas e fotos.
    7. `07-rdo-confirmacao.png`: Tela de confirmação e disparo de notificação para supervisão via WhatsApp.
    8. `08-ocorrencia.png`: Formulário de registro de ocorrência de campo (tipos e criticidade).
    9. `09-desktop-blocked.png`: Tela de bloqueio desktop com QR Code.
  - Gerado painel HTML comparativo lado a lado em `screenshots/index.html`.

---

### Redesign Mobile UI — Design System MetricLab 2.0
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Reestruturação integral da interface mobile do PWA Relatório Diário de Obra (RDO) conforme as especificações rígidas do MetricLab 2.0.
- **Implementações**:
  - `tailwind.config.ts` e `app/globals.css`: Tokens unificados de design system (`#F7F7F5`, `#FFFFFF`, `#E2E2DC`, `#111111`, `#6B7280`, `#9CA3AF`, `#DC2626`).
  - Zero border radius em botões, inputs, cards e badges (`rounded-none`).
  - Inputs com altura de 48px, borda 1px `#E2E2DC`, labels em 12px uppercase tracking `0.08em` `#6B7280`.
  - Botões com 52px de altura, full-width, texto 15px Inter 600.
  - HeaderMobile de 56px, fundo branco, borda inferior 1px `#E2E2DC`, título 18px Inter 600.
  - Menu reformulado: identificação do encarregado, resumo do dia com status badge, cards largos para "Novo RDO", "Histórico" e "Registrar Ocorrência".
  - Multi-step form com barra de progresso linear de 2px no topo, seleção de clima em botões planos (Manhã/Tarde), grid limpo de efetivo por categoria, status de máquinas, upload de fotos com aspecto 1:1 e botão fixo de 52px no rodapé.
  - Tela de confirmação com resumo em grid de 2 colunas e dois botões de ação ("Ver RDO" e "Voltar ao início").

---

### Reforço Estrito de Bloqueio Desktop & Remoção de Bypass de Produção
- **Data**: 11 de Setembro de 2026
- **Objetivo**: Bloquear completamente o acesso desktop em todas as rotas (mesmo para usuários autenticados ou com sessão ativa) e eliminar qualquer contorno via localStorage ou standalone em produção.
- **Implementações**:
  - **Middleware (`middleware.ts`)**:
    - Detecção antecipada por `User-Agent` e `Sec-CH-UA-Mobile`.
    - Redirecionamento incondicional para `/desktop-blocked` para qualquer dispositivo desktop, independente de autenticação, sessão ou rota acessada.
    - Exceção autorizada restrita ao header `x-playwright-audit === process.env.PLAYWRIGHT_SECRET`.
    - Eliminação de bypass via `ml_pwa_standalone` em ambiente de produção.
  - **Guard do Cliente (`hooks/useDesktopBlock.ts`)**:
    - Hook client-side executado no `mount` e no evento `resize` da janela.
    - Se `window.innerWidth > 768`, executa `router.replace('/desktop-blocked')` imediato, sem aviso ou delay.
    - Aplicado no `HeaderMobile` e em todas as páginas autenticadas (`/menu`, `/rdo/novo`, `/rdo/[id]`, `/rdo/[id]/confirmacao`, `/ocorrencia`).
  - **Tela `/desktop-blocked` Redesenhada**:
    - Fundo `#F7F7F5`, centralização vertical e horizontal absoluta.
    - Logotipo `m.` 32px no topo com ponto `#F5A623`.
    - Título "Este aplicativo é exclusivo para dispositivos móveis" (Inter 600, 18px, `#111111`).
    - Subtítulo "Acesse pelo seu celular para continuar." (Inter 400, 14px, `#9CA3AF`).
    - QR Code centralizado em 160x160px para `https://rdo.metriclab.com.br`.
    - Endereço web `rdo.metriclab.com.br` (Inter 400, 13px, `#9CA3AF`).
    - Remoção de botões de cópia, links ou instruções supérfluas.
  - **Variável de Ambiente**:
    - Configurado `PLAYWRIGHT_SECRET=metriclab_audit_2026` em `.env.production` e `.env.local`.



