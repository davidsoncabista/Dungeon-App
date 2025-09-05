"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthenticatedUser, getBookings, getNotices, getRoomById, getRooms, markNoticeAsRead } from "@/lib/mock-service"
import { Clock, Users, User, Calendar as CalendarIcon, PlusCircle, Pencil, Info } from "lucide-react"
import { format, parseISO, startOfToday, parse, addDays, eachDayOfInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import React, { useMemo, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { NoticeModal } from "@/components/app/notice-modal"
import type { Notice } from "@/lib/types/notice"
import { BookingForm } from "@/components/app/booking-form"
import { useToast } from "@/hooks/use-toast"

const BOOKING_COLORS = ["bg-blue-300/70 border-blue-500", "bg-purple-300/70 border-purple-500", "bg-green-300/70 border-green-500", "bg-yellow-300/70 border-yellow-500"];
const FIXED_SLOTS = ["08:00", "13:00", "18:00", "23:00"];

// --- Helper Functions ---

const getBookingDurationAndEnd = (startTime: string): { duration: number; endTime: string } => {
    if (!startTime || typeof startTime !== 'string') {
        return { duration: 0, endTime: "" };
    }
    const start = parse(startTime, "HH:mm", new Date());
    if (isNaN(start.getTime())) {
         return { duration: 0, endTime: "" };
    }
    
    let durationHours;
    if (startTime === "23:00") {
        durationHours = 8;
    } else {
        durationHours = 4.5;
    }
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return { duration: durationHours, endTime: format(end, "HH:mm") };
};

const calculateBookingStyle = (startTime: string, duration: number) => {
    const start = parse(startTime, "HH:mm", new Date());
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const timelineStartMinutes = 7 * 60; // Timeline starts at 07:00
    
    const minutesFromStart = (startMinutes - timelineStartMinutes + 1440) % 1440;
    const startPercent = (minutesFromStart / (24 * 60)) * 100;
    
    const durationMinutes = duration * 60;
    const widthPercent = (durationMinutes / (24 * 60)) * 100;

    return {
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
    };
};

const groupConsecutiveBookings = (bookings: Booking[]) => {
    if (!bookings || bookings.length === 0) return [];

    const sortedBookings = [...bookings]
        .filter(b => b.startTime)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    if (sortedBookings.length === 0) return [];
    
    const grouped: { booking: Booking; duration: number, endTime: string, organizer: Booking['participants'][0] | undefined }[][] = [];
    let currentGroup: { booking: Booking; duration: number, endTime: string, organizer: Booking['participants'][0] | undefined }[] = [];

    for (const booking of sortedBookings) {
        if(!booking.startTime) continue;
        
        const { duration, endTime } = getBookingDurationAndEnd(booking.startTime);
        const organizer = booking.participants.find(p => p.id === booking.organizerId);

        if (currentGroup.length === 0) {
            currentGroup.push({ booking, duration, endTime, organizer });
        } else {
            const lastBookingInGroup = currentGroup[currentGroup.length - 1];
            const lastEndTime = parse(lastBookingInGroup.endTime, "HH:mm", new Date());
            const currentStartTime = parse(booking.startTime, "HH:mm", new Date());
            const timeDiffMinutes = (currentStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60);

            if (lastBookingInGroup.booking.organizerId === booking.organizerId && timeDiffMinutes <= 30) {
                 currentGroup.push({ booking, duration, endTime, organizer });
            } else {
                grouped.push(currentGroup);
                currentGroup = [{ booking, duration, endTime, organizer }];
            }
        }
    }
    if (currentGroup.length > 0) {
        grouped.push(currentGroup);
    }
    
    return grouped.map(group => {
        if (group.length === 0 || !group[0].booking.startTime) return null;
        
        const firstBooking = group[0].booking;
        const lastBooking = group[group.length - 1];
        
        if (!firstBooking.startTime || !lastBooking.startTime) return null;

        const lastBookingData = getBookingDurationAndEnd(lastBooking.startTime);
        
        const startTime = parse(firstBooking.startTime, "HH:mm", new Date());
        const endTime = parse(lastBookingData.endTime, "HH:mm", new Date());
        
        let durationMs = endTime.getTime() - startTime.getTime();
        if (durationMs < 0) {
            durationMs += 24 * 60 * 60 * 1000;
        }
        const totalDurationHours = durationMs / (1000 * 60 * 60);
        
        const slotsCovered = group.map(g => g.booking.startTime);

        return {
            id: firstBooking.id,
            organizer: group[0].organizer,
            startTime: firstBooking.startTime,
            endTime: lastBookingData.endTime,
            participants: firstBooking.participants,
            guests: firstBooking.guests,
            status: firstBooking.status,
            style: calculateBookingStyle(firstBooking.startTime, totalDurationHours),
            booking: firstBooking,
            slotsCovered,
        };
    }).filter(Boolean);
};


// --- Componente de Reserva (Modal) ---
const BookingModal = ({ room, time, date, children, onOpenChange }: { room: Room, time: string, date: Date, children: React.ReactNode, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange(open);
    }
    
    const handleSuccess = () => {
        handleOpenChange(false);
        toast({
            title: "Reserva Confirmada!",
            description: `Sua reserva para a ${room.name} foi agendada com sucesso.`,
        });
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
                    startTime={time} 
                    onSuccess={handleSuccess}
                    onCancel={() => handleOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

// --- Componente de Detalhes da Reserva (Modal) ---
const BookingDetailsModal = ({ booking, children, onOpenChange }: { booking: Booking, children: React.ReactNode, onOpenChange: (open: boolean) => void }) => {
    const room = getRoomById(booking.roomId);
    const organizer = booking.participants.find(p => p.id === booking.organizerId);
    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const user = getAuthenticatedUser();
    const isOrganizer = user.id === organizer?.id;

    return (
        <Dialog onOpenChange={onOpenChange}>
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
                        <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// --- Componentes da Agenda ---

const DesktopSchedule = ({ rooms, bookingsByRoomAndDate, selectedDate, setModalOpen }: { rooms: Room[], bookingsByRoomAndDate: Record<string, Booking[]>, selectedDate: Date, setModalOpen: (open: boolean) => void}) => {
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = (i + 7) % 24; // Start from 7 AM
        return `${String(hour).padStart(2, '0')}:00`;
    });

    return (
        <div className="grid gap-2 overflow-x-auto">
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
            {rooms.map((room: Room) => {
                const roomBookings = bookingsByRoomAndDate[room.id] || [];
                const groupedBookings = groupConsecutiveBookings(roomBookings) || [];
                const bookedSlots = new Set(groupedBookings.flatMap(g => g?.slotsCovered || []));

                return (
                    <div key={room.id} className="flex items-center min-h-[4rem]">
                        <div className="w-32 shrink-0 pr-4 font-semibold text-right">{room.name}</div>
                        <div className="grid flex-1 h-14 bg-muted/50 rounded-lg relative" style={{ gridTemplateColumns: `repeat(${timeSlots.length}, minmax(1.5rem, 1fr))`}}>
                            
                            {/* Slots Fixos para Reserva */}
                            {FIXED_SLOTS.map(slotTime => {
                                if(bookedSlots.has(slotTime)) return null;

                                const { duration } = getBookingDurationAndEnd(slotTime);
                                const slotStyle = calculateBookingStyle(slotTime, duration);
                                
                                return (
                                    <div key={`${room.id}-${slotTime}`} style={{...slotStyle}} className="absolute top-0 h-full flex items-center justify-center p-1">
                                         <BookingModal room={room} time={slotTime} date={selectedDate} onOpenChange={setModalOpen}>
                                            <Button variant="ghost" size="sm" className="h-full w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs">
                                                <PlusCircle className="h-3 w-3 mr-1"/>
                                                Reservar
                                            </Button>
                                        </BookingModal>
                                    </div>
                                )
                            })}
                            
                            {/* Reservas existentes */}
                            {groupedBookings.map((group, index) => {
                                if (!group) return null;
                                const colorClass = BOOKING_COLORS[index % BOOKING_COLORS.length];
                               
                                return (
                                    <div key={group.id} style={{...group.style}} className="absolute top-0 h-full p-1">
                                        <BookingDetailsModal booking={group.booking} onOpenChange={setModalOpen}>
                                            <div className={`h-full p-2 overflow-hidden rounded-md text-xs text-black/80 transition-all hover:opacity-80 cursor-pointer flex flex-col justify-center ${colorClass}`}>
                                                <p className="font-bold whitespace-nowrap">{group.booking.title || group.organizer?.name.split(' ')[0]}</p>
                                                <p className="text-black/60 whitespace-nowrap">{group.startTime} - {group.endTime}</p>
                                            </div>
                                        </BookingDetailsModal>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
            </div>
        </div>
    )
}

const MobileSchedule = ({ rooms, bookingsByRoom, days, setModalOpen, view }: { rooms: Room[], bookingsByRoom: Record<string, Booking[]>, days: Date[], setModalOpen: (open: boolean) => void, view: 'day' | 'week' | 'fortnight' }) => {
    
    if (view === 'day' && days.length > 0) {
        const selectedDate = days[0];
        const bookingsForDay = Object.keys(bookingsByRoom).reduce((acc, roomId) => {
            acc[roomId] = (bookingsByRoom[roomId] || []).filter(b => isSameDay(parseISO(b.date), selectedDate));
            return acc;
        }, {} as Record<string, Booking[]>);
        
        return (
            <div className="space-y-4">
                {rooms.map((room: Room) => {
                    const roomBookings = bookingsForDay[room.id] || [];
                    return (
                        <Card key={room.id}>
                            <CardHeader>
                                <CardTitle>{room.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {FIXED_SLOTS.map(slotTime => {
                                    const booking = roomBookings.find(b => b.startTime === slotTime);
                                    const { endTime } = getBookingDurationAndEnd(slotTime);
                                    const organizer = booking?.participants.find(p => p.id === booking.organizerId);

                                    return (
                                        <div key={slotTime} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div>
                                                <p className="font-semibold">{slotTime} - {endTime}</p>
                                                {booking && organizer ? (
                                                    <p className="text-sm text-muted-foreground">
                                                    Reservado por {booking.title || organizer.name.split(" ")[0]}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-green-600">Disponível</p>
                                                )}
                                            </div>
                                            {booking ? (
                                                <BookingDetailsModal booking={booking} onOpenChange={setModalOpen}>
                                                    <Button variant="outline" size="sm">Ver</Button>
                                                </BookingDetailsModal>
                                            ) : (
                                                <BookingModal room={room} time={slotTime} date={selectedDate} onOpenChange={setModalOpen}>
                                                    <Button size="sm">Reservar</Button>
                                                </BookingModal>
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        )
    }

    return (
        <Accordion type="single" collapsible className="w-full" defaultValue={days.length > 0 ? `day-${format(days[0], 'yyyy-MM-dd')}` : undefined}>
            {days.map(day => {
                 const bookingsForDay = Object.keys(bookingsByRoom).reduce((acc, roomId) => {
                    acc[roomId] = (bookingsByRoom[roomId] || []).filter(b => isSameDay(parseISO(b.date), day));
                    return acc;
                }, {} as Record<string, Booking[]>);
                const totalBookingsForDay = Object.values(bookingsForDay).flat().length;

                return (
                    <AccordionItem value={`day-${format(day, 'yyyy-MM-dd')}`} key={day.toISOString()}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                                <span>{format(day, "EEEE, dd/MM", { locale: ptBR })}</span>
                                <span className="text-muted-foreground text-sm">{totalBookingsForDay} reservas</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-4 pl-4 border-l-2 ml-2">
                                {rooms.map((room: Room) => {
                                    const roomBookings = bookingsForDay[room.id] || [];
                                    return (
                                        <div key={room.id} className="pt-2">
                                            <h4 className="font-semibold mb-2">{room.name}</h4>
                                            <div className="space-y-2">
                                            {FIXED_SLOTS.map(slotTime => {
                                                const booking = roomBookings.find(b => b.startTime === slotTime);
                                                const { endTime } = getBookingDurationAndEnd(slotTime);
                                                const organizer = booking?.participants.find(p => p.id === booking.organizerId);

                                                return (
                                                    <div key={slotTime} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                                        <div>
                                                            <p className="font-semibold text-sm">{slotTime} - {endTime}</p>
                                                            {booking && organizer ? (
                                                                <p className="text-xs text-muted-foreground">
                                                                Reservado por {booking.title || organizer.name.split(" ")[0]}
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs text-green-600">Disponível</p>
                                                            )}
                                                        </div>
                                                        {booking ? (
                                                            <BookingDetailsModal booking={booking} onOpenChange={setModalOpen}>
                                                                <Button variant="outline" size="sm">Ver</Button>
                                                            </BookingDetailsModal>
                                                        ) : (
                                                            <BookingModal room={room} time={slotTime} date={day} onOpenChange={setModalOpen}>
                                                                <Button size="sm">Reservar</Button>
                                                            </BookingModal>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                            </div>
                                        </div>
                                    )
                                })}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}

const WeekSchedule = ({ rooms, bookingsByRoom, weekDays, setModalOpen }: { rooms: Room[], bookingsByRoom: Record<string, Booking[]>, weekDays: Date[], setModalOpen: (open: boolean) => void }) => {
    return (
        <div className="grid gap-2 overflow-x-auto">
            {/* Header da Semana */}
            <div className="flex sticky top-0 z-10 bg-card">
                <div className="w-32 shrink-0 pr-4"></div> {/* Espaço para nomes de sala */}
                <div className="grid flex-1 grid-cols-7">
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="text-center font-semibold p-2 border-l">
                            <p className="text-sm capitalize">{format(day, 'E', { locale: ptBR })}</p>
                            <p>{format(day, 'dd/MM')}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Linhas por Sala */}
            <div className="space-y-2">
                {rooms.map((room, roomIndex) => (
                    <div key={room.id} className="flex">
                        <div className="w-32 shrink-0 pr-4 font-semibold text-right self-center">{room.name}</div>
                        <div className="grid flex-1 grid-cols-7 border-t border-b divide-x">
                            {weekDays.map((day) => {
                                const dayBookings = (bookingsByRoom[room.id] || []).filter(b => isSameDay(parseISO(b.date), day));
                                const groupedBookings = groupConsecutiveBookings(dayBookings);
                                
                                const slotMap = new Map();
                                if(groupedBookings) {
                                  for (const group of groupedBookings) {
                                      if (group && group.slotsCovered) {
                                          for (const slot of group.slotsCovered) {
                                              slotMap.set(slot, group);
                                          }
                                      }
                                  }
                                }

                                return (
                                    <div key={day.toISOString()} className="min-h-[5rem] p-1 space-y-1 bg-muted/30 hover:bg-muted/60 transition-colors relative">
                                        <div className="grid grid-cols-2 gap-1 h-full">
                                            {FIXED_SLOTS.map((slotTime) => {
                                                const group = slotMap.get(slotTime);
                                                
                                                if (group && group.startTime === slotTime) {
                                                    const colorClass = BOOKING_COLORS[roomIndex % BOOKING_COLORS.length];
                                                    const slotSpan = group.slotsCovered.length === 1 ? 'col-span-1' : group.slotsCovered.length === 2 ? 'col-span-2' : 'col-span-full';
                                                    
                                                    return (
                                                        <div key={group.id} className={cn(slotSpan)}>
                                                            <BookingDetailsModal booking={group.booking} onOpenChange={setModalOpen}>
                                                                <div className={cn("rounded-sm cursor-pointer h-full text-white text-[10px] p-1 flex items-center justify-center text-center", colorClass)} title={`${group.booking.title || 'Reserva'} - ${group.startTime}`}>
                                                                    <span>{group.booking.title || group.organizer?.name.split(" ")[0]}</span>
                                                                </div>
                                                            </BookingDetailsModal>
                                                        </div>
                                                    );
                                                }
                                                
                                                if (slotMap.has(slotTime)) { // Slot is booked but not the start of a group
                                                    return null;
                                                }

                                                // This slot is available
                                                return (
                                                    <BookingModal key={slotTime} room={room} time={slotTime} date={day} onOpenChange={setModalOpen}>
                                                        <div className="rounded-sm bg-primary/10 hover:bg-primary/20 cursor-pointer h-full flex items-center justify-center" title={`Reservar ${slotTime}`}>
                                                            <PlusCircle className="h-3 w-3 text-primary" />
                                                            <span className="sr-only">Reservar</span>
                                                        </div>
                                                    </BookingModal>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default function DashboardPage() {
  const user = getAuthenticatedUser();
  const allNotices = getNotices();
  const allBookings = getBookings();
  const rooms = getRooms().filter(r => r.status === "Disponível");
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'fortnight'>('day');
  const isMobile = useIsMobile();

  const [unreadNotice, setUnreadNotice] = useState<Notice | null>(null);

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


  const viewDays = useMemo(() => {
    const daysCount = view === 'week' ? 7 : view === 'fortnight' ? 15 : 1;
    return eachDayOfInterval({ start: selectedDate, end: addDays(selectedDate, daysCount - 1) });
  }, [selectedDate, view]);


  const bookingsByRoom = useMemo(() => {
    const bookingsInView = allBookings.filter(booking => {
        const bookingDate = parseISO(booking.date);
        return viewDays.some(viewDay => isSameDay(bookingDate, viewDay));
    });

    return bookingsInView.reduce((acc, booking) => {
        if (!acc[booking.roomId]) {
            acc[booking.roomId] = [];
        }
        acc[booking.roomId].push(booking);
        return acc;
    }, {} as Record<string, Booking[]>);
  }, [allBookings, viewDays]);


  const dailyBookingsByRoomAndDate = useMemo(() => {
      return allBookings.reduce((acc, booking) => {
        if (!booking.date) return acc;
        const bookingDate = parseISO(booking.date);
        if (isSameDay(bookingDate, selectedDate)) {
            if (!acc[booking.roomId]) {
                acc[booking.roomId] = [];
            }
            acc[booking.roomId].push(booking);
        }
        return acc;
    }, {} as Record<string, Booking[]>);
  }, [allBookings, selectedDate])

  const renderContent = () => {
    if (isMobile) {
        return <MobileSchedule rooms={rooms} bookingsByRoom={bookingsByRoom} days={viewDays} setModalOpen={setModalOpen} view={view} />
    }

    if (view === 'day') {
        return <DesktopSchedule 
                   rooms={rooms}
                   bookingsByRoomAndDate={dailyBookingsByRoomAndDate}
                   selectedDate={selectedDate}
                   setModalOpen={setModalOpen}
               />
    }

    return <WeekSchedule 
            rooms={rooms}
            bookingsByRoom={bookingsByRoom}
            weekDays={viewDays}
            setModalOpen={setModalOpen}
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
                            Alterne entre as visões de Dia, Semana e Quinzena.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2">
                        <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'fortnight')} className="w-full sm:w-auto">
                            <TabsList className="w-full">
                                <TabsTrigger value="day" className="w-full">Dia</TabsTrigger>
                                <TabsTrigger value="week" className="w-full">Semana</TabsTrigger>
                                <TabsTrigger value="fortnight" className="w-full">Quinzena</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
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
                <Tabs value={isMobile ? view : 'desktop-view-wrapper'}>
                    <TabsContent value={view} forceMount>
                        {renderContent()}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

    </div>
  )
}

    
