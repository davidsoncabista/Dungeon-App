import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'

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
