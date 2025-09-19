
"use client"

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Dices, ShieldAlert, FileText, QrCode, Calendar, Award, Loader2, Copy, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, collection, query, orderBy, where, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter, useSearchParams } from "next/navigation";
import type { User, UserCategory } from "@/lib/types/user";
import { useCollectionData } from "react-firebase-hooks/firestore";
import type { Plan } from "@/lib/types/plan";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { format, setDate, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction, TransactionStatus } from "@/lib/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


// --- COMPONENTE PARA USUÁRIOS NÃO MATRICULADOS ---
const SubscribeView = () => {
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
        if (plan.monthlyQuota > 0) features.push(`Até ${plan.monthlyQuota} reservas mensais`);
        else features.push("Reservas mensais ilimitadas");
        if (plan.weeklyQuota > 0) features.push(`Limite de ${plan.weeklyQuota} por semana`);
        if (plan.corujaoQuota > 0) features.push(`Inclui ${plan.corujaoQuota} cota(s) para o Corujão`);
        if (plan.invites > 0) features.push(`Direito a ${plan.invites} convidado(s) por sessão`);
        return features;
    }

    const renderContent = () => {
        if (loadingPlans) {
            return Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-6 w-1/4 mt-2" /></CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3 mb-6">
                            <Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-5/6" /><Skeleton className="h-5 w-3/4" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ));
        }
        if (errorPlans) {
            return (
                <div className="md:col-span-3">
                    <Card className="bg-destructive/10 border-destructive">
                        <CardHeader><div className="flex items-center gap-4"><ShieldAlert className="h-8 w-8 text-destructive" /><div><CardTitle className="text-destructive">Erro ao Carregar os Planos</CardTitle><CardDescription className="text-destructive/80">Não foi possível buscar os planos de associação. Tente recarregar a página.</CardDescription></div></div></CardHeader>
                    </Card>
                </div>
            );
        }
        if (!plans || plans.length === 0) {
            return <div className="md:col-span-3 text-center text-muted-foreground">Nenhum plano de associação foi configurado pela administração.</div>;
        }
        return plans.map(plan => (
            <Card key={plan.id} className="flex flex-col">
                <CardHeader><CardTitle className="text-2xl font-bold font-headline">{plan.name}</CardTitle><CardDescription>R$ {plan.price.toFixed(2).replace('.', ',')}<span className="text-xs">/mês</span></CardDescription></CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                    <ul className="space-y-2 text-left mb-6">
                        {getPlanFeatures(plan).map(feature => (
                            <li key={feature} className="flex items-start gap-2"><Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /><span className="text-sm">{feature}</span></li>
                        ))}
                    </ul>
                    <Button className="w-full" onClick={() => handleSelectPlan(plan.name as UserCategory)}>Selecionar Plano</Button>
                </CardContent>
            </Card>
        ));
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-full text-center p-4">
            <Dices className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl font-bold tracking-tight font-headline">Seja bem-vindo, novo aventureiro!</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">Para começar a reservar salas e participar de eventos, você precisa se tornar um membro associado. Escolha um dos nossos planos abaixo.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl w-full">{renderContent()}</div>
            <p className="text-xs text-muted-foreground mt-8">O pagamento é processado de forma segura. Em caso de dúvidas, contate a administração.</p>
        </div>
    );
};

// --- COMPONENTE PARA USUÁRIOS JÁ MATRICULADOS ---
const BillingView = ({ currentUser }: { currentUser: User }) => {
    const { toast } = useToast();
    const firestore = getFirestore(app);
    const functions = getFunctions(app, 'southamerica-east1');
    const searchParams = useSearchParams();

    const [isGeneratingPayment, setIsGeneratingPayment] = useState<string | null>(null);
    
    // --- Buscando transações do Firestore ---
    const transactionsRef = collection(firestore, 'transactions');
    const transactionsQuery = query(transactionsRef, where("userId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    const [transactions, loadingTransactions, errorTransactions] = useCollectionData<Transaction>(transactionsQuery, { idField: 'id' });

    // --- Feedback de Pagamento ---
     useEffect(() => {
        const router = useRouter();
        if (searchParams.get('payment_success') === 'true') {
            toast({
                title: "Pagamento Confirmado!",
                description: "Recebemos a confirmação do seu pagamento. Obrigado!",
                variant: 'default',
            });
            router.replace('/billing');
        }
        if (searchParams.get('payment_canceled') === 'true') {
             toast({
                title: "Pagamento Cancelado",
                description: "O processo de pagamento foi cancelado.",
                variant: 'destructive',
            });
            router.replace('/billing');
        }
    }, [searchParams, toast]);

    const nextBillingDate = useMemo(() => {
        const today = new Date();
        const billingDay = 15;
        let nextBilling = setDate(today, billingDay);
        if (today.getDate() > billingDay) {
            nextBilling = addMonths(nextBilling, 1);
        }
        return format(nextBilling, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }, []);

    const handleGeneratePayment = async (transaction: Transaction) => {
        setIsGeneratingPayment(transaction.id);
        try {
            const createPaymentSession = httpsCallable(functions, 'createPaymentSession');
            const result: any = await createPaymentSession({ transactionId: transaction.id });
            
            if (result.data && result.data.url) {
                // Redireciona o usuário para a página de checkout do Stripe
                window.location.href = result.data.url;
            } else {
                 throw new Error("Resposta inesperada do servidor de pagamentos.");
            }
            
        } catch (error: any) {
            console.error("Erro ao iniciar pagamento:", error);
            toast({
                title: "Erro ao Iniciar Pagamento",
                description: error.message || "Não foi possível iniciar o processo de pagamento.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPayment(null);
        }
    };
    
    const getStatusBadge = (status: TransactionStatus) => {
        switch (status) {
            case "Pago": return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
            case "Pendente": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
            case "Vencido": return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const renderTransactionRows = () => {
        if (loadingTransactions) {
            return Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (errorTransactions) {
            return <TableRow><TableCell colSpan={4} className="text-center text-destructive">Erro ao carregar seu histórico.</TableCell></TableRow>;
        }

        if (!transactions || transactions.length === 0) {
            return <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhuma cobrança encontrada em seu histórico.</TableCell></TableRow>;
        }

        return transactions.map((t: Transaction) => (
            <TableRow key={t.id}>
                <TableCell>{t.createdAt ? format(t.createdAt.toDate(), "dd/MM/yyyy") : "..."}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell>R$ {t.amount.toFixed(2).replace('.', ',')}</TableCell>
                <TableCell className="text-right">
                    {t.status === "Pendente" ? (
                        <Button 
                            size="sm" 
                            onClick={() => handleGeneratePayment(t)}
                            disabled={isGeneratingPayment === t.id}
                        >
                            {(isGeneratingPayment === t.id) ? <Loader2 className="h-4 w-4 animate-spin"/> : "Pagar Agora"}
                        </Button>
                    ) : (
                        <Badge className={getStatusBadge(t.status)}>{t.status}</Badge>
                    )}
                </TableCell>
            </TableRow>
        ));
    };
    
    return (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Minha Matrícula e Cobranças</h1>
                <p className="text-muted-foreground">Aqui você encontra todos os detalhes sobre seu plano e histórico de pagamentos.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Extrato de Pagamentos</CardTitle>
                            <CardDescription>Seu histórico de mensalidades e outras cobranças.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderTransactionRows()}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Meu Plano</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-muted-foreground">Plano Atual</span>
                                <span className="font-bold text-lg">{currentUser.category}</span>
                            </div>
                             <div className="flex justify-between items-baseline">
                                <span className="text-sm text-muted-foreground">Membro desde</span>
                                <span className="font-semibold">{currentUser.createdAt ? format(currentUser.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm text-muted-foreground">Próxima Cobrança</span>
                                <span className="font-semibold">{nextBillingDate}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// --- PÁGINA PRINCIPAL ---
export default function BillingPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const firestore = getFirestore(app);
    const usersRef = collection(firestore, 'users');
    const userQuery = user ? query(usersRef, where('uid', '==', user.uid)) : null;
    const [appUser, loadingUser] = useCollectionData<User>(userQuery);
    const currentUser = appUser?.[0];

    const isLoading = loadingAuth || loadingUser;

    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center min-h-full p-4">
                <Skeleton className="h-16 w-16 rounded-full mb-4" />
                <Skeleton className="h-10 w-1/2 mb-2" />
                <Skeleton className="h-5 w-3/4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl w-full">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }
    
    if (currentUser && currentUser.category !== 'Visitante') {
        return <BillingView currentUser={currentUser} />;
    } else {
        return <SubscribeView />;
    }
}
