"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Booking } from "@/lib/types/booking"
import { BookingEditForm } from "@/components/app/booking-edit-form"
import { useToast } from "@/hooks/use-toast"
import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { useDocumentData } from "react-firebase-hooks/firestore"
import type { Room } from "@/lib/types/room"
import { differenceInHours, parseISO } from "date-fns"
import { DeleteBookingDialog } from "./delete-booking-dialog"

// --- Componente de Edição de Reserva (Modal) ---
export const EditBookingModal = ({ booking, onOpenChange, children }: { booking: Booking; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const firestore = getFirestore(app);
    const roomRef = doc(firestore, 'rooms', booking.roomId);
    const [room] = useDocumentData<Room>(roomRef, { idField: 'id' });

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    };

    const handleSuccess = async (data: Partial<Omit<Booking, 'id'>>) => {
        const bookingRef = doc(firestore, 'bookings', booking.id);
        try {
            await updateDoc(bookingRef, data);
            toast({
                title: "Reserva Atualizada!",
                description: `Sua reserva para a ${room?.name} foi modificada.`,
            });
            handleOpenChange(false);
        } catch (error) {
             toast({
                title: "Erro!",
                description: "Não foi possível atualizar a reserva.",
                variant: "destructive",
            });
        }
    };
    
    const handleDelete = async () => {
        const bookingRef = doc(firestore, 'bookings', booking.id);
        try {
            await deleteDoc(bookingRef);
            toast({
                title: "Reserva Cancelada!",
                description: "A reserva foi cancelada com sucesso.",
            });
            handleOpenChange(false);
        } catch (error) {
            toast({
                title: "Erro ao Cancelar",
                description: "Não foi possível cancelar a reserva.",
                variant: "destructive",
            });
        }
    };

    // Lógica para permitir ou não o cancelamento
    const bookingDateTime = parseISO(`${booking.date}T${booking.startTime}`);
    const hoursUntilBooking = differenceInHours(bookingDateTime, new Date());
    const canCancel = hoursUntilBooking >= 5;


    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Reserva</DialogTitle>
                    <DialogDescription>Modifique as informações da sua sessão para a sala {room?.name}.</DialogDescription>
                </DialogHeader>
                {room && (
                    <BookingEditForm
                        booking={booking}
                        room={room}
                        onSuccess={handleSuccess}
                        onCancel={() => handleOpenChange(false)}
                        onDelete={handleDelete}
                        canCancel={canCancel}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
