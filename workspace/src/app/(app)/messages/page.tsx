"use client"

import { useMemo, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where, orderBy, doc, updateDoc } from "firebase/firestore"
import { format } from "date-fns"
import { ptBR } from 'date-fns/locale';

import { auth, app } from "@/lib/firebase"
import type { UserMessage } from "@/lib/types/userMessage"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldAlert, Mail, AlertTriangle, ShieldCheck, Info, MessageSquareWarning } from "lucide-react"
import { cn } from "@/lib/utils"

const categoryIcons: Record<UserMessage['category'], React.ReactNode> = {
    'aviso': <Info className="h-5 w-5 text-blue-500" />,
    'advertencia': <MessageSquareWarning className="h-5 w-5 text-yellow-500" />,
    'bloqueio': <ShieldAlert className="h-5 w-5 text-red-500" />,
    'multa': <AlertTriangle className="h-5 w-5 text-orange-500" />,
};

function MessageCard({ message, onRead }: { message: UserMessage, onRead: (id: string) => void }) {
    const isUnread = !message.read;

    const handleCardClick = () => {
        if (isUnread) {
            onRead(message.id);
        }
    }

    return (
        <Card 
            className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isUnread && "bg-primary/5 border-primary/20"
            )}
            onClick={handleCardClick}
        >
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                 <div className="p-3 rounded-full bg-muted mt-1">
                    {categoryIcons[message.category]}
                </div>
                <div className="flex-1">
                    <CardTitle className="text-lg font-bold font-headline">{message.title}</CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                        <span>De: {message.senderName || "Administração"}</span>
                        <span>{message.createdAt ? format(message.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}</span>
                    </div>
                </div>
                {isUnread && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.content}</p>
            </CardContent>
        </Card>
    );
}

export default function MessagesPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const firestore = getFirestore(app);
  
  const messagesQuery = user 
    ? query(collection(firestore, 'userMessages'), where('recipientId', '==', user.uid), orderBy('createdAt', 'desc'))
    : null;
  const [messages, loadingMessages, errorMessages] = useCollectionData<UserMessage>(messagesQuery, { idField: 'id' });

  const handleMarkAsRead = async (messageId: string) => {
    try {
        const messageRef = doc(firestore, 'userMessages', messageId);
        await updateDoc(messageRef, { read: true });
    } catch (error) {
        console.error("Erro ao marcar mensagem como lida:", error);
    }
  }

  const renderContent = () => {
    if (loadingAuth || loadingMessages) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-[68px] space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ));
    }

    if (errorMessages) {
        return (
            <Card className="bg-destructive/10 border-destructive">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ShieldAlert className="h-8 w-8 text-destructive" />
                        <div>
                            <CardTitle className="text-destructive">Erro ao Carregar Mensagens</CardTitle>
                            <CardDescription className="text-destructive/80">Não foi possível buscar suas mensagens. Tente novamente mais tarde.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        )
    }

    if (!messages || messages.length === 0) {
      return (
        <Card>
            <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Caixa de Entrada Vazia</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Você não tem nenhuma mensagem da administração no momento.
                </p>
            </CardContent>
        </Card>
      )
    }

    return messages.map(msg => <MessageCard key={msg.id} message={msg} onRead={handleMarkAsRead} />);
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Minhas Mensagens</h1>
        <p className="text-muted-foreground">Sua caixa de entrada para comunicados importantes da administração.</p>
      </div>
      
      <div className="space-y-6">
        {renderContent()}
      </div>
    </div>
  )
}
