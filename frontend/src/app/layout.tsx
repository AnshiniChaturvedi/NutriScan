import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NutriScan AI — Know What You Eat',
  description:
    'AI-powered food health analysis. Scan any packaged food barcode and get instant health insights, disease risk assessments, and personalized nutrition guidance.',
  keywords: ['nutrition', 'food scanner', 'health', 'AI', 'barcode', 'ingredient analysis'],
  openGraph: {
    title: 'NutriScan AI',
    description: 'Scan your food. Know what you eat.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-bg-primary text-white antialiased`}>{children}</body>
    </html>
  );
}
