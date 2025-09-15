
"use client"

import { useState, useMemo, type ReactNode } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Booking } from "@/lib/types/booking"
import { auth, app } from "@/lib/firebase"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock, Users, User, Info, Pencil } from "lucide-react"
import { EditBookingModal } from "./edit-booking-modal"
import { getFirestore, collection, query, where, doc } from "firebase/firestore"
import { useCollectionData, useDocumentData } from "react-firebase-hooks/firestore"
import type { Room } from "@/lib/types/room"
import type { User as AppUser } from "@/lib/types/user";
import { Skeleton } from "@/components/ui/skeleton"

// --- Componente de Detalhes da Reserva (Modal) ---
export const BookingDetailsModal = ({ booking, onOpenChange, children }: { booking: Booking, children: ReactNode, onOpenChange: (open: boolean) => void }) => {
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);
    
    // Busca dados da sala
    const [room, loadingRoom] = useDocumentData<Room>(doc(firestore, 'rooms', booking.roomId), { idField: 'id' });
    
    // Concatena todos os UIDs para uma única consulta
    const allParticipantUIDs = useMemo(() => 
        [...booking.participants, ...(booking.guests || [])]
    , [booking.participants, booking.guests]);

    // Busca dados de todos os envolvidos (membros e convidados)
    const usersRef = collection(firestore, 'users');
    const participantsQuery = useMemo(() => 
        allParticipantUIDs.length > 0 ? query(usersRef, where('uid', 'in', allParticipantUIDs)) : null
    , [allParticipantUIDs, usersRef]);
    const [participantDetails, loadingParticipants] = useCollectionData<AppUser>(participantsQuery, { idField: 'id' });

    // Busca dados do usuário atual para checar se é admin
    const currentUserQuery = user ? query(usersRef, where('uid', '==', user.uid)) : null;
    const [currentUserData] = useCollectionData<AppUser>(currentUserQuery);
    const currentUser = currentUserData?.[0];
    
    const organizer = useMemo(() => 
        participantDetails?.find(p => p.uid === booking.organizerId)
    , [participantDetails, booking.organizerId]);

    const activeParticipants = useMemo(() => 
        participantDetails?.filter(p => booking.participants.includes(p.uid))
    , [participantDetails, booking.participants]);

    const guestParticipants = useMemo(() => 
        participantDetails?.filter(p => booking.guests?.includes(p.uid))
    , [participantDetails, booking.guests]);
    
    const formattedDate = format(new Date(booking.date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });
    const isOrganizer = user?.uid === booking.organizerId;
    const isAdmin = currentUser?.role === 'Administrador';
    const canEdit = isOrganizer || isAdmin;
    
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
                       <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4"/> Membros ({activeParticipants?.length ?? 0})</h3>
                        {loadingParticipants ? (
                            <ul className="list-disc list-inside text-sm pl-4 space-y-1">
                                {Array.from({ length: booking.participants.length }).map((_, i) => <li key={i}><Skeleton className="h-4 w-32 inline-block" /></li>)}
                            </ul>
                        ) : (
                           <ul className="list-disc list-inside text-sm pl-4">
                               {activeParticipants?.map(p => <li key={p.uid}>{p.name}</li>)}
                           </ul>
                        )}
                   </div>
                   {guestParticipants && guestParticipants.length > 0 && (
                    <div className="space-y-2">
                       <h3 className="font-semibold">Convidados ({guestParticipants.length})</h3>
                        <ul className="list-disc list-inside text-sm pl-4">
                            {guestParticipants?.map(p => <li key={p.uid}>{p.name}</li>)}
                        </ul>
                   </div>
                   )}
                </div>
                 {canEdit && (
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

    