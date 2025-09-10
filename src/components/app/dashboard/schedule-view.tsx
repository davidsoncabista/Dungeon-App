
"use client"

import { format, parse, parseISO, isBefore } from "date-fns"
import { BookingDetailsModal } from "./booking-details-modal"
import { BookingModal } from "./booking-modal"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"

const BOOKING_COLORS = ["bg-blue-300/70", "bg-purple-300/70", "bg-green-300/70", "bg-yellow-300/70"];

// --- Componente da Agenda (Timeline - Desktop/Landscape) ---
export const ScheduleView = ({ rooms, bookings, selectedDate, setModalOpen, onBookingCreated, onBookingUpdated }: { rooms: Room[], bookings: Booking[], selectedDate: Date, setModalOpen: (open: boolean) => void, onBookingCreated: (booking: Booking) => void, onBookingUpdated: (booking: Booking) => void }) => {
    
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
        
        let startHour = startTime.getHours() + startTime.getMinutes() / 60;
        let endHour = endTime.getHours() + endTime.getMinutes() / 60;

        // Se a reserva começou no dia anterior, ela deve começar na coluna 0 da grade do dia atual
        if (bookingDay < selectedDay) {
            startHour = 0;
        }

        // Se a reserva atravessa a meia-noite e está sendo visualizada no dia em que começa
        if (isBefore(endTime, startTime) && bookingDay === selectedDay) {
            endHour = 24; // Faz a reserva terminar no final da grade
        }
        
        const startColumn = Math.floor(startHour * hourColumns) + 1;
        const endColumn = Math.floor(endHour * hourColumns) + 1;
        const columnSpan = endColumn - startColumn;

        return {
            gridColumnStart: startColumn,
            gridColumnEnd: `span ${columnSpan > 0 ? columnSpan : 0}`,
        };
    };

    return (
        <div className="relative overflow-hidden">
            {/* Header da Timeline */}
            <div className="flex sticky top-0 z-20 bg-background">
                <div className="w-32 shrink-0 pr-4 font-semibold text-right"></div> {/* Espaço para o nome da sala */}
                <div className="grid flex-1" style={{gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`}}>
                    {hours.map(hour => (
                        <div key={hour} className="text-center text-xs text-muted-foreground border-l -ml-px pt-2 col-span-4">
                            {String(hour).padStart(2, '0')}h
                        </div>
                    ))}
                </div>
            </div>

            {/* Linhas da Timeline por Sala */}
            <div className="space-y-4 relative">
            {rooms.map((room: Room, roomIndex) => {
                const roomBookings = bookings.filter(b => b.roomId === room.id);
                
                return (
                    <div key={room.id} className="flex items-center min-h-[4rem]">
                        <div className="w-32 shrink-0 pr-4 font-semibold text-right">{room.name}</div>
                        <div className="grid flex-1 h-14 bg-muted/50 rounded-lg relative overflow-hidden" style={{gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))`}}>
                            
                            <BookingModal room={room} date={selectedDate} onOpenChange={setModalOpen} onBookingCreated={onBookingCreated} allBookings={bookings}>
                                <button className="absolute inset-0 w-full h-full z-0" aria-label={`Reservar ${room.name}`}/>
                            </BookingModal>
                        
                            {roomBookings.map((booking) => {
                                const style = calculateBookingStyle(booking);
                                const colorClass = BOOKING_COLORS[roomIndex % BOOKING_COLORS.length];
                                const organizer = booking.participants.find(p => p.uid === booking.organizerId);

                                return (
                                    <div key={`${booking.id}-${booking.date}`} style={style} className="h-full p-1 z-10">
                                        <BookingDetailsModal booking={booking} allBookings={bookings} onBookingUpdated={onBookingUpdated} onOpenChange={setModalOpen}>
                                            <div className={`h-full p-2 overflow-hidden rounded-md text-xs text-black/80 transition-all hover:opacity-80 cursor-pointer flex flex-col justify-center ${colorClass}`}>
                                                <p className="font-bold whitespace-nowrap">{booking.title || organizer?.name.split(' ')[0]}</p>
                                                <p className="text-black/60 whitespace-nowrap">{booking.startTime} - {booking.endTime}</p>
                                            </div>
                                        </BookingDetailsModal>
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
