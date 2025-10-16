const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

const GOOGLE_DRIVE_CONFIG = window.GOOGLE_DRIVE_CONFIG ?? {};
const DRIVE_SCOPE = GOOGLE_DRIVE_CONFIG.scope ?? 'https://www.googleapis.com/auth/drive.file';
const DRIVE_DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
];

let gapiClientInitializationPromise;

function getGapiLoadPromise() {
  if (
    window.__gapiLoadPromise &&
    typeof window.__gapiLoadPromise.then === 'function'
  ) {
    return window.__gapiLoadPromise;
  }

  return Promise.reject(
    new Error(
      'No se pudo cargar la librería de Google API. Revisa la etiqueta <script> que incluye "apis.google.com/js/api.js".',
    ),
  );
}

function ensureGapiClient() {
  if (!gapiClientInitializationPromise) {
    gapiClientInitializationPromise = getGapiLoadPromise().then(
      () =>
        new Promise((resolve, reject) => {
          const { apiKey, clientId } = GOOGLE_DRIVE_CONFIG;

          if (!apiKey || !clientId) {
            reject(
              new Error(
                'Configura tu API Key y Client ID en window.GOOGLE_DRIVE_CONFIG para habilitar la subida a Drive.',
              ),
            );
            return;
          }

          window.gapi.load('client:auth2', async () => {
            try {
              await window.gapi.client.init({
                apiKey,
                clientId,
                scope: DRIVE_SCOPE,
                discoveryDocs: DRIVE_DISCOVERY_DOCS,
              });
              resolve(window.gapi);
            } catch (error) {
              reject(error);
            }
          });
        }),
    );
  }

  return gapiClientInitializationPromise;
}

async function ensureSignedIn() {
  const gapi = await ensureGapiClient();
  const authInstance = gapi.auth2?.getAuthInstance();

  if (!authInstance) {
    throw new Error('No se pudo inicializar la autenticación con Google.');
  }

  if (!authInstance.isSignedIn.get()) {
    await authInstance.signIn();
  }

  return gapi;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binary);
}

async function uploadFileToDrive(gapi, file, folderId) {
  const metadata = {
    name: file.name,
    parents: folderId ? [folderId] : undefined,
  };

  const fileContent = await file.arrayBuffer();
  const base64Data = arrayBufferToBase64(fileContent);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  const contentType = file.type || 'application/octet-stream';

  const multipartRequestBody =
    `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata,
    )}${delimiter}Content-Type: ${contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64Data}${closeDelimiter}`;

  const response = await gapi.client.request({
    path: '/upload/drive/v3/files',
    method: 'POST',
    params: {
      uploadType: 'multipart',
    },
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  return response.result;
}

function extractErrorMessage(error) {
  if (!error) {
    return 'Ocurrió un error desconocido al subir el archivo.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.error === 'popup_closed_by_user') {
    return 'No se completó la autorización de Google. Intenta de nuevo y concede los permisos solicitados.';
  }

  if (error.error === 'access_denied') {
    return 'Se denegaron los permisos de acceso a Google Drive. Debes autorizar la aplicación para continuar.';
  }

  if (error.result?.error?.message) {
    return error.result.error.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'No se pudo completar la subida del archivo.';
}

function getForms() {
  return Array.from(document.querySelectorAll('.upload-card'));
}

function enhanceForm(form) {
  const fileInput = form.querySelector('input[type="file"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.upload-card__status');
  const folderId = form.dataset.driveFolder ?? '';
  const hasCredentials = Boolean(
    GOOGLE_DRIVE_CONFIG.apiKey && GOOGLE_DRIVE_CONFIG.clientId,
  );

  const clearStatus = () => {
    if (!status) return;
    status.textContent = '';
    status.classList.remove(
      'upload-card__status--success',
      'upload-card__status--error',
      'upload-card__status--pending',
    );
  };

  const updateStatus = (type, message) => {
    if (!status) return;
    status.textContent = message ?? '';
    status.classList.remove(
      'upload-card__status--success',
      'upload-card__status--error',
      'upload-card__status--pending',
    );
    if (type) {
      status.classList.add(`upload-card__status--${type}`);
    }
  };

  const updateButtonState = () => {
    if (!submitButton) return;
    if (!hasCredentials) {
      submitButton.disabled = true;
      return;
    }

    const hasFile = Boolean(fileInput?.files && fileInput.files.length > 0);
    submitButton.disabled = !hasFile;
  };

  clearStatus();
  updateButtonState();

  if (!folderId) {
    updateStatus(
      'error',
      'Falta configurar la carpeta de destino en data-drive-folder.',
    );
    if (submitButton) {
      submitButton.disabled = true;
    }
    return;
  }

  if (!hasCredentials) {
    updateStatus(
      'error',
      'Configura tu API Key y Client ID en el bloque GOOGLE_DRIVE_CONFIG para habilitar la subida.',
    );
    if (submitButton) {
      submitButton.disabled = true;
    }
  }

  fileInput?.addEventListener('change', () => {
    clearStatus();
    updateButtonState();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      updateStatus('error', 'Selecciona un archivo antes de enviarlo.');
      return;
    }

    if (!hasCredentials) {
      updateStatus(
        'error',
        'La subida está deshabilitada porque faltan las credenciales de Google Drive.',
      );
      return;
    }

    const file = fileInput.files[0];

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      updateStatus('pending', 'Solicitando autorización de Google…');
      const gapi = await ensureSignedIn();
      updateStatus('pending', 'Subiendo archivo a Google Drive…');
      const uploaded = await uploadFileToDrive(gapi, file, folderId);
      updateStatus(
        'success',
        `Archivo "${uploaded?.name ?? file.name}" enviado correctamente a Drive.`,
      );
      fileInput.value = '';
    } catch (error) {
      const message = extractErrorMessage(error);
      updateStatus('error', message);
    } finally {
      updateButtonState();
    }
  });
}

function initializeForms() {
  const forms = getForms();

  if (forms.length === 0) {
    console.warn(
      'No se encontraron formularios de carga en la página. Comprueba la estructura del documento.',
    );
    return;
  }

  forms.forEach(enhanceForm);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForms);
} else {
  initializeForms();
}
