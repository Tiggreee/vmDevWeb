const modal = document.querySelector('[data-modal]');
const openButtons = document.querySelectorAll('[data-open="modal"]');
const closeButtons = document.querySelectorAll('[data-close="modal"]');
const chips = document.querySelectorAll('[data-filter]');
const strip = document.querySelector('[data-strip]');
const scrollButtons = document.querySelectorAll('[data-scroll]');
const scrollTargets = document.querySelectorAll('[data-scroll-target]');
const contactForm = document.querySelector('[data-contact]');
const toast = document.querySelector('[data-toast]');
const heroVisual = document.querySelector('.hero__visual');

const rail = document.querySelector('[data-rail]');
const railSections = document.querySelectorAll('.rail__section');
const navLinks = document.querySelectorAll('.nav__link');
const navOrder = Array.from(navLinks)
  .map((link) => link.getAttribute('href'))
  .filter((href) => href && href.startsWith('#'))
  .map((href) => href.slice(1));
let railLock = false;
let sectionOffsets = [];

const updateSectionOffsets = () => {
  sectionOffsets = navOrder
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .map((section) => section.offsetLeft);
};

const scrollToSection = (id) => {
  if (!rail) {
    return;
  }
  const target = document.getElementById(id);
  if (!target) {
    return;
  }
  rail.scrollTo({ left: target.offsetLeft, behavior: 'auto' });
};

const scrollToIndex = (index) => {
  if (!rail || sectionOffsets.length === 0) {
    return;
  }
  const clamped = Math.max(0, Math.min(index, sectionOffsets.length - 1));
  rail.scrollTo({ left: sectionOffsets[clamped], behavior: 'auto' });
};

const openModal = () => {
  modal.classList.add('is-open');
};

const closeModal = () => {
  modal.classList.remove('is-open');
};

openButtons.forEach((btn) => btn.addEventListener('click', openModal));
closeButtons.forEach((btn) => btn.addEventListener('click', closeModal));

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.remove('is-active'));
    chip.classList.add('is-active');
    const filter = chip.dataset.filter;
    document.querySelectorAll('[data-project]').forEach((card) => {
      const match = filter === 'all' || card.dataset.project === filter;
      card.style.display = match ? '' : 'none';
    });
  });
});

scrollButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!strip) {
      return;
    }
    const direction = btn.dataset.scroll === 'left' ? -1 : 1;
    strip.scrollBy({ left: direction * 260, behavior: 'auto' });
  });
});

scrollTargets.forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.scrollTarget;
    scrollToSection(id);
  });
});

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) {
      return;
    }
    event.preventDefault();
    scrollToSection(hash.slice(1));
  });
});

const handleRailWheel = (event) => {
  if (!rail) {
    return;
  }
  if (event.target.closest('input, textarea, select')) {
    return;
  }
  if (railLock) {
    event.preventDefault();
    return;
  }
  const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (!delta) {
    return;
  }
  event.preventDefault();
  const current = rail.scrollLeft;
  let index = 0;
  let minDiff = Infinity;
  sectionOffsets.forEach((offset, i) => {
    const diff = Math.abs(current - offset);
    if (diff < minDiff) {
      minDiff = diff;
      index = i;
    }
  });
  const direction = delta > 0 ? 1 : -1;
  railLock = true;
  scrollToIndex(index + direction);
  setTimeout(() => {
    railLock = false;
  }, 450);
};

if (rail) {
  updateSectionOffsets();
  window.addEventListener('load', updateSectionOffsets);
  window.addEventListener('wheel', handleRailWheel, { passive: false });
  window.addEventListener('resize', updateSectionOffsets);
}

if (rail && railSections.length > 0 && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-active', entry.isIntersecting);
      });
    },
    { root: rail, threshold: 0.6 }
  );

  railSections.forEach((section) => observer.observe(section));
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
    }, 2000);
  });
}

if (heroVisual) {
  heroVisual.addEventListener('mousemove', (event) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroVisual.style.transform = `translate3d(${x * 10}px, ${y * 10}px, 0)`;
  });

  heroVisual.addEventListener('mouseleave', () => {
    heroVisual.style.transform = 'translate3d(0, 0, 0)';
  });
}

const cursorDot = document.querySelector('.cursor:not(.cursor--ring)');
const cursorRing = document.querySelector('.cursor--ring');
const spotlight = document.querySelector('.spotlight');

if (cursorDot && cursorRing && spotlight) {
  let ringX = 0;
  let ringY = 0;
  let dotX = 0;
  let dotY = 0;

  document.addEventListener('mousemove', (e) => {
    dotX = e.clientX;
    dotY = e.clientY;
    spotlight.style.setProperty('--mx', `${e.clientX}px`);
    spotlight.style.setProperty('--my', `${e.clientY}px`);
  });

  const animateCursor = () => {
    ringX += (dotX - ringX) * 0.12;
    ringY += (dotY - ringY) * 0.12;
    cursorDot.style.left = `${dotX}px`;
    cursorDot.style.top = `${dotY}px`;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
  };

  animateCursor();

  document.querySelectorAll('a, button, [data-filter]').forEach((el) => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('cursor--expanded'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('cursor--expanded'));
  });
}
