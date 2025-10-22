# Educación Personalizada - Repositorio web

Esta página permite a las y los estudiantes del curso "Educación personalizada. Fundamentos antropológicos, filosóficos y psicológicos" acceder rápidamente a las carpetas de Google Drive y enviar archivos mediante un formulario alternativo cuando no tengan acceso a Drive.

## Estructura del proyecto

- `index.html`: Contiene la estructura y el contenido principal de la página con los enlaces a cada carpeta y el formulario de subida directa.
- `styles.css`: Define los estilos con la paleta de colores institucional (azul UNIR, negro y blanco) y el diseño del formulario.
- `script.js`: Actualiza dinámicamente el año que se muestra en el pie de página y gestiona el envío del formulario.

## Uso

1. Abre `index.html` en tu navegador.
2. Selecciona la carpeta de la actividad que quieres entregar o completa el formulario de envío directo.
3. Haz clic en **Abrir carpeta en Drive** para adjuntar el archivo en Google Drive o pulsa **Enviar documento** para mandarlo mediante el formulario.

## Personalización

- Ajusta los textos o enlaces en `index.html` para adaptarlos a futuras actividades.
- Sustituye el valor del atributo `data-endpoint` del formulario por la URL generada por [FormSubmit](https://formsubmit.co/) tras verificar el correo que recibirá los documentos.
- Modifica la paleta de colores o tipografía en `styles.css` si deseas personalizar la apariencia.
