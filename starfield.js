(() => {
  const canvas = document.querySelector('.star-field');
  const context = canvas.getContext('2d');
  const main = document.querySelector('main');
  const stars = [];
  const shootingStars = [];
  const layers = [
    { speed: 0.015, scale: 0.2, count: 320 },
    { speed: 0.03, scale: 0.5, count: 50 },
    { speed: 0.05, scale: 0.75, count: 30 }
  ];
  const shootingStarSpeed = { min: 15, max: 20 };
  const shootingStarOpacityDelta = 0.01;
  const trailLengthDelta = 0.01;
  const shootingStarEmittingInterval = 2000;
  const shootingStarLifeTime = 500;
  const maxTrailLength = 300;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let zones = [];
  const starColor = getComputedStyle(document.documentElement).getPropertyValue('--star-color').trim() || '#ffdd9d';
  let animationFrame;
  let shootingStarInterval;

  if (!context || !main) return;

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function degreesToRads(degrees) {
    return degrees / 180 * Math.PI;
  }

  function lineToAngle(x, y, length, radians) {
    return {
      x: x + length * Math.cos(radians),
      y: y + length * Math.sin(radians)
    };
  }

  function createParticle(x, y, speed, direction, zone) {
    return {
      x,
      y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      zone,
      update() {
        this.x += this.vx;
        this.y += this.vy;
      },
      getHeading() {
        return Math.atan2(this.vy, this.vx);
      }
    };
  }

  function createStars() {
    stars.length = 0;

    for (const layer of layers) {
      for (const zone of zones) {
        const count = Math.round(layer.count * zone.width / width);
        const direction = degreesToRads(zone.side === 'left' ? 35 : 145);

        for (let i = 0; i < count; i += 1) {
          const star = createParticle(randomRange(zone.left, zone.right), randomRange(0, height), layer.speed, direction, zone);
          star.radius = 2 * layer.scale;
          stars.push(star);
        }
      }
    }
  }

  function createShootingStar() {
    const totalZoneWidth = zones.reduce((total, zone) => total + zone.width, 0);
    if (!totalZoneWidth) return;

    let zonePosition = randomRange(0, totalZoneWidth);
    const zone = zones.find(item => {
      zonePosition -= item.width;
      return zonePosition < 0;
    });
    const isLeft = zone.side === 'left';
    const direction = degreesToRads(isLeft ? 80 : 100);
    const startX = isLeft
      ? randomRange(zone.left, zone.left + zone.width * 0.2)
      : randomRange(zone.right - zone.width * 0.2, zone.right);
    const shootingStar = createParticle(startX, randomRange(0, height / 2), randomRange(shootingStarSpeed.min, shootingStarSpeed.max), direction, zone);

    shootingStar.opacity = 0;
    shootingStar.trailLengthDelta = 0;
    shootingStar.isSpawning = true;
    shootingStar.isDying = false;
    shootingStar.isDead = false;
    shootingStars.push(shootingStar);
  }

  function killShootingStar(shootingStar) {
    shootingStar.deathTimer = window.setTimeout(() => {
      shootingStar.isDying = true;
    }, shootingStarLifeTime);
  }

  function wrapParticle(particle) {
    if (particle.x > particle.zone.right) particle.x = particle.zone.left;
    if (particle.x < particle.zone.left) particle.x = particle.zone.right;
    if (particle.y > height) particle.y = 0;
    if (particle.y < 0) particle.y = height;
  }

  function drawStar(star) {
    context.fillStyle = starColor;
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
    context.fill();
  }

  function drawShootingStar(shootingStar) {
    const x = shootingStar.x;
    const y = shootingStar.y;
    const currentTrailLength = maxTrailLength * shootingStar.trailLengthDelta;
    const position = lineToAngle(x, y, -currentTrailLength, shootingStar.getHeading());
    const starLength = 5;

    context.globalAlpha = shootingStar.opacity;
    context.fillStyle = starColor;
    context.beginPath();
    context.moveTo(x - 1, y + 1);
    context.lineTo(x, y + starLength);
    context.lineTo(x + 1, y + 1);
    context.lineTo(x + starLength, y);
    context.lineTo(x + 1, y - 1);
    context.lineTo(x, y + 1);
    context.lineTo(x, y - starLength);
    context.lineTo(x - 1, y - 1);
    context.lineTo(x - starLength, y);
    context.lineTo(x - 1, y + 1);
    context.lineTo(x - starLength, y);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(x - 1, y - 1);
    context.lineTo(position.x, position.y);
    context.lineTo(x + 1, y + 1);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
  }

  function updateShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i -= 1) {
      const shootingStar = shootingStars[i];

      if (shootingStar.isSpawning) {
        shootingStar.opacity += shootingStarOpacityDelta;
        if (shootingStar.opacity >= 1) {
          shootingStar.opacity = 1;
          shootingStar.isSpawning = false;
          killShootingStar(shootingStar);
        }
      }

      if (shootingStar.isDying) {
        shootingStar.opacity -= shootingStarOpacityDelta;
        if (shootingStar.opacity <= 0) shootingStar.isDead = true;
      }

      shootingStar.trailLengthDelta += trailLengthDelta;
      shootingStar.update();
      if (shootingStar.opacity > 0) drawShootingStar(shootingStar);

      if (shootingStar.x < shootingStar.zone.left || shootingStar.x > shootingStar.zone.right || shootingStar.y > height || shootingStar.isDead) {
        window.clearTimeout(shootingStar.deathTimer);
        shootingStars.splice(i, 1);
      }
    }
  }

  function render(animate) {
    if (document.hidden) return;

    context.clearRect(0, 0, width, height);

    for (const star of stars) {
      if (animate) {
        star.update();
        wrapParticle(star);
      }
      drawStar(star);
    }

    if (animate) {
      updateShootingStars();
      animationFrame = window.requestAnimationFrame(() => render(true));
    }
  }

  function stopAnimation() {
    if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
    if (shootingStarInterval !== undefined) window.clearInterval(shootingStarInterval);
    animationFrame = undefined;
    shootingStarInterval = undefined;
  }

  function startAnimation() {
    stopAnimation();
    if (document.hidden) return;

    const animate = !reducedMotion.matches && zones.length > 0;
    render(animate);

    if (animate) shootingStarInterval = window.setInterval(createShootingStar, shootingStarEmittingInterval);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const bounds = main.getBoundingClientRect();
    const leftEdge = Math.max(0, Math.min(width, bounds.left));
    const rightEdge = Math.max(0, Math.min(width, bounds.right));
    zones = [
      { left: 0, right: leftEdge, side: 'left' },
      { left: rightEdge, right: width, side: 'right' }
    ].filter(zone => zone.right > zone.left).map(zone => ({ ...zone, width: zone.right - zone.left }));

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    shootingStars.forEach(shootingStar => window.clearTimeout(shootingStar.deathTimer));
    shootingStars.length = 0;
    createStars();
    startAnimation();
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', startAnimation);
  reducedMotion.addEventListener('change', startAnimation);
  resize();
})();
