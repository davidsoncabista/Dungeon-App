
# Dungeon App - Sistema de Reserva de Salas da Dungeon Belém

O Dungeon App é o sistema oficial e completo para gerenciamento de reservas de salas para a **Associação Dungeon Belém**, focado em jogadores de RPG, Board Games e Card Games. A plataforma conta com uma área pública de apresentação e uma área restrita para associados.

## Funcionalidades

### Para Associados

- **Autenticação Segura e Acessível**: Login simplificado com Google, utilizando um fluxo (`signInWithRedirect`) compatível com WebViews de aplicativos móveis.
- **Controle de Acesso por Status**: O sistema garante que apenas membros com status "Ativo" possam realizar novas reservas, direcionando usuários com pendências para a página de cobrança.
- **Agenda Multivisualização**: Uma agenda robusta que permite visualizar a disponibilidade das salas em formato de **calendário mensal** ou em uma **timeline diária/semanal**.
- **Fluxo de Onboarding Guiado**: Novos usuários são recebidos com um tour interativo que os orienta a completar o perfil e a escolher um plano de associação.
- **Gerenciamento de Reservas**: Os usuários podem criar novas reservas, editar agendamentos futuros e visualizar seu histórico completo na página "Minhas Reservas".
- **Gerenciamento de Participação**: Flexibilidade para o organizador editar os participantes e para os convidados saírem de uma reserva futura.
- **Extrato de Reservas com Ordenação**: Visualize, filtre e veja os detalhes de seus agendamentos passados e futuros. Ordene a lista por data ou número de participantes para melhor organização.
- **Controle de Cotas Transparente**: Um painel em "Minhas Reservas" exibe em tempo real o saldo de cotas de reserva mensal, corujão e de convidados, com a data de renovação do ciclo.
- **Perfil de Usuário Completo**: Edite suas informações pessoais, apelido, telefone, documentos, data de nascimento (com **verificação de maioridade**) e preferências de jogo. O formulário de endereço conta com **preenchimento automático via CEP**.
- **Comunicação Centralizada**:
  - **Mural de Avisos**: Fique por dentro dos últimos comunicados gerais da administração.
  - **Caixa de Entrada Privada**: Receba mensagens diretas da administração (avisos, advertências, etc.) com um indicador de notificações não lidas no cabeçalho.
- **Pagamentos Simplificados**: Gere um QR Code PIX através do gateway de pagamento seguro para quitar sua matrícula e mensalidades.
- **Transparência na Matrícula**: Visualize claramente o valor da taxa de inscrição (joia) durante o processo e confirme o status do seu pagamento diretamente no seu perfil.
- **Participação em Votações**: Participe de votações importantes da associação através de uma página dedicada, que aparece apenas quando você é elegível para votar.

### Para Administradores

- **Painel de Controle Centralizado**: Uma área de administração robusta e organizada em seções (`Sistema`, `Finanças`, `Mensagens`) para gerenciar todos os aspectos do sistema.
- **Comunicação Direta com Membros**: Envie mensagens privadas e categorizadas (aviso, advertência, multa, etc.) para usuários específicos através da página de `Mensagens`, com histórico de envio.
- **Sistema de Votação Democrático**: Crie votações flexíveis, defina quem pode votar, inicie, encerre e apure os resultados ponderados pelo peso de voto de cada membro, tudo em uma interface centralizada.
- **Gerenciamento de Planos e Regras de Negócio**: Crie, edite e remova planos de associação dinamicamente. Controle os preços, cotas de reserva e limites de convidados em uma única interface.
- **Gerenciamento de Usuários Simplificado**: Acompanhe a lista de membros, gerencie status, aplique advertências e controle níveis de acesso administrativo (`Administrador`, `Editor`, `Revisor`).
- **Gerenciamento de Salas**: Crie, edite ou remova salas, ajustando sua capacidade e configurações.
- **Comunicação em Massa**: Envie avisos para todos os usuários através de um formulário integrado no Mural de Avisos.
- **Dashboard de Estatísticas**: Visualize métricas de uso, como taxa de ocupação, número de adimplentes e a lista de aniversariantes do mês.
- **Moderação de Reservas**: Tenha uma visão completa de todas as reservas e realize aprovações ou cancelamentos.
- **Gestão Financeira**: Gerencie cobranças avulsas, marque transações como pagas e tenha acesso ao histórico financeiro de todos os membros.

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
