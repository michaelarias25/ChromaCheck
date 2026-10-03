import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chroma Check",
  description: "Sistema de control espectrométrico industrial",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="h-16 px-8 flex items-center justify-between border-b-2 border-surface-container-highest bg-surface-container-lowest">
          
          <div className="flex items-center h-10 w-auto">
            <img 
              src="/logo.png" 
              alt="Chroma Check Logo" 
              className="h-full w-auto object-contain" 
            />
          </div>
          
          <nav className="flex items-center gap-3">
            <Link 
              href="/" 
              className="px-4 h-9 bg-surface-container-high text-on-surface-variant flex items-center justify-center rounded font-headline text-xs uppercase tracking-wider transition hover:bg-surface-container-highest"
            >
              Lotes
            </Link>

            <Link 
              href="/historial" 
              className="px-4 h-9 bg-surface-container-high text-on-surface-variant flex items-center justify-center rounded font-headline text-xs uppercase tracking-wider transition hover:opacity-90"
            >
              Historial
            </Link>
          </nav>
        </header>
        {children}
        </body>
    </html>
  );
}