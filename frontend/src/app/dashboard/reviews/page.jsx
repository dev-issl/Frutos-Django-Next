"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import api from "@/app/dashboard/_lib/api";

const PAGE_SIZE = 20;

// ── Star Rating Display ────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="text-xs font-medium text-slate-500 ml-1">
        {rating}/5
      </span>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400";
const labelCls =
  "block text-sm font-medium text-slate-700 mb-1";

// ── Review Form ────────────────────────────────────────────────
function ReviewForm({ initialValues, onSubmit, submitLabel = "Save", products }) {
  const [form, setForm] = useState({
    product: initialValues?.product || "",
    rating: initialValues?.rating || 5,
    comment: initialValues?.comment || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        product: form.product,
        rating: Number(form.rating),
        comment: form.comment,
      });
    } catch (err) {
      let msg = "Something went wrong";
      if (err?.data) {
        const d = err.data;
        if (d.detail) msg = typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail);
        else {
          const parts = Object.entries(d).map(
            ([f, e]) =>
              `${f.replace(/_/g, " ")}: ${Array.isArray(e) ? e[0] : e}`
          );
          msg = parts.join(" · ") || err.message || "Bad Request";
        }
      } else if (err?.message) msg = err.message;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const productOptions = (products || []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Product */}
      <div>
        <label className={labelCls}>
          Product <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          required
          value={form.product}
          onChange={(v) => handleChange("product", v)}
          placeholder="Search for a product..."
          options={productOptions}
        />
      </div>

      {/* Rating */}
      <div>
        <label className={labelCls}>
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button style={{cursor: 'pointer'}}
              key={i}
              type="button"
              onClick={() => handleChange("rating", i)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  i <= form.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          <span className="text-sm text-slate-500 ml-2">
            {form.rating}/5
          </span>
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className={labelCls}>Comment</label>
        <textarea
          value={form.comment}
          onChange={(e) => handleChange("comment", e.target.value)}
          rows={4}
          className={`${inputCls} resize-y`}
          placeholder="Write a review comment..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button style={{cursor: 'pointer'}}
          type="submit"
          disabled={submitting || !form.product}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50 transition-colors"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── Table columns ──────────────────────────────────────────────
const columns = [
  {
    key: "product_name",
    label: "Product",
    render: (v) => (
      <span className="font-medium text-slate-800">
        {v || "Unknown Product"}
      </span>
    ),
  },
  {
    key: "user",
    label: "User",
    render: (v) => {
      if (!v) return "—";
      if (typeof v === "object") {
        const name = `${v.first_name || ""} ${v.last_name || ""}`.trim();
        return <span className="font-medium text-slate-800">{name || "Unknown User"}</span>;
      }
      return <span className="font-medium text-slate-800">{v}</span>;
    }
  },
  {
    key: "rating",
    label: "Rating",
    render: (v) => <StarRating rating={v} />,
  },
  {
    key: "comment",
    label: "Comment",
    sortable: false,
    render: (v) => (
      <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">
        {v || "—"}
      </p>
    ),
  },
  {
    key: "created_at",
    label: "Date",
    render: (v) =>
      v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
  },
];

// ── Main Page ──────────────────────────────────────────────────
export default function ReviewsPage() {
  const toast = useToastContext();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/products/reviews/");
      setReviews(data.results || data);
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.get("/api/products/products/", { page_size: 500 });
      setProducts(data.results || data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, [fetchReviews, fetchProducts]);

  const handleCreate = async (payload) => {
    await api.post("/api/products/reviews/", payload);
    toast.success("Review added successfully");
    setCreateOpen(false);
    fetchReviews();
  };

  const handleEdit = async (payload) => {
    await api.patch(`/api/products/reviews/${editItem.id}/`, payload);
    toast.success("Review updated successfully");
    setEditItem(null);
    fetchReviews();
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/products/reviews/${deleteItem.id}/`);
      toast.success("Review deleted successfully");
      setDeleteItem(null);
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  return (
    <Container
      title="Reviews"
      description="Manage product reviews and ratings"
      actions={
        <button style={{cursor: 'pointer'}}
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Review
        </button>
      }
    >
      <DataTable
        columns={columns}
        data={reviews}
        loading={loading}
        searchable
        searchKeys={["product_name", "user", "comment"]}
        pageSize={PAGE_SIZE}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button style={{cursor: 'pointer'}}
              onClick={() => setEditItem(row)}
              className="db-icon-btn"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button style={{cursor: 'pointer'}}
              onClick={() => setDeleteItem(row)}
              className="db-icon-btn danger"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Review"
        maxWidth="max-w-lg"
      >
        <ReviewForm
          onSubmit={handleCreate}
          submitLabel="Add Review"
          products={products}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Review"
        maxWidth="max-w-lg"
      >
        {editItem && (
          <ReviewForm
            initialValues={editItem}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
            products={products}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message={`Are you sure you want to delete this review by "${deleteItem?.user}"? This cannot be undone.`}
      />
    </Container>
  );
}

