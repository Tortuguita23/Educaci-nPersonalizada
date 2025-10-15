# Educación Personalizada - Repositorio web

Esta página permite a las y los estudiantes del curso "Educación personalizada. Fundamentos antropológicos, filosóficos y psicológicos" entregar sus presentaciones y actividades voluntarias directamente en una carpeta de Google Drive compartida.

## Estructura del proyecto

- `index.html`: Contiene la estructura y el contenido principal de la página.
- `styles.css`: Define los estilos con la paleta de colores institucional (azul UNIR, negro y blanco).
- `script.js`: Gestiona la autenticación con Google y la subida de archivos a Drive.

## Configuración necesaria

Para que las subidas funcionen necesitas crear un proyecto en Google Cloud y habilitar la **Google Drive API**:

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/).
2. Habilita la **Google Drive API** para ese proyecto.
3. En la sección **Credenciales** crea:
   - Una clave de API (API Key).
   - Un ID de cliente OAuth 2.0 para aplicaciones web.
4. Configura los orígenes autorizados y la URL de redirección según donde publiques la página.
5. Copia los valores y sustitúyelos en `script.js` en las constantes `CLIENT_ID` y `API_KEY`.

> **Nota**: La carpeta de destino está fijada al identificador `12FaYhyyBsXvtszZk0w-NVHt9yKXOVLfk`. Si necesitas carpetas diferentes para presentaciones y actividades, actualiza los valores dentro del objeto `FOLDER_IDS` en `script.js`.

## Uso

1. Abre `index.html` en tu navegador.
2. Pulsa **Iniciar sesión con Google** y autoriza el acceso a tu Google Drive.
3. Selecciona el archivo que quieres enviar en la sección correspondiente.
4. Haz clic en **Enviar** para subirlo a la carpeta compartida.
5. Puedes consultar los archivos enviados desde el enlace "Ver carpeta en Drive" en cada sección.

## Personalización

- Ajusta los textos en `index.html` para adaptarlos a futuras actividades.
- Modifica la paleta de colores o tipografía en `styles.css` si deseas personalizar la apariencia.

## Seguridad

- Comparte la página únicamente con cuentas autorizadas.
- Revoca el acceso desde la [consola de seguridad de Google](https://myaccount.google.com/permissions) si es necesario.
