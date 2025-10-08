"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where } from "firebase/firestore"
import { auth, app } from "@/lib/firebase"
import type { User } from "@/lib/types/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Library, PlusCircle, Wrench, Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Placeholder data for demonstration
const placeholderContent = [
  {
    id: '1',
    title: 'Maze Tracker v2',
    description: '<p>Uma ferramenta essencial para mestres de RPG de mesa, o <strong>Maze Tracker</strong> simplifica o gerenciamento de iniciativa em combates. Calcule automaticamente o tempo de espera, acompanhe status e mantenha o ritmo da batalha.</p><ul><li>Desempate automático por timestamp</li><li>Layout responsivo</li><li>Interface intuitiva</li></ul>',
    actionLink: '/amazegame',
    actionText: 'Acessar Ferramenta',
  },
  {
    id: '2',
    title: 'Livro de Regras da Guilda',
    description: '<p>O documento oficial com todas as regras de convivência, uso das salas, sistema de cotas e diretrizes da Associação Dungeon Belém. Leitura obrigatória para todos os membros.</p>',
    actionLink: '#',
    actionText: 'Baixar PDF',
  },
    {
    id: '3',
    title: 'Sistema de RPG "Crônicas de Aethel"',
    description: '<p>Um sistema de RPG proprietário criado por um dos nossos membros. Explore um mundo de fantasia sombria com regras inovadoras focadas em narrativa e desenvolvimento de personagens.</p><p>O sistema inclui:</p><ul><li>Criação de personagem flexível</li><li>Mecânicas de sanidade</li><li>Um bestiário único com mais de 50 criaturas</li></ul><p>Este é um exemplo de conteúdo mais longo para demonstrar a funcionalidade da barra de rolagem. A ideia é que mesmo com muito texto, o card não quebre o layout da grade, mantendo a consistência visual da página em todos os dispositivos, desde celulares até desktops com telas grandes. A formatação em HTML permite links, listas e outras formatações ricas.</p>',
    actionLink: '#',
    actionText: 'Ver Detalhes',
  },
]


export default function BooksPage() {
    const [user] = useAuthState(auth)
    const firestore = getFirestore(app)

    const userQuery = user ? query(collection(firestore, "users"), where("uid", "==", user.uid)) : null
    const [currentUserData, loadingUser] = useCollectionData<User>(userQuery)
    const currentUser = currentUserData?.[0]

    const canManage = currentUser?.role === "Administrador" || currentUser?.role === "Editor"

    return (
        <div className="flex flex-col h-full">
            {/* Cabeçalho Fixo */}
            <div className="flex-shrink-0 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                            <Library className="h-8 w-8" />
                            Biblioteca de Conteúdo
                        </h1>
                        <p className="text-muted-foreground">
                            Um repositório de sistemas, livros de regras e aplicações criados pela nossa comunidade.
                        </p>
                    </div>
                    {canManage && (
                        <Button disabled>
                            <Wrench className="mr-2 h-4 w-4" />
                            Gerenciar Conteúdo
                        </Button>
                    )}
                </div>
            </div>

            {/* Área de Conteúdo Rolável */}
            <div className="flex-1 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {placeholderContent.map((item) => (
                        <Card key={item.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ScrollArea className="h-40 pr-4">
                                     <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: item.description }} />
                                </ScrollArea>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" asChild>
                                    <a href={item.actionLink} target={item.actionLink.startsWith('/') ? '_self' : '_blank'}>
                                        <Download className="mr-2 h-4 w-4" />
                                        {item.actionText}
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            </div>
        </div>
    )
}
