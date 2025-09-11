
"use client"

import { useState } from "react"
<<<<<<< HEAD
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import type { Booking } from "@/lib/types/booking"
import { format, parseISO, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, Users, MoreHorizontal, Pencil, Eye, LogOut } from "lucide-react"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { doc, getFirestore, updateDoc, arrayRemove } from "firebase/firestore"
import { app, auth } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
=======
import { useAuthState } from "react-firebase-hooks/auth"
import { useDocumentData } from "react-firebase-hooks/firestore"
import { getFirestore, doc, updateDoc, arrayRemove } from "firebase/firestore"
import { format, parseISO, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"

import { app, auth } from "@/lib/firebase"
import type { Booking } from "@/lib/types/booking"
>>>>>>> 132f773a (feat: Adicionar funcionalidades e correções em diversas áreas do app)
import type { Room } from "@/lib/types/room"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditBookingModal } from "@/components/app/dashboard/edit-booking-modal"
import { BookingDetailsModal } from "@/components/app/dashboard/booking-details-modal"
import { useAuthState } from "react-firebase-hooks/auth"
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
import { useToast } from "@/hooks/use-toast"

<<<<<<< HEAD
export const BookingRow = ({ booking }: { booking: Booking }) => {
    const { toast } = useToast();
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);
    const roomRef = doc(firestore, 'rooms', booking.roomId);
    const [room, loadingRoom] = useDocumentData<Room>(roomRef, { idField: 'id' });
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const totalParticipants = booking.participants.length + (booking.guests?.length ?? 0);
    
    const isOrganizer = user?.uid === booking.organizerId;
    const isBookingInThePast = isPast(parseISO(`${booking.date}T${booking.endTime}`));

    const statusVariant: { [key: string]: "secondary" | "destructive" | "outline" } = {
        'Confirmada': 'secondary',
        'Cancelada': 'destructive',
        'Pendente': 'outline'
    }

    const handleLeaveBooking = async () => {
        if (!user) return;
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
                    <Skeleton className="h-16 w-full" />
                </TableCell>
            </TableRow>
        )
    }

    return (
      <TableRow>
        <TableCell>
            <div className="font-medium">{room?.name || "Sala não encontrada"}</div>
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground"/>
                <span>{booking.startTime} - {booking.endTime}</span>
            </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground"/>
                <span>{totalParticipants} participante(s)</span>
            </div>
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant[booking.status] || 'default'} className={booking.status === 'Confirmada' ? 'bg-green-100 text-green-800' : ''}>
            {booking.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isBookingInThePast}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Ações</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                {isOrganizer ? (
                    <EditBookingModal booking={booking} onOpenChange={setIsEditModalOpen}>
                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar Reserva
                        </DropdownMenuItem>
                    </EditBookingModal>
                ) : (
                    <BookingDetailsModal booking={booking} onOpenChange={setIsDetailsModalOpen}>
                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                    </BookingDetailsModal>
                )}
                
                {!isOrganizer && (
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
        </TableCell>
      </TableRow>
    );
};
=======
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Eye, LogOut } from "lucide-react"

import { EditBookingModal } from "@/components/app/dashboard/edit-booking-modal"
import { BookingDetailsModal } from "@/components/app/dashboard/booking-details-modal"
import { useToast } from "@/hooks/use-toast"


interface BookingRowProps {
  booking: Booking;
}

export function BookingRow({ booking }: BookingRowProps) {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const firestore = getFirestore(app);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLeaveAlertOpen, setIsLeaveAlertOpen] = useState(false);

  const [room] = useDocumentData<Room>(doc(firestore, "rooms", booking.roomId));

  const isOrganizer = user?.uid === booking.organizerId;
  const bookingIsPast = isPast(parseISO(`${booking.date}T${booking.endTime}`));

  const handleLeaveBooking = async () => {
    if (!user) return;
    try {
      const bookingRef = doc(firestore, "bookings", booking.id);
      await updateDoc(bookingRef, {
        participants: arrayRemove(user.uid)
      });
      toast({
        title: "Você saiu da reserva",
        description: `Sua participação na sessão "${booking.title}" foi removida.`
      });
    } catch (error) {
      console.error("Erro ao sair da reserva:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover sua participação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const formattedDate = format(parseISO(booking.date), "dd/MM/yy");

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{booking.title}</p>
        <p className="text-sm text-muted-foreground">{room?.name}</p>
      </TableCell>
      <TableCell className="hidden md:table-cell">{formattedDate}</TableCell>
      <TableCell className="hidden sm:table-cell">{booking.startTime} - {booking.endTime}</TableCell>
      <TableCell className="text-right">
        <AlertDialog open={isLeaveAlertOpen} onOpenChange={setIsLeaveAlertOpen}>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações para a reserva</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                {isOrganizer ? (
                    <DropdownMenuItem onSelect={() => setIsEditModalOpen(true)} disabled={bookingIsPast}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Reserva
                    </DropdownMenuItem>
                ) : (
                    <>
                        <DropdownMenuItem onSelect={() => setIsDetailsModalOpen(true)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()} disabled={bookingIsPast}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair da Reserva
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </>
                )}
            </DropdownMenuContent>
            </DropdownMenu>

            {/* Confirmation Dialog to Leave */}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação removerá você da lista de participantes desta reserva. Você não poderá reverter isso sozinho.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeaveBooking} className="bg-destructive hover:bg-destructive/90">
                        Sim, sair
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {isOrganizer ? (
            <EditBookingModal booking={booking} onOpenChange={setIsEditModalOpen}>
                <div data-state={isEditModalOpen ? 'open' : 'closed'} />
            </EditBookingModal>
        ) : (
            <BookingDetailsModal booking={booking} onOpenChange={setIsDetailsModalOpen}>
                 <div data-state={isDetailsModalOpen ? 'open' : 'closed'} />
            </BookingDetailsModal>
        )}
      </TableCell>
    </TableRow>
  );
}

>>>>>>> 132f773a (feat: Adicionar funcionalidades e correções em diversas áreas do app)
