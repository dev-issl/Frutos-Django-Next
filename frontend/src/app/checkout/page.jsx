
// // src/app/checkout/page.jsx — SERVER COMPONENT
// import { cookies }          from 'next/headers'
// import { auth }             from '@/auth'
// import { getDeliveryWindows, getDeliveryOption } from '@/lib/api'
// import { getProducts }      from '@/lib/api_product'
// import CheckoutShell        from '@/app/checkout/components/CheckoutShell'
// import ProductCard          from '@/app/components/ProductCard'

// export const dynamic = 'force-dynamic'

// export const metadata = {
//   title:       'Checkout | El Árbol',
//   description: 'Complete your order.',
// }

// const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

// async function fetchRegularUserData() {
//   const cookieStore = await cookies()
//   const token = cookieStore.get('access_token')?.value
//   if (!token) return null

//   const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
//   try {
//     const [profileRes, addressRes] = await Promise.allSettled([
//       fetch(`${API_BASE}/auth/profile/`,   { headers, cache: 'no-store' }),
//       fetch(`${API_BASE}/auth/addresses/`, { headers, cache: 'no-store' }),
//     ])
//     const profile     = profileRes.status  === 'fulfilled' && profileRes.value.ok ? await profileRes.value.json() : null
//     const addressData = addressRes.status  === 'fulfilled' && addressRes.value.ok ? await addressRes.value.json() : null
//     const addresses   = Array.isArray(addressData) ? addressData : (addressData?.results || [])
//     const defaultAddr = addresses.find(a => a.isDefault) ?? addresses[0] ?? null

//     return {
//       type:      'regular',
//       name:      profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '',
//       phone:     defaultAddr?.phone     || profile?.profile?.phone || '',
//       street:    defaultAddr?.street    || '',
//       city:      defaultAddr?.city      || '',
//       postcode:  defaultAddr?.postcode  || '',
//       addresses,
//     }
//   } catch { return null }
// }

// export default async function CheckoutPage() {
//   const session = await auth()

//   const [windowsResult, productsResult, regularData, deliveryResult] = await Promise.allSettled([
//     getDeliveryWindows(),
//     getProducts(),
//     session?.user ? Promise.resolve(null) : fetchRegularUserData(),
//     getDeliveryOption(),   // ← DB থেকে delivery config
//   ])

//   const { dates, slots } = windowsResult.status === 'fulfilled'
//     ? windowsResult.value : { dates: [], slots: [] }

//   const allProducts = productsResult.status === 'fulfilled' ? productsResult.value : []
//   const displayedFruits = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 4)

//   // ── delivery config ────────────────────────────────────────────────────────
//   const deliveryConfig = deliveryResult.status === 'fulfilled' ? deliveryResult.value : null

//   // ── initialUserData ────────────────────────────────────────────────────────
//   let initialUserData = null
//   if (session?.user) {
//     initialUserData = {
//       type:      'wholesale',
//       name:      session.user.contactName || '',
//       phone:     session.user.phone       || '',
//       street:    '',
//       city:      '',
//       postcode:  session.user.postcode    || '',
//       addresses: [],
//     }
//   } else if (regularData.status === 'fulfilled' && regularData.value) {
//     initialUserData = regularData.value
//   }

//   return (
//     <>
//       <CheckoutShell
//         deliveryDates={dates}
//         deliverySlots={slots}
//         initialUserData={initialUserData}
//         deliveryConfig={deliveryConfig}   // ← pass করা হচ্ছে
//       />

//       <section className="bg-white border-t mb-12 border-gray-50">
//         <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
//           <div className="flex flex-col items-center text-center mb-10 md:mb-14">
//             <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-[#00694C] uppercase mb-3">
//               Wait, there's more
//             </span>
//             <h2 className="text-[#151E13]" style={{
//               fontFamily: '"Playfair Display", Georgia, serif',
//               fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
//               fontWeight: 700, lineHeight: 1.2,
//             }}>
//               Seasonal Essentials
//             </h2>
//             <div className="w-12 h-[2px] bg-[#BCCAC1] mt-5 mb-2" />
//             <p className="text-[#6D7A73] text-sm md:text-base max-w-md font-serif italic">
//               Handpicked fresh arrivals you might have missed for your kitchen.
//             </p>
//           </div>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
//             {displayedFruits.map(product => (
//               <ProductCard key={product.id} product={product} notified={false} />
//             ))}
//           </div>
//           <div className="mt-8 text-center">
//             <a href="/shop" className="text-[13px] font-bold text-[#151E13] border-b-2 border-[#00694C] pb-1 hover:text-[#00694C] transition-colors">
//               VIEW ALL PRODUCE
//             </a>
//           </div>
//         </div>
//       </section>
//     </>
//   )
// }

// src/app/checkout/page.jsx — SERVER COMPONENT
import { cookies }          from 'next/headers'
import { auth }             from '@/auth'
import { getDeliveryWindows, getDeliveryOption } from '@/lib/api'
import { getProducts }      from '@/lib/api_product'
import CheckoutShell        from '@/app/checkout/components/CheckoutShell'
import ProductCard          from '@/app/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title:       'Checkout | El Árbol',
  description: 'Complete your order.',
}

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

async function fetchRegularUserData() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  try {
    const [profileRes, addressRes] = await Promise.allSettled([
      fetch(`${API_BASE}/auth/profile/`,   { headers, cache: 'no-store' }),
      fetch(`${API_BASE}/auth/addresses/`, { headers, cache: 'no-store' }),
    ])
    const profile     = profileRes.status  === 'fulfilled' && profileRes.value.ok ? await profileRes.value.json() : null
    const addressData = addressRes.status  === 'fulfilled' && addressRes.value.ok ? await addressRes.value.json() : null
    const addresses   = Array.isArray(addressData) ? addressData : (addressData?.results || [])
    const defaultAddr = addresses.find(a => a.isDefault) ?? addresses[0] ?? null

    return {
      type:      'regular',
      name:      profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '',
      // ✅ FIX: email যোগ করা হয়েছে
      email:     profile?.email || '',
      phone:     defaultAddr?.phone     || profile?.profile?.phone || '',
      street:    defaultAddr?.street    || '',
      city:      defaultAddr?.city      || '',
      postcode:  defaultAddr?.postcode  || '',
      addresses,
    }
  } catch { return null }
}

export default async function CheckoutPage() {
  const session = await auth()

  const [windowsResult, productsResult, regularData, deliveryResult] = await Promise.allSettled([
    getDeliveryWindows(),
    getProducts(),
    session?.user ? Promise.resolve(null) : fetchRegularUserData(),
    getDeliveryOption(),
  ])

  const { dates, slots } = windowsResult.status === 'fulfilled'
    ? windowsResult.value : { dates: [], slots: [] }

  const allProducts = productsResult.status === 'fulfilled' ? productsResult.value : []
  const displayedFruits = [...allProducts].sort(() => Math.random() - 0.5).slice(0, 4)

  const deliveryConfig = deliveryResult.status === 'fulfilled' ? deliveryResult.value : null

  // ── initialUserData ────────────────────────────────────────────────────────
  let initialUserData = null
  if (session?.user) {
    initialUserData = {
      type:      'wholesale',
      name:      session.user.contactName || '',
      // ✅ FIX: wholesale user-এর email যোগ করা হয়েছে
      email:     session.user.email       || '',
      phone:     session.user.phone       || '',
      street:    '',
      city:      '',
      postcode:  session.user.postcode    || '',
      addresses: [],
    }
  } else if (regularData.status === 'fulfilled' && regularData.value) {
    initialUserData = regularData.value
  }

  return (
    <>
      <CheckoutShell
        deliveryDates={dates}
        deliverySlots={slots}
        initialUserData={initialUserData}
        deliveryConfig={deliveryConfig}
      />

      <section className="bg-white border-t mb-12 border-gray-50">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex flex-col items-center text-center mb-10 md:mb-14">
            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-[#00694C] uppercase mb-3">
              Wait, there's more
            </span>
            <h2 className="text-[#151E13]" style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700, lineHeight: 1.2,
            }}>
              Seasonal Essentials
            </h2>
            <div className="w-12 h-[2px] bg-[#BCCAC1] mt-5 mb-2" />
            <p className="text-[#6D7A73] text-sm md:text-base max-w-md font-serif italic">
              Handpicked fresh arrivals you might have missed for your kitchen.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {displayedFruits.map(product => (
              <ProductCard key={product.id} product={product} notified={false} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/shop" className="text-[13px] font-bold text-[#151E13] border-b-2 border-[#00694C] pb-1 hover:text-[#00694C] transition-colors">
              VIEW ALL PRODUCE
            </a>
          </div>
        </div>
      </section>
    </>
  )
}