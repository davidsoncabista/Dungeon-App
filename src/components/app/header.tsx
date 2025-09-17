
"use client"

import { Bell, User, Settings, LogOut, PanelLeft, Dices, Swords, BookMarked, BarChart3, Users as UsersIcon, DoorOpen, CreditCard, ShieldCheck, Megaphone, CalendarDays } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { User as FirebaseUser } from "firebase/auth"
import type { User as AppUser } from "@/lib/types/user"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

// Navegação principal para membros ativos
const navItems = [
  { href: "/online-schedule", label: "Agenda Online", icon: CalendarDays, roles: ["Membro", "Revisor", "Editor", "Administrador"] },
  { href: "/my-bookings", label: "Minhas Reservas", icon: BookMarked, roles: ["Membro", "Revisor", "Editor", "Administrador"] },
  { href: "/billing", label: "Cobranças", icon: CreditCard, roles: ["Membro", "Revisor", "Editor", "Administrador"] },
];

// Navegação visível para usuários 'Visitante' ou 'Pendente'
const visitorNavItems = [
    { href: "/billing", label: "Matrícula", icon: CreditCard, roles: ["Visitante"] },
    { href: "/profile", label: "Meu Perfil", icon: User, roles: ["Visitante", "Pendente"] },
];


const adminNavItems = [
    { href: "/statistics", label: "Estatísticas", icon: BarChart3, roles: ["Revisor", "Editor", "Administrador"] },
    { href: "/users", label: "Usuários", icon: UsersIcon, roles: ["Revisor", "Editor", "Administrador"] },
    { href: "/rooms", label: "Salas", icon: DoorOpen, roles: ["Editor", "Administrador"] },
    { href: "/admin", label: "Administração", icon: ShieldCheck, roles: ["Administrador"] },
]

interface AppHeaderProps {
    user: FirebaseUser | null;
    currentUserData?: AppUser;
}

export function AppHeader({ user, currentUserData }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  const userRole = currentUserData?.role || 'Membro';
  const userStatus = currentUserData?.status || 'Pendente';
  const userCategory = currentUserData?.category || 'Visitante';


  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      router.push('/landing');
    } catch (error) {
      console.error("Erro no logout:", error);
      toast({
        title: "Erro no Logout",
        description: "Não foi possível fazer o logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getVisibleNavItems = () => {
    if (userStatus === 'Pendente') {
        return [{ href: "/profile", label: "Meu Perfil", icon: User, roles: ["Pendente"] }];
    }
    if (userCategory === 'Visitante') {
        return visitorNavItems;
    }
    // Membros ativos e admins
    return navItems.filter(item => item.roles.includes(userRole));
  }

  const getVisibleAdminNavItems = () => {
     if (userCategory === 'Visitante' || userStatus === 'Pendente' || userRole === 'Membro') return [];
     // Filtra itens de admin baseado no role específico.
     return adminNavItems.filter(item => item.roles.includes(userRole));
  }

  const visibleNavItems = getVisibleNavItems();
  const visibleAdminNavItems = getVisibleAdminNavItems();
  const allVisibleItems = [...visibleNavItems, ...visibleAdminNavItems];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/online-schedule"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Dices className="h-8 w-8 text-primary" />
          <span className="sr-only">Dungeon App</span>
        </Link>
        {allVisibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
                "text-muted-foreground transition-colors hover:text-foreground",
                pathname === item.href && "text-foreground font-semibold"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
           <SheetHeader>
              <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
           </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium mt-4">
            <Link
              href="/online-schedule"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <Dices className="h-6 w-6 text-primary" />
              <span className="">Dungeon App</span>
            </Link>
            {allVisibleItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname === item.href && "bg-muted text-primary"
                )}
                >
                <item.icon className="h-5 w-5" />
                {item.label}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/notices">
              <Megaphone className="h-5 w-5" />
              <span className="sr-only">Mural de Avisos</span>
            </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {user && (
                    <>
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} data-ai-hint="person"/>
                        <AvatarFallback>{(user.displayName || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                    </>
                )}
              </Avatar>
          </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
                 <DropdownMenuLabel>
                    <p>{user.displayName}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                </DropdownMenuLabel>
            )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
              <Link href="/profile"><User className="mr-2 h-4 w-4" />Perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />Sair
          </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
