import { createFileRoute } from "@tanstack/react-router"
import { Suspense, lazy } from "react"

// Lazy load the workspace component for better performance
const WorkspaceApp = lazy(() => import("@/components/workspace/WorkspaceApp").then(m => ({ default: m.WorkspaceApp })))

export const Route = createFileRoute("/workspace")({ 
  component: WorkspacePage,
})

function WorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <WorkspaceApp />
    </Suspense>
  )
}

function WorkspaceLoading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Cargando workspace...</p>
      </div>
    </div>
  )
}
