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

async function refreshAccessToken(gapi) {
  const authInstance = gapi.auth2?.getAuthInstance();

  if (!authInstance) {
    throw new Error('No se pudo inicializar la autenticación con Google.');
  }

  const currentUser = authInstance.currentUser?.get();

  if (!currentUser) {
    throw new Error('No se detectó ningún usuario autenticado de Google.');
  }

  const authResponse = await currentUser.reloadAuthResponse();
  const accessToken = authResponse?.access_token;

  if (!accessToken) {
    throw new Error(
      'Google no devolvió un token de acceso válido. Intenta cerrar sesión y volver a ingresar.',
    );
  }

  if (typeof gapi.client.setToken === 'function') {
    gapi.client.setToken({ access_token: accessToken });
  }

  return accessToken;
}

async function getAccessToken(gapi) {
  const token =
    (typeof gapi.client.getToken === 'function' && gapi.client.getToken()) ||
    gapi.auth?.getToken?.();

  if (token?.access_token) {
    return token.access_token;
  }

  return refreshAccessToken(gapi);
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

  await refreshAccessToken(gapi);

  return gapi;
}

async function uploadFileToDrive(gapi, file, folderId) {
  const metadata = {
    name: file.name,
    mimeType: file.type || undefined,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = `-------314159265358979323846${Date.now()}`;

  const multipartBody = new Blob(
    [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ],
    {
      type: `multipart/related; boundary=${boundary}`,
    },
  );

  const accessToken = await getAccessToken(gapi);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: multipartBody,
    },
  );

  if (!response.ok) {
    let errorDetails = {};
    try {
      errorDetails = await response.json();
    } catch (parseError) {
      // Si la respuesta no es JSON, se utilizará el statusText.
    }

    const message =
      errorDetails?.error?.message ||
      errorDetails?.error_description ||
      response.statusText ||
      'No se pudo completar la subida del archivo.';

    throw new Error(message);
  }

  return response.json();
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
