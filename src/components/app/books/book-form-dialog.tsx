"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"

// Esquema de validação para um item da biblioteca
const bookItemSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição é obrigatória."),
  actionText: z.string().min(3, "O texto do botão é obrigatório."),
  actionLink: z.string().url("Por favor, insira uma URL válida."),
});

type BookFormValues = z.infer<typeof bookItemSchema>;

interface BookFormDialogProps {
  onSave: (data: BookFormValues) => void;
  children: React.ReactNode;
  defaultValues?: Partial<BookFormValues>;
}

export function BookFormDialog({ onSave, children, defaultValues }: BookFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookItemSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      actionText: "Acessar",
      actionLink: "https://",
    },
  });

  const isEditMode = !!defaultValues;

  const handleSubmit = (data: BookFormValues) => {
    onSave(data);
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Conteúdo" : "Adicionar Novo Conteúdo"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do item que será exibido na Biblioteca.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Card</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Maze Tracker v2" {...field} />
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
                  <FormLabel>Descrição (suporta HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="<p>Uma ferramenta para...</p><ul><li>Feature 1</li></ul>"
                      className="min-h-[150px] font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="actionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto do Botão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Acessar Ferramenta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actionLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link de Destino do Botão</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{isEditMode ? "Salvar Alterações" : "Adicionar Conteúdo"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
