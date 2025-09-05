import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getTransactions } from "@/lib/mock-service"
import { CheckCircle, QrCode, FileText } from "lucide-react"
import Image from "next/image"

export default function BillingPage() {
  const transactions = getTransactions();
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Cobrança e Pagamentos</h1>
        <p className="text-muted-foreground">Gerencie sua assinatura e histórico de pagamentos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Status da Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center gap-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-2xl font-bold">Assinatura Ativa</p>
              <p className="text-muted-foreground">Sua próxima cobrança será em <strong>01 de Outubro de 2024</strong>.</p>
              <Button variant="outline" className="w-full">Gerenciar Assinatura</Button>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento Pendente</CardTitle>
              <CardDescription>Realize o pagamento da sua mensalidade de Outubro/24.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <div className="text-4xl font-bold">R$ 50,00</div>
              <p className="text-muted-foreground">Vencimento em 10 de Outubro de 2024.</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                        <QrCode className="mr-2 h-4 w-4" />
                        Gerar QR Code para Pagamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pagamento via PIX</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <Image src="https://picsum.photos/250/250" alt="QR Code" width={250} height={250} data-ai-hint="qr code"/>
                      <p className="text-center text-muted-foreground">Escaneie o QR Code com o aplicativo do seu banco para realizar o pagamento.</p>
                      <Button variant="outline">Copiar Código PIX</Button>
                    </div>
                  </DialogContent>
                </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID da Transação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Recibo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>{tx.amount}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'Pago' ? 'secondary' : 'destructive'} className={tx.status === 'Pago' ? 'bg-green-100 text-green-800' : ''}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Ver Recibo</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
