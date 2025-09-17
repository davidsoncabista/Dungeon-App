
"use client"

import * as React from "react";
import { format, isSameDay } from "date-fns";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";
import type { User as AppUser } from "@/lib/types/user";
import { useIsMobile } from "@/hooks/use-mobile";
import { AccordionScheduleView } from "@/components/app/dashboard/accordion-schedule-view";
import { ScheduleView } from "@/components/app/dashboard/schedule-view";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { BookingModal } from "@/components/app/dashboard/booking-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface TimelineViewProps {
    selectedDate: Date;
    bookings?: Booking[];
    rooms?: Room[];
    isLoading: boolean;
    currentUser?: AppUser;
}

export function TimelineView({ selectedDate, bookings, rooms, isLoading, currentUser }: TimelineViewProps) {
    const { isMobile } = useIsMobile();
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const canBook = currentUser?.status === 'Ativo';

    const bookingsForSelectedDate = React.useMemo(() => {
        if (!bookings) return [];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        
        // Inclui reservas que começam no dia anterior e terminam neste dia (corujão)
        const prevDateStr = format(new Date(selectedDate.getTime() - 86400000), "yyyy-MM-dd");
        
        return bookings.filter(booking => {
            const startsToday = booking.date === dateStr;
            const isOvernightFromYesterday = booking.date === prevDateStr && booking.startTime === "23:00";
            return startsToday || isOvernightFromYesterday;
        });
    }, [bookings, selectedDate]);
    
    if (isLoading) {
        return <Skeleton className="h-96 w-full" />;
    }
    
    if (!rooms || rooms.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma sala de jogo foi configurada ainda.
                </CardContent>
            </Card>
        )
    }

    const availableRooms = rooms.filter(r => r.status === 'Disponível');
    
    return (
        <div>
            {isMobile && (
                 <div className="flex justify-end mb-4">
                    <BookingModal
                        initialDate={selectedDate}
                        onOpenChange={setIsModalOpen}
                        allBookings={bookings || []}
                    >
                        <Button disabled={!canBook}>
                            <PlusCircle className="mr-2 h-4 w-4" />Nova Reserva
                        </Button>
                    </BookingModal>
                </div>
            )}
            {isMobile ? (
                <AccordionScheduleView
                    rooms={availableRooms}
                    bookings={bookingsForSelectedDate}
                    selectedDate={selectedDate}
                    setModalOpen={setIsModalOpen}
                    allBookings={bookings || []}
                    canBook={canBook}
                    currentUser={currentUser}
                />
            ) : (
                <ScheduleView
                    rooms={availableRooms}
                    bookings={bookingsForSelectedDate}
                    selectedDate={selectedDate}
                    setModalOpen={setIsModalOpen}
                    allBookings={bookings || []}
                    canBook={canBook}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}
