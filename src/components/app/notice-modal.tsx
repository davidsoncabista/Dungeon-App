"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Notice } from "@/lib/types/notice"
import Link from "next/link"
import { Megaphone } from "lucide-react"

interface NoticeModalProps {
  notice: Notice;
  onDismiss: (noticeId: string, dismissForever: boolean) => void;
}

export function NoticeModal({ notice, onDismiss }: NoticeModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dismissForever, setDismissForever] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onDismiss(notice.id, dismissForever);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                    <Megaphone className="h-8 w-8 text-primary" />
                </div>
            </div>
          <DialogTitle className="text-center text-2xl font-headline">{notice.title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {notice.description}
            {notice.link && (
                <Link href={notice.link} className="block mt-2 text-primary font-semibold hover:underline">
                    Saiba mais
                </Link>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 pt-4 sm:flex-col sm:gap-2">
            <div className="flex items-center space-x-2 justify-center">
                <Checkbox id="dismiss-forever" checked={dismissForever} onCheckedChange={(checked) => setDismissForever(!!checked)} />
                <Label htmlFor="dismiss-forever" className="text-sm text-muted-foreground">Não mostrar este aviso novamente</Label>
            </div>
            <Button type="button" onClick={handleClose}>
                Entendido
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
