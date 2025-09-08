

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthenticatedUser, getBookings, getNotices, getRoomById, getRooms, markNoticeAsRead, createBooking, updateBooking } from "@/lib/mock-service"
import { Clock, Users, User, Calendar as CalendarIcon, PlusCircle, Pencil, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { format, parseISO, startOfToday, parse, addHours, differenceInMinutes, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import React, { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { NoticeModal } from "@/components/app/notice-modal"
import type { Notice } from "@/lib/types/notice"
import { BookingForm } from "@/components/app/booking-form"
import { BookingEditForm } from "@/components/app/booking-edit-form"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export const FIXED_SLOTS = ["08:00", "13:00", "18:00", "23:00"];
const BOOKING_COLORS = ["bg-blue-300/70", "bg-purple-300/70", "bg-green-300/70", "bg-yellow-300/70"];


// --- Componente de Reserva (Modal) ---
const BookingModal = ({ room, date, onOpenChange, onBookingCreated, allBookings, children }: { room: Room, date: Date, onOpenChange: (open: boolean) => void, onBookingCreated: (newBookings: Booking) => void, allBookings: Booking[], children: React.ReactNode }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    }
    
    const handleSuccess = (data: Omit<Booking, 'id' | 'status'>) => {
        const createdBooking = createBooking(data);
        
        handleOpenChange(false);
        toast({
            title: "Reserva Confirmada!",
            description: `Sua reserva para a ${room.name} foi agendada com sucesso.`,
        });
        onBookingCreated(createdBooking);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Reservar {room.name}</DialogTitle>
                    <DialogDescription>
                        Preencha as informações para agendar sua sessão.
                    </DialogDescription>
                </DialogHeader>
                <BookingForm 
                    room={room} 
                    date={date} 
                    allBookings={allBookings} 
                    onSuccess={handleSuccess}
                    onCancel={() => handleOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

// --- Componente de Edição de Reserva (Modal) ---
const EditBookingModal = ({ booking, allBookings, onBookingUpdated, onOpenChange, children }: { booking: Booking; allBookings: Booking[]; onBookingUpdated: (updatedBooking: Booking) => void; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const room = getRoomById(booking.roomId);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    };

    const handleSuccess = (data: Partial<Omit<Booking, 'id' | 'status'>>) => {
        const updatedBooking = updateBooking(booking.id, data);
        if (updatedBooking) {
            onBookingUpdated(updatedBooking);
            toast({
                title: "Reserva Atualizada!",
                description: `Sua reserva para a ${room?.name} foi modificada.`,
            });
        } else {
            toast({
                title: "Erro!",
                description: "Não foi possível atualizar a reserva.",
                variant: "destructive",
            });
        }
        handleOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Reserva</DialogTitle>
                    <DialogDescription>Modifique as informações da sua sessão para a sala {room?.name}.</DialogDescription>
                </DialogHeader>
                {room && (
                    <BookingEditForm
                        booking={booking}
                        room={room}
                        allBookings={allBookings}
                        onSuccess={handleSuccess}
                        onCancel={() => handleOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};


// --- Componente de Detalhes da Reserva (Modal) ---
const BookingDetailsModal = ({ booking, allBookings, onBookingUpdated, onOpenChange, children }: { booking: Booking, allBookings: Booking[], onBookingUpdated: (booking: Booking) => void, children: React.ReactNode, onOpenChange: (open: boolean) => void }) => {
    const room = getRoomById(booking.roomId);
    const organizer = booking.participants.find(p => p.id === booking.organizerId);
    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const user = getAuthenticatedUser();
    const isOrganizer = user.id === organizer?.id;
    const [isMyModalOpen, setIsMyModalOpen] = useState(false);

    const handleMyOpenChange = (open: boolean) => {
        setIsMyModalOpen(open);
        onOpenChange(open);
    }
    
    return (
        <Dialog open={isMyModalOpen} onOpenChange={handleMyOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{booking.title || 'Detalhes da Reserva'}</DialogTitle>
                    <DialogDescription>{room?.name} - {formattedDate}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   {booking.description && (
                     <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><Info className="h-4 w-4"/> Descrição</h3>
                       <p className="text-sm text-muted-foreground">{booking.description}</p>
                   </div>
                   )}
                   <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4"/> Horário</h3>
                       <p className="text-sm">{booking.startTime} - {booking.endTime}</p>
                   </div>
                   <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4"/> Organizador</h3>
                       <p className="text-sm">{organizer?.name}</p>
                   </div>
                   <div className="space-y-2">
                       <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4"/> Participantes ({booking.participants.length})</h3>
                       <ul className="list-disc list-inside text-sm pl-4">
                           {booking.participants.map(p => <li key={p.id}>{p.name}</li>)}
                       </ul>
                   </div>
                   {booking.guests && booking.guests > 0 ? (
                    <div className="space-y-2">
                       <h3 className="font-semibold">Convidados</h3>
                       <p className="text-sm">{booking.guests} convidado(s)</p>
                   </div>
                   ) : null}
                </div>
                 {isOrganizer && (
                    <div className="flex justify-end gap-2">
                        <EditBookingModal booking={booking} allBookings={allBookings} onBookingUpdated={onBookingUpdated} onOpenChange={setIsMyModalOpen}>
                            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                        </EditBookingModal>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// --- Componentes da Agenda ---
const DesktopSchedule = ({ rooms, bookings, selectedDate, setModalOpen, onBookingCreated, onBookingUpdated, timelineStartHour }: { rooms: Room[], bookings: Booking[], selectedDate: Date, setModalOpen: (open: boolean) => void, onBookingCreated: (booking: Booking) => void, onBookingUpdated: (booking: Booking) => void, timelineStartHour: number }) => {
    
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = (i + timelineStartHour) % 24;
        return `${String(hour).padStart(2, '0')}:00`;
    });
    
    const filteredBookings = bookings.filter(b => format(parseISO(b.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));

    const calculateBookingStyle = (startTime: string, endTime: string) => {
        const start = parse(startTime, "HH:mm", new Date());
        let end = parse(endTime, "HH:mm", new Date());

        if (isBefore(end, start)) {
            end = addHours(end, 24);
        }

        const timelineStartMinutes = timelineStartHour * 60;
        
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const minutesFromStart = (startMinutes - timelineStartMinutes + 1440) % 1440;
        const startPercent = (minutesFromStart / (24 * 60)) * 100;
        
        const durationMinutes = differenceInMinutes(end, start);
        
        const widthPercent = (durationMinutes / (24 * 60)) * 100;

        return {
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
        };
    };

    return (
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="grid gap-2 min-w-[1200px]">
                {/* Header da Timeline */}
                <div className="flex sticky top-0 z-10 bg-card">
                    <div className="w-32 shrink-0 pr-4 font-semibold text-right"></div> {/* Espaço para o nome da sala */}
                    <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${timeSlots.length}, minmax(1.5rem, 1fr))`}}>
                        {timeSlots.map(slot => (
                            <div key={slot} className="text-center text-xs text-muted-foreground border-l -ml-px pt-2">
                                {slot.split(":")[0]}h
                            </div>
                        ))}
                    </div>
                </div>

                {/* Linhas da Timeline por Sala */}
                <div className="space-y-4">
                {rooms.map((room: Room, roomIndex) => {
                    const roomBookings = filteredBookings.filter(b => b.roomId === room.id);
                    
                    return (
                        <div key={room.id} className="flex items-center min-h-[4rem]">
                            <div className="w-32 shrink-0 pr-4 font-semibold text-right">{room.name}</div>
                            <div className="grid flex-1 h-14 bg-muted/50 rounded-lg relative" style={{ gridTemplateColumns: `repeat(${timeSlots.length}, minmax(1.5rem, 1fr))`}}>
                                
                                <BookingModal room={room} date={selectedDate} onOpenChange={setModalOpen} onBookingCreated={onBookingCreated} allBookings={bookings}>
                                    <button className="absolute inset-0 w-full h-full z-0" aria-label={`Reservar ${room.name}`}/>
                                </BookingModal>
                            
                                {roomBookings.map((booking) => {
                                    const style = calculateBookingStyle(booking.startTime, booking.endTime);
                                    const colorClass = BOOKING_COLORS[roomIndex % BOOKING_COLORS.length];
                                    const organizer = booking.participants.find(p => p.id === booking.organizerId);

                                    return (
                                        <div key={booking.id} style={style} className="absolute top-0 h-full p-1 z-10">
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
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    )
}

const MobileSchedule = ({ rooms, bookings, selectedDate, setModalOpen, onBookingCreated, onBookingUpdated }: { rooms: Room[], bookings: Booking[], selectedDate: Date, setModalOpen: (open: boolean) => void, onBookingCreated: (booking: Booking) => void, onBookingUpdated: (booking: Booking) => void }) => {
    
    const filteredBookings = bookings.filter(b => format(parseISO(b.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));

    return (
        <Accordion type="single" collapsible className="w-full" >
            {rooms.map((room: Room) => {
                 const roomBookings = filteredBookings.filter(b => b.roomId === room.id);
                return (
                    <AccordionItem value={room.id} key={room.id}>
                        <AccordionTrigger>
                            {room.name}
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-2 pt-2">
                                <BookingModal room={room} date={selectedDate} onOpenChange={setModalOpen} onBookingCreated={onBookingCreated} allBookings={bookings}>
                                    <Button size="sm" className="w-full">
                                        <PlusCircle className="mr-2"/>
                                        Nova Reserva nesta Sala
                                    </Button>
                                </BookingModal>
                                {roomBookings.length > 0 ? roomBookings.map(booking => {
                                    const organizer = booking?.participants.find(p => p.id === booking.organizerId);
                                    return (
                                        <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div>
                                                <p className="font-semibold">{booking.startTime} - {booking.endTime}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Reservado por {booking.title || organizer?.name.split(" ")[0]}
                                                </p>
                                            </div>
                                            <BookingDetailsModal booking={booking} allBookings={bookings} onBookingUpdated={onBookingUpdated} onOpenChange={setModalOpen}>
                                                <Button variant="outline" size="sm">Ver</Button>
                                            </BookingDetailsModal>
                                        </div>
                                    )
                                }) : <p className="text-center text-sm text-muted-foreground py-4">Nenhuma reserva para esta sala hoje.</p>}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}

export default function DashboardPage() {
  const user = getAuthenticatedUser();
  const allNotices = getNotices();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [modalOpen, setModalOpen] = useState(false);
  const { isMobile, isHydrated } = useIsMobile();
  const [unreadNotice, setUnreadNotice] = useState<Notice | null>(null);
  const [timelineStartHour, setTimelineStartHour] = useState(7); // Início padrão 07:00

  // Carrega os dados apenas uma vez
  useEffect(() => {
    setAllBookings(getBookings());
    setRooms(getRooms().filter(r => r.status === "Disponível"));
  }, []);

  useEffect(() => {
    const noticesForUser = allNotices.filter(notice => 
        !notice.targetUserId || notice.targetUserId === user.id
    );
    const firstUnread = noticesForUser.find(notice => 
        !notice.readBy.includes(user.id)
    );
    if(firstUnread && !modalOpen) {
        setUnreadNotice(firstUnread);
    }
  }, [allNotices, user.id, modalOpen]);

  const handleDismissNotice = (noticeId: string, dismissForever: boolean) => {
    if (dismissForever) {
        markNoticeAsRead(noticeId, user.id);
    }
    setUnreadNotice(null);
  };
  
  const handleBookingCreated = (newBooking: Booking) => {
    setAllBookings(prevBookings => [...prevBookings, newBooking].sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()));
  }

  const handleBookingUpdated = (updatedBooking: Booking) => {
    setAllBookings(prevBookings => 
        prevBookings
            .map(b => b.id === updatedBooking.id ? updatedBooking : b)
            .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())
    );
  };

  const scrollTimeline = (direction: 'forward' | 'backward') => {
    setTimelineStartHour(prevHour => {
        const newHour = direction === 'forward' ? prevHour + 4 : prevHour - 4;
        // Mantém a hora dentro do ciclo de 24h
        return (newHour + 24) % 24;
    });
  }

  const renderContent = () => {
    if (!isHydrated) {
        return <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>;
    }

    if (isMobile) {
        return <MobileSchedule 
                    rooms={rooms} 
                    bookings={allBookings} 
                    selectedDate={selectedDate} 
                    setModalOpen={setModalOpen}
                    onBookingCreated={handleBookingCreated}
                    onBookingUpdated={handleBookingUpdated}
                />
    }
    
    return <DesktopSchedule 
               rooms={rooms}
               bookings={allBookings}
               selectedDate={selectedDate}
               setModalOpen={setModalOpen}
               onBookingCreated={handleBookingCreated}
               onBookingUpdated={handleBookingUpdated}
               timelineStartHour={timelineStartHour}
           />
  }

  return (
    <div className="grid gap-8">
        {unreadNotice && (
            <NoticeModal
                notice={unreadNotice}
                onDismiss={handleDismissNotice}
            />
        )}
        <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Seja bem-vindo, {user.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Gerencie as reservas de salas de forma rápida e visual.</p>
        </div>

        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Agenda de Salas</CardTitle>
                        <CardDescription>
                           Visualize a disponibilidade e faça sua reserva.
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => scrollTimeline('backward')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => scrollTimeline('forward')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal sm:w-[240px]",
                                    !selectedDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                                locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
        </Card>

    </div>
  )
}
