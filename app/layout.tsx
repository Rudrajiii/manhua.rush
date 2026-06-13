import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css"
import Link from "next/link";
import ConditionalNav from "./components/ConditionalNav";
import ConditionalWrapper from "./components/ConditionalWrapper";
import UserButton from "./components/UserButton";
import MobileNav from "./components/MobileNav";
import TopLoader from "./components/TopLoader";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Manhua Rush - Free Manga & Manhua Reader | Quick Access & Fast Release",
  description: "Join Manhua Rush - A community platform for fans to collaborate and translate manga and manhua into multiple languages. Get the newest chapters as soon as they're released, free and ad-free.",
  keywords: "manhua, manga, reading, translation, community, free reader",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  robots: "index, follow",
  openGraph: {
    title: "Manhua Rush - Free Manga & Manhua Reader",
    description: "Collaborate to translate manga and manhua into multiple languages. Quick access, fast releases, community-driven.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo/manhua_rush.webp",
        width: 1200,
        height: 630,
        alt: "Manhua Rush - Community Translation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manhua Rush - Free Manga & Manhua Reader",
    description: "Collaborate to translate manga and manhua into multiple languages.",
    images: ["/logo/manhua_rush.webp"],
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/logo/manhua_rush.webp",
        type: "image/webp",
      },
    ],
    apple: "/logo/manhua_rush.webp",
  },
  metadataBase: new URL("https://manhuarush.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1f1f1f" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet" />
        <link rel="canonical" href="https://manhuarush.vercel.app" />
        {/* Favicon configured in metadata.icons */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <TopLoader />
        <Toaster
          position="bottom-right"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              borderRadius: '8px',
              background: 'rgba(31, 31, 31, 0.95)',
              border: 'none',
              color: '#e9d5ff',
            },
          }}
        />
        <ConditionalNav>
          <header className="nav-wrap">
            <nav className="site-nav" aria-label="Main navigation">
              <div className="brand cursor-pointer">
                <Link href="/">
                  <span className="brand-logo" aria-label="Manhua Rush home">
                    <img
                      src={encodeURI('/logo/Fierce dragon with purple lightning.webp')}
                      alt="dragon logo"
                      className="logo-icon"
                    />
                    <img
                      src="/logo/manhua_rush.webp"
                      alt="Manhua Rush"
                      className="logo-wordmark"
                    />
                  </span>
                </Link>
              </div>

              <ul className="breadcrumb" role="list">
                <li><Link className="nav-link" href="/">Home</Link></li>
                <li className="separator">/</li>
                <li><Link className="nav-link" href="/ttp-providence">View Chapters</Link></li>
                <li className="separator">/</li>
                <li><Link className="nav-link" href="/craft">Craft</Link></li>
              </ul>

              <div className="nav-right">
                <UserButton />
              </div>

              {/* Mobile hamburger (hidden on desktop) */}
              <MobileNav />
            </nav>
          </header>
        </ConditionalNav>

        <ConditionalWrapper>{children}</ConditionalWrapper>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
