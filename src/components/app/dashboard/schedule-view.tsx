
"use client"

import { format, parse, parseISO, isBefore, getHours, getMinutes } from "date-fns"
import { BookingDetailsModal } from "./booking-details-modal"
import { BookingModal } from "./booking-modal"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"
import type { User as AppUser } from "@/lib/types/user";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react/dist/esm/icons/lock"
import { EditBookingModal } from "./edit-booking-modal"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"


const BOOKING_COLORS = ["bg-blue-300/70", "bg-purple-300/70", "bg-green-300/70", "bg-yellow-300/70"];

interface ScheduleViewProps {
    rooms: Room[];
    bookings: Booking[];
    selectedDate: Date;
    setModalOpen: (open: boolean) => void;
    allBookings: Booking[];
    canBook: boolean | undefined;
    currentUser?: AppUser;
}

// --- Componente da Agenda (Timeline - Desktop/Landscape) ---
export const ScheduleView = ({ rooms, bookings, selectedDate, setModalOpen, allBookings, canBook, currentUser }: ScheduleViewProps) => {
    const [user] = useAuthState(auth);
    const totalHours = 24;
    const hourColumns = 4; // Cada hora tem 4 colunas (intervalos de 15 min)
    const totalColumns = totalHours * hourColumns;
    const hours = Array.from({ length: totalHours }, (_, i) => i); 

    const calculateBookingStyle = (booking: Booking) => {
        const bookingDate = parseISO(booking.date);
        const bookingDay = format(bookingDate, 'yyyy-MM-dd');
        const selectedDay = format(selectedDate, 'yyyy-MM-dd');
        
        const startTime = parse(booking.startTime, 'HH:mm', new Date());
        const endTime = parse(booking.endTime, 'HH:mm', new Date());
        
        let startHour = getHours(startTime) + getMinutes(startTime) / 60;
        let endHour = getHours(endTime) + getMinutes(endTime) / 60;

        if (bookingDay < selectedDay && endHour < startHour) {
            startHour = 0;
        }

        if (endHour < startHour && bookingDay === selectedDay) {
            endHour = 24; 
        }
        
        const startColumn = Math.floor(startHour * hourColumns) + 1;
        const endColumn = Math.floor(endHour * hourColumns) + 1;
        
        let columnSpan = endColumn - startColumn;
        if (columnSpan < 0) columnSpan = 0;

        return {
            gridColumnStart: startColumn,
            gridColumnEnd: `span ${columnSpan}`,
        };
    };

    return (
        <div className="relative overflow-hidden">
            <div className="flex sticky top-0 z-20 bg-background">
                <div className="w-32 shrink-0 pr-4 font-semibold text-right"></div>
                <div className="grid flex-1" style={{gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`}}>
                    {hours.map(hour => (
                        <div key={hour} className="text-center text-xs text-muted-foreground border-l -ml-px pt-2 col-span-4">
                            {String(hour).padStart(2, '0')}h
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 relative">
            {rooms.map((room: Room, roomIndex) => {
                const roomBookings = bookings.filter(b => b.roomId === room.id);
                
                return (
                    <div key={room.id} className="flex items-center min-h-[4rem]">
                        <div className="w-32 shrink-0 pr-4 font-semibold text-right">{room.name}</div>
                        <div className="grid flex-1 h-14 bg-muted/50 rounded-lg relative overflow-hidden" style={{gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`}}>
                            
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <BookingModal initialDate={selectedDate} onOpenChange={setModalOpen} allBookings={allBookings}>
                                            <div className="absolute inset-0 w-full h-full z-0 cursor-pointer" aria-label={`Reservar ${room.name}`} />
                                        </BookingModal>
                                    </TooltipTrigger>
                                     <TooltipContent side="top" align="center">
                                        <p>Clique para reservar um horário nesta sala.</p>
                                    </TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        
                            {roomBookings.map((b) => {
                                const style = calculateBookingStyle(b);
                                const colorClass = BOOKING_COLORS[roomIndex % BOOKING_COLORS.length];
                                
                                if (!currentUser) return null;
                                    
                                const isOrganizer = b.organizerId === user?.uid;
                                const canEdit = isOrganizer || currentUser.role === 'Administrador' || currentUser.role === 'Editor';
                                const canView = currentUser.status !== 'Pendente' && currentUser.category !== 'Visitante';
                                const bookingContent = (
                                    <div className={`h-full p-2 overflow-hidden rounded-md text-xs text-black/80 transition-all hover:opacity-80 cursor-pointer flex flex-col justify-center ${colorClass}`}>
                                        <p className="font-bold whitespace-nowrap">{b.title || 'Reserva Rápida'}</p>
                                        <p className="text-black/60 whitespace-nowrap">{b.startTime} - {b.endTime}</p>
                                    </div>
                                );
                                
                                const lockedContent = (
                                    <div className="h-full p-2 overflow-hidden rounded-md text-xs bg-muted text-muted-foreground transition-all cursor-not-allowed flex items-center justify-center gap-1">
                                        <Lock className="h-3 w-3 shrink-0" />
                                        <span className="font-bold whitespace-nowrap truncate">{b.title || 'Reserva'}</span>
                                    </div>
                                );


                                let modalWrapper;
                                if (canEdit) {
                                    modalWrapper = <EditBookingModal booking={b} onOpenChange={setModalOpen}>{bookingContent}</EditBookingModal>;
                                } else if (canView) {
                                    modalWrapper = <BookingDetailsModal booking={b} onOpenChange={setModalOpen}>{bookingContent}</BookingDetailsModal>;
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

                                return (
                                    <div key={`${b.id}-${b.date}`} style={style} className="h-full p-1 z-10">
                                       {modalWrapper}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            })}
            </div>
        </div>
    )
}
