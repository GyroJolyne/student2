(() => {
  let attempts = 0;
  const timer = window.setInterval(() => {
    const main = window.mainScene;
    const world = main?.world;
    const contact = world?.section4;
    if (!main || !world || !contact?.cameraTransform || !main.scroller) {
      if (++attempts > 600) {
        window.clearInterval(timer);
        console.error("Portfolio chapters were not registered: the main scene did not initialize.");
      }
      return;
    }
    if (main.__portfolioChaptersRegistered) {
      window.clearInterval(timer);
      return;
    }

    const makeChapter = (sectionName, element) => {
      const camera = contact.cameraTransform;
      const baku = contact.bakuTransform;
      return {
        sectionName,
        visible: false,
        view: "ready",
        sectionVisibility: false,
        bakuParam: { materialType: "dark", rotateSpeed: 0 },
        ppParam: { ...contact.ppParam },
        trailDepth: contact.trailDepth,
        cameraRange: contact.cameraRange.clone(),
        cameraSPFovWeight: contact.cameraSPFovWeight || 22,
        cameraTransform: {
          position: camera.position.clone(),
          targetPosition: camera.targetPosition.clone(),
          fov: camera.fov,
          fovCalculated: camera.fovCalculated,
        },
        bakuTransform: {
          position: baku.position.clone(),
          rotation: baku.rotation.clone(),
          scale: baku.scale.clone(),
        },
        switchViewingState(state) {
          this.view = state;
          this.sectionVisibility = state === "viewing";
          this.visible = this.sectionVisibility;
          if (!element) return;
          element.setAttribute("data-visible", String(this.sectionVisibility));
          element.toggleAttribute("inert", !this.sectionVisibility);
          element.setAttribute("aria-hidden", String(!this.sectionVisibility));
        },
        update() {},
        resize(info) {
          this.cameraTransform.fovCalculated = this.cameraTransform.fov + this.cameraSPFovWeight * info.size.portraitWeight;
        },
      };
    };

    const chapterSelectors = [".section5", ".section6", ".section7"];
    const chapterElements = chapterSelectors.map((selector) => document.querySelector(selector));
    if (chapterElements.some((element) => !element)) {
      window.clearInterval(timer);
      console.error("Portfolio chapters were not registered: a chapter element is missing.");
      return;
    }
    const chapters = [
      makeChapter("section_video", chapterElements[0]),
      makeChapter("section_loro", chapterElements[1]),
      makeChapter("section_workflows", chapterElements[2]),
    ];

    world.section5 = chapters[0];
    world.section6 = chapters[1];
    world.section7 = chapters[2];
    world.sections.splice(2, 0, ...chapters);
    // Keep the original contact scene as a transform template, not a navigable chapter.
    world.sections.pop();

    const aboutElement = document.querySelector(".section3");
    if (aboutElement) aboutElement.before(...chapterElements);

    // Keep the original scene module names while placing three content chapters after the gallery.
    const visualIndex = [0, 1, 4, 4, 4, 2];
    const changeSection = world.changeSection.bind(world);
    world.changeSection = (index) => {
      const result = changeSection(index);
      const originalIndex = visualIndex[index] ?? index;
      world.bg.changeSection(originalIndex);
      world.ground.changeSection(originalIndex < 3 ? originalIndex : -1);
      world.trail?.changeMaterial(originalIndex < 3 ? originalIndex : -1);
      return result;
    };

    const updateTransform = world.updateTransform.bind(world);
    world.updateTransform = (position) => {
      const result = updateTransform(position);
      // Keep the remaining original scene objects available through the About chapter.
      [world.section1, world.section2, world.section3].forEach((scene) => {
        scene.visible = position < 5.98;
      });
      return result;
    };

    if (Array.isArray(main.subtitles?.textList)) {
      main.subtitles.textList.splice(2, 0, "", "", "");
      main.subtitles.textList.pop();
    }
    main.scroller.changeSectionNum(world.sections.length);

    // The original WebGL scroller takes two seconds per section jump. Commit
    // navigation immediately and let the opaque content pages crossfade in CSS;
    // keep the canvas idle while it sits completely behind those pages.
    const move = main.scroller.move.bind(main.scroller);
    main.scroller.move = (target, duration, done) => {
      const result = move(target, 0.01, done);
      // Commit the new section before the next expensive WebGL frame. The
      // opaque content pages then crossfade in CSS instead of waiting for a
      // multi-second canvas animation to finish.
      main.scroller.update(0.1);
      return result;
    };
    const animate = main.animate.bind(main);
    main.animate = (delta) => {
      const selected = Number(document.body.dataset.section);
      if (world.splashed && selected >= 2 && selected <= 5) {
        // Opaque content completely covers the canvas. Keep navigation time
        // advancing without rendering expensive hidden WebGL frames.
        main.scroller.update(Math.min(0.1, delta));
        return;
      }
      return animate(delta);
    };

    document.querySelectorAll("[data-go-to-section]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-go-to-section"));
        if (Number.isInteger(index)) main.goToSection(index);
      });
    });

    document.querySelectorAll(".resource-showcase").forEach((showcase) => {
      const section = showcase.closest(".section");
      const scroll = showcase.querySelector(".resource-showcase-scroll");
      if (!section || !scroll) return;
      let active = false;
      const sync = () => {
        active = section.getAttribute("data-visible") === "true";
        showcase.classList.toggle("is-active", active);
        if (!active) scroll.blur?.();
      };
      const atTop = () => scroll.scrollTop <= 1;
      const atBottom = () => scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2;
      // 翻章统一走这里：body[data-section] 是 1-based，要换算回 world.sections 的 0-based 索引
      const exitChapter = (down) => {
        if (performance.now() - (window.__navLock || -1e9) < 620) return;
        window.__navLock = performance.now();
        const current = Number(document.body.dataset.section) - 1;
        const next = down ? current + 1 : current - 1;
        if (next >= 0 && next < world.sections.length && next !== current) main.goToSection(next);
      };
      showcase.addEventListener("wheel", (event) => {
        if (!active || event.ctrlKey) return;
        event.preventDefault();
        event.stopPropagation();
        const unit = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? scroll.clientHeight : 1;
        const delta = event.deltaY * unit;
        // 先滚自己的内容；滚到顶/底再继续滚，就把滚轮交给章节——
        // 页面里不再放「← 上一章 / 下一章 →」按钮，靠这一条保证哪一章都能滚出去。
        if ((delta < 0 && atTop()) || (delta > 0 && atBottom())) {
          exitChapter(delta > 0);
          return;
        }
        scroll.scrollBy({ top: delta, behavior: "instant" });
      }, { passive: false });
      ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((type) => {
        showcase.addEventListener(type, (event) => event.stopPropagation(), { passive: true });
      });
      showcase.addEventListener("keydown", (event) => {
        if (!active || event.target.closest("button, a, video, input, textarea, select") || !["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "Home" || event.key === "End") scroll.scrollTo({ top: event.key === "Home" ? 0 : scroll.scrollHeight, behavior: "instant" });
        else {
          const up = ["ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey);
          if ((up && atTop()) || (!up && atBottom())) { exitChapter(!up); return; }
          scroll.scrollBy({ top: (event.key.startsWith("Arrow") ? 60 : scroll.clientHeight * 0.8) * (up ? -1 : 1), behavior: "instant" });
        }
      });
      new MutationObserver(sync).observe(section, { attributes: true, attributeFilter: ["data-visible"] });
      sync();
    });

    main.__portfolioChaptersRegistered = true;
    window.clearInterval(timer);
  }, 120);
})();
