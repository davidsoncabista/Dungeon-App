"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Ban, Trash2, ShieldCheck } from "lucide-react"
import type { User, AdminRole } from "@/lib/types/user"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Modal para Bloquear/Desbloquear Usuário
export function BlockUserDialog({ user, onConfirm, disabled }: { user: User, onConfirm: () => void, disabled: boolean }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()} 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    disabled={disabled}
                >
                    <Ban className="mr-2 h-4 w-4" />
                    {user.status === 'Bloqueado' ? 'Desbloquear Usuário' : 'Bloquear Usuário'}
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {user.status === 'Bloqueado' 
                          ? `Esta ação irá restaurar o acesso de ${user.name} ao sistema.`
                          : `Esta ação impedirá que ${user.name} acesse o sistema. O usuário não poderá fazer login ou realizar reservas.`
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className={user.status !== 'Bloqueado' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
                         {user.status === 'Bloqueado' ? 'Sim, desbloquear' : 'Sim, bloquear'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Modal para Excluir Usuário
export function DeleteUserDialog({ user, onConfirm, disabled }: { user: User, onConfirm: () => void, disabled: boolean }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()} 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    disabled={disabled}
                 >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir permanentemente
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {user.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível. Todas as informações do usuário, incluindo seu histórico de reservas, serão permanentemente removidas.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Modal para Alterar Nível de Acesso
export function EditRoleDialog({ user, onConfirm, disabled }: { user: User, onConfirm: (role: AdminRole) => void, disabled: boolean }) {
    const [selectedRole, setSelectedRole] = useState(user.role || 'Membro');
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = () => {
        onConfirm(selectedRole as AdminRole);
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={disabled}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Alterar Nível de Acesso
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar Nível de Acesso de {user.name}</DialogTitle>
                    <DialogDescription>
                        Selecione o novo nível de permissão para este usuário.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="role-select">Nível de Acesso</Label>
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AdminRole)}>
                        <SelectTrigger id="role-select" className="w-full mt-2">
                            <SelectValue placeholder="Selecione um nível" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Convidado">Convidado (Novo Usuário)</SelectItem>
                            <SelectItem value="Membro">Membro</SelectItem>
                            <SelectItem value="Revisor">Revisor</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm}>Salvar Alterações</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
