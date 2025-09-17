
# Dungeon App - Sistema de Reserva de Salas da Dungeon Belém

O Dungeon App é o sistema oficial e completo para gerenciamento de reservas de salas para a **Associação Dungeon Belém**, focado em jogadores de RPG, Board Games e Card Games. A plataforma conta com uma área pública de apresentação e uma área restrita para associados.

## Funcionalidades

### Para Associados

- **Agenda Multivisualização**: Uma agenda robusta que permite visualizar a disponibilidade das salas em formato de **calendário mensal** ou em uma **timeline diária/semanal**, adaptando-se às preferências do usuário.
- **Fluxo de Onboarding Guiado**: Novos usuários são recebidos com um tour interativo que os orienta a completar o perfil e a escolher um plano de associação.
- **Gerenciamento de Reservas**: Os usuários podem criar novas reservas, editar agendamentos futuros e visualizar seu histórico completo na página "Minhas Reservas".
- **Gerenciamento de Participação**: Flexibilidade para o organizador editar os participantes e para os convidados saírem de uma reserva futura.
- **Extrato de Reservas com Ordenação**: Visualize e filtre seus agendamentos passados e futuros. Ordene a lista por data ou número de participantes para melhor organização.
- **Controle de Cotas Transparente**: Um painel em "Minhas Reservas" exibe em tempo real o saldo de cotas de reserva mensal, corujão e de convidados, com a data de renovação do ciclo.
- **Perfil de Usuário Completo**: Edite suas informações pessoais, apelido, telefone, documentos (CPF/RG), data de nascimento, redes sociais e até mesmo suas preferências de jogo (RPG, Board Games, Card Games).
- **Mural de Avisos**: Fique por dentro dos últimos comunicados da administração com um modal de login e uma página de histórico de avisos.
- **Sistema de Cotas Justo**: As reservas são validadas de acordo com a categoria do associado (Player, Gamer, Master), garantindo o uso justo dos recursos.
- **Pagamentos Simplificados**: Gere um QR Code PIX para pagamento rápido e fácil da mensalidade.

### Para Administradores

- **Painel de Controle Centralizado**: Uma área de administração robusta para gerenciar todos os aspectos do sistema.
- **Gerenciamento de Planos e Regras de Negócio**: Crie, edite e remova planos de associação dinamicamente. Controle os preços, cotas de reserva (semanal, mensal, corujão), limite mensal de convidados e peso de voto para cada plano em uma única interface. As alterações são refletidas instantaneamente na página de matrícula.
- **Gerenciamento de Usuários Simplificado**: Acompanhe a lista de membros, gerencie status de pagamento, aplique advertências e controle níveis de acesso administrativo (`Administrador`, `Editor`, `Revisor`) com segurança através de `Custom Claims`.
- **Gerenciamento de Salas**: Crie, edite ou remova salas, ajustando sua capacidade e outras configurações.
- **Comunicação Direta**: Envie avisos para todos os usuários através de um formulário integrado e acompanhe quem já visualizou.
- **Dashboard de Estatísticas**: Visualize métricas de uso, como salas mais populares, taxa de ocupação, número de adimplentes e muito mais.
- **Moderação de Reservas**: Tenha uma visão completa de todas as reservas e realize aprovações, edições ou cancelamentos quando necessário.
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
