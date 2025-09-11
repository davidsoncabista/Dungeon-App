
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { app, auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { getFirestore, doc, updateDoc } from "firebase/firestore"
import { useDocumentData } from "react-firebase-hooks/firestore"
import type { User } from "@/lib/types/user"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"

const gameTypes = [
  { id: 'RPG', label: 'RPG de Mesa' },
  { id: 'Board Game', label: 'Board Game' },
  { id: 'Card Game', label: 'Card Game' },
] as const;


const profileFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthdate: z.date().optional(),
  socialMedia: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  gameTypes: z.array(z.string()).optional(),
});


export default function ProfilePage() {
  const [user, loadingAuth] = useAuthState(auth);
  const { toast } = useToast();

  const firestore = getFirestore(app);
  const userDocRef = user ? doc(firestore, "users", user.uid) : null;
  const [appUser, loadingUser, userError] = useDocumentData<User>(userDocRef);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    // Sync form with updated Firestore data, converting null to empty string for inputs
    values: appUser ? {
        name: appUser.name,
        nickname: appUser.nickname || "",
        phone: appUser.phone || "",
        cpf: appUser.cpf || "",
        rg: appUser.rg || "",
        birthdate: appUser.birthdate ? parseISO(appUser.birthdate) : undefined,
        socialMedia: appUser.socialMedia || "",
        gameTypes: appUser.gameTypes || [],
    } : {
        name: user?.displayName || "",
        nickname: "",
        phone: "",
        cpf: "",
        rg: "",
        birthdate: undefined,
        socialMedia: "",
        gameTypes: [],
    }
  });

  const onSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    if (!userDocRef) return;
    try {
      const dataToSave = {
        name: data.name,
        gameTypes: data.gameTypes || [],
        nickname: data.nickname || null,
        phone: data.phone || null,
        cpf: data.cpf || null,
        rg: data.rg || null,
        birthdate: data.birthdate ? format(data.birthdate, 'yyyy-MM-dd') : null,
        socialMedia: data.socialMedia || null,
      };

      await updateDoc(userDocRef, dataToSave);
      toast({
        title: "Sucesso!",
        description: "Suas informações foram atualizadas.",
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro!",
        description: "Não foi possível salvar suas alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateAvatar = () => {
    toast({
        title: "Em breve!",
        description: "A funcionalidade de upload de imagem será implementada em breve.",
        variant: "default",
      })
  }

  if (loadingAuth || loadingUser) {
    return (
        <div className="grid gap-8">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-32" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
                 <div className="md:col-span-1">
                    <Card>
                        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                             <Skeleton className="h-32 w-32 rounded-full" />
                             <Skeleton className="h-10 w-32" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
  }

  if (!user || userError) {
    return <p>Erro ao carregar seu perfil. Por favor, tente novamente.</p>
  }


  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais, de jogo e de associação.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Estes dados são usados para identificação e comunicação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apelido (Opcional)</FormLabel>
                      <FormControl><Input placeholder="Como a galera te conhece?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl><Input type="email" value={user.email || ""} disabled /></FormControl>
                        <FormDescription className="text-xs">O e-mail não pode ser alterado.</FormDescription>
                    </FormItem>
                     <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone (Opcional)</FormLabel>
                          <FormControl><Input placeholder="(91) 99999-9999" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data de Nascimento</FormLabel>
                        <Popover>
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
                                    format(field.value, "PPP")
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
                                selected={field.value}
                                onSelect={field.onChange}
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
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferências de Jogo</CardTitle>
                    <CardDescription>Nos diga o que você mais gosta de jogar!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="socialMedia"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Rede Social (Opcional)</FormLabel>
                            <FormControl><Input placeholder="Link para seu perfil (Instagram, etc.)" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="gameTypes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quais tipos de jogo você curte?</FormLabel>
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
                </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Documentos (Opcional)</CardTitle>
                <CardDescription>Necessário para membros associados. Seus dados estão seguros.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl><Input placeholder="00.000.000-0" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
            </div>
          </div>
          
          <div className="md:col-span-1">
              <Card>
                  <CardHeader>
                      <CardTitle>Foto de Perfil</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                      <Avatar className="h-32 w-32">
                          <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Avatar'} data-ai-hint="person" />
                          <AvatarFallback>{(user.displayName || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" onClick={handleUpdateAvatar}>Alterar Foto</Button>
                  </CardContent>
              </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}

    