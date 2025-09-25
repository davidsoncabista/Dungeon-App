
"use client"

import { useMemo, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useCollectionData } from "react-firebase-hooks/firestore"
import { getFirestore, collection, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, app } from "@/lib/firebase"

import type { User } from "@/lib/types/user"
import type { Poll, Vote } from "@/lib/types/poll"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldAlert, Vote as VoteIcon, ThumbsUp, BarChart3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function VotingPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const firestore = getFirestore(app);
    const { toast } = useToast();

    // State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Firestore Data ---
    const userQuery = user ? query(collection(firestore, 'users'), where('uid', '==', user.uid)) : null;
    const [appUser] = useCollectionData<User>(userQuery);
    const currentUser = appUser?.[0];

    const pollQuery = query(collection(firestore, 'polls'), where('status', '==', 'Aberta'));
    const [activePolls, loadingPolls] = useCollectionData<Poll>(pollQuery, { idField: 'id' });
    const activePoll = useMemo(() => activePolls?.[0], [activePolls]);

    const votesQuery = activePoll ? query(collection(firestore, `polls/${activePoll.id}/votes`)) : null;
    const [votes, loadingVotes] = useCollectionData<Vote>(votesQuery, { idField: 'id' });

    // --- Memoized Values ---
    const isEligible = useMemo(() => activePoll?.eligibleVoters.includes(user?.uid || ''), [activePoll, user]);
    const hasVoted = useMemo(() => votes?.some(v => v.userId === user?.uid), [votes, user]);

    const pollResults = useMemo(() => {
        if (!activePoll || !votes) return [];
        const totalWeight = votes.reduce((sum, v) => sum + v.votingWeight, 0);
        if (totalWeight === 0) return activePoll.options.map(opt => ({ option: opt, percentage: 0 }));
        
        return activePoll.options.map(option => {
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
        if (!selectedOption || !user || !activePoll || !currentUser) return;
        setIsSubmitting(true);
        try {
            const voteRef = doc(collection(firestore, `polls/${activePoll.id}/votes`));
            await setDoc(voteRef, {
                id: voteRef.id,
                pollId: activePoll.id,
                userId: user.uid,
                selectedOption,
                votingWeight: currentUser.category === 'Master' ? 2 : 1, // Exemplo de peso de voto
                votedAt: serverTimestamp(),
            });
            toast({ title: "Voto Registrado!", description: "Seu voto foi computado com sucesso. Obrigado por participar!" });
        } catch (error) {
            console.error("Erro ao registrar voto:", error);
            toast({ title: "Erro!", description: "Não foi possível registrar seu voto.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Render Logic ---
    const isLoading = loadingAuth || loadingPolls || loadingVotes;

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
    
    if (!isEligible) {
         return (
            <Card className="max-w-3xl mx-auto border-destructive">
                <CardContent className="pt-6 text-center">
                    <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
                    <h2 className="mt-4 text-2xl font-semibold">Acesso Negado</h2>
                    <p className="mt-2 text-muted-foreground">Você não está na lista de membros elegíveis para participar desta votação.</p>
                </CardContent>
            </Card>
        );
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
                        {pollResults.map(result => (
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
                               {activePoll.options.map(option => (
                                    <Label key={option} htmlFor={option} className="flex items-center gap-4 p-4 rounded-md border has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-all cursor-pointer">
                                        <RadioGroupItem value={option} id={option} />
                                        <span className="font-semibold">{option}</span>
                                    </Label>
                               ))}
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
