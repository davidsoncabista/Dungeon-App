
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
import { DialogFooter } from "@/components/ui/dialog"
import type { Plan } from "@/lib/types/plan"

const planFormSchema = z.object({
  name: z.string().min(3, { message: "O nome do plano deve ter pelo menos 3 caracteres." }),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormProps {
    onSave: (data: PlanFormValues) => void;
    onCancel: () => void;
    defaultValues?: Partial<Plan>;
}

export function PlanForm({ onSave, onCancel, defaultValues }: PlanFormProps) {
  
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
    },
  });

  function onSubmit(data: PlanFormValues) {
    onSave(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Plano</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Herói Lendário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
