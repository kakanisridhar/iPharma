import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Search, X, Plus, Minus, ShoppingCart, Package2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SellingUnit, PaymentMethod } from "@/types/base";
import type { ProductType } from "@/types/products";
import type { BatchWithInventory } from "@/types/inventory";
import type {
  CartItem,
  SaleLineInput,
  SaleTotalsResult,
  CreateSaleInput,
} from "@/types/sales";
import {
  searchProducts,
  getBatchesWithInventory,
  createSale,
} from "@/lib/db/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTitle from "@/components/common/page-title";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(paise: number): string {
  return (paise / 100).toFixed(2);
}

function toVatBp(pct: number | undefined): number {
  return Math.round((pct ?? 0) * 100);
}

function toPaise(value: number): number {
  return Math.round(value * 100);
}

function formatExpiry(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function isExpiringSoon(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function ProductCard({
  product,
  isSelected,
  onClick,
}: {
  product: ProductType;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.name}</p>
          {product.brand && (
            <p className="truncate text-xs text-muted-foreground">
              {product.brand}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">
            ₹{product.sellPrice.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">{product.sellingUnit}</p>
        </div>
      </div>
    </button>
  );
}

function BatchRow({
  batch,
  onAdd,
}: {
  batch: BatchWithInventory;
  onAdd: () => void;
}) {
  const expiring = isExpiringSoon(batch.expiryDate);
  const noStock = batch.quantity === 0 && batch.packCount === 0;

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <span className="font-mono font-medium">{batch.batchNumber}</span>
        <span
          className={cn(
            "ml-2 text-xs",
            expiring ? "text-amber-600" : "text-muted-foreground",
          )}
        >
          Exp {formatExpiry(batch.expiryDate)}
        </span>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">
        <span>{batch.packCount} pk</span>
        <span className="mx-1">·</span>
        <span>{batch.quantity} pcs</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={noStock}
        onClick={onAdd}
        className="h-7 shrink-0 px-2"
      >
        <Plus className="size-3" />
        Add
      </Button>
    </div>
  );
}

function CounterInput({
  value,
  min,
  onChange,
}: {
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-6 items-center justify-center rounded border text-muted-foreground hover:bg-muted"
      >
        <Minus className="size-3" />
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min) onChange(n);
        }}
        className="w-12 rounded border bg-background px-1 py-0.5 text-center text-sm [appearance:textfield]"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex size-6 items-center justify-center rounded border text-muted-foreground hover:bg-muted"
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}

function ToggleChip({
  label,
  checked,
  onToggle,
  title,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onToggle}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/50",
      )}
    >
      {label}
    </button>
  );
}

function CartItemRow({
  item,
  isPack,
  onQuantityChange,
  onPackCountChange,
  onToggleSplitPack,
  onToggleNewPackSplit,
  onRemove,
}: {
  item: CartItem;
  isPack: boolean;
  onQuantityChange: (qty: number) => void;
  onPackCountChange: (count: number) => void;
  onToggleSplitPack: () => void;
  onToggleNewPackSplit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.product.name}</p>
          <p className="text-xs text-muted-foreground">
            Batch {item.batch.batchNumber} · Exp{" "}
            {formatExpiry(item.batch.expiryDate)}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Quantity controls */}
      <div className="flex flex-wrap items-center gap-3">
        {isPack && (
          <div className="flex items-center gap-1.5">
            <span className="w-10 text-xs text-muted-foreground">Packs</span>
            <CounterInput
              value={item.packCount}
              min={0}
              onChange={onPackCountChange}
            />
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-10 text-xs text-muted-foreground">
            {isPack ? "Items" : "Qty"}
          </span>
          <CounterInput
            value={item.quantity}
            min={0}
            onChange={onQuantityChange}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Stock: {item.batch.packCount} pk · {item.batch.quantity} pcs
        </span>
      </div>

      {/* Split pack toggles — PACK products only */}
      {isPack && (
        <div className="flex flex-wrap gap-1.5">
          <ToggleChip
            label="Split pack"
            checked={item.isSplitPack}
            onToggle={onToggleSplitPack}
            title="Sell individual items from inside a sealed pack"
          />
          {item.isSplitPack && (
            <ToggleChip
              label="New pack opened"
              checked={item.isNewPackSplit}
              onToggle={onToggleNewPackSplit}
              title="A new sealed pack must be opened to fulfill this order"
            />
          )}
        </div>
      )}

      {/* Line totals */}
      <div className="flex justify-end gap-4 border-t pt-1.5 text-xs">
        <span className="text-muted-foreground">
          Unit ₹{fmt(item.unitPrice)}
        </span>
        <span className="text-muted-foreground">Tax ₹{fmt(item.tax)}</span>
        <span className="font-semibold">₹{fmt(item.netPrice)}</span>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function SalesNew() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<ProductType[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );
  const [batches, setBatches] = useState<BatchWithInventory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<SaleTotalsResult | null>(null);
  const [cashTendered, setCashTendered] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced product search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchTerm.trim()) {
      setProducts([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        setProducts(await searchProducts(searchTerm.trim()));
      } catch {
        setProducts([]);
      }
    }, 250);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchTerm]);

  // Load batches on product select
  useEffect(() => {
    if (!selectedProduct) {
      setBatches([]);
      return;
    }
    getBatchesWithInventory(selectedProduct.id)
      .then(setBatches)
      .catch(() => setBatches([]));
  }, [selectedProduct]);

  // Stable cart signature that changes only on user edits, not price updates
  const cartSig = cart
    .map((c) => `${c.id}:${c.quantity}:${c.packCount}:${c.isSplitPack}`)
    .join(",");

  useEffect(() => {
    if (cart.length === 0) {
      setTotals(null);
      return;
    }
    const inputs: SaleLineInput[] = cart.map((item) => ({
      sellPrice: toPaise(item.product.sellPrice),
      vatRate: toVatBp(item.product.vat),
      quantity: item.quantity,
      packCount: item.packCount,
      itemsPerPack: item.product.itemsPerPack ?? 1,
      isSplitPack: item.isSplitPack,
    }));
    invoke<SaleTotalsResult>("calculate_sale_totals", { items: inputs })
      .then((result) => {
        setTotals(result);
        setCart((prev) =>
          prev.map((item, idx) => ({
            ...item,
            unitPrice: result.lines[idx]?.unitPrice ?? 0,
            grossPrice: result.lines[idx]?.grossPrice ?? 0,
            tax: result.lines[idx]?.tax ?? 0,
            netPrice: result.lines[idx]?.netPrice ?? 0,
          })),
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSig]);

  const addToCart = useCallback(
    (product: ProductType, batch: BatchWithInventory) => {
      setCart((prev) => {
        const idx = prev.findIndex(
          (c) => c.product.id === product.id && c.batch.id === batch.id,
        );
        if (idx >= 0) {
          return prev.map((c, i) =>
            i === idx
              ? {
                  ...c,
                  quantity:
                    product.sellingUnit === SellingUnit.NOS
                      ? c.quantity + 1
                      : c.quantity,
                  packCount:
                    product.sellingUnit === SellingUnit.PACK
                      ? c.packCount + 1
                      : c.packCount,
                }
              : c,
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            product,
            batch,
            quantity: product.sellingUnit === SellingUnit.NOS ? 1 : 0,
            packCount: product.sellingUnit === SellingUnit.PACK ? 1 : 0,
            isSplitPack: false,
            isNewPackSplit: false,
            unitPrice: 0,
            grossPrice: 0,
            tax: 0,
            netPrice: 0,
          } satisfies CartItem,
        ];
      });
    },
    [],
  );

  const updateCartItem = useCallback(
    (id: string, patch: Partial<CartItem>) =>
      setCart((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      ),
    [],
  );

  const removeCartItem = useCallback(
    (id: string) => setCart((prev) => prev.filter((c) => c.id !== id)),
    [],
  );

  async function handleCompleteSale() {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (!totals) return;
    const tenderedPaise = toPaise(parseFloat(cashTendered) || 0);
    if (tenderedPaise < totals.totalNet) {
      toast.error("Cash tendered is less than total amount");
      return;
    }
    setIsSubmitting(true);
    try {
      const input: CreateSaleInput = {
        saleDate: new Date().toISOString(),
        discountType: 0,
        discount: 0,
        grossPrice: totals.totalGross,
        tax: totals.totalTax,
        netPrice: totals.totalNet,
        amountToPay: totals.totalNet,
        paymentMethod: PaymentMethod.CASH,
        cashTendered: tenderedPaise,
        cashChangeGiven: tenderedPaise - totals.totalNet,
        items: cart.map((item, i) => ({
          idx: i,
          productId: item.product.id,
          productBatchId: item.batch.id,
          quantity: item.quantity,
          packCount: item.packCount,
          unitPrice: item.unitPrice,
          grossPrice: item.grossPrice,
          tax: item.tax,
          netPrice: item.netPrice,
          vatRate: toVatBp(item.product.vat),
          isSplitPack: item.isSplitPack,
          isNewPackSplit: item.isNewPackSplit,
        })),
      };
      await createSale(input);
      toast.success("Sale completed successfully");
      setCart([]);
      setTotals(null);
      setCashTendered("");
      setSearchTerm("");
      setSelectedProduct(null);
    } catch (err) {
      toast.error(
        `Failed to save: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const tenderedPaise = toPaise(parseFloat(cashTendered) || 0);
  const changePaise = totals ? tenderedPaise - totals.totalNet : 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="px-6 pt-4 pb-2 shrink-0">
        <PageTitle title="New Sale" desc="Select a product and batch to add to cart." />
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden px-6 pb-4">
        {/* ── Left: search + batches ── */}
        <div className="flex w-1/2 flex-col gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {!searchTerm && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Package2 className="size-8 opacity-40" />
                <p className="text-sm">Type to search products</p>
              </div>
            )}
            {searchTerm && products.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No products match "{searchTerm}"
              </p>
            )}
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-1">
                <ProductCard
                  product={product}
                  isSelected={selectedProduct?.id === product.id}
                  onClick={() =>
                    setSelectedProduct((p) =>
                      p?.id === product.id ? null : product,
                    )
                  }
                />
                {selectedProduct?.id === product.id && (
                  <div className="ml-3 flex flex-col gap-1 border-l-2 border-primary/20 pl-3">
                    {batches.length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">
                        No batches available
                      </p>
                    ) : (
                      batches.map((batch) => (
                        <BatchRow
                          key={batch.id}
                          batch={batch}
                          onAdd={() => addToCart(product, batch)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: cart ── */}
        <div className="flex w-1/2 flex-col gap-3 overflow-hidden">
          <div className="flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-muted-foreground" />
              <span className="font-semibold">Cart</span>
              {cart.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {cart.length}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <ShoppingCart className="size-8 opacity-40" />
                <p className="text-sm">Add items from the left panel</p>
              </div>
            )}
            {cart.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                isPack={item.product.sellingUnit === SellingUnit.PACK}
                onQuantityChange={(qty) => updateCartItem(item.id, { quantity: qty })}
                onPackCountChange={(count) => updateCartItem(item.id, { packCount: count })}
                onToggleSplitPack={() =>
                  updateCartItem(item.id, {
                    isSplitPack: !item.isSplitPack,
                    isNewPackSplit: false,
                  })
                }
                onToggleNewPackSplit={() =>
                  updateCartItem(item.id, { isNewPackSplit: !item.isNewPackSplit })
                }
                onRemove={() => removeCartItem(item.id)}
              />
            ))}
          </div>

          {/* Totals + payment */}
          {cart.length > 0 && (
            <div className="flex shrink-0 flex-col gap-3 border-t pt-3">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{totals ? fmt(totals.totalGross) : "—"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>₹{totals ? fmt(totals.totalTax) : "—"}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>₹{totals ? fmt(totals.totalNet) : "—"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0 text-sm text-muted-foreground">
                    Cash tendered
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="[appearance:textfield]"
                  />
                </div>
                {cashTendered && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change</span>
                    <span
                      className={cn(
                        "font-medium",
                        changePaise < 0
                          ? "text-destructive"
                          : "text-emerald-600",
                      )}
                    >
                      ₹{fmt(Math.max(0, changePaise))}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCompleteSale}
                disabled={isSubmitting || !totals}
                className="w-full"
              >
                {isSubmitting ? "Saving…" : "Complete Sale"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
