
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { BookOpenCheck, Crown, Users, TrendingUp, UserCheck, UserX } from "lucide-react"
import type { UserCategory, User as AppUser } from "@/lib/types/user"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"

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
  const firestore = getFirestore(app);
  
  // --- Firestore Data ---
  const [users, loadingUsers] = useCollectionData<AppUser>(query(collection(firestore, 'users'), orderBy('name')), { idField: 'id' });
  const [bookings, loadingBookings] = useCollectionData<Booking>(query(collection(firestore, 'bookings')), { idField: 'id' });
  const [rooms, loadingRooms] = useCollectionData<Room>(query(collection(firestore, 'rooms')), { idField: 'id' });

  // --- Memoized Data Processing ---
  const { 
    categoryChartData, 
    roomChartData,
    totalBookings,
    mostPopularRoom,
    percentageOfTotal,
    activeMembers,
    inactiveOrVisitors
  } = useMemo(() => {
    // Return empty state if data is not ready
    if (!users || !bookings || !rooms) {
        return {
            categoryChartData: [],
            roomChartData: [],
            totalBookings: 0,
            mostPopularRoom: { room: 'N/A', bookings: 0 },
            percentageOfTotal: '0',
            activeMembers: [],
            inactiveOrVisitors: []
        };
    }

    // 1. Total bookings by category
    const bookingsByCategory = bookings.reduce((acc, booking) => {
        const participantUsers = booking.participants.map(uid => users?.find(u => u.uid === uid)).filter(Boolean) as AppUser[];
        participantUsers.forEach(participant => {
            const category = participant.category;
            if (category !== 'Visitante') {
                if (!acc[category]) {
                    acc[category] = 0;
                }
                acc[category]++;
            }
        });
        return acc;
    }, {} as Record<UserCategory, number>);

    const categoryData = [
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

    const roomData = Object.entries(bookingsByRoom).map(([room, count]) => ({
        room: room,
        bookings: count,
        fill: roomColors[room] || "var(--color-default)",
    }));
    
    // 3. Stats Cards
    const totalBookingsCount = bookings.length;
    const popularRoom = roomData.length > 0 ? roomData.reduce((prev, current) => (prev.bookings > current.bookings) ? prev : current) : {room: 'N/A', bookings: 0};
    const totalBookingsInPopularRoom = popularRoom.bookings;
    const percent = totalBookingsCount > 0 ? ((totalBookingsInPopularRoom / totalBookingsCount) * 100).toFixed(0) : 0;
    
    // 4. User lists
    const active = users?.filter(u => u.status === 'Ativo' && u.category !== 'Visitante') || [];
    const inactive = users?.filter(u => u.status !== 'Ativo' || u.category === 'Visitante') || [];

    return {
        categoryChartData: categoryData,
        roomChartData: roomData,
        totalBookings: totalBookingsCount,
        mostPopularRoom: popularRoom,
        percentageOfTotal: percent,
        activeMembers: active,
        inactiveOrVisitors: inactive
    };
  }, [bookings, rooms, users]);
  
  const isLoading = loadingUsers || loadingBookings || loadingRooms;

  const renderUserList = (userList: AppUser[]) => (
    <ul className="space-y-3">
        {userList.map(user => (
            <li key={user.uid} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person"/>
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{user.name}</span>
            </li>
        ))}
    </ul>
  );

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Estatísticas</h1>
        <p className="text-muted-foreground">Análise de uso e engajamento do sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{users?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">usuários cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
            <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{totalBookings}</div>}
            <p className="text-xs text-muted-foreground">agendamentos no total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sala Mais Popular</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{mostPopularRoom.room}</div>}
            {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground">{percentageOfTotal}% do total de reservas</p>}
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Reservas por Categoria de Membro</CardTitle>
            <CardDescription>Participações em reservas por tipo de plano.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
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
            )}
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Membros Ativos
              </CardTitle>
               {isLoading ? <Skeleton className="h-6 w-12 rounded-full" /> : <Badge variant="secondary" className="bg-green-100 text-green-800">{activeMembers.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
              <ScrollArea className="h-72">
                {isLoading ? (
                  <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : renderUserList(activeMembers)}
              </ScrollArea>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-amber-600" />
                  Inativos e Visitantes
              </CardTitle>
               {isLoading ? <Skeleton className="h-6 w-12 rounded-full" /> : <Badge variant="secondary" className="bg-amber-100 text-amber-800">{inactiveOrVisitors.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
               <ScrollArea className="h-72">
                 {isLoading ? (
                  <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : renderUserList(inactiveOrVisitors)}
               </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Salas Mais Usadas</CardTitle>
            <CardDescription>Distribuição de reservas pelas salas disponíveis.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-0">
             {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <PieChart>
                    <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={roomChartData} dataKey="bookings" nameKey="room" innerRadius={50} strokeWidth={5} />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="room" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                </PieChart>
                </ChartContainer>
             )}
          </CardContent>
        </Card>
    </div>
  )
}
