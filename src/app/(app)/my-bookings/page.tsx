
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthenticatedUser, getBookings } from "@/lib/mock-service"
import { isFuture, isPast } from "date-fns"
import { CalendarPlus, CalendarX } from "lucide-react"
import { BookingRow } from "@/components/app/my-bookings/booking-row"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import { useEffect, useState } from "react"
import type { Booking } from "@/lib/types/booking"

export default function MyBookingsPage() {
  const [user] = useAuthState(auth);
  const [allUserBookings, setAllUserBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  
  useEffect(() => {
    if(user) {
      const bookings = getBookings()
        .filter(b => b.participants.some(p => p.uid === user.uid))
        .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());
      
      setAllUserBookings(bookings);
      setUpcomingBookings(bookings.filter(b => isFuture(new Date(`${b.date}T${b.startTime}`))));
      setPastBookings(bookings.filter(b => isPast(new Date(`${b.date}T${b.startTime}`))));
    }
  }, [user]);

  if (!user) {
    // Pode mostrar um loader ou uma mensagem
    return <div>Carregando suas reservas...</div>;
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
                  {upcomingBookings.length > 0 ? (
                    upcomingBookings.map(booking => <BookingRow key={booking.id} booking={booking} />)
                  ) : (
                    <TableRow>
                      <td colSpan={5} className="h-24 text-center p-4 align-middle">
                        Você não possui nenhuma reserva futura.
                      </td>
                    </TableRow>
                  )}
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
                  {pastBookings.length > 0 ? (
                    pastBookings.map(booking => <BookingRow key={booking.id} booking={booking} />)
                  ) : (
                    <TableRow>
                      <td colSpan={5} className="h-24 text-center p-4 align-middle">
                        Nenhuma reserva encontrada no seu histórico.
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
