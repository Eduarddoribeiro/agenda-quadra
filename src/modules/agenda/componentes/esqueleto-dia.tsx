import { Skeleton } from "@/components/ui/skeleton";

export function EsqueletoDia() {
  return (
    <div aria-busy aria-label="Carregando horários">
      <div className="cabecalho px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="mt-1.5 h-3.5 w-40" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-2 px-4 pt-3">
        <Skeleton className="mb-3 h-11 w-44" />
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="grid grid-cols-[3.5rem_1fr] gap-2">
            <Skeleton className="h-9 w-11" />
            <Skeleton className="h-13 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
