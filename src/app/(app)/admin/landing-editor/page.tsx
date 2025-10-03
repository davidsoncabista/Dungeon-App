"use client"

import { useState, useMemo, useEffect } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy, doc, setDoc, updateDoc, deleteDoc, writeBatch, where } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { app, auth } from "@/lib/firebase"
import type { LandingPageBlock } from "@/lib/types/landing-page-block"
import type { User } from "@/lib/types/user"
import { useToast } from "@/hooks/use-toast"
import { createAuditLog } from "@/lib/auditLogger"


import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayoutTemplate, PlusCircle, MoreHorizontal, Pencil, Trash2, GripVertical, Library } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { LandingBlockForm } from "@/components/app/admin/landing-editor/landing-block-form"
import { ImageLibrary } from "@/components/app/admin/landing-editor/image-library"
import { Badge } from "@/components/ui/badge"

// --- Sortable Item Component ---
function SortableBlockItem({ block, onEdit, onDelete }: { block: LandingPageBlock, onEdit: () => void, onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="flex justify-between items-center p-4" >
        <div className="flex items-center gap-4">
            <button {...attributes} {...listeners} className="cursor-grab p-2">
              <GripVertical />
            </button>
            <div>
              <CardTitle className="text-lg">{block.title}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="capitalize mt-1">{block.type}</Badge>
              </CardDescription>
            </div>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </div>
  );
}


export default function LandingEditorPage() {
  const { toast } = useToast();
  const firestore = getFirestore(app);
  const [user] = useAuthState(auth);

  // --- Data Fetching ---
  const [blocksData, loadingBlocks, errorBlocks] = useCollectionData<LandingPageBlock>(
    query(collection(firestore, 'landingPageBlocks'), orderBy('order')),
    { idField: 'id' }
  );

  const [activeBlocks, setActiveBlocks] = useState<LandingPageBlock[]>([]);
  
  const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
  const [currentUserData, loadingUser] = useCollectionData<User>(userQuery);
  const currentUser = currentUserData?.[0];

  useEffect(() => {
    if (blocksData) {
      setActiveBlocks(blocksData);
    }
  }, [blocksData]);


  // --- State ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<LandingPageBlock | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<LandingPageBlock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers ---
  const handleSave = async (data: any) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
        if (editingBlock) {
            const blockRef = doc(firestore, "landingPageBlocks", editingBlock.id);
            await updateDoc(blockRef, data);
            await createAuditLog(currentUser, 'UPDATE_LANDING_BLOCK', { blockId: editingBlock.id, title: data.title, type: data.type });
            toast({ title: "Sucesso!", description: `Bloco "${data.title}" atualizado.` });
        } else {
            const newBlockRef = doc(collection(firestore, "landingPageBlocks"));
            const newBlock = { 
                ...data, 
                id: newBlockRef.id, 
                order: activeBlocks.length, // Add to the end
                enabled: true,
            };
            await setDoc(newBlockRef, newBlock);
            await createAuditLog(currentUser, 'CREATE_LANDING_BLOCK', { blockId: newBlock.id, title: newBlock.title, type: newBlock.type });
            toast({ title: "Sucesso!", description: `Bloco "${data.title}" criado.` });
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
    if (!deletingBlock || !currentUser) return;
    setIsSubmitting(true);
    try {
      await createAuditLog(currentUser, 'DELETE_LANDING_BLOCK', { blockId: deletingBlock.id, title: deletingBlock.title });
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

  // --- Drag and Drop Handler ---
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!currentUser) return;
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = activeBlocks.findIndex((b) => b.id === active.id);
      const newIndex = activeBlocks.findIndex((b) => b.id === over!.id);
      const newOrderBlocks = arrayMove(activeBlocks, oldIndex, newIndex);
      
      // Update local state for immediate feedback
      setActiveBlocks(newOrderBlocks);

      // Update Firestore
      const batch = writeBatch(firestore);
      newOrderBlocks.forEach((block, index) => {
        const blockRef = doc(firestore, "landingPageBlocks", block.id);
        batch.update(blockRef, { order: index });
      });

      try {
        await batch.commit();
        await createAuditLog(currentUser, 'REORDER_LANDING_BLOCKS', {
            movedBlockId: active.id,
            fromIndex: oldIndex,
            toIndex: newIndex,
        });
        toast({ title: "Layout Atualizado", description: "A ordem dos blocos foi salva." });
      } catch (error: any) {
        console.error("Erro ao reordenar blocos:", error);
        toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a nova ordem.", variant: "destructive" });
        // Revert local state on error
        setActiveBlocks(blocksData || []);
      }
    }
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
    if (activeBlocks.length === 0) {
      return <p className="text-muted-foreground text-center py-10">Nenhum bloco de conteúdo encontrado. Crie o primeiro!</p>;
    }
    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {activeBlocks.map(block => (
              <SortableBlockItem
                key={block.id}
                block={block}
                onEdit={() => openEditModal(block)}
                onDelete={() => setDeletingBlock(block)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };


  return (
    <div className="grid gap-8">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
              <LayoutTemplate className="h-8 w-8"/>
              Editor da Landing Page
          </h1>
        </div>
        <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogTrigger asChild>
                <Button onClick={openCreateModal} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4"/> Novo Bloco</Button>
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
                    defaultValues={editingBlock || undefined}
                />
            </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciador de Layout</CardTitle>
                    <CardDescription>Arraste e solte os blocos para reordenar o conteúdo da sua página.</CardDescription>
                </CardHeader>
                <CardContent>
                {renderContent()}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5" /> Biblioteca de Mídia</CardTitle>
                    <CardDescription>Gerencie as imagens para usar nos blocos de conteúdo.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ImageLibrary />
                </CardContent>
            </Card>
        </div>
      </div>

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
