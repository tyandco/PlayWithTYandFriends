onload = function () {
  const width = 250;
  const height = 250;
  const gap = 500; // space between the two windows
  const margin = 20; // margin from bottom edge

  const screenW = window.screen.availWidth || window.innerWidth;
  const screenH = window.screen.availHeight || window.innerHeight;

  const top = Math.max(0, screenH - height - margin);
  const centerX = Math.max(0, Math.floor(screenW / 2));

  const leftX = Math.max(0, Math.floor(centerX - gap / 2 - width));
  const rightX = Math.max(0, Math.floor(centerX + gap / 2));

  const features = `width=${width},height=${height},left=${rightX},top=${top},resizable=no,menubar=no,toolbar=no,location=no,status=no,scrollbars=no`;
  const rightWin = window.open(
    `righthand.htm?homeX=${rightX}&homeY=${top}`,
    "right",
    features
  );

  const leftWin = window.open(
    `lefthand.htm?homeX=${leftX}&homeY=${top}`,
    "left",
    features.replace(`left=${rightX}`, `left=${leftX}`)
  );

  try {
    rightWin && rightWin.focus();
    leftWin && leftWin.focus();
  } catch (e) {
    // focusing may be blocked; ignore
  }

  // Fallback: lock size even if browser ignores resizable=no
  const lockSize = (win) => {
    if (!win) return;
    try {
      win.resizeTo(width, height);
      win.onresize = () => {
        try { win.resizeTo(width, height); } catch (_) { /* ignore */ }
      };
    } catch (_) {
      // Some browsers may block programmatic resize; ignore
    }
  };

  lockSize(rightWin);
  lockSize(leftWin);
};
