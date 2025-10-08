# Changelog
## v1.7.0 - Melhorias no Maze Tracker e Correção de Bugs

Esta versão foca em aprimorar a ferramenta `Maze Tracker`, melhorando sua usabilidade e corrigindo regras de negócio críticas para o gerenciamento de iniciativa em combate.

* **feat(amazegame): Implementa desempate de iniciativa com timestamp**
    * Adicionado um campo `initiativeTimestamp` a cada ator. Agora, quando dois atores têm o mesmo valor de iniciativa, a prioridade é dada àquele que recebeu o valor primeiro.
    * Isso garante uma ordem de turno estável e justa, eliminando a dependência de dados mutáveis como o nome do ator para o desempate.
* **refactor(amazegame): Otimiza layout do card de ator**
    * A interface do card de ator foi completamente redesenhada para melhorar a usabilidade em telas menores, organizando os campos em linhas distintas (Nome, Iniciativa, Vida, etc.).
    * Em telas maiores, os campos de Iniciativa, Vida e Classe (Tier) são agrupados de forma inteligente para otimizar o espaço horizontal.
* **fix(amazegame): Corrige erro de consulta no carregamento da sessão**
    * Resolvido um erro crítico de runtime (`Cannot read properties of null`) que ocorria ao carregar o `Maze Tracker` se a consulta ao Firestore fosse executada antes do ID da sessão estar disponível.
* **feat(books): Cria a infraestrutura da Biblioteca de Conteúdo**
    * Criada a nova página `/books`, que servirá como um repositório central para exibir e dar acesso a aplicações, livros de regras e sistemas proprietários criados pelos membros da comunidade.
    * A página já está acessível no menu principal para todos os usuários logados com contas ativas e inclui a estrutura inicial e o botão de gerenciamento para Administradores e Editores, preparando o terreno para a adição de futuros conteúdos.

## v1.6.2 - Correção na Sincronização de Permissões
* **fix(auth): Garante a sincronização de permissões do usuário após o login**
    * Implementada a função `syncUserClaims` que é chamada no frontend (`AppLayout`) após o login do usuário.
    * Esta função compara a `role` (nível de acesso) presente no token de autenticação do Firebase com a `role` registrada no documento do usuário no Firestore.
    * Se houver uma divergência, a função força a atualização dos *custom claims* do usuário no Firebase Auth para refletir o estado correto do banco de dados, que é a fonte da verdade.
    * Isso corrige um bug crítico em que um usuário promovido a administrador (ou rebaixado) não tinha suas permissões atualizadas no cliente sem um novo login, causando inconsistências de acesso.
    * O token do usuário no lado do cliente é forçado a recarregar (`getIdToken(true)`) para que as novas permissões entrem em vigor imediatamente.

## v1.6.1 - Refatoração do Gerenciamento de Usuários
* **refactor(admin): Centraliza a lógica de ações do usuário**
    * Os componentes de diálogo para ações de administrador (`BlockUserDialog`, `DeleteUserDialog`, `EditRoleDialog`) foram extraídos da página de gerenciamento de usuários (`users/page.tsx`) e movidos para um novo componente reutilizável em `src/components/app/users/user-actions.tsx`.
    * A lógica de renderização da linha da tabela de usuários foi movida para seu próprio componente, `UserTableRow`, que agora importa e utiliza o `UserActions`.
    * Essa refatoração limpa a página principal, melhora a organização do código e facilita a manutenção futura do sistema de gerenciamento de usuários.

## v1.6.0 - Sistema de Auditoria e Votação Aprimorada
Esta versão introduz um sistema de auditoria completo para rastrear ações importantes e aprimora significativamente o módulo de votação, tornando-o mais informativo e interativo.

* **feat(audit): Implementa um sistema de log de auditoria completo**
    * **Rastreamento de Ações**: Todas as ações críticas (logins, criação/cancelamento de reservas, pagamentos, envio de mensagens) agora são registradas na nova coleção `auditLogs` do Firestore.
    * **Interface de Visualização**: Criada a nova página `/admin/audit-log`, onde administradores podem visualizar, pesquisar e filtrar todos os logs de auditoria por usuário, ação ou período.
* **feat(voting): Adiciona sistema de conteúdo dinâmico à descrição das votações**
    * **Descrição Modular**: A descrição das votações agora suporta um formato de "blocos de conteúdo", permitindo que administradores criem descrições ricas com múltiplos tópicos e propostas.
    * **Perfil de Membro**: É possível associar um membro (com foto e nome) a um item da descrição, ideal para eleições de cargos ou apresentação de candidatos.
    * **Melhora na UX**: A página de votação agora renderiza esses blocos de conteúdo como cards, tornando a informação mais clara e organizada para o votante.
* **fix(voting): Aprimora o feedback visual após o voto**
    * Após registrar um voto, a interface da enquete é imediatamente substituída por uma mensagem de confirmação clara, informando que o voto foi computado e que os resultados serão divulgados posteriormente. Corrigido o bug que mantinha a enquete visível.
* **fix(build): Corrige múltiplos erros de compilação do Next.js**
    * Resolvido o erro "You are attempting to export "metadata" from a component marked with "use client"" removendo a exportação de metadados de todos os componentes de cliente.
    * Corrigido o posicionamento da diretiva `"use client"` em diversos arquivos.

## v1.5.0 - Refatoração da Responsividade e Melhorias de UX

Esta versão concentra-se em uma ampla refatoração da interface do usuário (UI) e da experiência do usuário (UX), com foco especial em garantir que o aplicativo seja totalmente funcional e visualmente agradável em dispositivos móveis.

* **feat(responsive): Padroniza os cabeçalhos das páginas de administração**
    * Os botões de ação principal (ex: "Nova Regra", "Nova Sala", "Novo Aviso", "Novo Bloco") nas páginas de administração (`/admin/access-rules`, `/admin/rooms`, `/admin/notices`, `/admin/landing-editor`) agora são movidos para baixo do título da página em telas pequenas, criando um layout mais limpo e consistente.
* **feat(mobile-ux): Melhora a interatividade das tabelas em dispositivos móveis**
    * Nas tabelas de "Gerenciamento de Salas" (`/admin/rooms`) e "Minhas Reservas" (`/my-bookings`), a coluna "Ações" agora é oculta em telas pequenas. A funcionalidade foi substituída tornando a linha inteira clicável, o que abre o menu de ações e melhora significativamente a usabilidade em dispositivos de toque.
* **feat(mobile-ux): Otimiza a visualização da agenda em telas pequenas**
    * Nas visualizações de "Dia" e "Semana" da Agenda Online (`/online-schedule`), a timeline horizontal é automaticamente substituída por uma visualização vertical em formato de acordeão em dispositivos móveis, tornando a leitura dos horários mais clara e eliminando a necessidade de rolagem horizontal.
* **feat(nav): Aprimora o menu de navegação móvel**
    * O menu lateral em telas pequenas agora se fecha automaticamente após o usuário tocar em um link, melhorando o fluxo de navegação.
* **fix(ui): Corrige erro de componente não controlado**
    * Resolvido um erro no console do React ("A component is changing an uncontrolled input to be controlled") no formulário do editor da landing page, garantindo que todos os campos sejam inicializados com valores definidos.
* **refactor(nav): Centraliza o acesso ao Editor da Landing Page**
    * O link para o "Editor da Landing Page" foi removido do menu principal e movido para o menu lateral da área de Administração, centralizando todas as ferramentas de gestão.
* **refactor(ui): Ajusta a responsividade de componentes**
    * O gráfico de pizza na página de "Estatísticas" agora se adapta melhor a telas menores.
    * O texto do cabeçalho na página "Minhas Reservas" foi ajustado para ter uma quebra de linha adequada em dispositivos móveis.

## v1.4.5 - Planejamento do Construtor de Conteúdo da Landing Page

Esta versão documenta o planejamento da Sprint 10, que visa transformar a landing page em uma plataforma dinâmica e gerenciável.

* **docs(sprint-10): Planeja a criação de um construtor de conteúdo para a landing page**
    * **Evolução da Ideia:** O escopo foi expandido de um simples editor de texto para um sistema modular de "blocos de conteúdo" (CMS), inspirado em plataformas como Joomla.
    * **Arquitetura de Conteúdo:** Planejamento da criação de uma nova coleção no Firestore (`landingPageBlocks`) para armazenar os componentes da página, cada um com tipo, conteúdo e ordem de exibição.
    * **Gerenciador de Layout (Admin):** Concepção de uma nova página (`/admin/landing-editor`) com funcionalidades de adicionar, editar, reordenar (arrastar e soltar) e alterar o layout dos blocos de conteúdo.
    * **Refatoração da Landing Page (Frontend):** A página da landing page será refatorada para buscar e renderizar dinamicamente os blocos de conteúdo a partir do Firestore.

## v1.4.4 - Refatoração Completa da Landing Page

Esta versão focou em redesenhar a landing page para refletir todas as novas funcionalidades e melhorias do aplicativo.

* **feat(landing): Redesenha a landing page para refletir as novas funcionalidades do app**
    * **Novas Seções:** Foram adicionadas seções dedicadas para destacar recursos recentes, como o sistema de votação e o gerenciamento dinâmico de regras.
    * **Conteúdo Atualizado:** O texto foi completamente reescrito para ser mais claro, focando nos benefícios para associados e administradores.
    * **Melhorias de UI/UX:** A estrutura visual foi modernizada para melhorar a experiência do usuário e otimizar a navegação.

## v1.4.3 - Melhorias na Experiência do Administrador

Melhorias focadas na usabilidade e responsividade do painel de administração.

* **fix(responsive): Abrevia os links do menu de administração em telas menores**
    * Para evitar a quebra de layout em dispositivos móveis, os nomes dos links no menu lateral da administração foram abreviados (ex: "Regras de Acesso" se torna "ACL").
* **refactor(nav): Centraliza o link de Regras de Acesso**
    * O link para a página "Regras de Acesso" foi removido do menu principal do cabeçalho e centralizado dentro do menu lateral da página de Administração, tornando a navegação mais limpa e organizada.

## v1.4.2 - Otimização e Melhorias na Interface de Usuário

Esta versão trouxe otimizações de performance e melhorias visuais na experiência do usuário.

* **perf(login): Otimiza o carregamento da logo na página de login**
    * A imagem da logo foi otimizada (comprimida e convertida para WebP) e seu carregamento foi priorizado (`fetchpriority="high"`) para melhorar a métrica LCP (Largest Contentful Paint) da página de login.
* **feat(profile): Adiciona exibição do nível de acesso e status da conta**
    * Foi introduzido um novo card na página de perfil do usuário que exibe seu papel no sistema (Membro, Administrador, etc.) e o status atual da sua conta (Ativo, Pendente, etc.).
* **chore(profile): Remove card de diagnóstico de acesso**
    * O card de teste "Diagnóstico de Acesso", utilizado durante o desenvolvimento para depuração de permissões, foi removido da interface de produção.

## v1.4.1 - Automação de Permissões e Refatoração de Regras

Melhorias significativas no backend para automatizar processos e aumentar a segurança.

* **feat(auth): Promove usuário para Membro com a role correta após pagamento**
    * A Cloud Function que processa o pagamento da matrícula foi ajustada. Agora, além de alterar a `category` do usuário de 'Visitante' para o tipo de plano, ela também atribui a `role` de 'Membro' automaticamente, garantindo que o novo membro receba as permissões corretas sem intervenção manual.
* **fix(security): Refatora e corrige as regras de segurança do Firestore**
    * As regras do Firestore (`firestore.rules`) foram completamente reescritas para corrigir um erro crítico de "Missing or insufficient permissions". A verificação de papéis (roles) agora é feita lendo os dados diretamente do documento do usuário, garantindo que a "fonte da verdade" seja sempre consultada e evitando problemas de sincronia com os custom claims do token de autenticação.

## v1.4.0 - 2025-10-03 10:00:00 - davidson.dev.br

- **refactor(community): Notifica a comunidade sobre os aniversariantes do dia**
  - A função de aniversário foi aprimorada para criar uma experiência mais comunitária.
  - Além de enviar uma mensagem privada de parabéns para o aniversariante, o sistema agora também envia um lembrete para todos os outros membros ativos, administradores, editores e revisores, informando quem está celebrando o aniversário no dia, incentivando a interação entre os membros.

## v1.3.9 - 2025-10-02 11:00:00 - davidson.dev.br

- **feat(community): Envia mensagem automática de aniversário para membros**
  - Implementada uma nova Cloud Function (`sendBirthdayWishes`) que roda diariamente para verificar os aniversariantes do dia.
  - A função envia automaticamente uma mensagem privada de felicitações para a caixa de entrada do membro, fortalecendo o senso de comunidade e o engajamento.

## v1.3.8 - 2025-10-02 10:00:00 - davidson.dev.br

- **feat(statistics): Mudar widget de sala mais usada para tipos de jogos mais curtidos**
  - Substituído o gráfico de "Salas Mais Usadas" por um novo gráfico de "Tipos de Jogo Mais Curtidos" na página de estatísticas.
  - A nova visualização oferece um insight mais valioso sobre as preferências da comunidade, mostrando a distribuição de interesses entre RPG de Mesa, Board Games e Card Games com base nos perfis dos usuários.

## v1.3.7 - 2025-10-01 11:00:00 - davidson.dev.br

- **refactor(finance): Remove a exibição do UID do usuário nos detalhes da transação**
  - Este commit melhora a privacidade e a clareza da interface ao remover o ID do usuário (UID) da tela de detalhes da transação, tanto na visão do membro quanto na do administrador.
  - A exibição do nome do usuário já é suficiente para identificação, e o UID é uma informação técnica desnecessária para a interface, tornando-a mais limpa.

## v1.3.6 - 2025-10-01 10:00:00 - davidson.dev.br

- **feat(bookings): Adiciona barra de pesquisa ao histórico de reservas**
  - Este commit introduz um campo de pesquisa na página "Minhas Reservas", melhorando a usabilidade para usuários com um grande volume de agendamentos.
  - A nova funcionalidade permite que os usuários filtrem rapidamente suas listas de "Próximas Reservas" e "Histórico de Reservas" digitando o título da sessão, o que agiliza a busca por um agendamento específico. A filtragem é realizada no lado do cliente para uma resposta instantânea.

## v1.3.5 - 2025-09-30 10:00:00 - davidson.dev.br

- **fix(bookings): Garante que convidados vejam suas reservas na lista**
  - Este commit corrige um bug crítico que impedia usuários na lista de `guests` (convidados) de visualizarem as reservas para as quais foram convidados na página "Minhas Reservas".
  - O problema ocorria porque a consulta ao Firestore buscava reservas apenas onde o UID do usuário constava no campo `participants`, ignorando completamente o campo `guests`. Devido a uma limitação do Firestore que impede consultas do tipo `OR` em dois campos `array-contains` diferentes, a solução foi refatorar a lógica de busca de dados.
  - Agora, o componente realiza duas consultas paralelas e independentes:
    1. Uma busca por reservas onde o usuário está na lista `participants`.
    2. Uma busca por reservas onde o usuário está na lista `guests`.
  - Os resultados de ambas as consultas são então mesclados e deduplicados na interface, garantindo que todos os usuários (membros e convidados) tenham uma visão completa de todos os seus agendamentos, alinhando o comportamento do aplicativo com as regras de negócio.

## v1.3.4 - 2025-09-29 21:00:00 - davidson.dev.br

- **feat(auth): Promove usuário para Membro com a role correta após pagamento**
  - Este commit ajusta a Cloud Function que processa a confirmação de pagamento da matrícula (`mercadoPagoWebhook`).
  - Anteriormente, a função apenas alterava a `category` do usuário de 'Visitante' para o novo plano. Agora, além disso, a função também atribui a `role` de 'Membro' ao usuário.
  - Isso automatiza completamente o processo de onboarding, garantindo que um novo associado (`Convidado`) receba as permissões corretas de um membro imediatamente após a confirmação do pagamento, sem necessidade de intervenção manual de um administrador.

## v1.3.3 - 2025-09-29 20:00:00 - davidson.dev.br

- **feat(auth): Adiciona nível de acesso "Convidado" para novos usuários**
  - Este commit introduz um novo nível de acesso (`role`) chamado "Convidado", que passa a ser o padrão para todos os novos usuários que se registram no sistema.
  - A mudança diferencia claramente um usuário em seu primeiro acesso de um ex-membro que possa estar retornando (que manteria o `role` de "Membro"), melhorando a clareza no gerenciamento de usuários.
  - O backend (Cloud Function `createUserDocument`) foi atualizado para atribuir o novo `role`.
  - A interface de gerenciamento de usuários agora reconhece e exibe o nível "Convidado", com um badge distintivo.

## v1.3.2 - 2025-09-27 18:30:00 - davidson.dev.br

- **feat(landing): Redesenha a landing page para refletir as novas funcionalidades do app**
  - Este commit implementa uma refatoração completa da landing page para alinhar a comunicação com o estado atual e as novas capacidades do Dungeon App.
  - **Destaques da Atualização:**
    - **Seções de Funcionalidades Modernizadas:** As seções foram atualizadas para destacar recursos mais relevantes como "Agenda Multivisualização", "Comunicação Centralizada" e "Sistema de Votação".
    - **Conteúdo Focado em Benefícios:** O texto foi reescrito para ser mais claro e direto, explicando os benefícios tanto para associados quanto para administradores.
    - **UI/UX Aprimorada:** O visual foi modernizado para melhorar a experiência do visitante e guiá-lo de forma mais eficaz para a ação de login.

## v1.3.1 - 2025-09-22 10:30:00 - davidson.dev.br

- **feat(ui): Adiciona exibição do nível de acesso do usuário no perfil**
  - Este commit introduz um novo card na página de perfil do usuário que exibe o seu papel (role) atual no sistema, como "Membro", "Visitante", "Editor", "Revisor" ou "Administrador".
  - Essa mudança melhora a clareza para o usuário, permitindo que ele identifique rapidamente seu nível de permissão e entenda quais funcionalidades estão disponíveis para ele.

## v1.3.0 - 2025-09-22 10:00:00 - davidson.dev.br

- **feat(release): Lançamento da versão 1.3.0 - Gestão de Acesso Dinâmico**
  - Esta versão introduz um sistema completo para o gerenciamento dinâmico das regras de acesso, permitindo que administradores modifiquem permissões em tempo real.
  - **Destaques da Versão:**
    - **API de Regras de Acesso**: Implementado o backend com endpoints CRUD (`criar`, `atualizar`, `excluir`) para a gestão de níveis de permissão (Administrador, Editor, Revisor).
    - **Interface de Gerenciamento**: Criada a nova página `/admin/access-rules`, onde administradores podem visualizar, criar, editar e excluir regras de acesso através de uma interface intuitiva.
    - **Evolução da Arquitetura**: O sistema agora permite que as regras de acesso sejam gerenciadas via banco de dados, eliminando a necessidade de deploy para ajustar permissões.

## v1.2.4 - 2025-09-21 11:00:00 - davidson.dev.br

- **feat(ui): Cria a interface de controle para as regras de acesso**
  - Com o backend já implementado, este commit adiciona a nova tela de "Regras de Acesso" na área de administração.
  - Desenvolvidos os componentes de interface (lista, formulários, modais) para a gestão das regras.
  - Realizada a integração com as Cloud Functions recém-criadas para consumir e manipular os dados.
  - Adicionada a nova rota e o item de menu na navegação da área administrativa.

## v1.2.3 - 2025-09-21 10:00:00 - davidson.dev.br

- **feat(api): Implementa os endpoints CRUD para o gerenciamento de regras**
  - Implementado o backend para a API de Regras de Acesso, trazendo à vida a especificação definida anteriormente.
  - Adicionados os controladores e a lógica de serviço para criar, ler, atualizar e deletar regras via Funções Chamáveis do Firebase.
  - Incluída a integração com o Firestore para persistência das regras, protegida por novas regras de segurança.
  - Garantido que a API segue o contrato definido na documentação, com validação de dados de entrada via Zod.

## v1.2.2 - 2025-09-20 18:45:00 - davidson.dev.br

- **docs(architecture): Evolui a arquitetura para regras de acesso dinâmicas e especifica a API**
  - Formalizada a decisão de evoluir o sistema de Regras de Acesso de uma estrutura estática para um modelo dinâmico gerenciado via API e banco de dados.
  - A documentação de arquitetura (`ARCHITECTURE.md`) foi atualizada para descrever o novo fluxo e a especificação da API CRUD (`POST`, `GET`, `PUT`, `DELETE` para `/regras`).

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

## v1_0_0-beta.1 - 2025-09-20 14:00:00 - davidson.dev.br

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
                                      - Implementado um tour guiado em múltiplos passos (`WelcomeModal`) que é exibido aos neuen usuários.
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




    





    

