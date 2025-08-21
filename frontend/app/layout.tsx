import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
})

export const metadata: Metadata = {
    title: "NewsTrust - Sistema de Detecção de Notícias Falsas",
    description: "Sistema avançado de detecção de notícias falsas com rede de confiabilidade entre fontes",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="pt-BR" className={inter.variable}>
            <body className={inter.className}>{children}</body>
        </html>
    )
}
