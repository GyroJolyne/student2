/* 左右对照滑块：拖动分割线比较「原图 / 调整后」。
   纯 DOM 实现，--p 变量同时驱动 clip-path 与分割线位置。
   除了首屏的 [data-compare]，工作流详情弹层会动态造新滑块，
   所以把单实例初始化挂到 window.setupCompare 供外部复用。 */
(() => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function setup(root) {
    if (!root || root.dataset.compareReady) return;
    root.dataset.compareReady = "1";

    const initial = parseFloat(root.style.getPropertyValue("--p")) || 56;
    let dragging = false;

    const setPct = (pct) => {
      const value = clamp(pct, 0, 100);
      root.style.setProperty("--p", `${value.toFixed(2)}%`);
      root.setAttribute("aria-valuenow", String(Math.round(value)));
    };

    const percentAt = (event) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width) return 50;
      return ((event.clientX - rect.left) / rect.width) * 100;
    };

    root.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      dragging = true;
      try { root.setPointerCapture(event.pointerId); } catch (error) { /* noop */ }
      setPct(percentAt(event));
    });
    root.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      setPct(percentAt(event));
    });
    const release = () => { dragging = false; };
    root.addEventListener("pointerup", release);
    root.addEventListener("pointercancel", release);
    root.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      dragging = false;
    });

    root.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 10 : 2;
      const now = parseFloat(root.getAttribute("aria-valuenow")) || initial;
      if (event.key === "ArrowLeft") { event.preventDefault(); event.stopPropagation(); setPct(now - step); }
      else if (event.key === "ArrowRight") { event.preventDefault(); event.stopPropagation(); setPct(now + step); }
      else if (event.key === "Home") { event.preventDefault(); event.stopPropagation(); setPct(0); }
      else if (event.key === "End") { event.preventDefault(); event.stopPropagation(); setPct(100); }
    });

    setPct(initial);
  }

  window.setupCompare = setup;
  document.querySelectorAll("[data-compare]").forEach(setup);
})();
