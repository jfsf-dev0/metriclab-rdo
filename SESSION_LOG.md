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



