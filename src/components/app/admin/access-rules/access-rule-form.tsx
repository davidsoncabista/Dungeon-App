
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

const AccessRuleFormSchema = z.object({
  id: z.string().min(3, "O ID deve ter pelo menos 3 caracteres.").regex(/^[A-Z][a-zA-Z]*$/, "O ID deve começar com letra maiúscula e conter apenas letras (PascalCase)."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  pages: z.array(z.object({ value: z.string().min(1, "O nome da página não pode ser vazio.") })).min(1, "É necessária pelo menos uma página."),
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
      pages: defaultValues?.pages?.map(p => ({ value: p })) || [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pages"
  });

  const onSubmit = (data: FormValues) => {
    onSave({
      ...data,
      pages: data.pages.map(p => p.value),
    });
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
                name={`pages.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Input {...field} placeholder="Ex: /admin/dashboard" />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
           <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
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
