# Daily - Plano de Execução

Este documento detalha as etapas de desenvolvimento, quebrando os objetivos da arquitetura em tarefas menores e gerenciáveis.

## Foco Atual (Sprint 13)

### Foco: Polimento Final e Otimização de Performance
**Objetivo:** Realizar os últimos ajustes finos na UX, otimizar o carregamento de imagens e preparar a aplicação para um lançamento estável.

- [ ] **Tarefa 13.1 (UX/UI):**
  - [ ] Revisar todos os modais para garantir consistência visual e de comportamento.
  - [ ] Adicionar um feedback visual mais claro (spinner) em botões durante operações assíncronas.
- [ ] **Tarefa 13.2 (Performance):**
  - [ ] Otimizar o carregamento de imagens na página de usuários e no editor da landing page.
  - [ ] Analisar e reduzir o tamanho do bundle inicial do aplicativo.
- [ ] **Tarefa 13.3 (Documentação Final):**
  - [ ] Revisar o `README.md` e `ARCHITECTURE.md` para garantir que toda a documentação esteja 100% alinhada com a versão final do aplicativo.

---

## Concluído: Sprint 12

### Foco: Melhorias de UX e Refatoração de Código
**Objetivo:** Aprimorar a experiência do usuário em fluxos chave e refatorar componentes para maior clareza e manutenção.

- [x] **Tarefa 12.1 (UX de Pagamento):**
  - [x] Ao confirmar um pagamento no Mercado Pago, redirecionar o usuário para uma página de status (`/billing/status?status=success`) em vez de apenas exibir um toast.
- [x] **Tarefa 12.2 (UX de Onboarding):**
  - [x] Após um novo usuário completar o perfil, redirecioná-lo automaticamente para a página de matrícula (`/billing`) em vez de esperar que ele clique no menu.
- [x] **Tarefa 12.3 (Refatoração):**
  - [x] Simplificar o componente `UserTableRow` movendo os modais de ação (`BlockUserDialog`, `DeleteUserDialog`, `EditRoleDialog`) para um novo componente (`UserActions`).

---

## Concluído: Sprint 11

### Foco: Sistema de Auditoria Pragmático
**Objetivo:** Integrar a criação de logs diretamente nas funções e ações existentes do sistema.

- [x] **Tarefa 1.1 (Preparação do Ambiente):**
  - [x] Ajustadas as `firestore.rules` para permitir a criação de logs.
  - [x] Criado o helper `src/lib/auditLogger.ts` para centralizar a criação de logs no frontend.
- [x] **Tarefa 2.2 (Integração de Logs):**
  - [x] Adicionado log de `USER_LOGIN` no `AppLayout`.
  - [x] Adicionado logs de `CREATE_BOOKING` e `CANCEL_BOOKING` nos modais de reserva.
  - [x] Adicionado logs de `PROCESS_PAYMENT` e `SEND_MESSAGE` nas respectivas Cloud Functions.
- [x] **Tarefa 3.3 (Visualizador de Logs):**
  - [x] Criada a nova página `/admin/audit-log` com tabela e filtros para visualização dos registros de auditoria.

---

## Concluído: Sprint 10

### Foco: Construtor de Conteúdo Dinâmico para a Landing Page

- [x] **Pilar 1: Arquitetura de Conteúdo no Firestore**
  - [x] Criar a coleção `landingPageBlocks` para armazenar os componentes da página.
  - [x] Definir a estrutura de cada "bloco", incluindo `type` (hero, featureList, etc.), `content` (título, texto, imagem) e uma propriedade `order`.

- [x] **Pilar 2: Gerenciador de Layout (Admin)**
  - [x] Criar a nova página de administração `/admin/landing-editor` para o gerenciador visual.
  - [x] Desenvolver a funcionalidade para adicionar, editar e excluir blocos de conteúdo.
  - [x] Implementar uma interface de arrastar e soltar (drag-and-drop) para reordenar os blocos.
  - [x] Adicionar controles de layout (ex: nº de colunas para a grade de features).

- [x] **Pilar 3: Renderização Dinâmica (Frontend)**
  - [x] Refatorar a página `landing/page.tsx` para buscar os blocos do Firestore.
  - [x] Implementar um sistema que mapeia o `type` de cada bloco ao seu respectivo componente React (`<HeroSection>`, `<FeatureGrid>`, etc.).
  - [x] Garantir que a página seja construída dinamicamente com base na configuração definida pelo administrador.

---

## Concluído: Sprint 9

### Foco: Comunicação Direta e Refatoração da Área de Admin

- [x] **Implementação do Sistema de Mensagens Diretas**:
  - [x] **Backend**: Criada a Cloud Function `sendUserMessage` para permitir que administradores enviem mensagens seguras a usuários.
  - [x] **Frontend (Admin)**: Desenvolvida a nova página `/admin/messages` com formulário para envio de mensagens categorizadas (aviso, advertência, etc.) e um histórico de envio.
  - [x] **Frontend (Usuário)**: Criada a página `/messages` para que os usuários visualizem sua caixa de entrada privada, com um indicador visual de mensagens não lidas no cabeçalho.
- [x] **Refatoração da Área de Administração**:
  - [x] Reorganizada a antiga página `/admin` em sub-rotas dedicadas: `/admin/system`, `/admin/finance` e `/admin/messages`, melhorando a organização e a navegação.
- [x] **Proteção de Rotas Aprimorada**:
  - [x] A lógica no `AppLayout` foi fortalecida para redirecionar usuários com status "Pendente" (inadimplente) ou "Bloqueado" para a página de cobranças, restringindo o acesso a funcionalidades de membro.
- [x] **Melhora na Transparência Financeira**:
  - [x] Adicionada a funcionalidade de "Ver Detalhes" nas listas de transações (para admin e usuários), exibindo informações completas em um modal.
- [x] **Documentação**:
  - [x] Atualizados os arquivos `ARCHITECTURE.md` e `README.md` para refletir os novos recursos e a estrutura de acesso aprimorada.
