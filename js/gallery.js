(() => {
  const host = document.querySelector(".photo-gallery");
  if (!host) return;
  const scroll = host.querySelector(".photo-gallery-scroll");
  const tabs = host.querySelector(".photo-gallery-tabs");
  const content = host.querySelector(".photo-gallery-content");
  const groups = host.querySelector(".photo-gallery-groups");
  const intro = host.querySelector(".photo-gallery-intro");
  const lightbox = host.querySelector(".photo-lightbox");
  const image = lightbox.querySelector(".photo-lightbox-image");
  const closeButton = lightbox.querySelector(".photo-lightbox-close");
  const previous = lightbox.querySelector(".photo-lightbox-previous");
  const next = lightbox.querySelector(".photo-lightbox-next");
  const sourceTabs = lightbox.querySelector(".photo-lightbox-tabs");
  const pad = (n) => String(n).padStart(2, "0");
  const manifest = (prefix, filenames, sizes) => filenames.map((filename, index) => ({
    src: `./assets/gallery/${prefix}-${pad(index + 1)}.webp`,
    filename,
    width: sizes[index]?.[0] || 1012,
    height: sizes[index]?.[1] || 1800,
  }));
  const sources = [
    { label: "角色海报", images: manifest("campaign-character", ["01_DUNE_TOMB.png", "02_PYRO_HEART.png", "03_STYX.png", "04_GALE_FALCON.png", "05_圣咏.png", "06_VERDANT_RITE.png"], []) },
    { label: "暗夜锋芒", images: manifest("campaign-night", ["02_AKALI.png", "05_DIANA_3.png", "08_EVELYNN_2.png", "12_JINX.png", "15_KATARINA_2.png", "25_VAYNE_2.png"], []) },
    { label: "兽灵机能", images: manifest("campaign-beast", ["01_樱粉.png", "02_冰蓝.png", "03_暗紫.png", "04_琥珀橙.png", "05_绯红.png", "06_墨绿.png"], []) },
    { label: "秀场高光", images: manifest("campaign-runway", ["01_AHRI.png", "07_EVELYNN.png", "11_IRELIA.png", "13_KAISA.png", "18_MISSFORTUNE.png", "19_RIVEN.png"], []) },
  ];
  const portraits = manifest("portrait-photo", ["人像写真_01.png", "人像写真_03.png", "人像写真_04.png", "人像写真_05.png", "人像写真_06.png", "人像写真_07.jpg", "人像写真_08.png", "人像写真_09.png", "人像写真_10.jpg", "人像写真_11.png", "人像写真_12.png", "人像写真_13.png", "人像写真_14.jpg", "人像写真_15.png", "人像写真_16.jpg", "人像写真_17.png", "人像写真_18.png"], [[1200,674],[1012,1800],[1200,675],[1012,1800],[1200,1490],[1005,1800],[1012,1800],[1012,1800],[1005,1800],[1200,675],[1012,1800],[1012,1800],[1005,1800],[1012,1800],[1005,1800],[1012,1800],[1012,1800]]);
  const posters = manifest("commercial-poster", ["B%E7%AB%99%E6%90%9C%E7%B4%A2%E5%9C%A8%E4%B8%8B%E9%B1%BC%E9%85%A5_00004_buydh_1794154851.png", "img_39ad9dbd54db1a5fe5613f22d3102852-1.png", "商业广告海报_01.png", "商业广告海报_02.png", "商业广告海报_06.png", "商业广告海报_07.png", "艺术设计海报_01.png", "艺术设计海报_02.png", "艺术设计海报_03.jpg", "艺术设计海报_07.png", "艺术设计海报_08.png", "艺术设计海报_09.png"], [[1011,1800],[1012,1800],[1012,1800],[1012,1800],[1012,1800],[1012,1800],[1012,1800],[1012,1800],[1005,1800],[1012,1800],[1012,1800],[1012,1800]]);
  const pages = [
    { id: "game", label: "游戏宣发", english: "GAME / SELECTED WORKS", description: "24 张精选海报 · 四系列错落排列 · 悬停停列，点击放大", count: 24 },
    { id: "portrait", label: "人像写真", english: "PORTRAIT / SELECTED WORKS", description: "17 张人像写真 · 按文件名顺序错落展示 · 点击放大", count: portraits.length },
    { id: "commercial", label: "商业海报", english: "POSTER / SELECTED WORKS", description: "12 张艺术设计与商业广告海报 · 按文件名顺序错落展示 · 点击放大", count: posters.length },
  ];
  const panels = [];
  const gameRecords = [];
  const masonryLists = [];
  let wallMount = null;
  const wallTiles = [];
  const pageScroll = [0, 0, 0];
  let activePage = 0;
  let selected = -1;
  let returnFocus = null;
  let isOpen = false;
  let sectionActive = false;
  let savedOverflow = "";
  // 灯箱当前挂着哪一套图：游戏宣发是 24 张平铺池 + 系列页签，
  // 人像写真 / 商业海报是各自那一页的图，没有系列页签。
  let dock = { records: gameRecords, label: "游戏宣发", tabs: true };

  const makeImage = (record, eager) => {
    const img = document.createElement("img");
    img.src = record.src;
    img.alt = record.filename.replace(/\.[^.]+$/, "");
    img.width = record.width;
    img.height = record.height;
    img.loading = eager ? "eager" : "lazy";
    img.decoding = "async";
    return img;
  };

  const masonryColumnCount = () => window.innerWidth <= 480 ? 1 : window.innerWidth <= 850 ? 2 : 4;
  function renderMasonry(list, images, pageId) {
    const columnCount = Math.min(masonryColumnCount(), images.length);
    const lanes = Array.from({ length: columnCount }, (_, index) => {
      const lane = document.createElement("div");
      lane.className = "gallery-masonry-lane";
      lane.setAttribute("role", "group");
      lane.setAttribute("aria-label", `${pageId}作品列 ${index + 1}`);
      return lane;
    });
    let cursor = 0;
    lanes.forEach((lane, laneIndex) => {
      const remainingColumns = lanes.length - laneIndex;
      const take = Math.ceil((images.length - cursor) / remainingColumns);
      images.slice(cursor, cursor + take).forEach((record, localIndex) => {
        const index = cursor + localIndex;
        const figure = document.createElement("figure");
        figure.className = "gallery-masonry-item";
        figure.dataset.filename = record.filename;
        figure.dataset.order = String(index + 1);
        figure.tabIndex = 0;
        figure.setAttribute("role", "button");
        figure.setAttribute("aria-label", `查看大图：${record.filename}`);
        figure.append(makeImage(record, index < 2));
        const caption = document.createElement("figcaption");
        const name = document.createElement("span");
        name.textContent = record.filename;
        const number = document.createElement("span");
        number.textContent = `${pad(index + 1)} / ${pad(images.length)}`;
        caption.append(name, number);
        figure.append(caption);
        const open = () => openSelection(index, figure, { records: images, label: pageId, tabs: false });
        figure.addEventListener("click", open);
        figure.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          open();
        });
        lane.append(figure);
      });
      cursor += take;
    });
    list.replaceChildren(...lanes);
  }

  sources.forEach((source, sourceIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "photo-lightbox-tab";
    button.textContent = source.label;
    button.dataset.source = String(sourceIndex);
    button.addEventListener("click", () => {
      selected = gameRecords.findIndex((record) => record.sourceIndex === sourceIndex);
      renderSelection();
    });
    sourceTabs.append(button);
  });

  pages.forEach((page, pageIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "photo-gallery-tab";
    button.id = `gallery-tab-${page.id}`;
    button.textContent = page.label;
    button.dataset.page = String(pageIndex);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", `gallery-panel-${page.id}`);
    button.addEventListener("click", () => switchPage(pageIndex));
    tabs.append(button);

    const panel = document.createElement("section");
    panel.className = `gallery-page gallery-page--${page.id}`;
    panel.id = `gallery-panel-${page.id}`;
    panel.dataset.page = page.id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    panel.hidden = pageIndex !== 0;
    panel.inert = pageIndex !== 0;

    if (pageIndex === 0) {
      // 游戏宣发改为漂移墙：四个系列各占一列，列内无缝循环漂移
      panel.classList.add("drift-page");
      wallMount = document.createElement("div");
      wallMount.className = "drift-wall-mount";
      panel.append(wallMount);
      sources.forEach((source, sourceIndex) => {
        source.images.forEach((record) => {
          const recordIndex = gameRecords.length;
          gameRecords.push({ ...record, sourceIndex, category: source.label });
          wallTiles.push({ src: record.src, filename: record.filename, index: recordIndex });
        });
      });
    } else {
      const heading = document.createElement("header");
      heading.className = "gallery-simple-heading";
      const kicker = document.createElement("p");
      kicker.textContent = page.english;
      const title = document.createElement("h2");
      title.textContent = page.label;
      const note = document.createElement("p");
      note.textContent = page.description;
      heading.append(kicker, title, note);
      panel.append(heading);
      const list = document.createElement("div");
      list.className = "gallery-masonry";
      const images = pageIndex === 1 ? portraits : posters;
      renderMasonry(list, images, page.label);
      masonryLists.push({ list, images, pageId: page.label });
      panel.append(list);
    }
    panels.push(panel);
    groups.append(panel);
  });

  if (wallMount && window.createDriftWall) {
    window.createDriftWall(wallMount, wallTiles, {
      onOpen: (record, tile) => openSelection(record.index, tile, { records: gameRecords, label: "游戏宣发", tabs: true }),
    });
  }

  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "切换作品展示页面");
  document.body.append(lightbox);
  lightbox.setAttribute("aria-hidden", "true");

  function switchPage(index) {
    if (isOpen) closeSelection(false);
    pageScroll[activePage] = scroll.scrollTop;
    activePage = (index + pages.length) % pages.length;
    const page = pages[activePage];
    host.dataset.page = page.id;
    panels.forEach((panel, i) => {
      panel.hidden = i !== activePage;
      panel.inert = i !== activePage;
    });
    tabs.querySelectorAll("button").forEach((button, i) => {
      button.setAttribute("aria-selected", String(i === activePage));
      button.setAttribute("aria-current", String(i === activePage));
      button.tabIndex = i === activePage ? 0 : -1;
    });
    intro.querySelector("p").textContent = page.english;
    intro.querySelector("h2").textContent = page.label;
    intro.querySelector(".photo-gallery-hint").textContent = page.description;
    intro.hidden = activePage !== 0;
    scroll.scrollTo({ top: pageScroll[activePage], behavior: "instant" });
    content.setAttribute("aria-label", `${page.label}，共${page.count}张图片`);
  }

  function renderSelection() {
    const record = dock.records[selected];
    if (!record) return;
    image.src = record.src;
    image.alt = record.filename;
    image.width = record.width;
    image.height = record.height;
    lightbox.querySelector(".photo-lightbox-title").textContent = record.filename.replace(/\.[^.]+$/, "");
    lightbox.querySelector(".photo-lightbox-category").textContent = record.category ? `${record.category} / ${dock.label}` : dock.label;
    lightbox.querySelector(".photo-lightbox-count").textContent = `${pad(selected + 1)} / ${pad(dock.records.length)}`;
    lightbox.classList.toggle("is-plain", !dock.tabs);
    if (!dock.tabs) sourceTabs.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", "false"));
    else sourceTabs.querySelectorAll("button").forEach((button, index) => {
      button.setAttribute("aria-pressed", String(index === record.sourceIndex));
    });
  }

  function openSelection(index, card, set) {
    if (!sectionActive) return;
    if (set) dock = set;
    selected = index;
    returnFocus = card;
    renderSelection();
    savedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    scroll.inert = true;
    tabs.inert = true;
    isOpen = true;
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("is-open");
    closeButton.focus({ preventScroll: true });
  }

  function closeSelection(restoreFocus = true) {
    if (!isOpen) return;
    isOpen = false;
    lightbox.hidden = true;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = savedOverflow;
    scroll.inert = false;
    tabs.inert = false;
    if (restoreFocus && sectionActive && returnFocus) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }

  function moveSelection(step) {
    selected = (selected + step + dock.records.length) % dock.records.length;
    renderSelection();
  }
  closeButton.addEventListener("click", () => closeSelection());
  previous.addEventListener("click", () => moveSelection(-1));
  next.addEventListener("click", () => moveSelection(1));
  lightbox.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-lightbox]")) closeSelection();
  });
  lightbox.addEventListener("wheel", (event) => { event.preventDefault(); event.stopPropagation(); }, { passive: false });
  lightbox.addEventListener("touchmove", (event) => { event.preventDefault(); event.stopPropagation(); }, { passive: false });
  tabs.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      switchPage(activePage + (event.key === "ArrowRight" ? 1 : -1));
      tabs.querySelectorAll("button")[activePage].focus();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (!isOpen) return;
    if (["Escape", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Escape") closeSelection();
      else moveSelection(event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "Tab") {
      const buttons = [...lightbox.querySelectorAll("button")];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // 滚轮统一负责翻章：漂移墙没有内部滚动，直接翻；砌体页先滚自己，
  // 滚到顶/底再交给章节——这样两个按钮去掉之后，滚轮在哪都能走。
  const CHAPTER_AT = { top: 0, bottom: 2 };
  host.addEventListener("wheel", (event) => {
    if (!sectionActive || event.ctrlKey) return;
    if (isOpen) { event.preventDefault(); event.stopPropagation(); return; }
    const goChapter = (index) => {
      event.preventDefault();
      event.stopPropagation();
      if (performance.now() - (window.__navLock || -1e9) < 600) return;
      window.__navLock = performance.now();
      window.mainScene?.goToSection(index);
    };
    if (activePage === 0) {
      if (Math.abs(event.deltaY) < 8) return;
      goChapter(event.deltaY > 0 ? CHAPTER_AT.bottom : CHAPTER_AT.top);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const unit = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? scroll.clientHeight : 1;
    const delta = event.deltaY * unit;
    const atTop = scroll.scrollTop <= 1;
    const atBottom = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2;
    if (delta < 0 && atTop) goChapter(CHAPTER_AT.top);
    else if (delta > 0 && atBottom) goChapter(CHAPTER_AT.bottom);
    else scroll.scrollBy({ top: delta, behavior: "instant" });
  }, { passive: false });
  ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((type) => {
    host.addEventListener(type, (event) => event.stopPropagation(), { passive: true });
  });
  host.addEventListener("keydown", (event) => {
    if (!sectionActive || isOpen || activePage === 0) return;
    if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) return;
    if (event.key === " " && event.target.closest("button")) return;
    const target = scroll;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === "Home" || event.key === "End") {
      target.scrollTo({ top: event.key === "Home" ? 0 : target.scrollHeight, behavior: "instant" });
    } else {
      const up = ["ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey);
      const distance = event.key.startsWith("Arrow") ? 60 : target.clientHeight * 0.8;
      target.scrollBy({ top: distance * (up ? -1 : 1), behavior: "instant" });
    }
  });
  switchPage(0);
  let lastMasonryColumns = masonryColumnCount();
  window.addEventListener("resize", () => {
    const columns = masonryColumnCount();
    if (columns === lastMasonryColumns) return;
    lastMasonryColumns = columns;
    masonryLists.forEach(({ list, images, pageId }) => renderMasonry(list, images, pageId));
  });
  const section = host.closest(".section2");
  const sync = () => {
    sectionActive = section?.getAttribute("data-visible") === "true";
    host.classList.toggle("is-active", sectionActive);
    host.inert = !sectionActive;
    host.setAttribute("aria-hidden", String(!sectionActive));
    if (!sectionActive) closeSelection(false);
  };
  if (section) new MutationObserver(sync).observe(section, { attributes: true, attributeFilter: ["data-visible"] });
  sync();
})();
