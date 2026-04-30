const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const scrollLinks = document.querySelectorAll('a[href^="#"]');
const scrollSections = document.querySelectorAll('main section[id]');
const contactForm = document.querySelector('[data-contact]');
const toast = document.querySelector('[data-toast]');
const heroContent = document.querySelector('.hero__content');

let toastTimer = null;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

const showToast = (message, type = 'success') => {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.toggle('is-error', type === 'error');
  toast.classList.add('is-visible');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.classList.remove('is-error');
  }, 2400);
};

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

const syncHeaderState = () => {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }

  header.classList.toggle('is-scrolled', window.scrollY > 16);
};

syncHeaderState();
window.addEventListener('scroll', syncHeaderState, { passive: true });

if (heroContent) {
  requestAnimationFrame(() => {
    heroContent.classList.add('is-ready');
  });
}

scrollLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) {
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });

    if (nav && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        scrollLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (!href || !href.startsWith('#')) {
            return;
          }
          link.classList.toggle('is-active', href === `#${entry.target.id}`);
        });
      });
    },
    { threshold: 0.52 }
  );

  scrollSections.forEach((section) => observer.observe(section));
}

if (contactForm) {
  const firstInput = contactForm.querySelector('input[name="nombre"]');
  const section = document.querySelector('#contact');
  if (firstInput && section) {
    section.addEventListener('click', (event) => {
      if (event.target.closest('.contact-form')) {
        return;
      }
      firstInput.focus();
    });
  }
}

const isValidContactPayload = ({ nombre, email, idea }) => {
  if (!nombre || !email || !idea) {
    return false;
  }
  if (nombre.length > 120 || email.length > 160 || idea.length > 1600) {
    return false;
  }
  return true;
};

const sendContactToApi = async (payload) => {
  if (!contactForm) {
    return false;
  }

  const apiUrl = (contactForm.dataset.apiUrl || '').trim();
  if (!apiUrl) {
    return false;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (_error) {
    return false;
  }
};

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fields = Array.from(contactForm.querySelectorAll('.input:not(.input--hp)'));
    fields.forEach((field) => field.classList.remove('is-invalid'));

    let hasError = false;
    fields.forEach((field) => {
      if (!field.checkValidity()) {
        field.classList.add('is-invalid');
        hasError = true;
      }
    });

    if (hasError) {
      showToast('Completa los campos obligatorios', 'error');
      return;
    }

    const botField = contactForm.querySelector('input[name="website"]');
    if (botField && botField.value.trim() !== '') {
      showToast('Envio bloqueado', 'error');
      return;
    }

    const payload = {
      nombre: (contactForm.querySelector('input[name="nombre"]')?.value || '').trim(),
      email: (contactForm.querySelector('input[name="email"]')?.value || '').trim(),
      idea: (contactForm.querySelector('textarea[name="idea"]')?.value || '').trim()
    };

    if (!isValidContactPayload(payload)) {
      showToast('Revisa el formato de los campos', 'error');
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
    }

    const deliveredByApi = await sendContactToApi(payload);

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar mensaje';
    }

    if (deliveredByApi) {
      contactForm.reset();
      showToast('Mensaje recibido.');
      return;
    }

    const subject = encodeURIComponent(`New portfolio contact - ${payload.nombre}`);
    const body = encodeURIComponent(`Name: ${payload.nombre}\nEmail: ${payload.email}\n\nMessage:\n${payload.idea}`);
    window.location.href = `mailto:tiggreee@vmdev.lat?subject=${subject}&body=${body}`;
    contactForm.reset();
    showToast('Se abrio tu app de correo.');
  });
}
