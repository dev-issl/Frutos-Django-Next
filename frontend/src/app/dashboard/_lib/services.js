// /**
//  * Generic Model Service Factory
//  *
//  * Creates CRUD + import/export API methods for any Django model.
//  * Maps to both REST API endpoints and dashboard generic endpoints.
//  */

// import api, { API_BASE_URL } from "./api";

// /**
//  * Create a service for a REST API resource.
//  *
//  * @param {string} basePath - e.g. "/api/products/products"
//  * @param {object} opts
//  * @param {string} opts.lookupField - "id" | "slug" | "order_number" etc.
//  * @param {string} opts.appLabel - Django app label for import/export (e.g. "products")
//  * @param {string} opts.modelName - Django model name for import/export (e.g. "product")
//  */
// export function createModelService(basePath, opts = {}) {
//     const { lookupField = "id", appLabel, modelName } = opts;

//     // Ensure path ends with /
//     const base = basePath.endsWith("/") ? basePath : basePath + "/";

//     return {
//         // ── CRUD ────────────────────────────────────────────────────

//         /** List with pagination, search, filters */
//         list(params = {}) {
//             return api.get(base, params);
//         },

//         /** Get single record */
//         get(lookup) {
//             return api.get(`${base}${lookup}/`);
//         },

//         /** Create record */
//         create(data) {
//             return api.post(base, data);
//         },

//         /** Full update */
//         update(lookup, data) {
//             return api.put(`${base}${lookup}/`, data);
//         },

//         /** Partial update */
//         patch(lookup, data) {
//             return api.patch(`${base}${lookup}/`, data);
//         },

//         /** Delete record */
//         delete(lookup) {
//             return api.delete(`${base}${lookup}/`);
//         },

//         // ── Import / Export (via Django dashboard engine) ────────────

//         /** Export all records as CSV (returns raw Response for download) */
//         exportCsv(params) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
//             return api.download(`/dashboard/${appLabel}/${modelName}/export/csv/`, params);
//         },

//         /** Export all records as Excel */
//         exportExcel(params) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
//             return api.download(`/dashboard/${appLabel}/${modelName}/export/excel/`, params);
//         },

//         /** Export selected records as CSV */
//         bulkExportCsv(ids) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
//             return api.post(`/dashboard/${appLabel}/${modelName}/bulk/export/csv/`, { ids });
//         },

//         /** Export selected records as Excel */
//         bulkExportExcel(ids) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
//             return api.post(`/dashboard/${appLabel}/${modelName}/bulk/export/excel/`, { ids });
//         },

//         /** Download import template */
//         importTemplate() {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
//             return api.download(`/dashboard/${appLabel}/${modelName}/import/template/`);
//         },

//         /** Import data from file (FormData with 'file' field) */
//         importFile(formData) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
//             return api.post(`/dashboard/${appLabel}/${modelName}/import/`, formData);
//         },

//         /** Export single record */
//         exportSingleCsv(pk) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Not configured"));
//             return api.download(`/dashboard/${appLabel}/${modelName}/${pk}/export/csv/`);
//         },

//         exportSingleExcel(pk) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Not configured"));
//             return api.download(`/dashboard/${appLabel}/${modelName}/${pk}/export/excel/`);
//         },

//         /** Bulk delete */
//         bulkDelete(ids) {
//             if (!appLabel || !modelName) return Promise.reject(new Error("Not configured"));
//             return api.post(`/dashboard/${appLabel}/${modelName}/bulk/delete/`, { ids });
//         },

//         // Meta
//         _basePath: base,
//         _appLabel: appLabel,
//         _modelName: modelName,
//         _lookupField: lookupField,
//     };
// }

// // ── Pre-built services for each module ──────────────────────────

// export const productsService = createModelService("/api/products/products", {
//     lookupField: "slug",
//     appLabel: "products",
//     modelName: "product",
// });

// export const categoriesService = createModelService("/api/products/categories", {
//     lookupField: "slug",
//     appLabel: "products",
//     modelName: "category",
// });

// export const subcategoriesService = createModelService("/api/products/subcategories", {
//     lookupField: "slug",
//     appLabel: "products",
//     modelName: "subcategory",
// });

// export const brandsService = createModelService("/api/products/brands", {
//     lookupField: "slug",
//     appLabel: "products",
//     modelName: "brand",
// });

// export const colorsService = createModelService("/api/products/colors", {
//     lookupField: "id",
//     appLabel: "products",
//     modelName: "color",
// });

// export const sizesService = createModelService("/api/products/sizes", {
//     lookupField: "id",
//     appLabel: "products",
//     modelName: "size",
// });

// export const ordersService = createModelService("/api/orders", {
//     lookupField: "order_number",
//     appLabel: "orders",
//     modelName: "order",
// });

// export const shippingMethodsService = createModelService("/api/orders/shipping-methods", {
//     lookupField: "id",
//     appLabel: "orders",
//     modelName: "shippingmethod",
// });

// export const shippingCategoriesService = createModelService("/api/orders/shipping-categories", {
//     lookupField: "id",
//     appLabel: "orders",
//     modelName: "shippingcategory",
// });

// export const shippingTiersService = createModelService("/api/orders/shipping-tiers", {
//     lookupField: "id",
//     appLabel: "orders",
//     modelName: "shippingtier",
// });

// export const couponsService = createModelService("/api/orders/coupons/", {
//     lookupField: "id",
//     appLabel: "orders",
//     modelName: "coupon",
// });

// export const shopsService = createModelService("/api/shops/shops", {
//     lookupField: "slug",
//     appLabel: "shops",
//     modelName: "shop",
// });

// export const sectionsService = createModelService("/api/sections/sections", {
//     lookupField: "slug",
//     appLabel: "sections",
//     modelName: "section",
// });

// export const sectionItemsService = {
//     ...createModelService("/api/sections/section-items", {
//         lookupField: "id",
//         appLabel: "sections",
//         modelName: "sectionitem",
//     }),
//     /** Bulk-create multiple items in one request */
//     bulkCreate(items) {
//         return api.post("/api/sections/section-items/bulk_create/", items);
//     },
// };

// export const pageSectionsService = createModelService("/api/sections/page-sections", {
//     lookupField: "id",
//     appLabel: "sections",
//     modelName: "pagesection",
// });

// // Orders - free shipping rules
// export const freeShippingRulesService = createModelService("/api/orders/free-shipping-rules", {
//     lookupField: "id",
//     appLabel: "orders",
//     modelName: "freeshippingrule",
// });

// // Website content services - additional
// export const navbarService = createModelService("/api/website/navbar-settings", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "navbarsettings",
// });

// export const offerCategoriesService = createModelService("/api/website/offer-categories", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "offercategory",
// });

// export const horizontalBannersService = createModelService("/api/website/horizontal-banners", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "horizontalpromobanner",
// });

// export const footerLinksService = createModelService("/api/website/footer-links", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "footerlink",
// });

// // Website content services
// export const heroBannersService = createModelService("/api/website/hero-banners", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "herobanner",
// });

// export const offerBannersService = createModelService("/api/website/offer-banners", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "offerbanner",
// });

// export const blogPostsService = createModelService("/api/website/blog-posts", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "blogpost",
// });

// export const footerSectionsService = createModelService("/api/website/footer-sections", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "footersection",
// });

// export const socialLinksService = createModelService("/api/website/social-links", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "socialmedialink",
// });

// export const siteSettingsService = createModelService("/api/website/site-settings", {
//     lookupField: "id",
//     appLabel: "website",
//     modelName: "sitesettings",
// });

// // Orders - invoice
// export const invoiceService = {
//     /** Get invoice HTML for an order */
//     getHtml(orderNumber) {
//         return api.get(`/api/orders/invoice/${orderNumber}/`);
//     },
//     /** Download invoice */
//     download(orderNumber) {
//         return api.download(`/api/orders/invoice/${orderNumber}/`, { download: 1 });
//     },
// };

// // Analytics (aggregated from dashboard views)
// export const analyticsService = {
//     adminDashboard: () => api.get("/api/auth/dashboard/admin/"),
// };


/**
 * Generic Model Service Factory
 *
 * Creates CRUD + import/export API methods for any Django model.
 * Maps to both REST API endpoints and dashboard generic endpoints.
 */

import api, { API_BASE_URL } from "./api";

/**
 * Create a service for a REST API resource.
 *
 * @param {string} basePath - e.g. "/api/products/products"
 * @param {object} opts
 * @param {string} opts.lookupField - "id" | "slug" | "order_number" etc.
 * @param {string} opts.appLabel - Django app label for import/export (e.g. "products")
 * @param {string} opts.modelName - Django model name for import/export (e.g. "product")
 */
export function createModelService(basePath, opts = {}) {
    const { lookupField = "id", appLabel, modelName } = opts;

    // Ensure path ends with /
    const base = basePath.endsWith("/") ? basePath : basePath + "/";

    return {
        // ── CRUD ────────────────────────────────────────────────────

        /** List with pagination, search, filters */
        list(params = {}) {
            return api.get(base, params);
        },

        /** Get single record */
        get(lookup) {
            return api.get(`${base}${lookup}/`);
        },

        /** Create record */
        create(data) {
            return api.post(base, data);
        },

        /** Full update */
        update(lookup, data) {
            return api.put(`${base}${lookup}/`, data);
        },

        /** Partial update */
        patch(lookup, data) {
            return api.patch(`${base}${lookup}/`, data);
        },

        /** Delete record */
        delete(lookup) {
            return api.delete(`${base}${lookup}/`);
        },

        // ── Import / Export (via Django dashboard engine) ────────────

        /** Export all records as CSV (returns raw Response for download) */
        exportCsv(params) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
            return api.download(`/dashboard/${appLabel}/${modelName}/export/csv/`, params);
        },

        /** Export all records as Excel */
        exportExcel(params) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
            return api.download(`/dashboard/${appLabel}/${modelName}/export/excel/`, params);
        },

        /** Export selected records as CSV */
        bulkExportCsv(ids) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
            return api.post(`/dashboard/${appLabel}/${modelName}/bulk/export/csv/`, { ids });
        },

        /** Export selected records as Excel */
        bulkExportExcel(ids) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
            return api.post(`/dashboard/${appLabel}/${modelName}/bulk/export/excel/`, { ids });
        },

        /** Download import template */
        importTemplate() {
            if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
            return api.download(`/dashboard/${appLabel}/${modelName}/import/template/`);
        },

        /** Import data from file (FormData with 'file' field) */
        importFile(formData) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Import/export not configured for this model"));
            return api.post(`/dashboard/${appLabel}/${modelName}/import/`, formData);
        },

        /** Export single record */
        exportSingleCsv(pk) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Not configured"));
            return api.download(`/dashboard/${appLabel}/${modelName}/${pk}/export/csv/`);
        },

        exportSingleExcel(pk) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Not configured"));
            return api.download(`/dashboard/${appLabel}/${modelName}/${pk}/export/excel/`);
        },

        /** Bulk delete */
        bulkDelete(ids) {
            if (!appLabel || !modelName) return Promise.reject(new Error("Not configured"));
            return api.post(`/dashboard/${appLabel}/${modelName}/bulk/delete/`, { ids });
        },

        // Meta
        _basePath: base,
        _appLabel: appLabel,
        _modelName: modelName,
        _lookupField: lookupField,
    };
}

// ── Pre-built services for each module ──────────────────────────

export const productsService = createModelService("/api/products/products", {
    lookupField: "slug",
    appLabel: "products",
    modelName: "product",
});

export const categoriesService = createModelService("/api/products/categories", {
    lookupField: "slug",
    appLabel: "products",
    modelName: "category",
});

export const subcategoriesService = createModelService("/api/products/subcategories", {
    lookupField: "slug",
    appLabel: "products",
    modelName: "subcategory",
});

export const brandsService = createModelService("/api/products/brands", {
    lookupField: "slug",
    appLabel: "products",
    modelName: "brand",
});

export const colorsService = createModelService("/api/products/colors", {
    lookupField: "id",
    appLabel: "products",
    modelName: "color",
});

export const sizesService = createModelService("/api/products/sizes", {
    lookupField: "id",
    appLabel: "products",
    modelName: "size",
});

export const ordersService = createModelService("/api/orders", {
    lookupField: "order_number",
    appLabel: "orders",
    modelName: "order",
});

export const shippingMethodsService = createModelService("/api/orders/shipping-methods", {
    lookupField: "id",
    appLabel: "orders",
    modelName: "shippingmethod",
});

export const shippingCategoriesService = createModelService("/api/orders/shipping-categories", {
    lookupField: "id",
    appLabel: "orders",
    modelName: "shippingcategory",
});

export const shippingTiersService = createModelService("/api/orders/shipping-tiers", {
    lookupField: "id",
    appLabel: "orders",
    modelName: "shippingtier",
});

export const couponsService = createModelService("/api/orders/coupons/", {
    lookupField: "id",
    appLabel: "orders",
    modelName: "coupon",
});

export const shopsService = createModelService("/api/shops/shops", {
    lookupField: "slug",
    appLabel: "shops",
    modelName: "shop",
});

export const sectionsService = createModelService("/api/sections/sections", {
    lookupField: "slug",
    appLabel: "sections",
    modelName: "section",
});

export const sectionItemsService = {
    ...createModelService("/api/sections/section-items", {
        lookupField: "id",
        appLabel: "sections",
        modelName: "sectionitem",
    }),
    /** Bulk-create multiple items in one request */
    bulkCreate(items) {
        return api.post("/api/sections/section-items/bulk_create/", items);
    },
};

export const pageSectionsService = createModelService("/api/sections/page-sections", {
    lookupField: "id",
    appLabel: "sections",
    modelName: "pagesection",
});

// Orders - free shipping rules
export const freeShippingRulesService = createModelService("/api/orders/free-shipping-rules", {
    lookupField: "id",
    appLabel: "orders",
    modelName: "freeshippingrule",
});

// Website content services - additional
export const navbarService = createModelService("/api/website/navbar-settings", {
    lookupField: "id",
    appLabel: "website",
    modelName: "navbarsettings",
});

export const offerCategoriesService = createModelService("/api/website/offer-categories", {
    lookupField: "id",
    appLabel: "website",
    modelName: "offercategory",
});

export const horizontalBannersService = createModelService("/api/website/horizontal-banners", {
    lookupField: "id",
    appLabel: "website",
    modelName: "horizontalpromobanner",
});

export const footerLinksService = createModelService("/api/website/footer-links", {
    lookupField: "id",
    appLabel: "website",
    modelName: "footerlink",
});

// Website content services
export const heroBannersService = createModelService("/api/website/hero-banners", {
    lookupField: "id",
    appLabel: "website",
    modelName: "herobanner",
});

export const offerBannersService = createModelService("/api/website/offer-banners", {
    lookupField: "id",
    appLabel: "website",
    modelName: "offerbanner",
});

export const blogPostsService = createModelService("/api/website/blog-posts", {
    lookupField: "id",
    appLabel: "website",
    modelName: "blogpost",
});

export const footerSectionsService = createModelService("/api/website/footer-sections", {
    lookupField: "id",
    appLabel: "website",
    modelName: "footersection",
});

export const socialLinksService = createModelService("/api/website/social-links", {
    lookupField: "id",
    appLabel: "website",
    modelName: "socialmedialink",
});

export const siteSettingsService = createModelService("/api/website/site-settings", {
    lookupField: "id",
    appLabel: "website",
    modelName: "sitesettings",
});

// Orders - invoice
export const invoiceService = {
    /** Get invoice HTML for an order */
    getHtml(orderNumber) {
        return api.get(`/api/orders/invoice/${orderNumber}/`);
    },
    /** Download invoice */
    download(orderNumber) {
        return api.download(`/api/orders/invoice/${orderNumber}/`, { download: 1 });
    },
};

// Analytics (aggregated from dashboard views)
export const analyticsService = {
    adminDashboard: () => api.get("/api/auth/dashboard/admin/"),
};
// Stores (fulfillment)
export const storesService = {
    /** All stores including inactive — admin only */
    list: () => api.get("/api/fulfillment/stores/admin/"),
    /** Single store by pk */
    get: (pk) => api.get(`/api/fulfillment/stores/${pk}/`),
    /** Create store (FormData) */
    create: (formData) => api.post("/api/fulfillment/stores/admin/", formData),
    /** Update store (FormData PATCH) */
    update: (pk, formData) => api.patch(`/api/fulfillment/stores/${pk}/`, formData),
    /** Delete store */
    delete: (pk) => api.delete(`/api/fulfillment/stores/${pk}/`),
    /** Save features */
    setFeatures: (pk, features) => api.put(`/api/fulfillment/stores/${pk}/features/`, { features }),
    /** Save availability */
    setAvailability: (pk, availability) => api.put(`/api/fulfillment/stores/${pk}/availability/`, { availability }),
};