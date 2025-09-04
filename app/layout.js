import { ClerkProvider } from '@clerk/nextjs'
import { AppContextProvider } from '@/context/AppContext'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata = {
  title: 'QuickCart',
  description: 'Ecommerce website',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <AppContextProvider>
        <html lang="en">
          <body className={outfit.className}>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <Toaster />
          </body>
        </html>
      </AppContextProvider>
    </ClerkProvider>
  )
}

