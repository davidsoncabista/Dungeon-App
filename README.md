
# Dungeon App - Sistema de Reserva de Salas da Dungeon Belém

O Dungeon App é o sistema oficial e completo para gerenciamento de reservas de salas para a **Associação Dungeon Belém**, focado em jogadores de RPG, Board Games e Card Games. A plataforma conta com uma área pública de apresentação e uma área restrita para associados.

## Funcionalidades

### Para Associados

- **Visualização de Disponibilidade**: Uma agenda clara e responsiva mostra a disponibilidade de todas as salas, com uma timeline de 24 horas que se adapta a qualquer tela.
- **Gerenciamento de Reservas**: Os usuários podem criar novas reservas e visualizar seu histórico completo na página "Minhas Reservas".
- **Extrato de Reservas**: Visualize e filtre agendamentos passados e futuros com filtros por período e ordenação de dados.
- **Controle de Cotas Transparente**: Um painel em "Minhas Reservas" exibe em tempo real o saldo de cotas de reserva mensal, corujão e de convidados, com a data de renovação do ciclo.
- **Perfil de Usuário Completo**: Edite suas informações pessoais, apelido, telefone, documentos (CPF/RG), data de nascimento, redes sociais e até mesmo suas preferências de jogo (RPG, Board Games, Card Games).
- **Sistema de Cotas Justo**: As reservas são validadas de acordo com a categoria do associado (Player, Gamer, Master), garantindo o uso justo dos recursos.
- **Horário Corujão**: Suporte para horários especiais com regras de cota diferenciadas.
- **Convites com Cota Mensal**: Adicione outros membros ou convidados às suas sessões, com a cota de convidados sendo controlada mensalmente.
- **Pagamentos Simplificados**: Gere um QR Code PIX para pagamento rápido e fácil da mensalidade.
- **Sistema de Avisos**: Receba notificações importantes da administração diretamente no aplicativo.
- **Confirmação Automatizada**: Lembretes para confirmar a reserva, com cancelamento automático para evitar salas ociosas.

### Para Administradores

- **Painel de Controle Centralizado**: Uma área de administração robusta para gerenciar todos os aspectos do sistema.
- **Gerenciamento de Planos e Regras de Negócio**: Crie, edite e remova planos de associação dinamicamente. Controle os preços, cotas de reserva (semanal, mensal, corujão), limite mensal de convidados e peso de voto para cada plano em uma única interface. As alterações são refletidas instantaneamente na página de matrícula.
- **Gerenciamento de Usuários Simplificado**: Acompanhe a lista de membros, gerencie status de pagamento, aplique advertências e controle níveis de acesso administrativo (`Administrador`, `Editor`, `Revisor`) com segurança através de `Custom Claims`.
- **Gerenciamento de Salas**: Crie, edite ou remova salas, ajustando sua capacidade e outras configurações.
- **Dashboard de Estatísticas**: Visualize métricas de uso, como salas mais populares, taxa de ocupação, número de adimplentes e muito mais.
- **Moderação de Reservas**: Tenha uma visão completa de todas as reservas и realize aprovações, edições ou cancelamentos quando necessário.
- **Comunicação Direta**: Envie avisos para todos os usuários e acompanhe quem já visualizou.
- **Gestão Financeira**: Gerencie cobranças avulsas e tenha acesso ao histórico de transações de todos os membros.

## Desenvolvimento e Deploy

### Rodando Localmente
Para rodar o projeto em ambiente de desenvolvimento, utilize o comando:
`npm run dev`

### Fazendo Deploy
Para publicar as alterações no Firebase (App Hosting e Functions), utilize o comando:
`firebase deploy`

Certifique-se de estar autenticado na CLI do Firebase (`firebase login`).

## Equipe do Projeto

- **Davidson Santos Conceição**: Project Lead & DevOps Engineer
- **Heydrigh Leão Ribeiro**: Full Stack Developer
- **Caio de Oliveira Bastos**: Tesoureiro & Front-end Developer
- **Thyago Costa (@thyagobib)**: UI/UX Designer
- **Luiz Pedro Reis Pinheiro (@luizprp)**: UI/UX Designer 
- **Hermann Duarte Ribeiro Filho**: Homologação (Testes)
- **Thiago de Castro Araújo**: Homologação (Testes)
- **Bruno Rafael Viana Oliveira (@brunorvo)**: Consultor de Fluxo e Homologação
- **Iasmin Oneide Figueira de Castro Leal (@koda_master)**: Homologação (Testes)

Este projeto foi construído com Next.js, React, Tailwind CSS e Firebase.
