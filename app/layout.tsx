import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains"
});

export const metadata: Metadata = {
    metadataBase: new URL("https://www.unformat.online"),
    title: "Unformat Shredder | Remove Metadata & Exif Online (Client-Side)",
    description: "Securely clean hidden metadata, GPS, and Exif from images, PDFs, and text files. Zero server uploads - 100% browser-based privacy tool.",
    keywords: ["remove metadata", "exif remover", "clean pdf", "scrub photos", "privacy tool", "client-side", "offline functionality"],
    authors: [{ name: "Unformat.online" }],
    alternates: {
        canonical: "https://www.unformat.online/shredder",
    },
    openGraph: {
        title: "Unformat Shredder | Client-Side Metadata Remover",
        description: "Securely remove metadata from images, PDFs, and text files entirely in your browser.",
        url: "https://www.unformat.online/shredder",
        siteName: "Unformat.online",
        type: "website",
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Unformat Shredder",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "featureList": "Remove Exif/GPS from images, sanitize PDFs, redact logs",
        "browserRequirements": "Requires JavaScript. Works offline."
    };

    return (
        <html lang="en">
            <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                {children}
            </body>
        </html>
    );
}
