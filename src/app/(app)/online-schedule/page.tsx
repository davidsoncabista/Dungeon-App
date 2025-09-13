
"use client"

import * as React from "react";
import { addMonths, format, getDay, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy, where, doc, setDoc } from "firebase/firestore";
import { app, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingForm } from "@/components/app/booking-form";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";
import type { User as AppUser } from "@/lib/types/user";
import type { Plan } from "@/lib/types/plan";
import { cn } from "@/lib/utils";

const DaySkeleton = () => (
    <div className="border border-muted/50 rounded-md p-2 h-32 flex flex-col">
        <Skeleton className="h-5 w-5 mb-2"/>
        <div className="space-y-1">
            <Skeleton className="h-3 w-full"/>
            <Skeleton className="h-3 w-5/6"/>
        </div>
    </div>
)

export default function OnlineSchedulePage() {
    const { toast } = useToast();
    const [user, loadingAuth] = useAuthState(auth);
    const firestore = getFirestore(app);

    const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // --- Firestore Data ---
    const bookingsRef = collection(firestore, 'bookings');
    const [bookings, loadingBookings] = useCollectionData<Booking>(query(bookingsRef, orderBy('startTime')), { idField: 'id' });

    const roomsRef = collection(firestore, 'rooms');
    const [rooms, loadingRooms] = useCollectionData<Room>(query(roomsRef, orderBy('name')), { idField: 'id' });

    const usersRef = collection(firestore, 'users');
    const [currentUserData, loadingCurrentUser] = useCollectionData<AppUser>(user ? query(usersRef, where('uid', '==', user.uid)) : null);
    const currentUser = currentUserData?.[0];

    const plansRef = collection(firestore, 'plans');
    const [plans, loadingPlans] = useCollectionData<Plan>(plansRef, { idField: 'id' });
    const userPlan = React.useMemo(() => plans?.find(p => p.name === currentUser?.category), [plans, currentUser]);


    const handlePrevMonth = () => setCurrentMonth(prev => addMonths(prev, -1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(new Date()));

    const daysInMonth = React.useMemo(() => {
        const start = startOfWeek(currentMonth);
        const days = [];
        for (let i = 0; i < 35; i++) {
            days.push(addMonths(start, Math.floor(i/7) * 0).setDate(start.getDate() + i));
        }
        const correctedDays = days.map(d => new Date(d));
        // Ensure we get 35 or 42 days to fill the grid
        if (getDay(correctedDays[34]) !== 6) {
             for (let i = 35; i < 42; i++) {
                correctedDays.push(addMonths(start, Math.floor(i/7) * 0).setDate(start.getDate() + i));
            }
        }
        return correctedDays.map(d => new Date(d));
    }, [currentMonth]);


    const bookingsByDay = React.useMemo(() => {
        if (!bookings) return new Map();
        return bookings.reduce((acc, booking) => {
            const date = booking.date;
            if (!acc.has(date)) {
                acc.set(date, []);
            }
            acc.get(date)?.push(booking);
            return acc;
        }, new Map<string, Booking[]>());
    }, [bookings]);

    const handleCreateBooking = async (data: Omit<Booking, 'id' | 'status'>) => {
        if (!user || !userPlan) {
            toast({ title: "Erro", description: "Você precisa estar logado e ter um plano para reservar.", variant: "destructive" });
            return;
        }

        // --- LÓGICA DE COTAS (SIMPLIFICADA) ---
        const userBookings = bookings?.filter(b => b.organizerId === user.uid) || [];
        // Lógica semanal e mensal precisaria de mais detalhes (ex: startOfWeek)
        if (userBookings.length >= userPlan.monthlyQuota) {
            toast({
                title: "Limite de Reservas Atingido",
                description: `Você já atingiu seu limite mensal de ${userPlan.monthlyQuota} reservas.`,
                variant: "destructive"
            });
            return;
        }
        
        try {
            const bookingsRef = collection(firestore, "bookings");
            const newBookingRef = doc(bookingsRef);
            const newBooking: Booking = {
                ...data,
                id: newBookingRef.id,
                status: 'Confirmada',
            };
            await setDoc(newBookingRef, newBooking);
            setIsModalOpen(false);
            toast({
                title: "Reserva Confirmada!",
                description: `Sua reserva foi agendada com sucesso.`,
            });
        } catch (error) {
            console.error("Erro ao criar reserva:", error);
            toast({ title: "Erro", description: "Não foi possível criar a reserva.", variant: "destructive" });
        }
    };


    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleToday}>Hoje</Button>
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft/></Button>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight/></Button>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold font-headline capitalize">
                    {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                <div>
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4"/>Nova Reserva</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Nova Reserva</DialogTitle>
                                <DialogDescription>Selecione uma data no calendário para escolher o dia.</DialogDescription>
                            </DialogHeader>
                            <p className="text-center text-muted-foreground py-8">
                                Por favor, clique em um dia no calendário primeiro para criar uma reserva.
                            </p>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground text-sm border-b pb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 flex-1">
                {(loadingBookings || loadingRooms || loadingAuth || loadingPlans) 
                    ? Array.from({length: 35}).map((_, i) => <DaySkeleton key={i}/>)
                    : daysInMonth.map(day => {
                    const dayBookings = bookingsByDay.get(format(day, 'yyyy-MM-dd')) || [];
                    const availableRooms = rooms?.filter(r => r.status === 'Disponível') ?? [];
                    const canBook = currentUser?.status === 'Ativo';

                    return (
                        <Dialog key={day.toString()} onOpenChange={setIsModalOpen} open={isModalOpen && selectedDate?.getTime() === day.getTime()}>
                            <DialogTrigger asChild>
                                <div 
                                    className={cn(
                                        "border-t border-l p-2 h-32 md:h-40 flex flex-col cursor-pointer hover:bg-muted/50 transition-colors",
                                        !isSameMonth(day, currentMonth) && "bg-muted/30 text-muted-foreground",
                                        isToday(day) && "bg-blue-50"
                                    )}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    <span className={cn("font-semibold", isToday(day) && "text-primary font-bold")}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1">
                                        {dayBookings.slice(0, 3).map(b => {
                                            const room = rooms?.find(r => r.id === b.roomId);
                                            return (
                                                <div key={b.id} className="p-1 bg-primary/10 text-primary-foreground rounded-sm truncate">
                                                    <span className="font-semibold text-primary">{room?.name.slice(0,5)}:</span> <span className="text-primary/80">{b.title}</span>
                                                </div>
                                            )
                                        })}
                                        {dayBookings.length > 3 && (
                                            <div className="text-center text-muted-foreground font-bold">...</div>
                                        )}
                                    </div>
                                </div>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nova Reserva</DialogTitle>
                                    <DialogDescription>
                                        Agendando para {format(day, "PPP", { locale: ptBR })}
                                    </DialogDescription>
                                </DialogHeader>
                                {canBook && availableRooms.length > 0 ? (
                                     <BookingForm 
                                        room={availableRooms[0]} // Simplificado: usa a primeira sala disponível
                                        date={day}
                                        allBookings={bookings || []}
                                        onSuccess={handleCreateBooking}
                                        onCancel={() => setIsModalOpen(false)}
                                    />
                                ) : <p className="text-center text-muted-foreground py-4">
                                        { !canBook 
                                            ? "Apenas membros com status 'Ativo' podem criar reservas." 
                                            : "Nenhuma sala disponível para reserva."
                                        }
                                    </p>
                                }
                            </DialogContent>
                        </Dialog>
                    )
                })}
            </div>
        </div>
    );
}
