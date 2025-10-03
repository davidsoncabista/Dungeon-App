"use client"

import { useMemo, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where, orderBy } from "firebase/firestore"
import { isPast, parseISO, setDate, addMonths, subMonths, isWithinInterval, format, parse } from "date-fns"
import { ptBR } from 'date-fns/locale';

import { auth, app } from "@/lib/firebase"
import type { Booking } from "@/lib/types/booking"
import type { User } from "@/lib/types/user"
import type { Plan } from "@/lib/types/plan"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingRow } from "@/components/app/my-bookings/booking-row"
import { BookMarked, ShieldAlert, TrendingUp, Users, Moon, ArrowUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SortKey = "date" | "participants";

export default function MyBookingsPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const firestore = getFirestore(app);
  
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');


  // --- Data Fetching ---
  const bookingsRef = collection(firestore, 'bookings');
  
  // Busca 1: Reservas como participante
  const participantBookingsQuery = user 
    ? query(bookingsRef, where('participants', 'array-contains', user.uid), orderBy('date', 'desc'))
    : null;
  const [participantBookings, loadingParticipantBookings, errorParticipantBookings] = useCollectionData<Booking>(participantBookingsQuery, { idField: 'id' });

  // Busca 2: Reservas como convidado (guest)
  const guestBookingsQuery = user
    ? query(bookingsRef, where('guests', 'array-contains', user.uid), orderBy('date', 'desc'))
    : null;
  const [guestBookings, loadingGuestBookings, errorGuestBookings] = useCollectionData<Booking>(guestBookingsQuery, { idField: 'id' });
  
  // Combina e deduplica os resultados
  const bookings = useMemo(() => {
    if (!participantBookings && !guestBookings) return [];
    
    const allBookings = [
      ...(participantBookings || []),
      ...(guestBookings || [])
    ];
    
    // Remove duplicatas usando um Map pelo ID da reserva
    const uniqueBookings = Array.from(new Map(allBookings.map(b => [b.id, b])).values());
    
    return uniqueBookings;
  }, [participantBookings, guestBookings]);
  
  const loadingBookings = loadingParticipantBookings || loadingGuestBookings;
  const errorBookings = errorParticipantBookings || errorGuestBookings;

  const usersRef = collection(firestore, 'users');
  const userQuery = user ? query(usersRef, where('uid', '==', user.uid)) : null;
  const [appUser, loadingUser, errorUser] = useCollectionData<User>(userQuery);
  const currentUser = appUser?.[0];

  const plansRef = collection(firestore, 'plans');
  const [plans, loadingPlans, errorPlans] = useCollectionData<Plan>(plansRef, { idField: 'id' });
  const userPlan = useMemo(() => plans?.find(p => p.name === currentUser?.category), [plans, currentUser]);


  // --- Logic for Upcoming and Past Bookings ---
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const filteredBookings = (bookings || []).filter(b => 
        b.title && b.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allBookings = filteredBookings.reduce(
        (acc, booking) => {
          const bookingDate = parseISO(`${booking.date}T${booking.endTime}`);
          if (isPast(bookingDate)) {
            acc.pastBookings.push(booking);
          } else {
            acc.upcomingBookings.push(booking);
          }
          return acc;
        },
        { upcomingBookings: [] as Booking[], pastBookings: [] as Booking[] }
    );
    
    const sortFunction = (a: Booking, b: Booking) => {
        let comparison = 0;
        if (sortKey === 'date') {
            comparison = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
        } else { // sort by participants
            const countA = (a.participants?.length || 0) + (a.guests?.length || 0);
            const countB = (b.participants?.length || 0) + (b.guests?.length || 0);
            comparison = countA - countB;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    };
    
    allBookings.upcomingBookings.sort(sortFunction);
    allBookings.pastBookings.sort(sortFunction);

    return allBookings;

  }, [bookings, sortKey, sortOrder, searchTerm]);
  
  
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('asc');
    }
  }

  // --- Quota Calculation Logic ---
  const { 
    usedMonthlyQuota, totalMonthlyQuota,
    usedCorujaoQuota, totalCorujaoQuota,
    usedInvitesQuota, totalInvitesQuota,
    nextRenewalDate 
  } = useMemo(() => {
    if (!userPlan || !bookings || !user) {
      return { 
        usedMonthlyQuota: 0, totalMonthlyQuota: 0, 
        usedCorujaoQuota: 0, totalCorujaoQuota: 0,
        usedInvitesQuota: 0, totalInvitesQuota: 0,
        nextRenewalDate: null 
      };
    }

    const today = new Date();
    const renewalDay = 15; 
    
    let cycleStart: Date;
    let cycleEnd: Date;
    let renewalDate: Date;

    if (today.getDate() < renewalDay) {
      cycleStart = setDate(subMonths(today, 1), renewalDay);
      cycleEnd = setDate(today, renewalDay - 1);
      renewalDate = setDate(today, renewalDay);
    } else {
      cycleStart = setDate(today, renewalDay);
      cycleEnd = setDate(addMonths(today, 1), renewalDay - 1);
      renewalDate = setDate(addMonths(today, 1), renewalDay);
    }

    const bookingsInCycle = bookings.filter(b => {
      // Filtra apenas as reservas organizadas pelo usuário para contar nas cotas
      if (b.organizerId !== user.uid) return false;
      
      const bookingDate = parse(b.date, 'yyyy-MM-dd', new Date());
      return isWithinInterval(bookingDate, { start: cycleStart, end: cycleEnd });
    });
    
    const monthlyUsed = bookingsInCycle.length;
    const corujaoUsed = bookingsInCycle.filter(b => b.startTime === '23:00').length;
    const invitesUsed = bookingsInCycle.reduce((acc, b) => acc + (b.guests?.length || 0), 0);
    
    return {
      usedMonthlyQuota: monthlyUsed,
      totalMonthlyQuota: userPlan.monthlyQuota,
      usedCorujaoQuota: corujaoUsed,
      totalCorujaoQuota: userPlan.corujaoQuota,
      usedInvitesQuota: invitesUsed,
      totalInvitesQuota: userPlan.invites,
      nextRenewalDate: format(renewalDate, "dd 'de' MMMM", { locale: ptBR })
    };

  }, [userPlan, bookings, user]);

  const anyError = errorBookings || errorUser || errorPlans;

  const renderTable = (bookingList: Booking[], isLoading: boolean, isEmptyMessage?: string) => {
     if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ));
    }
    
    if (anyError) {
       return (
        <TableRow>
          <TableCell colSpan={5}>
            <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                    <h4 className="font-bold text-destructive">Erro de Permissão</h4>
                    <p className="text-sm text-destructive/80">Você não tem permissão para ver estes dados.</p>
                </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    
    if (bookingList.length === 0) {
        const finalMessage = searchTerm 
            ? "Nenhuma reserva encontrada com este título."
            : isEmptyMessage;

        return (
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">{finalMessage}</TableCell>
            </TableRow>
        )
    }

    return bookingList.map(booking => <BookingRow key={booking.id} booking={booking} />);
  }
  
  const isLoading = loadingAuth || loadingUser || loadingPlans || loadingBookings;
  const isVisitor = currentUser?.category === 'Visitante';


  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Minhas Reservas</h1>
        <p className="text-muted-foreground break-words">Acompanhe seus agendamentos e seu histórico de jogos.</p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar reserva por título..."
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

       {!isVisitor && (
         <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Minhas Cotas de Uso
            </CardTitle>
            <CardDescription>
                Sua contagem para o ciclo atual.
                {nextRenewalDate && ` A cota reinicia em ${nextRenewalDate}.`}
            </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="flex items-center gap-6">
                <Skeleton className="h-16 w-32" />
                <Skeleton className="h-16 w-32" />
                <Skeleton className="h-16 w-32" />
                </div>
            ) : anyError ? (
                 <div className="p-4 text-sm text-destructive">Não foi possível carregar os dados de cotas.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold">{totalMonthlyQuota > 0 ? Math.max(0, totalMonthlyQuota - usedMonthlyQuota) : '∞'}</span>
                        <span className="text-xl text-muted-foreground font-medium">/{totalMonthlyQuota > 0 ? totalMonthlyQuota : '∞'}</span>
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">Reservas Mensais</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="flex items-center gap-2">
                        <Moon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold">{totalCorujaoQuota > 0 ? Math.max(0, totalCorujaoQuota - usedCorujaoQuota) : '0'}</span>
                            <span className="text-xl text-muted-foreground font-medium">/{totalCorujaoQuota > 0 ? totalCorujaoQuota : '0'}</span>
                        </div>
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">Cotas Corujão</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold">{totalInvitesQuota > 0 ? Math.max(0, totalInvitesQuota - usedInvitesQuota) : '0'}</span>
                            <span className="text-xl text-muted-foreground font-medium">/{totalInvitesQuota > 0 ? totalInvitesQuota : '0'}</span>
                        </div>
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">Convidados no Mês</span>
                </div>
                </div>
            )}
            </CardContent>
        </Card>
       )}

      <Card>
        <CardHeader>
          <CardTitle>Próximas Reservas</CardTitle>
          <CardDescription>Suas reservas agendadas que ainda não aconteceram.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sessão / Sala</TableHead>
                <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => handleSort('date')} className="px-0">
                        Data <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">Horário</TableHead>
                <TableHead>
                     <Button variant="ghost" onClick={() => handleSort('participants')} className="px-0">
                        Participantes <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTable(upcomingBookings, isLoading, isVisitor && upcomingBookings.length === 0 ? "Nenhuma reserva à vista. Como membro, você pode criar suas próprias sessões ou aguardar um convite para participar de uma aventura!" : "Você não tem nenhuma reserva futura.")}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reservas</CardTitle>
          <CardDescription>Suas reservas que já foram concluídas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sessão / Sala</TableHead>
                 <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => handleSort('date')} className="px-0">
                        Data <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">Horário</TableHead>
                 <TableHead>
                     <Button variant="ghost" onClick={() => handleSort('participants')} className="px-0">
                        Participantes <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {renderTable(pastBookings, isLoading, "Seu histórico de reservas está vazio.")}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
