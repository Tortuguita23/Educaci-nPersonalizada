const CLIENT_ID = 'REEMPLAZA_CON_TU_CLIENT_ID_DE_GOOGLE';
const API_KEY = 'REEMPLAZA_CON_TU_API_KEY_DE_GOOGLE';
const FOLDER_IDS = {
  presentations: '12FaYhyyBsXvtszZk0w-NVHt9yKXOVLfk',
  activities: '12FaYhyyBsXvtszZk0w-NVHt9yKXOVLfk',
};

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const forms = document.querySelectorAll('.upload-card');
const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

function setFormsEnabled(enabled) {
  forms.forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = !enabled;
    }
    const status = form.querySelector('.upload-card__status');
    if (!enabled && status) {
      status.textContent = 'Debes iniciar sesión antes de poder enviar archivos.';
      status.classList.remove('upload-card__status--success', 'upload-card__status--error');
    }
  });
}

setFormsEnabled(false);

window.gapiLoaded = function () {
  gapi.load('client', initializeGapiClient);
};

async function initializeGapiClient() {
  try {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
  } catch (error) {
    console.error('Error al inicializar el cliente de la API de Google:', error);
    alert('No se pudo inicializar la API de Google. Revisa tu configuración.');
  }
}

window.gisLoaded = function () {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '',
  });
  gisInited = true;
  maybeEnableButtons();
};

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    authorizeButton.disabled = false;
  }
}

authorizeButton?.addEventListener('click', () => {
  authorizeButton.disabled = true;
  tokenClient.callback = async (resp) => {
    if (resp.error) {
      authorizeButton.disabled = false;
      throw resp;
    }
    signoutButton.hidden = false;
    authorizeButton.textContent = 'Sesión iniciada';
    setFormsEnabled(true);
    forms.forEach((form) => {
      const status = form.querySelector('.upload-card__status');
      if (status) {
        status.textContent = 'Autorización completada. Ya puedes subir tus archivos.';
        status.classList.remove('upload-card__status--error');
        status.classList.add('upload-card__status--success');
      }
    });
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
});

signoutButton?.addEventListener('click', () => {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken(null);
  }
  authorizeButton.textContent = 'Iniciar sesión con Google';
  authorizeButton.disabled = false;
  signoutButton.hidden = true;
  setFormsEnabled(false);
  forms.forEach((form) => {
    const status = form.querySelector('.upload-card__status');
    if (status) {
      status.textContent = 'Sesión cerrada. Inicia sesión para volver a subir archivos.';
      status.classList.remove('upload-card__status--success');
      status.classList.remove('upload-card__status--error');
    }
  });
});

forms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const fileInput = form.querySelector('input[type="file"]');
    const status = form.querySelector('.upload-card__status');
    if (!fileInput || fileInput.files.length === 0) {
      status.textContent = 'Selecciona un archivo antes de enviar.';
      status.classList.remove('upload-card__status--success');
      status.classList.add('upload-card__status--error');
      return;
    }

    const file = fileInput.files[0];
    const targetKey = form.dataset.target;
    const folderId = FOLDER_IDS[targetKey] ?? FOLDER_IDS.presentations;

    try {
      submitButton.disabled = true;
      status.textContent = 'Subiendo archivo...';
      status.classList.remove('upload-card__status--success', 'upload-card__status--error');

      await uploadFileToDrive(file, folderId);

      status.textContent = 'Archivo enviado correctamente a la carpeta compartida.';
      status.classList.add('upload-card__status--success');
      fileInput.value = '';
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      status.textContent = 'No se pudo subir el archivo. Inténtalo nuevamente.';
      status.classList.add('upload-card__status--error');
    } finally {
      submitButton.disabled = false;
    }
  });
});

async function uploadFileToDrive(file, folderId) {
  const token = gapi.client.getToken();
  if (!token) {
    throw new Error('No hay un token de autenticación activo.');
  }

  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
    method: 'POST',
    headers: new Headers({ Authorization: `Bearer ${token.access_token}` }),
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Google Drive: ${errorText}`);
  }

  return response.json();
}

if (document.readyState === 'complete') {
  injectGisScript();
} else {
  window.addEventListener('load', injectGisScript);
}

function injectGisScript() {
  if (document.getElementById('gis-script')) {
    return;
  }
  const script = document.createElement('script');
  script.id = 'gis-script';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    if (typeof window.gisLoaded === 'function') {
      window.gisLoaded();
    }
  };
  document.body.appendChild(script);
}
