
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import type { Transaction } from "@/lib/types/transaction"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, User, Hash, Type, DollarSign, CheckCircle2, AlertCircle, Clock } from "lucide-react"

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode | string }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-4 text-sm">
            <div className="text-muted-foreground pt-0.5">{icon}</div>
            <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground break-words">{value}</p>
            </div>
        </div>
    )
}

export function TransactionDetailsDialog({ transaction, children }: { transaction: Transaction, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Detalhes da Transação</DialogTitle>
                    <DialogDescription>
                        Informações completas sobre a cobrança.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <DetailRow
                        icon={<Hash className="h-4 w-4" />}
                        label="ID da Transação"
                        value={transaction.id}
                    />
                     <DetailRow
                        icon={<User className="h-4 w-4" />}
                        label="Usuário"
                        value={`${transaction.userName} (${transaction.userId})`}
                    />
                    <DetailRow
                        icon={<DollarSign className="h-4 w-4" />}
                        label="Valor"
                        value={`R$ ${transaction.amount.toFixed(2).replace('.', ',')}`}
                    />
                    <DetailRow
                        icon={<Type className="h-4 w-4" />}
                        label="Tipo"
                        value={transaction.type}
                    />
                    <DetailRow
                        icon={<Calendar className="h-4 w-4" />}
                        label="Data de Criação"
                        value={transaction.createdAt ? format(transaction.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm") : "N/A"}
                    />
                     {transaction.dueDate && (
                        <DetailRow
                            icon={<AlertCircle className="h-4 w-4" />}
                            label="Data de Vencimento"
                            value={format(transaction.dueDate.toDate(), "dd/MM/yyyy")}
                        />
                     )}
                     {transaction.paidAt && (
                        <DetailRow
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            label="Data de Pagamento"
                            value={format(transaction.paidAt.toDate(), "dd/MM/yyyy 'às' HH:mm")}
                        />
                     )}
                     {transaction.paymentGatewayId && (
                        <DetailRow
                            icon={<Hash className="h-4 w-4" />}
                            label="ID do Gateway de Pagamento"
                            value={transaction.paymentGatewayId}
                        />
                     )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
