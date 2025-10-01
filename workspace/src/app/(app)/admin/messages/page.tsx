
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mensagens Diretas',
  description: 'Envie e acompanhe mensagens individuais para os membros.',
};
"use client"

import { useState, useMemo } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { auth, app } from "@/lib/firebase"
import type { UserMessage, MessageCategory } from "@/lib/types/userMessage";
import type { User } from "@/lib/types/user";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, ShieldAlert, ArrowUpDown, X } from "lucide-react"
import { AddMessageDialog } from "@/components/app/admin/messages/add-message-dialog"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SortKey = 'recipientName' | 'createdAt';
type CategoryFilter = MessageCategory | 'all';

export default function MessagesAdminPage() {
    const firestore = getFirestore(app);
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- State for Sorting and Filtering ---
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');


    // --- Data Fetching ---
    const messagesRef = collection(firestore, 'userMessages');
    const [messages, loadingMessages, errorMessages] = useCollectionData<UserMessage>(
        query(messagesRef, orderBy("createdAt", "desc")), 
        { idField: 'id' }
    );
    const usersRef = collection(firestore, 'users');
    const [users, loadingUsers] = useCollectionData<User>(query(usersRef, orderBy("name")), { idField: 'id' });

    // --- Memoized Filtering and Sorting ---
    const filteredAndSortedMessages = useMemo(() => {
        if (!messages) return [];

        let filtered = [...messages];

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(m => m.category === categoryFilter);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(m => 
                m.recipientName?.toLowerCase().includes(lowercasedTerm) || 
                m.title.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filtered.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'createdAt') {
                comparison = (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
            } else { // recipientName
                comparison = (a.recipientName || '').localeCompare(b.recipientName || '');
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [messages, categoryFilter, searchTerm, sortKey, sortOrder]);


    const handleSendMessage = async (data: any) => {
        if (!user) {
            toast({ title: "Erro", description: "Você precisa estar autenticado.", variant: "destructive" });
            return;
        }

        try {
            const senderDoc = users?.find(u => u.uid === user.uid);
            const recipientDoc = users?.find(u => u.uid === data.recipientId);

            if (!senderDoc || !recipientDoc) {
                 toast({ title: "Erro", description: "Usuário remetente ou destinatário não encontrado.", variant: "destructive" });
                 return;
            }

            const newMessageRef = doc(collection(firestore, "userMessages"));
            
            await setDoc(newMessageRef, {
                id: newMessageRef.id,
                ...data,
                senderId: user.uid,
                senderName: senderDoc.name,
                recipientName: recipientDoc.name,
                createdAt: serverTimestamp(),
                read: false,
            });
            
            toast({
                title: "Mensagem Enviada!",
                description: `A mensagem foi enviada para ${recipientDoc.name}.`
            });
            setIsAddModalOpen(false);
        } catch (error: any) {
            console.error("Erro ao enviar mensagem:", error);
            toast({
                title: "Erro de Permissão",
                description: error.message || "Não foi possível enviar a mensagem. Verifique se você tem permissão de administrador.",
                variant: "destructive"
            });
        }
    };

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder(key === 'createdAt' ? 'desc' : 'asc');
        }
    };
    
    const renderContent = () => {
        if (loadingMessages) {
            return Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                </TableRow>
            ));
        }

        if (errorMessages) {
            return (
                <TableRow>
                    <TableCell colSpan={4}>
                         <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                            <ShieldAlert className="h-8 w-8 text-destructive" />
                            <div>
                                <h4 className="font-bold text-destructive">Erro ao carregar mensagens</h4>
                                <p className="text-sm text-destructive/80">Não foi possível buscar os dados. Verifique suas regras de segurança. ({errorMessages.message})</p>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }
        
        if (!filteredAndSortedMessages || filteredAndSortedMessages.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma mensagem encontrada com os filtros atuais.</TableCell>
                </TableRow>
            );
        }

        return filteredAndSortedMessages.map(msg => (
            <TableRow key={msg.id}>
                <TableCell className="font-medium">{msg.recipientName || users?.find(u => u.uid === msg.recipientId)?.name || 'Desconhecido'}</TableCell>
                <TableCell>{msg.title}</TableCell>
                <TableCell className="hidden sm:table-cell">{msg.createdAt ? format(msg.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "..."}</TableCell>
                <TableCell>
                    <Badge variant={msg.read ? "secondary" : "default"}>{msg.read ? "Lida" : "Não Lida"}</Badge>
                </TableCell>
                 <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{msg.category}</Badge>
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <div className="grid gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                        <MessageSquare className="h-8 w-8"/>
                        Mensagens Diretas
                    </h1>
                    <p className="text-muted-foreground">Envie e acompanhe mensagens individuais para os membros.</p>
                </div>
                <AddMessageDialog
                    users={users || []}
                    loadingUsers={loadingUsers}
                    onSave={handleSendMessage}
                    isOpen={isAddModalOpen}
                    setIsOpen={setIsAddModalOpen}
                />
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle>Histórico de Mensagens Enviadas</CardTitle>
                    <CardDescription>Todas as mensagens enviadas pela administração.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex-1 w-full">
                            <Input 
                                placeholder="Buscar por destinatário ou título..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                             <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as CategoryFilter)}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="Filtrar por categoria..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Categorias</SelectItem>
                                    <SelectItem value="aviso">Aviso</SelectItem>
                                    <SelectItem value="advertencia">Advertência</SelectItem>
                                    <SelectItem value="bloqueio">Bloqueio</SelectItem>
                                    <SelectItem value="multa">Multa</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => { setCategoryFilter('all'); setSearchTerm(''); }}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Limpar filtros</span>
                            </Button>
                        </div>
                     </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('recipientName')} className="px-0">
                                        Destinatário <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead className="hidden sm:table-cell">
                                     <Button variant="ghost" onClick={() => handleSort('createdAt')} className="px-0">
                                        Data de Envio <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
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
