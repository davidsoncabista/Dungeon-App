
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
import { DialogFooter } from "@/components/ui/dialog"
import type { AccessRule, AccessPermission } from "@/lib/types/accessRule"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

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
  id: z.string(),
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  pages: z.record(z.enum(["editor", "revisor"])).refine(obj => Object.keys(obj).length > 0, {
    message: "É necessário conceder acesso a pelo menos uma página."
  }),
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
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      pages: defaultValues?.pages || {},
    },
  });

  const onSubmit = (data: FormValues) => {
    // Transforma o título em um ID camelCase se for uma nova regra
    const id = defaultValues?.id || data.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').replace(/^(.)/, (c) => c.toLowerCase());
    onSave({ ...data, id } as AccessRule);
  };
  
  const handlePageAccessChange = (pageValue: string, checked: boolean | 'indeterminate') => {
      const currentPages = form.getValues('pages');
      if (checked) {
          form.setValue(`pages.${pageValue}`, 'revisor', { shouldValidate: true });
      } else {
          const { [pageValue]: _, ...newPages } = currentPages;
          form.setValue('pages', newPages, { shouldValidate: true });
      }
  };
  
  const handlePermissionChange = (pageValue: string, permission: AccessPermission) => {
      form.setValue(`pages.${pageValue}`, permission, { shouldValidate: true });
  };
  
  const watchedPages = form.watch('pages');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Título da Regra</FormLabel>
                <FormControl>
                <Input placeholder="Ex: Moderador de Conteúdo" {...field} />
                </FormControl>
                <FormDescription className="text-xs">O nome amigável que será exibido na lista.</FormDescription>
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
        
        <FormItem>
            <FormLabel>Permissões de Página</FormLabel>
            <FormDescription>Marque as páginas que este nível pode acessar e defina a permissão.</FormDescription>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
                {appRoutes.map((route) =>
                    route.type === 'separator' ? (
                        <div key={route.label} className="my-2 border-t pt-2 text-sm font-semibold text-muted-foreground">{route.label}</div>
                    ) : (
                        <div key={route.value} className={cn("flex flex-col space-y-2 rounded-lg p-2 transition-colors", watchedPages[route.value] ? 'bg-muted' : '')}>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id={route.value}
                                    checked={!!watchedPages[route.value]}
                                    onCheckedChange={(checked) => handlePageAccessChange(route.value, checked)}
                                />
                                <label htmlFor={route.value} className="font-medium text-sm flex-1 cursor-pointer">{route.label}</label>
                            </div>
                            {watchedPages[route.value] && (
                                <RadioGroup
                                    value={watchedPages[route.value]}
                                    onValueChange={(permission) => handlePermissionChange(route.value, permission as AccessPermission)}
                                    className="flex items-center space-x-4 pl-8"
                                >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="revisor" id={`${route.value}-revisor`} /></FormControl>
                                        <FormLabel htmlFor={`${route.value}-revisor`} className="font-normal cursor-pointer">Apenas Ver</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="editor" id={`${route.value}-editor`} /></FormControl>
                                        <FormLabel htmlFor={`${route.value}-editor`} className="font-normal cursor-pointer">Pode Editar</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            )}
                        </div>
                    )
                )}
            </ScrollArea>
            <FormMessage>{form.formState.errors.pages?.message}</FormMessage>
        </FormItem>
        
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
