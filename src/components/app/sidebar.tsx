"use client"

import {
  Dices,
  BarChart3,
  CreditCard,
  DoorOpen,
  LogOut,
  Users,
  Swords,
  BookMarked,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: Swords },
  { href: "/my-bookings", label: "Minhas Reservas", icon: BookMarked },
  { href: "/statistics", label: "Estatísticas", icon: BarChart3 },
  { href: "/users", label: "Usuários", icon: Users },
  { href: "/rooms", label: "Salas", icon: DoorOpen },
  { href: "/billing", label: "Cobrança", icon: CreditCard },
]

interface AppSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isMobile = false, onClose }: AppSidebarProps) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  }

  // Alterado w-14 para w-64 para expandir a sidebar.
  const sidebarClasses = isMobile 
    ? "flex flex-col h-full"
    : "fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex";

  return (
    <nav className={cn(sidebarClasses)}>
        <div className="flex flex-col h-full">
            <div className={cn(
                "flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6",
                // Alterado para justify-start para alinhar à esquerda
                isMobile ? "justify-start gap-3" : ""
            )}>
                 <Link href="/" className="flex items-center gap-3" onClick={handleLinkClick}>
                    <Dices className="h-8 w-8 shrink-0 text-primary" />
                    {/* Removido o sr-only para o texto aparecer */}
                    <span className={cn("text-2xl font-bold font-headline")}>
                        Dungeon App
                    </span>
                 </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <div className="flex flex-col gap-1 px-2 text-sm font-medium lg:px-4">
                    {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) && "bg-muted text-primary",
                        isMobile && "text-lg py-3"
                        // Removido justify-center para alinhar itens à esquerda
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {/* Removido o sr-only para os labels aparecerem */}
                        <span className={cn(!isMobile && "")}>{item.label}</span>
                    </Link>
                    ))}
                </div>
            </div>
            <div className="mt-auto border-t p-2 lg:p-4">
                 <Link
                    href="/login"
                    onClick={handleLinkClick}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isMobile && "text-lg py-3"
                        // Removido justify-center para alinhar à esquerda
                    )}
                    >
                    <LogOut className="h-5 w-5" />
                    {/* Removido o sr-only para o label aparecer */}
                    <span className={cn(!isMobile && "")}>Sair</span>
                </Link>
            </div>
        </div>
    </nav>
  )
}
