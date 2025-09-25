# Arquitetura do Sistema - Dungeon App

Este documento descreve os objetivos e a arquitetura planejada para o sistema de reservas da Dungeon Belém.

## Objetivos Principais

### 1. Estrutura e Telas
- **Landing Page**: Uma página de apresentação pública para novos usuários, com as principais funcionalidades do sistema e um link para a área de login.
- **Dashboard (Agenda Online)**: Exibir agenda completa com disponibilidade de salas em formato de calendário (mensal) e timeline (diária/semanal).
- **Minhas Reservas**: Listar reservas do usuário (atuais e passadas) com ordenação e exibir um painel com o saldo de cotas de uso (mensal, corujão, convidados).
- **Reservar Sala**: Fluxo integrado ao Dashboard para agendamento, com validação de cotas em tempo real.
- **Meu Perfil**: Permitir visualização e edição completa dos dados do usuário, incluindo informações pessoais, de associação e preferências de jogo.
- **Cobranças/Matrícula**: Exibir status de pagamento, permitir quitação e guiar o usuário na escolha de um plano de associação.
- **Mural de Avisos**: Página para consultar o histórico de comunicados da administração.
- **Caixa de Mensagens**: Página para o usuário visualizar mensagens privadas enviadas pela administração.
- **Página de Votação**: Uma página (`/voting`) que aparece condicionalmente para membros elegíveis quando uma votação está ativa.
- **Área do Administrador**: Painel para gerenciamento completo do sistema, incluindo planos, usuários, salas, finanças, regras de negócio e votações.

### 2. Funcionalidades do Usuário (Associado)
- **Autenticação, Onboarding e Controle de Acesso**:
  - **Autenticação**: Login exclusivo com Google (OAuth) e gerenciamento de sessão via Firebase. O sistema utiliza `signInWithRedirect` para garantir compatibilidade com WebViews e navegadores externos.
  - **Fluxo de Novo Usuário**: Após o primeiro login, o sistema guia o usuário através de um modal de boas-vindas, incentivando-o a completar o perfil e, em seguida, a se matricular em um plano.
  - **Proteção de Rotas por Status**: O acesso às funcionalidades principais é rigidamente controlado pelo status do usuário.
    - **Pendente (Cadastro Incompleto)**: O usuário é direcionado para a página de perfil (`/profile`) e só pode acessá-la até que os dados obrigatórios sejam preenchidos.
    - **Visitante (Pendente de Matrícula)**: Após completar o perfil, o usuário pode acessar páginas públicas de logado (`/my-bookings`, `/profile`, `/billing`) mas é incentivado a se matricular.
    - **Pendente (Pagamento Atrasado) / Bloqueado**: O acesso é restrito às páginas públicas de logado, sendo direcionado para `/billing` para regularizar sua situação.
    - **Ativo**: Acesso total às funcionalidades do seu plano.
  - **Perfil do Usuário**: Página completa para o usuário gerenciar suas informações, incluindo nome, foto (sincronizada com Google), apelido, telefone, documentos (CPF/RG), data de nascimento, redes sociais e preferências de jogo.
    - **Verificação de Maioridade**: O sistema valida a data de nascimento para garantir que apenas usuários maiores de 18 anos possam se cadastrar.
    - **Preenchimento de Endereço via CEP**: O formulário de perfil utiliza a API do ViaCEP para preencher automaticamente os campos de endereço.
- **Sistema de Comunicação**:
  - **Mural de Avisos**: Exibir avisos importantes do administrador após o login e manter um histórico acessível no mural.
  - **Caixa de Entrada Privada**: Uma página (`/messages`) onde o usuário pode visualizar todas as mensagens diretas e categorizadas (avisos, advertências, multas) enviadas pela administração, com um indicador de mensagens não lidas no cabeçalho.
- **Sistema de Reservas**: Calendário de salas com validação baseada em cotas, categoria e horários especiais (Corujão).
- **Cotas de Reserva**: Implementar limites de reserva por categoria de usuário (Player, Gamer, Master), com controle de cotas semanal, mensal e de corujão.
- **Gerenciamento de Convidados**: Permitir adição de outros membros ou convidados, com controle de cota mensal e cobrança avulsa para convidados extras.
- **Gerenciamento de Participação**: Permitir que usuários saiam de reservas futuras e que o criador da reserva possa editar ou cancelar com antecedência.
- **Sistema de Cobrança**:
    - **Gateway de Pagamento**: Integração com o Mercado Pago para processamento de pagamentos via PIX.
    - **Confirmação via Webhook**: Um webhook escuta as confirmações de pagamento, atualizando automaticamente o status da transação e do usuário.
    - **Transparência de Pagamento**: O usuário tem uma visão clara do status de pagamento de sua taxa de inscrição (joia) em seu perfil.
- **Sistema de Votação**:
    - **Acesso Condicional**: Um item de menu "Votação" e a página `/voting` se tornam visíveis apenas quando há uma votação ativa para a qual o membro é elegível.
    - **Interface de Voto**: O membro pode visualizar as opções e registrar seu voto uma única vez.
    - **Visualização de Resultados**: Após votar ou após o encerramento da votação, o membro pode visualizar o resultado final.

### 3. Funcionalidades do Administrador
- **Níveis de Acesso**: Definir perfis de administrador (Administrador, Editor, Revisor) com permissões granulares gerenciadas por Custom Claims no Firebase.
- **Painel de Controle Centralizado**: Reorganização das ferramentas administrativas em páginas dedicadas para melhor usabilidade: `Finanças`, `Mensagens` e `Sistema`.
- **Gerenciamento de Mensagens Diretas**:
    - **Envio Seguro**: Interface em `/admin/messages` que utiliza uma Cloud Function (`sendUserMessage`) para que administradores possam enviar mensagens privadas a usuários específicos.
    - **Categorização**: As mensagens podem ser categorizadas como `aviso`, `advertencia`, `multa` ou `bloqueio`, facilitando a comunicação formal.
    - **Histórico**: A administração pode visualizar todas as mensagens enviadas e seus status (lida/não lida).
- **Sistema de Votação Democrático**:
  - **Criação Flexível**: Interface no painel de administração (`/admin/system`) para criar votações com título, descrição e opções personalizáveis.
  - **Controle de Votantes**: Permitir que o administrador selecione uma lista de membros "Ativos" elegíveis para cada votação, garantindo que apenas o público certo participe.
  - **Gestão do Ciclo de Vida**: Funcionalidades para iniciar e encerrar votações manualmente, dando controle total sobre o período de votação.
  - **Apuração com Peso de Voto**: O sistema calculará automaticamente os resultados finais, ponderando cada voto com base na `category` (e, consequentemente, no `votingWeight`) do membro no momento da votação.
- **Gerenciamento de Planos e Regras**: Interface em `/admin/system` para criar, editar e excluir planos, controlando preços, cotas e limites.
- **Gerenciamento de Avisos**: Criar, enviar e monitorar a visualização de avisos públicos.
- **Gerenciamento de Salas**: CRUD de salas e definição de capacidade.
- **Gerenciamento de Usuários**: Visualizar, bloquear, aplicar multas e gerenciar níveis de acesso.
- **Gerenciamento de Cobranças**: Controle de cobranças avulsas e visualização do histórico financeiro em `/admin/finance`.

## Requisitos Não-Funcionais

### 1. Acessibilidade (WCAG)
- Garantir que a aplicação seja acessível a todos os usuários, seguindo as diretrizes do WCAG (Web Content Accessibility Guidelines).
- **Contraste de Cores**: O tema da aplicação deve garantir um contraste adequado entre texto e fundo.
- **Navegação por Teclado**: Todos os elementos interativos (botões, links, inputs) devem ser totalmente navegáveis e operáveis utilizando apenas o teclado.
- **Leitores de Tela**: A aplicação deve ser compatível com leitores de tela (como NVDA e VoiceOver), utilizando HTML semântico e atributos ARIA (`aria-label`, `aria-describedby`, etc.) para fornecer contexto adequado.
- **Rótulos e Descrições**: Todos os campos de formulário e controles devem ter rótulos claros e, quando necessário, descrições.

### 2. API de Regras de Acesso (CRUD)
A arquitetura do sistema está evoluindo de uma estrutura de regras estática (definida no código-fonte) para um modelo dinâmico gerenciado via banco de dados e exposto através de uma API RESTful. Isso permitirá que as permissões de cada nível de usuário (`AdminRole`) sejam modificadas em tempo de execução, sem a necessidade de um novo deploy.

-   **`POST /regras`**: Cria uma nova regra de acesso.
    -   **Payload de Requisição:** `AccessRule`
    -   **Resposta de Sucesso (201):** A regra recém-criada.

-   **`GET /regras/{id}`**: Busca uma regra de acesso específica pelo seu ID.
    -   **Parâmetro de URL:** `id` (string)
    -   **Resposta de Sucesso (200):** O objeto `AccessRule` correspondente.

-   **`PUT /regras/{id}`**: Atualiza uma regra de acesso existente.
    -   **Parâmetro de URL:** `id` (string)
    -   **Payload de Requisição:** `Partial<AccessRule>`
    -   **Resposta de Sucesso (200):** A regra atualizada.

-   **`DELETE /regras/{id}`**: Exclui uma regra de acesso.
    -   **Parâmetro de URL:** `id` (string)
    -   **Resposta de Sucesso (204):** Sem conteúdo.

#### Modelo de Dados: `AccessRule`
O objeto `AccessRule` representa a estrutura de uma regra de acesso no banco de dados.

-   **`id`** (string, obrigatório): Identificador único da regra (ex: "Administrador", "Editor").
-   **`description`** (string, obrigatório): Explicação em linguagem natural sobre o escopo de permissões.
-   **`pages`** (array de strings, obrigatório): Lista de páginas ou funcionalidades que o nível de acesso pode visualizar e interagir.
