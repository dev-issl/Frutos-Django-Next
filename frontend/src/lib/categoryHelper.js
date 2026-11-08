/**
 * categoryHelper.js
 * Utilities for category identification and wholesale role detection.
 */

/**
 * Detects whether a user is an Internal Wholesale user ('WHOLESALER')
 * and NOT a restaurant/external wholesale or retail customer.
 */
export function checkIsInternalWholesale(session, user) {
  // Check NextAuth session
  if (session?.user) {
    const sType = String(session.user.userType || session.user.user_type || '').toUpperCase()
    if (sType === 'RESTAURANT') return false
    if (sType === 'WHOLESALER' || sType === 'INTERNAL' || session.user.accessToken) {
      return true
    }
  }

  // Check AuthContext user
  if (user) {
    const uType = String(user.user_type || user.userType || '').toUpperCase()
    if (uType === 'RESTAURANT') return false
    if (uType === 'WHOLESALER' || uType === 'INTERNAL_WHOLESALE' || uType === 'INTERNAL') {
      return true
    }
  }

  return false
}

/**
 * Finds the "FRUTAS Y VERDURAS" / "Fruits & Vegetables" category name
 * from a list of categories (which can be strings or objects with .name or .title).
 */
export function getFrutasCategoryName(categoriesList) {
  if (!Array.isArray(categoriesList) || categoriesList.length === 0) return null

  // Priority 1: Match both fruta & verdura or fruit & vegetable
  const exactMatch = categoriesList.find(c => {
    const raw = typeof c === 'string' ? c : (c?.name || c?.title || '')
    if (typeof raw !== 'string') return false
    const lower = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return (
      (lower.includes('fruta') && lower.includes('verdura')) ||
      (lower.includes('fruit') && lower.includes('vegetable')) ||
      (lower.includes('fruit') && lower.includes('vagitable'))
    )
  })

  if (exactMatch) {
    return typeof exactMatch === 'string' ? exactMatch : (exactMatch.name || exactMatch.title)
  }

  // Priority 2: Match fruta or fruit
  const partialMatch = categoriesList.find(c => {
    const raw = typeof c === 'string' ? c : (c?.name || c?.title || '')
    if (typeof raw !== 'string') return false
    const lower = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return lower.includes('fruta') || lower.includes('fruit')
  })

  if (partialMatch) {
    return typeof partialMatch === 'string' ? partialMatch : (partialMatch.name || partialMatch.title)
  }

  return null
}

