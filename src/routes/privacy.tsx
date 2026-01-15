'use client'

import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'
import { Logo } from '@/components/ui/Logo'


export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: 'Política de Privacidad | Spreadsheets-AGI' },
      { name: 'description', content: 'Política de privacidad y protección de datos de Spreadsheets-AGI.' },
    ],
  }),
})

function PrivacyPage() {
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
            <h1 className="text-4xl font-bold tracking-tight">Política de Privacidad</h1>
            <p className="text-muted-foreground">
              Última actualización: 15 de Enero de 2026
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Introducción</h2>
              <p className="text-muted-foreground leading-relaxed">
                En Spreadsheets-AGI, valoramos su privacidad y nos comprometemos a proteger sus
                datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos,
                almacenamos y protegemos su información cuando utiliza nuestro servicio.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">2. Información que Recopilamos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Recopilamos diferentes tipos de información para proporcionar y mejorar nuestro Servicio:
              </p>

              <h3 className="text-xl font-medium mt-6">2.1 Información de Cuenta</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Nombre y apellidos</li>
                <li>Dirección de correo electrónico</li>
                <li>Foto de perfil (opcional)</li>
                <li>Información de autenticación (tokens OAuth)</li>
              </ul>

              <h3 className="text-xl font-medium mt-6">2.2 Datos de Uso</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Hojas de cálculo y documentos creados</li>
                <li>Historial de conversaciones con la IA</li>
                <li>Preferencias de configuración</li>
                <li>Logs de actividad y uso del servicio</li>
              </ul>

              <h3 className="text-xl font-medium mt-6">2.3 Información Técnica</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Sistema operativo</li>
                <li>Cookies y tecnologías similares</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">3. Cómo Usamos su Información</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Proporcionar, mantener y mejorar el Servicio</li>
                <li>Procesar sus solicitudes y responder a consultas</li>
                <li>Personalizar su experiencia de usuario</li>
                <li>Enviar actualizaciones y comunicaciones relevantes</li>
                <li>Detectar y prevenir fraudes o abusos</li>
                <li>Mejorar nuestros modelos de IA (de forma anónima y agregada)</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">4. Procesamiento con IA</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nuestro servicio utiliza inteligencia artificial para procesar sus solicitudes.
                Es importante entender que:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Sus conversaciones son procesadas por modelos de IA para generar respuestas</li>
                <li>No compartimos el contenido específico de sus documentos con terceros</li>
                <li>Los datos pueden ser utilizados de forma anónima para mejorar el servicio</li>
                <li>Puede solicitar la eliminación de su historial de conversaciones</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">5. Almacenamiento y Seguridad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas de seguridad robustas para proteger sus datos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Encriptación de datos en tránsito (TLS/SSL)</li>
                <li>Encriptación de datos en reposo</li>
                <li>Autenticación segura con OAuth 2.0</li>
                <li>Controles de acceso basados en roles</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Copias de seguridad regulares</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Sus datos se almacenan en servidores seguros proporcionados por Supabase,
                con centros de datos ubicados en regiones que cumplen con estándares
                internacionales de protección de datos.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">6. Compartición de Datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                No vendemos sus datos personales. Solo compartimos información en los
                siguientes casos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a operar el servicio (hosting, análisis)</li>
                <li><strong>Proveedores de IA:</strong> Para procesar sus solicitudes (OpenAI, Anthropic, etc.)</li>
                <li><strong>Requerimientos legales:</strong> Cuando sea requerido por ley</li>
                <li><strong>Con su consentimiento:</strong> Cuando usted lo autorice explícitamente</li>
              </ul>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">7. Sus Derechos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Usted tiene los siguientes derechos respecto a sus datos personales:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos</li>
                <li><strong>Portabilidad:</strong> Exportar sus datos en formato estándar</li>
                <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
                <li><strong>Restricción:</strong> Limitar cómo usamos sus datos</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Para ejercer estos derechos, contáctenos a través del correo electrónico
                indicado al final de esta política.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">8. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Mantener su sesión iniciada</li>
                <li>Recordar sus preferencias</li>
                <li>Analizar el uso del servicio</li>
                <li>Mejorar la experiencia de usuario</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Puede configurar su navegador para rechazar cookies, aunque esto puede
                afectar la funcionalidad del Servicio.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">9. Retención de Datos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Conservamos sus datos personales mientras mantenga una cuenta activa o
                según sea necesario para proporcionarle el Servicio. Puede solicitar la
                eliminación de su cuenta y datos en cualquier momento.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Algunos datos pueden ser retenidos por períodos adicionales para cumplir
                con obligaciones legales, resolver disputas o hacer cumplir nuestros acuerdos.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">10. Menores de Edad</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nuestro Servicio no está dirigido a personas menores de 13 años. No
                recopilamos intencionalmente información de menores. Si descubrimos que
                hemos recopilado datos de un menor, los eliminaremos inmediatamente.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">11. Cambios a esta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos actualizar esta Política de Privacidad periódicamente. Le
                notificaremos sobre cambios significativos publicando la nueva política
                en esta página y, si es apropiado, por correo electrónico.
              </p>
            </section>

            <section className="space-y-4 mt-8">
              <h2 className="text-2xl font-semibold">12. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Si tiene preguntas sobre esta Política de Privacidad o desea ejercer
                sus derechos, puede contactarnos en:
              </p>
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
                <p className="font-medium">Spreadsheets-AGI</p>
                <p className="text-muted-foreground">Correo: privacidad@spreadsheets-agi.com</p>
                <p className="text-muted-foreground">Soporte: soporte@spreadsheets-agi.com</p>
              </div>
            </section>
          </div>

          {/* Footer Links */}
          <div className="pt-8 border-t">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground underline underline-offset-4">
                Términos de Servicio
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
