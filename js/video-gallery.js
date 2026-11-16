/* 视频章节：环形画廊。
   卡片排在一条弧线上（横向位移 + rotateY + 弧线下沉），拖拽 / 滚轮 / 方向键驱动，
   松手吸附到最近一张；点击卡片在本卡片内就地播放，不再弹全屏播放器。 */
(() => {
  const section = document.querySelector(".section5");
  if (!section) return;
  const showcase = section.querySelector(".video-showcase");
  const stage = showcase?.querySelector(".video-arc-stage");
  const arc = showcase?.querySelector(".video-arc");
  if (!showcase || !stage || !arc) return;

  const cards = [...arc.querySelectorAll(".video-card")];
  const total = cards.length;
  if (!total) return;

  const captionIndex = showcase.querySelector(".video-caption-index");
  const captionTitle = showcase.querySelector(".video-caption-title");
  const captionDesc = showcase.querySelector(".video-caption-desc");
  const pad = (n) => String(n).padStart(2, "0");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const BEND = 34;          // 弧线下沉系数（px / 单位²）
  const TURN = 16;          // 每偏离一格转动的角度
  const GAP_RATIO = 0.16;   // 间距占卡片宽度的比例
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  let progress = 0;
  let target = 0;
  let raf = 0;
  let sectionActive = false;
  let activeIndex = -1;
  let dragging = false;
  let dragStartX = 0;
  let dragStartProgress = 0;
  let dragMoved = 0;
  let suppressClick = false;
  let wheelAccum = 0;
  let playingCard = null;
  let pendingPlay = -1;

  const cardWidth = () => cards[0].offsetWidth || 300;
  const stepSize = () => cardWidth() * (1 + GAP_RATIO);

  function render() {
    const step = stepSize();
    const motion = clamp(Math.abs(target - progress) * 4, 0, 1);
    const wave = reduced.matches ? 0 : Math.sin(performance.now() * 0.0035) * 12 * motion;
    cards.forEach((card, i) => {
      let off = (((i - progress) % total) + total) % total;
      if (off > total / 2) off -= total;
      const abs = Math.abs(off);
      const x = off * step;
      const y = BEND * off * off + wave * Math.sign(off || 1);
      const rotate = clamp(-off * TURN, -46, 46);
      const scale = Math.max(0.74, 1 - abs * 0.065);
      const opacity = abs > 3.2 ? 0 : Math.max(0, 1 - abs * 0.28);
      // 深度只靠缩放表达：一旦给 translateZ 负值，卡片会落到 .video-arc 平面之后，
      // Chromium 的 3D 命中测试会优先命中容器，侧边卡片就点不动了。
      card.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateY(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(200 - Math.round(abs * 12));
      card.style.pointerEvents = abs > 3 ? "none" : "auto";
    });
    const near = wrapIndex(progress);
    if (near !== activeIndex) {
      activeIndex = near;
      const card = cards[near];
      if (card) {
        captionIndex.textContent = `VIDEO / ${pad(near + 1)}`;
        captionTitle.textContent = card.dataset.title || "";
        captionDesc.textContent = card.dataset.desc || "";
        cards.forEach((c, i) => {
          c.classList.toggle("is-active", i === near);
          if (i === near) c.setAttribute("aria-current", "true");
          else c.removeAttribute("aria-current");
        });
      }
    }
    // 播放中的卡片被转走之后暂停，画面留在原地，转回来可以接着看
    if (playingCard && playingCard !== cards[near]) stopInline(true);
  }

  function tick() {
    const diff = target - progress;
    if (Math.abs(diff) < 0.0012) {
      progress = target;
      render();
      raf = 0;
      // 侧边卡片点一下就播：先转正，停稳后再开始播，避免转到一半被 stopInline 掐掉
      if (pendingPlay >= 0) {
        const index = pendingPlay;
        pendingPlay = -1;
        if (cards[index]) playInline(cards[index]);
      }
      return;
    }
    progress += diff * 0.17;
    render();
    raf = requestAnimationFrame(tick);
  }

  function goTo(index) {
    target = index;
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function setInstant(index) {
    progress = index;
    target = index;
    pendingPlay = -1;
    render();
  }

  const wrapIndex = (value) => ((Math.round(value) % total) + total) % total;

  // ── 拖拽 ──────────────────────────────────────────────
  // 指针捕获只在真正开始拖动后启用——否则 click 会被重定向到舞台，卡片点不动
  let capturedId = null;
  stage.addEventListener("pointerdown", (event) => {
    if (!sectionActive || event.button !== 0) return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartProgress = progress;
    dragMoved = 0;
    suppressClick = false;
    pendingPlay = -1;
    capturedId = null;
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - dragStartX;
    dragMoved = Math.abs(dx);
    if (capturedId === null) {
      if (dragMoved < 6) return;
      capturedId = event.pointerId;
      suppressClick = true;
      stage.classList.add("is-dragging");
      try { stage.setPointerCapture(capturedId); } catch (error) { /* 忽略不支持捕获的环境 */ }
    }
    progress = dragStartProgress - dx / stepSize();
    target = progress;
    render();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (capturedId !== null) {
      try { stage.releasePointerCapture(capturedId); } catch (error) { /* noop */ }
      capturedId = null;
    } else {
      return; // 只是点击，交给 click 处理
    }
    const moved = progress - dragStartProgress;
    goTo(Math.round(progress + clamp(moved * 0.6, -1.1, 1.1)));
    window.setTimeout(() => { suppressClick = false; }, 60);
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  // ── 点击 ──────────────────────────────────────────────
  cards.forEach((card, i) => {
    card.querySelector(".video-card-trigger").addEventListener("click", () => {
      if (suppressClick) return;
      let off = (((i - progress) % total) + total) % total;
      if (off > total / 2) off -= total;
      if (Math.abs(off) > 0.35) {
        // 点侧边卡片：先把它转到中间，停稳后直接开始播——一次点击就够了
        pendingPlay = i;
        goTo(Math.round(progress) + Math.round(off));
        return;
      }
      playInline(cards[i]);
    });
  });

  // ── 滚轮分两种：指针压在视频卡片上 → 转卡片（环形无限循环）
  //               指针在别处（标题 / 字幕 / 空白）→ 直接翻章节，
  //               和其他章节的手感保持一致。
  /* 指针是否压在卡片带上。
     不用 event.target：卡片在环形里一直在动，光标可能正好落在两张卡的缝隙，
     那一刻 target 是舞台容器，会被误判成「别处」直接翻章。
     改成按所有卡片的外扩矩形判断，转卡过程中光标始终在同一片区域里。 */
  const isOverCarousel = (x, y) => cards.some((card) => {
    const rect = card.getBoundingClientRect();
    if (!rect.width) return false;
    return x > rect.left - 40 && x < rect.right + 40 && y > rect.top - 40 && y < rect.bottom + 40;
  });

  showcase.addEventListener("wheel", (event) => {
    if (!sectionActive || event.ctrlKey) return;
    const delta = event.deltaY + event.deltaX;
    if (Math.abs(delta) < 4) return;
    const overCard = isOverCarousel(event.clientX, event.clientY);

    if (!overCard) {
      event.preventDefault();
      event.stopPropagation();
      if (performance.now() - (window.__navLock || -1e9) < 620) return;
      window.__navLock = performance.now();
      window.mainScene?.goToSection(delta > 0 ? 3 : 1);
      return;
    }

    if (performance.now() - (window.__navLock || -1e9) < 500) return;
    event.preventDefault();
    event.stopPropagation();
    wheelAccum += delta;
    window.clearTimeout(showcase.__wheelTimer);
    showcase.__wheelTimer = window.setTimeout(() => { wheelAccum = 0; }, 220);
    if (Math.abs(wheelAccum) < 46) return;
    const dir = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;
    goTo(Math.round(target) + dir);
  }, { passive: false });

  ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((type) => {
    showcase.addEventListener(type, (event) => event.stopPropagation(), { passive: true });
  });

  // ── 键盘：← → 转卡片（环形），↑ ↓ 翻章节 ─────────────────
  showcase.addEventListener("keydown", (event) => {
    if (!sectionActive) return;
    if (event.target.closest(".gallery-chapter-nav")) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      window.mainScene?.goToSection(event.key === "ArrowDown" ? 3 : 1);
      return;
    }
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Home") goTo(Math.round(target) - wrapIndex(target));
    else if (event.key === "End") goTo(Math.round(target) - wrapIndex(target) + total - 1);
    else goTo(Math.round(target) + (event.key === "ArrowRight" ? 1 : -1));
  });

  // ── 就地播放（不弹层）────────────────────────────────
  // 视频直接铺在卡片里播：点海报即在原位置开始播放，再点一次 × 收回。
  // 播放中的卡片被转走 / 章节离开时暂停，画面留在原处，转回来可以接着看。
  function inlineLayer(card) {
    let layer = card.querySelector(".video-card-inline");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.className = "video-card-inline";
    layer.innerHTML = '<video playsinline controls preload="none"></video>' +
      '<button class="video-card-close" type="button" aria-label="停止播放">×</button>';
    card.append(layer);
    const el = layer.querySelector("video");
    el.setAttribute("aria-label", card.dataset.title || "视频");
    // 视频层自己吃掉指针事件，否则拖动进度条会把环形舞台一起转起来
    layer.addEventListener("pointerdown", (event) => event.stopPropagation());
    layer.addEventListener("click", (event) => event.stopPropagation());
    layer.querySelector(".video-card-close").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      stopInline(false);
    });
    return layer;
  }

  function playInline(card) {
    stopInline(false);
    const layer = inlineLayer(card);
    const el = layer.querySelector("video");
    el.src = card.dataset.src;
    card.classList.add("is-playing");
    playingCard = card;
    const attempt = el.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => { /* 自动播放被拦截时，用卡片内的原生控件点播 */ });
    }
  }

  function stopInline(keepFrame) {
    const card = playingCard;
    if (!card) return;
    playingCard = null;
    card.classList.remove("is-playing");
    const el = card.querySelector(".video-card-inline video");
    if (!el) return;
    el.pause();
    if (keepFrame) {
      try { el.currentTime = 0; } catch (error) { /* noop */ }
      return;
    }
    el.removeAttribute("src");
    el.load();
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && playingCard) {
      event.preventDefault();
      stopInline(false);
    }
  });

  // ── 章节切换交给滚轮 / 键盘 / 底部圆点，页面里不再放导航按钮 ──
  const sync = () => {
    sectionActive = section.getAttribute("data-visible") === "true";
    showcase.classList.toggle("is-active", sectionActive);
    showcase.inert = !sectionActive;
    showcase.setAttribute("aria-hidden", String(!sectionActive));
    if (!sectionActive) {
      pendingPlay = -1;
      stopInline(false);
    } else setInstant(0);
  };
  new MutationObserver(sync).observe(section, { attributes: true, attributeFilter: ["data-visible"] });
  window.addEventListener("resize", () => render());
  setInstant(0);
  sync();
})();
