import { ClerkProvider } from '@clerk/nextjs'
import { AppContextProvider } from '@/context/AppContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata = {
  title: 'DTF Drop',
  description: 'Online Drop Shoulder Shop..',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className} suppressHydrationWarning={true}>
        <ClerkProvider>
          <AppContextProvider>
            <ThemeProvider>
              <Navbar />
              <Toaster />
              <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
                {children}
              </main>
              <Footer />
            </ThemeProvider>
          </AppContextProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}

