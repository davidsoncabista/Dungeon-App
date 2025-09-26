
"use client"

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import type { Poll } from "@/lib/types/poll";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Play, Square, Trash2, BarChart3, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PollResultsDialog } from "./poll-results-dialog";

interface PollActionsProps {
    poll: Poll;
    canManage: boolean;
    onSendResults: (poll: Poll) => void;
}

export function PollActions({ poll, canManage, onSendResults }: PollActionsProps) {
    const { toast } = useToast();
    const firestore = getFirestore(app);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

    const handleStatusChange = async (newStatus: "Aberta" | "Fechada") => {
        setIsSubmitting(true);
        try {
            await updateDoc(doc(firestore, "polls", poll.id), { 
                status: newStatus,
                ...(newStatus === 'Fechada' && { closedAt: new Date() }) // Adiciona timestamp no fechamento
            });
            toast({ title: "Sucesso!", description: `Votação ${newStatus.toLowerCase()} com sucesso.` });
        } catch (error: any) {
            console.error(`Erro ao mudar status:`, error);
            toast({ title: "Erro de Permissão!", description: error.message || "Você não tem permissão para realizar esta ação.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="flex items-center justify-end">
            <PollResultsDialog poll={poll} isOpen={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen} />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isSubmitting || !canManage}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações da Votação</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setIsResultsDialogOpen(true)}>
                            <BarChart3 className="mr-2 h-4 w-4" /> Ver Resultados
                        </DropdownMenuItem>
                        {poll.status === 'Fechada' ? (
                             <DropdownMenuItem onSelect={() => handleStatusChange('Aberta')} disabled={isSubmitting}>
                                <Play className="mr-2 h-4 w-4" /> Iniciar Votação
                            </DropdownMenuItem>
                        ) : (
                             <DropdownMenuItem onSelect={() => handleStatusChange('Fechada')} disabled={isSubmitting}>
                                <Square className="mr-2 h-4 w-4" /> Encerrar Votação
                            </DropdownMenuItem>
                        )}
                        {poll.status === 'Fechada' && (
                             <DropdownMenuItem onSelect={() => onSendResults(poll)}>
                                <Send className="mr-2 h-4 w-4" /> Enviar Resultados
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive" disabled={isSubmitting}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação é irreversível. A votação "{poll.title}" e todos os votos associados serão permanentemente removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { /* A exclusão agora é feita pelo system/page */ }} className="bg-destructive hover:bg-destructive/90">
                            Sim, excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
