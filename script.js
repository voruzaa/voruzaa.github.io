const nav = document.querySelector('.floating-nav');
const indicator = nav.querySelector('.nav-indicator');
const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
const sections = links.map(link => document.querySelector(link.getAttribute('href')));
const typewriterText = document.querySelector('.typewriter-text');
let activeLink;
let ticking = false;

function updateNavigation() {
  const midpoint = window.innerHeight / 2;
  let index = sections.findIndex(section => {
    const rect = section.getBoundingClientRect();
    return rect.top <= midpoint && rect.bottom > midpoint;
  });

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
