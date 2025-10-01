
"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"
import type { User as AppUser } from "@/lib/types/user";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "../ui/skeleton";
import { EditBookingModal } from "./dashboard/edit-booking-modal";
import { BookingDetailsModal } from "./dashboard/booking-details-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Lock } from "lucide-react/dist/esm/icons/lock";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";

interface AccordionScheduleViewProps {
    rooms: Room[];
    bookings: Booking[];
    selectedDate: Date;
    currentUser?: AppUser;
    isLoading: boolean;
}

const BOOKING_COLORS = ["bg-blue-300/70", "bg-purple-300/70", "bg-green-300/70", "bg-yellow-300/70"];


export const AccordionScheduleView = ({ rooms, bookings, selectedDate, currentUser, isLoading }: AccordionScheduleViewProps) => {
    const [user] = useAuthState(auth);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            {rooms.map((room, roomIndex) => {
                const roomBookings = bookings.filter(b => b.roomId === room.id).sort((a,b) => a.startTime.localeCompare(b.startTime));
                return (
                    <AccordionItem value={room.id} key={room.id}>
                        <AccordionTrigger>{room.name}</AccordionTrigger>
                        <AccordionContent>
                            {roomBookings.length > 0 ? (
                                <div className="space-y-2">
                                {roomBookings.map(b => {
                                    const colorClass = BOOKING_COLORS[roomIndex % BOOKING_COLORS.length];

                                    if (!currentUser) return null;
                                    
                                    const isOrganizer = b.organizerId === user?.uid;
                                    const canEdit = isOrganizer || currentUser.role === 'Administrador' || currentUser.role === 'Editor';
                                    const canView = currentUser.status !== 'Pendente' && currentUser.category !== 'Visitante';

                                    const bookingContent = (
                                        <div className={`${colorClass} p-3 rounded-md text-black/80 flex justify-between items-center transition-all hover:opacity-80 cursor-pointer`}>
                                            <div>
                                                <p className="font-bold text-sm">{b.title || 'Reserva Rápida'}</p>
                                                <p className="text-xs text-black/60">{b.startTime} - {b.endTime}</p>
                                            </div>
                                        </div>
                                    );

                                     const lockedContent = (
                                        <div className="p-3 bg-muted text-muted-foreground rounded-md flex items-center justify-between transition-all cursor-not-allowed">
                                             <div>
                                                <p className="font-bold text-sm flex items-center gap-2">
                                                    <Lock className="h-4 w-4" />
                                                    {b.title || 'Reserva'}
                                                </p>
                                                <p className="text-xs">{b.startTime} - {b.endTime}</p>
                                            </div>
                                        </div>
                                    );

                                    let modalWrapper;
                                    if (canEdit) {
                                        modalWrapper = <EditBookingModal booking={b} onOpenChange={setIsModalOpen}>{bookingContent}</EditBookingModal>;
                                    } else if (canView) {
                                        modalWrapper = <BookingDetailsModal booking={b} onOpenChange={setIsModalOpen}>{bookingContent}</BookingDetailsModal>;
                                    } else {
                                        modalWrapper = (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild><div>{lockedContent}</div></TooltipTrigger>
                                                    <TooltipContent><p>Complete seu cadastro e matrícula para ver os detalhes.</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    }
                                    
                                    return <div key={b.id}>{modalWrapper}</div>;
                                })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma reserva para esta sala no dia {format(selectedDate, 'dd/MM')}.</p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}
