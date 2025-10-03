"use client"

import { useState, useMemo } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy, where, doc, updateDoc, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { app } from "@/lib/firebase";
import type { Transaction, TransactionStatus, TransactionType } from "@/lib/types/transaction";
import type { User } from "@/lib/types/user";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, CheckCircle2, ShieldAlert, DollarSign, Eye, ArrowUpDown, Filter, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AddTransactionDialog } from "@/components/app/admin/finance/add-transaction-dialog";
import { TransactionDetailsDialog } from "@/components/app/finance/transaction-details-dialog";
import { cn } from "@/lib/utils";

type SortKey = 'createdAt' | 'amount';
type StatusFilter = TransactionStatus | 'all';
type TypeFilter = TransactionType | 'all';

function TransactionRow({ transaction }: { transaction: Transaction }) {
    const { toast } = useToast();
    const firestore = getFirestore(app);

    const handleMarkAsPaid = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que o clique se propague para o DropdownMenuTrigger da linha
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <TableRow className="cursor-pointer">
                    <TableCell>
                        <div className="font-medium">{transaction.userName}</div>
                        <div className="text-sm text-muted-foreground md:hidden">{transaction.description}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{transaction.description}</TableCell>
                    <TableCell>R$ {transaction.amount.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="hidden lg:table-cell">{transaction.createdAt ? format(transaction.createdAt.toDate(), "dd/MM/yyyy") : "..."}</TableCell>
                    <TableCell>
                        <Badge className={cn(getStatusBadge(transaction.status), "whitespace-nowrap")}>{transaction.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                         <MoreHorizontal className="h-4 w-4" />
                    </TableCell>
                </TableRow>
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
    );
}

export default function FinanceAdminPage() {
    const firestore = getFirestore(app);
    const { toast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- State for Sorting and Filtering ---
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Data Fetching ---
    const transactionsRef = collection(firestore, 'transactions');
    const [transactions, loadingTransactions, errorTransactions] = useCollectionData<Transaction>(
        query(transactionsRef, orderBy("createdAt", "desc")), 
        { idField: 'id' }
    );
    const usersRef = collection(firestore, 'users');
    const [users, loadingUsers] = useCollectionData<User>(usersRef, { idField: 'id' });

    // --- Memoized Sorting and Filtering ---
    const filteredAndSortedTransactions = useMemo(() => {
        if (!transactions) return [];

        let filtered = [...transactions];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(t => 
                t.userName.toLowerCase().includes(lowercasedTerm) || 
                t.description.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filtered.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'createdAt') {
                comparison = (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
            } else { // amount
                comparison = a.amount - b.amount;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    }, [transactions, statusFilter, typeFilter, searchTerm, sortKey, sortOrder]);


    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc'); // Default to descending for new sort key
        }
    }


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
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right hidden md:table-cell"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
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
        
        if (!filteredAndSortedTransactions || filteredAndSortedTransactions.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhuma transação encontrada com os filtros atuais.</TableCell>
                </TableRow>
            );
        }

        return filteredAndSortedTransactions.map(t => <TransactionRow key={t.id} transaction={t} />);
    };

    return (
        <div className="grid gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                        <DollarSign className="h-8 w-8"/>
                        Gestão Financeira
                    </h1>
                    <p className="text-muted-foreground">Acompanhe e gerencie todas as transações da associação.</p>
                </div>
                <div className="sm:hidden">
                    <AddTransactionDialog
                        users={users || []}
                        loadingUsers={loadingUsers}
                        onSave={handleCreateTransaction}
                        isOpen={isAddModalOpen}
                        setIsOpen={setIsAddModalOpen}
                    />
                </div>
                <div className="hidden sm:block">
                    <AddTransactionDialog
                        users={users || []}
                        loadingUsers={loadingUsers}
                        onSave={handleCreateTransaction}
                        isOpen={isAddModalOpen}
                        setIsOpen={setIsAddModalOpen}
                    />
                </div>
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle>Histórico de Transações</CardTitle>
                    <CardDescription>Todas as mensalidades, multas e taxas avulsas.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex-1 w-full">
                            <Input 
                                placeholder="Buscar por nome ou descrição..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                             <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Filtrar por status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Vencido">Vencido</SelectItem>
                                </SelectContent>
                            </Select>
                              <Select value={typeFilter} onValueChange={v => setTypeFilter(v as TypeFilter)}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Filtrar por tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Tipos</SelectItem>
                                    <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                                    <SelectItem value="Avulso">Avulso</SelectItem>
                                    <SelectItem value="Inicial">Inicial</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchTerm(''); }}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Limpar filtros</span>
                            </Button>
                        </div>
                     </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                                <TableHead>
                                     <Button variant="ghost" onClick={() => handleSort('amount')} className="px-0">
                                        Valor <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead className="hidden lg:table-cell">
                                     <Button variant="ghost" onClick={() => handleSort('createdAt')} className="px-0">
                                        Data <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right hidden md:table-cell">Ações</TableHead>
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
