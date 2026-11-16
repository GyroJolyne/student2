/* 章节切换过渡控制
   1) 交叉溶解取代「压黑」：切章前把画布当前帧冻结成一张快照盖在画布上，
      引擎把相机硬切到目标章节时观众看到的还是旧帧，随后快照淡出、新画面浮现。
      旧方案是直接把 #canvas 置为 opacity:0，而 body 底色是纯黑，于是每次切章
      都有约 140ms 的纯黑 —— 这就是「闪黑」的来源。
   2) 切换节流：一次滚轮/点击只推进一个章节；冷却期内的重复请求合并成最后一次。

   注意：这个 WebGL 上下文没有开 preserveDrawingBuffer，画布像素只在
   rAF 回调里读得到（帧缓冲尚未被合成器清掉）。所以快照必须放进 rAF，
   真正的切章动作也跟着推迟一帧（~16ms），肉眼无感但能保证拿到旧帧。 */
(() => {
  const COOLDOWN = 620;
  const FADE = 520;
  let attempts = 0;
  let queued = null;
  let lastFreezeAt = -1e9;

  const canvasEl = () => document.getElementById("canvas");

  /* 把画布满幅拷进一张 2D 画布，盖在它上面。
     拿不到像素就返回 null —— 宁可让相机硬切，也绝不盖一张黑图。 */
  function freezeFrame() {
    const gl = canvasEl();
    if (!gl || !gl.width || !gl.height) return null;

    let layer = document.querySelector(".chapter-freeze");
    if (!layer) {
      layer = document.createElement("canvas");
      layer.className = "chapter-freeze";
      layer.setAttribute("aria-hidden", "true");
      gl.after(layer);
    }
    if (layer.width !== gl.width || layer.height !== gl.height) {
      layer.width = gl.width;
      layer.height = gl.height;
    }

    // 只做 drawImage，不做 getImageData：后者会强制 GPU→CPU 全量回读，
    // 软件渲染下实测一次 1.2s，直接把切章卡住。拷贝失败时 2D 画布本来就是
    // 透明的，等于没盖东西，绝不会出现黑场，所以不需要额外校验。
    try {
      const ctx = layer.getContext("2d");
      ctx.clearRect(0, 0, layer.width, layer.height);
      ctx.drawImage(gl, 0, 0);
    } catch (error) {
      return null;
    }

    layer.style.transition = "none";
    layer.style.opacity = "1";
    layer.style.display = "block";
    return layer;
  }

  function releaseFreeze(layer) {
    // 下一帧就开始溶解：新画面此时已经画在下面了
    requestAnimationFrame(() => {
      layer.style.transition = `opacity ${FADE}ms cubic-bezier(.16,1,.3,1)`;
      layer.style.opacity = "0";
      window.setTimeout(() => {
        if (layer.style.opacity === "0") layer.style.display = "none";
      }, FADE + 60);
    });
  }

  /* 切章统一入口：rAF 里冻结旧帧 → 执行切换 → 淡出。
     同一帧内的多次请求合并，只冻结一次。 */
  function withFreeze(run) {
    if (queued) {
      queued.push(run);
      return;
    }
    // goToSection 内部还会再调一次 scroller.move，同一动作不能冻两次
    // （第二次会拍到切换后的新帧，反而暴露硬切），120ms 内只冻第一帧。
    const now = performance.now();
    if (now - lastFreezeAt < 120) {
      run();
      return;
    }
    lastFreezeAt = now;
    queued = [run];
    requestAnimationFrame(() => {
      const jobs = queued || [];
      queued = null;
      const layer = freezeFrame();
      jobs.forEach((job) => {
        try {
          job();
        } catch (error) {
          console.error(error);
        }
      });
      if (layer) releaseFreeze(layer);
    });
  }

  const sectionIndex = () => {
    const raw = document.body.dataset.section;
    if (raw === undefined) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value - 1 : null;
  };

  const timer = window.setInterval(() => {
    const main = window.mainScene;
    if (!main || typeof main.goToSection !== "function" || !main.scroller) {
      if (++attempts > 600) window.clearInterval(timer);
      return;
    }
    if (main.__motionPatched) {
      window.clearInterval(timer);
      return;
    }
    main.__motionPatched = true;

    // 滚轮翻章走 scroller.move，程序翻章走 goToSection，两条都挂上
    const move = main.scroller.move.bind(main.scroller);
    main.scroller.move = function (target, duration, done) {
      const current = sectionIndex();
      if (current === null || Math.round(target) === current) return move(target, duration, done);
      withFreeze(() => move(target, duration, done));
      return undefined;
    };
    main.scroller.__freezeHooked = true;

    const goToSection = main.goToSection.bind(main);
    main.goToSection = function (index) {
      const current = sectionIndex();
      if (current === null || Math.round(index) === current) return goToSection(index);
      const now = performance.now();
      const elapsed = now - (main.__lastGoAt || -1e9);
      // 冷却期内的连续请求合并成最后一次，避免一次滚轮连翻两三章
      if (elapsed < COOLDOWN) {
        window.clearTimeout(main.__goTimer);
        main.__goTimer = window.setTimeout(() => main.goToSection(index), COOLDOWN - elapsed);
        return undefined;
      }
      main.__lastGoAt = now;
      withFreeze(() => goToSection(index));
      return undefined;
    };

    window.clearInterval(timer);
  }, 120);
})();
