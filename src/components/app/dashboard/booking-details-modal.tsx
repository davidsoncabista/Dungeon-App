
"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Booking } from "@/lib/types/booking"
import { auth } from "@/lib/firebase"
import { getRoomById } from "@/lib/mock-service"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, Users, User, Info, Pencil } from "lucide-react"
import { EditBookingModal } from "./edit-booking-modal"

// --- Componente de Detalhes da Reserva (Modal) ---
export const BookingDetailsModal = ({ booking, allBookings, onBookingUpdated, onOpenChange, children }: { booking: Booking, allBookings: Booking[], onBookingUpdated: (booking: Booking) => void, children: React.ReactNode, onOpenChange: (open: boolean) => void }) => {
    const room = getRoomById(booking.roomId);
    const organizer = booking.participants.find(p => p.uid === booking.organizerId);
    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const [user] = useAuthState(auth);
    const isOrganizer = user?.uid === organizer?.uid;
    const [isMyModalOpen, setIsMyModalOpen] = useState(false);

    const handleMyOpenChange = (open: boolean) => {
        setIsMyModalOpen(open);
        onOpenChange(open);
    }
    
    return (
        <Dialog open={isMyModalOpen} onOpenChange={handleMyOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{booking.title || 'Detalhes da Reserva'}</DialogTitle>
                    <DialogDescription>{room?.name} - {formattedDate}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   {booking.description && (
                     <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><Info className="h-4 w-4"/> Descrição</h3>
                       <p className="text-sm text-muted-foreground">{booking.description}</p>
                   </div>
                   )}
                   <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4"/> Horário</h3>
                       <p className="text-sm">{booking.startTime} - {booking.endTime}</p>
                   </div>
                   <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4"/> Organizador</h3>
                       <p className="text-sm">{organizer?.name}</p>
                   </div>
                   <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4"/> Participantes ({booking.participants.length})</h3>
                       <ul className="list-disc list-inside text-sm pl-4">
                           {booking.participants.map(p => <li key={p.uid}>{p.name}</li>)}
                       </ul>
                   </div>
                   {booking.guests && booking.guests > 0 ? (
                    <div className="space-y-2">
                       <h3 className="font-semibold">Convidados</h3>
                       <p className="text-sm">{booking.guests} convidado(s)</p>
                   </div>
                   ) : null}
                </div>
                 {isOrganizer && (
                    <div className="flex justify-end gap-2">
                        <EditBookingModal booking={booking} allBookings={allBookings} onBookingUpdated={onBookingUpdated} onOpenChange={setIsMyModalOpen}>
                            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                        </EditBookingModal>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
