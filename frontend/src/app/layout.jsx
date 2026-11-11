// src/app/layout.jsx
import { Newsreader, Manrope } from 'next/font/google'
import './globals.css'
import { AuthProvider }     from '@/app/context/AuthContext'
import { CartProvider }     from '@/app/context/CartContext'
import { WishlistProvider } from '@/app/context/WishlistContext'
// import Navbar               from '@/app/components/Navbar'
// import Footer               from '@/app/components/Footer'
import NavbarWrapper from '@/app/components/NavbarWrapper'
import FooterWrapper from '@/app/components/FooterWrapper'
import CartSidebar          from '@/app/components/CartSidebar'
import FloatingCart         from '@/app/components/FloatingCart'
import Providers            from '@/app/providers'
import SessionGuard         from '@/app/components/SessionGuard'
import LiveChatWidget       from '@/app/components/livechat/LiveChatWidget'
import { getSiteConfig }    from '@/lib/api_site_config'
import NextTopLoader        from 'nextjs-toploader'
import FaviconUpdater       from '@/app/components/FaviconUpdater'
import DeferredMaterialSymbols from '@/app/components/DeferredMaterialSymbols'

//  force-dynamic সরিয়ে দাও — tag revalidation-এর সাথে conflict করে
// export const dynamic = 'force-dynamic'   ← এটা DELETE করো

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

export async function generateMetadata() {
  const siteConfig = await getSiteConfig();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: siteConfig?.meta_title || 'El Árbol',
    description: siteConfig?.meta_description || 'Artisan produce, delivered with care.',
    keywords: siteConfig?.meta_keywords || 'El Árbol, artisan, produce',
    openGraph: {
      title: siteConfig?.og_title || siteConfig?.meta_title || 'El Árbol',
      description: siteConfig?.og_description || siteConfig?.meta_description || 'Artisan produce, delivered with care.',
      images: siteConfig?.og_image_url ? [{ url: siteConfig.og_image_url }] : [],
    },
    icons: {
      icon:  siteConfig?.favicon_url || '/favicon_orrange.jpeg',
      apple: siteConfig?.favicon_url || '/favicon_orrange.jpeg',
    },
  };
}

export default async function RootLayout({ children }) {
  const siteConfig = await getSiteConfig()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          html, body, #__next {
            background: #EFF9F2 !important;
            color: #0D2C23 !important;
          }
        `}</style>
      </head>
      <body
        className={`${newsreader.variable} ${manrope.variable}`}
        style={{
          fontFamily: '"Manrope", sans-serif',
          background: '#EFF9F2',
          color:      '#0D2C23',
          minHeight:  '100vh',
        }}
      >
        <FaviconUpdater />
        <DeferredMaterialSymbols />
        <NextTopLoader color="#57A12A" height={2} showSpinner={false} />
        <Providers>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <SessionGuard />
                <NavbarWrapper
                  navbarLogoUrl={siteConfig?.navbar_logo_url || ''}
                  brandName={siteConfig?.brand_name || 'El Árbol'}
                />
                <main style={{ background: '#EFF9F2', minHeight: '100vh' }} className="md:pb-0">
                  {children}
                </main>
                <FloatingCart />
                <CartSidebar />
                <LiveChatWidget 
                  initialLogoUrl={siteConfig?.chat_logo_url || siteConfig?.navbar_logo_url || siteConfig?.favicon_url || '/favicon_orrange.jpeg'} 
                />
              </CartProvider>
              <FooterWrapper config={siteConfig} />
            </WishlistProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}