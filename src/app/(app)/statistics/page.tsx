
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Pie, PieChart, Tooltip } from "recharts"
import { BookOpenCheck, Cake, Users, ArrowUpDown, UserCheck, UserX, ShieldAlert, Swords } from "lucide-react"
import type { UserCategory, User as AppUser, GameType } from "@/lib/types/user"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { useState, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Booking } from "@/lib/types/booking"
import type { Room } from "@/lib/types/room"
import { Button } from "@/components/ui/button"
import { isPast, parseISO, getMonth, format } from "date-fns"
import { ptBR } from "date-fns/locale"

const chartConfig = {
  bookings: {
    label: "Reservas",
  },
  RPG: {
    label: "RPG",
    color: "hsl(var(--chart-1))",
  },
  "Board Game": {
    label: "Board Game",
    color: "hsl(var(--chart-2))",
  },
  "Card Game": {
    label: "Card Game",
    color: "hsl(var(--chart-3))",
  },
} satisfies {
  [key: string]: {
    label: string
    color?: string
  }
}

type SortKey = "name" | "category";

export default function StatisticsPage() {
  const firestore = getFirestore(app);
  
  // --- Component State ---
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // --- Firestore Data ---
  const [users, loadingUsers, errorUsers] = useCollectionData<AppUser>(query(collection(firestore, 'users'), orderBy('name')), { idField: 'id' });
  const [bookings, loadingBookings, errorBookings] = useCollectionData<Booking>(query(collection(firestore, 'bookings')), { idField: 'id' });

  // --- Memoized Data Processing ---
  const { 
    gameTypesChartData,
    totalBookings,
    activeMembers,
    inactiveOrVisitors,
    upcomingBookingsCount,
    monthlyBirthdays
  } = useMemo(() => {
    // Return empty state if data is not ready
    if (!users || !bookings) {
        return {
            gameTypesChartData: [],
            totalBookings: 0,
            activeMembers: [],
            inactiveOrVisitors: [],
            upcomingBookingsCount: 0,
            monthlyBirthdays: []
        };
    }

    // 1. Game Types Preferences
    const gameTypeCounts = users.reduce((acc, user) => {
        user.gameTypes?.forEach(type => {
            if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type]++;
        });
        return acc;
    }, {} as Record<GameType, number>);

    const gameTypesData = Object.entries(gameTypeCounts).map(([name, value]) => ({
      name,
      value,
      fill: chartConfig[name as GameType]?.color || "hsl(var(--chart-4))",
    }));

    // 2. Stats Cards
    const totalBookingsCount = bookings.length;
    const upcomingCount = bookings.filter(b => !isPast(parseISO(`${b.date}T${b.endTime}`))).length;
    
    // 3. User lists (active and inactive)
    const active = users?.filter(u => u.status === 'Ativo' && u.category !== 'Visitante') || [];
    const inactive = users?.filter(u => u.status !== 'Ativo' || u.category === 'Visitante') || [];
    
    // 4. Sorting logic
    const categoryOrder: Record<UserCategory, number> = { "Master": 1, "Gamer": 2, "Player": 3, "Visitante": 4 };
    const sortFunction = (a: AppUser, b: AppUser) => {
        let comparison = 0;
        if (sortKey === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else { // sort by category
            comparison = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    };
    
    active.sort(sortFunction);
    inactive.sort(sortFunction);

    // 5. Monthly Birthdays
    const currentMonth = getMonth(new Date());
    const birthdays = users.filter(user => {
        if (!user.birthdate) return false;
        const birthMonth = getMonth(parseISO(user.birthdate));
        return birthMonth === currentMonth;
    }).sort((a,b) => {
        if (!a.birthdate || !b.birthdate) return 0;
        return parseISO(a.birthdate).getDate() - parseISO(b.birthdate).getDate();
    });

    return {
        gameTypesChartData: gameTypesData,
        totalBookings: totalBookingsCount,
        activeMembers: active,
        inactiveOrVisitors: inactive,
        upcomingBookingsCount: upcomingCount,
        monthlyBirthdays: birthdays
    };
  }, [bookings, users, sortKey, sortOrder]);
  
  const isLoading = loadingUsers || loadingBookings;
  const hasError = errorUsers || errorBookings;
  
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('asc');
    }
  }

  const renderUserList = (userList: AppUser[]) => (
    <ul className="space-y-3">
        {userList.map(user => (
            <li key={user.uid} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 truncate">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person"/>
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{user.name}</span>
                </div>
                <Badge variant={user.category === 'Visitante' ? 'outline' : 'secondary'} className="shrink-0">{user.category}</Badge>
            </li>
        ))}
    </ul>
  );
  
  if (hasError) {
      return (
        <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <ShieldAlert className="h-8 w-8 text-destructive" />
                    <div>
                        <CardTitle className="text-destructive">Erro de Permissão</CardTitle>
                        <CardDescription className="text-destructive/80">Você não tem permissão para visualizar as estatísticas. Contate um administrador.</CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>
      )
  }

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
            {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground">{upcomingBookingsCount} agendamentos futuros</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes do Mês</CardTitle>
            <Cake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-full" /> : (
                <ScrollArea className="h-[60px]">
                    {monthlyBirthdays.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                            {monthlyBirthdays.map(user => (
                                <li key={user.uid} className="flex justify-between items-center">
                                    <span className="font-medium truncate">{user.name.split(' ')[0]}</span>
                                    <span className="text-muted-foreground">{format(parseISO(user.birthdate!), 'dd/MM')}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center pt-4">Nenhum aniversariante este mês.</p>
                    )}
                </ScrollArea>
            )}
          </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tipos de Jogo Mais Curtidos</CardTitle>
                 <Swords className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-center justify-center pb-4">
                {isLoading ? <Skeleton className="h-[120px] w-full" /> : (
                    <ChartContainer config={chartConfig} className="min-h-[120px] w-full max-w-[250px]">
                    <PieChart>
                        <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={gameTypesChartData} dataKey="value" nameKey="name" innerRadius={30} strokeWidth={5} />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="-translate-y-1 flex-wrap gap-x-4 gap-y-1 text-xs"
                        />
                    </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
      </div>
      
       <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <CardTitle>Membros Ativos</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
                    Nome <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleSort('category')}>
                    Categoria <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
                {isLoading ? <Skeleton className="h-6 w-12 rounded-full" /> : <Badge variant="secondary" className="bg-green-100 text-green-800">{activeMembers.length}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
              <ScrollArea className="h-72 pr-4">
                {isLoading ? (
                  <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : renderUserList(activeMembers)}
              </ScrollArea>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-amber-600" />
                  <CardTitle>Inativos e Visitantes</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
                    Nome <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleSort('category')}>
                    Categoria <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
                {isLoading ? <Skeleton className="h-6 w-12 rounded-full" /> : <Badge variant="secondary" className="bg-amber-100 text-amber-800">{inactiveOrVisitors.length}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
               <ScrollArea className="h-72 pr-4">
                 {isLoading ? (
                  <div className="space-y-3">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : renderUserList(inactiveOrVisitors)}
               </ScrollArea>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

    