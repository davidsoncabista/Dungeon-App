
"use client"

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, DollarSign, MessageSquare, Eye, Users, BarChart3, DoorOpen, LayoutTemplate } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { auth, app } from "@/lib/firebase";
import { getFirestore, query, collection, where } from "firebase/firestore";
import type { User } from "@/lib/types/user";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [user] = useAuthState(auth);
    const firestore = getFirestore(app);

    const userQuery = user && user.uid ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
    const [appUser] = useCollectionData<User>(userQuery);
    const currentUserRole = appUser?.[0]?.role;

    // Itens que aparecem no menu lateral da área /admin
    const sideNavItems = [
      { href: "/admin/system", label: "Sistema", shortLabel: "Sistema", icon: ShieldCheck, roles: ["Administrador"] },
      { href: "/admin/finance", label: "Finanças", shortLabel: "Finanças", icon: DollarSign, roles: ["Administrador"] },
      { href: "/admin/messages", label: "Mensagens", shortLabel: "Msg", icon: MessageSquare, roles: ["Administrador"] },
      { href: "/admin/access-rules", label: "ACL", shortLabel: "ACL", icon: Eye, roles: ["Administrador"] },
      { href: "/admin/rooms", label: "Salas", shortLabel: "Salas", icon: DoorOpen, roles: ["Editor", "Administrador"] },
    ];
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                 <Card>
                    <CardContent className="p-2 md:p-4">
                        <nav className="flex flex-row md:flex-col gap-1 md:gap-2">
                            {sideNavItems.map(item => {
                                if (currentUserRole && item.roles.includes(currentUserRole)) {
                                    return (
                                        <Button
                                            key={item.href}
                                            asChild
                                            variant={pathname === item.href ? "default" : "ghost"}
                                            className="justify-center md:justify-start flex-1 md:flex-none"
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="h-5 w-5 md:mr-2" />
                                                <span className="hidden md:inline">{item.label}</span>
                                                <span className="sr-only md:hidden">{item.shortLabel}</span>
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

    