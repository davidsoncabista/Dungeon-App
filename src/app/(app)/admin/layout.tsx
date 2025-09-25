
"use client"

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, DollarSign, MessageSquare, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin/system", label: "Sistema", icon: ShieldCheck },
  { href: "/admin/finance", label: "Finanças", icon: DollarSign },
  { href: "/admin/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/admin/access-rules", label: "Regras de Acesso", icon: Eye },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                 <Card>
                    <CardContent className="p-4">
                        <nav className="flex flex-col gap-2">
                            {adminNavItems.map(item => (
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
                            ))}
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
