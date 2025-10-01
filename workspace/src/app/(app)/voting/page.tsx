
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Votação',
  description: 'Participe das votações importantes da associação.',
};
"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where } from "firebase/firestore"
import { auth, app } from "@/lib/firebase"
import { getFunctions, httpsCallable } from 'firebase/functions';

import type { Poll, Vote } from "@/lib/types/poll"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Vote as VoteIcon, ThumbsUp, BarChart3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function VotingPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const firestore = getFirestore(app);
    const functions = getFunctions(app, 'southamerica-east1');
    const { toast } = useToast();

    // State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Firestore Data ---
    const pollQuery = user ? query(collection(firestore, 'polls'), where('status', '==', 'Aberta'), where('eligibleVoters', 'array-contains', user.uid)) : null;
    const [activePolls, loadingPolls] = useCollectionData<Poll>(pollQuery, { idField: 'id' });
    const activePoll = useMemo(() => activePolls?.[0], [activePolls]);

    const votesQuery = activePoll ? query(collection(firestore, `polls/${activePoll.id}/votes`)) : null;
    const [votes, loadingVotes] = useCollectionData<Vote>(votesQuery, { idField: 'id' });

    // --- Memoized Values ---
    const hasVoted = useMemo(() => {
        if (!votes || !user) return false;
        return votes.some(v => v.id === user.uid);
    }, [votes, user]);

    const getOptionValue = (option: any): string => {
        return typeof option === 'string' ? option : option.value;
    };
    
    const pollResults = useMemo(() => {
        if (!activePoll || !votes) return [];

        const stringOptions = activePoll.options.map(getOptionValue);
        
        const totalWeight = votes.reduce((sum, v) => sum + v.votingWeight, 0);
        if (totalWeight === 0) return stringOptions.map(opt => ({ option: opt, percentage: 0 }));
        
        return stringOptions.map(option => {
            const optionVotesWeight = votes
                .filter(v => v.selectedOption === option)
                .reduce((sum, v) => sum + v.votingWeight, 0);
            return {
                option,
                percentage: (optionVotesWeight / totalWeight) * 100,
            };
        });
    }, [activePoll, votes]);
    
    // --- Handlers ---
    const handleSubmitVote = async () => {
        if (!selectedOption || !user || !activePoll) return;
        setIsSubmitting(true);
        try {
            const castVoteFunction = httpsCallable(functions, 'castVote');
            await castVoteFunction({ pollId: activePoll.id, selectedOption });
            toast({ title: "Voto Registrado!", description: "Seu voto foi computado com sucesso. Obrigado por participar!" });
        } catch (error: any) {
            console.error("Erro ao registrar voto:", error);
            // O erro 'already-exists' é tratado pela UI reativa, então não mostramos toast para ele.
            if (error.code !== 'functions/already-exists') {
              toast({ title: "Erro!", description: error.message || "Não foi possível registrar seu voto.", variant: "destructive" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Render Logic ---
    const isLoading = loadingAuth || loadingPolls;

    if (isLoading) {
        return <Skeleton className="h-96 w-full max-w-3xl mx-auto" />;
    }

    if (!activePoll) {
        return (
            <Card className="max-w-3xl mx-auto">
                <CardContent className="pt-6 text-center">
                    <VoteIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h2 className="mt-4 text-2xl font-semibold">Nenhuma votação ativa</h2>
                    <p className="mt-2 text-muted-foreground">Não há nenhuma votação em andamento no momento. Volte mais tarde!</p>
                </CardContent>
            </Card>
        );
    }
    
    if (loadingVotes && !votes) {
        return <Skeleton className="h-96 w-full max-w-3xl mx-auto" />;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">{activePoll.title}</h1>
            <p className="text-muted-foreground mb-8">{activePoll.description}</p>
            
            {hasVoted ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5"/> Resultado Parcial</CardTitle>
                        <CardDescription>O resultado atual da votação. Seu voto já foi computado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingVotes ? <p>Calculando resultados...</p> : pollResults.map(result => (
                             <div key={result.option} className="space-y-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-medium">{result.option}</span>
                                    <span className="text-sm font-bold text-muted-foreground">{result.percentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={result.percentage} />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Alert>
                            <ThumbsUp className="h-4 w-4" />
                            <AlertTitle>Obrigado por participar!</AlertTitle>
                            <AlertDescription>
                                Seu voto é importante para o futuro da associação.
                            </AlertDescription>
                        </Alert>
                    </CardFooter>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Escolha sua opção</CardTitle>
                        <CardDescription>Selecione uma das opções abaixo e confirme seu voto. Esta ação é irreversível.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <RadioGroup onValueChange={setSelectedOption} value={selectedOption || ""}>
                            <div className="space-y-2">
                               {activePoll.options.map((option, index) => {
                                   const optionValue = getOptionValue(option);
                                   const uniqueKey = `${optionValue}-${index}`;
                                   return (
                                        <Label key={uniqueKey} htmlFor={uniqueKey} className="flex items-center gap-4 p-4 rounded-md border has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-all cursor-pointer">
                                            <RadioGroupItem value={optionValue} id={uniqueKey} />
                                            <span className="font-semibold">{optionValue}</span>
                                        </Label>
                                   )
                               })}
                            </div>
                        </RadioGroup>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleSubmitVote} disabled={!selectedOption || isSubmitting} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirmar Voto
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
