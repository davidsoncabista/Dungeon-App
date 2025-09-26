
"use client"

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import type { Poll } from "@/lib/types/poll";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Play, Square, Trash2, BarChart3, Loader2, Send, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PollResultsDialog } from "./poll-results-dialog";

interface PollActionsProps {
    poll: Poll;
    canManage: boolean;
    onEdit: (poll: Poll) => void;
    onDelete: (poll: Poll) => void;
    onSendResults: (poll: Poll) => void;
}

export function PollActions({ poll, canManage, onEdit, onDelete, onSendResults }: PollActionsProps) {
    const { toast } = useToast();
    const firestore = getFirestore(app);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<"start" | "end" | null>(null);

    const handleStatusChange = async () => {
        if (!actionType) return;
        const newStatus = actionType === 'start' ? 'Aberta' : 'Fechada';
        
        setIsSubmitting(true);
        try {
            const pollRef = doc(firestore, "polls", poll.id);
            await updateDoc(pollRef, { 
                status: newStatus,
                 ...(newStatus === 'Fechada' && { closedAt: new Date() }) 
            });
            toast({ title: "Sucesso!", description: `Votação ${newStatus.toLowerCase()} com sucesso.` });
            setActionType(null); // Fecha o AlertDialog
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
            <AlertDialog open={!!actionType} onOpenChange={(isOpen) => !isOpen && setActionType(null)}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isSubmitting || !canManage}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações da Votação</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem onSelect={() => onEdit(poll)} disabled={poll.status === 'Aberta'}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar Votação
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsResultsDialogOpen(true)}>
                            <BarChart3 className="mr-2 h-4 w-4" /> Ver Resultados
                        </DropdownMenuItem>
                        {poll.status === 'Fechada' ? (
                             <DropdownMenuItem onSelect={() => setActionType('start')} disabled={isSubmitting}>
                                <Play className="mr-2 h-4 w-4" /> Iniciar Votação
                            </DropdownMenuItem>
                        ) : (
                             <DropdownMenuItem onSelect={() => setActionType('end')} disabled={isSubmitting}>
                                <Square className="mr-2 h-4 w-4" /> Encerrar Votação
                            </DropdownMenuItem>
                        )}
                        {poll.status === 'Fechada' && (
                             <DropdownMenuItem onSelect={() => onSendResults(poll)}>
                                <Send className="mr-2 h-4 w-4" /> Enviar Resultados
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onDelete(poll)} className="text-destructive focus:text-destructive" disabled={isSubmitting}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você tem certeza que deseja {actionType === 'start' ? 'iniciar' : 'encerrar'} esta votação?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStatusChange}>
                            Sim, {actionType === 'start' ? 'iniciar' : 'encerrar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
