
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
import type { LandingPageBlock, BlockType } from "@/lib/types/landing-page-block"
import { useState, useEffect } from "react"
import { PlusCircle, Trash2 } from "lucide-react"

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
  layout: z.enum(['2-cols', '3-cols', '4-cols']),
});

const baseSchema = z.object({
  type: z.enum(['hero', 'featureList']), // Expandir quando houver mais tipos
});

const formSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('hero'), content: heroContentSchema }),
  z.object({ type: z.literal('featureList'), content: featureListContentSchema }),
]);

type FormValues = z.infer<typeof formSchema>;

interface LandingBlockFormProps {
    onSave: (data: Partial<LandingPageBlock>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    defaultValues?: LandingPageBlock;
}

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
    form.setValue("type", type);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
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
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedType === 'hero' && (
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold text-lg">Conteúdo do Hero</h3>
            <FormField control={form.control} name="content.badge" render={({ field }) => (<FormItem><FormLabel>Badge</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.title" render={({ field }) => (<FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.subtitle" render={({ field }) => (<FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.buttonText" render={({ field }) => (<FormItem><FormLabel>Texto do Botão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.buttonLink" render={({ field }) => (<FormItem><FormLabel>Link do Botão</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.imageUrl" render={({ field }) => (<FormItem><FormLabel>URL da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.imageAlt" render={({ field }) => (<FormItem><FormLabel>Texto Alternativo da Imagem</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        )}

        {selectedType === 'featureList' && (
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold text-lg">Conteúdo da Lista de Features</h3>
            <FormField control={form.control} name="content.title" render={({ field }) => (<FormItem><FormLabel>Título da Seção</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.subtitle" render={({ field }) => (<FormItem><FormLabel>Subtítulo da Seção</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content.layout" render={({ field }) => (<FormItem><FormLabel>Layout</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="2-cols">2 Colunas</SelectItem><SelectItem value="3-cols">3 Colunas</SelectItem><SelectItem value="4-cols">4 Colunas</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            
            <div className="space-y-4">
              <FormLabel>Features</FormLabel>
              {fields.map((item, index) => (
                <div key={item.id} className="space-y-2 p-3 border rounded-md relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                    <FormField control={form.control} name={`content.features.${index}.icon`} render={({ field }) => (<FormItem><FormLabel>Ícone</FormLabel><FormControl><Input {...field} placeholder="Nome do ícone (Lucide)" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`content.features.${index}.title`} render={({ field }) => (<FormItem><FormLabel>Título do Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`content.features.${index}.description`} render={({ field }) => (<FormItem><FormLabel>Descrição do Item</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ icon: "", title: "", description: "" })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Feature
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter className="sticky bottom-0 bg-background pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Bloco"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
