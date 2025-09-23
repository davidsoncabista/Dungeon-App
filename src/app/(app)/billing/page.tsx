
"use client"

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Dices, ShieldAlert, FileText, Award, Loader2, Info, MoreHorizontal, Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, app } from "@/lib/firebase";
import { getFirestore, doc, updateDoc, collection, query, orderBy, where, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter, useSearchParams } from "next/navigation";
import type { User, UserCategory } from "@/lib/types/user";
import { useCollectionData, useDocumentData } from "react-firebase-hooks/firestore";
import type { Plan } from "@/lib/types/plan";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { format, setDate, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction, TransactionStatus } from "@/lib/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TransactionDetailsDialog } from "@/components/app/finance/transaction-details-dialog";

// --- COMPONENTE PARA USUÁRIOS NÃO MATRICULADOS ---
const SubscribeView = () => {
    const { toast } = useToast();
    const functions = getFunctions(app, 'southamerica-east1');

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
    
    const firestore = getFirestore(app);
    const plansRef = collection(firestore, 'plans');
    const plansQuery = query(plansRef, orderBy("price"));
    const [plans, loadingPlans, errorPlans] = useCollectionData<Plan>(plansQuery, { idField: 'id' });

    const settingsRef = doc(firestore, 'systemSettings', 'config');
    const [settings, loadingSettings] = useDocumentData(settingsRef);
    const registrationFee = settings?.registrationFee || 0;

    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (publicKey) {
            initMercadoPago(publicKey, { locale: 'pt-BR' });
        } else {
            console.error("Chave pública do Mercado Pago não encontrada.");
        }
    }, []);

    const handleMercadoPagoSubscription = async () => {
        if (!selectedPlan) return;
        setIsGeneratingPayment(true);
        setPreferenceId(null);
        try {
            const createMercadoPagoPayment = httpsCallable(functions, 'createMercadoPagoPayment');
            const result = await createMercadoPagoPayment({ 
                planId: selectedPlan.id 
            });
            
            const data = result.data as { preferenceId: string };

            if (data.preferenceId) {
                setPreferenceId(data.preferenceId);
            } else {
                throw new Error("ID de preferência não recebido.");
            }
        } catch (error: any) {
            console.error("Erro ao criar pagamento de matrícula:", error);
            toast({
                title: "Erro ao Gerar Cobrança",
                description: error.message || 'Ocorreu um erro desconhecido.',
                variant: 'destructive'
            });
        } finally {
            setIsGeneratingPayment(false);
        }
    };

    const getPlanFeatures = (plan: Plan) => {
        const features = [];
        if (plan.monthlyQuota > 0) features.push(`Até ${plan.monthlyQuota} reservas mensais`);
        else features.push("Reservas mensais ilimitadas");
        if (plan.weeklyQuota > 0) features.push(`Limite de ${plan.weeklyQuota} por semana`);
        if (plan.corujaoQuota > 0) features.push(`Inclui ${plan.corujaoQuota} cota(s) para o Corujão`);
        if (plan.invites > 0) features.push(`Direito a ${plan.invites} convidado(s) por mês`);
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
                    <Button className="w-full" onClick={() => setSelectedPlan(plan)}>Selecionar Plano</Button>
                </CardContent>
            </Card>
        ));
    }

    return (
        <>
        <div className="flex flex-col items-center justify-center min-h-full text-center p-4">
            <Dices className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl font-bold tracking-tight font-headline">Seja bem-vindo, novo aventureiro!</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">Para começar a reservar salas e participar de eventos, você precisa se tornar um membro associado. Escolha um dos nossos planos abaixo.</p>
            
            {loadingSettings ? <Skeleton className="h-10 w-80 mt-6" /> : (
                 registrationFee > 0 && (
                    <Alert className="mt-8 max-w-2xl bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-300">
                            Além da mensalidade, há uma taxa de inscrição única (joia) no valor de <strong>R$ {registrationFee.toFixed(2).replace('.', ',')}</strong>, que será cobrada no primeiro pagamento.
                        </AlertDescription>
                    </Alert>
                )
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 max-w-5xl w-full">{renderContent()}</div>
            <p className="text-xs text-muted-foreground mt-8">O pagamento é processado de forma segura. Em caso de dúvidas, contate a administração.</p>
        </div>

        <Dialog open={!!selectedPlan} onOpenChange={(isOpen) => { if (!isOpen) { setSelectedPlan(null); setPreferenceId(null); } }}>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Matrícula - Plano {selectedPlan?.name}</DialogTitle>
                    <DialogDescription>
                        Você está prestes a se matricular. Revise os valores e confirme o pagamento para ativar sua conta.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Plano {selectedPlan?.name}</span>
                        <span>R$ {selectedPlan?.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {registrationFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Taxa de Inscrição (Joia)</span>
                            <span>R$ {registrationFee.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                     <div className="flex justify-between items-center font-bold text-base border-t pt-2 mt-2">
                        <span>Total</span>
                        <span>R$ {((selectedPlan?.price || 0) + registrationFee).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
                 <DialogFooter className="flex flex-col gap-2">
                    {preferenceId ? (
                        <div id="wallet-container">
                            <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                        </div>
                    ) : (
                        <Button onClick={handleMercadoPagoSubscription} disabled={isGeneratingPayment}>
                            {isGeneratingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Pagar com Mercado Pago
                        </Button>
                    )}
                     <Button variant="ghost" onClick={() => { setSelectedPlan(null); setPreferenceId(null); }}>Cancelar</Button>
                </DialogFooter>
             </DialogContent>
        </Dialog>
        </>
    );
};


// --- COMPONENTE PARA USUÁRIOS JÁ MATRICULADOS ---
const BillingView = ({ currentUser, authUser }: { currentUser: User, authUser: any }) => {
    const { toast } = useToast();
    const firestore = getFirestore(app);
    const functions = getFunctions(app, 'southamerica-east1');
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [paymentTransaction, setPaymentTransaction] = useState<Transaction | null>(null);
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

    const transactionsRef = collection(firestore, 'transactions');
    const transactionsQuery = authUser ? query(transactionsRef, where("userId", "==", authUser.uid), orderBy("createdAt", "desc")) : null;
    const [transactions, loadingTransactions, errorTransactions] = useCollectionData<Transaction>(transactionsQuery, { idField: 'id' });

    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
        if (publicKey) {
            initMercadoPago(publicKey);
        } else {
            console.error("Chave pública do Mercado Pago não encontrada. Os pagamentos não funcionarão.");
        }
    }, []);

    useEffect(() => {
        if (searchParams.get('payment_success') === 'true') {
            toast({ title: "Pagamento Confirmado!", description: "Recebemos a confirmação do seu pagamento. Obrigado!" });
            router.replace('/billing');
        }
        if (searchParams.get('payment_canceled') === 'true') {
             toast({ title: "Pagamento Cancelado", description: "O processo de pagamento foi cancelado.", variant: 'destructive' });
             setPaymentTransaction(null);
             setPreferenceId(null);
            router.replace('/billing');
        }
    }, [searchParams, toast, router]);

    const nextBillingDate = useMemo(() => {
        const today = new Date();
        const billingDay = 15;
        let nextBilling = setDate(today, billingDay);
        if (today.getDate() > billingDay) {
            nextBilling = addMonths(nextBilling, 1);
        }
        return format(nextBilling, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }, []);

    const isRegistrationFeePaid = useMemo(() => {
        if (!transactions) return false;
        return transactions.some(t => t.type === 'Inicial' && t.status === 'Pago');
    }, [transactions]);

    const handleMercadoPagoPayment = async (transaction: Transaction) => {
        setPaymentTransaction(transaction);
        setIsGeneratingPayment(true);
        setPreferenceId(null);
        try {
            const createMercadoPagoPayment = httpsCallable(functions, 'createMercadoPagoPayment');
            const result = await createMercadoPagoPayment({ 
                transactionId: transaction.id
            });
            
            const data = result.data as { preferenceId: string };

            if (data.preferenceId) {
                setPreferenceId(data.preferenceId);
            } else {
                throw new Error("ID de preferência não recebido.");
            }
        } catch (error: any) {
            console.error("Erro ao criar pagamento com Mercado Pago:", error);
            setPaymentTransaction(null);
            toast({
                title: "Erro ao Gerar Cobrança",
                description: error.message || 'Ocorreu um erro desconhecido.',
                variant: 'destructive'
            });
        } finally {
            setIsGeneratingPayment(false);
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
            return <TableRow><TableCell colSpan={5} className="text-center text-destructive">Erro ao carregar seu histórico.</TableCell></TableRow>;
        }

        if (!transactions || transactions.length === 0) {
            return <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma cobrança encontrada em seu histórico.</TableCell></TableRow>;
        }

        return transactions.map((t: Transaction) => (
            <TableRow key={t.id}>
                <TableCell>{t.createdAt ? format(t.createdAt.toDate(), "dd/MM/yyyy") : "..."}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell>R$ {t.amount.toFixed(2).replace('.', ',')}</TableCell>
                <TableCell>
                    <Badge className={getStatusBadge(t.status)}>{t.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <TransactionDetailsDialog transaction={t}>
                                <DropdownMenuItem onSelect={e => e.preventDefault()}><Eye className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                            </TransactionDetailsDialog>
                             {t.status === "Pendente" && (
                                <DropdownMenuItem onClick={() => handleMercadoPagoPayment(t)}>Pagar com Mercado Pago</DropdownMenuItem>
                             )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        ));
    };
    
    return (
        <>
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
                                        <TableHead>Status</TableHead>
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
                                <span className="text-sm text-muted-foreground">Taxa de Inscrição</span>
                                {isRegistrationFeePaid ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                        <CheckCircle className="mr-1 h-3 w-3" /> Paga
                                    </Badge>
                                ) : (
                                     <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                                        Pendente
                                    </Badge>
                                )}
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
        <Dialog open={!!paymentTransaction} onOpenChange={(isOpen) => { if (!isOpen) { setPaymentTransaction(null); setPreferenceId(null); }}}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Finalizar Pagamento</DialogTitle>
                    <DialogDescription>
                       Cobrança: {paymentTransaction?.description} no valor de R$ {paymentTransaction?.amount.toFixed(2).replace('.',',')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isGeneratingPayment && !preferenceId && (
                         <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Gerando link de pagamento...</span>
                        </div>
                    )}
                    {preferenceId && (
                        <div id="wallet-dialog-container">
                             <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
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
    
    if (currentUser && user && currentUser.category !== 'Visitante') {
        return <BillingView currentUser={currentUser} authUser={user} />;
    } else {
        return <SubscribeView />;
    }
}

