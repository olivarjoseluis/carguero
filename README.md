# Carguero

Directorio de motocarros y cargueros en Cali y Jamundí. Hecho con Next.js 16 (App Router), Tailwind CSS 4 y Supabase (Postgres + PostGIS).

## Qué incluye

| Ruta | Qué hace |
|---|---|
| `/` | Landing: selector de ciudad, barrio y carrocería; mapa con pines; tarjetas de conductores; lista de espera de compra y venta; aporte por Bre-B |
| `/registro` | Registro de propietarios en 4 pasos con vista previa del perfil |
| `/c/[id]` | Registra el contacto, guarda la cookie de "¿Cómo te fue?" y redirige a WhatsApp. El número nunca llega al HTML |
| `/r/[token]` | Reseña verificada: un solo uso, vence a los 14 días |
| `/admin` | Panel con contraseña para aprobar, rechazar o devolver a pendiente los registros |
| `/privacidad`, `/terminos` | Borradores legales (complétalos antes de lanzar) |

## 1. Correr en modo demo (sin Supabase)

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin variables de entorno la app usa datos de ejemplo y no guarda nada. Sirve para revisar el diseño.

## 2. Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden:
   - `supabase/migrations/0001_init.sql` (tablas, PostGIS, vistas públicas, funciones, seguridad y el bucket público `fotos`)
   - `supabase/seed.sql` (barrios de Cali y Jamundí y 9 conductores de ejemplo)
3. En **Storage**, confirma que existe el bucket público `fotos` (lo crea la migración).
4. Copia `.env.example` como `.env.local` y llena los valores de **Project Settings > API Keys**: la URL, la publishable key y la secret key (esta última no aparece en el panel "Connect"; búscala en "Secret keys").
5. Reinicia `npm run dev`.

## 3. Operación diaria

Aprobar o rechazar conductores: entra a `/admin` con la contraseña de `ADMIN_PASSWORD` (mínimo 12 caracteres; sin ella el panel queda deshabilitado). Ahí ves los registros pendientes con sus datos, documentos y fotos, y los apruebas, rechazas o devuelves a pendiente. La sesión dura 12 horas y cambiar `ADMIN_PASSWORD` cierra todas las sesiones.

También se puede en SQL Editor:

```sql
select id, first_name, last_name, whatsapp, created_at from drivers where status = 'pending';
update drivers set status = 'approved' where id = '...';
```

Borrar los conductores de ejemplo antes de lanzar:

```sql
delete from drivers where is_sample;
```

Ocultar una reseña:

```sql
update reviews set visible = false where id = '...';
```

El link para que un conductor pida reseña es `https://TU-DOMINIO/r/<token>`. El token se crea cuando el cliente toca WhatsApp (tabla `contact_events`).

## Seguridad y datos personales

- La tabla `drivers` es privada. El público solo lee la vista `public_drivers`, sin WhatsApp, correo, placa ni apellidos completos.
- El registro y los contactos se escriben desde el servidor con la secret key (`SUPABASE_SECRET_KEY`). Nunca uses esa llave en el navegador ni la subas a GitHub.
- La ubicación del conductor es el centro de su primer barrio, nunca su dirección.
- Completa `/privacidad` y `/terminos` (Ley 1581 de 2012) antes de publicar.

## Fotos y protección contra bots

- **Fotos:** el navegador las comprime (máximo 1600 px, JPEG) y las sube directo a Supabase Storage con URLs firmadas que entrega `registerDriver`. No pasan por Vercel. El bucket `fotos` solo acepta JPG, PNG y WebP de hasta 3 MB.
- **Cloudflare Turnstile** protege el registro (acción `signup`) y las reseñas (acción `review`). El widget se llama `carguero` y está en tu cuenta de Cloudflare → Turnstile. Sin `NEXT_PUBLIC_TURNSTILE_SITE_KEY` la app funciona sin Turnstile (modo demo).

## Desplegar

En Vercel: importa el repositorio, agrega las mismas variables de `.env.local` y despliega. Excepción: en Vercel, `TURNSTILE_HOSTNAMES` debe ser `carguero.vercel.app` (sin `localhost`). Tampoco copies `NEXT_PUBLIC_SITE_URL=http://localhost:3000`: ponla como `https://carguero.vercel.app` o bórrala (sin ella se usa el dominio de producción de Vercel). Las tarjetas para redes sociales (`app/opengraph-image.tsx` y `app/registro/opengraph-image.tsx`) usan esa URL para la imagen. Si cambias de dominio, agrégalo también al widget en Cloudflare. El plan Hobby de Vercel no permite uso comercial: cuando empieces a cobrar destacados o patrocinios, pasa a un plan pago.

## Pendientes sugeridos

- Panel del conductor con inicio de sesión (Supabase Auth) y botón "Pedir reseña".
- Páginas por barrio (`/acarreos/[ciudad]/[barrio]`) para SEO.
- Mapa real con Leaflet + OpenStreetMap en lugar del mapa estilizado.
- Usar fotos propias en lugar de `public/motocarro.png`, que muestra el logo de un fabricante.
