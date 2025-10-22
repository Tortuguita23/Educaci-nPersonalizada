const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

const submissionForm = document.getElementById('submissionForm');
const submitButton = document.getElementById('submitButton');
const statusMessage = document.getElementById('formStatus');
const fileInput = document.getElementById('file');

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const resolveMaxFileSize = (form) => {
  const configuredSize = Number(form?.dataset?.maxSizeBytes);

  if (Number.isFinite(configuredSize) && configuredSize > 0) {
    return configuredSize;
  }

  return MAX_FILE_SIZE_BYTES;
};

const isPlaceholder = (value) =>
  typeof value === 'string' && value.toUpperCase().startsWith('REEMPLAZA_');

const getEmailConfig = (form) => {
  if (!form) {
    return null;
  }

  const serviceId = form.dataset.emailService;
  const templateId = form.dataset.emailTemplate;
  const publicKey = form.dataset.emailPublicKey;

  if (
    !serviceId ||
    !templateId ||
    !publicKey ||
    isPlaceholder(serviceId) ||
    isPlaceholder(templateId) ||
    isPlaceholder(publicKey)
  ) {
    return null;
  }

  return { serviceId, templateId, publicKey };
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo preparar el archivo adjunto.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo adjunto.'));
    };

    reader.readAsDataURL(file);
  });

const emailConfig = getEmailConfig(submissionForm);

if (emailConfig && window.emailjs) {
  window.emailjs.init({ publicKey: emailConfig.publicKey });
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

    if (!emailConfig) {
      statusMessage.textContent =
        'El recurso aún no está listo para enviar documentos. Informa a la coordinación para completar la configuración.';
      statusMessage.classList.remove('form-status--success');
      statusMessage.classList.add('form-status--error');
      return;
    }

    if (!window.emailjs) {
      statusMessage.textContent =
        'No se pudo preparar el servicio de correo. Intenta nuevamente más tarde.';
      statusMessage.classList.remove('form-status--success');
      statusMessage.classList.add('form-status--error');
      return;
    }

    statusMessage.textContent = 'Enviando documento…';
    statusMessage.classList.remove('form-status--success', 'form-status--error');
    submitButton.disabled = true;

    try {
      const formData = new FormData(submissionForm);
      const fullName = formData.get('Nombre')?.toString() ?? '';
      const activity = formData.get('Actividad')?.toString() ?? '';
      const message = formData.get('Mensaje')?.toString() ?? '';

      let attachments = [];
      let primaryFileName = '';
      let primaryFileSize = '';

      if (fileInput && fileInput.files.length > 0) {
        const [uploadedFile] = fileInput.files;
        const fileDataUrl = await readFileAsDataUrl(uploadedFile);

        attachments = [
          {
            name: uploadedFile.name,
            data: fileDataUrl,
          },
        ];

        primaryFileName = uploadedFile.name;
        primaryFileSize = `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`;
      }

      const emailPayload = {
        full_name: fullName,
        activity,
        message,
        file_name: primaryFileName,
        file_size: primaryFileSize,
      };

      if (attachments.length > 0) {
        emailPayload.attachments = attachments;
      }

      await window.emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        emailPayload,
      );

      submissionForm.reset();
      statusMessage.textContent =
        '¡Muchas gracias por dedicar tu tiempo a las actividades complementarias voluntarias! He recibido tu documento correctamente.';
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
