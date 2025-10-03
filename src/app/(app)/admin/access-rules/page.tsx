
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, PlusCircle, Trash2, Pencil, ShieldAlert, Eye, Lock, Edit, BookOpen } from "lucide-react"
import { useState, useMemo } from "react"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, orderBy, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { AccessRule } from "@/lib/types/accessRule";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AccessRuleForm } from "@/components/app/admin/access-rules/access-rule-form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function AccessRulesPage() {
  const { toast } = useToast();
  const firestore = getFirestore(app);

  // --- Data Fetching ---
  const [rulesData, loadingRules, errorRules] = useCollectionData<AccessRule>(
    query(collection(firestore, 'accessRules')), 
    { idField: 'id' }
  );

  const rules = useMemo(() => {
    if (!rulesData) return [];
    return [...rulesData].sort((a, b) => a.id.localeCompare(b.id));
  }, [rulesData]);

  // --- Component State ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AccessRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<AccessRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers (Refatorado para usar Firestore SDK diretamente) ---
  const handleSave = async (data: AccessRule) => {
    setIsSubmitting(true);
    try {
        const { id, ...ruleData } = data;
        const ruleRef = doc(firestore, "accessRules", id);

        if (editingRule) {
            await updateDoc(ruleRef, ruleData as any);
            toast({ title: "Sucesso!", description: `Regra "${id}" atualizada com sucesso.` });
        } else {
            await setDoc(ruleRef, ruleData);
            toast({ title: "Sucesso!", description: `Regra "${id}" criada com sucesso.` });
        }
        
        setIsFormModalOpen(false);
        setEditingRule(null);
    } catch (error: any) {
        console.error("Erro ao salvar regra:", error);
        toast({ title: "Erro de Permissão!", description: error.message || "Você não tem permissão para realizar esta ação. Verifique se suas permissões de admin estão atualizadas.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    setIsSubmitting(true);
    try {
        await deleteDoc(doc(firestore, "accessRules", deletingRule.id));
        toast({ title: "Regra Excluída!", description: "A regra foi removida com sucesso." });
        setDeletingRule(null);
    } catch (error: any) {
        console.error("Erro ao remover regra:", error);
        toast({ title: "Erro de Permissão!", description: error.message || "Você não tem permissão para remover a regra.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };


  const openEditModal = (rule: AccessRule) => {
    setEditingRule(rule);
    setIsFormModalOpen(true);
  }

  const openCreateModal = () => {
    setEditingRule(null);
    setIsFormModalOpen(true);
  }

  // --- Render Functions ---
  const renderContent = () => {
    if (loadingRules) {
        return Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border-b">
                <Skeleton className="h-6 w-1/4 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            </div>
        ));
    }
    if (errorRules) {
      return (
        <div className="p-4">
            <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                    <h4 className="font-bold text-destructive">Erro ao carregar regras</h4>
                    <p className="text-sm text-destructive/80">Você não tem permissão para visualizar estes dados. ({errorRules.message})</p>
                </div>
            </div>
        </div>
      );
    }
    if (!rules || rules.length === 0) {
      return (<p className="text-center text-muted-foreground py-10">Nenhuma regra de acesso personalizada encontrada.</p>);
    }

    return rules.map(rule => (
        <div key={rule.id} className="p-4 rounded-lg border bg-muted/50 flex justify-between items-start">
            <div>
                <h4 className="font-bold flex items-center gap-2"><Lock className="h-4 w-4 text-muted-foreground" />{rule.id}</h4>
                <p className="text-sm text-muted-foreground mt-1 mb-2">{rule.description}</p>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(rule.pages).map(([page, permission]) => (
                        <Badge key={page} variant={permission === 'editor' ? 'default' : 'secondary'} className="capitalize">
                            {permission === 'editor' ? <Edit className="h-3 w-3 mr-1.5"/> : <BookOpen className="h-3 w-3 mr-1.5"/>}
                            {page.split('/').pop()}
                        </Badge>
                    ))}
                </div>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isSubmitting}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEditModal(rule)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setDeletingRule(rule)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    ));
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                <Eye className="h-8 w-8"/>
                Regras de Acesso
            </h1>
            <p className="text-muted-foreground">Crie e gerencie os níveis de permissão do sistema.</p>
        </div>
        <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
            <DialogTrigger asChild>
                <Button onClick={openCreateModal} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Nova Regra</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingRule ? 'Editar Regra' : 'Criar Nova Regra'}</DialogTitle>
                    <DialogDescription>
                        {editingRule ? 'Altere os detalhes da regra de acesso.' : 'Defina um novo nível de permissão e as páginas que ele pode acessar.'}
                    </DialogDescription>
                </DialogHeader>
                <AccessRuleForm 
                    onSave={handleSave} 
                    onCancel={() => { setIsFormModalOpen(false); setEditingRule(null); }} 
                    isSubmitting={isSubmitting}
                    defaultValues={editingRule ?? undefined}
                />
            </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Regras Definidas</CardTitle>
            <CardDescription>Lista de todos os níveis de acesso personalizados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderContent()}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingRule} onOpenChange={(isOpen) => !isOpen && setDeletingRule(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação é irreversível. A regra "{deletingRule?.id}" será permanentemente removida.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingRule(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, excluir regra
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
