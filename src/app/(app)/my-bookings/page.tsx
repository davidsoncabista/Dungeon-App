
"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where, orderBy } from "firebase/firestore"
import { isPast, parseISO } from "date-fns"

import { auth, app } from "@/lib/firebase"
import type { Booking } from "@/lib/types/booking"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { BookingRow } from "@/components/app/my-bookings/booking-row"
import { BookMarked, ShieldAlert } from "lucide-react"

export default function MyBookingsPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const firestore = getFirestore(app);

  const bookingsRef = collection(firestore, 'bookings');
  
  // Query for bookings where the current user is a participant
  const userBookingsQuery = useMemo(() => 
    user ? query(bookingsRef, where('participants', 'array-contains', user.uid), orderBy('date', 'desc')) : null, 
  [user]);

  const [allUserBookings, loadingBookings, error] = useCollectionData<Booking>(userBookingsQuery, { idField: 'id' });

  const { upcomingBookings, pastBookings } = (bookings || []).reduce(
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
  
  // As próximas reservas devem ser em ordem crescente
  upcomingBookings.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const renderTable = (bookingList: Booking[], isLoading: boolean, error?: Error, isEmptyMessage?: string) => {
     if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-6 w-3/4" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      ));
    }
    
    if (error) {
       return (
        <TableRow>
          <TableCell colSpan={5}>
            <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                    <h4 className="font-bold text-destructive">Erro ao carregar reservas</h4>
                    <p className="text-sm text-destructive/80">Não foi possível buscar seus agendamentos. ({error.message})</p>
                </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    
    if (bookingList.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">{isEmptyMessage}</TableCell>
            </TableRow>
        )
    }

    return bookingList.map(booking => <BookingRow key={booking.id} booking={booking} />);
  }


  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Minhas Reservas</h1>
        <p className="text-muted-foreground">Acompanhe seus agendamentos e seu histórico de jogos.</p>
      </div>

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
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden sm:table-cell">Horário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTable(upcomingBookings, loadingAuth || loadingBookings, errorBookings, "Você não tem nenhuma reserva futura.")}
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
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden sm:table-cell">Horário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {renderTable(pastBookings, loadingAuth || loadingBookings, errorBookings, "Seu histórico de reservas está vazio.")}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
