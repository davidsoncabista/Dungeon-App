# Daily - Plano de Execução

Este documento detalha as etapas de desenvolvimento, quebrando os objetivos da arquitetura em tarefas menores e gerenciáveis.

## Sprint Atual: Sprint 4 (Iniciando)

### Foco: Lógica de Negócio e Ferramentas de Admin

- [ ] **Lógica de Cotas e Reservas**:
  - [ ] Implementar a validação de cotas por categoria de usuário (Player, Gamer, Master).
  - [ ] Implementar a lógica de convidados (associados vs. não-associados) e a geração de cobrança avulsa.
  - [ ] Implementar as regras para o horário "Corujão".

- [ ] **Interatividade do Usuário**:
  - [ ] Implementar a funcionalidade de "Sair da Reserva".
  - [ ] Simular o fluxo de confirmação e cancelamento automático de reservas.

- [ ] **Ferramentas de Administrador**:
  - [ ] Implementar as ações de moderação (bloquear usuário, editar/excluir sala).
  - [ ] Criar a interface para o administrador criar e enviar avisos.


## Concluído: Sprint 3

### Foco: Backend com Firebase e Autenticação Real

- [x] **Implementar Autenticação com Google**:
  - [x] Integrar o Firebase Authentication para permitir o login com contas Google.
  - [x] Gerenciar a sessão do usuário (login/logout).
- [x] **Controle de Acesso com Firestore e Cloud Functions**:
  - [x] Criar a função `createUserDocument` para registrar novos usuários no Firestore.
  - [x] Criar a função `setAdminClaim` para gerenciar permissões de administrador via `Custom Claims`.
  - [x] Implementar Regras de Segurança (`firestore.rules`) para proteger todo o banco de dados.
- [x] **Fluxo de Novos Usuários**:
  - [x] Redirecionar novos usuários (`Visitante`) para a página de inscrição (`/subscribe`).
  - [x] Implementar a lógica para que a seleção de plano atualize o `status` e a `category` do usuário no Firestore.
- [x] **Dinamização do App**:
  - [x] Remover o `mock-service` das páginas de Usuários, Layout e Header, substituindo por chamadas reais ao Firestore e `useAuthState`.
  - [x] Criar a Landing Page pública para usuários não logados.


## Concluído: Sprint 2

- [x] **Configuração do Ambiente**: Validada a estrutura de pastas e o tema visual.
- [x] **Layout Principal**: Desenvolvido o layout com header, sidebar e área de conteúdo.
- [x] **Telas de CRUD (Interface)**: Desenvolvidas as UIs para todas as telas principais.
- [x] **Dinamização com Mock Service**: Conectadas todas as telas ao serviço de dados simulado.
- [x] **Refatoração da Agenda**: Timeline de 24h responsiva e com lógica "Corujão".
- [x] **Extrato de Reservas**: Implementada a lista de reservas com filtros avançados e ordenação.
- [x] **Ações de Edição**: Adicionado o modal de edição de reservas na lista, com controle de permissão.
