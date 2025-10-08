"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where } from "firebase/firestore"
import { auth, app } from "@/lib/firebase"
import type { User } from "@/lib/types/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Library, PlusCircle, Wrench } from "lucide-react"

export default function BooksPage() {
    const [user] = useAuthState(auth)
    const firestore = getFirestore(app)

    const userQuery = user ? query(collection(firestore, "users"), where("uid", "==", user.uid)) : null
    const [currentUserData, loadingUser] = useCollectionData<User>(userQuery)
    const currentUser = currentUserData?.[0]

    const canManage = currentUser?.role === "Administrador" || currentUser?.role === "Editor"

    return (
        <div className="grid gap-8">
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

            <Card>
                <CardHeader>
                    <CardTitle>Em Breve</CardTitle>
                    <CardDescription>
                        Esta seção está sendo preparada para abrigar todo o material de apoio desenvolvido pelos membros.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-12">
                    <p>Nenhum conteúdo foi adicionado ainda.</p>
                </CardContent>
            </Card>
        </div>
    )
}
