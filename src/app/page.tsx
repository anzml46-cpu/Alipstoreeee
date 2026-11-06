"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StoreSettings } from "@/types/database";
import { Loader2, CheckCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [form, setForm] = useState({
    store_name: "",
    description: "",
    whatsapp_number: "6285840840520",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) {
          setSettings(data);
          setForm({
            store_name: data.store_name,
            description: data.description,
            whatsapp_number: data.whatsapp_number,
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleSave() {
    if (!form.store_name.trim()) { setError("Nama toko wajib diisi"); return; }
    if (!form.whatsapp_number.trim()) { setError("Nomor WhatsApp wajib diisi"); return; }

    setSaving(true);
    setError("");

    const payload = {
      store_name: form.store_name.trim(),
      description: form.description.trim(),
      whatsapp_number: form.whatsapp_number.trim(),
      updated_at: new Date().toISOString(),
    };

    if (settings) {
      const { error: e } = await supabase
        .from("store_settings")
        .update(payload)
        .eq("id", settings.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase
        .from("store_settings")
        .insert({ ...payload, id: crypto.randomUUID() });
      if (e) { setError(e.message); setSaving(false); return; }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 pt-20 md:pt-6">
        <div className="space-y-4 max-w-lg">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-surface animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-6">
      <h1 className="font-display font-700 text-xl mb-6">Pengaturan Toko</h1>

      <div className="max-w-lg space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
        )}

        {saved && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-accent flex items-center gap-2">
            <CheckCircle size={16} /> Pengaturan tersimpan
          </div>
        )}

        <Field
          label="Nama toko"
          id="storeName"
          value={form.store_name}
          onChange={(v) => setForm(f => ({ ...f, store_name: v }))}
          placeholder="ALIP STORE"
        />

        <div>
          <label htmlFor="desc" className="block text-xs font-600 mb-1.5">Deskripsi toko</label>
          <textarea
            id="desc"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Toko akun game terpercaya..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-150 resize-none"
          />
        </div>

        <div>
          <Field
            label="Nomor WhatsApp toko"
            id="wa"
            value={form.whatsapp_number}
            onChange={(v) => setForm(f => ({ ...f, whatsapp_number: v }))}
            placeholder="6285840840520"
            inputMode="tel"
          />
          <p className="text-xs text-muted mt-1">
            Format internasional tanpa + (contoh: 6285840840520)
          </p>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted mb-4 p-3 bg-surface rounded-lg border border-border">
            Catatan keamanan: Halaman admin ini tidak dilindungi login. URL panjang hanya sebagai pelindung dasar. Untuk produksi, aktifkan autentikasi Supabase dan RLS.
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-base text-sm font-600 hover:bg-accent-dark disabled:opacity-50 transition-colors duration-150"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Simpan pengaturan"}
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
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-150"
      />
    </div>
  );
}
