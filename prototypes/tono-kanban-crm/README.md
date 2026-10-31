# Prototipo de tablero comercial Tono

Este paquete contiene una maqueta interactiva independiente para revisar el flujo comercial antes de integrarlo en la aplicación. No requiere instalación: abre `tono-dashboard-kanban-prueba.html` en un navegador moderno.

## Qué incluye

- Alta rápida de un comercio con nombre, industria, ciudad y fuente de origen.
- Gráfica de distribución por industria y resumen de fuentes de prospectos.
- Tablero Kanban con Prospecto, Lead, Negociación, Ganado y Perdido.
- Días transcurridos en la etapa, alerta visual desde el día 5 y estado vencido al superar 7 días.
- Excepciones con motivo y fecha de revisión. La antigüedad real no se borra al marcar una excepción.
- Candado de etapa: para mover una ficha hay que registrar primero una actividad o comentario concreto en la etapa actual. El detalle debe tener al menos 8 caracteres.
- Al avanzar, se reinicia el contador de la nueva etapa; el historial conserva la actividad y el cambio.
- Los ejemplos se guardan en `localStorage` del navegador. Usa “Restablecer ejemplo” para volver a los datos iniciales.

Los datos que aparecen son ficticios. El prototipo no está conectado al repositorio, a Supabase ni a ningún servicio de producción.

## Cómo probarlo

1. Abre el archivo HTML en Chrome, Edge o Firefox.
2. Pulsa **Nuevo comercio**. Captura el comercio, industria, ciudad y fuente de origen. Al guardar, aparece en **Prospecto**.
3. En **Kanban**, intenta arrastrar una ficha que indique **Sin registro en esta etapa**. El movimiento debe quedar bloqueado y abrir el formulario de actividad.
4. Registra correo, WhatsApp, llamada, cambaceo o comentario, con un detalle real; guarda y vuelve a arrastrar la ficha.
5. Arrastra una ficha a **Ganado** o **Perdido** para registrar un cierre. Cada columna representa un resultado distinto.
6. Prueba **Marcar excepción** en una ficha abierta. Se pide motivo y fecha de revisión; la excepción se identifica visualmente, pero conserva los días transcurridos.

## Archivos

- `tono-dashboard-kanban-prueba.html`: demo autónoma e interactiva.
- `tono-dashboard-resumen-velocidad.png`: vista del resumen, velocidad y alertas.
- `tono-dashboard-kanban.png`: vista de tablero Kanban.
- `tono-dashboard-alta-comercio.png`: vista del formulario de alta.
- `tono-dashboard-candado-actividad.png`: vista del formulario obligatorio de actividad.

## Propuesta para añadirlo sin tocar la app actual

Usa una rama nueva basada en `origin/main`, por ejemplo `feature/tono-kanban-actividad-con-candado`. Añade los archivos en una carpeta nueva como `prototypes/tono-kanban-crm/`. No reemplaces `src/pages/Index.tsx`, los formularios actuales, las tablas existentes ni la configuración de despliegue. Así la rama solo agrega el prototipo y estas instrucciones.

Comandos orientativos desde una copia local del repositorio:

```bash
git fetch origin
git switch -c feature/tono-kanban-actividad-con-candado origin/main
mkdir -p prototypes/tono-kanban-crm
cp /ruta/al/paquete/tono-dashboard-kanban-prueba.html prototypes/tono-kanban-crm/
cp /ruta/al/paquete/README.md prototypes/tono-kanban-crm/
cp /ruta/al/paquete/*.png prototypes/tono-kanban-crm/
git add prototypes/tono-kanban-crm
git commit -m "Add standalone sales Kanban prototype"
git push -u origin feature/tono-kanban-actividad-con-candado
```

Estos comandos crean y publican una rama aparte; no hacen `push` a `main` ni cambian el despliegue por sí solos.

## Consideraciones antes de integrarlo a producción

La maqueta usa lógica del lado del navegador; el candado no es una protección real para la aplicación hasta que también se aplique en el servidor. Para una integración confiable, conviene guardar:

- Una entidad por comercio con nombre, industria, ciudad y fuente de origen.
- Un historial de etapas con `entered_at` y `exited_at` para calcular la duración por etapa y el ciclo total hasta el cierre.
- Una tabla de actividades con comercio, tipo de contacto, nota, fecha y etapa vigente al registrar la actividad.
- Una excepción con motivo y fecha de revisión, sin modificar la duración real.

El cambio de etapa debe validarse en una operación atómica en Supabase/Postgres: verificar que exista una actividad o nota válida registrada en la etapa actual y, solo entonces, guardar el cambio y su fecha. La interfaz sola se puede omitir; una validación en base de datos evita que se pueda saltar el candado desde otro cliente.

También conviene que la industria y el origen provengan de catálogos editables, y que “fuente de origen” se mantenga separada del “canal de contacto” (correo, WhatsApp, llamada o cambaceo).