
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
  z.object({ type: z.literal('hero'), content: heroContentSchema }),
  z.object({ type: z.literal('featureList'), content: featureListContentSchema }),
  z.object({ type: z.literal('markdown'), content: markdownContentSchema }),
  z.object({ type: z.literal('html'), content: htmlContentSchema }),
  z.object({ type: z.literal('separator'), content: separatorContentSchema }),
]);

type FormValues = z.infer<typeof formSchema>;


const defaultHeroContent = {
    badge: "",
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "http://",
    imageUrl: "https://",
    imageAlt: "",
};

const defaultFeatureListContent = {
    title: "",
    subtitle: "",
    features: [{ icon: "", title: "", description: "" }],
    layout: '3-cols' as const,
};

const defaultMarkdownContent = {
    markdown: "# Título\n\nEscreva seu conteúdo aqui...",
};

const defaultHTMLContent = {
    html: "<!-- Escreva seu código HTML aqui -->\n<div class=\"text-center\">\n  <h2 class=\"text-2xl font-bold\">Seu Título</h2>\n  <p>Seu parágrafo.</p>\n</div>",
};

const defaultSeparatorContent = {};


interface LandingBlockFormProps {
    onSave: (data: Partial<LandingPageBlock>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    defaultValues?: LandingPageBlock;
}

const IconPreview = ({ iconName }: { iconName: string }) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-8 w-8 text-primary" /> : <HelpCircle className="h-8 w-8 text-muted-foreground" />;
};


export function LandingBlockForm({ onSave, onCancel, isSubmitting, defaultValues }: LandingBlockFormProps) {
  const [selectedType, setSelectedType] = useState<BlockType | undefined>(defaultValues?.type);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ? (defaultValues as FormValues) : undefined,
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
        form.reset({ type, content: defaultHeroContent });
    } else if (type === 'featureList') {
        form.reset({ type, content: defaultFeatureListContent });
    } else if (type === 'markdown') {
        form.reset({ type, content: defaultMarkdownContent });
    } else if (type === 'html') {
        form.reset({ type, content: defaultHTMLContent });
    } else if (type === 'separator') {
        form.reset({ type, content: defaultSeparatorContent });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <div className="p-1 pr-4">
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
        </div>
        
        <ScrollArea className="h-[60vh] p-1 pr-4">
            {selectedType === 'hero' && (
            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-lg">Conteúdo do Hero</h3>
                <FormField control={form.control} name="content.badge" render={({ field }) => (<FormItem><FormLabel>Badge</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Pequeno texto de destaque acima do título.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.subtitle" render={({ field }) => (<FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.buttonText" render={({ field }) => (<FormItem><FormLabel>Texto do Botão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.buttonLink" render={({ field }) => (<FormItem><FormLabel>Link do Botão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.imageUrl" render={({ field }) => (<FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Use um serviço como Unsplash ou Picsum Photos.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.imageAlt" render={({ field }) => (<FormItem><FormLabel>Texto Alternativo da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Texto descritivo para acessibilidade e SEO.</FormDescription><FormMessage /></FormItem>)} />
            </div>
            )}

            {selectedType === 'featureList' && (
            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-lg">Conteúdo da Lista de Features</h3>
                <FormField control={form.control} name="content.title" render={({ field }) => (<FormItem><FormLabel>Título da Seção</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.subtitle" render={({ field }) => (<FormItem><FormLabel>Subtítulo da Seção</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="content.layout" render={({ field }) => (<FormItem><FormLabel>Layout</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="2-cols">2 Colunas</SelectItem><SelectItem value="3-cols">3 Colunas</SelectItem><SelectItem value="4-cols">4 Colunas</SelectItem></SelectContent></Select><FormDescription>Define como as funcionalidades serão exibidas em telas grandes.</FormDescription><FormMessage /></FormItem>)} />
                
                <div className="space-y-4">
                <FormLabel>Painel de Funcionalidades</FormLabel>
                {fields.map((item, index) => {
                    const iconValue = form.watch(`content.features.${index}.icon`);
                    return (
                        <Card key={item.id} className="relative overflow-hidden">
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4"/>
                                <span className="sr-only">Remover feature</span>
                            </Button>
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                <div className="md:col-span-1 flex flex-col items-center gap-2 text-center">
                                    <div className="h-10 w-10 flex items-center justify-center">
                                        <IconPreview iconName={iconValue} />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name={`content.features.${index}.icon`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormControl>
                                                    <Input {...field} placeholder="Ícone (Lucide)" className="text-center" />
                                                </FormControl>
                                                <FormDescription className="text-xs">Ex: CheckCircle</FormDescription>
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
                                                <FormLabel className="sr-only">Título do Item</FormLabel>
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
                                                 <FormLabel className="sr-only">Descrição do Item</FormLabel>
                                                <FormControl><Textarea {...field} placeholder="Descreva a funcionalidade em uma ou duas frases." rows={3}/></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                <Button type="button" variant="outline" onClick={() => append({ icon: "", title: "", description: "" })}>
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
                                <FormDescription>
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
                                <FormDescription>
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
                    <p>Este bloco adicionará uma linha separadora horizontal.</p>
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
