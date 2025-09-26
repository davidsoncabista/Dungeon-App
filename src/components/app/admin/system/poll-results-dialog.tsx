
"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { Poll, Vote } from "@/lib/types/poll"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PollResultsDialogProps {
    poll: Poll;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PollResultsDialog({ poll, isOpen, onOpenChange }: PollResultsDialogProps) {
    const firestore = getFirestore(app);
    const votesQuery = query(collection(firestore, `polls/${poll.id}/votes`));
    const [votes, loadingVotes] = useCollectionData<Vote>(votesQuery, { idField: 'id' });

    const getOptionValue = (option: any): string => {
        return typeof option === 'string' ? option : option.value;
    };
    
    const pollResults = useMemo(() => {
        if (!votes) return [];
        const resultsMap = new Map<string, { count: number, weight: number }>();
        const stringOptions = poll.options.map(getOptionValue);

        stringOptions.forEach(opt => resultsMap.set(opt, { count: 0, weight: 0 }));

        votes.forEach(vote => {
            if (resultsMap.has(vote.selectedOption)) {
                const current = resultsMap.get(vote.selectedOption)!;
                resultsMap.set(vote.selectedOption, {
                    count: current.count + 1,
                    weight: current.weight + vote.votingWeight,
                });
            }
        });
        
        return Array.from(resultsMap.entries()).map(([option, data]) => ({
            name: option.length > 15 ? `${option.substring(0, 15)}...` : option,
            fullOption: option,
            votos: data.weight,
        }));

    }, [votes, poll.options]);

    const totalVotes = useMemo(() => votes?.reduce((sum, v) => sum + v.votingWeight, 0) || 0, [votes]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Resultados da Votação</DialogTitle>
                    <DialogDescription>{poll.title}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Apuração dos Votos</CardTitle>
                            <CardDescription>
                                Total de votos (com peso): <Badge>{totalVotes}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             {loadingVotes ? <p>Carregando resultados...</p> : (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={pollResults} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex flex-col">
                                                                    <span className="text-muted-foreground text-sm">{payload[0].payload.fullOption}</span>
                                                                    <span className="font-bold text-lg">{payload[0].value} Votos</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Bar dataKey="votos" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
