
"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DeleteBookingDialogProps {
    onConfirm: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    disabledReason?: string;
}

export function DeleteBookingDialog({ onConfirm, children, disabled = false, disabledReason }: DeleteBookingDialogProps) {
    if (disabled) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* A div é necessária para que o Tooltip funcione em um elemento desabilitado */}
                        <div className="relative w-full" tabIndex={0}>
                           {children}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{disabledReason}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }
    
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso cancelará permanentemente a reserva e removerá seus dados de nossos servidores.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, cancelar reserva
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
