/* ═══════════════════════════════════════════
   CF TRACKER — MAIN JS
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. QUICK HANDLE BUTTONS ── */
  document.querySelectorAll('.quick-handle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('handleInput');
      if (input) {
        input.value = btn.dataset.handle;
        input.focus();
        input.style.color = 'var(--accent)';
        setTimeout(() => { input.style.color = ''; }, 400);
      }
    });
  });

  /* ── 2. SEARCH FORM LOADING STATE ── */
  const searchForm = document.getElementById('searchForm');
  const searchBtn  = document.getElementById('searchBtn');
  if (searchForm && searchBtn) {
    searchForm.addEventListener('submit', (e) => {
      const handle = document.getElementById('handleInput').value.trim();
      if (!handle) { e.preventDefault(); return; }
      searchBtn.innerHTML = '<span class="btn-text">LOADING</span><span class="btn-spinner" style="display:inline-block">⟳</span>';
      searchBtn.disabled = true;
      searchBtn.style.opacity = '0.7';
      const spinner = searchBtn.querySelector('.btn-spinner');
      let angle = 0;
      const spinInterval = setInterval(() => {
        angle += 20;
        if (spinner) spinner.style.transform = `rotate(${angle}deg)`;
      }, 50);
    });
  }

  /* ── 3. SCROLL REVEAL ── */
  const revealEls = document.querySelectorAll('.scroll-reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, 60 * i);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ── 4. COUNTER ANIMATION ── */
  function animateCounter(el, target, duration) {
    duration = duration || 1400;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start).toLocaleString();
      }
    }, 16);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, parseInt(el.dataset.target) || 0);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

  /* ── 5. BAR ANIMATIONS (verdict, lang, dist) ── */
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.verdict-bar[data-width]').forEach((bar, i) => {
          setTimeout(() => { bar.style.width = bar.dataset.width; }, i * 80);
        });
        entry.target.querySelectorAll('.lang-bar[data-height]').forEach((bar, i) => {
          setTimeout(() => { bar.style.height = bar.dataset.height; }, i * 100);
        });
        entry.target.querySelectorAll('.dist-bar[data-height]').forEach((bar, i) => {
          setTimeout(() => { bar.style.height = bar.dataset.height; }, i * 100);
        });
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.chart-card, .rating-dist-section').forEach(el => barObserver.observe(el));

  /* ── 6. RATING CHART (vanilla canvas) ── */
  const ratingCanvas = document.getElementById('ratingChart');
  if (ratingCanvas && window.RATING_DATA && window.RATING_DATA.length > 0) {
    drawRatingChart(ratingCanvas, window.RATING_DATA);
    window.addEventListener('resize', () => drawRatingChart(ratingCanvas, window.RATING_DATA));
  }

  function drawRatingChart(canvas, data) {
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const W = parent.clientWidth;
    const H = parent.clientHeight || 220;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 20, bottom: 40, left: 55 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const ratings = data.map(function(d) { return d.rating; });
    const minR = Math.min.apply(null, ratings) - 100;
    const maxR = Math.max.apply(null, ratings) + 100;

    function toX(i) { return pad.left + (i / (data.length - 1)) * chartW; }
    function toY(r) { return pad.top + chartH - ((r - minR) / (maxR - minR)) * chartH; }

    /* Grid */
    ctx.strokeStyle = '#2e2e2e';
    ctx.lineWidth = 1;
    for (var t = 0; t <= 5; t++) {
      var y = pad.top + (t / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      var rLabel = Math.round(maxR - (t / 5) * (maxR - minR));
      ctx.fillStyle = '#555';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(rLabel, pad.left - 8, y + 4);
    }

    /* Gradient fill */
    var grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, 'rgba(0,255,157,0.22)');
    grad.addColorStop(1, 'rgba(0,255,157,0)');
    ctx.beginPath();
    data.forEach(function(d, i) {
      var x = toX(i), y = toY(d.rating);
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.lineTo(toX(data.length - 1), pad.top + chartH);
    ctx.lineTo(toX(0), pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* Line */
    ctx.beginPath();
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    data.forEach(function(d, i) {
      var x = toX(i), y = toY(d.rating);
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.stroke();

    /* Dots */
    var nth = Math.max(1, Math.floor(data.length / 6));
    data.forEach(function(d, i) {
      var x = toX(i), y = toY(d.rating);
      var glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 10);
      glowGrad.addColorStop(0, 'rgba(0,255,157,0.4)');
      glowGrad.addColorStop(1, 'rgba(0,255,157,0)');
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff9d';
      ctx.fill();
      ctx.strokeStyle = '#0e0e0e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (i % nth === 0 || i === data.length - 1) {
        ctx.fillStyle = '#555';
        ctx.font = '9px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.date, x, H - pad.bottom + 16);
      }
    });

    /* Hover tooltip */
    var hoverIdx = -1;
    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var closest = -1, closestDist = 9999;
      data.forEach(function(d, i) {
        var dist = Math.abs(toX(i) - mx);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      if (closestDist < 30 && closest !== hoverIdx) {
        hoverIdx = closest;
        drawTooltip(hoverIdx);
      }
    }
    function onLeave() {
      hoverIdx = -1;
      drawRatingChart(canvas, data);
    }
    canvas.removeEventListener('mousemove', canvas._onMove);
    canvas.removeEventListener('mouseleave', canvas._onLeave);
    canvas._onMove  = onMove;
    canvas._onLeave = onLeave;
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    function drawTooltip(idx) {
      if (idx < 0) return;
      var d = data[idx];
      var x = toX(idx), y = toY(d.rating);
      var bw = 195, bh = 62;
      var bx = Math.min(x + 12, W - bw - 10);
      var by = Math.max(y - 72, 5);
      ctx.fillStyle = '#181818';
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      var contestLabel = (d.contest || 'Contest');
      if (contestLabel.length > 30) contestLabel = contestLabel.substring(0, 28) + '…';

      ctx.textAlign = 'left';
      ctx.fillStyle = '#666';
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillText(contestLabel, bx + 10, by + 17);
      ctx.fillStyle = '#00ff9d';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.fillText('Rating: ' + d.rating, bx + 10, by + 35);
      ctx.fillStyle = '#888';
      ctx.font = '9px "Space Mono", monospace';
      ctx.fillText('Rank: ' + (d.rank || '?'), bx + 10, by + 52);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── 7. NAVBAR SCROLL SHRINK ── */
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.style.padding = '0.6rem 2rem';
        navbar.style.borderBottomColor = '#3e3e3e';
      } else {
        navbar.style.padding = '1rem 2rem';
        navbar.style.borderBottomColor = '#2e2e2e';
      }
    }, { passive: true });
  }

  /* ── 8. PARALLAX on hero accents ── */
  var accents = document.querySelectorAll('.hero-accent');
  if (accents.length) {
    window.addEventListener('scroll', function() {
      var scrollY = window.scrollY;
      accents.forEach(function(el, i) {
        var speed = 0.08 + i * 0.04;
        el.style.transform = 'translateY(' + (scrollY * speed) + 'px)';
      });
    }, { passive: true });
  }

  /* ── 9. NEO-BOX HOVER GLOW ── */
  document.querySelectorAll('.stat-card').forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      card.style.borderColor = 'var(--accent)';
      var num = card.querySelector('.stat-num');
      if (num) num.style.textShadow = '0 0 20px rgba(0,255,157,0.5)';
    });
    card.addEventListener('mouseleave', function() {
      card.style.borderColor = 'var(--border)';
      var num = card.querySelector('.stat-num');
      if (num) num.style.textShadow = '';
    });
  });

  /* ── 10. KEYBOARD SHORTCUT: / → focus search ── */
  document.addEventListener('keydown', function(e) {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      var input = document.getElementById('handleInput');
      if (input) { e.preventDefault(); input.focus(); }
    }
  });

  /* ── 11. SKELETON: show skeleton first, then reveal content ── */
  var profilePage = document.querySelector('.profile-page');
  if (profilePage) {
    profilePage.style.opacity = '0';
    profilePage.style.transition = 'opacity 0.5s ease';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        profilePage.style.opacity = '1';
      });
    });
  }

});
