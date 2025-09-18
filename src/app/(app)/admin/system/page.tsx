
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Trash2, Pencil, ShieldAlert, Shield, AlertTriangle, Eye, Lock } from "lucide-react"
import { useState } from "react"
import type { Plan } from "@/lib/types/plan"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { PlanForm } from "@/components/app/admin/plan-form"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore"
import { app, auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { AdminRole, User as AppUser } from "@/lib/types/user";
import { useAuthState } from "react-firebase-hooks/auth"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Objeto que serve como documentação viva das regras de acesso do sistema.
const accessRules: Record<AdminRole | 'Visitante', { description: string; pages: string[] }> = {
    Administrador: {
        description: "Acesso total. Pode gerenciar planos, usuários, salas, finanças e as configurações do sistema.",
        pages: ["Agenda Online", "Minhas Reservas", "Cobranças", "Avisos", "Perfil", "Estatísticas", "Usuários", "Salas", "Finanças", "Sistema"]
    },
    Editor: {
        description: "Pode gerenciar usuários, salas e estatísticas, mas não as regras do sistema.",
        pages: ["Agenda Online", "Minhas Reservas", "Cobranças", "Avisos", "Perfil", "Estatísticas", "Usuários", "Salas"]
    },
    Revisor: {
        description: "Pode visualizar estatísticas e gerenciar usuários, mas não edita salas ou regras.",
        pages: ["Agenda Online", "Minhas Reservas", "Cobranças", "Avisos", "Perfil", "Estatísticas", "Usuários"]
    },
    Membro: {
        description: "Acesso padrão para associados. Pode fazer reservas e gerenciar seu perfil.",
        pages: ["Agenda Online", "Minhas Reservas", "Cobranças", "Avisos", "Perfil"]
    },
    // Regra para usuários que completaram o cadastro mas ainda não escolheram um plano.
    Visitante: {
        description: "Acesso de novo usuário. Pode ver a estrutura do app, completar o perfil e se matricular.",
        pages: ["Minhas Reservas", "Matrícula", "Perfil"]
    }
};


export default function AdminPage() {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const firestore = getFirestore(app);
  
  // --- Data Fetching ---
  const plansRef = collection(firestore, 'plans');
  const plansQuery = query(plansRef, orderBy("price"));
  const [plans, loadingPlans, errorPlans] = useCollectionData<Plan>(plansQuery, { idField: 'id' });

  const usersRef = collection(firestore, 'users');
  const currentUserQuery = user ? query(usersRef, where('uid', '==', user.uid)) : null;
  const [appUser, loadingUser] = useCollectionData<AppUser>(currentUserQuery);
  const currentUser = appUser?.[0];
  
  const canEdit = currentUser?.role === 'Administrador';

  // --- Component State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreatePlan = async (data: { name: string }) => {
    if (!canEdit) return;
    setIsSaving(true);
    try {
      const newPlanRef = doc(plansRef);
      const newPlan: Plan = {
        id: newPlanRef.id,
        name: data.name,
        price: 0,
        weeklyQuota: 0,
        monthlyQuota: 0,
        invites: 0,
        votingWeight: 1,
        corujaoQuota: 0,
        extraInvitePrice: 0,
      };
      await setDoc(newPlanRef, newPlan);
      toast({ title: "Plano Criado!", description: `O plano "${data.name}" foi adicionado.` });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      toast({ title: "Erro!", description: "Não foi possível criar o plano.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleUpdatePlan = async (data: { name: string }) => {
    if (!editingPlan || !canEdit) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, "plans", editingPlan.id), { name: data.name });
      toast({ title: "Plano Atualizado!", description: "O nome do plano foi alterado." });
      setEditingPlan(null);
    } catch (error) {
       console.error("Erro ao atualizar plano:", error);
       toast({ title: "Erro!", description: "Não foi possível alterar o nome do plano.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan || !canEdit) return;
    setIsSaving(true);
    try {
        await deleteDoc(doc(firestore, "plans", deletingPlan.id));
        toast({ title: "Plano Excluído!", description: "O plano foi removido com sucesso." });
        setDeletingPlan(null);
    } catch (error) {
        console.error("Erro ao excluir plano:", error);
        toast({ title: "Erro!", description: "Não foi possível remover o plano.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleFieldChange = async (planId: string, field: keyof Plan, value: string | number) => {
    if (!canEdit) return;
    const planRef = doc(firestore, "plans", planId);
    try {
        await updateDoc(planRef, { [field]: Number(value) });
        toast({
            title: "Campo Atualizado",
            description: `O campo foi salvo com sucesso.`,
        });
    } catch (error) {
        console.error(`Erro ao atualizar o campo ${String(field)}:`, error);
        toast({
            title: "Erro ao Salvar",
            description: `Não foi possível atualizar o campo.`,
            variant: "destructive",
        });
    }
  };
  
  const renderContent = () => {
    if (loadingPlans || loadingUser) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
            <TableCell><Skeleton className="h-10 w-24 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
        </TableRow>
      ));
    }

    if (errorPlans) {
      return (
        <TableRow>
          <TableCell colSpan={9}>
            <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                    <h4 className="font-bold text-destructive">Erro ao carregar planos</h4>
                    <p className="text-sm text-destructive/80">Não foi possível buscar os dados. Verifique suas regras de segurança do Firestore. ({errorPlans.message})</p>
                </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    
    if (!plans || plans.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="text-center h-24">Nenhum plano encontrado. Crie o primeiro plano para começar.</TableCell>
        </TableRow>
      );
    }

    return plans.map(plan => (
      <TableRow key={plan.id}>
          <TableCell className="font-bold">{plan.name}</TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                defaultValue={plan.price}
                onBlur={(e) => handleFieldChange(plan.id, 'price', e.target.value)}
                className="w-24 mx-auto"
                disabled={!canEdit}
              />
          </TableCell>
            <TableCell className="text-center">
              <Input 
                type="number" 
                defaultValue={plan.weeklyQuota} 
                onBlur={(e) => handleFieldChange(plan.id, 'weeklyQuota', e.target.value)}
                className="w-20 mx-auto"
                disabled={!canEdit}
              />
          </TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                defaultValue={plan.monthlyQuota} 
                onBlur={(e) => handleFieldChange(plan.id, 'monthlyQuota', e.target.value)}
                className="w-20 mx-auto"
                disabled={!canEdit}
              />
          </TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                defaultValue={plan.corujaoQuota || 0} 
                onBlur={(e) => handleFieldChange(plan.id, 'corujaoQuota', e.target.value)}
                className="w-20 mx-auto"
                disabled={!canEdit}
              />
          </TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                defaultValue={plan.invites} 
                onBlur={(e) => handleFieldChange(plan.id, 'invites', e.target.value)}
                className="w-20 mx-auto"
                disabled={!canEdit}
              />
          </TableCell>
           <TableCell className="text-center">
              <Input 
                type="number" 
                defaultValue={plan.extraInvitePrice || 0} 
                onBlur={(e) => handleFieldChange(plan.id, 'extraInvitePrice', e.target.value)}
                className="w-24 mx-auto"
                disabled={!canEdit}
              />
          </TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                defaultValue={plan.votingWeight} 
                onBlur={(e) => handleFieldChange(plan.id, 'votingWeight', e.target.value)}
                className="w-20 mx-auto"
                disabled={!canEdit}
              />
          </TableCell>
          <TableCell className="text-right">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isSaving || !canEdit}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações para {plan.name}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setEditingPlan(plan)} disabled={!canEdit}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Nome
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onSelect={() => setDeletingPlan(plan)}
                          disabled={!canEdit}
                      >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Administração do Sistema</h1>
        <p className="text-muted-foreground">Gerencie os planos de associação e as regras de negócio da plataforma.</p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Gerenciamento de Planos e Regras</CardTitle>
                    <CardDescription>Defina os preços, cotas de reserva e limites para cada plano. {!canEdit && "(Apenas visualização)"}</CardDescription>
                </div>
                 <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={isSaving || !canEdit}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Plano
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Plano</DialogTitle>
                            <DialogDescription>
                                Defina o nome do novo plano. Os outros valores podem ser editados na tabela.
                            </DialogDescription>
                        </DialogHeader>
                        <PlanForm 
                            onSave={handleCreatePlan} 
                            onCancel={() => setIsCreateModalOpen(false)} 
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </CardHeader>
        <CardContent>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={!canEdit ? 'cursor-not-allowed' : ''}>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plano</TableHead>
                                        <TableHead className="text-center">Preço (R$)</TableHead>
                                        <TableHead className="text-center">Cota Semanal</TableHead>
                                        <TableHead className="text-center">Cota Mensal</TableHead>
                                        <TableHead className="text-center">Cota Corujão</TableHead>
                                        <TableHead className="text-center">Cota Convites</TableHead>
                                        <TableHead className="text-center">Preço Convite Extra (R$)</TableHead>
                                        <TableHead className="text-center">Peso de Voto</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {renderContent()}
                                </TableBody>
                            </Table>
                        </div>
                    </TooltipTrigger>
                     {!canEdit && (
                        <TooltipContent>
                            <p>Você não tem permissão para editar os planos.</p>
                        </TooltipContent>
                     )}
                </Tooltip>
            </TooltipProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Controle de Acesso ao Sistema
            </CardTitle>
            <CardDescription>Gerencie as permissões e o estado geral da plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border border-dashed p-4">
                <h3 className="font-semibold">Modo de Manutenção</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-mode" className="text-muted-foreground max-w-sm">
                        Quando ativado, apenas administradores podem acessar o sistema. Novos agendamentos e edições são bloqueados para membros.
                    </Label>
                    <Switch id="maintenance-mode" aria-label="Ativar modo de manutenção" disabled={!canEdit} />
                </div>
            </div>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Alterar essas configurações pode impactar todos os usuários. Tenha certeza do que está fazendo.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visualização das Regras de Acesso
            </CardTitle>
            <CardDescription>Entenda quais páginas cada nível de usuário pode acessar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(accessRules).map(([role, rule]) => (
            <div key={role} className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                {role}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 mb-2">{rule.description}</p>
              <div className="flex flex-wrap gap-2">
                {rule.pages.map(page => (
                    <span key={page} className="text-xs font-medium bg-muted px-2 py-1 rounded-md">{page}</span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingPlan} onOpenChange={(isOpen) => !isOpen && setEditingPlan(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Plano: {editingPlan?.name}</DialogTitle>
                 <DialogDescription>
                    Altere o nome do plano. Os outros valores são gerenciados na tabela principal.
                </DialogDescription>
            </DialogHeader>
            <PlanForm
                onSave={handleUpdatePlan}
                onCancel={() => setEditingPlan(null)}
                defaultValues={editingPlan!}
            />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPlan} onOpenChange={(isOpen) => !isOpen && setDeletingPlan(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação é irreversível. O plano "{deletingPlan?.name}" será permanentemente removido.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingPlan(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sim, excluir plano
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

    
