<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dungeon App - Sistema de Gestão da Dungeon Belém</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Chosen Palette: Warm Neutrals -->
    <!-- Application Structure Plan: A estrutura da aplicação foi desenhada como uma página única com seções navegáveis via um cabeçalho fixo, promovendo uma exploração fluida (one-page scroll). As funcionalidades, que são o coração do projeto, foram organizadas em cartões interativos, separando claramente os perfis de "Associados" e "Administração". Esta abordagem é mais dinâmica e visualmente mais agradável que um documento de texto estático, permitindo que os usuários (sejam desenvolvedores ou stakeholders) absorvam a informação de forma mais eficaz e encontrem rapidamente o que lhes interessa. A inclusão de uma visualização do dashboard de métricas torna a funcionalidade mais concreta e impactante. -->
    <!-- Visualization & Content Choices: Report Info: Funcionalidades para Associados e Administradores; Tecnologias; Equipe -> Goal: Organizar e informar de forma interativa -> Viz/Presentation Method: Cartões em grid responsivo (HTML/CSS) para funcionalidades e equipe; lista estilizada para tecnologias. Para a funcionalidade "Dashboard com Métricas", foi criada uma visualização de dados com um gráfico de rosca (taxa de ocupação) e um gráfico de barras (adimplência), utilizando a biblioteca Chart.js. -> Interaction: Efeitos de hover nos cartões, navegação com scroll suave entre as seções. -> Justification: A estrutura de cartões quebra o texto longo em blocos digeríveis. A visualização do dashboard transforma uma descrição textual em uma demonstração tangível do poder da ferramenta, agregando um fator "uau". -> Library/Method: Vanilla JS para interatividade, Chart.js para gráficos (Canvas). -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #FDFBF8;
            color: #383838;
        }
        .nav-link {
            transition: all 0.3s ease;
            position: relative;
            padding-bottom: 8px;
        }
        .nav-link::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 2px;
            background-color: #D97706; 
            transition: width 0.3s ease;
        }
        .nav-link.active::after, .nav-link:hover::after {
            width: 100%;
        }
        .feature-card {
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 0.75rem;
            padding: 1.5rem;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            height: 100%;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .chart-container {
            position: relative;
            width: 100%;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
            height: 250px;
            max-height: 300px;
        }
        @media (min-width: 768px) {
             .chart-container {
                height: 300px;
             }
        }
    </style>
</head>
<body class="antialiased">

    <header class="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-200">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center">
                    <span class="font-bold text-xl text-amber-700">🎲 Dungeon App</span>
                </div>
                <div class="hidden md:block">
                    <div id="nav-links" class="ml-10 flex items-baseline space-x-4">
                        <a href="#overview" class="nav-link text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium">Visão Geral</a>
                        <a href="#features-associados" class="nav-link text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium">Associados</a>
                        <a href="#features-admin" class="nav-link text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium">Administração</a>
                        <a href="#tech" class="nav-link text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium">Tecnologias</a>
                        <a href="#team" class="nav-link text-gray-700 hover:text-amber-600 px-3 py-2 text-sm font-medium">Equipe</a>
                    </div>
                </div>
            </div>
        </nav>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <section id="overview" class="text-center py-16">
            <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">Sistema de Gestão da Dungeon Belém</h1>
            <p class="mt-6 max-w-3xl mx-auto text-lg text-gray-600">
                O <strong>Dungeon App</strong> é a plataforma oficial e completa para o gerenciamento de reservas e administração da <strong>Associação Dungeon Belém</strong>. Criado sob medida para a nossa comunidade de jogadores de RPG, Board Games e Card Games, o sistema centraliza todas as operações, oferecendo uma experiência moderna e integrada tanto para associados quanto para a equipe administrativa.
            </p>
        </section>

        <section id="features-associados" class="py-16">
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900">🛡️ Funcionalidades para Associados</h2>
                <p class="mt-4 text-md text-gray-500">Tudo que o membro precisa para uma experiência completa.</p>
            </div>
            <div id="associados-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            </div>
        </section>

        <section id="features-admin" class="py-16 bg-white rounded-2xl">
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900">👑 Funcionalidades para a Administração</h2>
                <p class="mt-4 text-md text-gray-500">Ferramentas poderosas para uma gestão eficiente e centralizada.</p>
            </div>
            <div id="admin-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            </div>
             <div class="mt-16 text-center">
                <h3 class="text-2xl font-bold text-gray-800">Dashboard com Métricas em Ação</h3>
                <p class="mt-2 text-md text-gray-500">Uma prévia das visualizações de dados que o painel administrativo oferece.</p>
                <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div class="w-full">
                        <h4 class="text-lg font-semibold mb-2">Taxa de Ocupação das Salas</h4>
                        <div class="chart-container">
                            <canvas id="occupationChart"></canvas>
                        </div>
                    </div>
                    <div class="w-full">
                        <h4 class="text-lg font-semibold mb-2">Situação dos Membros</h4>
                        <div class="chart-container">
                             <canvas id="membersChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="tech" class="py-16">
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900">🚀 Tecnologias Utilizadas</h2>
            </div>
            <div id="tech-list" class="flex justify-center items-center gap-8 flex-wrap">
            </div>
        </section>
        
        <section id="team" class="py-16">
             <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900">👥 Equipe do Projeto</h2>
            </div>
            <div id="team-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            </div>
        </section>

    </main>
    
    <footer class="bg-white border-t border-gray-200">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Dungeon App. Construído com Next.js, React, Tailwind CSS e Firebase.</p>
        </div>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            
            const featuresAssociados = [
                { title: 'Login Simplificado', description: 'Autenticação segura e rápida com sua conta Google, otimizada para funcionar perfeitamente em navegadores de celular e WebViews.' },
                { title: 'Agenda Inteligente', description: 'Visualize a disponibilidade das salas em um calendário mensal completo ou em uma timeline diária/semanal detalhada para planejar sua jogatina.' },
                { title: 'Reservas Descomplicadas', description: 'Crie e gerencie seus agendamentos, edite participantes e acompanhe todo o seu histórico na página "Minhas Reservas".' },
                { title: 'Controle de Cotas Transparente', description: 'Um painel exibe em tempo real seu saldo de cotas de reserva (mensal, corujão, convidados) e a data exata de renovação do ciclo.' },
                { title: 'Perfil de Associado Completo', description: 'Atualize seus dados pessoais, preferências de jogo e endereço com preenchimento automático via CEP. O sistema também inclui verificação de maioridade para garantir a conformidade.' },
                { title: 'Comunicação Centralizada', description: 'Acesse o Mural de Avisos e receba mensagens diretas da administração em sua Caixa de Entrada Pessoal, com indicador de notificações não lidas.' },
                { title: 'Pagamentos via PIX', description: 'Pague sua matrícula e mensalidades de forma segura gerando um QR Code PIX diretamente na plataforma.' },
                { title: 'Participação Democrática', description: 'Exerça seu direito de voto em enquetes e decisões importantes da associação através de uma área de votação exclusiva.' }
            ];

            const featuresAdmin = [
                { title: 'Painel de Controle Total', description: 'Uma área administrativa completa e organizada para gerenciar: Sistema, Finanças, Comunicação e Membros.' },
                { title: 'Gestão Dinâmica de Planos', description: 'Crie, edite e remova planos de associação, ajustando preços, cotas e limites de convidados sem precisar de atualizações no código.' },
                { title: 'Controle de Acesso Flexível', description: 'Modifique as permissões de cada nível administrativo (Administrador, Editor, Revisor) em tempo real, controlando o que cada um pode ver e fazer.' },
                { title: 'Comunicação Direta e em Massa', description: 'Envie avisos para o mural público ou mande mensagens privadas e categorizadas (advertências, multas, etc.) para membros específicos.' },
                { title: 'Sistema de Votação Robusto', description: 'Crie votações, defina o público votante, gerencie o período de votação e apure os resultados com pesos de voto ponderados.' },
                { title: 'Gerenciamento Completo de Membros', description: 'Visualize a lista de associados, gerencie status (Ativo, Pendente, Bloqueado), e administre os níveis de acesso.' },
                { title: 'Gestão Financeira Integrada', description: 'Lance cobranças, aprove pagamentos, e consulte o histórico financeiro detalhado de cada membro.' }
            ];

            const techStack = [
                { name: 'Next.js (React)', class: 'bg-black text-white' },
                { name: 'Tailwind CSS', class: 'bg-cyan-500 text-white' },
                { name: 'Firebase', class: 'bg-amber-500 text-white' }
            ];

            const teamMembers = [
                { name: 'Davidson Santos Conceição', role: 'Project Lead & DevOps Engineer' },
                { name: 'Heydrigh Leão Ribeiro', role: 'Full Stack Developer' },
                { name: 'Caio de Oliveira Bastos', role: 'Tesoureiro & Front-end Developer' },
                { name: 'Thyago Costa (@thyagobib)', role: 'UI/UX Designer' },
                { name: 'Luiz Pedro Reis Pinheiro (@luizprp)', role: 'UI/UX Designer' },
                { name: 'Bruno Rafael Viana Oliveira (@brunorvo)', role: 'Consultor de Fluxo e Homologação' },
                { name: 'Hermann Duarte Ribeiro Filho', role: 'Homologação (Testes)' },
                { name: 'Thiago de Castro Araújo', role: 'Homologação (Testes)' },
                { name: 'Iasmin Oneide Figueira de Castro Leal (@koda_master)', role: 'Homologação (Testes)' }
            ];

            function createCard(title, description) {
                return `
                    <div class="feature-card flex flex-col">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">${title}</h3>
                        <p class="text-gray-600 text-sm">${description}</p>
                    </div>
                `;
            }
            
            const associadosGrid = document.getElementById('associados-grid');
            associadosGrid.innerHTML = featuresAssociados.map(f => createCard(f.title, f.description)).join('');
            
            const adminGrid = document.getElementById('admin-grid');
            adminGrid.innerHTML = featuresAdmin.map(f => createCard(f.title, f.description)).join('');

            const techList = document.getElementById('tech-list');
            techList.innerHTML = techStack.map(t => `<span class="font-semibold px-4 py-2 rounded-full text-sm ${t.class}">${t.name}</span>`).join('');
            
            const teamGrid = document.getElementById('team-grid');
            teamGrid.innerHTML = teamMembers.map(m => `
                <div class="bg-white p-6 rounded-lg border border-gray-200 text-center">
                    <h4 class="text-lg font-bold text-gray-900">${m.name}</h4>
                    <p class="text-amber-600 text-sm">${m.role}</p>
                </div>
            `).join('');

            const occupationCtx = document.getElementById('occupationChart').getContext('2d');
            new Chart(occupationCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Ocupado', 'Livre'],
                    datasets: [{
                        data: [78, 22],
                        backgroundColor: ['#9A3412', '#FBBF24'],
                        borderColor: '#FDFBF8',
                        borderWidth: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + '%';
                                }
                            }
                        }
                    }
                }
            });

            const membersCtx = document.getElementById('membersChart').getContext('2d');
            new Chart(membersCtx, {
                type: 'bar',
                data: {
                    labels: ['Adimplentes', 'Pendentes'],
                    datasets: [{
                        label: 'Nº de Membros',
                        data: [125, 15],
                        backgroundColor: ['#16A34A', '#DC2626'],
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            const sections = document.querySelectorAll('section');
            const navLinks = document.querySelectorAll('#nav-links a');

            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.4
            };

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        navLinks.forEach(link => {
                            link.classList.toggle('active', link.getAttribute('href').substring(1) === entry.target.id);
                        });
                    }
                });
            }, observerOptions);

            sections.forEach(section => {
                observer.observe(section);
            });
        });
    </script>
</body>
</html>
