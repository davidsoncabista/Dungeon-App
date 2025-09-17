
"use client"

import * as React from "react";
import { format, isSameMonth, isToday, startOfWeek, isBefore, startOfDay, addDays } from "date-fns";
import { Plus, Lock } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy } from "firebase/firestore";
import { app, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";
import type { User as AppUser } from "@/lib/types/user";
import { cn } from "@/lib/utils";
import { BookingModal } from "@/components/app/dashboard/booking-modal";
import { EditBookingModal } from "@/components/app/dashboard/edit-booking-modal";
import { BookingDetailsModal } from "@/components/app/dashboard/booking-details-modal";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const DaySkeleton = () => (
    <div className="border-t border-l p-2 h-32 md:h-40 flex flex-col">
        <span className="font-semibold"><Skeleton className="h-5 w-5 mb-2"/></span>
        <div className="space-y-1 mt-1">
            <Skeleton className="h-3 w-full"/>
            <Skeleton className="h-3 w-5/6"/>
        </div>
    </div>
);

interface MonthlyCalendarViewProps {
    currentMonth: Date;
    bookings: Booking[];
    rooms: Room[];
    isLoading: boolean;
    currentUser?: AppUser;
}

export function MonthlyCalendarView({ currentMonth, bookings, rooms, isLoading, currentUser }: MonthlyCalendarViewProps) {
    const [user] = useAuthState(auth);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const daysInMonth = React.useMemo(() => {
        const start = startOfWeek(currentMonth, { weekStartsOn: 0 }); // Dom=0
        const days = [];
        for (let i = 0; i < 42; i++) {
            days.push(addDays(start, i));
        }
        return days;
    }, [currentMonth]);


    const bookingsByDay = React.useMemo(() => {
        if (!bookings) return new Map();
        return bookings.reduce((acc, booking) => {
            const date = format(new Date(booking.date + 'T00:00:00'), 'yyyy-MM-dd');
            if (!acc.has(date)) {
                acc.set(date, []);
            }
            acc.get(date)?.push(booking);
            return acc;
        }, new Map<string, Booking[]>());
    }, [bookings]);

    const canBook = currentUser?.status === 'Ativo';
    const today = startOfDay(new Date());
    const bookingLimitDate = addDays(today, 15);

    return (
        <div className="flex flex-col h-full">
             <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground text-sm border-b pb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 flex-1">
                {isLoading
                    ? Array.from({length: 42}).map((_, i) => <DaySkeleton key={i}/>)
                    : daysInMonth.map(day => {
                    const dayBookings = bookingsByDay.get(format(day, 'yyyy-MM-dd')) || [];
                    const isPastDay = isBefore(day, today);
                    const isWithinBookingLimit = !isPastDay && isBefore(day, bookingLimitDate);
                    
                    return (
                        <div 
                            key={day.toString()}
                            className={cn(
                                "border-t border-l p-1.5 h-32 md:h-40 flex flex-col relative",
                                !isSameMonth(day, currentMonth) && "bg-muted/30 text-muted-foreground",
                                isToday(day) && "bg-blue-50",
                                isPastDay && "bg-muted/50"
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <span className={cn("font-semibold text-xs md:text-sm", isToday(day) && "text-primary font-bold")}>
                                    {format(day, 'd')}
                                </span>
                                {isWithinBookingLimit && isSameMonth(day, currentMonth) && (
                                    <BookingModal initialDate={day} onOpenChange={setIsModalOpen} allBookings={bookings || []}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!canBook}>
                                            <Plus className="h-4 w-4" />
                                            <span className="sr-only">Adicionar Reserva</span>
                                        </Button>
                                    </BookingModal>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1 pr-1">
                                {dayBookings.slice(0, 3).map(b => {
                                    const room = rooms?.find(r => r.id === b.roomId);
                                    if (!currentUser || !room) return null;
                                    
                                    const isOrganizer = b.organizerId === user?.uid;
                                    const canEdit = isOrganizer || currentUser.role === 'Administrador' || currentUser.role === 'Editor';
                                    const canView = currentUser.status !== 'Pendente' && currentUser.category !== 'Visitante';

                                    if (canEdit) {
                                        return (
                                            <EditBookingModal key={b.id} booking={b} onOpenChange={setIsModalOpen}>
                                                <div className="p-1 bg-primary/20 text-primary-foreground rounded-sm truncate cursor-pointer hover:bg-primary/30">
                                                    <span className="font-semibold text-primary">{room?.name.slice(0,5)}:</span> <span className="text-primary/80">{b.title}</span>
                                                </div>
                                            </EditBookingModal>
                                        )
                                    }

                                    if(canView) {
                                        return (
                                            <BookingDetailsModal key={b.id} booking={b} onOpenChange={setIsModalOpen}>
                                                <div className="p-1 bg-secondary text-secondary-foreground rounded-sm truncate cursor-pointer hover:bg-secondary/80">
                                                    <span className="font-semibold">{room?.name.slice(0,5)}:</span> <span>{b.title}</span>
                                                </div>
                                            </BookingDetailsModal>
                                        )
                                    }

                                    // Renderização para Visitantes/Pendentes
                                    return (
                                        <TooltipProvider key={b.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="p-1 bg-muted/50 text-muted-foreground rounded-sm truncate cursor-not-allowed flex items-center gap-1">
                                                        <Lock className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{b.title}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Complete seu cadastro e matrícula para ver os detalhes.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )
                                })}
                                {dayBookings.length > 3 && (
                                    <div className="text-center text-muted-foreground font-bold text-xs">...</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

