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
  CalendarPlus,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const navItems = [
  { href: "/", label: "Dashboard", icon: Swords },
  { href: "/my-bookings", label: "Minhas Reservas", icon: BookMarked },
  { href: "/book-room", label: "Reservar Sala", icon: CalendarPlus },
  { href: "/statistics", label: "Estatísticas", icon: BarChart3 },
  { href: "/users", label: "Usuários", icon: Users },
  { href: "/rooms", label: "Salas", icon: DoorOpen },
  { href: "/billing", label: "Cobrança", icon: CreditCard },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar
      className="border-r-0 bg-sidebar text-sidebar-foreground"
      collapsible="icon"
    >
      <SidebarHeader className="flex h-16 items-center justify-center border-b border-sidebar-border group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:py-4">
        <Link href="/" className="flex items-center gap-3">
          <Dices className="h-8 w-8 shrink-0 text-primary" />
          <span className="text-2xl font-bold text-white group-data-[collapsible=icon]:hidden font-headline">
            Dungeon App
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  }
                  tooltip={{ children: item.label, side: "right" }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </div>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: "Sair", side: "right" }}>
              <Link href="/login">
                <LogOut />
                <span>Sair</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
