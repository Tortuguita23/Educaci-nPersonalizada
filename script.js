const forms = document.querySelectorAll('.upload-card');
const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

function validateFileName(fileName, expectedPrefix) {
  if (!fileName || !expectedPrefix) {
    return false;
  }

  return fileName.toLowerCase().startsWith(expectedPrefix.toLowerCase());
}

function isEndpointConfigured(endpoint) {
  if (!endpoint) return false;
  const placeholderPattern = /REEMPLAZA/i;
  return !placeholderPattern.test(endpoint.trim());
}

forms.forEach((form) => {
  const fileInput = form.querySelector('input[type="file"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.upload-card__status');
  const prefix = form.dataset.prefix ?? '';
  const endpoint = form.dataset.endpoint ?? '';
  const category = form.dataset.category ?? '';

  const resetState = () => {
    if (status) {
      status.textContent = '';
      status.classList.remove(
        'upload-card__status--success',
        'upload-card__status--error',
        'upload-card__status--info',
      );
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.loading = 'false';
      submitButton.textContent = 'Enviar archivo';
    }
  };

  const showMessage = (message, type = 'info') => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove(
      'upload-card__status--success',
      'upload-card__status--error',
      'upload-card__status--info',
    );
    status.classList.add(`upload-card__status--${type}`);
  };

  const updateButtonState = (isLoading, isEnabled) => {
    if (!submitButton) return;
    submitButton.disabled = !isEnabled;
    submitButton.dataset.loading = isLoading ? 'true' : 'false';
    submitButton.textContent = isLoading ? 'Enviando…' : 'Enviar archivo';
  };

  resetState();

  const handleValidation = () => {
    if (!fileInput) {
      return false;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
      resetState();
      return false;
    }

    const fileName = fileInput.files[0].name.trim();

    if (!validateFileName(fileName, prefix)) {
      showMessage(
        `El archivo debe comenzar con "${prefix}". Renómbralo antes de continuar.`,
        'error',
      );
      if (submitButton) {
        submitButton.disabled = true;
      }
      return false;
    }

    showMessage('¡Perfecto! El nombre del archivo es correcto.', 'success');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.dataset.loading = 'false';
      submitButton.textContent = 'Enviar archivo';
    }
    return true;
  };

  fileInput?.addEventListener('change', () => {
    if (!handleValidation()) {
      return;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showMessage('Selecciona un archivo antes de continuar.', 'error');
      return;
    }

    if (!handleValidation()) {
      return;
    }

    if (!isEndpointConfigured(endpoint)) {
      showMessage(
        'No se ha configurado el servicio de carga. Contacta con la profesora para completar el envío.',
        'error',
      );
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('category', category);
    formData.append('prefix', prefix);
    formData.append('originalFileName', file.name);

    updateButtonState(true, false);
    showMessage('Enviando tu archivo, espera un momento…', 'info');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      showMessage('Archivo enviado correctamente. ¡Gracias por tu entrega!', 'success');
      fileInput.value = '';
      updateButtonState(false, false);
    } catch (error) {
      console.error('Upload error:', error);
      showMessage(
        'No se pudo completar el envío. Inténtalo de nuevo o contacta con la profesora.',
        'error',
      );
      updateButtonState(false, true);
    }
  });
});
