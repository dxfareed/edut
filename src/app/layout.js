import localFont from "next/font/local";
import Script from "next/script";
import ClientLayout from "./components/ClientLayout";
import "./globals.css";

// Font configurations
// ... existing code ...
const myFont = localFont({
  src: [
    {
      path: "./fonts/AeonikTRIAL-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/AeonikTRIAL-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/AeonikTRIAL-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/AeonikTRIAL-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/Aeonik.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/AeonikTRIAL-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-aeonik",
});

// SEO Metadata configuration
export const metadata = {
  metadataBase: new URL("https://triviabase.xyz"),
  title: {
    default: "TriviaBase - Interactive On-Chain Q&A Platform",
    template: `%s | TriviaBase - Interactive On-Chain Q&A Platform`,
  },
  description:
    "Boost audience engagement with TriviaBase, a blockchain-based Q&A platform for interactive events, meetings, and classrooms.",
  keywords: [
    "TriviaBase",
    "triviabase",
    "kahoot onchain",
    "triviabase Q&A platform",
    "onchain live Q&A platform",
    "interactive Q&A platform",
    "crypto-powered Q&A platform",
    "audience engagement tool",
    "earn rewards during events",
    "Share reward during event",
    "distribute reward during event",
    "fun and rewarding Q&A",
    "blockchain Q&A app",
    "event engagement software",
    "gamified Q&A sessions",
    "conference Q&A solutions",
    "classroom engagement tool",
    "Web3 audience interaction",
    "web3 Q&A platform",
    "rewarding event solutions",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://triviabase.xyz",
    siteName: "TriviaBase",
    title: "TriviaBase - Interactive On-Chain Q&A Platform",
    description:
      "Enhance audience engagement with TriviaBase, the blockchain-powered Q&A platform that brings fun, rewards, and interaction to events, meetings, classrooms, and conferences.",
    images: [
      {
        url: "/icons/trivia_base.png",
        width: 1200,
        height: 630,
        alt: "TriviaBase Platform Preview",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow",
  },
  twitter: {
    card: "summary_large_image",
    title: "TriviaBase - Interactive On-Chain Q&A Platform",
    description:
      "Enhance audience engagement with TriviaBase, the blockchain-powered Q&A platform.",
    images: ["/icons/trivia_base.png"],
  },
  alternates: {
    canonical: "./",
  },
};

// Root Layout Component
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Favicon configuration */}
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="TriviaBase" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta
          property="fc:frame"
          content='{
          "version": "next",
          "imageUrl": "https://triviabase.xyz/ico.png",
          "button": {
            "title": "Start",
            "action": {
              "type": "launch_frame",
              "name": "TriviaBase",
              "url": "https://triviabase.xyz/pages/dashboard",
              "splashImageUrl": "https://triviabase.xyz/favicon.ico",
              "splashBackgroundColor": "#ffffff"
            }
          }
        }'
        />

        {/* <meta property="fc:frame" content="<stringified FrameEmbeder JSON>" />
        <meta property="fc:frame:image" content="https://triviabase.xyz/ico.png" />
        <meta property="og:image" content="https://triviabase.xyz/ico.png" />
        <meta property="fc:frame:post_url" content="https://triviabase.xyz" />
        <meta property="fc:frame:button:1" content="Start" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://triviabase.xyz/pages/dashboard" /> */}

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y9GH0H2N87"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y9GH0H2N87', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        {/* JSON-LD Schema Markup */}
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Dashboard",
                item: "https://triviabase.xyz/page/dashboard",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Host Game",
                item: "https://triviabase.xyz/pages/creategame",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Join Game",
                item: "https://triviabase.xyz/pages/join_game",
              },
            ],
          })}
        </Script>
      </head>
      <body className={myFont.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
