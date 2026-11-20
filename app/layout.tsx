import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TrenoProvider } from "@/lib/store";
import { TrainingProvider } from "@/lib/training";
import { BadgesProvider } from "@/lib/badgesProvider";
import { PwaRegister } from "@/components/PwaRegister";

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
  icons: {
    icon: [{ url: "./icon.svg", type: "image/svg+xml" }, { url: "./icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "./apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "TRENO", statusBarStyle: "black-translucent" },
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
        <TrenoProvider>
          <TrainingProvider>
            <BadgesProvider>{children}</BadgesProvider>
          </TrainingProvider>
          <PwaRegister />
        </TrenoProvider>
      </body>
    </html>
  );
}
