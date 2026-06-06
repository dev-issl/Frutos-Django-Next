// src/app/layout.jsx
import { Newsreader, Manrope } from 'next/font/google'
import './globals.css'
import { AuthProvider }     from '@/app/context/AuthContext'
import { CartProvider }     from '@/app/context/CartContext'
import { WishlistProvider } from '@/app/context/WishlistContext'
import NavbarWrapper from '@/app/components/NavbarWrapper'
import FooterWrapper from '@/app/components/FooterWrapper'
import CartSidebar          from '@/app/components/CartSidebar'
import Providers            from '@/app/providers'
import SessionGuard         from '@/app/components/SessionGuard'
import { getSiteConfig }    from '@/lib/api_site_config'

const newsreader = Newsreader({
  subsets:  ['latin'],
  variable: '--font-newsreader',
  weight:   ['200', '300', '400', '500', '600', '700', '800'],
  style:    ['normal', 'italic'],
  display:  'swap',
})

const manrope = Manrope({
  subsets:  ['latin'],
  variable: '--font-manrope',
  weight:   ['200', '300', '400', '500', '600', '700', '800'],
  display:  'swap',
})

export const metadata = {
  title:       'El Árbol',
  description: 'Artisan produce, delivered with care.',
  icons: {
    icon:  '/favicon_orrange.jpeg',
    apple: '/favicon_orrange.jpeg',
  },
}

export default async function RootLayout({ children }) {
  const siteConfig = await getSiteConfig()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <style>{`
          html, body, #__next {
            background: #ffffff !important;
            color: #151e13 !important;
          }
        `}</style>
      </head>
      <body
        className={`${newsreader.variable} ${manrope.variable}`}
        style={{
          fontFamily: '"Manrope", sans-serif',
          background: '#ffffff',
          color:      '#151e13',
          minHeight:  '100vh',
        }}
      >
        <Providers>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <SessionGuard />
                <NavbarWrapper
                  navbarLogoUrl={siteConfig?.navbar_logo_url || ''}
                  brandName={siteConfig?.brand_name || 'El Árbol'}
                  navLinks={siteConfig?.nav_links || []}
                />
                <main style={{ background: '#ffffff', minHeight: '100vh' }} className="md:pb-0">
                  {children}
                </main>
                <CartSidebar />
              </CartProvider>
              <FooterWrapper config={siteConfig} />
            </WishlistProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}