import { Skeleton } from "@/components/ui/skeleton";

export function EsqueletoDia() {
  return (
    <div aria-busy aria-label="Carregando horários">
      <div className="cabecalho px-4 pt-4 pb-3">
        <Skeleton className="h-11 w-36" />
        <Skeleton className="mt-2 h-4 w-40" />
        <div className="mt-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-13 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-2.5 px-4 pt-4">
        <Skeleton className="mb-4 h-5 w-44" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="grid grid-cols-[4.25rem_1fr] gap-2">
            <Skeleton className="h-10 w-12" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
