
"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock, PlusCircle, Users, Lock } from "lucide-react"
import { BookingDetailsModal } from "./booking-details-modal"
import { BookingModal } from "./booking-modal"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import { EditBookingModal } from "./edit-booking-modal"

const BOOKING_COLORS = ["bg-blue-300/70", "bg-purple-300/70", "bg-green-300/70", "bg-yellow-300/70"];

interface AccordionScheduleViewProps {
    rooms: Room[];
    bookings: Booking[];
    selectedDate: Date;
    setModalOpen: (open: boolean) => void;
    allBookings: Booking[];
    canBook: boolean | undefined;
    currentUser?: AppUser;
}

export const AccordionScheduleView = ({ rooms, bookings, selectedDate, setModalOpen, allBookings, canBook, currentUser }: { rooms: Room[], bookings: Booking[], selectedDate: Date, setModalOpen: (open: boolean) => void, allBookings: Booking[], canBook: boolean | undefined, currentUser?: any }) => {
    const [user] = useAuthState(auth);
    
    return (
        <Accordion type="multiple" className="w-full space-y-2">
            {rooms.map((room, roomIndex) => {
                const roomBookings = bookings.filter(b => b.roomId === room.id).sort((a,b) => a.startTime.localeCompare(b.startTime));
                const colorClass = BOOKING_COLORS[roomIndex % BOOKING_COLORS.length];

                return (
                    <AccordionItem key={room.id} value={room.id} className="border rounded-lg px-4 bg-background">
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className={cn("w-3 h-3 rounded-full", colorClass)}></div>
                                <span className="font-bold">{room.name}</span>
                                <Badge variant="outline">{roomBookings.length} reserva(s)</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4 pt-2">
                                {roomBookings.length > 0 ? (
                                    roomBookings.map(b => {
                                        if (!currentUser) return null;
                                        
                                        const isOrganizer = b.organizerId === user?.uid;
                                        const canEdit = isOrganizer || currentUser.role === 'Administrador' || currentUser.role === 'Editor';
                                        const canView = currentUser.status !== 'Pendente' && currentUser.category !== 'Visitante';

                                        const bookingContent = (
                                            <div className="p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                                                <p className="font-semibold">{b.title || 'Reserva Rápida'}</p>
                                                <p className="text-sm text-muted-foreground"><Clock className="inline h-3 w-3 mr-1"/>{b.startTime} - {b.endTime}</p>
                                                <p className="text-sm text-muted-foreground"><Users className="inline h-3 w-3 mr-1"/>{b.participants.length + (b.guests?.length || 0)} participante(s)</p>
                                            </div>
                                        );
    
                                        if (canEdit) {
                                            return (
                                                <EditBookingModal key={b.id} booking={b} onOpenChange={setModalOpen}>
                                                    {bookingContent}
                                                </EditBookingModal>
                                            )
                                        }
    
                                        if(canView) {
                                            return (
                                                <BookingDetailsModal key={b.id} booking={b} onOpenChange={setModalOpen}>
                                                    {bookingContent}
                                                </BookingDetailsModal>
                                            )
                                        }

                                        return (
                                            <TooltipProvider key={b.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="p-3 rounded-md border cursor-not-allowed bg-muted/50 text-muted-foreground flex flex-col gap-1">
                                                             <p className="font-semibold flex items-center gap-1"><Lock className="h-3 w-3 shrink-0" /> {b.title || 'Reserva'}</p>
                                                            <p className="text-sm"><Clock className="inline h-3 w-3 mr-1"/>{b.startTime} - {b.endTime}</p>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Complete seu cadastro e matrícula para ver os detalhes.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )

                                    })
                                ) : (
                                    <p className="text-sm text-center text-muted-foreground py-4">Nenhuma reserva para esta sala hoje.</p>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}
