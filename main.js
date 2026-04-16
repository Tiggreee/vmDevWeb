const modal = document.querySelector('[data-modal]');
const modalContent = document.querySelector('[data-modal-content]');
const openButtons = document.querySelectorAll('[data-open="modal"]');
const closeButtons = document.querySelectorAll('[data-close="modal"]');
const chips = document.querySelectorAll('[data-filter]');
const scrollTargets = document.querySelectorAll('[data-scroll-target]');
const contactForm = document.querySelector('[data-contact]');
const toast = document.querySelector('[data-toast]');
const emptyState = document.querySelector('[data-filter-empty]');
const navLinks = document.querySelectorAll('.nav__link');
const sections = document.querySelectorAll('main section[id]');
const revealNodes = document.querySelectorAll('[data-reveal]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer = null;
let lastFocusedElement = null;

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
    const filter = chip.dataset.filter;
    chips.forEach((item) => item.classList.remove('is-active'));
    chip.classList.add('is-active');

    let visibleCount = 0;

    document.querySelectorAll('[data-project]').forEach((card) => {
      const match = filter === 'all' || card.dataset.project === filter;
      card.classList.toggle('is-hidden', !match);
      if (match) {
        visibleCount += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('is-hidden', visibleCount > 0);
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

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Array.from(contactForm.querySelectorAll('.input'));

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

    const nameField = contactForm.querySelector('input[name="nombre"]');
    const emailField = contactForm.querySelector('input[name="email"]');
    const ideaField = contactForm.querySelector('textarea[name="idea"]');

    const name = nameField ? nameField.value.trim() : '';
    const email = emailField ? emailField.value.trim() : '';
    const idea = ideaField ? ideaField.value.trim() : '';

    const subject = encodeURIComponent(`Nuevo contacto portfolio - ${name || 'Sin nombre'}`);
    const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\nIdea:\n${idea}`);

    window.location.href = `mailto:notlikeiusedto@gmail.com?subject=${subject}&body=${body}`;

    contactForm.reset();
    showToast('Formulario listo para enviar por correo');
  });
}
