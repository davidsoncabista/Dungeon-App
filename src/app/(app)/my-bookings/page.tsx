
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isFuture, isPast, parseISO } from "date-fns"
import { CalendarPlus, CalendarX } from "lucide-react"
import { BookingRow } from "@/components/app/my-bookings/booking-row"
import { useAuthState } from "react-firebase-hooks/auth"
import { app, auth } from "@/lib/firebase"
import { useMemo } from "react"
import type { Booking } from "@/lib/types/booking"
import { getFirestore, collection, query, where, orderBy } from "firebase/firestore"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyBookingsPage() {
  const [user, loadingAuth] = useAuthState(auth);
  
  const firestore = getFirestore(app);
  const bookingsRef = collection(firestore, 'bookings');
  
  // Query for bookings where the current user is a participant
  const userBookingsQuery = useMemo(() => 
    user ? query(bookingsRef, where('participants', 'array-contains', user.uid), orderBy('date', 'desc')) : null, 
  [user, bookingsRef]);

  const [allUserBookings, loadingBookings, error] = useCollectionData<Booking>(userBookingsQuery, { idField: 'id' });

  const { upcomingBookings, pastBookings } = useMemo(() => {
    if (!allUserBookings) {
        return { upcomingBookings: [], pastBookings: [] };
    }
    const now = new Date();
    return {
      upcomingBookings: allUserBookings.filter(b => isFuture(parseISO(`${b.date}T${b.endTime}`))).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()),
      pastBookings: allUserBookings.filter(b => isPast(parseISO(`${b.date}T${b.endTime}`))).sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()),
    }
  }, [allUserBookings]);

  const renderBookingTable = (bookings: Booking[], isLoading: boolean, emptyMessage: string) => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={5}>
            <Skeleton className="h-16 w-full" />
          </TableCell>
        </TableRow>
      ));
    }
    if (error) {
      return <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">Erro ao carregar reservas: {error.message}</TableCell></TableRow>;
    }
    if (bookings.length === 0) {
      return <TableRow><TableCell colSpan={5} className="h-24 text-center p-4 align-middle">{emptyMessage}</TableCell></TableRow>;
    }
    return bookings.map(booking => <BookingRow key={booking.id} booking={booking} />);
  };

  if (loadingAuth) {
    return (
        <div className="grid gap-8">
            <div>
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
             <Skeleton className="h-10 w-[400px]" />
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Minhas Reservas</h1>
        <p className="text-muted-foreground">Aqui está o histórico de suas aventuras, passadas e futuras.</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="upcoming">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Próximas
          </TabsTrigger>
          <TabsTrigger value="past">
            <CalendarX className="mr-2 h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Reservas Futuras</CardTitle>
              <CardDescription>Seus próximos jogos e eventos agendados.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <th className="p-4 text-left font-medium text-muted-foreground">Sala e Data</th>
                    <th className="p-4 text-left font-medium text-muted-foreground hidden md:table-cell">Horário</th>
                    <th className="p-4 text-left font-medium text-muted-foreground hidden lg:table-cell">Participantes</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-left font-medium text-muted-foreground"><span className="sr-only">Ações</span></th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderBookingTable(upcomingBookings, loadingBookings, "Você não possui nenhuma reserva futura.")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Reservas</CardTitle>
              <CardDescription>Todas as suas reservas passadas.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                  <TableRow>
                    <th className="p-4 text-left font-medium text-muted-foreground">Sala e Data</th>
                    <th className="p-4 text-left font-medium text-muted-foreground hidden md:table-cell">Horário</th>
                    <th className="p-4 text-left font-medium text-muted-foreground hidden lg:table-cell">Participantes</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-left font-medium text-muted-foreground"><span className="sr-only">Ações</span></th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderBookingTable(pastBookings, loadingBookings, "Nenhuma reserva encontrada no seu histórico.")}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

    