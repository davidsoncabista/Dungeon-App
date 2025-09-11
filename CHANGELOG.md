# Changelog

## v0.6.0 - 2025-09-17 10:00:00 - studio-ai

- **feat(arquitetura): Adota estratégia de 'Fonte da Verdade Única' para sincronizar UI e DB**
  - **Refatoração Global do Estado:** Eliminada a manipulação manual do estado local (useState) após operações de CRUD (Criação, Edição, Exclusão) em todo o aplicativo.
  - **Fonte da Verdade Única:** A aplicação agora depende exclusivamente do hook `useCollectionData` do `react-firebase-hooks` para manter a interface sincronizada em tempo real com o Firestore. Isso significa que a UI "reage" automaticamente às mudanças no banco de dados, em vez de ser atualizada de forma otimista e manual.
  - **Resolução de Erros de Chave (`key`):** A nova abordagem resolve de forma definitiva a causa raiz dos erros `Each child in a list should have a unique "key" prop`, garantindo que os dados renderizados sempre tenham um ID consistente fornecido diretamente pelo hook (`{ idField: 'id' }`).
  - **Estabilidade e Confiabilidade:** Essa mudança de arquitetura torna o código mais simples, robusto e previsível, eliminando uma classe inteira de bugs relacionados à dessincronização entre o estado da UI e o estado do banco de dados.

## v0.5.0 - 2025-09-16 10:00:00 - davidson.dev.br

- **Refatoração do Perfil de Usuário e Fluxo de Onboarding**:
  - **Modelo de Dados Extensível**: O schema do usuário no Firestore foi expandido para incluir novos campos essenciais para a associação e futuras funcionalidades, como `nickname`, `phone`, `cpf`, `rg`, `birthdate`, `socialMedia` e `gameTypes`.
  - **Fluxo de Onboarding Automatizado**: Removida a funcionalidade de criação manual de usuários. O sistema agora depende exclusivamente do registro via Google, que cria um perfil básico a ser complementado pelo próprio usuário.
  - **Página de Perfil Completa**: A página "Meu Perfil" foi totalmente reformulada. Agora, ela utiliza um formulário robusto com validação (`react-hook-form` e `zod`) e permite que o usuário edite todas as suas informações, incluindo as novas preferências de jogo e dados pessoais.

## v0.4.0 - 2025-09-15 14:00:00 - davidson.dev.br

- **Implementação do Backend Real com Firebase (Etapas 21-25)**:
  - **Autenticação Real**: Substituído o sistema de login simulado pelo Firebase Authentication com provedor Google, incluindo um fluxo completo de login e logout.
  - **Gerenciamento de Usuários no Firestore**: A página "Gerenciamento de Usuários" agora é totalmente dinâmica, buscando e atualizando dados diretamente do Firestore.
  - **Controle de Acesso com Regras de Segurança**: Implementadas regras de segurança robustas no Firestore para proteger as coleções `users`, `rooms` e `bookings`, garantindo que apenas usuários autorizados possam ler ou escrever dados.
  - **Automação de Permissões com Cloud Functions**:
    - Criada a função `createUserDocument`, que gera um perfil de usuário no Firestore automaticamente após o registro.
    - Criada a função `setAdminClaim`, que atribui ou remove permissões de administrador (`Custom Claims`) com base no campo `role` do usuário, integrando-se perfeitamente com as regras de segurança.
  - **Fluxo de Novos Usuários**: Implementado o redirecionamento para a página `/subscribe` para novos usuários. A seleção de plano agora atualiza o status e a categoria do usuário no Firestore, concedendo acesso ao aplicativo.

## v0.3.0 - 2025-09-08 21:30:00 - davidson.dev.br

- **Refatoração da Agenda e Introdução do Extrato de Reservas (Etapas 16-20)**:
  - **Agenda Responsiva 24h**: A timeline de reservas foi completamente redesenhada para oferecer uma visualização de 24 horas que se adapta a qualquer tamanho de tela, eliminando a necessidade de rolagem horizontal.
  - **Lógica de Reservas "Corujão"**: Corrigida a lógica de exibição para que reservas que atravessam a meia-noite (Corujão) apareçam corretamente no dia seguinte.
  - **Novo Extrato de Reservas**: Introduzido um novo card com uma lista tabular de todas as reservas.
  - **Filtros Avançados**: A lista de reservas agora pode ser filtrada por períodos predefinidos ("Próximos 7 dias", "Próximos 15 dias") ou por um intervalo de datas personalizado.
  - **Ordenação e Ações Rápidas**: A tabela permite ordenar as reservas por qualquer coluna e inclui um menu de ações para editar um agendamento (disponível para o organizador e administradores).

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

    