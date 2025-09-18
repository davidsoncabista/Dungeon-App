
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
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import type { Notice } from "@/lib/types/notice"

const noticeFormSchema = z.object({
  title: z.string().min(3, { message: "O título é obrigatório." }),
  description: z.string().min(10, { message: "A descrição é obrigatória." }),
  link: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
});

type NoticeFormValues = z.infer<typeof noticeFormSchema>;

interface NoticeFormProps {
    onSave: (data: NoticeFormValues) => void;
    onCancel: () => void;
    defaultValues?: Partial<Notice>;
}

export function NoticeForm({ onSave, onCancel, defaultValues }: NoticeFormProps) {
  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      link: defaultValues?.link || "",
    },
  });

  const isEditMode = !!defaultValues;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Novo Horário de Funcionamento" {...field} />
              </FormControl>
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
                <Textarea
                  placeholder="Detalhe aqui o comunicado para os membros da associação."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com/mais-informacoes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Publicar Aviso")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
