import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/lib/ClientProviders";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { scheduleJobsOnStartup } from "@/lib/jobScheduler"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ['latin'], // you can also add 'latin-ext', etc.
  weight: ['400', '500', '600', '700'], // optional
  variable: '--font-inter', // optional for CSS variables
});

export const metadata: Metadata = {
  title:"Frugo",
  description: "Your one-stop solution for all things",
};
let initialized = false
export async function initApp() {
  if (!initialized) {
    initialized = true
    console.log("⏳ Scheduling jobs on startup...")
    await scheduleJobsOnStartup()
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <html lang="en">
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        className={inter.className}
      >
           <ClientProviders>
             <ServiceWorkerRegister/>
        {children}
        </ClientProviders>
      </body>
    </html>

  );
}
