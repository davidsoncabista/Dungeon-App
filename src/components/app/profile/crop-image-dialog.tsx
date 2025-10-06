
"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { getCroppedImg } from "./crop-utils"

interface CropImageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onConfirm: (blob: Blob | null) => void;
  onCancel: () => void;
}

export function CropImageDialog({ isOpen, onOpenChange, imageSrc, onConfirm, onCancel }: CropImageDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onConfirm(croppedImageBlob);
  }

  const handleClose = () => {
    onCancel();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Arraste e use o zoom para enquadrar sua nova foto de perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-64 w-full bg-muted">
            {imageSrc && (
                 <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="round"
                    showGrid={false}
                />
            )}
        </div>
        <div className="space-y-4">
            <Label htmlFor="zoom">Zoom</Label>
            <Slider
                id="zoom"
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
            />
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleConfirmCrop}>Confirmar e Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
