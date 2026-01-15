import { createFileRoute, Link } from "@tanstack/react-router";
import { IconTable, IconFileText, IconPresentation, IconArrowRight } from "@tabler/icons-react";
import { Logo } from "@/components/ui/Logo";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex items-center gap-3 mb-6">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Spreadsheets-AGI</h1>
        </div>
        
        <p className="text-xl text-muted-foreground text-center max-w-2xl mb-8">
          Suite de productividad impulsada por IA. Crea hojas de cálculo, documentos y presentaciones 
          usando lenguaje natural.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
          <div className="p-6 rounded-xl border border-border bg-card">
            <IconTable className="h-10 w-10 text-emerald-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Sheets</h3>
            <p className="text-sm text-muted-foreground">
              Hojas de cálculo potentes con fórmulas, gráficos y análisis de datos automático.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <IconFileText className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Docs</h3>
            <p className="text-sm text-muted-foreground">
              Documentos con formato profesional, tablas y colaboración en tiempo real.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card opacity-60">
            <IconPresentation className="h-10 w-10 text-amber-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Slides</h3>
            <p className="text-sm text-muted-foreground">
              Presentaciones impactantes. <span className="text-xs">(Próximamente)</span>
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Link 
          to="/workspace"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          Abrir Workspace
          <IconArrowRight className="h-5 w-5" />
        </Link>

        {/* AI Chat Mode Highlight */}
        <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Logo className="h-6 w-6 text-primary" />
            <h4 className="font-semibold">AI Chat Mode</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Describe lo que necesitas en lenguaje natural y la IA creará hojas de cálculo completas, 
            investigará datos, aplicará fórmulas y más. Como tener un asistente experto en Excel.
          </p>
        </div>
      </div>
    </div>
  );
}