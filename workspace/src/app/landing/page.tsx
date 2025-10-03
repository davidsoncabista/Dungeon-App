"use client"

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dungeon App - Sistema de Reservas para a Associação Dungeon Belém',
  description: 'A plataforma oficial para membros da Associação Dungeon Belém gerenciarem reservas de salas, comunicação e participação em eventos de RPG, Board Games e Card Games.',
};

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import type { LandingPageBlock, HeroBlock, FeatureListBlock, MarkdownBlock, HTMLBlock, SeparatorBlock } from "@/lib/types/landing-page-block";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemo } from "react";
import { Dices, MoreHorizontal } from "lucide-react";


// --- Dynamic Components ---

const HeroSection = ({ block }: { block: HeroBlock }) => (
  <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
    <div className="space-y-6">
      <Badge variant="outline" className="py-1 px-3">{block.content.badge}</Badge>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-headline">
        {block.content.title}
      </h1>
      <p className="max-w-prose text-muted-foreground md:text-xl">
        {block.content.subtitle}
      </p>
      <Button asChild size="lg">
        <Link href={block.content.buttonLink}>{block.content.buttonText}</Link>
      </Button>
    </div>
    <div className="flex justify-center">
      <Image
        src={block.content.imageUrl}
        width={740}
        height={494}
        alt={block.content.imageAlt}
        className="rounded-xl shadow-2xl"
        priority
      />
    </div>
  </section>
);

const FeatureListSection = ({ block }: { block: FeatureListBlock }) => {
    const layoutClasses = {
        '2-cols': 'md:grid-cols-2',
        '3-cols': 'md:grid-cols-3',
        '4-cols': 'md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <section className="bg-muted/50 py-20 md:py-28">
            <div className="container">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">{block.content.title}</h2>
                    <p className="max-w-3xl mx-auto text-muted-foreground md:text-lg">
                        {block.content.subtitle}
                    </p>
                </div>
                <div className={cn("grid gap-8", layoutClasses[block.content.layout])}>
                    {block.content.features.map((feature, index) => {
                         const Icon = (LucideIcons as any)[feature.icon] || LucideIcons.HelpCircle;
                         return (
                            <Card key={index} className="text-center p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="p-0 mb-4">
                                    <Icon className="h-10 w-10 text-primary" />
                                </CardHeader>
                                <CardContent className="p-0 flex flex-col items-center">
                                    <CardTitle className="text-xl mb-2 font-headline">{feature.title}</CardTitle>
                                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>
    )
};

const MarkdownSection = ({ block }: { block: MarkdownBlock }) => (
    <section className="py-20 md:py-28">
        <div className="container">
            <div className="prose dark:prose-invert max-w-4xl mx-auto">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.content.markdown}
                </ReactMarkdown>
            </div>
        </div>
    </section>
);

const HTMLSection = ({ block }: { block: HTMLBlock }) => (
    <section className="py-20 md:py-28">
        <div className="container">
             <div dangerouslySetInnerHTML={{ __html: block.content.html }} />
        </div>
    </section>
);

const SeparatorSection = ({ block }: { block: SeparatorBlock }) => {
    const renderStyle = () => {
        switch (block.content.style) {
            case 'line':
                return <div className="flex-grow border-t border-border"></div>;
            case 'dots':
                return <MoreHorizontal className="h-6 w-6" />;
            case 'dices':
            default:
                return <Dices className="h-6 w-6" />;
        }
    };
    
    return (
        <section className="py-12">
            <div className="container">
                <div className="flex items-center text-muted-foreground">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="mx-4">
                       {renderStyle()}
                    </span>
                    <div className="flex-grow border-t border-border"></div>
                </div>
            </div>
        </section>
    );
};


const BlockRenderer = ({ block }: { block: LandingPageBlock }) => {
  switch (block.type) {
    case 'hero':
      return <HeroSection block={block as HeroBlock} />;
    case 'featureList':
      return <FeatureListSection block={block as FeatureListBlock} />;
    case 'markdown':
      return <MarkdownSection block={block as MarkdownBlock} />;
    case 'html':
      return <HTMLSection block={block as HTMLBlock} />;
    case 'separator':
      return <SeparatorSection block={block as SeparatorBlock} />;
    default:
      return null;
  }
};


export default function LandingPage() {
  const firestore = getFirestore(app);
  const blocksRef = collection(firestore, 'landingPageBlocks');
  // Simplificamos a query para apenas ordenar. O filtro de 'enabled' será feito no cliente.
  const blocksQuery = query(blocksRef, orderBy('order'));
  const [allBlocks, loadingBlocks, errorBlocks] = useCollectionData<LandingPageBlock>(blocksQuery, { idField: 'id' });

  // Filtramos os blocos habilitados no lado do cliente
  const enabledBlocks = useMemo(() => {
    if (!allBlocks) return [];
    return allBlocks.filter(block => block.enabled);
  }, [allBlocks]);


  const renderSkeletons = () => (
    <>
      <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
        <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-32" /></div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </section>
      <section className="bg-muted/50 py-20 md:py-28">
        <div className="container"><div className="text-center space-y-4 mb-12"><Skeleton className="h-12 w-1/2 mx-auto" /><Skeleton className="h-6 w-3/4 mx-auto" /></div><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div></div>
      </section>
    </>
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <Image 
              src="/logo.svg" 
              width={40}
              height={40}
              alt="Logo da Associação Dungeon Belém"
              className="rounded-md"
              priority
            />
            <span className="font-bold text-lg font-headline">Dungeon App</span>
          </Link>
          <Button asChild>
            <Link href="/login">Acessar o App</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {loadingBlocks && renderSkeletons()}
        {!loadingBlocks && enabledBlocks?.map(block => <BlockRenderer key={block.id} block={block} />)}
        {!loadingBlocks && (!enabledBlocks || enabledBlocks.length === 0) && (
            <div className="container py-32 text-center text-muted-foreground">
                <p>Nenhum conteúdo para a landing page foi configurado ainda.</p>
            </div>
        )}
         {errorBlocks && (
            <div className="container py-32 text-center text-destructive">
                <p>Ocorreu um erro ao carregar o conteúdo: {errorBlocks.message}</p>
                <p>Verifique se as regras do Firestore para 'landingPageBlocks' permitem leitura pública.</p>
            </div>
        )}
      </main>

      <footer className="border-t">
        <div className="container flex items-center justify-between h-20">
          <p className="text-sm text-muted-foreground">
            © 2025 Associação Dungeon Belém.
          </p>
          <div className="text-sm text-muted-foreground text-right space-y-1">
            <p>
                Desenvolvido por <a 
                  href="https://davidson.dev.br" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:text-primary"
                >
                  davidson.dev.br
                </a>
              </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
