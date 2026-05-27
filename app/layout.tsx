import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from '@vercel/analytics/next';
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
  title: "Manhua Rush",
  description: "Made for Quick Access & Fast Release - No Money No Adds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet" />
        <link rel="icon" href={encodeURI('/logo/Fierce dragon with purple lightning.ico')} />
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
      </body>
    </html>
  );
}
