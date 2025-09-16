
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Dices, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, collection, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import type { UserCategory } from "@/lib/types/user";
import { useCollectionData } from "react-firebase-hooks/firestore";
import type { Plan } from "@/lib/types/plan";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscribePage() {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const router = useRouter();
  const firestore = getFirestore(app);

  const plansRef = collection(firestore, 'plans');
  const plansQuery = query(plansRef, orderBy("price"));
  const [plans, loadingPlans, errorPlans] = useCollectionData<Plan>(plansQuery, { idField: 'id' });

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
        const userDocRef = doc(firestore, "users", user.uid);
        
        await updateDoc(userDocRef, {
            category: planName,
            status: "Ativo"
        });

        toast({
            title: "Plano Selecionado!",
            description: `Bem-vindo à categoria ${planName}! Você foi redirecionado para a agenda.`
        });
        
        router.push("/online-schedule");

    } catch (error) {
        console.error("Erro ao atualizar o plano do usuário:", error);
        toast({
            title: "Erro ao Salvar",
            description: "Não foi possível selecionar o plano. Por favor, tente novamente.",
            variant: "destructive"
        });
    }
  };

  const getPlanFeatures = (plan: Plan) => {
    const features = [];
    if (plan.monthlyQuota > 0) {
        features.push(`Até ${plan.monthlyQuota} reservas mensais`);
    } else {
        features.push("Reservas mensais ilimitadas");
    }
    if (plan.weeklyQuota > 0) {
        features.push(`Limite de ${plan.weeklyQuota} por semana`);
    }
    if (plan.corujaoQuota > 0) {
        features.push(`Inclui ${plan.corujaoQuota} cota(s) para o Corujão`);
    }
    if (plan.invites > 0) {
        features.push(`Direito a ${plan.invites} convidado(s) por sessão`);
    }
    return features;
  }

  const renderContent = () => {
    if (loadingPlans) {
        return (
            Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-6 w-1/4" />
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3 mb-6">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-5/6" />
                            <Skeleton className="h-5 w-3/4" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ))
        )
    }

    if (errorPlans) {
        return (
            <div className="md:col-span-3">
                 <Card className="bg-destructive/10 border-destructive">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="h-8 w-8 text-destructive" />
                            <div>
                                <CardTitle className="text-destructive">Erro ao Carregar os Planos</CardTitle>
                                <CardDescription className="text-destructive/80">Não foi possível buscar os planos de associação. Tente recarregar a página.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        )
    }
    
    if (!plans || plans.length === 0) {
        return (
            <div className="md:col-span-3 text-center text-muted-foreground">
                Nenhum plano de associação foi configurado pela administração.
            </div>
        )
    }

    return (
        plans.map(plan => (
            <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline">{plan.name}</CardTitle>
                    <CardDescription>R$ {plan.price.toFixed(2).replace('.', ',')}<span className="text-xs">/mês</span></CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                    <ul className="space-y-2 text-left mb-6">
                        {getPlanFeatures(plan).map(feature => (
                            <li key={feature} className="flex items-start gap-2">
                                <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-sm">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <Button className="w-full" onClick={() => handleSelectPlan(plan.name as UserCategory)}>
                        Selecionar Plano
                    </Button>
                </CardContent>
            </Card>
        ))
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center p-4">
        <Dices className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight font-headline">Seja bem-vindo, novo aventureiro!</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
            Sua conta foi criada com sucesso! Para começar a reservar salas e participar de eventos, você precisa se tornar um membro associado. Escolha um dos nossos planos abaixo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl w-full">
           {renderContent()}
        </div>
        <p className="text-xs text-muted-foreground mt-8">
            O pagamento é processado de forma segura. Em caso de dúvidas, contate a administração.
        </p>
    </div>
  );
}
