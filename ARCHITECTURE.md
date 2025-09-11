# Arquitetura do Sistema - Dungeon App

Este documento descreve os objetivos e a arquitetura planejada para o sistema de reservas da Dungeon Belém.

## Objetivos Principais

### 1. Estrutura e Telas
- **Landing Page**: Uma página de apresentação pública para novos usuários, com as principais funcionalidades do sistema e um link para a área de login.
- **Dashboard**: Exibir agenda completa com disponibilidade de salas em formato de timeline e uma lista de reservas com filtros avançados.
- **Minhas Reservas**: Listar reservas do usuário (atuais e passadas).
- **Reservar Sala**: Fluxo integrado ao Dashboard para agendamento.
- **Meu Perfil**: Permitir visualização e edição completa dos dados do usuário, incluindo informações pessoais, de associação e preferências de jogo.
- **Cobranças**: Exibir status de pagamento e permitir quitação.
- **Área do Administrador**: Painel para gerenciamento completo do sistema, incluindo planos, usuários, salas e regras de negócio.

### 2. Funcionalidades do Usuário (Associado)
- **Autenticação e Onboarding**:
  - **Autenticação**: Login exclusivo com Google (OAuth) e gerenciamento de sessão via Firebase.
  - **Fluxo de Novo Usuário**: Após o primeiro login, o usuário é registrado automaticamente e direcionado para uma página de inscrição para escolher seu plano de associação.
  - **Perfil do Usuário**: Página completa para o usuário gerenciar suas informações, incluindo nome, foto (sincronizada com Google), apelido, telefone, documentos (CPF/RG), data de nascimento, redes sociais e preferências de jogo (RPG, Board Game, Card Game).
- **Sistema de Avisos**: Exibir avisos importantes do administrador após o login.
- **Sistema de Reservas**: Calendário de salas com validação baseada em cotas, categoria e horários especiais (Corujão).
- **Cotas de Reserva**: Implementar limites de reserva por categoria de usuário (Player, Gamer, Master).
- **Confirmação e Cancelamento Automático**: Sistema automatizado para confirmar ou cancelar reservas não confirmadas.
- **Gerenciamento de Convidados**: Permitir adição de outros membros ou convidados, com controle de cotas e cobranças.
- **Gerenciamento de Participação**: Permitir que usuários saiam de reservas.
- **Edição e Cancelamento de Reservas**: Permitir que o criador da reserva edite ou cancele com antecedência.
- **Sistema de Cobrança**: Geração de cobranças mensais automáticas e QR Code PIX para pagamento.

### 3. Funcionalidades do Administrador
- **Níveis de Acesso**: Definir perfis de administrador (Administrador, Editor, Revisor) com permissões granulares gerenciadas por Custom Claims no Firebase.
- **Dashboard de Estatísticas**: Painel com métricas de uso do sistema.
- **Gerenciamento de Planos e Regras**: Interface para criar, editar e excluir planos de associação, controlando dinamicamente preços, cotas (semanal, mensal, corujão), limites de convidados e peso de voto.
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
