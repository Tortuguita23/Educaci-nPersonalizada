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

El formulario utiliza [EmailJS](https://www.emailjs.com/) para reenviar los documentos al correo de coordinación sin exponer la dirección a la vista del estudiantado. Para dejar el recurso operativo sigue estos pasos:

1. Crea una cuenta en EmailJS e inicia sesión.
2. En la sección **Email Services**, conecta la cuenta de correo que actuará como intermediaria (por ejemplo, Gmail, Outlook u otro servidor SMTP) y toma nota del `Service ID` asignado.
3. En **Email Templates**, crea una nueva plantilla con los campos que quieras recibir. Añade al menos las variables `full_name`, `activity`, `message`, `file_name` y `file_size` en el cuerpo del mensaje, y configura el destinatario final (tu dirección institucional).
4. En **Account** → **API Keys**, copia tu `Public Key`.
5. Edita el formulario en `index.html` sustituyendo los valores de los atributos `data-email-service`, `data-email-template` y `data-email-public-key` por los datos obtenidos en los pasos anteriores.
6. Publica los cambios y realiza un envío de prueba para autorizar la cuenta emisora si el proveedor lo solicita.

> Los adjuntos se envían codificados en base64 a través de EmailJS. Verifica en tu servicio de correo que el tamaño permitido cubre el límite de 15&nbsp;MB establecido en el formulario.

## Personalización

- Ajusta los textos o enlaces en `index.html` para adaptarlos a futuras actividades.
- Modifica la paleta de colores o tipografía en `styles.css` si deseas personalizar la apariencia.
