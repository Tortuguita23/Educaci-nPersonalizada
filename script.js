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

forms.forEach((form) => {
  const fileInput = form.querySelector('input[type="file"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.upload-card__status');
  const prefix = form.dataset.prefix ?? '';
  const driveUrl = form.dataset.driveUrl;

  const resetState = () => {
    if (status) {
      status.textContent = '';
      status.classList.remove(
        'upload-card__status--success',
        'upload-card__status--error',
      );
    }
    if (submitButton) {
      submitButton.disabled = true;
    }
  };

  const showError = (message) => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('upload-card__status--success');
    status.classList.add('upload-card__status--error');
  };

  const showSuccess = (message) => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove('upload-card__status--error');
    status.classList.add('upload-card__status--success');
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
      showError(
        `El archivo debe comenzar con "${prefix}". Renómbralo antes de continuar.`,
      );
      if (submitButton) {
        submitButton.disabled = true;
      }
      return false;
    }

    showSuccess('¡Perfecto! El nombre del archivo es correcto.');
    if (submitButton) {
      submitButton.disabled = false;
    }
    return true;
  };

  fileInput?.addEventListener('change', () => {
    if (!handleValidation()) {
      return;
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showError('Selecciona un archivo antes de continuar.');
      return;
    }

    if (!handleValidation()) {
      return;
    }

    if (driveUrl) {
      const driveWindow = window.open(driveUrl, '_blank');
      if (driveWindow) {
        driveWindow.opener = null;
      }
    }

    showSuccess(
      'Nombre verificado. Completa la carga arrastrando el archivo en la carpeta de Drive que se abrió.',
    );

    if (fileInput) {
      fileInput.value = '';
    }

    if (submitButton) {
      submitButton.disabled = true;
    }
  });
});
