"use client"

import * as React from "react";
import { addMonths, format, isSameMonth, isToday, startOfMonth, startOfWeek, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
<<<<<<< HEAD
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
=======
import { ChevronLeft, ChevronRight, PlusCircle, Plus, Lock } from "lucide-react";
>>>>>>> b93da843 (a parte de visualizar pode ser para todos exeto para visitantes ou mebro)
import { useCollectionData } from "react-firebase-hooks/firestore";
<<<<<<< HEAD
import { getFirestore, collection, query, orderBy, where, doc, setDoc } from "firebase/firestore";
=======
import { getFirestore, collection, query, orderBy, where, addDoc, serverTimestamp } from "firebase/firestore";
>>>>>>> 29a97599 (os editores podem editar as reservas)
import { app, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
=======
import { ChevronLeft, ChevronRight, PlusCircle, Plus, Lock } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy } from "firebase/firestore";
import { app, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Skeleton } from "@/components/ui/skeleton";
>>>>>>> aa2f8413 (os revisores são como os usuarios comun so editam o que os usuarios comu)
import type { Booking } from "@/lib/types/booking";
import type { Room } from "@/lib/types/room";
import type { User as AppUser } from "@/lib/types/user";
import type { Plan } from "@/lib/types/plan";
import { cn } from "@/lib/utils";
<<<<<<< HEAD
=======
import { BookingModal } from "@/components/app/dashboard/booking-modal";
import { EditBookingModal } from "@/components/app/dashboard/edit-booking-modal";
import { BookingDetailsModal } from "@/components/app/dashboard/booking-details-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

>>>>>>> b93da843 (a parte de visualizar pode ser para todos exeto para visitantes ou mebro)

const DaySkeleton = () => (
    <div className="border-t border-l p-2 h-32 md:h-40 flex flex-col">
        <span className="font-semibold"><Skeleton className="h-5 w-5 mb-2"/></span>
        <div className="space-y-1 mt-1">
            <Skeleton className="h-3 w-full"/>
            <Skeleton className="h-3 w-5/6"/>
        </div>
    </div>
)

export default function OnlineSchedulePage() {
    const [user, loadingAuth] = useAuthState(auth);
    const firestore = getFirestore(app);

    const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(new Date()));
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // --- Firestore Data ---
    const bookingsRef = collection(firestore, 'bookings');
    const [bookings, loadingBookings] = useCollectionData<Booking>(query(bookingsRef, orderBy('startTime')), { idField: 'id' });

    const roomsRef = collection(firestore, 'rooms');
    const [rooms, loadingRooms] = useCollectionData<Room>(query(roomsRef, orderBy('name')), { idField: 'id' });

    const usersRef = collection(firestore, 'users');
    const [users, loadingUsers] = useCollectionData<AppUser>(query(usersRef, orderBy('name')), { idField: 'id' });
    const currentUser = users?.find(u => u.uid === user?.uid);
    
    const plansRef = collection(firestore, 'plans');
    const [plans, loadingPlans] = useCollectionData<Plan>(plansRef, { idField: 'id' });
    const userPlan = React.useMemo(() => plans?.find(p => p.name === currentUser?.category), [plans, currentUser]);


    const handlePrevMonth = () => setCurrentMonth(prev => addMonths(prev, -1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
    const handleToday = () => setCurrentMonth(startOfMonth(new Date()));

    const daysInMonth = React.useMemo(() => {
        const start = startOfWeek(currentMonth, { weekStartsOn: 0 }); // Dom=0
        const days = [];
        let day = start;
        for (let i = 0; i < 42; i++) {
            days.push(new Date(day));
            day.setDate(day.getDate() + 1);
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

<<<<<<< HEAD
    const handleCreateBooking = async (data: Omit<Booking, 'id' | 'status'>) => {
        if (!user || !userPlan) {
            toast({ title: "Erro", description: "Você precisa estar logado e ter um plano para reservar.", variant: "destructive" });
            return;
        }

        // --- LÓGICA DE COTAS (A SER IMPLEMENTADA NA FASE 2) ---
        // const userBookings = bookings?.filter(b => b.organizerId === user.uid) || [];
        // if (userBookings.length >= userPlan.monthlyQuota) {
        //     toast({
        //         title: "Limite de Reservas Atingido",
        //         description: `Você já atingiu seu limite mensal de ${userPlan.monthlyQuota} reservas.`,
        //         variant: "destructive"
        //     });
        //     return;
        // }
        
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

=======
    const canBook = currentUser?.status === 'Ativo';

    const today = startOfDay(new Date());
    const bookingLimitDate = addDays(today, 15);
>>>>>>> aa2f8413 (os revisores são como os usuarios comun so editam o que os usuarios comu)

    const handleCreateBooking = async (data: Omit<Booking, 'id' | 'status'>) => {
      if(!user) return;
      const newBooking: Booking = {
        ...data,
        id: '', // será preenchido pelo Firestore
        organizerId: user.uid,
        status: 'Confirmada'
      };

      try {
        const newBookingRef = doc(collection(firestore, "bookings"));
        await setDoc(newBookingRef, { ...newBooking, id: newBookingRef.id });

        toast({
            title: "Reserva Confirmada!",
            description: `Sua reserva foi agendada com sucesso.`,
        });
        setIsModalOpen(false);
      } catch(error) {
        console.error("Erro ao criar reserva:", error);
        toast({
            title: "Erro!",
            description: "Não foi possível criar a reserva.",
            variant: "destructive"
        });
      }
    }

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
<<<<<<< HEAD
<<<<<<< HEAD
                     <Dialog open={isModalOpen && !selectedDate} onOpenChange={setIsModalOpen}>
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
=======
=======
>>>>>>> b93da843 (a parte de visualizar pode ser para todos exeto para visitantes ou mebro)
                     <BookingModal 
                        room={rooms?.find(r => r.status === 'Disponível')!} 
                        date={new Date()} 
                        onOpenChange={setIsModalOpen} 
                        allBookings={bookings || []} 
<<<<<<< HEAD
                        onSuccess={handleCreateBooking}
=======
>>>>>>> b93da843 (a parte de visualizar pode ser para todos exeto para visitantes ou mebro)
                    >
                        <Button disabled={!canBook}>
                            <PlusCircle className="mr-2 h-4 w-4"/>Nova Reserva
                        </Button>
                    </BookingModal>
>>>>>>> aa2f8413 (os revisores são como os usuarios comun so editam o que os usuarios comu)
                </div>
            </header>

            <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground text-sm border-b pb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 flex-1">
                {(loadingBookings || loadingRooms || loadingAuth || loadingPlans || loadingUsers) 
                    ? Array.from({length: 42}).map((_, i) => <DaySkeleton key={i}/>)
                    : daysInMonth.map(day => {
                    const dayBookings = bookingsByDay.get(format(day, 'yyyy-MM-dd')) || [];
                    const availableRooms = rooms?.filter(r => r.status === 'Disponível') ?? [];

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
                                <BookingModal room={availableRooms[0]} date={day} onOpenChange={setIsModalOpen} allBookings={bookings || []}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!canBook}>
                                        <Plus className="h-4 w-4" />
                                        <span className="sr-only">Adicionar Reserva</span>
                                    </Button>
                                </BookingModal>
                            </div>
                            <div className="flex-1 overflow-y-auto text-xs space-y-1 mt-1 pr-1">
                                {dayBookings.slice(0, 3).map(b => {
                                    const room = rooms?.find(r => r.id === b.roomId);
                                    const isOrganizer = b.organizerId === user?.uid;
                                    
                                    const canEdit = isOrganizer || isAdmin;
                                    const canView = currentUser?.status !== 'Pendente' && currentUser?.category !== 'Visitante';

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
