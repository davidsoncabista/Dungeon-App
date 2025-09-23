
"use client"

import { useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy, where, doc, updateDoc, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { app } from "@/lib/firebase";
import type { Transaction, TransactionStatus } from "@/lib/types/transaction";
import type { User } from "@/lib/types/user";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, CheckCircle2, ShieldAlert, DollarSign, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AddTransactionDialog } from "@/components/app/admin/finance/add-transaction-dialog";
import { TransactionDetailsDialog } from "@/components/app/finance/transaction-details-dialog";

function TransactionRow({ transaction }: { transaction: Transaction }) {
    const { toast } = useToast();
    const firestore = getFirestore(app);

    const handleMarkAsPaid = async () => {
        if (transaction.status === 'Pago') return;
        const transactionRef = doc(firestore, 'transactions', transaction.id);
        try {
            await updateDoc(transactionRef, {
                status: 'Pago',
                paidAt: serverTimestamp()
            });
            // Also update user status to 'Ativo'
            const userRef = doc(firestore, 'users', transaction.userId);
            await updateDoc(userRef, { status: 'Ativo' });

            toast({
                title: "Transação Atualizada",
                description: "A cobrança foi marcada como paga e o status do usuário foi reativado.",
            });
        } catch (error) {
            console.error("Erro ao marcar como pago:", error);
            toast({
                title: "Erro",
                description: "Não foi possível atualizar a transação.",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: TransactionStatus) => {
        switch (status) {
            case "Pago": return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
            case "Pendente": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
            case "Vencido": return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
        }
    };

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{transaction.userName}</div>
                <div className="text-sm text-muted-foreground">{transaction.userId}</div>
            </TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell>R$ {transaction.amount.toFixed(2).replace('.', ',')}</TableCell>
            <TableCell>{transaction.createdAt ? format(transaction.createdAt.toDate(), "dd/MM/yyyy") : "..."}</TableCell>
            <TableCell>
                <Badge className={getStatusBadge(transaction.status)}>{transaction.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <TransactionDetailsDialog transaction={transaction}>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                            </DropdownMenuItem>
                        </TransactionDetailsDialog>
                        {transaction.status !== 'Pago' && (
                             <DropdownMenuItem onClick={handleMarkAsPaid}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marcar como Pago
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}

export default function FinanceAdminPage() {
    const firestore = getFirestore(app);
    const { toast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- Data Fetching ---
    const transactionsRef = collection(firestore, 'transactions');
    const [transactions, loadingTransactions, errorTransactions] = useCollectionData<Transaction>(
        query(transactionsRef, orderBy("createdAt", "desc")), 
        { idField: 'id' }
    );
    const usersRef = collection(firestore, 'users');
    const [users, loadingUsers] = useCollectionData<User>(usersRef, { idField: 'id' });

    const handleCreateTransaction = async (data: any) => {
        try {
            const newTransactionRef = doc(collection(firestore, "transactions"));
            const newTransactionId = newTransactionRef.id;

            await setDoc(newTransactionRef, {
                ...data,
                id: newTransactionId,
                uid: newTransactionId,
                createdAt: serverTimestamp(),
            });
            toast({
                title: "Cobrança Criada!",
                description: `Uma nova cobrança foi gerada para ${data.userName}.`
            });
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Erro ao criar transação:", error);
            toast({
                title: "Erro",
                description: "Não foi possível criar a cobrança.",
                variant: "destructive"
            });
        }
    };
    
    const renderContent = () => {
        if (loadingTransactions) {
            return Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (errorTransactions) {
            return (
                <TableRow>
                    <TableCell colSpan={6}>
                         <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                            <ShieldAlert className="h-8 w-8 text-destructive" />
                            <div>
                                <h4 className="font-bold text-destructive">Erro ao carregar transações</h4>
                                <p className="text-sm text-destructive/80">Não foi possível buscar os dados financeiros. Verifique suas regras de segurança. ({errorTransactions.message})</p>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }
        
        if (!transactions || transactions.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada.</TableCell>
                </TableRow>
            );
        }

        return transactions.map(t => <TransactionRow key={t.id} transaction={t} />);
    };

    return (
        <div className="grid gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                        <DollarSign className="h-8 w-8"/>
                        Gestão Financeira
                    </h1>
                    <p className="text-muted-foreground">Acompanhe e gerencie todas as transações da associação.</p>
                </div>
                <AddTransactionDialog
                    users={users || []}
                    loadingUsers={loadingUsers}
                    onSave={handleCreateTransaction}
                    isOpen={isAddModalOpen}
                    setIsOpen={setIsAddModalOpen}
                />
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle>Histórico de Transações</CardTitle>
                    <CardDescription>Todas as mensalidades, multas e taxas avulsas.</CardDescription>
                </CardHeader>
                <CardContent>
                     {/* TODO: Add filters here */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Data Criação</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderContent()}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
