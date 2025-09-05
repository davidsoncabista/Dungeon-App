import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthenticatedUser, getBookings, getRoomById } from "@/lib/mock-service"
import { format, parseISO, isFuture, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarPlus, CalendarX, Clock, Users, Eye } from "lucide-react"

export default function MyBookingsPage() {
  const user = getAuthenticatedUser()
  const allUserBookings = getBookings()
    .filter(b => b.participants.some(p => p.id === user.id))
    .sort((a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime());

  const upcomingBookings = allUserBookings.filter(b => isFuture(new Date(`${b.date}T${b.startTime}`)));
  const pastBookings = allUserBookings.filter(b => isPast(new Date(`${b.date}T${b.startTime}`)));

  const BookingRow = ({ booking }: { booking: typeof allUserBookings[0] }) => {
    const room = getRoomById(booking.roomId);
    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
    const totalParticipants = booking.participants.length + (booking.guests ?? 0);
    
    const statusVariant: { [key: string]: "secondary" | "destructive" | "outline" } = {
        'Confirmada': 'secondary',
        'Cancelada': 'destructive',
        'Pendente': 'outline'
    }

    return (
      <TableRow>
        <TableCell>
            <div className="font-medium">{room?.name}</div>
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground"/>
                <span>{booking.startTime} - {booking.endTime}</span>
            </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground"/>
                <span>{totalParticipants} participante(s)</span>
            </div>
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant[booking.status] || 'default'} className={booking.status === 'Confirmada' ? 'bg-green-100 text-green-800' : ''}>
            {booking.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Detalhes
          </Button>
        </TableCell>
      </TableRow>
    );
  };
  
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
                    <TableHead>Sala e Data</TableHead>
                    <TableHead className="hidden md:table-cell">Horário</TableHead>
                    <TableHead className="hidden lg:table-cell">Participantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingBookings.length > 0 ? (
                    upcomingBookings.map(booking => <BookingRow key={booking.id} booking={booking} />)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Você não possui nenhuma reserva futura.
                      </TableCell>
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
                  <TableHead>Sala e Data</TableHead>
                    <TableHead className="hidden md:table-cell">Horário</TableHead>
                    <TableHead className="hidden lg:table-cell">Participantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastBookings.length > 0 ? (
                    pastBookings.map(booking => <BookingRow key={booking.id} booking={booking} />)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nenhuma reserva encontrada no seu histórico.
                      </TableCell>
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
