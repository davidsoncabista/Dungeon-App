
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookings, getRooms, getUserById, deleteBooking, getRoomById } from "@/lib/mock-service"
import { Clock, Users, User, Calendar as CalendarIcon, Pencil, Info, ChevronLeft, ChevronRight, CalendarDays, ArrowUpDown, MoreHorizontal, Filter, Trash2 } from "lucide-react"
import { format, parseISO, startOfToday, parse, isBefore, addDays, subDays, isWithinInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import React, { useState, useEffect, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { NoticeModal } from "@/components/app/notice-modal"
import type { Notice } from "@/lib/types/notice"
import type { Room } from "@/lib/types/room"
import type { Booking } from "@/lib/types/booking"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRange } from "react-day-picker"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, app } from "@/lib/firebase"
import { getFirestore, collection, doc, updateDoc, arrayUnion, query } from "firebase/firestore"
import { useCollectionData } from "react-firebase-hooks/firestore"


import { BookingModal } from "@/components/app/dashboard/booking-modal"
import { EditBookingModal } from "@/components/app/dashboard/edit-booking-modal"
import { AccordionScheduleView } from "@/components/app/dashboard/accordion-schedule-view"
import { ScheduleView } from "@/components/app/dashboard/schedule-view"
import { DeleteBookingDialog } from "@/components/app/dashboard/delete-booking-dialog"


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
  const [user, loadingAuth] = useAuthState(auth);
  const { toast } = useToast();
  
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [unreadNotice, setUnreadNotice] = useState<Notice | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableBookingKey; direction: SortDirection } | null>({ key: 'date', direction: 'ascending' });
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('next15');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  // --- Firestore Data ---
  const firestore = getFirestore(app);
  const noticesRef = collection(firestore, 'notices');
  const noticesQuery = query(noticesRef);
  const [allNotices, loadingNotices, errorNotices] = useCollectionData<Notice>(noticesQuery, { idField: 'id' });

  // Handle notices
  useEffect(() => {
    if (loadingAuth || loadingNotices || !user || !allNotices) return;

    const noticesForUser = allNotices.filter(notice => 
        !notice.targetUserId || notice.targetUserId === user.uid
    );
    const firstUnread = noticesForUser.find(notice => 
        !notice.readBy?.includes(user.uid)
    );

    if(firstUnread && !modalOpen) {
        setUnreadNotice(firstUnread);
    }
  }, [user, loadingAuth, allNotices, loadingNotices, modalOpen]);

  // Load initial data (non-firestore)
  useEffect(() => {
    const allRawBookings = getBookings();
    setSelectedDate(startOfToday());
    setAllBookings(allRawBookings.sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()));
    setRooms(getRooms().filter(r => r.status === "Disponível"));
    setIsHydrated(true);
  }, []); // Dependência vazia para carregar apenas uma vez


  const handleDismissNotice = async (noticeId: string, dismissForever: boolean) => {
    if (dismissForever && user) {
        const noticeRef = doc(firestore, "notices", noticeId);
        try {
            await updateDoc(noticeRef, {
                readBy: arrayUnion(user.uid)
            });
        } catch (error) {
            console.error("Erro ao marcar aviso como lido:", error);
            toast({
                title: "Erro",
                description: "Não foi possível salvar sua preferência. O aviso pode aparecer novamente.",
                variant: "destructive"
            });
        }
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

  const handleBookingDeleted = (bookingId: string) => {
    const success = deleteBooking(bookingId);
    if(success) {
      setAllBookings(prev => prev.filter(b => b.id !== bookingId));
      toast({
        title: "Reserva Cancelada!",
        description: "A reserva foi cancelada com sucesso.",
      });
    } else {
       toast({
        title: "Erro!",
        description: "Não foi possível cancelar a reserva.",
        variant: "destructive",
      });
    }
  }
  
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
    const uniqueBookings = Array.from(new Map(combinedBookings.map(b => [b.id, b])).values());
    
    return uniqueBookings;
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
        const organizer = getUserById(b.organizerId); // This might fail as users are not in mock-service
        return {
            ...b,
            roomName: room?.name ?? 'N/A',
            organizerName: organizer?.name ?? (b.organizerId === user?.uid ? user.displayName : 'Desconhecido'),
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
  }, [bookingsForPeriod, sortConfig, user]);

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
        </div>;
    }

    return (
        <>
            <div className="hidden sm:block">
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
            </div>
            <div className="block sm:hidden">
                 <AccordionScheduleView
                    rooms={rooms}
                    bookings={bookingsForSelectedDay}
                    selectedDate={selectedDate}
                    setModalOpen={setModalOpen}
                    onBookingCreated={handleBookingCreated}
                    onBookingUpdated={handleBookingUpdated}
                />
            </div>
        </>
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

  if (loadingAuth || !user) {
    return null
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
            <h1 className="text-3xl font-bold tracking-tight font-headline">Seja bem-vindo, {user.displayName?.split(' ')[0]}!</h1>
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
                            const isAdmin = false; // Substituir pela lógica de role do usuário
                            const canEdit = user?.uid === booking.organizerId || isAdmin;

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
                                                    <DropdownMenuSeparator />
                                                     <DeleteBookingDialog onConfirm={() => handleBookingDeleted(booking.id)}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Cancelar Reserva
                                                        </DropdownMenuItem>
                                                     </DeleteBookingDialog>
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
