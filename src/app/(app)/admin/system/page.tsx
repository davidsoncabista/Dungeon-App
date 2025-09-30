
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Trash2, Pencil, ShieldAlert, Shield, Eye, Lock, FileDigit, Vote, BarChart3, BadgeCheck, Square, Play, Send } from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
import type { Plan } from "@/lib/types/plan"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { PlanForm } from "@/components/app/admin/plan-form"
import { useCollectionData, useDocumentData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp, onSnapshot } from "firebase/firestore"
import { app, auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { AdminRole, User as AppUser } from "@/lib/types/user";
import { useAuthState } from "react-firebase-hooks/auth"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Poll, Vote as PollVote } from "@/lib/types/poll"
import { PollForm } from "@/components/app/admin/system/poll-form"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PollActions } from "@/components/app/admin/system/poll-actions"
import { cn } from "@/lib/utils"
import { NoticeForm, type NoticeFormValues } from "@/components/app/notices/notice-form"

export default function AdminPage() {
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const firestore = getFirestore(app);
  
  // --- Data Fetching ---
  const [plans, loadingPlans, errorPlans] = useCollectionData<Plan>(query(collection(firestore, 'plans'), orderBy("price")), { idField: 'id' });
  const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
  const [appUser, loadingUser] = useCollectionData<AppUser>(userQuery);
  
  const [allUsers, loadingAllUsers] = useCollectionData<AppUser>(query(collection(firestore, 'users'), orderBy("name")), { idField: 'id' });

  const { activeUsers, loadingActiveUsers } = useMemo(() => {
      if (loadingAllUsers) {
          return { activeUsers: [], loadingActiveUsers: true };
      }
      if (!allUsers) {
          return { activeUsers: [], loadingActiveUsers: false };
      }
      const filtered = allUsers.filter(u => u.status === 'Ativo' && u.category !== 'Visitante');
      return { activeUsers: filtered, loadingActiveUsers: false };
  }, [allUsers, loadingAllUsers]);

  const [polls, loadingPolls] = useCollectionData<Poll>(query(collection(firestore, 'polls'), orderBy("createdAt", "desc")), { idField: 'id' });
  const [settings, loadingSettings] = useDocumentData(doc(firestore, 'systemSettings', 'config'));
  
  const currentUser = appUser?.[0];
  const isAdmin = currentUser?.role === 'Administrador';

  // --- Component State ---
  const [isPlanCreateModalOpen, setIsPlanCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  const [isPollCreateModalOpen, setIsPollCreateModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [deletingPoll, setDeletingPoll] = useState<Poll | null>(null);

  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeDefaultValues, setNoticeDefaultValues] = useState<Partial<NoticeFormValues> | undefined>(undefined);

  const [isSaving, setIsSaving] = useState(false);
  const [registrationFee, setRegistrationFee] = useState<string | number>('');
  const [extraInvitePrice, setExtraInvitePrice] = useState<string | number>('');

  useEffect(() => {
    if (settings) {
      setRegistrationFee(settings.registrationFee || '');
      setExtraInvitePrice(settings.extraInvitePrice || '');
    }
  }, [settings]);

  // --- Plan Handlers ---
   const handleCreatePlan = async (data: any) => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const newPlanRef = doc(collection(firestore, 'plans'));
      await setDoc(newPlanRef, {
        ...data,
        id: newPlanRef.id,
      });
      toast({ title: "Plano Criado!", description: `O plano ${data.name} foi criado com sucesso.` });
      setIsPlanCreateModalOpen(false);
    } catch (error: any) {
       toast({ title: "Erro de Permissão!", description: error.message || "Você não tem permissão para realizar esta ação.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };


  const handleUpdatePlan = async (data: Partial<Plan>) => {
    if (!editingPlan || !isAdmin) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, "plans", editingPlan.id), data);
      toast({ title: "Plano Atualizado!", description: "O nome do plano foi alterado." });
      setEditingPlan(null);
    } catch (error: any) {
       toast({ title: "Erro de Permissão!", description: error.message || "Você não tem permissão para realizar esta ação.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan || !isAdmin) return;
    setIsSaving(true);
    try {
        await deleteDoc(doc(firestore, "plans", deletingPlan.id));
        toast({ title: "Plano Excluído!", description: "O plano foi removido com sucesso." });
        setDeletingPlan(null);
    } catch (error: any) {
        toast({ title: "Erro de Permissão!", description: error.message || "Você não tem permissão para realizar esta ação.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleFieldChange = async (planId: string, field: keyof Plan, value: string | number) => {
    if (!isAdmin) return;
    try {
        await updateDoc(doc(firestore, "plans", planId), { [field]: Number(value) });
        toast({ title: "Campo Atualizado", description: `O campo foi salvo com sucesso.` });
    } catch (error: any) {
        toast({ title: "Erro de Permissão", description: error.message || `Não foi possível atualizar o campo.`, variant: "destructive" });
    }
  };

  const handleSaveSettings = async (field: 'registrationFee' | 'extraInvitePrice', value: string | number) => {
    if (!isAdmin) return;
    const numericValue = Number(value);
     if (isNaN(numericValue) || numericValue < 0) {
        toast({ title: "Valor Inválido", description: "Por favor, insira um número válido.", variant: "destructive"});
        return;
    }
    try {
        await setDoc(doc(firestore, 'systemSettings', 'config'), { [field]: numericValue }, { merge: true });
        toast({ title: "Configuração Salva", description: "O novo valor foi salvo com sucesso." });
    } catch (error: any) {
        toast({ title: "Erro de Permissão", description: error.message || "Não foi possível salvar o novo valor.", variant: "destructive" });
    }
  }

  // --- Poll Handlers ---
   const handleCreatePoll = async (data: any) => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const newPollRef = doc(collection(firestore, 'polls'));
      // Transforma o array de objetos em um array de strings
      const optionsAsStringArray = data.options.map((opt: { value: string }) => opt.value);
      
      await setDoc(newPollRef, {
        ...data,
        options: optionsAsStringArray, // Salva o array de strings
        id: newPollRef.id,
        status: 'Fechada',
        createdAt: serverTimestamp(),
      });
      toast({ title: "Votação Criada!", description: "A nova votação foi criada com sucesso." });
      setIsPollCreateModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro!", description: error.message || "Não foi possível criar a votação.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

   const handleUpdatePoll = async (data: any) => {
    if (!editingPoll || !isAdmin) return;
    setIsSaving(true);
    try {
        const optionsAsStringArray = data.options.map((opt: { value: string }) => opt.value);
        await updateDoc(doc(firestore, "polls", editingPoll.id), {
            ...data,
            options: optionsAsStringArray
        });
        toast({ title: "Votação Atualizada!", description: "A votação foi alterada com sucesso." });
        setEditingPoll(null);
    } catch (error: any) {
        console.error("Erro ao atualizar votação:", error);
        toast({ title: "Erro!", description: error.message || "Não foi possível atualizar a votação.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeletePoll = async () => {
    if (!deletingPoll || !isAdmin) return;
    setIsSaving(true);
    try {
        await deleteDoc(doc(firestore, "polls", deletingPoll.id));
        toast({ title: "Votação Excluída!", description: "A votação foi removida com sucesso." });
        setDeletingPoll(null);
    } catch (error: any) {
        toast({ title: "Erro!", description: error.message || "Não foi possível remover a votação.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
    // --- Notice (for Poll Results) Handlers ---
    const handleOpenSendResultsModal = useCallback((poll: Poll) => {
        setIsSaving(true); // Usa o estado 'isSaving' como 'loading'

        const votesForPollQuery = query(collection(firestore, `polls/${poll.id}/votes`));
        
        // Usamos um onSnapshot para garantir que pegamos todos os votos, mesmo que demorem a carregar.
        const unsubscribe = onSnapshot(votesForPollQuery, (snapshot) => {
            const votesData = snapshot.docs.map(doc => doc.data() as PollVote);
            
            const resultsMap = new Map<string, number>();
            // Garante que todas as opções estejam no mapa, mesmo que com 0 votos.
            poll.options.forEach(opt => {
                const optionKey = typeof opt === 'object' && opt.value ? opt.value : opt;
                resultsMap.set(optionKey, 0)
            });

            votesData.forEach(vote => {
                if (resultsMap.has(vote.selectedOption)) {
                    const currentWeight = resultsMap.get(vote.selectedOption)!;
                    resultsMap.set(vote.selectedOption, currentWeight + vote.votingWeight);
                }
            });

            let descriptionText = `Resultado da Votação: "${poll.title}"\n\n`;
            resultsMap.forEach((weight, option) => {
                descriptionText += `- ${option}: ${weight} voto(s)\n`;
            });
            
            setNoticeDefaultValues({
                title: `Resultado: ${poll.title}`,
                description: descriptionText,
            });

            setIsNoticeModalOpen(true);
            setIsSaving(false);
            unsubscribe(); // Remove o listener após obter os dados
        }, (error) => {
            console.error("Erro ao buscar votos:", error);
            toast({ title: "Erro ao Apurar", description: "Não foi possível carregar os resultados da votação.", variant: "destructive" });
            setIsSaving(false);
            unsubscribe();
        });
    }, [firestore, toast]);


  const handleSendNotice = async (data: NoticeFormValues) => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
        const newNoticeRef = doc(collection(firestore, "notices"));
        await setDoc(newNoticeRef, {
            ...data,
            id: newNoticeRef.id,
            uid: newNoticeRef.id,
            createdAt: serverTimestamp(),
            readBy: []
        });
        toast({ title: "Aviso Publicado!", description: "O resultado da votação foi enviado a todos." });
        setIsNoticeModalOpen(false);
    } catch (error: any) {
        toast({ title: "Erro!", description: error.message || "Não foi possível enviar o aviso.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  const openEditPollModal = (poll: Poll) => {
    setEditingPoll(poll);
    setIsPollCreateModalOpen(true);
  }

  const openCreatePollModal = () => {
    setEditingPoll(null);
    setIsPollCreateModalOpen(true);
  }
  
  // --- Render Functions ---
  const renderPlansMobileContent = () => {
    if (loadingPlans || loadingUser) {
        return Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex flex-col gap-2 border-b">
                <Skeleton className="h-6 w-32" />
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Preço:</span><Skeleton className="h-8 w-20" /></div>
                <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cota Semanal:</span><Skeleton className="h-8 w-20" /></div>
            </div>
        ));
    }
    if (!plans || plans.length === 0) {
      return (<p className="text-center text-muted-foreground py-10">Nenhum plano encontrado.</p>);
    }
     return plans.map(plan => (
        <div key={plan.id} className="p-4 flex flex-col gap-3 border-b">
            <div className="flex justify-between items-center">
                <span className="font-bold text-lg">{plan.name}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSaving || !isAdmin}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingPlan(plan)} disabled={!isAdmin}><Pencil className="mr-2 h-4 w-4" />Editar Nome</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeletingPlan(plan)} disabled={!isAdmin}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Preço (R$):</span><Input type="number" defaultValue={plan.price} onBlur={(e) => handleFieldChange(plan.id, 'price', e.target.value)} className="w-24 text-center" disabled={!isAdmin}/></div>
            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cota Semanal:</span><Input type="number" defaultValue={plan.weeklyQuota} onBlur={(e) => handleFieldChange(plan.id, 'weeklyQuota', e.target.value)} className="w-24 text-center" disabled={!isAdmin}/></div>
            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cota Mensal:</span><Input type="number" defaultValue={plan.monthlyQuota} onBlur={(e) => handleFieldChange(plan.id, 'monthlyQuota', e.target.value)} className="w-24 text-center" disabled={!isAdmin}/></div>
            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cota Corujão:</span><Input type="number" defaultValue={plan.corujaoQuota || 0} onBlur={(e) => handleFieldChange(plan.id, 'corujaoQuota', e.target.value)} className="w-24 text-center" disabled={!isAdmin}/></div>
            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Cota Convites:</span><Input type="number" defaultValue={plan.invites} onBlur={(e) => handleFieldChange(plan.id, 'invites', e.target.value)} className="w-24 text-center" disabled={!isAdmin}/></div>
            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Peso de Voto:</span><Input type="number" defaultValue={plan.votingWeight} onBlur={(e) => handleFieldChange(plan.id, 'votingWeight', e.target.value)} className="w-24 text-center" disabled={!isAdmin}/></div>
        </div>
    ));
  }
  
  const renderPlansDesktopContent = () => {
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
                <TableCell className="text-right"><Skeleton className="h-10 w-10 ml-auto" /></TableCell>
            </TableRow>
        ));
    }
     if (errorPlans) {
      return (
        <TableRow>
            <TableCell colSpan={8}>
                <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                    <ShieldAlert className="h-8 w-8 text-destructive" />
                    <div>
                        <h4 className="font-bold text-destructive">Erro ao carregar planos</h4>
                        <p className="text-sm text-destructive/80">Não foi possível buscar os dados. Verifique suas regras de segurança do Firestore. (${errorPlans.message})</p>
                    </div>
                </div>
            </TableCell>
        </TableRow>
      );
    }
     if (!plans || plans.length === 0) {
      return (<TableRow><TableCell colSpan={8} className="text-center py-10">Nenhum plano encontrado.</TableCell></TableRow>);
    }

     return plans.map(plan => (
        <TableRow key={plan.id}>
            <TableCell className="font-bold">{plan.name}</TableCell>
            <TableCell><Input type="number" defaultValue={plan.price} onBlur={(e) => handleFieldChange(plan.id, 'price', e.target.value)} className="w-24 mx-auto text-center" disabled={!isAdmin}/></TableCell>
            <TableCell><Input type="number" defaultValue={plan.weeklyQuota} onBlur={(e) => handleFieldChange(plan.id, 'weeklyQuota', e.target.value)} className="w-20 mx-auto text-center" disabled={!isAdmin}/></TableCell>
            <TableCell><Input type="number" defaultValue={plan.monthlyQuota} onBlur={(e) => handleFieldChange(plan.id, 'monthlyQuota', e.target.value)} className="w-20 mx-auto text-center" disabled={!isAdmin}/></TableCell>
            <TableCell><Input type="number" defaultValue={plan.corujaoQuota || 0} onBlur={(e) => handleFieldChange(plan.id, 'corujaoQuota', e.target.value)} className="w-20 mx-auto text-center" disabled={!isAdmin}/></TableCell>
            <TableCell><Input type="number" defaultValue={plan.invites} onBlur={(e) => handleFieldChange(plan.id, 'invites', e.target.value)} className="w-20 mx-auto text-center" disabled={!isAdmin}/></TableCell>
            <TableCell><Input type="number" defaultValue={plan.votingWeight} onBlur={(e) => handleFieldChange(plan.id, 'votingWeight', e.target.value)} className="w-20 mx-auto text-center" disabled={!isAdmin}/></TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isSaving || !isAdmin}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingPlan(plan)} disabled={!isAdmin}><Pencil className="mr-2 h-4 w-4" />Editar Nome</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeletingPlan(plan)} disabled={!isAdmin}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    ));
  }


  const renderPollsContent = () => {
    if(loadingPolls) return Array.from({ length: 2 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>);
    if (!polls || polls.length === 0) return <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhuma votação criada.</TableCell></TableRow>;

    return polls.map(poll => (
        <TableRow key={poll.id}>
            <TableCell className="font-medium">{poll.title}</TableCell>
            <TableCell>
                <Badge variant={poll.status === 'Aberta' ? 'default' : 'secondary'} className={poll.status === 'Aberta' ? 'bg-green-600' : ''}>
                    {poll.status}
                </Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{poll.createdAt ? format(poll.createdAt.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''}</TableCell>
            <TableCell className="text-right">
                <PollActions 
                    poll={poll} 
                    canManage={isAdmin} 
                    onSendResults={handleOpenSendResultsModal}
                    onDelete={() => setDeletingPoll(poll)}
                    onEdit={() => openEditPollModal(poll)}
                />
            </TableCell>
        </TableRow>
    ));
  }

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Sistema</h1>
        <p className="text-muted-foreground">Gerencie os planos de associação e as regras de negócio da plataforma.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>Gerenciamento de Planos e Cotas</CardTitle>
                             <CardDescription>Defina os preços e limites para cada plano. {!isAdmin && "(Apenas visualização)"}</CardDescription>
                        </div>
                        <Dialog open={isPlanCreateModalOpen} onOpenChange={setIsPlanCreateModalOpen}>
                            <DialogTrigger asChild><Button disabled={isSaving || !isAdmin} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Novo Plano</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Plano</DialogTitle>
                                    <DialogDescription>Defina o nome do novo plano. Os outros valores podem ser editados na tabela.</DialogDescription>
                                </DialogHeader>
                                <PlanForm onSave={handleCreatePlan} onCancel={() => setIsPlanCreateModalOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="p-0 md:p-6">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(!isAdmin ? 'cursor-not-allowed' : '')}>
                                    {/* Desktop Table */}
                                    <div className="border rounded-md hidden md:block">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Plano</TableHead>
                                                    <TableHead className="text-center">Preço (R$)</TableHead>
                                                    <TableHead className="text-center">Cota Semanal</TableHead>
                                                    <TableHead className="text-center">Cota Mensal</TableHead>
                                                    <TableHead className="text-center">Cota Corujão</TableHead>
                                                    <TableHead className="text-center">Cota Convites</TableHead>
                                                    <TableHead className="text-center">Peso de Voto</TableHead>
                                                    <TableHead className="text-right">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {renderPlansDesktopContent()}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {/* Mobile List */}
                                    <div className="md:hidden border rounded-md">
                                        {renderPlansMobileContent()}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            {!isAdmin && (<TooltipContent><p>Você não tem permissão para editar os planos.</p></TooltipContent>)}
                        </Tooltip>
                    </TooltipProvider>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Vote className="h-5 w-5" /> Sistema de Votação</CardTitle>
                         <Dialog open={isPollCreateModalOpen} onOpenChange={setIsPollCreateModalOpen}>
                            <DialogTrigger asChild><Button onClick={openCreatePollModal} disabled={isSaving || !isAdmin || loadingActiveUsers}><PlusCircle className="mr-2 h-4 w-4" />Nova Votação</Button></DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>{editingPoll ? 'Editar Votação' : 'Criar Nova Votação'}</DialogTitle>
                                    <DialogDescription>Preencha os detalhes e selecione os membros elegíveis.</DialogDescription>
                                </DialogHeader>
                                <PollForm 
                                    onSave={editingPoll ? handleUpdatePoll : handleCreatePoll} 
                                    onCancel={() => { setIsPollCreateModalOpen(false); setEditingPoll(null); }} 
                                    activeUsers={activeUsers || []} 
                                    defaultValues={editingPoll ?? undefined}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>Crie e gerencie as votações da associação.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table><TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Criação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{renderPollsContent()}</TableBody></Table>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileDigit className="h-5 w-5" /> Configurações Financeiras</CardTitle>
                    <CardDescription>Defina regras financeiras globais do sistema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {loadingSettings ? <Skeleton className="h-24 w-full"/> : (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="registration-fee" className="text-sm font-medium">Taxa de Inscrição (Joia)</label>
                                <Input id="registration-fee" type="number" value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} onBlur={() => handleSaveSettings('registrationFee', registrationFee)} className="text-center" disabled={!isAdmin} placeholder="0.00"/>
                                <p className="text-xs text-muted-foreground">Valor único cobrado na primeira associação.</p>
                            </div>
                             <div className="space-y-2">
                                <label htmlFor="extra-invite-price" className="text-sm font-medium">Preço do Convite Extra</label>
                                <Input id="extra-invite-price" type="number" value={extraInvitePrice} onChange={(e) => setExtraInvitePrice(e.target.value)} onBlur={() => handleSaveSettings('extraInvitePrice', extraInvitePrice)} className="text-center" disabled={!isAdmin} placeholder="0.00"/>
                                <p className="text-xs text-muted-foreground">Valor cobrado por cada convidado que exceder a cota gratuita do plano.</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      
      {/* --- Modais --- */}
      <Dialog open={!!editingPlan} onOpenChange={(isOpen) => !isOpen && setEditingPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plano: {editingPlan?.name}</DialogTitle>
            <DialogDescription>Altere o nome do plano. Os outros valores são gerenciados na tabela principal.</DialogDescription>
          </DialogHeader>
            <PlanForm onSave={(data) => handleUpdatePlan({ ...editingPlan, ...data })} onCancel={() => setEditingPlan(null)} defaultValues={editingPlan!}/>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deletingPlan} onOpenChange={(isOpen) => !isOpen && setDeletingPlan(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível. O plano "{deletingPlan?.name}" será permanentemente removido.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeletingPlan(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, excluir plano</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

        <AlertDialog open={!!deletingPoll} onOpenChange={(isOpen) => !isOpen && setDeletingPoll(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação é irreversível e excluirá a votação permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingPoll(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePoll} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      <Dialog open={isNoticeModalOpen} onOpenChange={setIsNoticeModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enviar Resultado da Votação como Aviso</DialogTitle>
                <DialogDescription>
                    Revise o texto e envie para notificar todos os membros.
                </DialogDescription>
            </DialogHeader>
            <NoticeForm 
                onSave={handleSendNotice} 
                onCancel={() => setIsNoticeModalOpen(false)} 
                defaultValues={noticeDefaultValues}
                isSubmitting={isSaving}
            />
        </DialogContent>
    </Dialog>

    </div>
  )
}

    