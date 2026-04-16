const modal = document.querySelector('[data-modal]');
const modalContent = document.querySelector('[data-modal-content]');
const openButtons = document.querySelectorAll('[data-open="modal"]');
const closeButtons = document.querySelectorAll('[data-close="modal"]');
const chips = document.querySelectorAll('[data-filter]');
const periodChips = document.querySelectorAll('[data-period]');
const scrollTargets = document.querySelectorAll('[data-scroll-target]');
const contactForm = document.querySelector('[data-contact]');
const toast = document.querySelector('[data-toast]');
const emptyState = document.querySelector('[data-filter-empty]');
const navLinks = document.querySelectorAll('.nav__link');
const sections = document.querySelectorAll('main section[id]');
const revealNodes = document.querySelectorAll('[data-reveal]');
const projects = document.querySelectorAll('[data-project]');
const bookTriggers = document.querySelectorAll('[data-book-trigger]');
const bookPanels = document.querySelectorAll('[data-book-panel]');
const copyEmailButtons = document.querySelectorAll('[data-copy-email]');
const scrollProgressBar = document.querySelector('[data-scroll-progress]');
const contactSubmitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer = null;
let lastFocusedElement = null;
let activeCategory = 'all';
let activePeriod = 'all';

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
  }, 2200);
};

const setContactSubmitting = (isSubmitting) => {
  if (!contactSubmitButton) {
    return;
  }

  contactSubmitButton.disabled = isSubmitting;
  contactSubmitButton.textContent = isSubmitting ? 'Enviando...' : 'Enviar';
};

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

    if (!response.ok) {
      throw new Error('Respuesta no valida del servidor');
    }

    return true;
  } catch (_error) {
    return false;
  }
};

const sendContactByMailto = ({ nombre, email, idea }) => {
  const subject = encodeURIComponent(`Nuevo contacto portfolio - ${nombre || 'Sin nombre'}`);
  const body = encodeURIComponent(`Nombre: ${nombre}\nEmail: ${email}\n\nIdea:\n${idea}`);
  window.location.href = `mailto:notlikeiusedto@gmail.com?subject=${subject}&body=${body}`;
};

const applyProjectFilters = () => {
  let visibleCount = 0;

  projects.forEach((card) => {
    const categoryMatch = activeCategory === 'all' || card.dataset.project === activeCategory;
    const periodMatch = activePeriod === 'all' || card.dataset.year === activePeriod;
    const isVisible = categoryMatch && periodMatch;

    card.classList.toggle('is-hidden', !isVisible);
    if (isVisible) {
      visibleCount += 1;
    }
  });

  if (emptyState) {
    emptyState.classList.toggle('is-hidden', visibleCount > 0);
  }
};

const getModalFocusable = () => {
  if (!modalContent) {
    return [];
  }

  return Array.from(
    modalContent.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
};

const openModal = () => {
  if (modal) {
    lastFocusedElement = document.activeElement;
    document.body.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');

    const focusable = getModalFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }
};

const closeModal = () => {
  if (modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }
};

openButtons.forEach((btn) => btn.addEventListener('click', openModal));
closeButtons.forEach((btn) => btn.addEventListener('click', closeModal));

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    activeCategory = chip.dataset.filter || 'all';
    chips.forEach((item) => item.classList.remove('is-active'));
    chip.classList.add('is-active');
    applyProjectFilters();
  });
});

periodChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    activePeriod = chip.dataset.period || 'all';
    periodChips.forEach((item) => item.classList.remove('is-active'));
    chip.classList.add('is-active');
    applyProjectFilters();
  });
});

bookTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const target = trigger.dataset.bookTrigger;
    bookTriggers.forEach((item) => {
      const isCurrent = item === trigger;
      item.classList.toggle('is-active', isCurrent);
      item.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    bookPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.bookPanel === target);
    });
  });
});

copyEmailButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const value = button.dataset.copyEmail || '';
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      showToast('Email copiado');
    } catch (_error) {
      showToast('No se pudo copiar el email', 'error');
    }
  });
});

scrollTargets.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.scrollTarget;
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }
  });
});

navLinks.forEach((link) => {
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
  });
});

window.addEventListener('keydown', (event) => {
  if ((event.key === 'k' || event.key === 'K') && !modal?.classList.contains('is-open')) {
    const target = event.target;
    const isTypingTarget = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
    if (!isTypingTarget) {
      event.preventDefault();
      openModal();
    }
  }

  if (!modal || !modal.classList.contains('is-open')) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusable = getModalFocusable();
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          link.classList.toggle('is-active', href === `#${entry.target.id}`);
        });
      });
    },
    { threshold: 0.55 }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
}

const updateScrollProgress = () => {
  if (!scrollProgressBar) {
    return;
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) {
    scrollProgressBar.style.width = '0%';
    return;
  }

  const progress = Math.min((window.scrollY / maxScroll) * 100, 100);
  scrollProgressBar.style.width = `${progress}%`;
};

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();
applyProjectFilters();

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
      showToast('Completa los campos requeridos', 'error');
      return;
    }

    const botField = contactForm.querySelector('input[name="website"]');
    if (botField && botField.value.trim() !== '') {
      showToast('No se pudo enviar el formulario', 'error');
      return;
    }

    const nameField = contactForm.querySelector('input[name="nombre"]');
    const emailField = contactForm.querySelector('input[name="email"]');
    const ideaField = contactForm.querySelector('textarea[name="idea"]');

    const payload = {
      nombre: nameField ? nameField.value.trim() : '',
      email: emailField ? emailField.value.trim() : '',
      idea: ideaField ? ideaField.value.trim() : ''
    };

    if (!isValidContactPayload(payload)) {
      showToast('Revisa el formato de los campos', 'error');
      return;
    }

    setContactSubmitting(true);
    const deliveredByApi = await sendContactToApi(payload);
    setContactSubmitting(false);

    if (deliveredByApi) {
      contactForm.reset();
      showToast('Mensaje enviado al backend');
      return;
    }

    sendContactByMailto(payload);
    contactForm.reset();
    showToast('No hay backend configurado: se abrio tu cliente de correo');
  });
}
