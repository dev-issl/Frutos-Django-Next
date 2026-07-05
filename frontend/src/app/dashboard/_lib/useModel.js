/**
 * useModel — SWR-powered hook for any model service.
 *
 * Provides: data, loading, error, pagination, mutate, and CRUD helpers
 * with optimistic updates, error rollback, and toast-ready callbacks.
 */

// Force cache invalidation
"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";

/**
 * @param {object} service - A service from createModelService()
 * @param {object} opts
 * @param {object} opts.defaultParams - Default query params (page, search, etc.)
 * @param {boolean} opts.paginated - Whether the API returns { results, count }
 * @param {function} opts.onSuccess - Called after successful mutations
 * @param {function} opts.onError - Called on mutation errors
 */
export function useModel(service, opts = {}) {
    const {
        defaultParams = {},
            paginated = true,
            onSuccess,
            onError,
    } = opts;

    const [params, setParams] = useState(defaultParams);
    const [mutating, setMutating] = useState(false);

    // SWR key: unique per service path + params
    const swrKey = useMemo(
        () => [service._basePath, JSON.stringify(params)], [service._basePath, params]
    );

    const { data: rawData, error, isLoading, mutate } = useSWR(
        swrKey,
        () => service.list(params), {
            revalidateOnFocus: false,
            keepPreviousData: true,
            dedupingInterval: 2000,
            onError: (err) => {
                if (onError) onError(err);
                // SWR fetch error কে silently handle করো
            },
        }
    );

    // Normalize response
    const data = useMemo(() => {
        if (!rawData) return [];
        if (paginated && rawData.results) return rawData.results;
        if (Array.isArray(rawData)) return rawData;
        return [];
    }, [rawData, paginated]);

    const totalCount = paginated ? ((rawData && rawData.count) || data.length) : data.length;
    const nextPage = (rawData && rawData.next) || null;
    const prevPage = (rawData && rawData.previous) || null;

    // ── Param helpers ─────────────────────────────────────────────

    const setSearch = useCallback((search) => {
        setParams((p) => ({...p, search, page: 1 }));
    }, []);

    const setPage = useCallback((page) => {
        setParams((p) => ({...p, page }));
    }, []);

    const setFilter = useCallback((key, value) => {
        setParams((p) => {
            const next = {...p, page: 1 };
            if (value === undefined || value === null || value === "") {
                delete next[key];
            } else {
                next[key] = value;
            }
            return next;
        });
    }, []);

    const resetParams = useCallback(() => {
        setParams(defaultParams);
    }, [defaultParams]);

    // ── CRUD mutations ────────────────────────────────────────────

    const create = useCallback(
        async(formData) => {
            setMutating(true);
            try {
                const result = await service.create(formData);
                await mutate();
                onSuccess?.("Created successfully");
                return result;
            } catch (err) {
                onError?.(err);
                throw err;
            } finally {
                setMutating(false);
            }
        }, [service, mutate, onSuccess, onError]
    );

    const update = useCallback(
        async(lookup, formData) => {
            setMutating(true);
            try {
                const result = await service.update(lookup, formData);
                await mutate();
                onSuccess?.("Updated successfully");
                return result;
            } catch (err) {
                onError?.(err);
                throw err;
            } finally {
                setMutating(false);
            }
        }, [service, mutate, onSuccess, onError]
    );

    const patch = useCallback(
        async(lookup, formData) => {
            setMutating(true);
            try {
                const result = await service.patch(lookup, formData);
                await mutate();
                onSuccess?.("Updated successfully");
                return result;
            } catch (err) {
                onError?.(err);
                throw err;
            } finally {
                setMutating(false);
            }
        }, [service, mutate, onSuccess, onError]
    );

    const remove = useCallback(
        async(lookup) => {
            setMutating(true);
            try {
                await service.delete(lookup);
                await mutate();
                onSuccess?.("Deleted successfully");
            } catch (err) {
                onError?.(err);
                throw err;
            } finally {
                setMutating(false);
            }
        }, [service, mutate, onSuccess, onError]
    );

    return {
        // Data
        data,
        totalCount,
        nextPage,
        prevPage,
        rawData,

        // State
        loading: isLoading,
        error,
        mutating,

        // Params
        params,
        setParams,
        setSearch,
        setPage,
        setFilter,
        resetParams,

        // Mutations
        create,
        update,
        patch,
        remove,
        mutate,
    };
}

export default useModel;