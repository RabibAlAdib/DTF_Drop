import { ClerkProvider } from '@clerk/nextjs'
import { AppContextProvider } from '@/context/AppContext'
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
    <ClerkProvider>
      <AppContextProvider>
        <html lang="en">
          <body className={outfit.className}>
            {/* <Navbar /> */}
            <Toaster />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </body>
        </html>
      </AppContextProvider>
    </ClerkProvider>
  )
}

