/* Drift wall: 透视漂移墙。
   列内容渲染两份，位移量精确等于一份的高度，因此循环无缝；
   相邻列方向相反、速度略有差异；指针移动带来轻微视差，悬停时瓦片朝观者抬升。 */
(() => {
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /**
   * @param {HTMLElement} root 墙容器
   * @param {Array<{src:string,filename:string,index:number}>} items 全部瓦片素材
   * @param {{onOpen?:Function, columns?:number, speed?:number}} options
   */
  function createDriftWall(root, items, options) {
    const opts = options || {};
    const onOpen = opts.onOpen || (() => {});
    const baseSpeed = opts.speed || 42;
    const plane = document.createElement("div");
    plane.className = "drift-wall-plane";
    root.classList.add("drift-wall");
    root.append(plane);

    let lastKey = "";
    let frame = 0;

    const metrics = () => {
      const cs = getComputedStyle(root);
      const tileW = parseFloat(cs.getPropertyValue("--tile-w")) || 200;
      const tileH = parseFloat(cs.getPropertyValue("--tile-h")) || 280;
      const gap = parseFloat(cs.getPropertyValue("--tile-gap")) || 15;
      const colGap = parseFloat(cs.getPropertyValue("--col-gap")) || gap;
      return { tileW, tileH, gap, colGap, pitch: tileH + gap };
    };

    const makeTile = (record, copyIndex) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "drift-tile";
      tile.dataset.index = String(record.index);
      tile.setAttribute("aria-label", `查看作品：${record.filename.replace(/\.[^.]+$/, "")}`);
      if (copyIndex > 0) {
        tile.tabIndex = -1;
        tile.setAttribute("aria-hidden", "true");
      }
      const img = document.createElement("img");
      img.src = record.src;
      img.alt = record.filename.replace(/\.[^.]+$/, "");
      img.loading = record.index < 10 ? "eager" : "lazy";
      img.decoding = "async";
      img.draggable = false;
      const caption = document.createElement("span");
      caption.className = "drift-tile-caption";
      caption.textContent = record.filename.replace(/\.[^.]+$/, "");
      tile.append(img, caption);
      tile.addEventListener("click", () => onOpen(record, tile));
      return tile;
    };

    const buildColumn = (list, colIndex, m, wallHeight) => {
      const count = list.length;
      if (!count) return null;
      // 一份内容要盖住可视高度，否则循环中会露出空白段
      const need = Math.max(wallHeight + m.pitch * 2, m.pitch * 2);
      const repeats = clamp(Math.ceil(need / (count * m.pitch)), 1, 4);
      const seq = [];
      for (let r = 0; r < repeats; r += 1) seq.push(...list);

      const track = document.createElement("div");
      track.className = "drift-track";
      const frag = document.createDocumentFragment();
      for (let copy = 0; copy < 2; copy += 1) {
        seq.forEach((record) => frag.append(makeTile(record, copy)));
      }
      track.append(frag);

      const shift = seq.length * m.pitch;
      const wobble = [0, 0.24, -0.16, 0.32, -0.08, 0.18][colIndex % 6];
      const speed = baseSpeed * (1 + wobble);
      track.style.setProperty("--shift", `${-shift}px`);
      track.style.setProperty("--dur", `${(shift / speed).toFixed(2)}s`);
      track.style.animationDirection = colIndex % 2 === 0 ? "normal" : "reverse";
      // 负延迟错开各列相位，避免瓦片横向连成一条直线
      track.style.animationDelay = `${(-shift / speed) * ((colIndex * 0.31) % 1)}s`;

      const column = document.createElement("div");
      column.className = "drift-column";
      column.append(track);
      return column;
    };

    const render = (force) => {
      if (!items.length) return;
      const m = metrics();
      const wallHeight = root.clientHeight || window.innerHeight;
      const wallWidth = root.clientWidth || window.innerWidth;
      // 列数按视口宽度铺满（略宽于窗口，让两侧瓦片被裁切出血）
      const columns = opts.columns || clamp(Math.round((wallWidth * 1.08) / (m.tileW + m.colGap)), 3, 9);
      const key = `${columns}|${Math.round(wallHeight)}|${Math.round(wallWidth)}|${items.length}`;
      if (!force && key === lastKey) return;
      lastKey = key;

      plane.replaceChildren();
      plane.style.setProperty("--columns", String(columns));
      for (let c = 0; c < columns; c += 1) {
        const list = items.filter((_, i) => i % columns === c);
        const column = buildColumn(list.length ? list : items, c, m, wallHeight);
        if (column) plane.append(column);
      }
    };

    render(true);

    // 指针视差：只写 CSS 变量，不引起布局
    let px = 0;
    let py = 0;
    const applySway = () => {
      frame = 0;
      plane.style.setProperty("--sx", px.toFixed(3));
      plane.style.setProperty("--sy", py.toFixed(3));
    };
    root.addEventListener("pointermove", (event) => {
      if (REDUCED.matches) return;
      const rect = root.getBoundingClientRect();
      px = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      py = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
      if (!frame) frame = requestAnimationFrame(applySway);
    }, { passive: true });
    root.addEventListener("pointerleave", () => {
      px = 0;
      py = 0;
      if (!frame) frame = requestAnimationFrame(applySway);
    }, { passive: true });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => render(false), 200);
    });

    return { root, refresh: () => render(true) };
  }

  window.createDriftWall = createDriftWall;
})();
