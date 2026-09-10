# API de contacto

Funciones serverless que atienden el formulario de `vmdev.lat`.

Sustituyen al servicio Express de [`../server/index.js`](../server/index.js),
que corría en un contenedor propio. Se conserva la misma validación y el mismo
esquema en Postgres; el cambio es que ahora, además de guardar, **avisa por
correo**. Antes un mensaje entraba a la base y nadie se enteraba hasta
consultarla a mano.

| Ruta | Método | Qué hace |
|---|---|---|
| `/api/contact` | POST | Valida, guarda en Postgres y manda aviso |
| `/api/health` | GET | Estado del servicio |

## Decisiones

- **Serverless en vez de contenedor.** El formulario recibe unos pocos mensajes
  al mes; un contenedor encendido las 24 horas es capacidad ociosa que además
  se cae cuando falla el cobro. Una función solo corre cuando alguien escribe.
- **CORS por lista blanca**, no `*`. Solo los orígenes de `ALLOWED_ORIGINS`.
- **El pool se reutiliza** entre invocaciones mientras la instancia siga
  caliente, con `max: 1`: en serverless cada instancia abre sus propias
  conexiones y un pool grande agota la base.
- **Si falla el correo, la petición no falla.** El mensaje ya está guardado;
  perder el aviso es molesto, perder el mensaje no es aceptable.
- **Sin rate limit en memoria.** El de Express no sirve aquí: cada invocación
  puede caer en una instancia distinta y el contador se pierde. Si hace falta,
  va con un contador externo o con la protección de la plataforma.

## Variables de entorno

| Variable | Requerida | Para qué |
|---|---|---|
| `DATABASE_URL` | sí | Postgres (Neon, Supabase, el que sea) |
| `ALLOWED_ORIGINS` | sí | Orígenes permitidos, separados por coma |
| `RESEND_API_KEY` | no | Sin ella, guarda pero no avisa |
| `NOTIFY_EMAIL` | no | Destino del aviso. Default `tiggreee@vmdev.lat` |

## Despliegue

```bash
vercel --prod
```

Después, apuntar el formulario al dominio que devuelva Vercel: el atributo
`data-api-url` en `index.html`.
