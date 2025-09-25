
"use client"

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Poll } from "@/lib/types/poll";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Play, Square, Trash2, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PollResultsDialog } from "./poll-results-dialog";

interface PollActionsProps {
    poll: Poll;
    canManage: boolean;
}

export function PollActions({ poll, canManage }: PollActionsProps) {
    const { toast } = useToast();
    const functions = getFunctions(app, 'southamerica-east1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

    const handleAction = async (actionName: 'startPoll' | 'endPoll' | 'deletePoll', pollId: string) => {
        setIsSubmitting(true);
        try {
            const func = httpsCallable(functions, actionName);
            await func({ pollId });
            toast({ title: "Sucesso!", description: `Ação executada com sucesso.` });
        } catch (error: any) {
            console.error(`Erro ao executar ${actionName}:`, error);
            toast({ title: "Erro!", description: error.message || "Não foi possível completar a ação.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setIsDeleteDialogOpen(false);
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
                        {poll.status === 'Fechada' && (
                             <DropdownMenuItem onSelect={() => handleAction('startPoll', poll.id)} disabled={isSubmitting}>
                                <Play className="mr-2 h-4 w-4" /> Iniciar Votação
                            </DropdownMenuItem>
                        )}
                         {poll.status === 'Aberta' && (
                             <DropdownMenuItem onSelect={() => handleAction('endPoll', poll.id)} disabled={isSubmitting}>
                                <Square className="mr-2 h-4 w-4" /> Encerrar Votação
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
                        <AlertDialogAction onClick={() => handleAction('deletePoll', poll.id)} className="bg-destructive hover:bg-destructive/90">
                            Sim, excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
