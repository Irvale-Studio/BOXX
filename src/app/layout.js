import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "BOXX | Luxury Boutique Boxing & Personal Training Studio in Chiang Mai",
  description:
    "Chiang Mai's first luxury boutique boxing and personal training studio. UK-qualified coaches delivering authentic British boxing and strength training. Small-group classes, max 6 per session.",
  keywords: [
    "boxing",
    "chiang mai",
    "personal training",
    "boutique gym",
    "luxury fitness",
    "boxing classes",
    "strength training",
    "thailand",
  ],
  openGraph: {
    title: "BOXX | Luxury Boutique Boxing Studio in Chiang Mai",
    description:
      "Boxing and strength training, done properly. Small-group classes led by UK-qualified coaches.",
    type: "website",
    locale: "en_US",
    url: "https://www.boxxthailand.com",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
