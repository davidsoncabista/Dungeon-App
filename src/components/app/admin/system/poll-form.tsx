
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
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import type { Poll } from "@/lib/types/poll"
import { PlusCircle, Trash2, X, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import type { User } from "@/lib/types/user"

const pollFormSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  options: z.array(z.object({ value: z.string().min(1, "A opção não pode ser vazia.") })).min(2, "São necessárias pelo menos duas opções de voto."),
  eligibleVoters: z.array(z.string()).min(1, "É necessário selecionar pelo menos um votante elegível."),
});

type PollFormValues = z.infer<typeof pollFormSchema>;

interface PollFormProps {
    onSave: (data: PollFormValues) => void;
    onCancel: () => void;
    defaultValues?: Partial<Poll>;
    activeUsers: User[];
}

export function PollForm({ onSave, onCancel, defaultValues, activeUsers }: PollFormProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      options: defaultValues?.options?.map(o => ({ value: o })) || [{ value: "" }, { value: "" }],
      eligibleVoters: defaultValues?.eligibleVoters || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });
  
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return activeUsers;
    return activeUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activeUsers]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título da Votação</FormLabel>
              <FormControl><Input placeholder="Ex: Eleição da Nova Diretoria 2025" {...field} /></FormControl>
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
              <FormControl><Textarea placeholder="Detalhe o que está sendo votado." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel>Opções de Voto</FormLabel>
          <div className="space-y-2 mt-2">
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`options.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Input {...field} placeholder={`Opção ${index + 1}`} /></FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Opção
          </Button>
           <FormMessage>{form.formState.errors.options?.root?.message}</FormMessage>
        </div>

         <FormField
            control={form.control}
            name="eligibleVoters"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Votantes Elegíveis</FormLabel>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nome ou email..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <ScrollArea className="h-40 rounded-md border">
                         <div className="p-4 space-y-2">
                             <div className="flex items-center space-x-3 p-2">
                                <Checkbox
                                    id="select-all"
                                    checked={field.value?.length === activeUsers.length}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked ? activeUsers.map(u => u.uid) : [])
                                    }}
                                />
                                <label htmlFor="select-all" className="font-semibold">Selecionar Todos</label>
                            </div>
                            {filteredUsers.map((user) => (
                                <div key={user.uid} className="flex items-center space-x-3 p-2">
                                <Checkbox
                                    id={user.uid}
                                    checked={field.value?.includes(user.uid)}
                                    onCheckedChange={(checked) => {
                                        return checked
                                        ? field.onChange([...field.value, user.uid])
                                        : field.onChange(field.value?.filter((value) => value !== user.uid))
                                    }}
                                />
                                 <label htmlFor={user.uid} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{user.name}</label>
                                </div>
                            ))}
                         </div>
                    </ScrollArea>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {defaultValues?.id ? "Salvar Alterações" : "Criar Votação"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
