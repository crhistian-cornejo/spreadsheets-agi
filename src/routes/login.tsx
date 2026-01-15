'use client'

import * as React from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft, IconBrandGithub, IconEye, IconEyeOff, IconLock, IconMail, IconUser } from '@tabler/icons-react'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/lib/supabase'
import { FloatingPaths } from '@/components/ui/floating-paths'
import { Button } from '@/components/ui/button'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group'

export const Route = createFileRoute('/login')({
    component: LoginPage,
    head: () => ({
        meta: [
            { title: 'Login | Spreadsheets-AGI' },
            { name: 'description', content: 'Inicia sesión en Spreadsheets-AGI para potenciar tu productividad con IA.' },
        ],
    }),
})

function LoginPage() {
    const navigate = useNavigate()
    const { signIn, signUp, signInWithGoogle, signInWithGithub, user, isLoading: authLoading } = useAuth()

    const [mode, setMode] = React.useState<'login' | 'register'>('login')
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [fullName, setFullName] = React.useState('')
    const [showPassword, setShowPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

    // Redirect if already logged in
    React.useEffect(() => {
        if (user && !authLoading) {
            navigate({ to: '/workspace' })
        }
    }, [user, authLoading, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        setIsLoading(true)

        try {
            if (mode === 'login') {
                const { error: signInError } = await signIn(email, password)
                if (signInError) {
                    setError(signInError.message)
                } else {
                    navigate({ to: '/workspace' })
                }
            } else {
                const { error: signUpError } = await signUp(email, password, fullName)
                if (signUpError) {
                    setError(signUpError.message)
                } else {
                    setSuccessMessage('¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.')
                    setMode('login')
                }
            }
        } catch (err) {
            setError('Ha ocurrido un error. Por favor, intenta de nuevo.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthSignIn = async (provider: 'google' | 'github') => {
        setError(null)
        setIsLoading(true)

        try {
            const { error: oauthError } = provider === 'google'
                ? await signInWithGoogle()
                : await signInWithGithub()

            if (oauthError) {
                setError(oauthError.message)
            }
        } catch (err) {
            setError('Ha ocurrido un error con la autenticación.')
        } finally {
            setIsLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
            {/* Left Panel - Branding with FloatingPaths */}
            <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
                <Logo className="mr-auto h-8 w-8" />

                <div className="z-10 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-xl">
                            &ldquo;Esta plataforma me ha ayudado a ahorrar tiempo y servir a mis
                            clientes más rápido que nunca.&rdquo;
                        </p>
                        <footer className="font-mono font-semibold text-sm">
                            ~ Usuario Satisfecho
                        </footer>
                    </blockquote>
                </div>
                <div className="absolute inset-0 overflow-hidden">
                    <FloatingPaths position={1} />
                    <FloatingPaths position={-1} />
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="relative flex min-h-screen flex-col justify-center p-4">
                {/* Background decorations */}
                <div
                    aria-hidden
                    className="-z-10 absolute inset-0 isolate opacity-60 contain-strict"
                >
                    <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
                    <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
                </div>

                {/* Back to Home Button */}
                <Button
                    className="absolute top-7 left-5"
                    variant="ghost"
                    onClick={() => navigate({ to: '/' })}
                >
                    <IconArrowLeft className="h-4 w-4" />
                    Inicio
                </Button>

                <div className="mx-auto space-y-4 w-full max-w-sm px-4">
                    {/* Mobile Logo */}
                    <Logo className="h-8 w-8 lg:hidden" />

                    {/* Header */}
                    <div className="flex flex-col space-y-1">
                        <h1 className="font-bold text-2xl tracking-wide">
                            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                        </h1>
                        <p className="text-base text-muted-foreground">
                            {mode === 'login'
                                ? 'Ingresa a tu cuenta de Spreadsheets-AGI.'
                                : 'Crea tu cuenta de Spreadsheets-AGI.'}
                        </p>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {/* OAuth Buttons */}
                    <div className="space-y-2">
                        <Button
                            className="w-full h-10 gap-3"
                            size="lg"
                            type="button"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => handleOAuthSignIn('google')}
                        >
                            <GoogleIcon className="size-4" />
                            Continuar con Google
                        </Button>
                        <Button
                            className="w-full h-10 gap-3"
                            size="lg"
                            type="button"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => handleOAuthSignIn('github')}
                        >
                            <IconBrandGithub className="size-4" />
                            Continuar con GitHub
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="flex w-full items-center justify-center">
                        <div className="h-px w-full bg-border" />
                        <span className="px-2 text-muted-foreground text-xs whitespace-nowrap">o continúa con email</span>
                        <div className="h-px w-full bg-border" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                                    Nombre completo
                                </label>
                                <InputGroup className="h-10">
                                    <InputGroupAddon align="inline-start">
                                        <IconUser className="size-4" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Tu nombre"
                                        className="h-full"
                                    />
                                </InputGroup>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Correo electrónico
                            </label>
                            <InputGroup className="h-10">
                                <InputGroupAddon align="inline-start">
                                    <IconMail className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    className="h-full"
                                />
                            </InputGroup>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                Contraseña
                            </label>
                            <InputGroup className="h-10">
                                <InputGroupAddon align="inline-start">
                                    <IconLock className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="h-full"
                                />
                                <InputGroupAddon align="inline-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                                    </button>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>

                        {mode === 'login' && (
                            <div className="flex justify-end">
                                <button type="button" className="text-sm text-primary hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-10"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            ) : (
                                mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
                            )}
                        </Button>
                    </form>

                    {/* Toggle Mode */}
                    <p className="text-center text-sm text-muted-foreground">
                        {mode === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login')
                                setError(null)
                                setSuccessMessage(null)
                            }}
                            className="text-primary font-medium hover:underline"
                        >
                            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                        </button>
                    </p>

                    {/* Terms */}
                    <p className="text-center text-xs text-muted-foreground">
                        Al continuar, aceptas nuestros{' '}
                        <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
                            Términos de Servicio
                        </Link>{' '}
                        y{' '}
                        <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
                            Política de Privacidad
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </main>
    )
}

// Google Icon SVG
const GoogleIcon = (props: React.ComponentProps<"svg">) => (
    <svg
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <g>
            <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
        </g>
    </svg>
)
