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

### Foco: Experiência Pública e Autenticação

- [x] **Criar a Landing Page**:
  - [x] Desenvolver a estrutura e o conteúdo da página inicial para usuários não logados.
  - [x] Garantir que o design seja responsivo e atraente.

- [x] **Implementar Autenticação com Google**:
  - [x] Integrar o Firebase Authentication para permitir o login com contas Google.
  - [x] Substituir o fluxo de login simulado por um sistema de autenticação real.
  - [x] Gerenciar a sessão do usuário (login/logout).

- [x] **Controle de Acesso**:
  - [x] Implementar a lógica de redirecionamento: usuários não logados veem a landing page; usuários logados são direcionados para o `/dashboard`.
  - [x] Proteger todas as rotas da área do aplicativo (`/app`) para que exijam autenticação.


## Concluído: Sprint 2

- [x] **Configuração do Ambiente**: Validada a estrutura de pastas e o tema visual.
- [x] **Layout Principal**: Desenvolvido o layout com header, sidebar e área de conteúdo.
- [x] **Telas de CRUD (Interface)**: Desenvolvidas as UIs para todas as telas principais.
- [x] **Dinamização com Mock Service**: Conectadas todas as telas ao serviço de dados simulado.
- [x] **Refatoração da Agenda**: Timeline de 24h responsiva e com lógica "Corujão".
- [x] **Extrato de Reservas**: Implementada a lista de reservas com filtros avançados e ordenação.
- [x] **Ações de Edição**: Adicionado o modal de edição de reservas na lista, com controle de permissão.
