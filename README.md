 
# Dungeon App - Sistema de Reserva de Salas da Dungeon Belém 🎲

O Dungeon App é o sistema oficial e completo para gerenciamento de reservas de salas para a **Associação Dungeon Belém**, focado em jogadores de RPG, Board Games e Card Games. A plataforma conta com uma área pública de apresentação e uma área restrita para associados.

## Funcionalidades

## Guia de Uso do Dungeon App

Este guia detalha as funcionalidades de cada página do aplicativo, tanto para associados quanto para administradores.

---

### 📖 Para Associados

A área de associados foi projetada para ser intuitiva e completa, facilitando o gerenciamento de suas atividades na Dungeon Belém.

#### **Agenda (`/online-schedule`)**
O coração do aplicativo. Aqui você pode:
* **Visualizar a Disponibilidade:** Navegue pelas salas em uma visualização de **calendário mensal** ou em uma **timeline diária/semanal**.
* **Fazer Novas Reservas:** Clique em um horário disponível para abrir o formulário de agendamento. O sistema só permite agendar com até 14 dias de antecedência.
* **Convidar Participantes:** Adicione outros membros da associação à sua reserva.
* **Ver Detalhes:** Clique em uma reserva existente para ver quem são os participantes e os detalhes da sessão.

#### **Minhas Reservas (`/my-bookings`)**
Seu extrato completo de atividades.
* **Histórico de Reservas:** Visualize todas as suas reservas passadas e futuras.
* **Editar e Cancelar:** Altere os detalhes de reservas futuras (como participantes) ou cancele o agendamento.
* **Sair de uma Reserva:** Se você foi convidado para uma reserva, pode se remover da lista de participantes.
* **Controle de Cotas:** Um painel exibe seu saldo de cotas de reserva mensal, corujão e de convidados, informando a data de renovação do ciclo.

#### **Perfil (`/profile`)**
Sua identidade no Dungeon App.
* **Editar Informações:** Atualize seus dados pessoais, como nome, apelido, telefone e preferências de jogo.
* **Endereço com CEP:** O formulário conta com preenchimento automático de endereço ao digitar o CEP.
* **Nível de Acesso e Status:** Um card informativo mostra seu nível de acesso (Membro, Visitante, etc.) e o status da sua conta (Ativo, Pendente, etc.).

#### **Cobranças (`/billing`)**
A central financeira da sua associação.
* **Pagamentos Pendentes:** Se houver mensalidades ou a taxa de matrícula (joia) em aberto, elas serão exibidas aqui.
* **Gerar QR Code PIX:** Realize o pagamento de forma segura e rápida através do gateway integrado.
* **Histórico Financeiro:** Visualize o histórico de todas as suas transações.

#### **Mural de Avisos (`/notices`)**
Fique por dentro de tudo o que acontece na associação.
* **Comunicados Gerais:** Veja os últimos avisos publicados pela administração, como eventos, manutenções ou comunicados importantes.

#### **Mensagens (`/messages`)**
Sua caixa de entrada privada.
* **Mensagens da Administração:** Receba comunicados diretos da administração, como advertências, avisos sobre pagamentos ou outros assuntos particulares.
* **Notificações:** Um indicador no cabeçalho do site te avisa quando há novas mensagens não lidas.

#### **Votações (`/voting`)**
Participe das decisões da associação.
* **Votações Ativas:** Esta página só aparece no menu quando há uma votação ativa para a qual você é elegível.
* **Registrar Voto:** Visualize as opções, registre sua escolha (apenas uma vez) e acompanhe os resultados após o término.

---

### 👑 Para Administradores

A área de administração centraliza todas as ferramentas de gerenciamento do sistema, garantindo controle total sobre as operações.

#### **Painel de Administração (`/admin`)**
O menu lateral da administração organiza as ferramentas em seções lógicas:

##### **Sistema (`/admin/system`)**
Onde as regras de negócio do aplicativo são gerenciadas.
* **Gerenciamento de Planos:** Crie, edite ou remova os planos de associação, definindo preços, cotas de reserva, limites de convidados e peso de voto.
* **Gerenciamento de Votações:** Crie novas votações, defina o título, as opções e selecione os membros elegíveis para votar. Inicie, encerre e apure os resultados.
* **Acesso às Regras de Acesso:** Um atalho leva para a página de gerenciamento de permissões.

##### **Finanças (`/admin/finance`)**
Controle financeiro completo dos associados.
* **Extrato Geral:** Visualize o histórico de transações de todos os usuários.
* **Gerenciar Cobranças:** Crie cobranças avulsas (ex: taxas de evento) para usuários específicos e marque transações como "Pagas" manualmente, se necessário.

##### **Mensagens (`/admin/messages`)**
Comunicação direta e registrada com os membros.
* **Enviar Mensagem Privada:** Envie mensagens categorizadas (Aviso, Advertência, Multa, etc.) para um ou mais usuários.
* **Histórico de Envios:** Mantenha um registro de toda a comunicação enviada.

##### **Regras de Acesso (`/admin/access-rules`)**
Gerenciamento avançado de permissões.
* **Controle Dinâmico:** Crie, edite e exclua os níveis de acesso (roles) do sistema, como `Revisor` ou `Editor`.
* **Definir Permissões:** Para cada nível, defina exatamente quais páginas ou funcionalidades ele pode acessar. As mudanças são aplicadas em tempo real.

#### **Outras Páginas de Gestão**

##### **Usuários (`/users`)**
* **Lista de Membros:** Visualize todos os usuários cadastrados.
* **Gerenciar Perfis:** Edite o status (Ativo, Inativo), a categoria (Membro, Visitante) e o nível de acesso administrativo (`Revisor`, `Editor`, `Administrador`) de qualquer usuário.

##### **Salas (`/rooms`)**
* **Gerenciamento de Salas:** Crie novas salas de jogo, edite sua capacidade e outras informações, ou remova salas obsoletas.

##### **Estatísticas (`/statistics`)**
* **Dashboard:** Acompanhe métricas importantes, como taxa de ocupação das salas, número de membros adimplentes e a lista de aniversariantes do mês para ações de engajamento.

## ✨ Funcionalidades Principais

### Para Associados
- ✅ **Autenticação Segura**: Login simplificado com Google, compatível com WebViews de aplicativos móveis.
- 📅 **Agenda Inteligente**: Visualize a disponibilidade das salas em formato de **calendário mensal** ou **timeline diária/semanal** e faça reservas com até 14 dias de antecedência.
- 👥 **Gestão de Reservas**: Crie, edite, cancele e visualize seu histórico de agendamentos na página "Minhas Reservas".
- 📊 **Controle de Cotas Transparente**: Um painel exibe em tempo real o saldo de cotas de reserva, corujão e de convidados.
- 👤 **Perfil Completo**: Edite suas informações, preferências de jogo e endereço (com preenchimento automático via CEP).
- 💳 **Pagamentos Simplificados**: Gere um QR Code PIX para quitar sua matrícula e mensalidades de forma segura.
- 📣 **Comunicação Centralizada**: Fique por dentro dos avisos no mural ou receba mensagens privadas da administração.
- 🗳️ **Participação Democrática**: Participe de votações importantes da associação através de uma página dedicada.

### Para Administradores
- ⚙️ **Painel de Controle Centralizado**: Uma área de administração robusta e organizada para gerenciar todos os aspectos do sistema.
- 🛡️ **Gerenciamento de Acesso Dinâmico**: Crie e edite os níveis de permissão (`Editor`, `Revisor`, etc.) em tempo real, sem necessidade de deploy.
- 💰 **Gestão Financeira Completa**: Acompanhe transações, crie cobranças avulsas e gerencie o status de pagamento dos membros.
- 📝 **Gestão de Conteúdo**: Gerencie os planos de associação, salas de jogo e envie comunicados em massa ou mensagens diretas.
- 📈 **Dashboard de Estatísticas**: Visualize métricas de uso, como taxa de ocupação, número de adimplentes e aniversariantes do mês.
- 🧑‍⚖️ **Sistema de Votação**: Crie, gerencie e apure votações, definindo votantes e ponderando resultados pelo peso de voto de cada plano.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando um stack de tecnologias modernas e escaláveis:

- **Frontend**: [Next.js](https://nextjs.org/) (com App Router) e [React](https://react.dev/)
- **UI Framework**: [Tailwind CSS](https://tailwindcss.com/) com [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Banco de Dados**: [Firebase](https://firebase.google.com/) (Firestore, Authentication, Cloud Functions, App Hosting)
- **Estado e Sincronização**: [React Firebase Hooks](https://github.com/csfrequency/react-firebase-hooks)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)

---
## Desenvolvimento e Deploy
## 🚀 Como Começar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### Rodando Localmente
1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/davidsoncabista/Dungeon-App.git](https://github.com/davidsoncabista/Dungeon-App.git)
    cd Dungeon-App
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Configure suas variáveis de ambiente:**
    * Crie um arquivo `.env.local` na raiz do projeto.
    * Adicione as credenciais do seu projeto Firebase (você pode encontrá-las no console do Firebase > Configurações do Projeto).
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```
4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

### Fazendo Deploy
Para publicar as alterações no Firebase (App Hosting e Functions), utilize o comando:
```bash
firebase deploy

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