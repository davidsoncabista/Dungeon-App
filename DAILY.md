# Daily - Plano de Execução

Este documento detalha as etapas de desenvolvimento, quebrando os objetivos da arquitetura em tarefas menores e gerenciáveis.

## Etapa Atual: Sprint 1 (Concluída)

- [x] **Configuração do Ambiente**:
  - [x] Validar a estrutura de pastas do projeto Next.js.
  - [x] Configurar o tema visual base com Tailwind CSS e ShadCN.

- [x] **Autenticação de Usuário**:
  - [x] Criar a tela de Login.
  - [x] Implementar a lógica de autenticação (simulada).
  - [x] Proteger as rotas da aplicação que exigem login.

- [x] **Layout Principal da Aplicação**:
  - [x] Desenvolver o layout principal com header, sidebar e área de conteúdo.
  - [x] Criar a navegação principal entre as telas.

- [x] **Telas de CRUD (Interface)**:
  - [x] Desenvolver a UI das telas "Meu Perfil".
  - [x] Desenvolver a UI das telas de "Usuários" e "Salas".
  - [x] Desenvolver a UI da tela "Reservar Sala" e "Minhas Reservas".
  - [x] Desenvolver a UI da tela "Cobranças" e "Estatísticas".

- [x] **Dinamização com Mock Service**:
    - [x] Conectar todas as telas a um serviço de dados simulado (`mock-service`).


## Próximas Etapas: Sprint 2

### Sprint 2: Lógica de Negócio e Interatividade

- [ ] **Lógica de Reservas**:
  - [ ] Implementar a validação de cotas por categoria de usuário (Player, Gamer, Master).
  - [ ] Implementar as regras para o horário "Corujão".
  - [ ] Implementar a lógica de convidados (associados vs. não-associados) e a geração de cobrança avulsa.

- [ ] **Interatividade do Usuário**:
  - [ ] Implementar a funcionalidade de "Sair da Reserva".
  - [ ] Implementar a edição e o cancelamento de reservas (com a regra de 6h de antecedência).
  - [ ] Simular o fluxo de confirmação e cancelamento automático de reservas.

- [ ] **Ferramentas de Administrador**:
  - [ ] Criar o painel para o administrador gerenciar **todas** as reservas.
  - [ ] Implementar as ações de moderação (bloquear usuário, editar/excluir sala).
  - [ ] Criar a interface para o administrador criar e enviar avisos.
