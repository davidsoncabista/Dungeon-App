import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Calendar, Vote, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const features = [
  {
    icon: <Calendar className="h-10 w-10 text-primary" />,
    title: "Agenda Multivisualização",
    description: "Visualize a disponibilidade das salas em calendário mensal ou timeline diária/semanal e faça suas reservas com facilidade.",
  },
  {
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    title: "Comunicação Centralizada",
    description: "Receba avisos importantes no mural e mensagens diretas da administração em sua caixa de entrada privada.",
  },
  {
    icon: <Vote className="h-10 w-10 text-primary" />,
    title: "Sistema de Votação",
    description: "Participe de forma ativa nas decisões da associação através de um sistema de votação democrático e transparente.",
  },
    {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Gestão Administrativa",
    description: "Ferramentas completas para gerenciar membros, finanças, regras de acesso, comunicações e muito mais.",
    },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
          <Image 
                  src="/logo.svg" 
                  width={75}
                  height={75}
                  alt="Logo da Associação Dungeon Belém"
                  className="rounded-xl"
                  priority
                />
            <span className="font-bold text-lg font-headline">Dungeon App</span>
          </Link>
          <Button asChild>
            <Link href="/login">Acessar o App</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Seção Hero */}
        <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
          <div className="space-y-6">
            <Badge variant="outline" className="py-1 px-3">O App Oficial da Associação Dungeon Belém</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline">
              O seu portal para o universo do RPG.
            </h1>
            <p className="max-w-prose text-muted-foreground md:text-xl">
              Gerencie suas reservas, participe das decisões e conecte-se com a comunidade. Tudo em um só lugar, projetado para nossos membros.
            </p>
            <Button asChild size="lg">
              <Link href="/login">Comece a Aventura</Link>
            </Button>
          </div>
          <div className="flex justify-center">
            <Image 
                src="https://images.unsplash.com/photo-1614767629805-3bbcf6e26c7d?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                width={740} 
                height={494} 
                alt="Um castelo de fantasia em um penhasco com uma cachoeira."
                className="rounded-xl shadow-2xl"
                data-ai-hint="fantasy castle landscape"
                priority
            />
          </div>
        </section>

        {/* Seção de Features */}
        <section className="bg-muted/50 py-20 md:py-28">
            <div className="container">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Um Ecossistema Completo para a Guilda</h2>
                    <p className="max-w-3xl mx-auto text-muted-foreground md:text-lg">
                        Criamos uma plataforma robusta para simplificar a vida dos nossos associados e administradores.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader className="p-0 mb-4">
                                {feature.icon}
                            </CardHeader>
                            <CardContent className="p-0 flex flex-col items-center">
                                <CardTitle className="text-xl mb-2 font-headline">{feature.title}</CardTitle>
                                <p className="text-muted-foreground text-sm">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t">
  <div className="container flex items-center justify-between h-20">
    <p className="text-sm text-muted-foreground">
      © 2025 Associação Dungeon Belém.
    </p>

    {/* Grupo de Créditos à Direita */}
    <div className="text-sm text-muted-foreground text-right space-y-1">
      <p>
        Feito em Belém-PA, em colaboração com uma comunidade incrível.
      </p>
      <div className="flex items-center justify-end space-x-2">
        <p>
          Desenvolvido por <a 
            href="https://davidson.dev.br" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-primary"
          >
            davidson.dev.br
          </a>
        </p>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="link" size="sm" className="text-xs text-muted-foreground p-0 h-auto">| Ver colaboradores</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-left text-sm">
            <div className="p-2">
                <p className="mb-2"><strong>Davidson Santos Conceição:</strong><br /><span className="text-xs text-muted-foreground">Project Lead & DevOps Engineer</span></p>
                <hr className="my-2" />
                <p className="text-xs text-muted-foreground mb-2">Com agradecimentos à comunidade e colaboradores que apoiaram o projeto:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Heydrigh Leão Ribeiro</li>
                    <li>Caio de Oliveira Bastos</li>
                    <li>Thyago Costa (@thyagobib)</li>
                    <li>Luiz Pedro Reis Pinheiro (@luizprp)</li>
                    <li>Hermann Duarte Ribeiro Filho</li>
                    <li>Thiago de Castro Araújo</li>
                    <li>Bruno Rafael Viana Oliveira (@brunorvo)</li>
                    <li>Iasmin Oneide Figueira de Castro Leal (@koda_master)</li>
                </ul>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}