
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
import type { UserCategory, UserStatus, User, GameType } from "@/lib/types/user"
import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { Timestamp } from "firebase/firestore"
import { ptBR } from "date-fns/locale"

const gameTypes: { id: GameType; label: string }[] = [
  { id: 'RPG', label: 'RPG de Mesa' },
  { id: 'Board Game', label: 'Board Game' },
  { id: 'Card Game', label: 'Card Game' },
] as const;


const userFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  category: z.enum(["Player", "Gamer", "Master", "Visitante"], { required_error: "A categoria é obrigatória." }),
  status: z.enum(["Ativo", "Pendente", "Bloqueado"], { required_error: "O status é obrigatório." }),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  birthdate: z.date().optional().nullable(),
  createdAt: z.date().optional().nullable(), // Campo para "Membro desde"
  gameTypes: z.array(z.string()).optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const categories: { value: UserCategory; label: string }[] = [
    { value: "Player", label: "Player" },
    { value: "Gamer", label: "Gamer" },
    { value: "Master", label: "Master" },
    { value: "Visitante", label: "Visitante" },
];

const statuses: { value: UserStatus; label: string }[] = [
    { value: "Ativo", label: "Ativo" },
    { value: "Pendente", label: "Pendente" },
    { value: "Bloqueado", label: "Bloqueado" },
];

interface UserFormProps {
    onSuccess: (data: Partial<User>) => void;
    onCancel: () => void;
    isEditMode?: boolean;
    defaultValues?: Partial<User>;
}

export function UserForm({ onSuccess, onCancel, isEditMode = false, defaultValues }: UserFormProps) {
  const [isBirthdateCalendarOpen, setIsBirthdateCalendarOpen] = useState(false);
  const [isCreatedAtCalendarOpen, setIsCreatedAtCalendarOpen] = useState(false);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      category: defaultValues?.category || "Player",
      status: defaultValues?.status || "Pendente",
      nickname: defaultValues?.nickname || "",
      phone: defaultValues?.phone || "",
      birthdate: defaultValues?.birthdate ? parseISO(defaultValues.birthdate) : null,
      createdAt: defaultValues?.createdAt instanceof Timestamp ? defaultValues.createdAt.toDate() : (defaultValues?.createdAt || null),
      gameTypes: defaultValues?.gameTypes || []
    },
  });

  useEffect(() => {
    if (isEditMode && defaultValues) {
        form.reset({
            ...defaultValues,
            nickname: defaultValues.nickname || "",
            phone: defaultValues.phone || "",
            birthdate: defaultValues.birthdate ? parseISO(defaultValues.birthdate) : null,
            createdAt: defaultValues.createdAt instanceof Timestamp ? defaultValues.createdAt.toDate() : (defaultValues.createdAt || null),
        })
    }
  }, [isEditMode, defaultValues, form])

  function onSubmit(data: UserFormValues) {
    const dataToSave: Partial<User> = {
      name: data.name,
      email: data.email,
      category: data.category,
      status: data.status,
      gameTypes: data.gameTypes || [],
      nickname: data.nickname || null,
      phone: data.phone || null,
      birthdate: data.birthdate ? format(data.birthdate, 'yyyy-MM-dd') : null,
      createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : null,
    };
    onSuccess(dataToSave as Partial<User>);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido</FormLabel>
                  <FormControl><Input placeholder="Como a galera o conhece?" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="(91) 99999-9999" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento</FormLabel>
                    <Popover open={isBirthdateCalendarOpen} onOpenChange={setIsBirthdateCalendarOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                            ) : (
                                <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={(date) => {
                              field.onChange(date);
                              setIsBirthdateCalendarOpen(false);
                            }}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Membro Desde</FormLabel>
                     <Popover open={isCreatedAtCalendarOpen} onOpenChange={setIsCreatedAtCalendarOpen}>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                            ) : (
                                <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            locale={ptBR}
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={(date) => {
                                field.onChange(date);
                                setIsCreatedAtCalendarOpen(false);
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
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
        <FormField
            control={form.control}
            name="gameTypes"
            render={() => (
                <FormItem>
                    <FormLabel>Preferências de Jogo</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {gameTypes.map((item) => (
                        <FormField
                        key={item.id}
                        control={form.control}
                        name="gameTypes"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={item.id}
                                className="flex flex-row items-center space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                            (value) => value !== item.id
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {item.label}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
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
