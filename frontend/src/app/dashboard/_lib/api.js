/**
 * Admin Dashboard API Client
 * 
 * Core fetch wrapper with JWT auth, token refresh, retries, and error handling.
 * Uses native fetch — no axios dependency needed.
 */

const API_BASE_URL = (() => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!envUrl && typeof window !== "undefined") {
        const h = window.location.hostname;
        if (h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10.")) {
            return "http://127.0.0.1:8000";
        }
    }
    if (!envUrl && typeof window === "undefined" && process.env.NODE_ENV === "development") {
        return "http://127.0.0.1:8000";
    }
    return (envUrl || "https://api.icommerce.passmcq.com")
        .replace(/\/+$/, "")
        .replace(/\/api$/, ""); // ← শুধু এই line টা add করো
})();

// ── Token management ──────────────────────────────────────────────

export function getAccessToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_access_token") || localStorage.getItem("icommerce_admin_access");
}

export function getRefreshToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_refresh_token") || localStorage.getItem("icommerce_admin_refresh");
}

export function setTokens(access, refresh) {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_access_token", access);
    if (refresh) localStorage.setItem("admin_refresh_token", refresh);
}

export function clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
}

export function getStoredUser() {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem("admin_user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user) {
    if (typeof window === "undefined") return;
    localStorage.setItem("admin_user", JSON.stringify(user));
}

// Decode JWT payload
export function decodeToken(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload;
    } catch {
        return null;
    }
}

export function isTokenExpired(token) {
    const payload = decodeToken(token);
    if (!payload ? .exp) return true;
    return Date.now() / 1000 > payload.exp - 30; // 30s buffer
}

// ── Token refresh ─────────────────────────────────────────────────

let refreshPromise = null;

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error("No refresh token");

    // Deduplicate concurrent refresh calls
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async() => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh }),
            });

            if (!res.ok) {
                clearTokens();
                throw new Error("Token refresh failed");
            }

            const data = await res.json();
            setTokens(data.access, data.refresh || refresh);
            return data.access;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// ── Error class ───────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(status, statusText, data) {
        let message = data?.detail || data?.message || (typeof data?.error === 'string' ? data.error : null);
        if (!message && data && typeof data === 'object') {
            // Extract the first field error from DRF payload (e.g. { banner_image: ["This field is required."] })
            const firstKey = Object.keys(data)[0];
            if (firstKey && Array.isArray(data[firstKey])) {
                message = `${firstKey.replace('_', ' ')}: ${data[firstKey][0]}`;
            } else if (firstKey && typeof data[firstKey] === 'string') {
                message = `${firstKey}: ${data[firstKey]}`;
            }
        }
        message = message || statusText || `HTTP ${status}`;
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

// ── Core fetch ────────────────────────────────────────────────────

/**
 * Authenticated fetch against the Django API.
 * Handles: auth headers, token refresh on 401, retry on 5xx, FormData.
 *
 * @param {string} path - API path starting with /api/... or /dashboard/...
 * @param {object} options - fetch options (method, body, headers, params, etc.)
 * @returns {Promise<any>} parsed JSON (or Blob for downloads)
 */
export async function adminFetch(path, options = {}) {
    const { params, retries = 1, raw = false, ...fetchOpts } = options;

    // Build URL
    let url = `${API_BASE_URL}${path}`;
    if (params) {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") sp.append(k, v);
        });
        const qs = sp.toString();
        if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }

    // Headers
    const headers = {...(fetchOpts.headers || {}) };
    
    // Disable caching for dashboard API requests
    fetchOpts.cache = "no-store";

    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Don't set Content-Type for FormData (browser does it with boundary)
    if (!(fetchOpts.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    // Stringify JSON body
    if (fetchOpts.body && typeof fetchOpts.body === "object" && !(fetchOpts.body instanceof FormData) && !(fetchOpts.body instanceof Blob)) {
        fetchOpts.body = JSON.stringify(fetchOpts.body);
    }

    const doFetch = async(attempt = 0) => {
        const res = await fetch(url, {...fetchOpts, headers });

        // 401 → try token refresh once
        if (res.status === 401 && attempt === 0) {
            try {
                const newToken = await refreshAccessToken();
                headers["Authorization"] = `Bearer ${newToken}`;
                return doFetch(1);
            } catch {
                clearTokens();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("admin:session-expired"));
                }
                throw new ApiError(401, "Session expired", { detail: "Please log in again." });
            }
        }

        // 5xx → retry
        if (res.status >= 500 && attempt < retries) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            return doFetch(attempt + 1);
        }

        // Raw response (for downloads)
        if (raw) return res;

        // Parse response
        if (res.status === 204) return null;

        const contentType = res.headers.get("content-type") || "";

        if (!res.ok) {
            let errData;
            try {
                errData = contentType.includes("json") ? await res.json() : { detail: await res.text() };
            } catch {
                errData = { detail: res.statusText };
            }
            throw new ApiError(res.status, res.statusText, errData);
        }

        if (contentType.includes("json")) return res.json();
        if (contentType.includes("text/html")) return res.text();
        return res.blob();
    };

    return doFetch(0);
}

// ── Convenience helpers ───────────────────────────────────────────

export const api = {
    get: (path, params, opts) => adminFetch(path, { method: "GET", params, ...opts }),
    post: (path, body, opts) => adminFetch(path, { method: "POST", body, ...opts }),
    put: (path, body, opts) => adminFetch(path, { method: "PUT", body, ...opts }),
    patch: (path, body, opts) => adminFetch(path, { method: "PATCH", body, ...opts }),
    delete: (path, opts) => adminFetch(path, { method: "DELETE", ...opts }),
    download: (path, params) => adminFetch(path, { method: "GET", params, raw: true }),
};

export { API_BASE_URL };
export default api;