import React, { useEffect, useRef } from 'react';

export default function NeuralCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates for subtle, low-intensity white hover spotlight
    const targetMouse = { x: -1000, y: -1000 };
    const smoothMouse = { x: -1000, y: -1000 };
    let lastMousePos = { x: -1000, y: -1000 };
    const ripples = [];
    const sparks = [];

    const handleMouseMove = (e) => {
      targetMouse.x = e.clientX;
      targetMouse.y = e.clientY;

      if (smoothMouse.x < -500) {
        smoothMouse.x = e.clientX;
        smoothMouse.y = e.clientY;
      }

      // Calculate cursor speed/movement
      const dist = Math.hypot(e.clientX - lastMousePos.x, e.clientY - lastMousePos.y);
      if (dist > 8) {
        lastMousePos = { x: e.clientX, y: e.clientY };

        // Subtle, low-intensity pure white micro-sparks
        const sparkCount = Math.min(2, Math.floor(dist / 16) + 1);
        for (let i = 0; i < sparkCount; i++) {
          sparks.push({
            x: e.clientX + (Math.random() - 0.5) * 10,
            y: e.clientY + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 0.9,
            vy: (Math.random() - 0.5) * 0.9 - 0.15,
            radius: Math.random() * 1.5 + 0.8,
            alpha: 0.32,
            color: '255, 255, 255'
          });
        }
      }

      // Update CSS variables for subtle card reflection
      document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    };

    const handleMouseLeave = () => {
      targetMouse.x = -1000;
      targetMouse.y = -1000;
    };

    const handleClick = (e) => {
      // Gentle, low-intensity expanding white ripple
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: 220,
        alpha: 0.28,
        colorWhite: '255, 255, 255'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Muted background particle pool
    const particleCount = Math.min(50, Math.floor((width * height) / 26000));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.6 + 0.9,
        baseAlpha: Math.random() * 0.2 + 0.12
      });
    }

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Smoothly interpolate cursor position
      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.18;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.18;

      // ----------------------------------------------------
      // 0. RITEFLOW ETHEREAL VIOLET & INDIGO AMBIENT NEBULAS
      // ----------------------------------------------------
      ctx.save();
      // Hero ambient purple crown glow
      const heroNebula = ctx.createRadialGradient(
        width * 0.5, Math.min(height * 0.22, 260), 0,
        width * 0.5, Math.min(height * 0.22, 260), Math.min(width * 0.65, 700)
      );
      heroNebula.addColorStop(0, 'rgba(124, 58, 237, 0.25)');
      heroNebula.addColorStop(0.35, 'rgba(99, 102, 241, 0.14)');
      heroNebula.addColorStop(0.70, 'rgba(139, 92, 246, 0.04)');
      heroNebula.addColorStop(1, 'rgba(7, 7, 20, 0)');
      ctx.fillStyle = heroNebula;
      ctx.fillRect(0, 0, width, height);

      // Mid-page subtle purple glow behind dashboard
      const dashNebula = ctx.createRadialGradient(
        width * 0.5, height * 0.55, 0,
        width * 0.5, height * 0.55, Math.min(width * 0.55, 580)
      );
      dashNebula.addColorStop(0, 'rgba(109, 40, 217, 0.16)');
      dashNebula.addColorStop(0.45, 'rgba(99, 102, 241, 0.06)');
      dashNebula.addColorStop(1, 'rgba(7, 7, 20, 0)');
      ctx.fillStyle = dashNebula;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // ----------------------------------------------------
      // 1. SUBTLE, LOW-INTENSITY WHITE CURSOR HOVER SPOTLIGHT
      // ----------------------------------------------------
      if (smoothMouse.x > -500) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const cursorSpotlightRadius = 200;
        const cursorGrad = ctx.createRadialGradient(
          smoothMouse.x, smoothMouse.y, 0,
          smoothMouse.x, smoothMouse.y, cursorSpotlightRadius
        );

        // Low-intensity soft white glow
        cursorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        cursorGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.03)');
        cursorGrad.addColorStop(0.70, 'rgba(255, 255, 255, 0.008)');
        cursorGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = cursorGrad;
        ctx.beginPath();
        ctx.arc(smoothMouse.x, smoothMouse.y, cursorSpotlightRadius, 0, Math.PI * 2);
        ctx.fill();

        // Delicate inner core
        const innerGlow = ctx.createRadialGradient(
          smoothMouse.x, smoothMouse.y, 0,
          smoothMouse.x, smoothMouse.y, 28
        );
        innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(smoothMouse.x, smoothMouse.y, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ----------------------------------------------------
      // 2. CURSOR MOTION SPARKS (LOW-INTENSITY WHITE)
      // ----------------------------------------------------
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha *= 0.90;
        s.radius *= 0.95;

        if (s.alpha <= 0.015 || s.radius <= 0.3) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color}, ${s.alpha})`;
        ctx.fill();
      }

      // ----------------------------------------------------
      // 3. SUBTLE CLICK RIPPLES (PURE SOFT WHITE)
      // ----------------------------------------------------
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 4.5;
        r.alpha *= 0.94;

        if (r.alpha <= 0.01 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        // Soft White ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.colorWhite}, ${r.alpha * 0.28})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // ----------------------------------------------------
      // 4. NEUTRAL SYNAPTIC PARTICLES (GENTLE WHITE HOVER)
      // ----------------------------------------------------
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = smoothMouse.x - p.x;
        const dy = smoothMouse.y - p.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = 140;

        let extraGlow = 0;
        if (distToMouse < mouseRadius) {
          const force = (1 - distToMouse / mouseRadius) * 1.2;
          p.x += (dx / distToMouse) * force * 0.4;
          p.y += (dy / distToMouse) * force * 0.4;
          extraGlow = (1 - distToMouse / mouseRadius);
        }

        const isNearCursor = extraGlow > 0.05;
        const pulse = Math.sin(tick * 0.03 + i) * 0.25;
        const currentRadius = Math.max(0.7, p.radius + pulse + extraGlow * 0.8);

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);

        if (isNearCursor) {
          // Soft White near cursor with decreased intensity
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.45, 0.12 + extraGlow * 0.28)})`;
        } else {
          // Subtle quiet slate
          ctx.fillStyle = `rgba(161, 161, 170, ${p.baseAlpha})`;
        }
        ctx.fill();

        // Subtle background links between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distBetween = Math.hypot(p.x - p2.x, p.y - p2.y);
          const maxDist = 110;

          if (distBetween < maxDist) {
            const linkAlpha = (1 - distBetween / maxDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(161, 161, 170, ${linkAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        // Delicate, low-intensity white laser link to cursor when hovered
        if (distToMouse < mouseRadius) {
          const cursorLinkAlpha = (1 - distToMouse / mouseRadius) * 0.12; // low intensity
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(smoothMouse.x, smoothMouse.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${cursorLinkAlpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.92
      }}
    />
  );
}
