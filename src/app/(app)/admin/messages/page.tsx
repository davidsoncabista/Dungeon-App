
"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { auth, app } from "@/lib/firebase"
import type { UserMessage } from "@/lib/types/userMessage";
import type { User } from "@/lib/types/user";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, ShieldAlert } from "lucide-react"
import { AddMessageDialog } from "@/components/app/admin/messages/add-message-dialog"
import { useToast } from "@/hooks/use-toast"

export default function MessagesAdminPage() {
    const firestore = getFirestore(app);
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- Data Fetching ---
    const messagesRef = collection(firestore, 'userMessages');
    const [messages, loadingMessages, errorMessages] = useCollectionData<UserMessage>(
        query(messagesRef, orderBy("createdAt", "desc")), 
        { idField: 'id' }
    );
    const usersRef = collection(firestore, 'users');
    const [users, loadingUsers] = useCollectionData<User>(query(usersRef, orderBy("name")), { idField: 'id' });

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
        
        if (!messages || messages.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Nenhuma mensagem enviada ainda.</TableCell>
                </TableRow>
            );
        }

        return messages.map(msg => (
            <TableRow key={msg.id}>
                <TableCell className="font-medium">{msg.recipientName || users?.find(u => u.uid === msg.recipientId)?.name || 'Desconhecido'}</TableCell>
                <TableCell>{msg.title}</TableCell>
                <TableCell>{msg.createdAt ? format(msg.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "..."}</TableCell>
                <TableCell>
                    <Badge variant={msg.read ? "secondary" : "default"}>{msg.read ? "Lida" : "Não Lida"}</Badge>
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <div className="grid gap-8">
            <div className="flex items-center justify-between">
                <div>
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Destinatário</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Data de Envio</TableHead>
                                <TableHead>Status</TableHead>
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
