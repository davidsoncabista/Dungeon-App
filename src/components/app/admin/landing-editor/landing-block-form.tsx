
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LandingPageBlock, BlockType, FeatureItem } from "@/lib/types/landing-page-block"
import { useState, useEffect, useMemo } from "react"
import { PlusCircle, Trash2, HelpCircle } from "lucide-react"
import { MarkdownEditor } from "./markdown-editor"
import { HTMLEditor } from "./html-editor"
import * as LucideIcons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// --- Schemas ---
const heroContentSchema = z.object({
  badge: z.string().min(1, "Obrigatório"),
  title: z.string().min(1, "Obrigatório"),
  subtitle: z.string().min(1, "Obrigatório"),
  buttonText: z.string().min(1, "Obrigatório"),
  buttonLink: z.string().url("URL inválida"),
  imageUrl: z.string().url("URL inválida"),
  imageAlt: z.string().min(1, "Obrigatório"),
});

const featureItemSchema = z.object({
  icon: z.string().min(1, "Obrigatório"),
  title: z.string().min(1, "Obrigatório"),
  description: z.string().min(1, "Obrigatório"),
});

const featureListContentSchema = z.object({
  title: z.string().min(1, "Obrigatório"),
  subtitle: z.string().min(1, "Obrigatório"),
  features: z.array(featureItemSchema).min(1, "Pelo menos um item é necessário"),
  layout: z.enum(['2-cols', '3-cols', '4-cols'], { required_error: "É necessário selecionar um layout." }),
});

const markdownContentSchema = z.object({
    markdown: z.string().min(1, "O conteúdo é obrigatório."),
});

const htmlContentSchema = z.object({
    html: z.string().min(1, "O conteúdo HTML é obrigatório."),
});

const separatorContentSchema = z.object({});

const formSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('hero'), title: z.string().min(1, "O título do bloco é obrigatório."), content: heroContentSchema }),
  z.object({ type: z.literal('featureList'), title: z.string().min(1, "O título do bloco é obrigatório."), content: featureListContentSchema }),
  z.object({ type: z.literal('markdown'), title: z.string().min(1, "O título do bloco é obrigatório."), content: markdownContentSchema }),
  z.object({ type: z.literal('html'), title: z.string().min(1, "O título do bloco é obrigatório."), content: htmlContentSchema }),
  z.object({ type: z.literal('separator'), title: z.string().min(1, "O título do bloco é obrigatório."), content: separatorContentSchema }),
]);

type FormValues = z.infer<typeof formSchema>;


const defaultHeroContent = {
    badge: "Associação Dungeon Belém",
    title: "Sua Guilda de RPG, Board e Card Games",
    subtitle: "O Dungeon App é o sistema oficial para gerenciamento de reservas de salas, eventos e comunicação para os membros da Associação Dungeon Belém.",
    buttonText: "Acessar o App",
    buttonLink: "http://localhost:3000/login",
    imageUrl: "https://picsum.photos/seed/hero/800/600",
    imageAlt: "Mesa de RPG com dados e miniaturas",
};

const defaultFeatureListContent = {
    title: "Funcionalidades Principais",
    subtitle: "Tudo que você precisa para organizar sua jogatina em um só lugar.",
    features: [{ icon: "CalendarDays", title: "Agenda Online", description: "Visualize a disponibilidade das salas e reserve seu horário com facilidade." }],
    layout: '3-cols' as const,
};

const defaultMarkdownContent = {
    markdown: "# Título\n\nEscreva seu conteúdo aqui...",
};

const defaultHTMLContent = {
    html: "<!-- Escreva seu código HTML aqui -->\n<div class=\"text-center\">\n  <h2 class=\"text-2xl font-bold\">Seu Título</h2>\n  <p>Seu parágrafo.</p>\n</div>",
};

const defaultSeparatorContent = {};

const getInitialValues = (defaultValues?: LandingPageBlock): Partial<FormValues> => {
    if (defaultValues) {
        return defaultValues as FormValues;
    }
    return {
        type: undefined,
        title: "",
    };
};


interface LandingBlockFormProps {
    onSave: (data: Partial<LandingPageBlock>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    defaultValues?: LandingPageBlock;
}

const IconPicker = ({ field }: { field: any }) => {
    const [open, setOpen] = useState(false);
    const iconNames = Object.keys(LucideIcons).filter(key => key.match(/^[A-Z]/));

    const Icon = (LucideIcons as any)[field.value] || HelpCircle;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <Icon className="mr-2 h-4 w-4" />
                    {field.value || "Selecione um ícone..."}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar ícone..." />
                    <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
                    <CommandGroup>
                        <ScrollArea className="h-64">
                            {iconNames.map((iconName) => {
                                const LoopIcon = (LucideIcons as any)[iconName];
                                return (
                                    <CommandItem
                                        key={iconName}
                                        value={iconName}
                                        onSelect={(currentValue) => {
                                            field.onChange(currentValue === field.value ? "" : currentValue)
                                            setOpen(false)
                                        }}
                                    >
                                        <LoopIcon className={cn("mr-2 h-4 w-4", iconName === field.value ? "opacity-100" : "opacity-50")} />
                                        {iconName}
                                    </CommandItem>
                                )
                            })}
                        </ScrollArea>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function LandingBlockForm({ onSave, onCancel, isSubmitting, defaultValues }: LandingBlockFormProps) {
  const [selectedType, setSelectedType] = useState<BlockType | undefined>(defaultValues?.type);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(defaultValues)
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: selectedType === 'featureList' ? "content.features" : undefined,
  } as any);

  useEffect(() => {
    if (defaultValues) {
        setSelectedType(defaultValues.type);
        form.reset(defaultValues as FormValues);
    }
  }, [defaultValues, form]);

  const handleTypeChange = (type: BlockType) => {
    setSelectedType(type);
    
    // Reset form with new default values for the selected type
    if (type === 'hero') {
        form.reset({ type, title: "Bloco Hero", content: defaultHeroContent });
    } else if (type === 'featureList') {
        form.reset({ type, title: "Bloco de Features", content: defaultFeatureListContent });
    } else if (type === 'markdown') {
        form.reset({ type, title: "Bloco de Texto", content: defaultMarkdownContent });
    } else if (type === 'html') {
        form.reset({ type, title: "Bloco de HTML", content: defaultHTMLContent });
    } else if (type === 'separator') {
        form.reset({ type, title: "Separador", content: defaultSeparatorContent });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <div className="p-1 pr-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo de Bloco</FormLabel>
                <Select onValueChange={(value) => handleTypeChange(value as BlockType)} defaultValue={field.value} disabled={!!defaultValues}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione um tipo..." /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="featureList">Lista de Features</SelectItem>
                    <SelectItem value="markdown">Bloco de Texto (Markdown)</SelectItem>
                    <SelectItem value="html">Bloco de HTML</SelectItem>
                    <SelectItem value="separator">Separador</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Título do Bloco</FormLabel>
                        <FormControl><Input {...field} placeholder="Ex: Seção de Boas-Vindas" /></FormControl>
                        <FormDescription className="text-xs">Usado para identificar o bloco no gerenciador.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <ScrollArea className="h-[60vh] p-1 pr-4">
            {selectedType === 'hero' && (
            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-lg">Conteúdo do Hero</h3>
                <FormField control={form.control} name="content.badge" render={({ field }) => (<FormItem><FormLabel>Badge</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription className="text-xs">Pequeno texto de destaque acima do título.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.subtitle" render={({ field }) => (<FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.buttonText" render={({ field }) => (<FormItem><FormLabel>Texto do Botão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.buttonLink" render={({ field }) => (<FormItem><FormLabel>Link do Botão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.imageUrl" render={({ field }) => (<FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription className="text-xs">Use a URL da Biblioteca de Mídia ou um serviço como Unsplash.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.imageAlt" render={({ field }) => (<FormItem><FormLabel>Texto Alternativo da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription className="text-xs">Texto descritivo para acessibilidade e SEO.</FormDescription><FormMessage /></FormItem>)} />
            </div>
            )}

            {selectedType === 'featureList' && (
            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-lg">Conteúdo da Lista de Features</h3>
                <FormField control={form.control} name="content.title" render={({ field }) => (<FormItem><FormLabel>Título da Seção</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.subtitle" render={({ field }) => (<FormItem><FormLabel>Subtítulo da Seção</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.layout" render={({ field }) => (<FormItem><FormLabel>Layout</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="2-cols">2 Colunas</SelectItem><SelectItem value="3-cols">3 Colunas</SelectItem><SelectItem value="4-cols">4 Colunas</SelectItem></SelectContent></Select><FormDescription className="text-xs">Define como as funcionalidades serão exibidas em telas grandes.</FormDescription><FormMessage /></FormItem>)} />
                
                <div className="space-y-4">
                <FormLabel>Painel de Funcionalidades</FormLabel>
                {fields.map((item, index) => {
                    return (
                        <Card key={item.id} className="relative overflow-hidden">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4"/>
                                <span className="sr-only">Remover feature</span>
                            </Button>
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                <div className="md:col-span-1 flex flex-col items-center gap-2 text-center">
                                    <FormField
                                        control={form.control}
                                        name={`content.features.${index}.icon`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Ícone</FormLabel>
                                                <FormControl>
                                                    <IconPicker field={field} />
                                                </FormControl>
                                                <FormDescription className="text-xs">Ícone de Lucide-React.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                     <FormField
                                        control={form.control}
                                        name={`content.features.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Título do Item</FormLabel>
                                                <FormControl><Input {...field} placeholder="Título da Funcionalidade" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name={`content.features.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                 <FormLabel>Descrição do Item</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="Descreva a funcionalidade." rows={3}/></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                <Button type="button" variant="outline" onClick={() => append({ icon: "CheckCircle", title: "", description: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Funcionalidade
                </Button>
                </div>
            </div>
            )}
            
            {selectedType === 'markdown' && (
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="font-semibold text-lg">Conteúdo (Markdown)</h3>
                    <FormField
                        control={form.control}
                        name="content.markdown"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Editor</FormLabel>
                                <FormControl>
                                    <MarkdownEditor value={field.value} onChange={field.onChange} />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Use a sintaxe Markdown para formatar o texto. A barra de ferramentas pode ajudar.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
            
            {selectedType === 'html' && (
                <div className="space-y-4 p-4 border rounded-md">
                    <h3 className="font-semibold text-lg">Conteúdo (HTML)</h3>
                    <FormField
                        control={form.control}
                        name="content.html"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Editor de HTML</FormLabel>
                                <FormControl>
                                    <HTMLEditor value={field.value} onChange={field.onChange} />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Insira seu código HTML. Cuidado: conteúdo malformado pode quebrar a página.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}

            {selectedType === 'separator' && (
                <div className="p-4 text-center text-muted-foreground">
                    <p>Este bloco adicionará uma linha separadora ornamental.</p>
                    <p className="text-sm">Nenhuma configuração adicional é necessária.</p>
                </div>
            )}
        </ScrollArea>

        <DialogFooter className="sticky bottom-0 bg-background pt-4 px-1 pr-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Bloco"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
