
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Booking } from "@/lib/types/booking"
import { BookingForm } from "@/components/app/booking-form"
import { useToast } from "@/hooks/use-toast"
import { getFirestore, collection, doc, setDoc } from "firebase/firestore"
import { app } from "@/lib/firebase"
import type { Room } from "@/lib/types/room"

// --- Componente de Reserva (Modal) ---
export const BookingModal = ({ date, onOpenChange, allBookings, children }: { date: Date, onOpenChange: (open: boolean) => void, allBookings: Booking[], children: React.ReactNode }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const firestore = getFirestore(app);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    }
    
    const handleSuccess = async (data: Omit<Booking, 'id' | 'status'>) => {
        const bookingsRef = collection(firestore, "bookings");
        const newBookingRef = doc(bookingsRef);
        
        const newBooking: Booking = {
            ...data,
            id: newBookingRef.id,
            status: 'Confirmada',
        };

        try {
            await setDoc(newBookingRef, newBooking);
            handleOpenChange(false);
            toast({
                title: "Reserva Confirmada!",
                description: `Sua reserva foi agendada com sucesso.`,
            });
        } catch (error) {
            console.error("Erro ao criar reserva:", error);
             toast({
                title: "Erro!",
                description: "Não foi possível criar a reserva.",
                variant: "destructive"
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Criar Nova Reserva</DialogTitle>
                    <DialogDescription>
                        Preencha as informações para agendar sua sessão.
                    </DialogDescription>
                </DialogHeader>
                <BookingForm 
                    date={date} 
                    allBookings={allBookings} 
                    onSuccess={handleSuccess}
                    onCancel={() => handleOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

    
