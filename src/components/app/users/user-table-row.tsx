"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { getFirestore, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { app } from "@/lib/firebase"
import type { User, AdminRole } from "@/lib/types/user"

import { TableCell, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, UserCog } from "lucide-react"

import { UserForm } from "@/components/app/user-form"
import { BlockUserDialog, DeleteUserDialog, EditRoleDialog } from "./user-actions"
import { cn } from "@/lib/utils"

const roleBadgeClass: Record<AdminRole, string> = {
    Administrador: "bg-role-admin text-role-admin-foreground",
    Editor: "bg-role-editor text-role-editor-foreground",
    Revisor: "bg-role-revisor text-role-revisor-foreground",
    Membro: "hidden", // Não mostra badge para 'Membro'
    Visitante: "bg-muted text-muted-foreground",
    Convidado: "bg-blue-200 text-blue-800",
}

interface UserTableRowProps {
    user: User;
    canEdit: boolean;
    canDelete: boolean;
}

export function UserTableRow({ user, canEdit, canDelete }: UserTableRowProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const firestore = getFirestore(app);
    const { toast } = useToast();

    const handleAction = async (action: () => Promise<void>, title: string, description: string) => {
        try {
            await action();
            toast({ title, description });
        } catch (error: any) {
            console.error(`Erro ao executar ação: ${title}`, error);
            toast({
                title: "Erro de Permissão",
                description: error.message || "Não foi possível completar a ação. Verifique suas permissões.",
                variant: "destructive"
            });
        }
    };
    
    const handleEditSuccess = (data: Partial<User>) => {
        handleAction(
            () => updateDoc(doc(firestore, "users", user.uid), data),
            "Usuário Atualizado!",
            `As informações de ${user.name} foram salvas.`
        );
        setIsEditModalOpen(false);
    };

    const handleBlockUser = () => handleAction(
        () => updateDoc(doc(firestore, "users", user.uid), { status: user.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado' }),
        `Usuário ${user.status === 'Bloqueado' ? 'Desbloqueado' : 'Bloqueado'}!`,
        `${user.name} foi ${user.status === 'Bloqueado' ? 'desbloqueado' : 'bloqueado'} com sucesso.`
    );

    const handleDeleteUser = () => {
        if (!canDelete) return;
        handleAction(
            () => deleteDoc(doc(firestore, "users", user.uid)),
            "Usuário Excluído!",
            `${user.name} foi removido permanentemente do sistema.`
        );
    }

    const handleRoleChange = (newRole: AdminRole) => {
         if (!canDelete) return; // Apenas Admins podem mudar roles
        handleAction(
            () => updateDoc(doc(firestore, "users", user.uid), { role: newRole }),
            "Nível de Acesso Alterado!",
            `O nível de acesso de ${user.name} foi definido como ${newRole}.`
        );
    }

    return (
        <TableRow key={user.uid}>
            <TableCell>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person" />
                            <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">
                            <p>{user.name}</p>
                            <p className="text-sm text-muted-foreground md:hidden">{user.email}</p>
                             <div className="flex items-center gap-2 mt-1 md:hidden">
                                <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline'}>{user.category}</Badge>
                                {user.role && user.role !== 'Membro' && <Badge className={cn(roleBadgeClass[user.role])}>{user.role}</Badge>}
                            </div>
                        </div>
                    </div>
                    <div className="md:hidden">
                        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!canEdit}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Ações para {user.name}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                {canEdit && (
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                         <DialogTrigger asChild>
                                            <DropdownMenuItem onSelect={e => e.preventDefault()}><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                        </DialogTrigger>
                                        {canDelete && <EditRoleDialog user={user} onConfirm={handleRoleChange} disabled={!canDelete} />}
                                        <DropdownMenuSeparator />
                                        <BlockUserDialog user={user} onConfirm={handleBlockUser} disabled={!canEdit} />
                                        {canDelete && <DeleteUserDialog user={user} onConfirm={handleDeleteUser} disabled={!canDelete} />}
                                    </DropdownMenuContent>
                                )}
                            </DropdownMenu>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Editar Perfil de {user.name}</DialogTitle>
                                    <DialogDescription>Atualize as informações do membro abaixo.</DialogDescription>
                                </DialogHeader>
                                <UserForm onSuccess={handleEditSuccess} onCancel={() => setIsEditModalOpen(false)} isEditMode={true} defaultValues={user} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <Badge variant={user.category === 'Master' ? 'default' : user.category === 'Gamer' ? 'secondary' : 'outline' }>{user.category}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {user.role && user.role !== 'Membro' ? (
                    <Badge className={cn(roleBadgeClass[user.role])}>{user.role}</Badge>
                ) : (
                   <span className="text-muted-foreground">Membro</span>
                )}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-center">
                <Badge variant={user.status === 'Ativo' ? 'secondary' : user.status === 'Pendente' ? 'outline' : 'destructive'} className={cn({
                    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': user.status === 'Ativo',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': user.status === 'Pendente',
                    'bg-destructive/20 text-destructive dark:bg-destructive/30': user.status === 'Bloqueado',
                })}>
                  {user.status}
                </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!canEdit}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        {canEdit && (
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem onSelect={e => e.preventDefault()}><UserCog className="mr-2 h-4 w-4" />Editar Perfil</DropdownMenuItem>
                                </DialogTrigger>
                                {canDelete && <EditRoleDialog user={user} onConfirm={handleRoleChange} disabled={!canDelete}/>}
                                <DropdownMenuSeparator />
                                <BlockUserDialog user={user} onConfirm={handleBlockUser} disabled={!canEdit} />
                                {canDelete && <DeleteUserDialog user={user} onConfirm={handleDeleteUser} disabled={!canDelete} />}
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Editar Perfil de {user.name}</DialogTitle>
                            <DialogDescription>Atualize as informações do membro abaixo.</DialogDescription>
                        </DialogHeader>
                        <UserForm onSuccess={handleEditSuccess} onCancel={() => setIsEditModalOpen(false)} isEditMode={true} defaultValues={user} />
                    </DialogContent>
                </Dialog>
            </TableCell>
        </TableRow>
    );
}
