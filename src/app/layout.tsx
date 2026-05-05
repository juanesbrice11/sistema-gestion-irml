import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "EduGestión — IE Ramón Messa Londoño",
  description: "Sistema de gestión escolar para la IE Ramón Messa Londoño",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${outfit.className} min-h-full antialiased`}>
        {children}
      </body>
    </html>
  )
}
