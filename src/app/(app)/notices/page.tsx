
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getNotices } from "@/lib/mock-service"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Megaphone, Calendar } from "lucide-react"

export default function NoticesPage() {
  const notices = getNotices().sort((a, b) => 
    parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
  );

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Mural de Avisos</h1>
        <p className="text-muted-foreground">Fique por dentro das últimas notícias e comunicados da associação.</p>
      </div>

      <div className="space-y-6">
        {notices.map(notice => (
          <Card key={notice.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 mt-1">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold font-headline">{notice.title}</CardTitle>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(parseISO(notice.createdAt), "'Publicado em' dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <div className="pl-[68px]">
                    <p className="text-muted-foreground">{notice.description}</p>
                    {notice.link && (
                        <a 
                            href={notice.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary font-semibold hover:underline mt-2 inline-block"
                        >
                            Saiba mais
                        </a>
                    )}
                </div>
            </CardContent>
          </Card>
        ))}
        {notices.length === 0 && (
            <Card>
                <CardContent className="py-12 text-center">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum aviso no momento</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Quando houver um novo comunicado, ele aparecerá aqui.
                    </p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}
