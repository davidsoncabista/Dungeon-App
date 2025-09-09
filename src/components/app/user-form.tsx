
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
import { DialogFooter } from "@/components/ui/dialog"
import type { UserCategory, UserStatus, User } from "@/lib/types/user"
import { useEffect } from "react"

const userFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  category: z.enum(["Player", "Gamer", "Master"], { required_error: "A categoria é obrigatória." }),
  status: z.enum(["Ativo", "Pendente", "Bloqueado"], { required_error: "O status é obrigatório." }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const categories: { value: UserCategory; label: string }[] = [
    { value: "Player", label: "Player" },
    { value: "Gamer", label: "Gamer" },
    { value: "Master", label: "Master" },
];

const statuses: { value: UserStatus; label: string }[] = [
    { value: "Ativo", label: "Ativo" },
    { value: "Pendente", label: "Pendente" },
    { value: "Bloqueado", label: "Bloqueado" },
];

interface UserFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    isEditMode?: boolean;
    defaultValues?: Partial<User>;
}

export function UserForm({ onSuccess, onCancel, isEditMode = false, defaultValues }: UserFormProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      category: "Player",
      status: "Pendente",
      ...defaultValues
    },
  });

  useEffect(() => {
    if (isEditMode && defaultValues) {
        form.reset(defaultValues)
    }
  }, [isEditMode, defaultValues, form])

  function onSubmit(data: UserFormValues) {
    console.log("User data submitted:", data);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Frodo Bolseiro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço de E-mail</FormLabel>
              <FormControl>
                <Input placeholder="membro@adbelem.com" {...field} disabled={isEditMode} />
              </FormControl>
              {isEditMode && <FormDescription>O e-mail não pode ser alterado.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                     {statuses.map(stat => (
                        <SelectItem key={stat.value} value={stat.value}>{stat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{isEditMode ? "Salvar Alterações" : "Salvar Usuário"}</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
