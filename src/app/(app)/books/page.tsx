"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where, orderBy, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { auth, app } from "@/lib/firebase"
import type { User } from "@/lib/types/user"
import type { Book } from "@/lib/types/book"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Library, Wrench, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookFormDialog } from "@/components/app/books/book-form-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function BooksPage() {
    const { toast } = useToast()
    const [user] = useAuthState(auth)
    const firestore = getFirestore(app)

    const [editingBook, setEditingBook] = useState<Book | null>(null)
    const [deletingBook, setDeletingBook] = useState<Book | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    // --- Data Fetching ---
    const userQuery = user ? query(collection(firestore, "users"), where("uid", "==", user.uid)) : null
    const [currentUserData, loadingUser] = useCollectionData<User>(userQuery)
    const currentUser = currentUserData?.[0]

    const booksQuery = query(collection(firestore, "books"), orderBy("createdAt", "desc"))
    const [books, loadingBooks, errorBooks] = useCollectionData<Book>(booksQuery, { idField: "id" })

    const canManage = currentUser?.role === "Administrador" || currentUser?.role === "Editor"
    const isLoading = loadingUser || loadingBooks

    // --- CRUD Handlers ---
    const handleSave = async (data: any) => {
        try {
            if (editingBook) { // Update
                const bookRef = doc(firestore, "books", editingBook.id)
                await updateDoc(bookRef, data)
                toast({ title: "Sucesso!", description: "O conteúdo foi atualizado." })
            } else { // Create
                const newBookRef = doc(collection(firestore, "books"))
                await setDoc(newBookRef, { ...data, id: newBookRef.id, createdAt: serverTimestamp() })
                toast({ title: "Sucesso!", description: "Novo conteúdo adicionado à biblioteca." })
            }
            setIsFormOpen(false)
            setEditingBook(null)
        } catch (error: any) {
            console.error("Erro ao salvar conteúdo:", error)
            toast({
                title: "Erro de Permissão",
                description: error.message || "Você não tem permissão para executar esta ação.",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async () => {
        if (!deletingBook) return
        try {
            await deleteDoc(doc(firestore, "books", deletingBook.id))
            toast({ title: "Conteúdo Removido", description: "O item foi excluído da biblioteca." })
            setDeletingBook(null)
        } catch (error: any) {
             console.error("Erro ao excluir conteúdo:", error)
            toast({
                title: "Erro ao Excluir",
                description: error.message || "Não foi possível remover o conteúdo.",
                variant: "destructive",
            })
        }
    }

    const openEditModal = (book: Book) => {
        setEditingBook(book)
        setIsFormOpen(true)
    }

    const openCreateModal = () => {
        setEditingBook(null)
        setIsFormOpen(true)
    }

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
            ))
        }

        if (errorBooks) {
            return <p className="text-destructive text-center col-span-full">Erro ao carregar o conteúdo da biblioteca.</p>
        }
        
        if (!books || books.length === 0) {
            return <p className="text-muted-foreground text-center col-span-full">Nenhum conteúdo na biblioteca ainda.</p>
        }

        return books.map((item) => (
            <Card key={item.id} className="flex flex-col relative">
                {canManage && (
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => openEditModal(item)}><Pencil className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setDeletingBook(item)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
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
                        <a href={item.actionLink} target={item.actionLink.startsWith('/') ? '_self' : '_blank'} rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            {item.actionText}
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        ))
    }

    return (
        <div className="flex flex-col h-full">
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
                       <BookFormDialog 
                            onSave={handleSave} 
                            isOpen={isFormOpen} 
                            setIsOpen={setIsFormOpen}
                            defaultValues={editingBook || undefined}
                       >
                           <Button onClick={openCreateModal}>
                               <Wrench className="mr-2 h-4 w-4" />
                               Gerenciar Conteúdo
                           </Button>
                       </BookFormDialog>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderContent()}
                 </div>
            </div>

             <AlertDialog open={!!deletingBook} onOpenChange={(open) => !open && setDeletingBook(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá o item "{deletingBook?.title}" permanentemente da biblioteca.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Sim, excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
