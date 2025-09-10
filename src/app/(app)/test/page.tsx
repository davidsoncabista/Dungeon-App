
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function TestPage() {
  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-4">
        <Construction className="h-8 w-8 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Página de Teste</h1>
            <p className="text-muted-foreground">Área para testes de CRUD com Firestore e Storage.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Componente de Teste</CardTitle>
          <CardDescription>
            Adicione aqui os componentes para testar as funcionalidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo de teste...</p>
        </CardContent>
      </Card>
    </div>
  )
}
