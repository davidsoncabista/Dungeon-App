
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { DollarSign, Ticket, CalendarCheck, Save } from "lucide-react"

const plans = [
<<<<<<< HEAD
    { name: "Player", price: 30, weeklyQuota: 1, monthlyQuota: 2, invites: 1 },
    { name: "Gamer", price: 50, weeklyQuota: 2, monthlyQuota: 4, invites: 2 },
    { name: "Master", price: 70, weeklyQuota: 7, monthlyQuota: 99, invites: 4 },
=======
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from "lucide-react"
import { useState } from "react"
import type { Plan } from "@/lib/types/plan"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PlanForm } from "@/components/app/admin/plan-form"

const initialPlans: Plan[] = [
    { id: "plan_player", name: "Player", price: 30, weeklyQuota: 1, monthlyQuota: 2, invites: 1, votingWeight: 1 },
    { id: "plan_gamer", name: "Gamer", price: 50, weeklyQuota: 2, monthlyQuota: 4, invites: 2, votingWeight: 2 },
    { id: "plan_master", name: "Master", price: 70, weeklyQuota: 7, monthlyQuota: 99, invites: 4, votingWeight: 4 },
>>>>>>> 3e672e4c (vamos criar o modal de edição que basicamente so muda o nome do plano e)
=======
    { id: "plan_player", name: "Player", price: 30, weeklyQuota: 1, monthlyQuota: 2, invites: 1, votingWeight: 1 },
    { id: "plan_gamer", name: "Gamer", price: 50, weeklyQuota: 2, monthlyQuota: 4, invites: 2, votingWeight: 2 },
    { id: "plan_master", name: "Master", price: 70, weeklyQuota: 7, monthlyQuota: 99, invites: 4, votingWeight: 4 },
>>>>>>> f68d22a8 (falta so mais uma coluna que sera peso de voto playe 1 gamer 2 master 4)
=======
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Trash2, Pencil } from "lucide-react"

const plans = [
    { id: "plan_player", name: "Player", price: 30, weeklyQuota: 1, monthlyQuota: 2, invites: 1 },
    { id: "plan_gamer", name: "Gamer", price: 50, weeklyQuota: 2, monthlyQuota: 4, invites: 2 },
    { id: "plan_master", name: "Master", price: 70, weeklyQuota: 7, monthlyQuota: 99, invites: 4 },
>>>>>>> 47e1cb72 (na pagina administração precisamos de mais controle poder criar ou remov)
]
=======
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Trash2, Pencil, ShieldAlert } from "lucide-react"
import { useState, useEffect, ChangeEvent } from "react"
import type { Plan } from "@/lib/types/plan"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { PlanForm } from "@/components/app/admin/plan-form"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

>>>>>>> 8ea4c320 (vamos fazer o crude da pagina de administração)

export default function AdminPage() {
<<<<<<< HEAD
  const { toast } = useToast();
  const firestore = getFirestore(app);
  const plansRef = collection(firestore, 'plans');
  const plansQuery = query(plansRef, orderBy("price"));
  const [initialPlans, loading, error] = useCollectionData<Plan>(plansQuery, { idField: 'id' });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialPlans) {
      setPlans(initialPlans);
    }
  }, [initialPlans]);

  const handleCreatePlan = async (data: { name: string }) => {
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
      };
      await setDoc(newPlanRef, newPlan);
      toast({ title: "Plano Criado!", description: `O plano "${data.name}" foi adicionado.` });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      toast({ title: "Erro!", description: "Não foi possível criar o plano.", variant: "destructive" });
    }
  };

  const handleUpdatePlan = async (data: { name: string }) => {
    if (!editingPlan) return;
    try {
      await updateDoc(doc(firestore, "plans", editingPlan.id), { name: data.name });
      toast({ title: "Plano Atualizado!", description: "O nome do plano foi alterado." });
      setEditingPlan(null);
    } catch (error) {
       console.error("Erro ao atualizar plano:", error);
       toast({ title: "Erro!", description: "Não foi possível alterar o nome do plano.", variant: "destructive" });
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    try {
        await deleteDoc(doc(firestore, "plans", deletingPlan.id));
        toast({ title: "Plano Excluído!", description: "O plano foi removido com sucesso." });
        setDeletingPlan(null);
    } catch (error) {
        console.error("Erro ao excluir plano:", error);
        toast({ title: "Erro!", description: "Não foi possível remover o plano.", variant: "destructive" });
    }
  };

  const handleInputChange = (planId: string, field: keyof Plan, value: string) => {
    setPlans(prevPlans => prevPlans.map(p => 
      p.id === planId ? { ...p, [field]: Number(value) } : p
    ));
  };
  
  const handleSaveAllChanges = async () => {
    setIsSaving(true);
    const promises = plans.map(plan => {
      const planRef = doc(firestore, "plans", plan.id);
      // Remove 'id' e 'name' para garantir que apenas os campos numéricos sejam atualizados.
      const { id, name, ...numericData } = plan;
      return updateDoc(planRef, numericData);
    });

    try {
      await Promise.all(promises);
      toast({ title: "Sucesso!", description: "Todas as regras foram salvas no banco de dados." });
    } catch (error) {
      console.error("Erro ao salvar todas as alterações:", error);
      toast({ title: "Erro!", description: "Não foi possível salvar todas as alterações.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
            <TableCell><Skeleton className="h-10 w-24 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-10 w-20 mx-auto" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={7}>
            <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <div>
                    <h4 className="font-bold text-destructive">Erro ao carregar planos</h4>
                    <p className="text-sm text-destructive/80">Não foi possível buscar os dados. Verifique suas regras de segurança do Firestore. ({error.message})</p>
                </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }
    
    if (!plans || plans.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center h-24">Nenhum plano encontrado. Crie o primeiro plano para começar.</TableCell>
        </TableRow>
      );
    }

    return plans.map(plan => (
      <TableRow key={plan.id}>
          <TableCell className="font-bold">{plan.name}</TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                value={plan.price} 
                onChange={(e) => handleInputChange(plan.id, 'price', e.target.value)}
                className="w-24 mx-auto" 
              />
          </TableCell>
            <TableCell className="text-center">
              <Input 
                type="number" 
                value={plan.weeklyQuota} 
                onChange={(e) => handleInputChange(plan.id, 'weeklyQuota', e.target.value)}
                className="w-20 mx-auto" 
              />
          </TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                value={plan.monthlyQuota} 
                onChange={(e) => handleInputChange(plan.id, 'monthlyQuota', e.target.value)}
                className="w-20 mx-auto" 
              />
          </TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                value={plan.invites} 
                onChange={(e) => handleInputChange(plan.id, 'invites', e.target.value)}
                className="w-20 mx-auto" 
              />
          </TableCell>
          <TableCell className="text-center">
              <Input 
                type="number" 
                value={plan.votingWeight} 
                onChange={(e) => handleInputChange(plan.id, 'votingWeight', e.target.value)}
                className="w-20 mx-auto" 
              />
          </TableCell>
          <TableCell className="text-right">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações para {plan.name}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => setEditingPlan(plan)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar Nome
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onSelect={() => setDeletingPlan(plan)}
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

=======
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  const handleCreatePlan = (data: { name: string }) => {
    const newPlan: Plan = {
      id: `plan_${data.name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
      name: data.name,
      price: 0,
      weeklyQuota: 0,
      monthlyQuota: 0,
      invites: 0,
      votingWeight: 1,
    };
    setPlans(prev => [...prev, newPlan]);
    setIsCreateModalOpen(false);
  };

  const handleUpdatePlan = (data: { name: string }) => {
    if (!editingPlan) return;
    setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, name: data.name } : p));
    setEditingPlan(null);
  };

  const handleDeletePlan = () => {
    if (!deletingPlan) return;
    setPlans(prev => prev.filter(p => p.id !== deletingPlan.id));
    setDeletingPlan(null);
  };

>>>>>>> 3e672e4c (vamos criar o modal de edição que basicamente so muda o nome do plano e)

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
<<<<<<< HEAD
                    <CardDescription>Defina os preços, cotas de reserva e limites para cada plano.</CardDescription>
                </div>
                 <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
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
=======
                    <CardDescription>Defina os preços, cotas de reserva e limites de convite para cada plano.</CardDescription>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Plano
                </Button>
>>>>>>> 47e1cb72 (na pagina administração precisamos de mais controle poder criar ou remov)
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Plano</TableHead>
                        <TableHead className="text-center">Preço (R$)</TableHead>
                        <TableHead className="text-center">Cota Semanal</TableHead>
                        <TableHead className="text-center">Cota Mensal</TableHead>
                        <TableHead className="text-center">Cota Convites</TableHead>
<<<<<<< HEAD
                        <TableHead className="text-center">Peso de Voto</TableHead>
=======
>>>>>>> 47e1cb72 (na pagina administração precisamos de mais controle poder criar ou remov)
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
<<<<<<< HEAD
<<<<<<< HEAD
                   {renderContent()}
=======
=======
>>>>>>> 47e1cb72 (na pagina administração precisamos de mais controle poder criar ou remov)
                    {plans.map(plan => (
                        <TableRow key={plan.id}>
                            <TableCell className="font-bold">{plan.name}</TableCell>
                            <TableCell className="text-center">
                                <Input type="number" defaultValue={plan.price} className="w-24 mx-auto" />
                            </TableCell>
                             <TableCell className="text-center">
                                <Input type="number" defaultValue={plan.weeklyQuota} className="w-20 mx-auto" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Input type="number" defaultValue={plan.monthlyQuota} className="w-20 mx-auto" />
                            </TableCell>
                            <TableCell className="text-center">
                                <Input type="number" defaultValue={plan.invites} className="w-20 mx-auto" />
                            </TableCell>
<<<<<<< HEAD
                            <TableCell className="text-center">
                                <Input type="number" defaultValue={plan.votingWeight} className="w-20 mx-auto" />
                            </TableCell>
=======
>>>>>>> 47e1cb72 (na pagina administração precisamos de mais controle poder criar ou remov)
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
<<<<<<< HEAD
                                            <span className="sr-only">Ações para {plan.name}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={() => setEditingPlan(plan)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar Nome
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                            onSelect={() => setDeletingPlan(plan)}
                                        >
=======
                                            <span className="sr-only">Ações</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
>>>>>>> 47e1cb72 (na pagina administração precisamos de mais controle poder criar ou remov)
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
<<<<<<< HEAD
>>>>>>> 3e672e4c (vamos criar o modal de edição que basicamente so muda o nome do plano e)
=======
>>>>>>> 47e1cb72 (na pagina administração precisamos de mais controle poder criar ou remov)
                </TableBody>
            </Table>
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
<<<<<<< HEAD
                defaultValues={editingPlan!}
=======
                defaultValues={editingPlan}
>>>>>>> 3e672e4c (vamos criar o modal de edição que basicamente so muda o nome do plano e)
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


      <div className="flex justify-end mt-4">
<<<<<<< HEAD
        <Button size="lg">
            Salvar Todas as Alterações
=======
        <Button size="lg" onClick={handleSaveAllChanges} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Todas as Alterações"}
>>>>>>> 8ea4c320 (vamos fazer o crude da pagina de administração)
        </Button>
      </div>

    </div>
  )
}

    