
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Megaphone, Calendar, ShieldAlert, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy, where, doc, setDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore"
import { app, auth } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import type { Notice } from "@/lib/types/notice"
import { useAuthState } from "react-firebase-hooks/auth"
import type { User } from "@/lib/types/user"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { NoticeForm } from "@/components/app/notices/notice-form"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function NoticesPage() {
  const { toast } = useToast();
  const [user, loadingAuth] = useAuthState(auth);
  const firestore = getFirestore(app);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deletingNotice, setDeletingNotice] = useState<Notice | null>(null);

  // --- Firestore Data ---
  const usersRef = collection(firestore, 'users');
  const userQuery = user ? query(usersRef, where('uid', '==', user.uid)) : null;
  const [appUser, loadingUser] = useCollectionData<User>(userQuery);
  const currentUser = appUser?.[0];
  const canManage = currentUser?.role === 'Administrador';

  const noticesRef = collection(firestore, 'notices');
  const noticesQuery = query(noticesRef, orderBy("createdAt", "desc"));
  const [notices, loadingNotices, errorNotices] = useCollectionData<Notice>(noticesQuery, { idField: 'id' });
  
  const handleCreate = async (data: Omit<Notice, 'id' | 'uid' | 'createdAt' | 'readBy'>) => {
    try {
        const newNoticeRef = doc(noticesRef);
        const newNoticeId = newNoticeRef.id;
        
        await setDoc(newNoticeRef, {
            ...data,
            id: newNoticeId,
            uid: newNoticeId,
            createdAt: serverTimestamp(),
            readBy: []
        });
        toast({ title: "Aviso Publicado!", description: "O novo aviso já está visível para todos." });
        setIsCreateModalOpen(false);
    } catch (error) {
        console.error("Erro ao criar aviso:", error);
        toast({ title: "Erro!", description: "Não foi possível criar o aviso.", variant: "destructive" });
    }
  }

  const handleUpdate = async (data: Partial<Omit<Notice, 'id' | 'uid' | 'createdAt'>>) => {
    if (!editingNotice) return;
    try {
        await updateDoc(doc(firestore, "notices", editingNotice.id), data);
        toast({ title: "Aviso Atualizado!", description: "O aviso foi modificado com sucesso." });
        setEditingNotice(null);
    } catch (error) {
        console.error("Erro ao atualizar aviso:", error);
        toast({ title: "Erro!", description: "Não foi possível atualizar o aviso.", variant: "destructive" });
    }
  }

  const handleDelete = async () => {
    if (!deletingNotice) return;
    try {
        await deleteDoc(doc(firestore, "notices", deletingNotice.id));
        toast({ title: "Aviso Excluído!", description: "O aviso foi removido com sucesso." });
        setDeletingNotice(null);
    } catch (error) {
        console.error("Erro ao excluir aviso:", error);
        toast({ title: "Erro!", description: "Não foi possível excluir o aviso.", variant: "destructive" });
    }
  }

  const renderContent = () => {
    const isLoading = loadingNotices || loadingAuth || loadingUser;

    if (isLoading) {
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

    if (errorNotices) {
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
                    {canManage ? "Crie o primeiro aviso para a comunidade." : "Quando houver um novo comunicado, ele aparecerá aqui."}
                </p>
            </CardContent>
        </Card>
      )
    }

    return notices.map(notice => (
      <Card key={notice.id} className="shadow-sm hover:shadow-md transition-shadow relative">
        {canManage && (
            <div className="absolute top-2 right-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingNotice(notice)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setDeletingNotice(notice)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )}
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10 mt-1">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold font-headline">{notice.title}</CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3" />
                <span>{notice.createdAt ? format(notice.createdAt.toDate(), "'Publicado em' dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data indisponível'}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="pl-[68px]">
                <p className="text-muted-foreground whitespace-pre-wrap">{notice.description}</p>
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
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Mural de Avisos</h1>
            <p className="text-muted-foreground">Fique por dentro das últimas notícias e comunicados da associação.</p>
          </div>
          {canManage && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Novo Aviso
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar Novo Aviso</DialogTitle>
                        <DialogDescription>
                            Publique uma nova mensagem que será exibida para todos os membros no mural e no login.
                        </DialogDescription>
                    </DialogHeader>
                    <NoticeForm onSave={handleCreate} onCancel={() => setIsCreateModalOpen(false)} />
                </DialogContent>
            </Dialog>
          )}
      </div>
      
      <div className="space-y-6">
        {renderContent()}
      </div>

       {/* Edit Dialog */}
       <Dialog open={!!editingNotice} onOpenChange={(isOpen) => !isOpen && setEditingNotice(null)}>
           <DialogContent>
               <DialogHeader>
                   <DialogTitle>Editar Aviso</DialogTitle>
               </DialogHeader>
               <NoticeForm 
                    onSave={handleUpdate} 
                    onCancel={() => setEditingNotice(null)} 
                    defaultValues={editingNotice!}
               />
           </DialogContent>
       </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deletingNotice} onOpenChange={(isOpen) => !isOpen && setDeletingNotice(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível e excluirá o aviso permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingNotice(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  )
}
