/**
 * Permission system for the admin dashboard.
 *
 * Roles: ADMIN, SELLER, VENDOR, CUSTOMER
 * ADMIN  → full access
 * SELLER → own shop + products + orders
 * VENDOR → same as seller
 * Others → no dashboard access
 */

// ── Role definitions ──────────────────────────────────────────────

export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  SELLER: "SELLER",
  VENDOR: "VENDOR",
  CUSTOMER: "CUSTOMER",
  WHOLESALER: "WHOLESALER",
  AFFILIATE: "AFFILIATE",
};

// Admin-level roles that can access the dashboard
export const DASHBOARD_ROLES = [ROLES.ADMIN, ROLES.STAFF, ROLES.SELLER, ROLES.VENDOR];

// Full admin roles (unrestricted access)
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.STAFF];

// ── Route permissions ─────────────────────────────────────────────

const ROUTE_PERMISSIONS = {
  "/dashboard": DASHBOARD_ROLES,
  "/dashboard/analytics": ADMIN_ROLES,
  "/dashboard/products": DASHBOARD_ROLES,
  "/dashboard/leftover-packs": DASHBOARD_ROLES,
  "/dashboard/orders": DASHBOARD_ROLES,
  "/dashboard/users": ADMIN_ROLES,
  "/dashboard/vendors": ADMIN_ROLES,
  "/dashboard/shops": ADMIN_ROLES,
  "/dashboard/tickets": ADMIN_ROLES,
  "/dashboard/shipping": ADMIN_ROLES,
  "/dashboard/website": ADMIN_ROLES,
  "/dashboard/sections": ADMIN_ROLES,
  "/dashboard/import-export": ADMIN_ROLES,
  "/dashboard/settings": ADMIN_ROLES,
};

/**
 * Check if a user role can access a route.
 */
export function canAccessRoute(userType, pathname) {
  if (!userType) return false;

  // Login page is always accessible
  if (pathname === "/dashboard/login") return true;

  // Find the most specific matching route
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(route + "/"));

  if (!matchedRoute) {
    // Default: require dashboard access
    return DASHBOARD_ROLES.includes(userType);
  }

  return ROUTE_PERMISSIONS[matchedRoute].includes(userType);
}

/**
 * Check if user is full admin.
 */
export function isAdmin(userType) {
  return ADMIN_ROLES.includes(userType);
}

/**
 * Check if user is seller/vendor.
 */
export function isSeller(userType) {
  return userType === ROLES.SELLER || userType === ROLES.VENDOR;
}

/**
 * Check if user can manage a specific module.
 */
export function canManage(userType, module) {
  if (isAdmin(userType)) return true;

  // Sellers/vendors can manage their own products, orders, shops
  if (isSeller(userType)) {
    return ["products", "orders", "shops"].includes(module);
  }

  return false;
}

/**
 * Filter sidebar items based on user role.
 */
export function filterMenuByRole(menuGroups, userType) {
  if (!userType) return [];
  if (isAdmin(userType)) return menuGroups;

  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(userType, item.href)),
    }))
    .filter((group) => group.items.length > 0);
}
