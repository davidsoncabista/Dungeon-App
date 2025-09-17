
"use client"

import * as React from "react";
import { addMonths, format, startOfMonth, subMonths, startOfDay, addDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy, where } from "firebase/firestore";
import { app, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";
import type { User as AppUser } from "@/lib/types/user";
import { MonthlyCalendarView } from "@/components/app/dashboard/monthly-calendar-view";
import { TimelineView } from "@/components/app/dashboard/timeline-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ViewMode = 'day' | 'week' | 'month';

export default function OnlineSchedulePage() {
    const [user, loadingAuth] = useAuthState(auth);
    const firestore = getFirestore(app);

    const [currentDate, setCurrentDate] = React.useState(startOfDay(new Date()));
    const [viewMode, setViewMode] = React.useState<ViewMode>('day');

    // --- Firestore Data ---
    const bookingsRef = collection(firestore, 'bookings');
    const [bookings, loadingBookings] = useCollectionData<Booking>(query(bookingsRef, orderBy('startTime')), { idField: 'id' });

    const roomsRef = collection(firestore, 'rooms');
    const [rooms, loadingRooms] = useCollectionData<Room>(query(roomsRef, orderBy('name')), { idField: 'id' });

    const usersRef = collection(firestore, 'users');
    const userQuery = user ? query(usersRef, where('uid', '==', user.uid)) : null;
    const [appUserData, loadingUsers] = useCollectionData<AppUser>(userQuery);
    const currentUser = appUserData?.[0];

    const handlePrev = () => {
        if (viewMode === 'month') {
            setCurrentDate(prev => subMonths(prev, 1));
        } else if (viewMode === 'week') {
            setCurrentDate(prev => addDays(prev, -7));
        } else {
            setCurrentDate(prev => addDays(prev, -1));
        }
    };
    
    const handleNext = () => {
        if (viewMode === 'month') {
            setCurrentDate(prev => addMonths(prev, 1));
        } else if (viewMode === 'week') {
            setCurrentDate(prev => addDays(prev, 7));
        } else {
            setCurrentDate(prev => addDays(prev, 1));
        }
    };

    const handleToday = () => {
        setCurrentDate(startOfDay(new Date()));
    };
    
    const getHeaderText = () => {
        if (viewMode === 'month') {
            return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
        }
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`;
        }
        return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }

    const isLoading = loadingAuth || loadingBookings || loadingRooms || loadingUsers;

    const startOfWeek = (date: Date) => addDays(startOfDay(date), -date.getDay());
    const endOfWeek = (date: Date) => addDays(startOfWeek(date), 6);
    const weekDays = eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });

    return (
        <div className="flex flex-col h-full gap-4">
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleToday} className="h-9">Hoje</Button>
                    <Button variant="ghost" size="icon" onClick={handlePrev} className="h-9 w-9"><ChevronLeft /></Button>
                    <Button variant="ghost" size="icon" onClick={handleNext} className="h-9 w-9"><ChevronRight /></Button>
                    <h2 className="text-lg md:text-xl font-semibold font-headline capitalize text-center sm:text-left">
                       {getHeaderText()}
                    </h2>
                </div>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <TabsList>
                        <TabsTrigger value="day">Dia</TabsTrigger>
                        <TabsTrigger value="week">Semana</TabsTrigger>
                        <TabsTrigger value="month">Mês</TabsTrigger>
                    </TabsList>
                </Tabs>
            </header>

            <TabsContent value="day" className="flex-1">
                <TimelineView 
                    selectedDate={currentDate}
                    bookings={bookings}
                    rooms={rooms}
                    isLoading={isLoading}
                    currentUser={currentUser}
                />
            </TabsContent>
            <TabsContent value="week" className="space-y-8 flex-1">
                {weekDays.map(day => (
                    <div key={day.toString()}>
                        <h3 className="font-headline font-bold text-lg mb-2 capitalize">{format(day, "EEEE, dd/MM", { locale: ptBR })}</h3>
                         <TimelineView 
                            selectedDate={day}
                            bookings={bookings}
                            rooms={rooms}
                            isLoading={isLoading}
                            currentUser={currentUser}
                        />
                    </div>
                ))}
            </TabsContent>
            <TabsContent value="month" className="flex-1">
                 <MonthlyCalendarView
                    currentMonth={startOfMonth(currentDate)}
                    bookings={bookings || []}
                    rooms={rooms || []}
                    isLoading={isLoading}
                    currentUser={currentUser}
                />
            </TabsContent>
        </div>
    );
}

