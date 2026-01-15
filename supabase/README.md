# Configuración de Supabase

Esta guía te ayudará a configurar Supabase para Spreadsheets-AGI.

## 1. Configuración Inicial

### Variables de Entorno

Asegúrate de tener las siguientes variables en tu archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_KEY=tu-anon-key
```

## 2. Crear las Tablas

### Opción A: Usar el SQL Editor

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia el contenido de `supabase/migrations/001_initial_schema.sql`
5. Ejecuta el script

### Opción B: Usar la CLI de Supabase

```bash
# Instalar la CLI
npm install -g supabase

# Login
supabase login

# Ejecutar migración
supabase db push
```

## 3. Crear Storage Buckets

1. Ve a **Storage** en el Dashboard
2. Crea los siguientes buckets:

### Bucket: `user-files` (Privado)
- **Nombre**: `user-files`
- **Public**: ❌ No
- **Descripción**: Archivos de usuarios (Excel, CSV, etc.)

### Bucket: `avatars` (Público)
- **Nombre**: `avatars`
- **Public**: ✅ Sí
- **Descripción**: Fotos de perfil de usuarios

## 4. Configurar Autenticación

### Habilitar Proveedores

1. Ve a **Authentication** → **Providers**
2. Habilita los proveedores que desees:

#### Email/Password
- Ya está habilitado por defecto
- Puedes personalizar el email de confirmación

#### Google OAuth
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Crea **OAuth 2.0 Client ID**
5. Añade los redirect URIs:
   - `https://tu-proyecto.supabase.co/auth/v1/callback`
6. Copia el Client ID y Client Secret a Supabase

#### GitHub OAuth
1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Crea una nueva **OAuth App**
3. Homepage URL: `http://localhost:3000` (desarrollo) o tu URL de producción
4. Authorization callback URL: `https://tu-proyecto.supabase.co/auth/v1/callback`
5. Copia el Client ID y Client Secret a Supabase

### Configurar URLs de Redirección

1. Ve a **Authentication** → **URL Configuration**
2. Configura:
   - **Site URL**: `http://localhost:3000` (desarrollo)
   - **Redirect URLs**: 
     - `http://localhost:3000/workspace`
     - `http://localhost:3000/login`

## 5. Estructura de la Base de Datos

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Información del perfil de usuario |
| `chats` | Conversaciones con la IA |
| `chat_messages` | Mensajes individuales de cada chat |
| `workbooks` | Hojas de cálculo y documentos |
| `files` | Metadatos de archivos subidos |

### Diagrama de Relaciones

```
auth.users
    │
    ├── profiles (1:1)
    │
    ├── chats (1:N)
    │       └── chat_messages (1:N)
    │
    ├── workbooks (1:N)
    │       └── files (1:N)
    │
    └── files (1:N)
```

## 6. Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con las siguientes políticas:

- **SELECT**: Solo el usuario propietario puede ver sus datos
- **INSERT**: Solo el usuario autenticado puede insertar sus propios datos
- **UPDATE**: Solo el usuario propietario puede actualizar
- **DELETE**: Solo el usuario propietario puede eliminar

## 7. Storage Policies

### `user-files` (Privado)
- Los usuarios solo pueden subir/ver/eliminar archivos en su propia carpeta (`{user_id}/...`)
- Las URLs requieren autenticación o firma

### `avatars` (Público)
- Los usuarios solo pueden subir/eliminar su propio avatar
- Cualquiera puede ver los avatares (URLs públicas)

## 8. Verificar la Configuración

### Test de Conexión

```typescript
import { supabase } from '@/lib/supabase'

// Verificar conexión
const { data, error } = await supabase.from('profiles').select('*').limit(1)

if (error) {
  console.error('Error de conexión:', error)
} else {
  console.log('Conexión exitosa!')
}
```

### Test de Autenticación

```typescript
// Registro
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
})
```

## 9. Solución de Problemas

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el script de migración
- Verifica que estés conectado al proyecto correcto

### Error: "new row violates row-level security policy"
- Verifica que el usuario esté autenticado
- Verifica que el `user_id` corresponda al usuario actual

### Error: "Unauthorized"
- Verifica las variables de entorno
- Asegúrate de usar la clave `anon` (no la `service_role`)

### Los archivos no se suben
- Verifica que los buckets estén creados
- Verifica las políticas de storage
- Asegúrate de que el archivo no exceda el límite (default: 50MB)

## 10. Desarrollo Local

Si quieres usar Supabase localmente:

```bash
# Iniciar Supabase local
supabase start

# Ver las URLs y claves locales
supabase status

# Detener
supabase stop
```

Actualiza tu `.env` con las URLs locales durante el desarrollo.
