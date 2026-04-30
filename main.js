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
const megaRoot = document.querySelector('[data-mega-root]');
const megaTriggers = document.querySelectorAll('[data-mega-trigger]');
const megaPanels = document.querySelectorAll('[data-mega-panel]');
const keyedLogos = document.querySelectorAll('img[data-alpha-key]');
const contactSubmitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer = null;
let lastFocusedElement = null;
let activeCategory = 'all';
let activePeriod = 'all';
let parallaxRaf = null;
let activeMega = null;

const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

const cleanLogoBackground = (image) => {
  if (!image || image.dataset.alphaApplied === 'true') {
    return;
  }

  const mode = image.dataset.alphaKey || 'dark';
  const source = image.currentSrc || image.src;
  if (!source || source.startsWith('data:')) {
    return;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return;
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) {
    return;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const range = max - min;
    const isGray = range < 20;

    if (mode === 'black') {
      if (max < 62 || (isGray && max < 78)) {
        pixels[index + 3] = 0;
      }
      continue;
    }

    if (mode === 'checker') {
      if (isGray && max > 86 && max < 232) {
        pixels[index + 3] = 0;
      }
      continue;
    }

    if ((max < 40 && isGray) || (max < 58 && green < 70 && blue < 80)) {
      pixels[index + 3] = 0;
    }
  }

  context.putImageData(frame, 0, 0);
  image.src = canvas.toDataURL('image/png');
  image.dataset.alphaApplied = 'true';
};

const applyLogoCleanup = () => {
  keyedLogos.forEach((image) => {
    if (image.complete) {
      cleanLogoBackground(image);
      return;
    }

    image.addEventListener('load', () => cleanLogoBackground(image), { once: true });
  });
};

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

const closeMegaMenu = () => {
  if (!megaRoot) {
    return;
  }

  megaRoot.classList.remove('is-open');
  megaRoot.setAttribute('aria-hidden', 'true');
  megaTriggers.forEach((trigger) => trigger.classList.remove('is-open'));
  megaPanels.forEach((panel) => panel.classList.remove('is-open'));
  activeMega = null;
};

const openMegaMenu = (target) => {
  if (!megaRoot || !target) {
    return;
  }

  megaRoot.classList.add('is-open');
  megaRoot.setAttribute('aria-hidden', 'false');
  megaTriggers.forEach((trigger) => trigger.classList.toggle('is-open', trigger.dataset.megaTrigger === target));
  megaPanels.forEach((panel) => panel.classList.toggle('is-open', panel.dataset.megaPanel === target));
  activeMega = target;
};

openButtons.forEach((btn) => btn.addEventListener('click', openModal));
closeButtons.forEach((btn) => btn.addEventListener('click', closeModal));

megaTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const target = trigger.dataset.megaTrigger;
    if (!target) {
      return;
    }

    if (activeMega === target) {
      closeMegaMenu();
      return;
    }

    openMegaMenu(target);
  });
});

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
  if (event.key === 'Escape') {
    closeMegaMenu();
  }

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

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!target) {
    return;
  }

  const insideMega = target.closest('[data-mega-root]');
  const insideTrigger = target.closest('[data-mega-trigger]');
  if (!insideMega && !insideTrigger) {
    closeMegaMenu();
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

const applyScrollDepth = () => {
  document.documentElement.style.setProperty('--scroll-depth', `${window.scrollY}px`);
};

const handleScrollEffects = () => {
  if (parallaxRaf) {
    return;
  }

  parallaxRaf = window.requestAnimationFrame(() => {
    updateScrollProgress();
    if (!prefersReducedMotion) {
      applyScrollDepth();
    }
    parallaxRaf = null;
  });
};

applyLogoCleanup();

window.addEventListener('scroll', handleScrollEffects, { passive: true });
handleScrollEffects();
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
