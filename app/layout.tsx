import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains"
});

export const metadata: Metadata = {
    title: "Unformat Shredder | Client-Side Metadata Remover",
    description: "Securely remove metadata from images, PDFs, and text files entirely in your browser. 100% Client-Side, Zero Uploads.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
                {children}
            </body>
        </html>
    );
}
