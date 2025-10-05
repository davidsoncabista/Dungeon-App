
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
import type { Poll, PollDescriptionItem } from "@/lib/types/poll"
import { PlusCircle, Trash2, X, Search, GripVertical } from "lucide-react"
import { useMemo, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import type { User } from "@/lib/types/user"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const pollDescriptionItemSchema = z.object({
  type: z.enum(['text', 'member_profile']),
  title: z.string().min(1, "O título do item é obrigatório."),
  description: z.string().min(1, "A descrição do item é obrigatória."),
  memberId: z.string().optional(),
});

const pollFormSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  description: z.array(pollDescriptionItemSchema).min(1, "É necessário adicionar pelo menos um item à descrição."),
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
      description: defaultValues?.description || [{ type: 'text', title: '', description: '' }],
      options: defaultValues?.options?.map(o => ({ value: o })) || [{ value: "" }, { value: "" }],
      eligibleVoters: defaultValues?.eligibleVoters || [],
    },
  });

  const { fields: descriptionFields, append: appendDescription, remove: removeDescription } = useFieldArray({
    control: form.control,
    name: "description",
  });
  
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options",
  });
  
  const filteredUsers = useMemo(() => {
    if (!activeUsers) return [];
    if (!searchTerm) return activeUsers;
    return activeUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
        
        <div>
            <FormLabel>Descrição da Votação</FormLabel>
            <FormDescription>Adicione itens para descrever as propostas ou candidatos.</FormDescription>
            <div className="space-y-2 mt-2 border rounded-md p-4">
                {descriptionFields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-lg space-y-3 bg-muted/50 relative">
                        <FormField
                            control={form.control}
                            name={`description.${index}.title`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título do Item</FormLabel>
                                    <FormControl><Input {...field} placeholder="Ex: Chapa 'Aventura Unida'" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`description.${index}.description`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição do Item</FormLabel>
                                    <FormControl><Textarea {...field} placeholder="Descreva a proposta ou o candidato." /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`description.${index}.memberId`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Associar Membro (Opcional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um membro para exibir o perfil..."/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {activeUsers.map(user => (
                                                <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Se selecionado, a foto e nome do membro aparecerão neste item.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeDescription(index)} disabled={descriptionFields.length <= 1}>
                           <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendDescription({ type: 'text', title: '', description: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                </Button>
                <FormMessage>{form.formState.errors.description?.root?.message}</FormMessage>
            </div>
        </div>

        <div>
          <FormLabel>Opções de Voto</FormLabel>
          <div className="space-y-2 mt-2">
            {optionFields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`options.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Input {...field} placeholder={`Opção ${index + 1}`} /></FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)} disabled={optionFields.length <= 2}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendOption({ value: "" })}>
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
                        <Input placeholder="Buscar por nome, email ou apelido..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                                        ? field.onChange([...(field.value || []), user.uid])
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
