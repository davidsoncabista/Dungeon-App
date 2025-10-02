
"use client"

import { useState, useMemo } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { app } from "@/lib/firebase";
import type { AuditLog } from "@/lib/types/auditLog";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, ShieldAlert, User, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function LogRow({ log }: { log: AuditLog }) {
    return (
        <TableRow>
            <TableCell className="hidden md:table-cell">
                {log.timestamp ? format(log.timestamp.toDate(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : '...'}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://picsum.photos/seed/${log.actor.uid}/40/40`} alt={log.actor.displayName || 'Avatar'}/>
                        <AvatarFallback>{(log.actor.displayName || '...').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{log.actor.displayName || 'Sistema'}</div>
                        <div className="text-xs text-muted-foreground">{log.actor.email}</div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="secondary">{log.action}</Badge>
            </TableCell>
            <TableCell>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Detalhes do Log</h4>
                                <p className="text-sm text-muted-foreground">
                                    Informações adicionais sobre o evento.
                                </p>
                            </div>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                            </pre>
                        </div>
                    </PopoverContent>
                </Popover>
            </TableCell>
        </TableRow>
    )
}

export default function AuditLogPage() {
    const firestore = getFirestore(app);

    const logsRef = collection(firestore, 'auditLogs');
    const [logs, loadingLogs, errorLogs] = useCollectionData<AuditLog>(
        query(logsRef, orderBy("timestamp", "desc")), 
        { idField: 'id' }
    );

    const renderContent = () => {
        if (loadingLogs) {
            return Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
            ));
        }

        if (errorLogs) {
            return (
                <TableRow>
                    <TableCell colSpan={4}>
                         <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive rounded-md">
                            <ShieldAlert className="h-8 w-8 text-destructive" />
                            <div>
                                <h4 className="font-bold text-destructive">Erro ao Carregar Logs</h4>
                                <p className="text-sm text-destructive/80">Não foi possível buscar os dados de auditoria. Verifique suas regras de segurança. ({errorLogs.message})</p>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }
        
        if (!logs || logs.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Nenhum registro de auditoria encontrado.</TableCell>
                </TableRow>
            );
        }

        return logs.map(log => <LogRow key={log.id} log={log} />);
    };

    return (
        <div className="grid gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <History className="h-8 w-8"/>
                    Log de Auditoria
                </h1>
                <p className="text-muted-foreground">Um registro de todas as ações importantes realizadas no sistema.</p>
            </div>

            <Card>
                 <CardHeader>
                    <CardTitle>Registros Recentes</CardTitle>
                    <CardDescription>As últimas atividades registradas, da mais nova para a mais antiga.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden md:table-cell">Data</TableHead>
                                <TableHead>Ator</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderContent()}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
