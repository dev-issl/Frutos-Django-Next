// src/app/api/products-fresh/route.js
import { getProducts, getCategories } from '@/lib/api_product'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const session = await auth()
        let token = session?.user?.accessToken

        if (!token && request) {
            const cookieToken = request.cookies?.get('access_token')?.value
            const authHeader = request.headers?.get('authorization')
            const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
            token = cookieToken || headerToken || null
        }

        const [products, categories] = await Promise.all([
            getProducts({ token }),
            getCategories(),
        ])
        return NextResponse.json({ products, categories })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}