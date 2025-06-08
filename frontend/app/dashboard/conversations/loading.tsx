import { Skeleton } from "@/components/ui/skeleton"

export default function ConversationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-72 space-y-4">
          <Skeleton className="h-10 w-full" />

          <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-2">
              {Array(4)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="border rounded-lg">
              <div className="divide-y">
                {Array(5)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-start">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-4 flex-1 space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <div className="flex gap-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
