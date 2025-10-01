
"use client"

import { Bold } from "lucide-react/dist/esm/icons/bold";
import { Italic } from "lucide-react/dist/esm/icons/italic";
import { Strikethrough } from "lucide-react/dist/esm/icons/strikethrough";
import { List } from "lucide-react/dist/esm/icons/list";
import { ListOrdered } from "lucide-react/dist/esm/icons/list-ordered";
import { Heading2 } from "lucide-react/dist/esm/icons/heading-2";
import { Quote } from "lucide-react/dist/esm/icons/quote";
import { Link as LinkIcon } from "lucide-react/dist/esm/icons/link";
import { Image as ImageIcon } from "lucide-react/dist/esm/icons/image";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { useRef } from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";


interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const applyFormat = (format: 'bold' | 'italic' | 'strike' | 'h2' | 'quote' | 'ul' | 'ol' | 'link' | 'image') => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selectedText = value.substring(start, end);
        let newText = '';
        let newCursorPos = end;

        switch (format) {
            case 'bold':
                newText = `**${selectedText}**`;
                newCursorPos = start + newText.length - 2;
                break;
            case 'italic':
                newText = `*${selectedText}*`;
                newCursorPos = start + newText.length - 1;
                break;
            case 'strike':
                newText = `~~${selectedText}~~`;
                newCursorPos = start + newText.length - 2;
                break;
            case 'h2':
                newText = `## ${selectedText}`;
                newCursorPos = start + newText.length;
                break;
            case 'quote':
                newText = `> ${selectedText.split('\n').join('\n> ')}`;
                newCursorPos = start + newText.length;
                break;
            case 'ul':
                newText = `- ${selectedText.split('\n').join('\n- ')}`;
                newCursorPos = start + newText.length;
                break;
            case 'ol':
                 newText = `1. ${selectedText.split('\n').map((line, i) => i > 0 ? `${i + 1}. ${line}` : line).join('\n')}`;
                 newCursorPos = start + newText.length;
                break;
            case 'link':
                newText = `[${selectedText || 'texto do link'}](url)`;
                newCursorPos = start + newText.indexOf(']') + 2;
                break;
            case 'image':
                newText = `![${selectedText || 'alt text'}](url)`;
                newCursorPos = start + newText.indexOf(']') + 2;
                break;
        }

        const before = value.substring(0, start);
        const after = value.substring(end);
        const updatedValue = `${before}${newText}${after}`;

        onChange(updatedValue);
        
        // Focus and set cursor position
        setTimeout(() => {
             if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }
    
    const toolbarItems = [
        { name: "Negrito", icon: Bold, format: "bold" as const },
        { name: "Itálico", icon: Italic, format: "italic" as const },
        { name: "Riscado", icon: Strikethrough, format: "strike" as const },
        { type: "separator" },
        { name: "Título", icon: Heading2, format: "h2" as const },
        { name: "Citação", icon: Quote, format: "quote" as const },
        { type: "separator" },
        { name: "Lista", icon: List, format: "ul" as const },
        { name: "Lista Numerada", icon: ListOrdered, format: "ol" as const },
         { type: "separator" },
        { name: "Link", icon: LinkIcon, format: "link" as const },
        { name: "Imagem", icon: ImageIcon, format: "image" as const },
    ];


    return (
        <div className="border rounded-md">
            <TooltipProvider>
                <div className="p-2 border-b flex items-center gap-1 flex-wrap">
                    {toolbarItems.map((item, index) => {
                        if (item.type === 'separator') {
                            return <Separator key={`sep-${index}`} orientation="vertical" className="h-6 mx-1" />;
                        }
                        const Icon = item.icon;
                        return (
                            <Tooltip key={item.name}>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyFormat(item.format)}>
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{item.name}</p></TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            </TooltipProvider>
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[250px] border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Comece a escrever..."
            />
        </div>
    );
}
