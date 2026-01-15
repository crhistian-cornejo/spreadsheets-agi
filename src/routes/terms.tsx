'use client'

import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'
import { Logo } from '@/components/ui/Logo'


export const Route = createFileRoute('/terms')({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: 'Términos de Servicio | Spreadsheets-AGI' },
      { name: 'description', content: 'Términos y condiciones de uso de la plataforma Spreadsheets-AGI.' },
    ],
  }),
})

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link to="/" className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium hover:bg-muted transition-colors">
            <IconArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-semibold">Spreadsheets-AGI</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Términos de Servicio</h1>
            <p className="text-muted-foreground">
              Última actualización: 15 de Enero de 2026
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Al acceder y utilizar Spreadsheets-AGI ("el Servicio"), usted acepta estar sujeto a estos
                Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no podrá
                acceder al Servicio.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed">
                Spreadsheets-AGI es una suite de productividad impulsada por inteligencia artificial que
                permite a los usuarios crear y gestionar hojas de cálculo, documentos y presentaciones
                utilizando procesamiento de lenguaje natural y herramientas avanzadas de IA.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">3. Cuentas de Usuario</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para utilizar ciertas funciones del Servicio, debe crear una cuenta. Usted es responsable de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Mantener la confidencialidad de su contraseña</li>
                <li>Todas las actividades que ocurran bajo su cuenta</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
                <li>Proporcionar información veraz y actualizada</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">4. Uso Aceptable</h2>
              <p className="text-muted-foreground leading-relaxed">
                Usted acepta no utilizar el Servicio para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Actividades ilegales o no autorizadas</li>
                <li>Violar derechos de propiedad intelectual</li>
                <li>Transmitir contenido malicioso o dañino</li>
                <li>Interferir con el funcionamiento del Servicio</li>
                <li>Recopilar información de otros usuarios sin consentimiento</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">5. Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                El Servicio y su contenido original, características y funcionalidad son propiedad de
                Spreadsheets-AGI y están protegidos por derechos de autor, marcas registradas y otras
                leyes de propiedad intelectual.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                El contenido que usted crea utilizando el Servicio sigue siendo de su propiedad.
                Nos otorga una licencia limitada para almacenar y procesar ese contenido con el
                único propósito de proporcionarle el Servicio.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">6. Uso de IA</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nuestro Servicio utiliza inteligencia artificial para procesar sus solicitudes.
                Usted entiende que:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Los resultados de la IA son sugerencias y deben ser verificados</li>
                <li>No garantizamos la precisión de las respuestas generadas por IA</li>
                <li>Usted es responsable de revisar y aprobar cualquier contenido generado</li>
                <li>Sus interacciones pueden ser utilizadas para mejorar nuestros modelos (de forma anónima)</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">7. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground leading-relaxed">
                En ningún caso Spreadsheets-AGI, sus directores, empleados o afiliados serán
                responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos,
                incluyendo pérdida de datos, beneficios o uso del Servicio.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">8. Modificaciones</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Le notificaremos sobre cambios significativos a través de un aviso prominente
                en el Servicio o por correo electrónico.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">9. Terminación</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos terminar o suspender su acceso al Servicio inmediatamente, sin previo
                aviso, por cualquier motivo, incluyendo si usted incumple estos Términos de Servicio.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">10. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tiene preguntas sobre estos Términos de Servicio, puede contactarnos en:
              </p>
              <p className="text-foreground font-medium mt-2">
                soporte@spreadsheets-agi.com
              </p>
            </section>
          </div>

          {/* Footer Links */}
          <div className="pt-8 border-t">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground underline underline-offset-4">
                Política de Privacidad
              </Link>
              <Link to="/" className="hover:text-foreground underline underline-offset-4">
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
