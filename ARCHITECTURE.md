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
- **Área do Administrador**: Painel para gerenciamento completo do sistema, incluindo planos, usuários, salas e regras de negócio.

### 2. Funcionalidades do Usuário (Associado)
- **Autenticação e Onboarding**:
  - **Autenticação**: Login exclusivo com Google (OAuth) e gerenciamento de sessão via Firebase. O sistema utiliza `signInWithRedirect` para garantir compatibilidade com WebViews e navegadores externos de aplicativos móveis.
  - **Fluxo de Novo Usuário**: Após o primeiro login, o sistema guia o usuário através de um modal de boas-vindas, incentivando-o a completar o perfil e, em seguida, a se matricular em um plano.
  - **Perfil do Usuário**: Página completa para o usuário gerenciar suas informações, incluindo nome, foto (sincronizada com Google), apelido, telefone, documentos (CPF/RG), data de nascimento, redes sociais e preferências de jogo (RPG, Board Game, Card Game).
    - **Verificação de Maioridade**: O sistema valida a data de nascimento para garantir que apenas usuários maiores de 18 anos possam se cadastrar.
    - **Preenchimento de Endereço via CEP**: Para melhorar a experiência de cadastro, o formulário de perfil utiliza a API do ViaCEP para preencher automaticamente os campos de endereço (rua, bairro, cidade, estado) após a inserção de um CEP válido.
- **Sistema de Avisos**: Exibir avisos importantes do administrador após o login e manter um histórico acessível no mural.
- **Sistema de Reservas**: Calendário de salas com validação baseada em cotas, categoria e horários especiais (Corujão).
- **Cotas de Reserva**: Implementar limites de reserva por categoria de usuário (Player, Gamer, Master), com controle de cotas semanal, mensal e de corujão.
- **Gerenciamento de Convidados**: Permitir adição de outros membros ou convidados, com controle de cota mensal e cobrança avulsa para convidados extras (se aplicável).
- **Gerenciamento de Participação**: Permitir que usuários saiam de reservas futuras e que o criador da reserva possa editar ou cancelar com antecedência.
- **Sistema de Cobrança**:
    - **Geração de Cobrança sob Demanda**: Cobranças de matrícula (mensalidade + joia) são geradas em tempo real quando o usuário opta por pagar, e não no momento da seleção do plano. A transação só é consolidada após a confirmação do pagamento.
    - **Gateway de Pagamento**: Integração com o Mercado Pago para processamento de pagamentos via PIX.
    - **Confirmação via Webhook**: Um webhook escuta as confirmações de pagamento do gateway. Após uma confirmação, o sistema atualiza automaticamente o status da transação e, no caso de uma matrícula, o status e a categoria do usuário para "Ativo".
    - **Transparência de Pagamento**: O usuário tem uma visão clara do status de pagamento de sua taxa de inscrição (joia) em seu perfil, garantindo a confirmação de sua matrícula completa.

### 3. Funcionalidades do Administrador
- **Níveis de Acesso**: Definir perfis de administrador (Administrador, Editor, Revisor) com permissões granulares gerenciadas por Custom Claims no Firebase.
- **Dashboard de Estatísticas**: Painel com métricas de uso do sistema.
- **Gerenciamento de Planos e Regras**: Interface para criar, editar e excluir planos de associação, controlando dinamicamente preços, cotas (semanal, mensal, corujão), limites de convidados e peso de voto. As alterações são refletidas em tempo real.
- **Gerenciamento de Avisos**: Criar, enviar e monitorar a visualização de avisos.
- **Gerenciamento de Salas**: CRUD de salas e definição de capacidade.
- **Gerenciamento de Usuários**: Visualizar, bloquear, aplicar multas e gerenciar níveis de acesso dos usuários. A criação de usuários é automática no primeiro login.
- **Gerenciamento de Reservas**: Painel para visualizar e moderar todas as reservas do sistema.
- **Gerenciamento de Cobranças**: Controle de cobranças avulsas e visualização do histórico financeiro.

## Requisitos Não-Funcionais

### 1. Acessibilidade (WCAG)
- Garantir que a aplicação seja acessível a todos os usuários, seguindo as diretrizes do WCAG (Web Content Accessibility Guidelines).
- **Contraste de Cores**: O tema da aplicação deve garantir um contraste adequado entre texto e fundo.
- **Navegação por Teclado**: Todos os elementos interativos (botões, links, inputs) devem ser totalmente navegáveis e operáveis utilizando apenas o teclado.
- **Leitores de Tela**: A aplicação deve ser compatível com leitores de tela (como NVDA e VoiceOver), utilizando HTML semântico e atributos ARIA (`aria-label`, `aria-describedby`, etc.) para fornecer contexto adequado.
- **Rótulos e Descrições**: Todos os campos de formulário e controles devem ter rótulos claros e, quando necessário, descrições.
