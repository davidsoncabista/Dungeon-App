
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
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
import { DialogFooter } from "@/components/ui/dialog"
import type { AccessRule } from "@/lib/types/accessRule"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const appRoutes = [
    { label: 'Dashboard', value: '/' },
    { label: 'Minhas Reservas', value: '/my-bookings' },
    { label: 'Agenda Online', value: '/online-schedule' },
    { label: 'Salas', value: '/rooms' },
    { label: 'Mural de Avisos', value: '/notices' },
    { label: 'Votação', value: '/voting' },
    { label: 'Estatísticas', value: '/statistics' },
    { label: 'Cobranças / Matrícula', value: '/billing' },
    { label: 'Mensagens', value: '/messages' },
    { label: 'Usuários', value: '/users' },
    { label: 'Meu Perfil', value: '/profile' },
    { label: '--- Admin ---', value: 'disabled', disabled: true },
    { label: 'Admin: Visão Geral', value: '/admin' },
    { label: 'Admin: Regras de Acesso', value: '/admin/access-rules' },
    { label: 'Admin: Financeiro', value: '/admin/finance' },
    { label: 'Admin: Mensagens', value: '/admin/messages' },
    { label: 'Admin: Sistema', value: '/admin/system' },
];


const AccessRuleFormSchema = z.object({
  id: z.string().min(3, "O ID deve ter pelo menos 3 caracteres.").regex(/^[A-Z][a-zA-Z]*$/, "O ID deve começar com letra maiúscula e conter apenas letras (PascalCase)."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  pages: z.array(z.string().min(1, "É necessário selecionar uma página.")).min(1, "É necessária pelo menos uma página."),
});

type FormValues = z.infer<typeof AccessRuleFormSchema>;

interface AccessRuleFormProps {
    onSave: (data: AccessRule) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    defaultValues?: AccessRule;
}

export function AccessRuleForm({ onSave, onCancel, isSubmitting, defaultValues }: AccessRuleFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(AccessRuleFormSchema),
    defaultValues: {
      id: defaultValues?.id || "",
      description: defaultValues?.description || "",
      pages: defaultValues?.pages || [""],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pages"
  });

  const onSubmit = (data: FormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID da Regra</FormLabel>
              <FormControl>
                <Input placeholder="Ex: ModeradorDeConteudo" {...field} disabled={!!defaultValues} />
              </FormControl>
              <FormDescription>Identificador único. Não pode ser alterado após a criação.</FormDescription>
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
                <Textarea placeholder="Descreva o que este nível de acesso pode fazer." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel>Páginas Acessíveis</FormLabel>
          <div className="space-y-2 mt-2">
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`pages.${index}`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma página..." />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {appRoutes.map(route => (
                                <SelectItem key={route.value} value={route.value} disabled={route.disabled}>
                                    {route.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
           <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append("")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Página
          </Button>
          <FormMessage>{form.formState.errors.pages?.root?.message}</FormMessage>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Regra"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
