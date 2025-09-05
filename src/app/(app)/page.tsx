"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuthenticatedUser, getBookings, getNotices, getRoomById } from "@/lib/mock-service"
import { Megaphone, CalendarCheck, Clock, Users, PlusCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const user = getAuthenticatedUser();
  const notices = getNotices();
  const allBookings = getBookings();
  const upcomingBookings = allBookings.filter(b => b.participants.some(p => p.id === user.id) && new Date(`${b.date}T${b.startTime}`) >= new Date()).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const bookingDates = allBookings.map(b => new Date(`${b.date}T00:00:00`));
  
  const [calendarSelectedDates, setCalendarSelectedDates] = useState<Date[]>(bookingDates);

  useEffect(() => {
    // Adiciona a data atual no lado do cliente para evitar erro de hidratação
    setCalendarSelectedDates(prevDates => [...prevDates, new Date()]);
  }, []); // O array vazio garante que isso rode apenas uma vez, no cliente.


  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Seja bem-vindo, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Prepare sua próxima aventura. Aqui está um resumo de suas atividades.</p>
      </div>

      {notices[0] && (
        <Alert className="bg-primary/10 border-primary/20">
          <Megaphone className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">{notices[0].title}</AlertTitle>
          <AlertDescription>
            {notices[0].description} <Link href={notices[0].link || '#'} className="font-semibold underline">Saiba mais</Link>.
          </AlertDescription>
        </Alert>
      )}


      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Minhas Próximas Reservas</CardTitle>
                <CardDescription>Suas aventuras agendadas.</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/book-room">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Reserva
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                 <div className="space-y-4">
                 {upcomingBookings.slice(0,3).map((booking) => {
                    const room = getRoomById(booking.roomId);
                    const formattedDate = format(parseISO(`${booking.date}T00:00:00`), "dd 'de' MMMM, yyyy", { locale: ptBR });
                    const totalParticipants = booking.participants.length + (booking.guests ?? 0);
                    return (
                        <div key={booking.id} className="flex items-start gap-4 rounded-lg border p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <CalendarCheck className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{room?.name}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{formattedDate}, {booking.startTime} - {booking.endTime}</span></div>
                                    <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{totalParticipants} participante(s)</span></div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm">Detalhes</Button>
                        </div>
                    )
                 })}
               </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Você não tem nenhuma reserva futura.</p>
                  <Button asChild>
                    <Link href="/book-room">Criar uma nova reserva</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Disponibilidade de Salas</CardTitle>
              <CardDescription>Veja os dias ocupados no calendário.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
            <Calendar
                mode="multiple"
                selected={calendarSelectedDates}
                className="p-0"
                classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                    day_today: "bg-accent/50 text-accent-foreground"
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
