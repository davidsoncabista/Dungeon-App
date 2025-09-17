import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dices, ShieldCheck, Calendar, Users, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: <Calendar className="h-10 w-10 text-primary" />,
    title: "Agenda Inteligente",
    description: "Visualize a disponibilidade de todas as salas em uma timeline de 24h e faça suas reservas com apenas alguns cliques.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Gerencie Seus Convidados",
    description: "Adicione membros da associação ou convidados externos às suas sessões de forma simples e prática.",
  },
  {
    icon: <Award className="h-10 w-10 text-primary" />,
    title: "Sistema de Cotas Justo",
    description: "Nossas regras de agendamento garantem que todos os associados, de Players a Masters, tenham oportunidades iguais de jogo.",
  },
    {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Painel de Controle Completo",
    description: "Administradores têm acesso a ferramentas poderosas para gerenciar usuários, salas, reservas e finanças.",
    },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <Dices className="h-8 w-8 text-primary" />
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
              Gerencie suas reservas, convide seus amigos e acompanhe a disponibilidade das salas. Tudo em um só lugar, projetado para a nossa comunidade.
            </p>
            <Button asChild size="lg">
              <Link href="/login">Comece a Aventura</Link>
            </Button>
          </div>
          <div className="flex justify-center">
            <Image 
                src="https://picsum.photos/seed/landing-hero/600/500" 
                width={600} 
                height={500} 
                alt="Um grupo de aventureiros jogando RPG de mesa em uma sala temática."
                className="rounded-xl shadow-2xl"
                data-ai-hint="rpg adventure party"
            />
          </div>
        </section>

        {/* Seção de Features */}
        <section className="bg-muted/50 py-20 md:py-28">
            <div className="container">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Funcionalidades Pensadas para Você</h2>
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
            <p className="text-sm text-muted-foreground">© 2024 Associação Dungeon Belém. Todos os direitos reservados.</p>
            <p className="text-sm text-muted-foreground">Desenvolvido pela comunidade para a comunidade.</p>
        </div>
      </footer>
    </div>
  );
}
