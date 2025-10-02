
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
import { PlusCircle } from "lucide-react"
import { Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const appRoutes = [
    { label: 'Dashboard', value: '/online-schedule' },
    { label: 'Minhas Reservas', value: '/my-bookings' },
    { label: 'Mural de Avisos', value: '/notices' },
    { label: 'Votação', value: '/voting' },
    { label: 'Estatísticas', value: '/statistics' },
    { label: 'Cobranças / Matrícula', value: '/billing' },
    { label: 'Mensagens', value: '/messages' },
    { label: 'Usuários', value: '/users' },
    { label: 'Meu Perfil', value: '/profile' },
    { type: 'separator', label: '--- Admin ---' },
    { label: 'Admin: Visão Geral', value: '/admin' },
    { label: 'Admin: Regras de Acesso', value: '/admin/access-rules' },
    { label: 'Admin: Financeiro', value: '/admin/finance' },
    { label: 'Admin: Mensagens', value: '/admin/messages' },
    { label: 'Admin: Sistema', value: '/admin/system' },
    { label: 'Admin: Salas', value: '/admin/rooms'},
    { label: 'Admin: Editor Landing Page', value: '/admin/landing-editor'},
    { label: 'Admin: Log de Auditoria', value: '/admin/audit-log'}
];


const AccessRuleFormSchema = z.object({
  id: z.string().min(3, "O ID deve ter pelo menos 3 caracteres.").regex(/^[A-Z][a-zA-Z]*$/, "O ID deve começar com letra maiúscula e conter apenas letras (PascalCase)."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  pages: z.array(z.string()).min(1, "É necessário selecionar pelo menos uma página."),
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
      pages: defaultValues?.pages || [],
    },
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
        
        <FormField
          control={form.control}
          name="pages"
          render={() => (
            <FormItem>
                <FormLabel>Páginas Acessíveis</FormLabel>
                <ScrollArea className="h-48 w-full rounded-md border p-4">
                    {appRoutes.map((route) =>
                        route.type === 'separator' ? (
                            <div key={route.label} className="my-2 border-t pt-2 text-sm font-semibold text-muted-foreground">{route.label}</div>
                        ) : (
                            <FormField
                                key={route.value}
                                control={form.control}
                                name="pages"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={route.value}
                                    className="flex flex-row items-center space-x-3 space-y-0 py-1"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(route.value)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), route.value])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== route.value
                                                )
                                            )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {route.label}
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                        )
                    )}
                </ScrollArea>
                <FormMessage />
            </FormItem>
          )}
        />
        
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
