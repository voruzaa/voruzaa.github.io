const nav = document.querySelector('.floating-nav');
const indicator = nav.querySelector('.nav-indicator');
const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
const sections = links.map(link => document.querySelector(link.getAttribute('href')));
const typewriterText = document.querySelector('.typewriter-text');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle.querySelector('img');

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isLight = theme === 'light';
  themeIcon.src = isLight ? 'assets/sun-outline.svg' : 'assets/moon-outline.svg';
  const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';
  themeToggle.setAttribute('aria-label', label);
  themeToggle.title = label;
}

try {
  setTheme(localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
} catch {
  setTheme('dark');
}

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(nextTheme);
  try {
    localStorage.setItem('theme', nextTheme);
  } catch {
  }
});
let activeLink;
let ticking = false;

function updateNavigation() {
  const referencePoint = Math.min(101, window.innerHeight / 2);
  let index = sections.findIndex(section => {
    const rect = section.getBoundingClientRect();
    return rect.top <= referencePoint && rect.bottom > referencePoint;
  });

  if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
    index = sections.length - 1;
  }
  if (index === -1) index = 0;
  const link = links[index];
  const changed = activeLink !== link;

  if (changed) {
    links.forEach(item => item.removeAttribute('aria-current'));
    link.setAttribute('aria-current', 'location');
    activeLink = link;
    typewriterText.classList.toggle('is-typing', sections[index].id === 'home');
  }

  indicator.style.width = `${link.offsetWidth}px`;
  indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  nav.classList.add('nav-ready');

  if (changed && (link.offsetLeft < nav.scrollLeft || link.offsetLeft + link.offsetWidth > nav.scrollLeft + nav.clientWidth)) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nav.scrollTo({ left: link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2, behavior: reducedMotion ? 'instant' : 'smooth' });
  }
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateNavigation();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
window.addEventListener('resize', updateNavigation);
document.fonts.ready.then(updateNavigation);
updateNavigation();
