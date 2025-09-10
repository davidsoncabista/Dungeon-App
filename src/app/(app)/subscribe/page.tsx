
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Dices } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { UserCategory } from "@/lib/types/user";

const plans = [
    {
        name: "Player",
        price: "R$ 30",
        features: ["Acesso a 2 reservas mensais", "Ideal para jogadores casuais"]
    },
    {
        name: "Gamer",
        price: "R$ 50",
        features: ["Acesso a 4 reservas mensais", "Perfeito para jogadores frequentes"]
    },
    {
        name: "Master",
        price: "R$ 70",
        features: ["Reservas ilimitadas", "Apoie a associação e jogue sem limites!"]
    }
]

export default function SubscribePage() {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const router = useRouter();

  const handleSelectPlan = async (planName: UserCategory) => {
    if (!user) {
        toast({
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para selecionar um plano.",
            variant: "destructive"
        });
        return;
    }

    try {
        const firestore = getFirestore();
        const userDocRef = doc(firestore, "users", user.uid);
        
        await updateDoc(userDocRef, {
            category: planName,
            status: "Ativo"
        });

        toast({
            title: "Plano Selecionado!",
            description: `Bem-vindo à categoria ${planName}! Você foi redirecionado para o dashboard.`
        });
        
        router.push("/dashboard");

    } catch (error) {
        console.error("Erro ao atualizar o plano do usuário:", error);
        toast({
            title: "Erro ao Salvar",
            description: "Não foi possível selecionar o plano. Por favor, tente novamente.",
            variant: "destructive"
        });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center p-4">
        <Dices className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight font-headline">Seja bem-vindo, novo aventureiro!</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
            Sua conta foi criada com sucesso! Para começar a reservar salas e participar de eventos, você precisa se tornar um membro associado. Escolha um dos nossos planos abaixo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl w-full">
            {plans.map(plan => (
                <Card key={plan.name} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold font-headline">{plan.name}</CardTitle>
                        <CardDescription>{plan.price}<span className="text-xs">/mês</span></CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <ul className="space-y-2 text-left mb-6">
                            {plan.features.map(feature => (
                                <li key={feature} className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Button className="w-full" onClick={() => handleSelectPlan(plan.name as UserCategory)}>
                            Selecionar Plano
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
        <p className="text-xs text-muted-foreground mt-8">
            O pagamento é processado de forma segura. Em caso de dúvidas, contate a administração.
        </p>
    </div>
  );
}
