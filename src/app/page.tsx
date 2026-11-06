"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Order, Product } from "@/types/database";
import { formatRupiah, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";
import { Package, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";



interface Stats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    const [
      { count: totalProducts },
      { count: activeProducts },
      { count: outOfStock },
      { data: orders },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .gt("stock", 0),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("stock", 0),
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const totalRevenue =
      orders
        ?.filter((o) => o.status === "selesai")
        .reduce((sum: number, o: Order) => sum + o.total_price, 0) ?? 0;

    setStats({
      totalProducts: totalProducts ?? 0,
      activeProducts: activeProducts ?? 0,
      outOfStock: outOfStock ?? 0,
      totalOrders: orders?.length ?? 0,
      totalRevenue,
      recentOrders: orders?.slice(0, 5) ?? [],
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchStats();

    // Realtime update ketika ada pesanan baru
    const channel = supabase
      .channel("admin-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => fetchStats()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:pt-6 pt-20 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Produk",
      value: stats.totalProducts,
      icon: Package,
      sub: `${stats.activeProducts} tersedia`,
    },
    {
      label: "Total Pesanan",
      value: stats.totalOrders,
      icon: ShoppingBag,
      sub: "semua waktu",
    },
    {
      label: "Pendapatan",
      value: formatRupiah(stats.totalRevenue),
      icon: TrendingUp,
      sub: "pesanan selesai",
    },
    {
      label: "Stok Habis",
      value: stats.outOfStock,
      icon: AlertCircle,
      sub: "produk",
      warn: stats.outOfStock > 0,
    },
  ];

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-6 space-y-6">
      <h1 className="font-display font-700 text-xl">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`bg-surface rounded-xl p-4 border ${
                s.warn ? "border-red-500/30" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">{s.label}</span>
                <Icon
                  size={16}
                  className={s.warn ? "text-red-400" : "text-muted"}
                />
              </div>
              <p className="font-display font-700 text-xl leading-tight">
                {s.value}
              </p>
              <p className="text-xs text-muted mt-1">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Pesanan terbaru */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-600 text-base">Pesanan Terbaru</h2>
          <Link
            href="/orders"
            className="text-xs text-accent hover:text-accent-dark transition-colors duration-150"
          >
            Lihat semua →
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="bg-surface rounded-xl p-8 border border-border text-center">
            <ShoppingBag size={24} className="mx-auto text-muted mb-2" />
            <p className="text-sm text-muted">Belum ada pesanan masuk.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs text-muted font-500">
                      Pembeli
                    </th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-500 hidden sm:table-cell">
                      Total
                    </th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-500">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs text-muted font-500 hidden md:table-cell">
                      Waktu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors duration-150"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href="/orders"
                          className="font-600 hover:text-accent transition-colors duration-150"
                        >
                          {order.customer_name}
                        </Link>
                        <p className="text-xs text-muted">{order.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="font-600 text-accent">
                          {formatRupiah(order.total_price)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-0.5 rounded-full font-600 ${
                            ORDER_STATUS_COLOR[order.status]
                          }`}
                        >
                          {ORDER_STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
