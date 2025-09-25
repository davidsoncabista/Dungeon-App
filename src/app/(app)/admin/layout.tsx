
"use client"

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, DollarSign, MessageSquare, Eye, Users, BarChart3, DoorOpen } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { auth, app } from "@/lib/firebase";
import { getFirestore, query, collection, where } from "firebase/firestore";
import type { User } from "@/lib/types/user";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);

    const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
    const [appUser] = useCollectionData<User>(userQuery);
    const currentUserRole = appUser?.[0]?.role;

    const adminNavItems = [
      { href: "/admin/system", label: "Sistema", icon: ShieldCheck, roles: ["Administrador"] },
      { href: "/admin/finance", label: "Finanças", icon: DollarSign, roles: ["Administrador"] },
      { href: "/admin/messages", label: "Mensagens", icon: MessageSquare, roles: ["Administrador"] },
      { href: "/admin/access-rules", label: "Regras de Acesso", icon: Eye, roles: ["Administrador"] },
      // Itens que podem ser visíveis para outros roles
      { href: "/statistics", label: "Estatísticas", icon: BarChart3, roles: ["Revisor", "Editor", "Administrador"] },
      { href: "/users", label: "Usuários", icon: Users, roles: ["Revisor", "Editor", "Administrador"] },
      { href: "/rooms", label: "Salas", icon: DoorOpen, roles: ["Editor", "Administrador"] },
    ];
    
    // Itens que aparecem no menu lateral da área /admin
    const sideNavItems = adminNavItems.filter(item => item.href.startsWith('/admin/'));

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                 <Card>
                    <CardContent className="p-4">
                        <nav className="flex flex-col gap-2">
                            {sideNavItems.map(item => {
                                // Apenas admins podem ver os itens do menu lateral de admin
                                if (currentUserRole && item.roles.includes(currentUserRole)) {
                                    return (
                                        <Button
                                            key={item.href}
                                            asChild
                                            variant={pathname === item.href ? "default" : "ghost"}
                                            className="justify-start"
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="mr-2 h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        </Button>
                                    )
                                }
                                return null;
                            })}
                        </nav>
                    </CardContent>
                 </Card>
            </div>
            <div className="md:col-span-3">
                {children}
            </div>
        </div>
    )
}
