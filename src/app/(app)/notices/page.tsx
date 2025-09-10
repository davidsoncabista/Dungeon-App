
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Megaphone, Calendar, ShieldAlert } from "lucide-react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import type { Notice } from "@/lib/types/notice"

export default function NoticesPage() {
  const firestore = getFirestore(app);
  const noticesRef = collection(firestore, 'notices');
  const noticesQuery = query(noticesRef, orderBy("createdAt", "desc"));
  const [notices, loading, error] = useCollectionData<Notice>(noticesQuery, { idField: 'id' });

  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-[68px] space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))
    }

    if (error) {
        return (
            <Card className="bg-destructive/10 border-destructive">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <ShieldAlert className="h-8 w-8 text-destructive" />
                        <div>
                            <CardTitle className="text-destructive">Erro ao Carregar Avisos</CardTitle>
                            <CardDescription className="text-destructive/80">Não foi possível buscar os comunicados. Verifique suas regras de segurança do Firestore.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        )
    }

    if (!notices || notices.length === 0) {
      return (
        <Card>
            <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum aviso no momento</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Quando houver um novo comunicado, ele aparecerá aqui.
                </p>
            </CardContent>
        </Card>
      )
    }

    return notices.map(notice => (
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
                {/* O timestamp do Firestore precisa ser convertido */}
                <span>{notice.createdAt ? format(notice.createdAt.toDate(), "'Publicado em' dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data indisponível'}</span>
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
    ));
  }


  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Mural de Avisos</h1>
        <p className="text-muted-foreground">Fique por dentro das últimas notícias e comunicados da associação.</p>
      </div>

      <div className="space-y-6">
        {renderContent()}
      </div>
    </div>
  )
}

    