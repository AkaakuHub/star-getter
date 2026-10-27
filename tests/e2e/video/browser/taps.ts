export function installTapOverlay(): void {
  window.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      .e2e-video-tap {
        position: fixed; z-index: 2147483647; pointer-events: none;
        width: 40px; height: 40px; border: 3px solid #ff244e; border-radius: 50%;
        background: #ff244e35; box-shadow: 0 0 0 2px #fff, 0 2px 8px #0007;
      }
      .e2e-video-label {
        position: fixed; z-index: 2147483647; pointer-events: none;
        padding: 4px 8px; border-radius: 6px; color: white; background: #172236ed;
        font: 700 13px sans-serif; white-space: nowrap;
      }
    `;
    document.head.append(style);
    let taps = 0;
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button !== 0) return;
        taps++;
        const dot = document.createElement('span');
        dot.className = 'e2e-video-tap';
        dot.style.left = event.clientX + 'px';
        dot.style.top = event.clientY + 'px';
        const label = document.createElement('span');
        label.className = 'e2e-video-label';
        label.textContent = taps + ' ' + window.e2eVideoTapLabel;
        label.style.left = Math.max(4, Math.min(innerWidth - 160, event.clientX - 20)) + 'px';
        label.style.top = Math.max(8, event.clientY - 48) + 'px';
        document.body.append(dot, label);
        dot.animate(
          [
            { transform: 'translate(-50%, -50%) scale(.55)', opacity: 1 },
            { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 0 },
          ],
          { duration: 300, fill: 'forwards' },
        );
        label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' });
        setTimeout(() => {
          dot.remove();
          label.remove();
        }, 450);
      },
      true,
    );
  });
}
