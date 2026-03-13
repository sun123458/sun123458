/* ============================================
   AR 虚拟展厅 - 主页逻辑
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // Particle System for Hero
  // ============================================
  function createParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const count = 30;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 6 + 's';
      particle.style.animationDuration = (4 + Math.random() * 4) + 's';
      particle.style.width = particle.style.height = (2 + Math.random() * 3) + 'px';
      container.appendChild(particle);
    }
  }

  // ============================================
  // Navbar scroll effect
  // ============================================
  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ============================================
  // Mobile nav toggle
  // ============================================
  function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });

    // Close menu on link click
    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('open');
      });
    });
  }

  // ============================================
  // Scroll Reveal (IntersectionObserver)
  // ============================================
  function initScrollReveal() {
    var elements = document.querySelectorAll('.exhibit-card, .step-card');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      });

      elements.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: show all cards immediately
      elements.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  // ============================================
  // Card interaction glow
  // ============================================
  function initCardEffects() {
    var cards = document.querySelectorAll('.exhibit-card');
    cards.forEach(function (card) {
      var color = card.dataset.color;
      card.addEventListener('mouseenter', function () {
        card.style.boxShadow = '0 8px 48px ' + color + '33';
      });
      card.addEventListener('mouseleave', function () {
        card.style.boxShadow = '';
      });
    });
  }

  // ============================================
  // Smooth scroll for anchor links
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ============================================
  // Initialize
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    createParticles();
    initNavbar();
    initNavToggle();
    initScrollReveal();
    initCardEffects();
    initSmoothScroll();
  });
})();
