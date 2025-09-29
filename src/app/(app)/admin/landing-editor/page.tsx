"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutTemplate } from "lucide-react"

export default function LandingEditorPage() {
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <LayoutTemplate className="h-8 w-8"/>
            Editor da Landing Page
        </h1>
        <p className="text-muted-foreground">Gerencie os blocos de conteúdo da sua página inicial.</p>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Gerenciador de Layout</CardTitle>
            <CardDescription>Arraste, solte e edite os blocos para montar sua página.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-md">
            <p className="text-muted-foreground">Em breve: Construtor visual da landing page.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
