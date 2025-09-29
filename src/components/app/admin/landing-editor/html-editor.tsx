
"use client"

import { Textarea } from "@/components/ui/textarea";

interface HTMLEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function HTMLEditor({ value, onChange }: HTMLEditorProps) {
    return (
        <div className="border rounded-md">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-[250px] border-0 rounded-t-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm"
                placeholder="<!-- Seu código HTML aqui -->"
            />
        </div>
    );
}
