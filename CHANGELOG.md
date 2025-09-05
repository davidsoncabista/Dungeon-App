# Changelog

## v0.2.0 - 2025-09-05 18:00:00 - davidson.dev.br

- **Refatoração da Experiência de Reserva e Gerenciamento (Etapas 11-15)**:
  - **Nova Agenda Integrada**: A funcionalidade de "Reservar Sala" foi removida da `sidebar` e completamente integrada ao Dashboard, centralizando a experiência do usuário. O novo layout de agenda agora suporta visualizações por **Dia, Semana e Quinzena**, com um design responsivo que se adapta a desktops (timeline) e dispositivos móveis (acordeão).
  - **Modal de Reserva em Etapas**: O formulário para criar uma reserva foi refatorado para um fluxo de duas etapas, melhorando a usabilidade e eliminando a necessidade de rolagem.
  - **Gerenciamento de Usuários Aprimorado**: A página de "Usuários" foi atualizada para exibir os diferentes níveis de acesso administrativo (**Administrador, Editor, Revisor**) e foi redesenhada para ser totalmente responsiva, ajustando a apresentação das informações em telas menores.
  - **Criação de Usuário**: Implementado o modal para adicionar novos membros, com formulário validado para Nome, E-mail, Categoria e Status.
  - **Sistema de Avisos Dinâmico**: Criado um modal para exibir avisos importantes após o login, com a capacidade de direcionar mensagens para todos os usuários ou para um membro específico.

## v0.1.0 - 2025-09-14 17:30:00 - davidson.dev.br

- **Conclusão do Protótipo Dinâmico (Etapas 1-10)**:
  - **Estrutura de Dados**: Definição dos tipos TypeScript para `User`, `Room`, `Booking`, `Notice`, e `Transaction`.
  - **Serviço de Mock**: Criação de um serviço centralizado (`mock-service`) para simular o banco de dados e fornecer dados dinâmicos para toda a aplicação.
  - **Layout Dinâmico**: O layout principal, incluindo header e sidebar, agora consome dados do `mock-service` para exibir informações do usuário autenticado.
  - **Telas de Gerenciamento**: As páginas de "Usuários" e "Salas" foram conectadas ao `mock-service`, tornando-se dinâmicas.
  - **Funcionalidades do Usuário**:
    - O Dashboard agora exibe as próximas reservas do usuário.
    - A página "Minhas Reservas" foi implementada para exibir o histórico completo.
    - A página "Reservar Sala" possui um formulário funcional para agendamento.
    - A página "Meu Perfil" permite a edição de dados e senha.
    - A página "Cobranças" exibe o histórico de transações do usuário.
  - **Funcionalidades do Administrador**:
    - O Dashboard de "Estatísticas" foi conectado ao `mock-service` para exibir gráficos e métricas dinâmicas.

## v0.0.1 - 2025-09-04 16:30:00 - davidson.dev.br

- Criação da estrutura de documentação do projeto.
- Adicionados os arquivos:
  - `CHANGELOG.md`: Para rastrear o histórico de versões e alterações.
  - `ARCHITECTURE.md`: Para delinear os objetivos e a arquitetura do sistema.
  - `README.md`: Para detalhar as funcionalidades do aplicativo.
  - `DAILY.md`: Para planejar e acompanhar as tarefas de desenvolvimento.
  - `TEAM.md`: Para definir papéis e responsabilidades da equipe.
