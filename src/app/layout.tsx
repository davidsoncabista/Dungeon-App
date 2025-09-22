import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { Init } from "@mercadopago/sdk-react"
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("Mercado Pago public key is not set. Payment functionality will be disabled.");
  }
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {publicKey ? (
             <Init initialization={{ publicKey }}>
                {children}
             </Init>
          ) : (
            children
          )}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
