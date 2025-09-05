"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { BookOpenCheck, Crown, Users, TrendingUp } from "lucide-react"
import { getBookings, getRooms, getUsers } from "@/lib/mock-service"
import type { UserCategory } from "@/lib/types/user"

// Process data for charts
const bookings = getBookings();
const users = getUsers();
const rooms = getRooms();

// 1. Total bookings by category
const bookingsByCategory = bookings.reduce((acc, booking) => {
    booking.participants.forEach(participant => {
        const category = participant.category;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category]++;
    });
    return acc;
}, {} as Record<UserCategory, number>);

const categoryChartData = [
  { category: "Player", bookings: bookingsByCategory.Player || 0, fill: "var(--color-player)" },
  { category: "Gamer", bookings: bookingsByCategory.Gamer || 0, fill: "var(--color-gamer)" },
  { category: "Master", bookings: bookingsByCategory.Master || 0, fill: "var(--color-master)" },
]

// 2. Bookings by room
const bookingsByRoom = bookings.reduce((acc, booking) => {
    const room = rooms.find(r => r.id === booking.roomId);
    if (room) {
        const roomName = room.name;
        if (!acc[roomName]) {
            acc[roomName] = 0;
        }
        acc[roomName]++;
    }
    return acc;
}, {} as Record<string, number>);


const roomColors: { [key: string]: string } = {
    "Sala Ghal-Maraz": "var(--color-ghalmaraz)",
    "Sala do Conselho": "var(--color-conselho)",
    "Arena Imperial": "var(--color-arena)",
    "Taverna do Anão": "var(--color-taverna)",
};

const roomChartData = Object.entries(bookingsByRoom).map(([room, count]) => ({
    room: room,
    bookings: count,
    fill: roomColors[room] || "var(--color-default)",
}));

// 3. Stats Cards
const totalBookings = bookings.length;
const activeUsers = users.filter(u => u.status === "Ativo").length;
const mostPopularRoom = roomChartData.reduce((prev, current) => (prev.bookings > current.bookings) ? prev : current, {room: 'N/A', bookings: 0});
const totalBookingsInPopularRoom = mostPopularRoom.bookings;
const percentageOfTotal = totalBookings > 0 ? ((totalBookingsInPopularRoom / totalBookings) * 100).toFixed(0) : 0;


const chartConfig = {
  bookings: {
    label: "Reservas",
  },
  player: {
    label: "Player",
    color: "hsl(var(--chart-2))",
  },
  gamer: {
    label: "Gamer",
    color: "hsl(var(--chart-1))",
  },
  master: {
    label: "Master",
    color: "hsl(var(--chart-3))",
  },
  ghalmaraz: { label: "Ghal-Maraz", color: "hsl(var(--chart-1))" },
  conselho: { label: "Conselho", color: "hsl(var(--chart-2))" },
  arena: { label: "Arena", color: "hsl(var(--chart-3))" },
  taverna: { label: "Taverna", color: "hsl(var(--chart-4))" },
}

export default function StatisticsPage() {
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Estatísticas</h1>
        <p className="text-muted-foreground">Análise de uso e engajamento do sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">agendamentos no total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{activeUsers}</div>
            <p className="text-xs text-muted-foreground">membros na plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sala Mais Popular</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostPopularRoom.room}</div>
            <p className="text-xs text-muted-foreground">{percentageOfTotal}% do total de reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">(valor simulado)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reservas por Categoria</CardTitle>
            <CardDescription>Total de participações por categoria de membro.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={categoryChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="bookings" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Salas Mais Usadas</CardTitle>
            <CardDescription>Distribuição de reservas pelas salas disponíveis.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-0">
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <PieChart>
                <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={roomChartData} dataKey="bookings" nameKey="room" innerRadius={50} strokeWidth={5} />
                <Legend content={({ payload }) => {
                    return (
                        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                        {payload?.map((entry, index) => (
                            <li key={`item-${index}`} className="flex items-center gap-2 text-sm">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.value}
                            </li>
                        ))}
                        </ul>
                    )
                }}/>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
