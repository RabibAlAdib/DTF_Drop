'use client';

import { ClerkProvider } from '@clerk/nextjs'
import { AppContextProvider } from '@/context/AppContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import FloatingCart from '@/components/FloatingCart'
import ScrollIndicator from '@/components/ScrollIndicator'
import FloatingAdminButton from '@/components/admin/FloatingAdminButton'

const outfit = Outfit({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={outfit.className} suppressHydrationWarning={true}>
        <ClerkProvider>
          <AppContextProvider>
            <ThemeProvider>
              <ScrollIndicator />
              <Navbar />
              <Toaster />
              <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 relative">
                <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
                  <div className="md:text-left text-center animate-fade-in-up">
                    {children}
                  </div>
                </div>
              </main>
              <FloatingCart />
              <FloatingAdminButton />
              <Footer />
            </ThemeProvider>
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}

