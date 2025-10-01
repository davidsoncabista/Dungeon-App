# Dungeon App - Sistema de Reserva de Salas da Dungeon Belém

O Dungeon App é o sistema oficial para gerenciamento de reservas, comunicação e administração da **Associação Dungeon Belém**, uma comunidade de jogadores de RPG, Board Games e Card Games. A plataforma foi construída para modernizar e automatizar os processos da associação, oferecendo uma experiência integrada para membros e administradores.

## Tecnologias Utilizadas

O projeto é construído com uma stack moderna e robusta, focada em performance, escalabilidade e uma ótima experiência de desenvolvimento.

- **Frontend**: [Next.js](https://nextjs.org/) (React Framework) com App Router, [TypeScript](https://www.typescriptlang.org/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/guide/packages/lucide-react) (ícones)
- **Backend & Infraestrutura**: [Firebase](https://firebase.google.com/)
  - **Autenticação**: Firebase Authentication (Login com Google)
  - **Banco de Dados**: Cloud Firestore (NoSQL em tempo real)
  - **Funções Serverless**: Cloud Functions for Firebase
  - **Hospedagem**: Firebase App Hosting
- **Formulários**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) (validação)
- **Estado e Sincronização com Firebase**: [React Firebase Hooks](https://github.com/csfrequency/react-firebase-hooks)
- **Pagamentos**: [Mercado Pago SDK](https://www.mercadopago.com.br/developers/pt/docs)

## Como Começar

Para rodar o projeto em ambiente de desenvolvimento, siga os passos abaixo:

1. **Clone o repositório:**
   ```bash
   git clone <https://github.com/davidsoncabista/Dungeon-App.git>
   cd <nome-do-repositorio>
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente do Firebase:**
   - Crie um arquivo `.env.local` na raiz do projeto.
   - Adicione as chaves de configuração do seu projeto Firebase. Você pode obtê-las no Console do Firebase > Configurações do Projeto.

4. **Configure a Integração com Mercado Pago (Obrigatório para testar pagamentos):**
   - Por padrão, o sistema está configurado para usar uma conta de teste do Mercado Pago. Para testar o fluxo de ponta a ponta, você precisará de suas próprias credenciais de desenvolvedor.
   - **Crie uma conta de desenvolvedor**: Acesse o [Dashboard de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel) e crie uma nova aplicação.
   - **Obtenha suas credenciais**: Na sua aplicação, vá para a seção "Credenciais de Produção" (para testes reais) ou "Credenciais de Teste" (recomendado). Você precisará da **Chave Pública (Public Key)** e do **Token de Acesso (Access Token)**.
   - **Adicione as chaves ao seu ambiente**: No arquivo `.env.local`, adicione a seguinte variável:
     ```
     NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="SUA_CHAVE_PÚBLICA"
     ```
   - **Configure o Access Token nas Cloud Functions**: O Access Token é uma chave secreta e deve ser configurada diretamente no ambiente do Firebase para segurança. Rode o seguinte comando no seu terminal, substituindo os valores:
     ```bash
     firebase functions:config:set mercadopago.access_token="SEU_ACCESS_TOKEN"
     ```

5. **Rode o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

6. **Acesse a aplicação:**
   - Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Fazendo Deploy
Para publicar as alterações no Firebase (App Hosting e Functions), utilize o comando:
`firebase deploy`

Certifique-se de estar autenticado na CLI do Firebase (`firebase login`).

## Guia de Uso

### Para Associados

- **Autenticação Segura e Acessível**: Login simplificado com Google, utilizando um fluxo (`signInWithRedirect`) compatível com WebViews de aplicativos móveis.
- **Fluxo de Onboarding Guiado**: Novos usuários são recebidos com um tour interativo que os orienta a completar o perfil e a escolher um plano de associação.
- **Controle de Acesso por Status**: O sistema garante que apenas membros com status "Ativo" possam realizar novas reservas, direcionando usuários com pendências para a página de cobrança.

#### Páginas Principais

- **Agenda Online (`/online-schedule`)**: Uma agenda robusta que permite visualizar a disponibilidade das salas em formato de **calendário mensal** ou em uma **timeline diária/semanal**.
- **Minhas Reservas (`/my-bookings`)**: Gerencie suas reservas, edite agendamentos futuros e visualize seu histórico completo. Aqui também fica o **painel de cotas**, que exibe em tempo real o saldo de reservas mensais, "corujão" e convidados.
- **Matrícula e Cobranças (`/billing`)**: Novos usuários são direcionados para cá para escolher um plano e se associar. Membros existentes podem visualizar seu histórico de pagamentos e quitar pendências via PIX com Mercado Pago.
- **Meu Perfil (`/profile`)**: Edite suas informações pessoais, apelido, telefone, documentos, data de nascimento (com **verificação de maioridade**) e preferências de jogo. O formulário de endereço conta com **preenchimento automático via CEP**.
- **Mural de Avisos (`/notices`)**: Fique por dentro dos últimos comunicados gerais da administração.
- **Minhas Mensagens (`/messages`)**: Caixa de entrada privada para receber mensagens diretas da administração (avisos, advertências, etc.), com um indicador de notificações não lidas no cabeçalho.
- **Votação (`/voting`)**: Participe de votações importantes da associação através de uma página dedicada, que aparece no menu apenas quando você é elegível para votar.

### Para Administradores

Uma área de administração robusta e organizada, acessível através do menu principal para usuários com as permissões adequadas.

- **Estatísticas (`/statistics`)**: Dashboard com métricas de uso, como total de membros, número de reservas, aniversariantes do mês e um gráfico com os tipos de jogos mais curtidos pela comunidade.
- **Gerenciamento de Usuários (`/users`)**: Acompanhe a lista de membros, gerencie status, aplique advertências e controle níveis de acesso administrativo (`Administrador`, `Editor`, `Revisor`).
- **Administração (`/admin`)**: Um painel centralizado com sub-rotas para gerenciar todos os aspectos do sistema:
  - **Sistema (`/admin/system`)**: Crie e edite planos de associação, controle preços, cotas de reserva, limites de convidados e o valor da taxa de inscrição (joia). Também é aqui que se gerencia o **sistema de votação**.
  - **Finanças (`/admin/finance`)**: Visualize o histórico financeiro de todos os membros, gere cobranças avulsas e marque transações como pagas manualmente.
  - **Mensagens (`/admin/messages`)**: Envie mensagens privadas e categorizadas (aviso, advertência, multa, etc.) para usuários específicos, com um histórico completo de envio.
  - **Regras de Acesso (`/admin/access-rules`)**: Crie, edite e exclua dinamicamente as regras e permissões de cada nível de acesso administrativo.
  - **Salas (`/admin/rooms`)**: Crie, edite ou remova as salas de jogo, ajustando sua capacidade e configurações.
- **Editor da Landing Page (`/admin/landing-editor`)**: Um CMS integrado para gerenciar o conteúdo da página inicial de forma modular, permitindo adicionar, editar e reordenar blocos de conteúdo (herói, lista de features, etc.) e gerenciar uma biblioteca de mídia otimizada.

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
