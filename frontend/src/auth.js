// src/auth.js
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const WHOLESALE_BASE = API_BASE + '/wholesale'

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            id: 'wholesale',
            name: 'Wholesale',
            credentials: {
                email: { label: 'Email or Wholesale ID', type: 'text' },
                password: { label: 'Password', type: 'password' },
                wholesaleId: { label: 'Wholesale ID', type: 'text' },
                loginType: { label: 'Login Type', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials) {
                    return null
                }
                const identifier = (credentials.wholesaleId || credentials.email || '').trim()
                if (!identifier) {
                    return null
                }

                const isIdLogin = credentials.loginType === 'wholesale_id' || (!credentials.password && Boolean(credentials.wholesaleId || identifier.toUpperCase().startsWith('WHL-')))

                const payload = {
                    login_type: isIdLogin ? 'wholesale_id' : 'email',
                }
                if (isIdLogin || identifier.toUpperCase().startsWith('WHL-')) {
                    payload.wholesale_id = identifier
                    payload.email = identifier
                } else {
                    payload.email = identifier
                }
                if (credentials.password) {
                    payload.password = credentials.password
                }

                try {
                    const res = await fetch(WHOLESALE_BASE + '/auth/login/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    })

                    if (!res.ok) return null

                    const data = await res.json()
                    const u = data.user

                    return {
                        id: u.id,
                        email: u.email,
                        wholesaleId: u.wholesale_id || '',
                        wholesale_id: u.wholesale_id || '',
                        store: u.store || null,
                        storeId: u.store_id || (u.store ? (typeof u.store === 'object' ? u.store.id : u.store) : null),
                        storeName: u.store_name || (u.store && typeof u.store === 'object' ? u.store.name : null),
                        storeCode: u.store_code || (u.store && typeof u.store === 'object' ? u.store.store_code : null),
                        userType: u.user_type || 'WHOLESALER',
                        name: u.contact_name,
                        businessName: u.business_name,
                        contactName: u.contact_name,
                        phone: u.phone || '',
                        postcode: u.postcode || '',
                        businessType: u.business_type,
                        displayBusinessType: u.display_business_type,
                        monthlyVolume: u.monthly_volume,
                        displayVolume: u.display_volume,
                        status: u.status,
                        isApproved: u.is_approved,
                        appliedAt: u.applied_at,
                        approvedAt: u.approved_at || null,
                        accountManagerName: u.account_manager_name || '',
                        accountManagerEmail: u.account_manager_email || '',
                        totalOrders: u.total_orders,
                        totalSpent: u.total_spent,
                        accessToken: data.access,
                        refreshToken: data.refresh,
                    }
                } catch (error) {
                    console.error('[WholesaleAuth] Login error:', error)
                    return null
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id
                token.email = user.email
                token.wholesaleId = user.wholesaleId
                token.storeId = user.storeId
                token.storeName = user.storeName
                token.storeCode = user.storeCode
                token.store = user.store
                token.userType = user.userType || user.user_type || 'WHOLESALER'
                token.businessName = user.businessName
                token.contactName = user.contactName
                token.phone = user.phone
                token.postcode = user.postcode
                token.businessType = user.businessType
                token.displayBusinessType = user.displayBusinessType
                token.monthlyVolume = user.monthlyVolume
                token.displayVolume = user.displayVolume
                token.status = user.status
                token.isApproved = user.isApproved
                token.appliedAt = user.appliedAt
                token.approvedAt = user.approvedAt
                token.accountManagerName = user.accountManagerName
                token.accountManagerEmail = user.accountManagerEmail
                token.totalOrders = user.totalOrders
                token.totalSpent = user.totalSpent
                token.accessToken = user.accessToken
                token.refreshToken = user.refreshToken
                token.accessTokenExpiry = Date.now() + 55 * 60 * 1000
                return token
            }

            // Manual session update after profile edit
            if (trigger === 'update' && session) {
                return Object.assign({}, token, session)
            }

            // Token still valid — return as is
            const expiry = token.accessTokenExpiry || 0
            if (Date.now() < expiry) {
                return token
            }

            // Token expired — try to refresh
            return refreshAccessToken(token)
        },

        async session({ session, token }) {
            session.user = {
                id: token.id,
                email: token.email,
                wholesaleId: token.wholesaleId || '',
                wholesale_id: token.wholesaleId || '',
                store: token.store || null,
                storeId: token.storeId || null,
                storeName: token.storeName || null,
                storeCode: token.storeCode || null,
                userType: token.userType || 'WHOLESALER',
                user_type: token.userType || 'WHOLESALER',
                businessName: token.businessName,
                contactName: token.contactName,
                phone: token.phone,
                postcode: token.postcode,
                businessType: token.businessType,
                displayBusinessType: token.displayBusinessType,
                monthlyVolume: token.monthlyVolume,
                displayVolume: token.displayVolume,
                status: token.status,
                isApproved: token.isApproved,
                appliedAt: token.appliedAt,
                approvedAt: token.approvedAt,
                accountManagerName: token.accountManagerName,
                accountManagerEmail: token.accountManagerEmail,
                totalOrders: token.totalOrders,
                totalSpent: token.totalSpent,
                accessToken: token.accessToken,
            }
            session.error = token.error || null
            return session
        },
    },

    pages: {
        signIn: '/wholesale',
        error: '/wholesale',
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },

    // secret: process.env.NEXTAUTH_SECRET,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'elarbol_auth_secret_2026_super_secret_key',
})

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken(token) {
    if (isRefreshing && refreshPromise) {
        try {
            const data = await refreshPromise;
            return Object.assign({}, token, {
                accessToken: data.access,
                refreshToken: data.refresh || token.refreshToken,
                accessTokenExpiry: Date.now() + 55 * 60 * 1000,
                error: undefined,
            });
        } catch (err) {
            return Object.assign({}, token, { error: 'RefreshAccessTokenError' });
        }
    }

    isRefreshing = true;
    refreshPromise = fetch(WHOLESALE_BASE + '/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: token.refreshToken }),
    }).then(async (res) => {
        if (!res.ok) throw new Error('Refresh failed');
        return await res.json();
    });

    try {
        const data = await refreshPromise;
        return Object.assign({}, token, {
            accessToken: data.access,
            refreshToken: data.refresh || token.refreshToken,
            accessTokenExpiry: Date.now() + 55 * 60 * 1000,
            error: undefined,
        });
    } catch (err) {
        return Object.assign({}, token, { error: 'RefreshAccessTokenError' });
    } finally {
        isRefreshing = false;
        // Keep the promise for a short grace period (e.g. 10 seconds)
        // just in case of slightly delayed concurrent requests
        setTimeout(() => { refreshPromise = null; }, 10000);
    }
}