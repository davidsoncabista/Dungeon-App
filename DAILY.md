# Daily - Plano de Execução

Este documento detalha as etapas de desenvolvimento, quebrando os objetivos da arquitetura em tarefas menores e gerenciáveis.

## Próximos Passos (A definir)

- [ ] (A definir)

---

## Concluído: Sprint 6

### Foco: Refinamento da Experiência do Usuário e Polimento

- [x] **Página de Histórico de Avisos**:
  - [x] Criada a página `/notices` para que os usuários possam visualizar todos os comunicados passados.
- [x] **Melhoria no Fluxo de Onboarding**:
  - [x] Implementado um modal de boas-vindas no primeiro login após o cadastro, guiando o usuário sobre os próximos passos (completar perfil e se matricular).
- [x] **Refinamento da Agenda Online**:
  - [x] Reintroduzida a visualização de agenda por dia/semana, permitindo ao usuário alternar entre a visão de calendário mensal e uma timeline detalhada.
- [x] **Polimento Geral da UI/UX**:
  - [x] Realizada uma revisão completa da responsividade em todas as telas, especialmente em modais e formulários complexos.
  - [x] Garantido que os feedbacks de sucesso e erro (toasts) sejam consistentes em toda a aplicação.

## Concluído: Sprint 5

### Foco: Validações Finais e Ferramentas de Admin

- [x] **Validação Final de Cotas de Reserva**:
  - [x] Implementada a verificação no formulário de reserva para impedir o agendamento se o usuário já atingiu sua cota (semanal, mensal ou corujão).
- [x] **Interatividade do Usuário**:
  - [x] Implementada a funcionalidade de "Sair da Reserva".
- [x] **Ferramentas de Administrador**:
  - [x] Implementadas as ações de moderação (bloquear/desbloquear usuário, alterar permissões).
  - [x] Criada a interface para o administrador criar e enviar avisos.

## Concluído: Sprint 4

### Foco: Lógica de Negócio e Transparência de Cotas

- [x] **Lógica de Cotas e Reservas**:
  - [x] Implementada a validação da cota mensal de convidados.
  - [x] Implementada a lógica de contagem de cotas para "Corujão", mensal e de convidados.
- [x] **Transparência para o Usuário**:
  - [x] Criado um card na página "Minhas Reservas" que exibe em tempo real o uso e saldo de todas as cotas do usuário (reservas, corujão, convidados).
- [x] **Integração Admin-Usuário**:
  - [x] A página de "Matrícula" agora é 100% dinâmica, buscando os planos e preços diretamente da configuração feita pelo administrador.

## Concluído: Sprint 3

### Foco: Backend com Firebase, Autenticação e Perfis

- [x] **Implementar Autenticação com Google**:
  - [x] Integrado o Firebase Authentication para permitir o login com contas Google.
  - [x] Gerenciada a sessão do usuário (login/logout).
- [x] **Controle de Acesso com Firestore e Cloud Functions**:
  - [x] Criada a função `createUserDocument` para registrar novos usuários no Firestore.
  - [x] Criada a função `setAdminClaim` para gerenciar permissões de administrador via `Custom Claims`.
  - [x] Implementadas Regras de Segurança (`firestore.rules`) para proteger todo o banco de dados.
- [x] **Fluxo de Novos Usuários e Perfis**:
  - [x] Redirecionamento de novos usuários (`Visitante`) para a página de inscrição (`/subscribe`).
  - [x] Implementada a lógica para que a seleção de plano atualize o `status` e a `category` do usuário.
  - [x] Expandido o modelo de dados do usuário (`User`) com campos adicionais (telefone, preferências, etc.).
  - [x] Reformulada a página de Perfil (`/profile`) para permitir a edição de todos os novos campos.
- [x] **Dinamização do App**:
  - [x] Removido o `mock-service` das páginas de Usuários, Layout e Header.
  - [x] Criada a Landing Page pública para usuários não logados.


## Concluído: Sprint 2

- [x] **Configuração do Ambiente**: Validada a estrutura de pastas e o tema visual.
- [x] **Layout Principal**: Desenvolvido o layout com header, sidebar e área de conteúdo.
- [x] **Telas de CRUD (Interface)**: Desenvolvidas as UIs para todas as telas principais.
- [x] **Dinamização com Mock Service**: Conectadas todas as telas ao serviço de dados simulado.
- [x] **Refatoração da Agenda**: Timeline de 24h responsiva e com lógica "Corujão".
- [x] **Extrato de Reservas**: Implementada a lista de reservas com filtros avançados e ordenação.
- [x] **Ações de Edição**: Adicionado o modal de edição de reservas na lista, com controle de permissão.
