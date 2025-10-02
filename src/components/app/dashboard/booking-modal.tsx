
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Booking } from "@/lib/types/booking"
import { BookingForm } from "@/components/app/booking-form"
import { useToast } from "@/hooks/use-toast"
import { getFirestore, collection, doc, setDoc, query, where } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { app, auth } from "@/lib/firebase"
import { createAuditLog } from "@/lib/auditLogger"
import type { User } from "@/lib/types/user"


// --- Componente de Reserva (Modal) ---
export const BookingModal = ({ initialDate, onOpenChange, allBookings, children }: { initialDate: Date, onOpenChange: (open: boolean) => void, allBookings: Booking[], children: React.ReactNode }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const firestore = getFirestore(app);
    const [user] = useAuthState(auth);

    const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
    const [currentUserData] = useCollectionData<User>(userQuery);
    const currentUser = currentUserData?.[0];

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    }
    
    const handleSuccess = async (data: Omit<Booking, 'id' | 'status'>) => {
        if (!currentUser) {
            toast({ title: "Erro!", description: "Usuário não encontrado.", variant: "destructive" });
            return;
        }

        const bookingsRef = collection(firestore, "bookings");
        const newBookingRef = doc(bookingsRef);
        
        const newBooking: Booking = {
            ...data,
            id: newBookingRef.id,
            status: 'Confirmada',
        };

        try {
            await setDoc(newBookingRef, newBooking);
            
            // Log de Auditoria
            await createAuditLog(currentUser, 'CREATE_BOOKING', { 
                bookingId: newBooking.id, 
                date: newBooking.date,
                title: newBooking.title
            });
            
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
                    initialDate={initialDate} 
                    allBookings={allBookings} 
                    onSuccess={handleSuccess}
                    onCancel={() => handleOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
