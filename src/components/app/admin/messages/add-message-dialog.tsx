
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import type { User } from "@/lib/types/user"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"

const messageCategories = ['aviso', 'advertencia', 'bloqueio', 'multa'] as const;

const messageFormSchema = z.object({
  recipientId: z.string({ required_error: "É necessário selecionar um usuário." }),
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }),
  content: z.string().min(10, { message: "A mensagem deve ter pelo menos 10 caracteres." }),
  category: z.enum(messageCategories, { required_error: "A categoria é obrigatória." }),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

interface AddMessageDialogProps {
    users: User[];
    loadingUsers: boolean;
    onSave: (data: MessageFormValues) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function AddMessageDialog({ users, loadingUsers, onSave, isOpen, setIsOpen }: AddMessageDialogProps) {
  
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipientId: "",
      title: "",
      content: "",
      category: "aviso",
    },
  });

  function onSubmit(data: MessageFormValues) {
    onSave(data);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Mensagem
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Enviar Nova Mensagem</DialogTitle>
                <DialogDescription>
                    Escreva uma mensagem privada para um membro específico.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="recipientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Destinatário</FormLabel>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Assunto da mensagem" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="aviso">Aviso</SelectItem>
                                    <SelectItem value="advertencia">Advertência</SelectItem>
                                    <SelectItem value="bloqueio">Notificação de Bloqueio</SelectItem>
                                    <SelectItem value="multa">Notificação de Multa</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Conteúdo da Mensagem</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Escreva a mensagem detalhada aqui..."
                                        className="min-h-[120px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  )
}
