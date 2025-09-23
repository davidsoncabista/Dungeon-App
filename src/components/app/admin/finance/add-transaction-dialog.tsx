
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import type { User } from "@/lib/types/user"
import type { TransactionStatus, TransactionType } from "@/lib/types/transaction"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

const transactionFormSchema = z.object({
  userId: z.string({ required_error: "É necessário selecionar um usuário." }),
  description: z.string().min(3, { message: "A descrição deve ter pelo menos 3 caracteres." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  status: z.enum(["Pendente", "Pago", "Vencido"], { required_error: "O status é obrigatório." }),
  type: z.enum(["Mensalidade", "Avulso", "Inicial"], { required_error: "O tipo é obrigatório." }),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface AddTransactionDialogProps {
    users: User[];
    loadingUsers: boolean;
    onSave: (data: any) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function AddTransactionDialog({ users, loadingUsers, onSave, isOpen, setIsOpen }: AddTransactionDialogProps) {
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      userId: "",
      description: "",
      amount: 0,
      status: "Pendente",
      type: "Avulso",
    },
  });

  function onSubmit(data: TransactionFormValues) {
    const selectedUser = users.find(u => u.uid === data.userId);
    if (!selectedUser) return;
    
    const dataToSave = {
        ...data,
        userName: selectedUser.name, // Denormalize name for easier display
    }
    onSave(dataToSave);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Cobrança
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Criar Nova Cobrança</DialogTitle>
                <DialogDescription>
                    Gere uma nova cobrança avulsa para um membro específico.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Usuário</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger disabled={loadingUsers}>
                                        <SelectValue placeholder="Selecione um membro..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users.map(user => (
                                            <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Multa por atraso, Taxa de convidado..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor (R$)</FormLabel>
                                    <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status Inicial</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Vencido">Vencido</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Salvar Cobrança</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  )
}
