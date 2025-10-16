function getForms() {
  return Array.from(document.querySelectorAll('.upload-card'));
}

const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

function validateFileName(fileName, expectedPrefix) {
  if (!fileName || !expectedPrefix) {
    return { isValid: false };
  }

  const trimmedPrefix = expectedPrefix.trim();
  const normalizedPrefix = trimmedPrefix.toLowerCase();
  const normalizedFileName = fileName.trim().toLowerCase();

  if (!normalizedFileName.startsWith(normalizedPrefix)) {
    return {
      isValid: false,
      message: `El archivo debe comenzar con "${trimmedPrefix}". Renómbralo antes de continuar.`,
    };
  }

  const remainder = fileName.slice(trimmedPrefix.length);
  const baseName = remainder.replace(/\.[^/.]+$/, '').trim();

  if (!baseName) {
    return {
      isValid: false,
      message: `Añade tu nombre después del prefijo indicado. Ejemplo: ${trimmedPrefix}TuNombre.pdf`,
    };
  }

  if (/\s/.test(baseName)) {
    return {
      isValid: false,
      message: 'Evita espacios en el nombre. Usa guiones bajos o mayúsculas para separar palabras.',
    };
  }

  return { isValid: true };
}

function enhanceForm(form) {
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

    const validation = validateFileName(fileName, prefix);
    if (!validation.isValid) {
      showError(validation.message);
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
      } else {
        window.location.href = driveUrl;
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
