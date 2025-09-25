# Changelog

## v1.2.1 - 2025-09-20 18:30:00 - davidson.dev.br

- **docs(regras): Adiciona documentação do modelo de dados para as Regras de Acesso**
  - Adicionada uma nova seção ao arquivo `ARCHITECTURE.md` que define formalmente a estrutura de dados do objeto `accessRules`.
  - Esta documentação detalha o propósito de cada campo (`description` e `pages`), servindo como uma "fonte da verdade" para o sistema de permissões visualizado no painel de administração.

## v1.2.0 - 2025-09-20 18:00:00 - davidson.dev.br

- **feat(voting): Adiciona módulo de votação para membros**
  - Esta versão introduz a primeira fase do sistema de votação, focada na experiência do membro votante.
  - **Destaques da Versão:**
    - **Página de Votação Condicional**: Criada a nova página `/voting`, que se torna visível no menu apenas quando há uma votação ativa para a qual o membro é elegível.
    - **Interface de Voto e Resultados**: Membros elegíveis podem visualizar as opções de voto, registrar sua escolha uma única vez e, após votar ou ao término da votação, visualizar os resultados apurados.
    - **Verificação de Elegibilidade**: O sistema valida em tempo real se um usuário pode participar de uma votação, cruzando o ID do membro com a lista de votantes elegíveis definida pelo administrador.
    - **Gestão de Votação (Admin)**: Implementada a interface de criação e gerenciamento de votações na página de "Sistema", permitindo ao administrador definir título, descrição, opções e eleger os votantes.

## v1.1.0-beta - 2025-09-20 16:00:00 - davidson.dev.br

- **feat(release): Lançamento da versão Beta 1.1.0**
  - Esta versão foca em melhorias de usabilidade, performance e novas funcionalidades para enriquecer a experiência do usuário e do administrador.
  - **Destaques da Versão:**
    - **Integração com Google Calendar**: Usuários agora podem adicionar suas reservas diretamente à sua agenda Google com um único clique.
    - **Filtro e Ordenação**: Adicionada funcionalidade de pesquisa e ordenação em listas chave (Usuários, Finanças, Minhas Reservas) para facilitar a navegação.
    - **Otimizações de Performance**: Implementado "code splitting", remoção de código não utilizado e "preconnect hints" para um carregamento significativamente mais rápido.
    - **Novas Ferramentas de Admin**: Administradores agora podem editar a data "Membro desde" dos usuários.
    - **UX Melhorada**: O painel de estatísticas agora exibe os aniversariantes do mês, promovendo a comunidade.
    - **Correção de Acesso**: Garantido que todos os usuários logados, incluindo visitantes, possam acessar a página "Minhas Reservas".

## v1.0.0 - 2025-09-20 15:00:00 - davidson.dev.br

- **feat(release): Lançamento da primeira versão estável (v1.0.0)**
  - Esta versão consolida todas as funcionalidades desenvolvidas durante as fases alfa e beta, marcando o lançamento oficial do sistema para a Associação Dungeon Belém.
  - **Destaques da Versão:**
    - **Sistema de Pagamentos Completo**: Integração com Mercado Pago para matrículas e cobranças, com confirmação via webhook.
    - **Comunicação Direta**: Sistema de mensagens privadas entre administração e usuários.
    - **Controle de Acesso Robusto**: Proteção de rotas baseada no status do usuário (Ativo, Pendente, etc.).
    - **Melhorias de Usabilidade**: Adicionado preenchimento de endereço via CEP, verificação de maioridade e filtros/ordenação em listas importantes.

## v1.0.0-beta.1 - 2025-09-20 14:00:00 - davidson.dev.br

- **feat(release): Lançamento da primeira versão Beta (v1.0.0-beta.1)**
  - Esta versão marca a transição do projeto para a fase beta, consolidando funcionalidades críticas para testes em um ambiente mais amplo antes do lançamento oficial.
  - **Destaques da Versão:**
    - **Sistema de Pagamentos Completo**: Integração com o gateway de pagamento (Mercado Pago) para matrículas e cobranças avulsas, com confirmação automática via webhook.
    - **Comunicação Direta**: Implementado o sistema de mensagens privadas que permite à administração enviar comunicados (avisos, advertências, etc.) diretamente aos usuários, com notificações em tempo real.
    - **Fluxo de Usuário Aprimorado**: Refinamento do onboarding, da verificação de maioridade, do preenchimento de endereço via CEP e do controle de acesso baseado no status de pagamento.
    - **Ferramentas de Administração Robustas**: Centralização das ferramentas de gestão de sistema, finanças e comunicação para uma melhor usabilidade.

## v1.0.1 - 2025-09-20 12:00:00 - davidson.dev.br

- **fix(admin): Corrigir visualização do valor da joia na página de sistema**
  - Corrige um problema que impedia o campo de edição do valor da joia de exibir corretamente o dado salvo no banco de dados.

## v1.0.0-alpha - 2025-09-20 10:00:00 - davidson.dev.br

- **docs: Atualizada documentação para a versão alfa 1.0.0**
  - Atualiza a documentação do projeto para a versão alfa 1.0.0, refletindo o progresso e o estado atual do desenvolvimento.

## v0.9.5 - 2025-09-19 10:00:00 - davidson.dev.br

- **feat(pagamentos): Adiciona backend para geração de cobranças PIX com Stripe**
  - Adicionada a dependência do Stripe (`stripe`) ao `package.json` das Cloud Functions.
    - Implementado o endpoint de webhook (`stripeWebhook`) para receber e processar eventos de pagamento do Stripe, atualizando automaticamente o status da transação no Firestore para "Pago" quando uma `checkout.session` é completada.
      - Criada a Cloud Function chamável (`createPixPayment`) que se conecta à API do Stripe para gerar uma sessão de pagamento PIX, associando-a a uma transação existente no Firestore e retornando os dados do QR Code para o frontend.
        - O código foi protegido para permitir o deploy mesmo sem as chaves de API configuradas, facilitando o desenvolvimento e a configuração inicial.

        ## v0.9.4 - 2025-09-18 16:00:00 - davidson.dev.br

        - **refactor(admin): Reorganiza a página de administração para melhor usabilidade**
          - Otimizada a página de administração (`/admin/system`) com a remoção do card de "Modo de Manutenção" e a adição de um placeholder para um futuro sistema de mensagens diretas aos usuários.
            - Aprimorada a responsividade da tabela de gerenciamento de planos para garantir uma visualização consistente em dispositivos móveis.
            - **refactor(header): Adiciona placeholder para notificações pessoais**
              - Incluído um novo ícone de sino (`Bell`) no cabeçalho da aplicação, servindo como um indicador visual para a futura implementação de um sistema de notificações individuais.

              ## v0.9.3 - 2025-09-18 15:00:00 - davidson.dev.br

              - **feat(ui): Adiciona funcionalidade de tema claro/escuro**
                - Implementado um sistema completo de alternância de tema (claro e escuro) para melhorar a acessibilidade visual e o conforto do usuário.
                  - Adicionado o pacote `next-themes` para gerenciar o estado do tema.
                    - Integrado um botão de alternância de tema no cabeçalho da aplicação, permitindo ao usuário escolher sua preferência.
                      - Realizada uma revisão geral do CSS (`globals.css`) para unificar as variáveis de cor e garantir consistência visual entre os dois temas.

                      ## v0.9.2 - 2025-09-18 14:00:00 - davidson.dev.br

                      - **fix(users): Corrige erro de chave única na lista de usuários**
                        - Refatorado o componente de renderização da lista de usuários para garantir que cada `UserTableRow` receba uma `key` única e estável (`user.uid`), resolvendo o erro "Each child in a list should have a unique 'key' prop" do React.
                        - **fix(ui): Corrige exibição de colunas na lista de usuários em telas maiores**
                          - Ajustadas as classes de responsividade na tabela de usuários para que as colunas de "Categoria" e "Nível de Acesso" sejam exibidas corretamente em telas de tamanho médio (`md`) em diante, melhorando a visualização em desktops.

                          ## v0.g.1 - 2025-09-18 13:00:00 - davidson.dev.br

                          - **fix(timeline): Corrige renderização de reservas na timeline**
                            - Refatorado o componente `ScheduleView` para garantir que todas as salas e seus respectivos agendamentos sejam corretamente processados e exibidos na grade de horários, resolvendo um bug que ocultava algumas reservas.
                            - **fix(bookings): Corrige abertura do modal de detalhes na página "Minhas Reservas"**
                              - Ajustada a estrutura de acionamento dos modais de detalhes e edição na lista de reservas, garantindo que clicar nas opções do menu de ações abra a janela correta de forma confiável.
                              - **fix(ui): Corrige exibição de colunas na lista de usuários**
                                - Ajustadas as classes de responsividade na tabela de usuários para que as colunas de "Categoria" e "Nível de Acesso" sejam exibidas corretamente em telas maiores.
                                - **refactor(firebase): Permite que usuários saiam de reservas**
                                  - Atualizadas as regras de segurança do Firestore e as Cloud Functions para permitir que um usuário autenticado se remova da lista de participantes de uma reserva, e para que reservas vazias sejam automaticamente excluídas.
                                  - **fix(tabs): Corrige erro de runtime no componente de abas**
                                    - Corrigida a estrutura do componente `Tabs` na página da agenda online, envolvendo todos os `TabsContent` dentro do componente `Tabs` para resolver o erro "TabsContent must be used within Tabs".

                                    ## v0.9.0 - 2025-09-18 10:00:00 - davidson.dev.br

                                    - **feat(onboarding): Adiciona modal de boas-vindas para o primeiro login**
                                      - Implementado um tour guiado em múltiplos passos (`WelcomeModal`) que é exibido aos novos usuários.
                                        - O modal orienta o usuário a completar o perfil, escolher um plano de associação e explica como visualizar reservas como convidado, melhorando significativamente a experiência inicial.
                                        - **feat(agenda): Reintroduz visualizações de timeline diária e semanal**
                                          - A página da "Agenda Online" agora possui abas para alternar entre as visualizações de **Mês**, **Semana** e **Dia**.
                                            - A visão de timeline, ideal para verificar horários detalhados, foi encapsulada no componente `TimelineView` e é usada para as abas de dia e semana.
                                            - **feat(avisos): Cria página de histórico de comunicados**
                                              - Adicionada a nova página `/notices` que exibe um histórico completo de todos os avisos enviados pela administração.
                                                - O ícone de megafone no header agora leva para esta página, permitindo que os usuários consultem mensagens passadas a qualquer momento.
                                                - **refactor(UI): Revisa a responsividade e consistência da interface**
                                                  - Realizados ajustes finos em diversos componentes para garantir que o layout se adapte corretamente a diferentes tamanhos de tela.
                                                    - Corrigida a responsividade do formulário de reserva e das tabelas em telas menores, melhorando a consistência visual do aplicativo.

                                                    ## v0.8.0 - 2025-09-17 22:00:00 - davidson.dev.br

                                                    - **feat(reservas): Implementa a funcionalidade 'Sair da Reserva'**
                                                      - Membros que foram convidados para uma reserva, mas não são os organizadores, agora podem se remover de uma sessão futura através do menu de ações na página "Minhas Reservas".
                                                        - Um diálogo de confirmação foi adicionado para evitar remoções acidentais.
                                                        - **feat(reservas): Adiciona contagem de participantes e ordenação à lista**
                                                          - As tabelas na página "Minhas Reservas" agora exibem uma coluna com o número total de participantes.
                                                            - Os cabeçalhos das colunas "Sessão / Sala" e "Participantes" foram transformados em botões que permitem ordenar a lista de reservas, facilitando a visualização.
                                                            - **feat(reservas): Finaliza o fluxo de edição e visualização**
                                                              - O menu de ações na lista de reservas foi habilitado para agendamentos passados, permitindo que os usuários visualizem os detalhes do histórico.
                                                                - O fluxo de edição de uma reserva futura agora está totalmente funcional a partir do menu na página "Minhas Reservas".

                                                                ## v0.7.0 - 2025-09-17 19:00:00 - davidson.dev.br

                                                                - **feat(cotas): Adiciona card de controle de cotas e corrige lógica de convidados**
                                                                  - **Card de Cotas em "Minhas Reservas"**: Implementado um novo card que exibe em tempo real o uso e o saldo das cotas do usuário para o ciclo mensal (renovado todo dia 15). O card detalha:
                                                                      - Reservas mensais restantes.
                                                                          - Cotas "Corujão" restantes.
                                                                              - Convites para não-sócios restantes no mês.
                                                                                - **Correção da Cota de Convidados**: A lógica de validação de reservas foi ajustada para que o limite de convidados seja contabilizado mensalmente, e não mais por sessão, alinhando o sistema à regra de negócio.
                                                                                - **feat(planos): Integração da página de matrícula com a administração**
                                                                                  - **Página de Matrícula Dinâmica**: A página `/subscribe` agora busca os planos de associação (preços, nomes, benefícios) diretamente do Firestore.
                                                                                    - **Gerenciamento Centralizado**: Administradores podem alterar os planos na página de "Administração", e as mudanças são refletidas instantaneamente para os novos usuários, sem necessidade de deploy.

                                                                                    ## v0.6.0 - 2025-09-17 10:00:00 - davidson.dev.br

                                                                                    - **feat(arquitetura): Adota estratégia de 'Fonte da Verdade Única' para sincronizar UI e DB**
                                                                                      - **Refatoração Global do Estado:** Eliminada a manipulação manual do estado local (useState) após operações de CRUD (Criação, Edição, Exclusão) em todo o aplicativo.
                                                                                        - **Fonte da Verdade Única:** A aplicação agora depende exclusivamente do hook `useCollectionData` do `react-firebase-hooks` para manter a interface sincronizada em tempo real com o Firestore. Isso significa que a UI "reage" automaticamente às mudanças no banco de dados, em vez de ser atualizada de forma otimista e manual.
                                                                                          - **Resolução de Erros de Chave (`key`):** A nova abordagem resolve de forma definitiva a causa raiz dos erros `Each child in a list should have a unique "key" prop`, garantindo que os dados renderizados sempre tenham um ID consistente fornecido diretamente pelo hook (`{ idField: 'id' }`).
                                                                                            - **Estabilidade e Confiabilidade:** Essa mudança de arquitetura torna o código mais simples, robusto e previsível, eliminando uma classe inteira de bugs relacionados à dessincronização entre o estado da UI e o estado do banco de dados.

                                                                                            ## v0.5.0 - 2025-09-16 10:00:00 - davidson.dev.br

                                                                                            - **Refatoração do Perfil de Usuário e Fluxo de Onboarding**:
                                                                                              - **Modelo de Dados Extensível**: O schema do usuário no Firestore foi expandido para incluir novos campos essenciais para a associação e futuras funcionalidades, como `nickname`, `phone`, `cpf`, `rg`, `birthdate`, `socialMedia` e `gameTypes`.
                                                                                                - **Fluxo de Onboarding Automatizado**: Removida a criação manual de usuários. O sistema agora depende exclusivamente do registro via Google, que cria um perfil básico a ser complementado pelo próprio usuário.
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

                                                                                                                                                                            ## v0.0.1 - 2025-09-04 16:30:00 - davidson-br

                                                                                                                                                                            - Criação da estrutura de documentação do projeto.
                                                                                                                                                                            - Adicionados os arquivos:
                                                                                                                                                                              - `CHANGELOG.md`: Para rastrear o histórico de versões e alterações.
                                                                                                                                                                                - `ARCHITECTURE.md`: Para delinear os objetivos e a arquitetura do sistema.
                                                                                                                                                                                  - `README.md`: Para detalhar as funcionalidades do aplicativo.
                                                                                                                                                                                    - `DAILY.md`: Para planejar e acompanhar as tarefas de desenvolvimento.
                                                                                                                                                                                      - `TEAM.md`: Para definir papéis e responsabilidades da equipe.
