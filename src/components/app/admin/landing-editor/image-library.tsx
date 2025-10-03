
"use client"

import { useState, useEffect } from "react"
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage"
import { app } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Copy, Trash2, Image as ImageIcon, Loader2, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

const allowedDomains = [
  'firebasestorage.googleapis.com',
  'placehold.co',
  'picsum.photos',
  'images.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
  'freepik.com',
  'flaticon.com',
  'api.storyset.com',
  'as1.ftcdn.net',
  'media.gettyimages.com',
  'image.shutterstock.com',
  'static.thenounproject.com',
  'fonts.gstatic.com',
  'media.giphy.com',
  'i.imgur.com',
];


export function ImageLibrary() {
  const { toast } = useToast()
  const storage = getStorage(app)
  const storageRef = ref(storage, 'landing-page-media')

  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [images, setImages] = useState<{ name: string; url: string }[]>([])
  const [imageToDelete, setImageToDelete] = useState<{ name: string; url: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const result = await listAll(storageRef)
      const imageUrls = await Promise.all(
        result.items.map(async (imageRef) => {
          const url = await getDownloadURL(imageRef)
          return { name: imageRef.name, url }
        })
      )
      setImages(imageUrls.reverse()) // Show newest first
    } catch (error) {
      console.error("Erro ao buscar imagens:", error)
      toast({
        title: "Erro ao carregar imagens",
        description: "Não foi possível buscar as imagens da biblioteca.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Otimizar a imagem
      const optimizedBlob = await optimizeImage(file)

      // 2. Fazer o upload
      const fileName = `${Date.now()}-${file.name}`
      const imageRef = ref(storage, `landing-page-media/${fileName}`)
      await uploadBytes(imageRef, optimizedBlob)

      // 3. Atualizar a lista
      await fetchImages()
      
      toast({
        title: "Upload Concluído",
        description: "Sua imagem foi otimizada e enviada com sucesso.",
      })
    } catch (error) {
      console.error("Erro no upload:", error)
      toast({
        title: "Erro de Upload",
        description: "Não foi possível enviar a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  // Função para otimizar imagem no client-side
  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = document.createElement("img")
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          
          const MAX_WIDTH = 1280
          const MAX_HEIGHT = 1280
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Falha ao criar blob da imagem otimizada."))
            }
          }, "image/webp", 0.8) // Converte para WebP com 80% de qualidade
        }
        img.onerror = reject
        img.src = event.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL Copiada!",
      description: "O link da imagem está na sua área de transferência.",
    })
  }

  const handleDeleteImage = async () => {
    if (!imageToDelete) return
    setIsDeleting(true)
    try {
        const imageRef = ref(storage, `landing-page-media/${imageToDelete.name}`)
        await deleteObject(imageRef)
        setImageToDelete(null)
        await fetchImages()
        toast({
            title: "Imagem Excluída",
            description: "A imagem foi removida da biblioteca.",
        })
    } catch (error) {
        console.error("Erro ao excluir imagem:", error)
        toast({
            title: "Erro ao Excluir",
            description: "Não foi possível remover a imagem.",
            variant: "destructive",
        })
    } finally {
        setIsDeleting(false)
    }
  }


  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="image-upload" className="w-full">
          <Button asChild className="w-full" disabled={isUploading}>
            <div>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Enviando..." : "Enviar Nova Imagem"}
            </div>
          </Button>
        </label>
        <Input
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
         <div className="text-xs text-muted-foreground mt-2 text-center">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 underline hover:text-primary">
                  <Info className="h-3 w-3" />
                  Ver domínios de imagem permitidos
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Domínios de Imagem Permitidos</h4>
                    <p className="text-sm text-muted-foreground">
                      Você pode usar URLs de imagens dos seguintes domínios.
                    </p>
                  </div>
                  <ScrollArea className="h-40">
                    <div className="flex flex-wrap gap-2">
                      {allowedDomains.map(domain => (
                        <Badge key={domain} variant="secondary">{domain}</Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>
      </div>

      <ScrollArea className="h-96 rounded-md border">
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {images.map((image) => (
                <div key={image.url} className="group relative">
                  <Image
                    src={image.url}
                    alt={image.name}
                    width={200}
                    height={150}
                    className="rounded-md object-cover aspect-[4/3]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-md">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleCopyUrl(image.url)}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copiar URL</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => setImageToDelete(image)}
                       className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <ImageIcon className="h-10 w-10 mb-4" />
              <p className="font-semibold">Biblioteca Vazia</p>
              <p className="text-sm">Envie a primeira imagem para começar.</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
       <AlertDialog open={!!imageToDelete} onOpenChange={(isOpen) => !isOpen && setImageToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível e excluirá a imagem permanentemente. Se ela estiver em uso na landing page, ela deixará de ser exibida.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteImage} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Sim, excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
