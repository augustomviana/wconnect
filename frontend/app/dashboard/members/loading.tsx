import { Skeleton } from "@/components/ui/skeleton"

export default function MembersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>

          <div className="space-y-4">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
