const yearSpan = document.getElementById('year');

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

const submissionForm = document.getElementById('submissionForm');
const submitButton = document.getElementById('submitButton');
const statusMessage = document.getElementById('formStatus');

if (submissionForm && submitButton && statusMessage) {
  submissionForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const endpoint = submissionForm.dataset.endpoint;

    if (!endpoint || endpoint.includes('tu-correo@ejemplo.com')) {
      statusMessage.textContent =
        'Configura el correo de destino en el formulario antes de enviar.';
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
        '¡Gracias! Tu documento se envió correctamente. Revisa tu correo para confirmar la entrega.';
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
