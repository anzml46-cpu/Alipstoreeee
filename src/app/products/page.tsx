"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Product, Category } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchAll() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(id, name, image_url, created_at)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("admin-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini? Tindakan tidak bisa dibatalkan.")) return;
    setDeleting(id);
    await supabase.from("products").delete().eq("id", id);
    setDeleting(null);
    fetchAll();
  }

  async function handleToggleActive(product: Product) {
    await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);
    fetchAll();
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 pt-20 md:pt-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 pt-20 md:pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-700 text-xl">
            Produk ({products.length})
          </h1>
          <button
            onClick={() => { setEditing(null); setModal("add"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-base text-sm font-600 hover:bg-accent-dark transition-colors duration-150"
          >
            <Plus size={16} />
            Tambah
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-surface rounded-xl p-12 border border-border text-center">
            <p className="text-muted text-sm mb-4">Belum ada produk.</p>
            <button
              onClick={() => { setEditing(null); setModal("add"); }}
              className="text-sm text-accent hover:text-accent-dark"
            >
              Tambah produk pertama →
            </button>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs text-muted font-500">Produk</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-500 hidden sm:table-cell">Harga</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-500 hidden md:table-cell">Stok</th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-500">Status</th>
                    <th className="text-right px-4 py-3 text-xs text-muted font-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors duration-150"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xs opacity-30">🎮</div>
                            )}
                          </div>
                          <span className="font-600 line-clamp-1">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div>
                          <span className="text-accent font-600">
                            {formatRupiah(product.discount_price ?? product.price)}
                          </span>
                          {product.discount_price && (
                            <span className="text-xs text-muted line-through ml-2">
                              {formatRupiah(product.price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={product.stock === 0 ? "text-red-400" : ""}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className="flex items-center gap-1"
                          title={product.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {product.is_active ? (
                            <CheckCircle size={16} className="text-accent" />
                          ) : (
                            <XCircle size={16} className="text-muted" />
                          )}
                          <span className={`text-xs ${product.is_active ? "text-accent" : "text-muted"}`}>
                            {product.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditing(product); setModal("edit"); }}
                            className="p-1.5 hover:bg-surface rounded-lg text-muted hover:text-white transition-colors duration-150"
                            aria-label="Edit produk"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted hover:text-red-400 transition-colors duration-150 disabled:opacity-50"
                            aria-label="Hapus produk"
                          >
                            {deleting === product.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAll(); }}
        />
      )}
    </>
  );
}

function ProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    discount_price: product?.discount_price?.toString() ?? "",
    category_id: product?.category_id ?? "",
    stock: product?.stock?.toString() ?? "0",
    is_active: product?.is_active ?? true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.image_url ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Nama produk wajib diisi"); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { setError("Harga tidak valid"); return; }
    const stock = parseInt(form.stock, 10);
    if (isNaN(stock) || stock < 0) { setError("Stok tidak valid"); return; }

    setLoading(true);
    setError("");

    let image_url = product?.image_url ?? null;

    // Upload gambar ke Supabase Storage
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `products/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, imageFile, { upsert: true });

      if (uploadError) {
        setError("Gagal upload gambar: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
      category_id: form.category_id || null,
      stock,
      is_active: form.is_active,
      image_url,
      updated_at: new Date().toISOString(),
    };

    if (isEdit) {
      const { error: e } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product!.id);
      if (e) { setError(e.message); setLoading(false); return; }
    } else {
      const { error: e } = await supabase.from("products").insert(payload);
      if (e) { setError(e.message); setLoading(false); return; }
    }

    setLoading(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl border border-border max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-surface flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-600 text-base">
            {isEdit ? "Edit Produk" : "Tambah Produk"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-2 rounded-lg" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
          )}

          {/* Upload gambar */}
          <div>
            <p className="text-xs font-600 mb-2">Foto produk</p>
            <div
              className="relative w-full aspect-video bg-surface-2 rounded-xl border border-dashed border-border overflow-hidden cursor-pointer hover:border-accent/40 transition-colors duration-150"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
                  <Upload size={20} />
                  <span className="text-xs">Klik untuk upload gambar</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <Field label="Nama produk" id="name" value={form.name} onChange={(v) => setForm(f => ({ ...f, name: v }))} placeholder="Contoh: Akun FF Rank Heroic" />

          <div>
            <label htmlFor="desc" className="block text-xs font-600 mb-1.5">Deskripsi</label>
            <textarea
              id="desc"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Deskripsi singkat produk..."
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-150 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga (Rp)" id="price" value={form.price} onChange={(v) => setForm(f => ({ ...f, price: v }))} placeholder="50000" inputMode="numeric" />
            <Field label="Harga diskon (opsional)" id="dprice" value={form.discount_price} onChange={(v) => setForm(f => ({ ...f, discount_price: v }))} placeholder="40000" inputMode="numeric" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cat" className="block text-xs font-600 mb-1.5">Kategori</label>
              <select
                id="cat"
                value={form.category_id}
                onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors duration-150"
              >
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Field label="Stok" id="stock" value={form.stock} onChange={(v) => setForm(f => ({ ...f, stock: v }))} placeholder="10" inputMode="numeric" />
          </div>

          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={form.is_active}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${form.is_active ? "bg-accent" : "bg-muted-2"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm">{form.is_active ? "Produk aktif" : "Produk nonaktif"}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-base font-display font-700 text-sm hover:bg-accent-dark disabled:opacity-50 transition-colors duration-150"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : isEdit ? "Simpan perubahan" : "Tambah produk"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, value, onChange, placeholder, inputMode }: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-600 mb-1.5">{label}</label>
      <input
        id={id} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} inputMode={inputMode}
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-150"
      />
    </div>
  );
}
