/**
 * @fileoverview Define as estruturas de dados para os blocos de conteúdo dinâmico da landing page.
 * Este arquivo serve como a "fonte da verdade" para a coleção `landingPageBlocks` no Firestore.
 */

/**
 * Representa os tipos de blocos de conteúdo que podem ser renderizados na landing page.
 */
export type BlockType = 'hero' | 'featureList' | 'callToAction' | 'testimonial';

/**
 * Interface base para todos os blocos de conteúdo.
 */
interface BaseBlock {
  id: string; // ID único do bloco no Firestore.
  type: BlockType; // O tipo do bloco, que determina sua estrutura de conteúdo e renderização.
  order: number; // A ordem em que o bloco aparece na página.
  enabled: boolean; // Se o bloco deve ou não ser renderizado.
}

/**
 * Conteúdo para o bloco 'Hero', a seção principal de boas-vindas.
 */
export interface HeroBlockContent {
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  imageAlt: string;
}

/**
 * Representa um único item (feature) dentro de uma lista de funcionalidades.
 */
export interface FeatureItem {
  icon: string; // Nome do ícone (ex: 'Calendar', 'ShieldCheck' de lucide-react).
  title: string;
  description: string;
}

/**
 * Conteúdo para o bloco 'FeatureList', que exibe uma grade de funcionalidades.
 */
export interface FeatureListBlockContent {
  title: string;
  subtitle: string;
  features: FeatureItem[];
  layout: '2-cols' | '3-cols' | '4-cols'; // Controle de layout para a grade.
}

/**
 * Conteúdo para um bloco 'Call to Action' (Chamada para Ação).
 */
export interface CallToActionBlockContent {
  title: string;
  buttonText: string;
  buttonLink: string;
}

// --- Tipos de Blocos Discernidos ---

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  content: HeroBlockContent;
}

export interface FeatureListBlock extends BaseBlock {
  type: 'featureList';
  content: FeatureListBlockContent;
}

export interface CallToActionBlock extends BaseBlock {
  type: 'callToAction';
  content: CallToActionBlockContent;
}

/**
 * Um tipo união que representa qualquer um dos possíveis blocos de conteúdo.
 * Isso permite o tratamento polimórfico dos blocos na lógica de renderização.
 */
export type LandingPageBlock = HeroBlock | FeatureListBlock | CallToActionBlock;
