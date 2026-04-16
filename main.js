const modal = document.querySelector('[data-modal]');
const openButtons = document.querySelectorAll('[data-open="modal"]');
const closeButtons = document.querySelectorAll('[data-close="modal"]');
const chips = document.querySelectorAll('[data-filter]');
const scrollTargets = document.querySelectorAll('[data-scroll-target]');
const contactForm = document.querySelector('[data-contact]');
const toast = document.querySelector('[data-toast]');
const navLinks = document.querySelectorAll('.nav__link');
const sections = document.querySelectorAll('main .section[id]');

const openModal = () => {
  if (modal) {
    modal.classList.add('is-open');
  }
};

const closeModal = () => {
  if (modal) {
    modal.classList.remove('is-open');
  }
};

openButtons.forEach((btn) => btn.addEventListener('click', openModal));
closeButtons.forEach((btn) => btn.addEventListener('click', closeModal));

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const filter = chip.dataset.filter;
    chips.forEach((item) => item.classList.remove('is-active'));
    chip.classList.add('is-active');

    document.querySelectorAll('[data-project]').forEach((card) => {
      const match = filter === 'all' || card.dataset.project === filter;
      card.classList.toggle('is-hidden', !match);
    });
  });
});

scrollTargets.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.scrollTarget;
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

if (sections.length > 0 && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          const isActive = href === `#${entry.target.id}`;
          link.classList.toggle('is-active', isActive);
        });
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((section) => observer.observe(section));
}

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    contactForm.reset();
    if (!toast) {
      return;
    }
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1800);
  });
}
