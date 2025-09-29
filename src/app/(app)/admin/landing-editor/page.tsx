"use client"

import { useState, useMemo } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { app } from "@/lib/firebase"
import type { LandingPageBlock } from "@/lib/types/landing-page-block"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayoutTemplate, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { LandingBlockForm } from "@/components/app/admin/landing-editor/landing-block-form"

export default function LandingEditorPage() {
  const { toast } = useToast();
  const firestore = getFirestore(app);

  // --- Data Fetching ---
  const [blocksData, loadingBlocks, errorBlocks] = useCollectionData<LandingPageBlock>(
    query(collection(firestore, 'landingPageBlocks'), orderBy('order')), 
    { idField: 'id' }
  );

  const blocks = useMemo(() => blocksData || [], [blocksData]);

  // --- State ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<LandingPageBlock | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<LandingPageBlock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers ---
  const handleSave = async (data: any) => {
    setIsSubmitting(true);
    try {
        if (editingBlock) {
            // Update
            const blockRef = doc(firestore, "landingPageBlocks", editingBlock.id);
            await updateDoc(blockRef, data);
            toast({ title: "Sucesso!", description: `Bloco "${data.type}" atualizado.` });
        } else {
            // Create
            const newBlockRef = doc(collection(firestore, "landingPageBlocks"));
            const newBlock = { 
                ...data, 
                id: newBlockRef.id, 
                order: blocks.length, // Add to the end
                enabled: true,
            };
            await setDoc(newBlockRef, newBlock);
            toast({ title: "Sucesso!", description: `Bloco "${data.type}" criado.` });
        }
        setIsFormModalOpen(false);
        setEditingBlock(null);
    } catch (error: any) {
        console.error("Erro ao salvar bloco:", error);
        toast({ title: "Erro de Permissão!", description: error.message || "Você não tem permissão para realizar esta ação.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBlock) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(firestore, "landingPageBlocks", deletingBlock.id));
      toast({ title: "Bloco Excluído!", description: "O bloco foi removido com sucesso." });
      setDeletingBlock(null);
    } catch (error: any) {
      console.error("Erro ao excluir bloco:", error);
      toast({ title: "Erro de Permissão!", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingBlock(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (block: LandingPageBlock) => {
    setEditingBlock(block);
    setIsFormModalOpen(true);
  };

  const renderContent = () => {
    if (loadingBlocks) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ));
    }
    if (errorBlocks) {
      return <p className="text-destructive">Erro ao carregar blocos: {errorBlocks.message}</p>;
    }
    if (blocks.length === 0) {
      return <p className="text-muted-foreground text-center py-10">Nenhum bloco de conteúdo encontrado. Crie o primeiro!</p>;
    }
    return blocks.map(block => (
        <Card key={block.id} className="flex justify-between items-center p-4">
            <div>
                <CardTitle className="text-lg">{block.type}</CardTitle>
                <CardDescription>Ordem: {block.order}</CardDescription>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => openEditModal(block)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setDeletingBlock(block)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Card>
    ));
  };


  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <LayoutTemplate className="h-8 w-8"/>
            Editor da Landing Page
        </h1>
        <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogTrigger asChild>
                <Button onClick={openCreateModal}><PlusCircle className="mr-2 h-4 w-4"/> Novo Bloco</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                 <DialogHeader>
                    <DialogTitle>{editingBlock ? 'Editar Bloco' : 'Criar Novo Bloco'}</DialogTitle>
                    <DialogDescription>
                        Preencha os campos para {editingBlock ? 'atualizar o' : 'adicionar um novo'} bloco de conteúdo.
                    </DialogDescription>
                </DialogHeader>
                <LandingBlockForm 
                    isSubmitting={isSubmitting}
                    onSave={handleSave}
                    onCancel={() => setIsFormModalOpen(false)}
                    defaultValues={editingBlock ?? undefined}
                />
            </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Gerenciador de Layout</CardTitle>
            <CardDescription>Arraste, solte e edite os blocos para montar sua página.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContent()}
        </CardContent>
      </Card>

        <AlertDialog open={!!deletingBlock} onOpenChange={(isOpen) => !isOpen && setDeletingBlock(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação é irreversível e excluirá o bloco permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  )
}
