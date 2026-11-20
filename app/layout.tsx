import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TrenoProvider } from "@/lib/store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRENO — Tu progreso en el gimnasio, en un juego justo",
  description:
    "Registra tus entrenamientos, mide tu progreso hacia tu meta y compite con tus amigos en un ranking justo, según el objetivo de cada uno.",
  manifest: "./manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0c0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Aplica el tema guardado antes de pintar para evitar el parpadeo claro/oscuro. */
const THEME_BOOT = `(function(){try{var r=localStorage.getItem('treno:v2');var t=r?JSON.parse(r).themeMode:null;if(!t&&window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches)t='light';document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${display.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="font-sans antialiased selection:bg-accent selection:text-canvas">
        <TrenoProvider>{children}</TrenoProvider>
      </body>
    </html>
  );
}
