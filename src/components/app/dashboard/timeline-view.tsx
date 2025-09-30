
"use client"

import * as React from "react";
import { format } from "date-fns";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";
import type { User as AppUser } from "@/lib/types/user";
import { ScheduleView } from "@/components/app/dashboard/schedule-view";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { BookingModal } from "@/components/app/dashboard/booking-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AccordionScheduleView } from "../accordion-schedule-view";

interface TimelineViewProps {
    selectedDate: Date;
    bookings?: Booking[];
    rooms?: Room[];
    isLoading: boolean;
    currentUser?: AppUser;
}

export function TimelineView({ selectedDate, bookings, rooms, isLoading, currentUser }: TimelineViewProps) {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const { isMobile, isHydrated } = useIsMobile();

    const canBook = currentUser?.status === 'Ativo';

    const bookingsForSelectedDate = React.useMemo(() => {
        if (!bookings) return [];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        
        const prevDateStr = format(new Date(selectedDate.getTime() - 86400000), "yyyy-MM-dd");
        
        return bookings.filter(booking => {
            const startsToday = booking.date === dateStr;
            const isOvernightFromYesterday = booking.date === prevDateStr && booking.startTime === "23:00";
            return startsToday || isOvernightFromYesterday;
        });
    }, [bookings, selectedDate]);
    
    if (isLoading || !isHydrated) {
        return (
             <div className="space-y-4">
                <div className="flex justify-end mb-4 md:hidden">
                    <Skeleton className="h-10 w-36" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        )
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
            <div className="flex justify-end mb-4 md:hidden">
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
            {isMobile ? (
                 <AccordionScheduleView 
                    rooms={availableRooms}
                    bookings={bookingsForSelectedDate}
                    selectedDate={selectedDate}
                    currentUser={currentUser}
                    isLoading={isLoading}
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

