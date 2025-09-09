

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthenticatedUser, getBookings, getNotices, getRoomById, getRooms, markNoticeAsRead, createBooking, updateBooking, getUserById } from "@/lib/mock-service"
import { Clock, Users, User, Calendar as CalendarIcon, PlusCircle, Pencil, Info, ChevronLeft, ChevronRight, CalendarDays, ArrowUpDown, MoreHorizontal, Filter } from "lucide-react"
import { format, parseISO, startOfToday, parse, isBefore, addDays, subDays, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import React, { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { NoticeModal } from "@/components/app/notice-modal"
import type { Notice } from "@/lib/types/notice"
import { BookingForm } from "@/components/app/booking-form"
import { BookingEditForm } from "@/components/app/booking-edit-form"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRange } from "react-day-picker"


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

// --- Componente da Agenda ---
const ScheduleView = ({ rooms, bookings, selectedDate, setModalOpen, onBookingCreated, onBookingUpdated }: { rooms: Room[], bookings: Booking[], selectedDate: Date, setModalOpen: (open: boolean) => void, onBookingCreated: (booking: Booking) => void, onBookingUpdated: (booking: Booking) => void }) => {
    
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
                                const organizer = booking.participants.find(p => p.id === booking.organizerId);

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

type SortableBookingKey = 'title' | 'roomName' | 'organizerName' | 'date';
type SortDirection = 'ascending' | 'descending';
type DateRangePreset = 'next7' | 'next15' | 'last7' | 'custom';

const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
    { value: 'next15', label: 'Próximos 15 dias' },
    { value: 'next7', label: 'Próximos 7 dias' },
    { value: 'last7', label: 'Últimos 7 dias' },
    { value: 'custom', label: 'Período Personalizado' },
];

export default function DashboardPage() {
  const user = getAuthenticatedUser();
  const allRawNotices = getNotices();
  const allRawBookings = getBookings(); 
  
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [unreadNotice, setUnreadNotice] = useState<Notice | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableBookingKey; direction: SortDirection } | null>({ key: 'date', direction: 'ascending' });
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('next15');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();


  // Handle notices
  useEffect(() => {
    const noticesForUser = allRawNotices.filter(notice => 
        !notice.targetUserId || notice.targetUserId === user.id
    );
    const firstUnread = noticesForUser.find(notice => 
        !notice.readBy.includes(user.id)
    );
    if(firstUnread && !modalOpen) {
        setUnreadNotice(firstUnread);
    }
  }, [allRawNotices, user.id, modalOpen]);

  // Load initial data
  useEffect(() => {
    setSelectedDate(startOfToday());
    setAllBookings(allRawBookings.sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()));
    setRooms(getRooms().filter(r => r.status === "Disponível"));
    setIsHydrated(true);
  }, []); // Dependência vazia para carregar apenas uma vez


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
  
  const bookingsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    
    const selectedDay = format(selectedDate, "yyyy-MM-dd");
    const previousDay = format(subDays(selectedDate, 1), "yyyy-MM-dd");

    const todaysBookings = allBookings.filter(b => format(parseISO(b.date), "yyyy-MM-dd") === selectedDay);
    
    const overnightBookings = allBookings.filter(b => {
        const bookingDay = format(parseISO(b.date), "yyyy-MM-dd");
        const isOvernight = isBefore(parse(b.endTime, 'HH:mm', new Date()), parse(b.startTime, 'HH:mm', new Date()));
        return bookingDay === previousDay && isOvernight;
    });

    const combinedBookings = [...todaysBookings, ...overnightBookings];
    
    // Garantir que não haja duplicatas
    return Array.from(new Map(combinedBookings.map(b => [b.id, b])).values());
  }, [allBookings, selectedDate]);


  const bookingsForPeriod = useMemo(() => {
    const today = startOfToday();
    let start: Date;
    let end: Date;

    switch (dateRangePreset) {
        case 'next15':
            start = today;
            end = addDays(today, 15);
            break;
        case 'next7':
            start = today;
            end = addDays(today, 7);
            break;
        case 'last7':
            start = subDays(today, 7);
            end = today;
            break;
        case 'custom':
            start = customDateRange?.from || today;
            end = customDateRange?.to || addDays(start, 1); // Default to 1 day if 'to' is not set
            break;
        default:
             start = today;
             end = addDays(today, 15);
    }
    
    // Ensure the end date includes the entire day
    end.setHours(23, 59, 59, 999);

    return allBookings.filter(b => {
        const bookingDate = parseISO(b.date);
        return isWithinInterval(bookingDate, { start, end });
    });
  }, [allBookings, dateRangePreset, customDateRange]);


  const sortedBookings = useMemo(() => {
    const sortableItems = bookingsForPeriod.map(b => {
        const room = getRoomById(b.roomId);
        const organizer = getUserById(b.organizerId);
        return {
            ...b,
            roomName: room?.name ?? 'N/A',
            organizerName: organizer?.name ?? 'N/A',
            title: b.title || 'Reserva Rápida'
        }
    });

    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            if (sortConfig.key === 'date') {
                 const dateA = new Date(`${a.date}T${a.startTime}`);
                 const dateB = new Date(`${b.date}T${b.startTime}`);
                 return sortConfig.direction === 'ascending' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
            }

            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [bookingsForPeriod, sortConfig]);

  const requestSort = (key: SortableBookingKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  }

  const renderContent = () => {
    if (!isHydrated || !selectedDate) {
        return <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>;
    }

    return (
        <ScrollArea className="w-full whitespace-nowrap">
            <ScheduleView 
               rooms={rooms}
               bookings={bookingsForSelectedDay}
               selectedDate={selectedDate}
               setModalOpen={setModalOpen}
               onBookingCreated={handleBookingCreated}
               onBookingUpdated={handleBookingUpdated}
           />
           <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
  }

  const getSortIcon = (key: SortableBookingKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };


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
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Gerencie as reservas de salas de forma rápida e visual.
            </p>
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
                        <Button variant="outline" size="icon" onClick={() => selectedDate && setSelectedDate(subDays(selectedDate, 1))}>
                          <ChevronLeft className="h-4 w-4" />
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
                                selected={selectedDate || undefined}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                                locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                         <Button variant="outline" size="icon" onClick={() => selectedDate && setSelectedDate(addDays(selectedDate, 1))}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <div>
                        <CardTitle>Extrato de Reservas</CardTitle>
                        <CardDescription>
                            Visualize o histórico de reservas. Clique nos cabeçalhos para ordenar.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={dateRangePreset} onValueChange={(value: DateRangePreset) => setDateRangePreset(value)}>
                            <SelectTrigger className="w-full sm:w-auto">
                                <SelectValue placeholder="Selecione um período" />
                            </SelectTrigger>
                            <SelectContent>
                                {dateRangeOptions.map(option => (
                                     <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {dateRangePreset === 'custom' && (
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal sm:w-[280px]",
                                        !customDateRange && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {customDateRange?.from ? (
                                        customDateRange.to ? (
                                        <>
                                            {format(customDateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                            {format(customDateRange.to, "LLL dd, y", { locale: ptBR })}
                                        </>
                                        ) : (
                                        format(customDateRange.from, "LLL dd, y", { locale: ptBR })
                                        )
                                    ) : (
                                        <span>Selecione o intervalo</span>
                                    )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={customDateRange?.from}
                                    selected={customDateRange}
                                    onSelect={setCustomDateRange}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('title')}>
                                    Reserva
                                    {getSortIcon('title')}
                                </Button>
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                                <Button variant="ghost" onClick={() => requestSort('roomName')}>
                                    Sala
                                    {getSortIcon('roomName')}
                                </Button>
                            </TableHead>
                             <TableHead className="hidden sm:table-cell">
                                <Button variant="ghost" onClick={() => requestSort('date')}>
                                    Data e Horário
                                    {getSortIcon('date')}
                                </Button>
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">
                                <Button variant="ghost" onClick={() => requestSort('organizerName')}>
                                    Organizador
                                    {getSortIcon('organizerName')}
                                 </Button>
                            </TableHead>
                            <TableHead className="text-right">Participantes</TableHead>
                            <TableHead className="text-right">
                                <span className="sr-only">Ações</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedBookings.length > 0 ? sortedBookings.map(booking => {
                            const isOrganizer = user.id === booking.organizerId;
                            const isAdmin = user.role === 'Administrador' || user.role === 'Editor';
                            const canEdit = isOrganizer || isAdmin;

                            return (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-medium">{booking.title}</TableCell>
                                    <TableCell className="hidden md:table-cell">{booking.roomName}</TableCell>
                                     <TableCell className="hidden sm:table-cell">
                                        {format(parseISO(booking.date), "dd/MM/yy", { locale: ptBR })}
                                        <span className="text-muted-foreground ml-2">{booking.startTime}</span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{booking.organizerName}</TableCell>
                                    <TableCell className="text-right">{booking.participants.length + (booking.guests || 0)}</TableCell>
                                    <TableCell className="text-right">
                                        {canEdit && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Ações</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <EditBookingModal 
                                                        booking={booking} 
                                                        allBookings={allBookings} 
                                                        onBookingUpdated={handleBookingUpdated} 
                                                        onOpenChange={setModalOpen}
                                                    >
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                    </EditBookingModal>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Nenhuma reserva encontrada para este período.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

    </div>
  )
}

    