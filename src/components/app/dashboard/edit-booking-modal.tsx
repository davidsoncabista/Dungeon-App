
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Booking } from "@/lib/types/booking"
import { BookingEditForm } from "@/components/app/booking-edit-form"
import { useToast } from "@/hooks/use-toast"
import { getRoomById, updateBooking } from "@/lib/mock-service"

// --- Componente de Edição de Reserva (Modal) ---
export const EditBookingModal = ({ booking, allBookings, onBookingUpdated, onOpenChange, children }: { booking: Booking; allBookings: Booking[]; onBookingUpdated: (updatedBooking: Booking) => void; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const room = getRoomById(booking.roomId);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    };

    const handleSuccess = (data: Partial<Omit<Booking, 'id' | 'status'>>) => {
        const updatedBooking = updateBooking(booking.id, data);
        if (updatedBooking) {
            onBookingUpdated(updatedBooking);
            toast({
                title: "Reserva Atualizada!",
                description: `Sua reserva para a ${room?.name} foi modificada.`,
            });
        } else {
            toast({
                title: "Erro!",
                description: "Não foi possível atualizar a reserva.",
                variant: "destructive",
            });
        }
        handleOpenChange(false);
    };

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
                        allBookings={allBookings}
                        onSuccess={handleSuccess}
                        onCancel={() => handleOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
