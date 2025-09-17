
"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { getFirestore, doc, updateDoc, arrayRemove } from "firebase/firestore"
import { format, parseISO, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"

import { app, auth } from "@/lib/firebase"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Clock, Users, MoreHorizontal, Pencil, Eye, LogOut } from "lucide-react"

import { EditBookingModal } from "@/components/app/dashboard/edit-booking-modal"
import { BookingDetailsModal } from "@/components/app/dashboard/booking-details-modal"
import { useToast } from "@/hooks/use-toast"

export function BookingRow({ booking }: { booking: Booking }) {
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);
    const roomRef = doc(firestore, 'rooms', booking.roomId);
    const [room, loadingRoom] = useDocumentData<Room>(roomRef, { idField: 'id' });
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    
    const isOrganizer = user?.uid === booking.organizerId;
    const isBookingInThePast = isPast(parseISO(`${booking.date}T${booking.endTime}`));
    
    const totalParticipants = (booking.participants?.length || 0) + (booking.guests?.length || 0);


    const handleLeaveBooking = async () => {
        if (!user || isOrganizer) return; // Apenas participantes que não são organizadores podem sair.
        const bookingRef = doc(firestore, 'bookings', booking.id);
        try {
            await updateDoc(bookingRef, {
                participants: arrayRemove(user.uid)
            });
            toast({
                title: "Você saiu da reserva",
                description: "Você não está mais participando desta sessão."
            })
        } catch (error) {
            console.error("Erro ao sair da reserva:", error);
            toast({
                title: "Erro!",
                description: "Não foi possível sair da reserva.",
                variant: "destructive"
            })
        }
    }
    
    if (loadingRoom) {
        return (
             <TableRow>
                <TableCell colSpan={5}>
                    <Skeleton className="h-12 w-full" />
                </TableCell>
            </TableRow>
        )
    }

    return (
      <TableRow>
        <TableCell>
            <div className="font-medium">{booking.title || 'Reserva sem título'}</div>
            <div className="text-sm text-muted-foreground">{room?.name || "Sala não encontrada"}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
            {formattedDate}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
            {booking.startTime} - {booking.endTime}
        </TableCell>
        <TableCell>
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{totalParticipants}</span>
            </div>
        </TableCell>
        <TableCell className="text-right">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    
                    {isOrganizer ? (
                        <DropdownMenuItem onSelect={() => isBookingInThePast ? setIsDetailsModalOpen(true) : setIsEditModalOpen(true)}>
                            {isBookingInThePast ? <Eye className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                            {isBookingInThePast ? 'Ver Detalhes' : 'Editar Reserva'}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onSelect={() => setIsDetailsModalOpen(true)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                    )}
                    
                    {!isOrganizer && !isBookingInThePast && (
                        <>
                            <DropdownMenuSeparator />
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={e => e.preventDefault()}>
                                        <LogOut className="mr-2 h-4 w-4" /> Sair da Reserva
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Sair da Reserva?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Você tem certeza que quer sair desta sessão? O organizador será notificado.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleLeaveBooking}>Sim, sair</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* O trigger do modal é substituído pelo item do menu, mas o componente precisa existir */}
            <EditBookingModal booking={booking} onOpenChange={setIsEditModalOpen}>
                <div data-state={isEditModalOpen ? 'open' : 'closed'} className="hidden" />
            </EditBookingModal>
            
            <BookingDetailsModal booking={booking} onOpenChange={setIsDetailsModalOpen}>
                 <div data-state={isDetailsModalOpen ? 'open' : 'closed'} className="hidden" />
            </BookingDetailsModal>
        </TableCell>
      </TableRow>
    );
};
