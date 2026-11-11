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

/**
 * Resolves a category's fallback studio photo by keyword when the backend
 * category has no uploaded image or fails to load.
 */
export function pickCategoryFallbackImage(categoryOrName) {
  const rawName =
    typeof categoryOrName === 'string'
      ? categoryOrName
      : (categoryOrName?.name || categoryOrName?.label || '')
  const lower = rawName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese') || lower.includes('lact')) {
    return '/homepage/cat_card_dairy.webp'
  }
  if (lower.includes('organic') || lower.includes('bio') || lower.includes('grain') || lower.includes('wheat')) {
    return '/homepage/cat_card_organic.webp'
  }
  if (lower.includes('veg') || lower.includes('vagitable') || lower.includes('verdura') || lower.includes('carrot') || lower.includes('tomato')) {
    return '/homepage/cat_card_vegetables.webp'
  }
  if (lower.includes('fruit') || lower.includes('fruta') || lower.includes('apple') || lower.includes('mango')) {
    return '/homepage/cat_card_fruits.webp'
  }
  return '/homepage/cat_card_others.webp'
}

/**
 * Checks whether a normalized product belongs to a target backend category
 * (string name, slug, or category object). Matches both direct product.category
 * and sub_category parent category to stay consistent with Django backend filters.
 */
export function doesProductMatchCategory(product, target) {
  if (!product || !target) return false

  const targetObj = typeof target === 'object' ? target : null
  const targetName = (targetObj?.name || (typeof target === 'string' ? target : '')).trim().toLowerCase()
  const targetSlug = (targetObj?.slug || '').trim().toLowerCase()
  const targetId = targetObj?.id != null ? String(targetObj.id) : null

  if (targetName === 'all' || targetName === 'all produce') return true
  if (targetName === 'on sale') return Boolean(product.onSale)

  const pCatName = (typeof product.category === 'string' ? product.category : product.category?.name || '')
    .trim()
    .toLowerCase()
  const pCatSlug = (product.categorySlug || product.category?.slug || '').trim().toLowerCase()
  const pCatId =
    product.categoryId != null
      ? String(product.categoryId)
      : product.category?.id != null
      ? String(product.category.id)
      : null

  const pSubCatParentName = (
    product.subCategoryCategoryName ||
    product.sub_category?.category?.name ||
    product.sub_category?.category_name ||
    ''
  )
    .trim()
    .toLowerCase()
  const pSubCatParentSlug = (
    product.subCategoryCategorySlug ||
    product.sub_category?.category?.slug ||
    ''
  )
    .trim()
    .toLowerCase()
  const pSubCatParentId =
    product.subCategoryCategoryId != null
      ? String(product.subCategoryCategoryId)
      : product.sub_category?.category?.id != null
      ? String(product.sub_category.category.id)
      : typeof product.sub_category?.category === 'number'
      ? String(product.sub_category.category)
      : null

  if (targetId && (pCatId === targetId || pSubCatParentId === targetId)) return true
  if (targetSlug && (pCatSlug === targetSlug || pSubCatParentSlug === targetSlug)) return true
  if (targetName && (pCatName === targetName || pSubCatParentName === targetName)) return true

  return false
}


