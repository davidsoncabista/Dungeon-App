
"use client"

import { useState, useMemo } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Booking } from "@/lib/types/booking"
import { auth, app } from "@/lib/firebase"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, Users, User, Info, Pencil } from "lucide-react"
import { EditBookingModal } from "./edit-booking-modal"
import { getFirestore, collection, query, where } from "firebase/firestore"
import { useCollectionData, useDocumentData } from "react-firebase-hooks/firestore"
import type { Room } from "@/lib/types/room"
import { Skeleton } from "@/components/ui/skeleton"

// --- Componente de Detalhes da Reserva (Modal) ---
export const BookingDetailsModal = ({ booking, onOpenChange, children }: { booking: Booking, children: React.ReactNode, onOpenChange: (open: boolean) => void }) => {
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);
    
    // Busca dados da sala
    const [room, loadingRoom] = useDocumentData<Room>(doc(firestore, 'rooms', booking.roomId), { idField: 'id' });
    
    // Busca dados dos participantes
    const usersRef = collection(firestore, 'users');
    const participantsQuery = useMemo(() => 
        booking.participants.length > 0 ? query(usersRef, where('uid', 'in', booking.participants)) : null
    , [booking.participants, usersRef]);
    const [participantDetails, loadingParticipants] = useCollectionData<User>(participantsQuery, { idField: 'id' });

    const organizer = useMemo(() => 
        participantDetails?.find(p => p.uid === booking.organizerId)
    , [participantDetails, booking.organizerId]);
    
    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const isOrganizer = user?.uid === booking.organizerId;
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
                    {loadingRoom ? <Skeleton className="h-4 w-32 mt-1" /> : <DialogDescription>{room?.name} - {formattedDate}</DialogDescription>}
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
                       {loadingParticipants ? <Skeleton className="h-4 w-40" /> : <p className="text-sm">{organizer?.name}</p>}
                   </div>
                   <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4"/> Participantes ({booking.participants.length})</h3>
                        {loadingParticipants ? (
                            <ul className="list-disc list-inside text-sm pl-4 space-y-1">
                                {Array.from({ length: booking.participants.length }).map((_, i) => <li key={i}><Skeleton className="h-4 w-32 inline-block" /></li>)}
                            </ul>
                        ) : (
                           <ul className="list-disc list-inside text-sm pl-4">
                               {participantDetails?.map(p => <li key={p.uid}>{p.name}</li>)}
                           </ul>
                        )}
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
                        <EditBookingModal booking={booking} onOpenChange={setIsMyModalOpen}>
                            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                        </EditBookingModal>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

    