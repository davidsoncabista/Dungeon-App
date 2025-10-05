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
- **Log de Auditoria**: Uma página (`/admin/audit-log`) onde administradores podem visualizar um registro de todas as ações importantes realizadas no sistema, com filtros para facilitar a análise.

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
    - **Preenchimento de Endereço via CEP**: O formulário de perfil utiliza la API do ViaCEP para preencher automaticamente os campos de endereço.
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
    - **Descrição Dinâmica**: A página de votação exibe descrições detalhadas para cada proposta ou candidato, utilizando um sistema de conteúdo que permite associar perfis de membros (com foto e nome) às opções, tornando a votação mais clara e informativa.
    - **Interface de Voto**: O membro pode visualizar as opções e registrar seu voto uma única vez.
    - **Confirmação de Voto**: Após o voto, a interface é substituída por uma mensagem clara, informando que a ação foi registrada e que os resultados estarão disponíveis após o encerramento.

### 3. Funcionalidades do Administrador
- **Níveis de Acesso**: Definir perfis de administrador (Administrador, Editor, Revisor) com permissões granulares gerenciadas por Custom Claims no Firebase.
- **Painel de Controle Centralizado**: Reorganização das ferramentas administrativas em páginas dedicadas para melhor usabilidade: `Finanças`, `Mensagens` e `Sistema`.
- **Gerenciamento de Mensagens Diretas**:
    - **Envio Seguro**: Interface em `/admin/messages` que utiliza uma Cloud Function (`sendUserMessage`) para que administradores possam enviar mensagens privadas a usuários específicos.
    - **Categorização**: As mensagens podem ser categorizadas como `aviso`, `advertencia`, `multa` ou `bloqueio`, facilitando a comunicação formal.
    - **Histórico**: A administração pode visualizar todas as mensagens enviadas e seus status (lida/não lida).
- **Módulo de Votação (Admin)**:
  - **Criação Flexível**: Interface no painel de administração (`/admin/system`) para criar votações com título, opções e uma descrição dinâmica, permitindo adicionar múltiplos itens de conteúdo com texto e associação de perfis de membros.
  - **Controle de Votantes**: Permitir que o administrador selecione uma lista de membros "Ativos" elegíveis para cada votação, garantindo que apenas o público certo participe.
  - **Gestão do Ciclo de Vida**: Funcionalidades para iniciar e encerrar votações manualmente, dando controle total sobre o período de votação.
  - **Apuração de Votos**: O sistema calculará automaticamente os resultados finais, ponderando cada voto com base na `category` (e, consequentemente, no `votingWeight`) do membro no momento da votação.
- **Gerenciamento de Planos e Regras**: Interface em `/admin/system` para criar, editar e excluir planos, controlando preços, cotas e limites.
- **Gerenciamento de Avisos**: Criar, enviar e monitorar a visualização de avisos públicos.
- **Gerenciamento de Salas**: CRUD de salas e definição de capacidade.
- **Gerenciamento de Usuários**: Visualizar, bloquear, aplicar multas e gerenciar níveis de acesso.
- **Gerenciamento de Cobranças**: Controle de cobranças avulsas e visualização do histórico financeiro em `/admin/finance`.
- **Auditoria do Sistema**:
    - **Visualizador de Logs**: Acesso à página `/admin/audit-log` que exibe uma tabela com todas as ações críticas registradas no sistema.
    - **Filtros Avançados**: A interface permite filtrar os logs por e-mail do ator, tipo de ação e intervalo de datas para facilitar a investigação.

## Requisitos Não-Funcionais

### 1. Sistema de Auditoria
- **Rastreamento de Ações**: O sistema deve registrar eventos críticos em uma coleção `auditLogs` no Firestore para fins de segurança e rastreabilidade.
- **Ações Registradas**:
    - `USER_LOGIN`: Log de cada login bem-sucedido.
    - `CREATE_BOOKING` / `CANCEL_BOOKING`: Logs para criação e cancelamento de reservas.
    - `PROCESS_PAYMENT`: Log de pagamentos processados com sucesso pelo webhook.
    - `SEND_MESSAGE`: Log de mensagens diretas enviadas pela administração.
    - `CREATE_GUEST_CHARGE`: Log de cobranças automáticas por convidados extras.
- **Interface de Consulta**: Fornecer uma interface para administradores (`/admin/audit-log`) onde seja possível visualizar e filtrar esses logs.

### 2. Acessibilidade (WCAG)
- Garantir que a aplicação seja acessível a todos os usuários, seguindo as diretrizes do WCAG.

### 3. API de Regras de Acesso (CRUD)
- A arquitetura do sistema evoluiu para um modelo dinâmico gerenciado via banco de dados e exposto através de uma API RESTful.

#### Modelo de Dados: `AccessRule`
O objeto `AccessRule` representa a estrutura de uma regra de acesso no banco de dados.

-   **`id`** (string, obrigatório): Identificador único da regra (ex: "Administrador", "Editor").
-   **`description`** (string, obrigatório): Explicação em linguagem natural sobre o escopo de permissões.
-   **`pages`** (`Record<string, "editor" | "revisor">`, obrigatório): Um objeto onde cada chave é o caminho de uma página (ex: "/admin/rooms") e o valor é o nível de permissão.
    - **`revisor`**: Permite apenas a visualização da página.
    - **`editor`**: Permite visualização, criação, edição e exclusão de conteúdo na página.
