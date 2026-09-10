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

## 09 de Setembro de 2026 — Refatoração Design System 2.0 (Runway + Linear)
- **Implementação dos tokens de cor**: `--canvas: #F7F7F5`, `--surface: #FFFFFF`, `--hairline: #E5E5E3`, `--hairline-soft: #EFEFED`, `--ink: #111111`, `--ink-soft: #3A3A3A`, `--graphite: #6B6B6B`, `--stone: #9B9B9B`, `--ash: #C4C4C2`, `--accent: #F5A623`.
- **Substituição dos botões**: `#111111` sólido, texto branco, 48px altura mínima, border radius 6px (`rounded-md`), sem ícones em botões primários. Botões secundários transparentes com texto `text-graphite` e seta `← Voltar`.
- **Inputs estilo Runway**: Fundo transparente, apenas linha inferior `border-b border-hairline`, foco escuro `#111111`, sem cantos arredondados, label uppercase 11px stone.
- **Remoção de ruído visual**: Remoção total de emojis em cards e botões, eliminação de badges coloridos (verde, vermelho, azul, âmbar), remoção de sombras drop shadow (`shadow-none`), cartões em layout plano com divisores sutis de 1px hairline.
- **Header padronizado**: Logo oficial `m<span class="text-accent">.</span> MetricLab` com tipografia Inter sem serifa, sem badges coloridos de ambiente.
- **Build validado**: Next.js 14 production build validado com 0 erros de TypeScript/linting.

