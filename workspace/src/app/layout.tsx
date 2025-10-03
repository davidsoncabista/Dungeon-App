import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import "@/app/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL('https://adbelm.web.app'), // Substitua pela sua URL de produção
  title: {
    default: 'Dungeon App',
    template: '%s | Dungeon App',
  },
  description: 'O sistema de gerenciamento para membros da Associação Dungeon Belém.',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  return (
    <html lang="pt-br" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://adbelm.firebaseapp.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
