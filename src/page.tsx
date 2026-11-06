"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Order, OrderItem, OrderStatus } from "@/types/database";
import {
  formatRupiah,
  formatDate,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
} from "@/lib/utils";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

const STATUSES: OrderStatus[] = [
  "menunggu_konfirmasi",
  "diproses",
  "dikirim",
  "selesai",
  "dibatalkan",
];

interface OrderWithItems extends Order {
  order_items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function fetchOrders() {
    const q = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    const { data } = await q;
    setOrders(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    fetchOrders();
  }

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  if (loading) {
    return (
      <div className="p-4 md:p-6 pt-20 md:pt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-6">
      <h1 className="font-display font-700 text-xl mb-6">
        Pesanan ({orders.length})
      </h1>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs transition-colors duration-150 ${
            statusFilter === "all"
              ? "bg-accent text-base font-600"
              : "bg-surface border border-border text-muted hover:text-white"
          }`}
        >
          Semua ({orders.length})
        </button>
        {STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors duration-150 ${
                statusFilter === s
                  ? "bg-accent text-base font-600"
                  : "bg-surface border border-border text-muted hover:text-white"
              }`}
            >
              {ORDER_STATUS_LABEL[s]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl p-12 border border-border text-center">
          <p className="text-muted text-sm">Belum ada pesanan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-surface rounded-xl border border-border overflow-hidden"
            >
              {/* Header pesanan */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-2 transition-colors duration-150"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-600 text-sm">{order.customer_name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-600 ${ORDER_STATUS_COLOR[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {order.customer_phone} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-700 text-sm text-accent">
                    {formatRupiah(order.total_price)}
                  </p>
                </div>
                {expanded === order.id ? (
                  <ChevronUp size={16} className="text-muted shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-muted shrink-0" />
                )}
              </div>

              {/* Detail pesanan */}
              {expanded === order.id && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Info pembeli */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted mb-1">Alamat pengiriman</p>
                      <p>{order.customer_address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">WhatsApp pembeli</p>
                      <a
                        href={`https://wa.me/${order.customer_phone.replace(/\D/g, "").replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:text-accent-dark transition-colors duration-150"
                      >
                        <MessageCircle size={14} />
                        Hubungi pembeli
                      </a>
                    </div>
                  </div>

                  {/* Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div>
                      <p className="text-xs text-muted mb-2">Produk dipesan</p>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm bg-surface-2 rounded-lg px-3 py-2"
                          >
                            <span className="text-muted">
                              {item.product_name} × {item.quantity}
                            </span>
                            <span className="font-600">
                              {formatRupiah(item.subtotal)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-display font-700 px-3">
                          <span>Total</span>
                          <span className="text-accent">
                            {formatRupiah(order.total_price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Update status */}
                  <div>
                    <p className="text-xs text-muted mb-2">Ubah status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={order.status === s}
                          className={`text-xs px-3 py-1.5 rounded-full transition-colors duration-150 ${
                            order.status === s
                              ? "bg-accent text-base font-600 cursor-default"
                              : "bg-surface border border-border text-muted hover:text-white"
                          }`}
                        >
                          {ORDER_STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
