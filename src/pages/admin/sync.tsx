import { useState } from "react";
import {
  syncProducts as apiSyncProducts,
  syncProductsFull,
} from "@/apis/services/product";
import { getSetting, syncProducts as dbSyncProducts } from "@/lib/db/index";
import { SYNC_PRODUCTS_LAST_CHANGE_ID, TOKEN } from "@/config/vars";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageTitle from "@/components/common/page-title";
import {
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Package,
  BarChart2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import normalApi from "@/apis/normal-api";

type SyncStatus = "idle" | "running" | "success" | "error";

interface SyncResult {
  status: SyncStatus;
  message: string;
  count?: number;
  syncType?: "full" | "incremental";
  errorDetail?: string;
}

const initialResult: SyncResult = { status: "idle", message: "" };

export function Sync() {
  const [products, setProducts] = useState<SyncResult>(initialResult);

  async function handleSyncProducts() {
    setProducts({
      status: "running",
      message: "Fetching changes from server…",
    });

    try {
      const lastChangeIdRaw = await getSetting(SYNC_PRODUCTS_LAST_CHANGE_ID);
      const lastChangeId = lastChangeIdRaw ? Number(lastChangeIdRaw) : null;

      setProducts((prev) => ({
        ...prev,
        message:
          lastChangeId != null
            ? `Fetching changes since id ${lastChangeId}…`
            : "No previous sync found — performing full sync…",
      }));

      const response =
        lastChangeId != null
          ? await apiSyncProducts(lastChangeId)
          : await syncProductsFull();

      const syncType = lastChangeId != null ? "incremental" : "full";
      const count = response.products.length;

      setProducts((prev) => ({
        ...prev,
        message: `Saving ${count} product change(s) to local database…`,
      }));

      await dbSyncProducts(response);

      setProducts({
        status: "success",
        message:
          count === 0
            ? "Products are already up to date."
            : `Successfully synced ${count} product change(s).`,
        count,
        syncType,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setProducts({
        status: "error",
        message: "Product sync failed. See details below.",
        errorDetail: detail,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageTitle
        title="Sync"
        desc="Keep your local data in sync with the server."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Products */}
        <SyncCard
          icon={<Package className="size-4" />}
          title="Products"
          description="Sync product catalogue and batch information."
          result={products}
          onSync={handleSyncProducts}
        />

        {/* Inventory Counts — coming soon */}
        <SyncCard
          icon={<Layers className="size-4" />}
          title="Inventory Counts"
          description="Sync stock quantities across all locations."
          result={initialResult}
          onSync={undefined}
          comingSoon
        />

        {/* Sales — coming soon */}
        <SyncCard
          icon={<BarChart2 className="size-4" />}
          title="Sales"
          description="Upload offline sales transactions to the server."
          result={initialResult}
          onSync={undefined}
          comingSoon
        />
      </div>
    </div>
  );
}

interface SyncCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  result: SyncResult;
  onSync: (() => void) | undefined;
  comingSoon?: boolean;
}

function SyncCard({
  icon,
  title,
  description,
  result,
  onSync,
  comingSoon = false,
}: SyncCardProps) {
  const isRunning = result.status === "running";

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <CardTitle>{title}</CardTitle>
          </div>
          {comingSoon && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
              Coming soon
            </span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4">
        {/* Status area */}
        <StatusArea result={result} />

        {/* Action */}
        <Button
          onClick={onSync}
          disabled={isRunning || comingSoon}
          className="w-full"
          variant={result.status === "error" ? "destructive" : "default"}
        >
          <RefreshCw className={cn("size-3.5", isRunning && "animate-spin")} />
          {isRunning
            ? "Syncing…"
            : result.status === "error"
              ? "Retry"
              : "Sync Now"}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatusArea({ result }: { result: SyncResult }) {
  if (result.status === "idle") {
    return (
      <p className="text-xs text-muted-foreground">
        Not synced yet. Press <strong>Sync Now</strong> to start.
      </p>
    );
  }

  if (result.status === "running") {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="animate-progress-indeterminate h-full rounded-full bg-primary" />
        </div>
        <p className="text-xs text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  if (result.status === "success") {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="size-3.5 shrink-0" />
          <span className="font-medium">{result.message}</span>
        </div>
        {result.count !== undefined && result.count > 0 && (
          <p className="pl-5 text-xs text-muted-foreground capitalize">
            {result.syncType} sync · {result.count} record
            {result.count !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span className="font-medium">{result.message}</span>
        </div>
        {result.errorDetail && (
          <p className="rounded bg-destructive/10 px-2 py-1 font-mono text-[0.625rem] text-destructive">
            {result.errorDetail}
          </p>
        )}
      </div>
    );
  }

  return null;
}
