"use client"

import { Bell, Search, User, Settings, LogOut, PanelLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAuthenticatedUser } from "@/lib/mock-service"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "./sidebar"

const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/my-bookings", label: "Minhas Reservas" },
    { href: "/statistics", label: "Estatísticas" },
    { href: "/users", label: "Usuários" },
    { href: "/rooms", label: "Salas" },
    { href: "/billing", label: "Cobrança" },
    { href: "/profile", label: "Perfil" },
  ];

function generateBreadcrumbs(pathname: string) {
    const pathParts = pathname.split("/").filter(Boolean);
    
    if (pathname === '/') {
        return [{ href: "/", label: "Dashboard", isLast: true }];
    }

    const breadcrumbs = pathParts.map((part, index) => {
      const currentPath = `/${pathParts.slice(0, index + 1).join('/')}`;
      const navItem = navItems.find((item) => item.href === currentPath);
      const label = navItem ? navItem.label : part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      const isLast = index === pathParts.length - 1;
      return { href: currentPath, label, isLast };
    });

    return [{ href: "/", label: "Dashboard", isLast: false }, ...breadcrumbs];
}

export function AppHeader() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const user = getAuthenticatedUser();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          {/* We pass a function to close the sheet when an item is clicked */}
          <AppSidebar isMobile onClose={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex">
          <Breadcrumb>
              <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                      <BreadcrumbItem>
                      {crumb.isLast ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                          <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                      )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                  ))}
              </BreadcrumbList>
          </Breadcrumb>
      </div>

      <div className="relative ml-auto flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Procurar..." className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]" />
      </div>
      <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificações</span>
      </Button>
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person"/>
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
          </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
              <p>{user.name}</p>
              <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
              <Link href="/profile"><User className="mr-2 h-4 w-4" />Perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
              <Link href="/login"><LogOut className="mr-2 h-4 w-4" />Sair</Link>
          </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}