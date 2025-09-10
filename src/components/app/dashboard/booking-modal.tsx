
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { BookingForm } from "@/components/app/booking-form"
import { useToast } from "@/hooks/use-toast"
import { createBooking } from "@/lib/mock-service"

// --- Componente de Reserva (Modal) ---
export const BookingModal = ({ room, date, onOpenChange, onBookingCreated, allBookings, children }: { room: Room, date: Date, onOpenChange: (open: boolean) => void, onBookingCreated: (newBookings: Booking) => void, allBookings: Booking[], children: React.ReactNode }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    }
    
    const handleSuccess = (data: Omit<Booking, 'id' | 'status'>) => {
        const createdBooking = createBooking(data);
        
        handleOpenChange(false);
        toast({
            title: "Reserva Confirmada!",
            description: `Sua reserva para a ${room.name} foi agendada com sucesso.`,
        });
        onBookingCreated(createdBooking);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Reservar {room.name}</DialogTitle>
                    <DialogDescription>
                        Preencha as informações para agendar sua sessão.
                    </DialogDescription>
                </DialogHeader>
                <BookingForm 
                    room={room} 
                    date={date} 
                    allBookings={allBookings} 
                    onSuccess={handleSuccess}
                    onCancel={() => handleOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
