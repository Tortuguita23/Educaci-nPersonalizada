# Educación Personalizada - Repositorio web

Recurso web para que el estudiantado del curso "Educación personalizada. Fundamentos antropológicos, filosóficos y psicológicos" comparta actividades complementarias directamente con la docente sin exponer direcciones de correo.

## Estructura del proyecto

- `index.html`: Contiene la estructura y el contenido principal de la página con el formulario de envío directo.
- `styles.css`: Define los estilos con la paleta de colores institucional (azul UNIR, negro y blanco) y el diseño del formulario.
- `script.js`: Actualiza dinámicamente el año mostrado en el pie de página y gestiona el envío del formulario mediante EmailJS.

## Uso

1. Abre `index.html` en tu navegador.
2. Completa los campos requeridos (nombre y apellidos, actividad) y adjunta el archivo correspondiente (máximo 15&nbsp;MB).
3. Escribe un mensaje opcional si quieres añadir contexto a tu entrega.
4. Pulsa **Enviar documento** y espera a que aparezca la confirmación.

## Configuración del correo de reenvío

El formulario utiliza [EmailJS](https://www.emailjs.com/) con una cuenta intermediaria ya configurada para reenviar todas las entregas directamente a `gcformacio@gmail.com` sin exponer la dirección al estudiantado. De forma predeterminada se emplea el servicio `service_gc_relay_ed`, la plantilla `template_gc_entregas` y la clave pública `xfEmBOofmKP9`.

### Cambiar la cuenta de destino (opcional)

Si en el futuro necesitas actualizar el correo receptor o rotar credenciales:

1. Accede a EmailJS con la cuenta intermediaria y modifica el destinatario dentro de la plantilla `template_gc_entregas`.
2. Si creas un nuevo servicio o plantilla, actualiza los atributos `data-email-service`, `data-email-template` y `data-email-public-key` del formulario (`index.html`) con los nuevos identificadores, codificándolos en base64 si deseas mantenerlos ocultos.
3. Guarda los cambios y realiza un envío de prueba para validar la nueva configuración.

> Los adjuntos se envían codificados en base64 a través de EmailJS. Verifica en tu servicio de correo que el tamaño permitido cubre el límite de 15&nbsp;MB establecido en el formulario.

## Personalización

- Ajusta los textos o enlaces en `index.html` para adaptarlos a futuras actividades.
- Modifica la paleta de colores o tipografía en `styles.css` si deseas personalizar la apariencia.
