# Daily - Plano de Execução

Este documento detalha as etapas de desenvolvimento, quebrando os objetivos da arquitetura em tarefas menores e gerenciáveis.

## Foco Atual (Sprint 11 - Revisada)

### Foco: Sistema de Auditoria Pragmático
**Objetivo:** Integrar a criação de logs diretamente nas funções e ações existentes do sistema, aproveitando a estrutura de código atual para um desenvolvimento mais rápido e simples.

#### História 1: Preparação do Ambiente
- [x] **Tarefa 1.1 (Firestore):**
  - [x] Simplificar as `firestore.rules`: Permitir que qualquer usuário autenticado (`request.auth != null`) possa `create` documentos em `auditLogs`, mas apenas `Administrador`, `Editor` e `Revisor` possam `read`.
- [x] **Tarefa 1.2 (Helper no Frontend):**
  - [x] Criar o arquivo `src/lib/auditLogger.ts`.
  - [x] Implementar a função `createAuditLog(actor: User, action: string, details: object = {})` para registrar logs no Firestore a partir do cliente.

#### História 2: Integrar o Log nas Ações
- [x] **Tarefa 2.1 (Log de Login):**
  - [x] Na lógica de `onAuthStateChanged`, após a verificação bem-sucedida do usuário, chamar `createAuditLog` com a ação `USER_LOGIN`.
- [x] **Tarefa 2.2 (Log de Ações de Reserva):**
  - [x] No `booking-modal.tsx` (criação), após o `addDoc` da reserva, chamar `createAuditLog` com a ação `CREATE_BOOKING`.
  - [x] No `edit-booking-modal.tsx` (cancelamento), antes do `deleteDoc`, chamar `createAuditLog` com a ação `CANCEL_BOOKING`.
- [x] **Tarefa 2.3 (Log de Pagamento na Cloud Function):**
  - [x] Na Cloud Function `mercadoPagoWebhook`, dentro da verificação `paymentDetails.status === "approved"`, adicionar a lógica para criar um documento diretamente na coleção `auditLogs` com a ação `PROCESS_PAYMENT`.
- [ ] **Tarefa 2.4 (Log de Envio de Mensagem na Cloud Function):**
  - [ ] Na Cloud Function `sendUserMessage`, após a criação da mensagem, adicionar a lógica para criar um documento na coleção `auditLogs` com a ação `SEND_MESSAGE`.

#### História 3: Visualizador de Logs
- [ ] **Tarefa 3.1 (Criação da Página):**
  - [ ] Criar a nova página `/admin/audit-log/page.tsx`.
- [ ] **Tarefa 3.2 (Construção do Componente da Tabela):**
  - [ ] Dentro da nova página, implementar uma tabela que busca e exibe os dados da coleção `auditLogs`, ordenados por data.
- [ ] **Tarefa 3.3 (Implementação de Filtros):**
  - [ ] Adicionar campos de filtro para pesquisar por e-mail do usuário, tipo de ação e um seletor de intervalo de datas.

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

---

## Concluído: Sprint 8

### Foco: Polimento do Fluxo de Pagamento e Documentação

- [x] **Refatoração do Fluxo de Pagamento da Matrícula**:
  - [x] **Frontend**: Substituída a lógica de alteração de plano por um modal de confirmação de pagamento. A chamada para o gateway (Mercado Pago) agora é feita sob demanda.
  - [x] **Backend**: Removida a Cloud Function que gerava cobranças com base na mudança de categoria do usuário. A função `createMercadoPagoPayment` foi aprimorada para lidar com a criação de pagamentos de matrícula (mensalidade + joia), adicionando metadados do plano.
  - [x] **Webhook**: Garantido que o webhook do Mercado Pago atualize corretamente o status e a categoria do usuário após a confirmação do pagamento, assegurando a integridade do processo.
- [x] **Melhoria na Experiência do Usuário (UX)**:
  - [x] **Verificação de Maioridade**: Adicionada regra de validação no formulário de perfil para permitir o cadastro apenas de maiores de 18 anos.
  - [x] **Preenchimento Automático de Endereço**: Implementada a integração com a API ViaCEP no formulário de perfil para preencher campos de endereço automaticamente.
  - [x] **Transparência de Pagamentos**:
    - [x] O valor da taxa de inscrição (joia) agora é exibido de forma clara no modal de confirmação da matrícula.
    - [x] Adicionado um indicador de status ("Pago"/"Pendente") para a taxa de inscrição no card "Meu Plano" do usuário.
- [x] **Documentação**:
  - [x] Atualizados os arquivos `ARCHITECTURE.md` e `README.md` para refletir todas as novas funcionalidades implementadas.

---

## Concluído: Sprint 7

### Foco: Ferramentas de Gestão Financeira para Admin

- [x] **Página de Gestão de Finanças**:
  - [x] **Interface do Administrador**:
    - [x] Criada a nova página em `/admin/finance` para a gestão financeira.
    - [x] Exibida uma tabela com todas as transações de todos os usuários.
    - [x] Adicionada a capacidade de o administrador gerar uma cobrança avulsa para um usuário específico.
    - [x] Permitido que o administrador marque manualmente uma cobrança como "Paga".
- [x] **Lógica de Negócio de Convidados Extras**:
    - [x] **Interface Admin**: Adicionado controle de preço por convite extra na página `/admin/system`.
    - [x] **Backend (Cloud Function)**: Implementada a lógica `handleBookingWrite` que gera automaticamente uma cobrança para convidados que excedem a cota do plano.

## Concluído: Sprint 6

### Foco: Refinamento da Experiência do Usuário e Polimento

- [x] **Página de Histórico de Avisos**:
  - [x] Criada a página `/notices` para que os usuários possam visualizar todos os comunicados passados.
- [x] **Melhoria no Fluxo de Onboarding**:
  - [x] Implementado um modal de boas-vindas no primeiro login após o cadastro, guiando o usuário sobre os próximos passos (completar perfil e se matricular).
- [x] **Refinamento da Agenda Online**:
  - [x] Reintroduzida a visualização de agenda por dia/semana, permitindo ao usuário alternar entre a visão de calendário mensal e uma timeline detalhada.
- [x-refactor] **Centralização de Ferramentas Admin**:
  - [x] Movido o card de 'Enviar Novo Aviso' da página de avisos para a página de administração.
- [x] **Polimento Geral da UI/UX**:
  - [x] Realizada uma revisão completa da responsividade em todas as telas, especialmente em modais e formulários complexos.
  - [x] Garantido que os feedbacks de sucesso e erro (toasts) sejam consistentes em toda a aplicação.

## Concluído: Sprint 5

### Foco: Validações Finais e Ferramentas de Admin

- [x] **Validação Final de Cotas de Reserva**:
  - [x] Implementada a verificação no formulário de reserva para impedir o agendamento se o usuário já atingiu sua cota (semanal, mensal ou corujão).
- [x] **Interatividade do Usuário**:
  - [x] Implementada a funcionalidade de "Sair da Reserva".
- [x] **Ferramentas de Administrador**:
  - [x] Implementadas as ações de moderação (bloquear/desbloquear usuário, alterar permissões).
  - [x] Criada a interface para o administrador criar e enviar avisos.

## Concluído: Sprint 4

### Foco: Lógica de Negócio e Transparência de Cotas

- [x] **Lógica de Cotas e Reservas**:
  - [x] Implementada a validação da cota mensal de convidados.
  - [x] Implementada a lógica de contagem de cotas para "Corujão", mensal e de convidados.
- [x] **Transparência para o Usuário**:
  - [x] Criado um card na página "Minhas Reservas" que exibe em tempo real o uso e saldo de todas as cotas do usuário (reservas, corujão, convidados).
- [x] **Integração Admin-Usuário**:
  - [x] A página de "Matrícula" agora é 100% dinâmica, buscando os planos e preços diretamente da configuração feita pelo administrador.

## Concluído: Sprint 3

### Foco: Backend com Firebase, Autenticação e Perfis

- [x] **Implementar Autenticação com Google**:
  - [x] Integrado o Firebase Authentication para permitir o login com contas Google.
  - [x] Gerenciada a sessão do usuário (login/logout).
- [x] **Controle de Acesso com Firestore e Cloud Functions**:
  - [x] Criada a função `createUserDocument` para registrar novos usuários no Firestore.
  - [x] Criada a função `setAdminClaim` para gerenciar permissões de administrador via `Custom Claims`.
  - [x] Implementadas Regras de Segurança (`firestore.rules`) para proteger todo o banco de dados.
- [x] **Fluxo de Novos Usuários e Perfis**:
  - [x] Redirecionamento de novos usuários (`Visitante`) para a página de inscrição (`/subscribe`).
  - [x] Implementada a lógica para que a seleção de plano atualize o `status` e a `category` do usuário.
  - [x] Expandido o modelo de dados do usuário (`User`) com campos adicionais (telefone, preferências, etc.).
  - [x] Reformulada a página de Perfil (`/profile`) para permitir a edição de todos os novos campos.
- [x] **Dinamização do App**:
  - [x] Removido o `mock-service` das páginas de Usuários, Layout e Header.
  - [x] Criada a Landing Page pública para usuários não logados.


## Concluído: Sprint 2

- [x] **Configuração do Ambiente**: Validada a estrutura de pastas e o tema visual.
- [x] **Layout Principal**: Desenvolvido o layout com header, sidebar e área de conteúdo.
- [x] **Telas de CRUD (Interface)**: Desenvolvidas as UIs para todas as telas principais.
- [x] **Dinamização com Mock Service**: Conectadas todas as telas ao serviço de dados simulado.
- [x] **Refatoração da Agenda**: Timeline de 24h responsiva e com lógica "Corujão".
- [x] **Extrato de Reservas**: Implementada a lista de reservas com filtros avançados e ordenação.
- [x] **Ações de Edição**: Adicionado o modal de edição de reservas na lista, com controle de permissão.
