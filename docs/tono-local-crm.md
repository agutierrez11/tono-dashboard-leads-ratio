# Ritmo: CRM personal local

`public/tono-local-crm/` contiene una aplicación estática independiente para el seguimiento personal de prospectos. No modifica el CRM React existente ni sus flujos de Supabase. No necesita servidor, base de datos, API keys ni servicios externos.

## Publicación

Para publicar únicamente este tablero en la infraestructura de la empresa, sirve el contenido de `public/tono-local-crm/` como una carpeta estática. Deben quedar accesibles juntos `index.html`, `app.js` y `styles.css`. También puede ejecutarse `npm run build`; Vite copia automáticamente la carpeta a `dist/tono-local-crm/`. Para una instalación aislada, publica solo `dist/tono-local-crm/`, no el resto del sitio del repositorio.

La app no realiza llamadas de red para guardar o analizar registros. El navegador solo descarga los archivos estáticos desde el host donde se publique. Pon la página detrás del acceso interno aprobado por la empresa; el almacenamiento local no reemplaza el control de acceso del sitio.

## Persistencia y respaldo

Los datos se guardan en `localStorage` con la clave `tono.personal.crm.v1`, separados por origen y perfil de navegador. No se sincronizan con otros dispositivos. Si el usuario borra los datos del navegador, cambia de perfil o se modifica el dominio/origen, necesitará restaurar un respaldo JSON. Usa **Respaldo** y guarda el archivo únicamente en una ubicación aprobada.

El tablero no incluye Supabase, analítica, trackers ni integraciones con Fury, Grid o YAMM. El CRM de la empresa sigue siendo la fuente oficial de TPV real y calidad.

## Importación inicial de prospectos

En Prospectos, importa un CSV con encabezados de negocio (por ejemplo `Nombre del negocio`, `Comercio`, `Empresa` o `Business Name`) e industria/giro. El parser corre dentro del navegador. Del archivo solo conserva el nombre del negocio y la industria; descarta las demás columnas, incluidos correo, teléfono y datos no reconocidos. Revisa la vista previa antes de confirmar. Los registros ingresan a **Por trabajar** y no cuentan como nuevos en Calificación.

Cada movimiento del Kanban requiere registrar un toque real y su resultado. Los canales individuales son llamada, correo directo, WhatsApp y visita. Un correo masivo de YAMM se registra en **Campañas YAMM** con etiqueta, segmento y totales agregados; nunca incrementa el contador de correo directo ni requiere copiar destinatarios.

## Definiciones predeterminadas

- La meta de 8 negocios nuevos en Calificación aplica de lunes a viernes y cuenta al mover un prospecto desde Por trabajar registrando el toque que inicia su trabajo.
- Las metas semanales 40 / 12 / 3 son negocios únicos que entraron a Calificación / Negociación / Closing Deal durante esa semana; no miden inventario activo.
- La meta mensual mide negocios únicos que entraron a Ganado durante el mes. El mes de inicio y las metas de sellers 2 / 4 / 5 / 6 / 6 se pueden ajustar.
- La alarma de más de 7 días mide días calendario desde el último cambio de etapa.
- Las vistas Hoy / Semana / Mes filtran actividad y avance. En **Lecturas**, compara el mismo tramo transcurrido contra el periodo anterior para no enfrentar una semana o mes parcial contra uno completo.
- El tablero no captura TPV estimado ni real, calidad, correos, teléfonos, ciudad ni comentarios libres; los negocios guardan nombre/alias e industria más etapa, tiempos e historial mínimo de toques.
