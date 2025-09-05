# Changelog

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
