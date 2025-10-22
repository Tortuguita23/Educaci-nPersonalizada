const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

const submissionForm = document.getElementById('submissionForm');
const submitButton = document.getElementById('submitButton');
const statusMessage = document.getElementById('formStatus');
const fileInput = document.getElementById('file');

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const decodeEndpoint = (form) => {
  const encodedToken = form?.dataset?.endpointToken;

  if (!encodedToken) {
    return '';
  }

  try {
    const decodedEmail = atob(encodedToken);
    return `https://formsubmit.co/ajax/${decodedEmail}`;
  } catch (error) {
    console.error('No se pudo preparar el envío del formulario.', error);
    return '';
  }
};

const resolveMaxFileSize = (form) => {
  const configuredSize = Number(form?.dataset?.maxSizeBytes);

  if (Number.isFinite(configuredSize) && configuredSize > 0) {
    return configuredSize;
  }

  return MAX_FILE_SIZE_BYTES;
};

if (submissionForm) {
  const preparedEndpoint = decodeEndpoint(submissionForm);

  if (preparedEndpoint) {
    submissionForm.dataset.endpoint = preparedEndpoint;
  }
}

if (submissionForm && submitButton && statusMessage && fileInput) {
  fileInput.addEventListener('change', () => {
    statusMessage.textContent = '';
    statusMessage.classList.remove('form-status--success', 'form-status--error');
  });
}

if (submissionForm && submitButton && statusMessage) {
  submissionForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const endpoint = submissionForm.dataset.endpoint;
    const maxFileSize = resolveMaxFileSize(submissionForm);
    const sizeLimitInMB = Math.round(maxFileSize / (1024 * 1024));

    if (fileInput && fileInput.files.length > 0) {
      const [uploadedFile] = fileInput.files;

      if (uploadedFile.size > maxFileSize) {
        statusMessage.textContent = `El archivo supera el límite permitido de ${sizeLimitInMB} MB.`;
        statusMessage.classList.remove('form-status--success');
        statusMessage.classList.add('form-status--error');
        return;
      }
    }

    if (!endpoint) {
      statusMessage.textContent =
        'No se pudo preparar el formulario para el envío. Informa a la coordinación.';
      statusMessage.classList.remove('form-status--success');
      statusMessage.classList.add('form-status--error');
      return;
    }

    statusMessage.textContent = 'Enviando documento…';
    statusMessage.classList.remove('form-status--success', 'form-status--error');
    submitButton.disabled = true;

    try {
      const formData = new FormData(submissionForm);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo enviar el formulario.');
      }

      submissionForm.reset();
      statusMessage.textContent =
        '¡Gracias por dedicar tiempo a las actividades complementarias voluntarias! Tu documento se envió correctamente.';
      statusMessage.classList.add('form-status--success');
    } catch (error) {
      console.error(error);
      statusMessage.textContent =
        'Ocurrió un problema al enviar el documento. Intenta nuevamente en unos minutos.';
      statusMessage.classList.add('form-status--error');
    } finally {
      submitButton.disabled = false;
    }
  });
}
