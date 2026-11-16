/* 工作流详情：四张卡片共用同一套弹层（结构 / 样式完全一致），
   点哪张卡就按 data-workflow 填哪一份数据，视图不复制。
   数据取自 assets/workflows/ 里那四份 JSON 的真实节点与参数。 */
(() => {
  "use strict";

  const WORKFLOWS = {
    "krea2-wallpaper": {
      index: "01",
      category: "壁纸生成与放大",
      title: "Krea2 二次元 4K 艺术壁纸",
      tag: "双段采样 · 潜空间放大",
      caseLabel: "CASE 01 / KREA2 WALLPAPER",
      file: "Krea2-二次元-4k艺术壁纸.json",
      href: "./assets/workflows/Krea2-二次元-4k艺术壁纸.json",
      nodes: 27,
      headline: ["一句话进，", "4K 壁纸出。"],
      summary:
        "Krea2 Turbo 打底，五个仅模型 LoRA 分头管画风；先按 1152×2048 出图，再在潜空间放大，用第二遍低强度采样只补细节不改构图，最后经 AnimeSharp 拉到 4K。",
      steps: [
        { en: "SAMPLING", zh: "首遍采样", text: "1152×2048、8 步 euler/simple、denoise 1.0，先把构图、光位和角色定下来。" },
        { en: "UPSCALE", zh: "潜空间放大", text: "LatentUpscaleBy 只放大潜图不重绘，第二遍采样因此有更多像素可落。" },
        { en: "REFINE", zh: "二次精修", text: "4 步、denoise 0.35 补纹理与边缘，AnimeSharp 4x 出最终尺寸。" }
      ],
      stack: ["Krea2 Turbo", "5× LoRA (Model Only)", "Qwen3-VL 4B", "Qwen Image VAE", "AnimeSharp 4x"],
      stages: [
        { name: "模型与 LoRA", nodes: ["UNETLoader", "CLIPLoader", "VAELoader", "LoraLoaderModelOnly ×5"] },
        { name: "提示词", nodes: ["PrimitiveStringMultiline ×2", "StringConcatenate", "CLIPTextEncode", "ConditioningZeroOut"] },
        { name: "首遍采样", nodes: ["EmptyLatentImage", "PrimitiveInt", "KSampler · 8 步"] },
        { name: "放大与精修", nodes: ["LatentUpscaleBy", "ComfyMathExpression", "KSampler · 4 步"] },
        { name: "输出", nodes: ["VAEDecode", "UpscaleModelLoader", "ImageUpscaleWithModel", "ImageScale", "SaveImage"] }
      ],
      specs: [
        ["底模", "krea2_turbo_fp8.safetensors"],
        ["文本编码器", "qwen3vl_4b_bf16.safetensors · krea2"],
        ["VAE", "qwen_image_vae.safetensors"],
        ["LoRA", "masterpieces-v51 0.5 · enaa97 style 0.8 · Niji_v2A 0.6 · Purple_Graphics_KR2 0.65 · Purple_Dreams_Kr2 0.6（不用的置旁路）"],
        ["初始分辨率", "1152 × 2048，空潜图 1 张"],
        ["首遍采样", "8 步 · euler / simple · denoise 1.0"],
        ["放大", "LatentUpscaleBy（潜空间，不重绘内容）"],
        ["二次精修", "4 步 · euler / simple · denoise 0.35"],
        ["输出", "ImageUpscaleWithModel（AnimeSharp 4x）→ SaveImage"],
        ["节点数", "27"]
      ],
      media: {
        src: "./assets/gallery/workflow-pyro-heart.jpg",
        alt: "Pyro Heart 角色宣传视觉海报",
        caption: "PYRO HEART · 角色视觉",
        note: "站内视觉配图，非该工作流输出"
      },
      // 对比页没有「前后对照」可看，就把这张图当初的提示词摆上去
      prompt: [
        "一幅竖幅的电影海报式插画，双层层叠的构图：上半部是一张占满整个画幅宽度的巨大面孔特写，下半部是一个身披黑甲、手持燃烧长剑的战士正从废墟中走向观者，两个尺度完全不同的人像是同一个角色。",
        "巨脸压在画面上方三分之一并向右溢出，只露出眉骨以下的部分：一只眼睛从乱发与烟尘后面直视出来，虹膜是烧红的橙金色、瞳孔周围亮得像有火在里面，睫毛与眉峰的细节都被光勾出；鼻梁与下颌的轮廓被阴影吞掉，脸的下缘消融进褐色的烟里，看起来像悬在城市上空的幻影。他的头发是黑色、凌乱卷曲，发丝边缘带着橙色的火光。",
        "下方的战士取全身景别、略低的机位，他从画面中央偏右向前迈步，身体略微背对镜头、头向左侧偏转，看不到脸；重心压在踏出的那条腿上，肩背绷紧，身体被自己武器的火光从正面打亮。他穿一整套深灰近黑的板甲，肩甲是多层叠压的弧形钢板、边缘有细密的浮雕纹，胸甲与腰甲之间垂着锁甲与皮带，护手是分节的铁板，腿甲与护胫上都有铆钉和磨损的刮痕；身后一件黑色破损的披风被热浪掀开，末端正在化为火焰与灰烬，成片的火星与碳屑向画面右侧飞散。",
        "他右手垂下握着一柄长剑，剑身自腰间斜插到左下角，整把剑都裹在橙黄色的火焰里，焰舌从剑格一直舔到刃尖，火焰拖成长长的尾迹，把地面的碎石也映成橙色。",
        "背景是一座正在崩塌的古城：左侧是断掉一半的石柱与倾倒的门阙，一根类似鸟居的横梁歪斜着架在废墟上，中央有一处层叠的石阶通向高处；左后方一座山正在喷发，浓烟柱直上、被底部的火光染成暗红。天空被烟尘与灰烬填满，看不见云，只有从橙到褐的层层过渡。",
        "地面是开裂的黑色岩石，裂缝里涌出熔岩，绕着战士脚下形成一圈半环的发光裂纹，碎石与火屑在空中悬浮。",
        "光有三处来源：剑上的火焰、地面的熔岩，以及远处火山口的余焰。它们都是暖橙色的强光，把战士整个人压成半剪影、只在甲片边缘、披风轮廓和剑刃上留出明亮的描边；巨脸那一侧则被从下方打上来的火光照亮，形成从下往上的反常光照。整体只有黑、褐、橙三色，对比极强、暗部压到近黑。",
        "版式是标准的影视海报：左上角是两行巨大的橙色无衬线标题，其下是一行字距拉开的英文、再下一行短标语与一小段说明文字，左侧另有一枚火焰纹章的图标；右上与右下各有一列竖排的英文字，底部左侧是副标题与版权小字，右下角是社交账号。绘制上是厚重的半写实厚涂：甲片的金属高光与磨痕、火焰的分层亮度、烟尘的体积感都处理得很实，只有在文字与图标处保持平面。"
      ],
      compare: null
    },

    "moss-image-edit": {
      index: "02",
      category: "文生图 / 洗图 / 改图",
      title: "MOSS 全自动图像创作与编辑",
      tag: "提示词自动扩写 · SeedVR2 放大",
      caseLabel: "CASE 02 / MOSS AUTO PIPELINE",
      file: "MOSS+全自动文生图_洗图_改图（人物特写_改变风格）.json",
      href: "./assets/workflows/MOSS+全自动文生图_洗图_改图（人物特写_改变风格）.json",
      nodes: 26,
      headline: ["一句描述进去，", "扩写、采样、放大自己走完。"],
      summary:
        "MOSS Image SFT 配 Qwen3.5 9B 做提示词扩写：一句短描述会被补成完整画面稿与负面词，再按 2208×1088 采样，最后用 SeedVR2 放到 4064 长边，原图与放大图各存一份并排对比。",
      steps: [
        { en: "EXPAND", zh: "扩写", text: "RHLLMChatNode 按内置规则把短句补成完整画面描述，负面词一并生成。" },
        { en: "SAMPLE", zh: "采样", text: "Flux2 空潜图 2208×1088，30 步 er_sde、cfg 3，配 MOSS-SFT LoRA 强度 1.0。" },
        { en: "UPSCALE", zh: "放大与对比", text: "SeedVR2 放到 4064 长边，原图 / 放大结果各存一份，末尾 Image Comparer 并排。" }
      ],
      stack: ["MOSS Image SFT", "Qwen3.5 9B", "Flux2 VAE", "SeedVR2", "RH LLM Chat"],
      stages: [
        { name: "模型与尺寸", nodes: ["UNETLoader", "CLIPLoader", "VAELoader", "EmptyFlux2LatentImage", "ResolutionSelector"] },
        { name: "任务与参考图", nodes: ["LoadImage", "Int", "MarkdownNote ×2", "Note"] },
        { name: "扩写与预览", nodes: ["RHLLMChatNode", "CR Text", "PrimitiveStringMultiline", "PreviewAny"] },
        { name: "采样与解码", nodes: ["CLIPTextEncode ×2", "LoraLoaderModelOnly", "SkipLayerGuidanceDiTSimple", "KSampler · 30 步", "VAEDecode"] },
        { name: "放大与对比", nodes: ["SeedVR2LoadDiTModel", "SeedVR2LoadVAEModel", "SeedVR2VideoUpscaler", "SaveImage ×2", "Image Comparer"] }
      ],
      specs: [
        ["底模", "moss_image_sft_bf16.safetensors"],
        ["文本编码器", "qwen3.5_9b_bf16.safetensors · moss_image"],
        ["VAE", "flux2-vae.safetensors"],
        ["LoRA", "MOSS-SFT-2027_5.safetensors · 强度 1.0"],
        ["采样分辨率", "2208 × 1088（Flux2 空潜图）"],
        ["采样", "30 步 · er_sde / simple · cfg 3"],
        ["引导", "SkipLayerGuidanceDiTSimple"],
        ["放大", "SeedVR2VideoUpscaler → 长边 4064"],
        ["输出", "2 × SaveImage（原图 / 放大图）+ Image Comparer 并排"],
        ["节点数", "26"]
      ],
      media: {
        src: "./assets/gallery/portrait-photo-02.webp",
        alt: "站内人像作品，作为工作流主题的版式配图",
        caption: "站内配图 · 非流程输出",
        note: "该卡片用的是版式配图，不是这条工作流的输出"
      },
      // 这张夜拍人像当初的提示词，放在对比页分隔线上方
      prompt: [
        "一幅竖幅的夜间街头人像：一名年轻女性背对镜头站在人行道上，从左侧肩头回望过来，只画到胸口以下被裁掉，整张画面由她与身后的秋夜街道构成。",
        "她占画面中央，身体转向街内、脸部却朝观者，头微微低下，视线平直落到镜头上方一点，肩膀放松。机位与她的眼睛齐平、距离约一步半，浅景深把她的头发与脸充分压实，身后的街道向右侧退成大片虚化。",
        "她的头发是最主要的体积：极长的黑发，从头顶垂到腰下，发丝浓密、带一点自然的微卷，被夜风吹得向四周飘散，几缕横过面颊与眼睛、末端飞出发梢之外；头顶与侧边的发丝被街灯从上方打过，形成一层暖金的高光带，靠近后颈的部分则沉在冷暗的蓝黑里。脸是清瘦的小脸型，皮肤白净、几乎无瑕，眉毛自然平直，眼睛很大、双眼皮清楚、瞳色很黑，眼周只极淡的阴影和卧蚕，鼻梁细窄，唇色是自然的裸粉、微微张开，整个妆面几乎是素颜感，神情安静、带一点疏离。",
        "她穿一件深藏青的粗针织开衫，落肩、版型宽松，织纹是清晰的麻花与罗纹，衣身厚重、在肩背处堆出大块的褶，袖子长到盖住手背，里面隐约见得到深色的内搭。衣料的颜色与夜色的蓝调几乎融在一起，只有肩头与后背被灯光扫到的部分显出毛线的绒感。",
        "左侧是一棵树干与垂下的枝叶，秋叶是黄绿色，被头顶的路灯照得透亮、叶缘发光；人行道是浅灰色的方砖地面，湿漉漉地反着光，缝里积着水，砖面上散落着几片落叶与一点纸屑。右后方是一道黑色的金属护栏，把步道与车行道分开，护栏外的柏油路面被雨水浸透，把橙黄的路灯拉成一片片竖长的倒影，路上有行驶的车与明亮的前灯，远处一枚红色的信号灯在雾里发亮。",
        "背景深处是层层叠叠的城市：路灯沿街一盏盏缩小，行道树的暗影、停靠的车辆、亮着零星窗格的几栋高层建筑，最右上方有一片几乎纯黑的楼体轮廓，天空是被城市光染脏的深蓝，看不见星。",
        "光有三层：头顶与左前方的暖黄街灯是主光，从上方压在她头发与额面上，落下柔和的阴影；右侧路面反射上来的橙色是她脸颊与下巴的补光；最远处的高楼窗光与夜空提供一缕极冷的蓝，混在她的后颈与衣褶里。暖冷交错，暗部偏蓝、亮部偏橙。",
        "质感是高精度写实摄影：皮肤有细腻的毛孔与微弱油光，发丝一根根分明、部分被风吹得虚，针织毛线可见纤维与起球，湿地砖上有清晰的反光块，画面带一点轻微噪点与暗角，整体像用大光圈随手在路灯下拍下的夜拍。"
      ],
      compare: null
    },

    "qwen-pose-edit": {
      index: "03",
      category: "人像姿势编辑",
      title: "Qwen Image 2.1 人像姿势编辑",
      tag: "姿势参考 · 同角色重绘",
      caseLabel: "CASE 03 / POSE TRANSFER",
      file: "Qwen-image2.1-人像姿势编辑.json",
      href: "./assets/workflows/Qwen-image2.1-人像姿势编辑.json",
      nodes: 12,
      headline: ["同一张脸，", "换个姿势再来一次。"],
      summary:
        "RH_PoseGallery 里点一张姿势参考，Qwen Image 2.1 配 Pose Studio LoRA 把主体重绘到新姿势上；构图比例交给 ImageScaleByAspectRatio 控制，不裁也不拉伸。",
      steps: [
        { en: "POSE", zh: "取参考", text: "RH_PoseGallery 是可视化姿势库，点选即用，不用手搓提示词描述关节。" },
        { en: "EDIT", zh: "重绘", text: "TextEncodeQwenImage21 同时喂原图与姿势图，30 步 euler、cfg 1 出图。" },
        { en: "SAVE", zh: "输出", text: "VAEDecode 后 SaveImage 存档，PreviewImage 先给一眼预览。" }
      ],
      stack: ["Qwen Image 2.1", "Pose Studio V2", "RH Pose Gallery", "Qwen3-VL 8B", "Qwen Image 2.1 VAE"],
      stages: [
        { name: "参考与模型", nodes: ["RH_PoseGallery", "LoadImage", "UNETLoader", "CLIPLoader", "VAELoader"] },
        { name: "编码与比例", nodes: ["TextEncodeQwenImage21", "ImageScaleByAspectRatio V2"] },
        { name: "采样与解码", nodes: ["LoraLoaderModelOnly", "KSampler · 30 步", "VAEDecode"] },
        { name: "输出", nodes: ["SaveImage", "PreviewImage"] }
      ],
      specs: [
        ["底模", "qwen_image_2.1_int8_convrot.safetensors"],
        ["文本编码器", "qwen3vl_8b_int8_convrot.safetensors · qwen_image"],
        ["VAE", "qwen_image_2.1_vae_bf16.safetensors"],
        ["LoRA", "VNCCS_QI2_PoseStudioV2.safetensors · 强度 1.0"],
        ["姿势参考", "RH_PoseGallery（可视化姿势库）"],
        ["比例控制", "LayerUtility: ImageScaleByAspectRatio V2"],
        ["采样", "30 步 · euler / simple · cfg 1"],
        ["输出", "SaveImage + PreviewImage"],
        ["节点数", "12"]
      ],
      media: {
        src: "./assets/gallery/workflow-qwen-result.webp",
        alt: "调整后：同一角色改为站姿与全身构图",
        caption: "POSE TRANSFER · 调整后",
        note: "左为蹲姿参考，右为重绘后的站姿"
      },
      compare: {
        a: { src: "./assets/gallery/workflow-qwen-source.webp", alt: "原图：角色姿势参考（蹲姿）", label: "原图", meta: "角色姿势参考 · 蹲姿" },
        b: { src: "./assets/gallery/workflow-qwen-result.webp", alt: "调整后：同一角色改为站姿与全身构图", label: "调整后", meta: "同角色重绘 · 站姿全身" },
        note: "参考图给的是关节位置与镜头高度，服装、发型、五官都沿用原角色，所以两张看起来是同一个人的不同姿势。"
      }
    },

    "qwen-chibi": {
      index: "04",
      category: "一键转 Q 版",
      title: "一键转 Q 版 工作流 V1",
      tag: "Q 版化 LoRA · 4 步加速",
      caseLabel: "CASE 04 / CHIBI CONVERT",
      file: "【Aaron寄语秋歌】一键转Q版工作流V1.json",
      href: "./assets/workflows/【Aaron寄语秋歌】一键转Q版工作流V1.json",
      nodes: 30,
      headline: ["真人照片进去，", "Q 版出来。"],
      summary:
        "Qwen Image Edit 2511 配三个 LoRA 分工：Q 版化、动漫风补细节、4 步加速压步数。进来先把原图缩到目标像素量再编辑，出去走 SeedVR2 放到 4096 长边。",
      steps: [
        { en: "SCALE", zh: "缩放", text: "ImageScaleToTotalPixels 按 lanczos 压到 0.5 倍像素量，长边不再溢出。" },
        { en: "EDIT", zh: "Q 版化", text: "TextEncodeQwenImageEditPlus 读原图，8 步 euler/sgm_uniform、cfg 1 就够。" },
        { en: "UPSCALE", zh: "放大", text: "SeedVR2 走 2048 → 4096 两档，末尾和原图并排对比。" }
      ],
      stack: ["Qwen Image Edit 2511", "QcartoonV1", "Anime-2000", "Lightning 4-step", "SeedVR2"],
      stages: [
        { name: "读图与缩放", nodes: ["LoadImage", "ImageScaleToTotalPixels", "ImageScaleByAspectRatio V2"] },
        { name: "编码与 LoRA", nodes: ["TextEncodeQwenImageEditPlus", "LoraLoaderModelOnly ×3", "Fast Groups Bypasser"] },
        { name: "采样", nodes: ["VAEEncode", "ConditioningZeroOut", "KSampler · 8 步"] },
        { name: "放大与对比", nodes: ["SeedVR2LoadDiTModel", "SeedVR2LoadVAEModel", "SeedVR2VideoUpscaler", "easy imageConcat", "Image Comparer"] },
        { name: "输出", nodes: ["VAEDecode", "SaveImage", "PreviewImage ×3"] }
      ],
      specs: [
        ["底模", "qwen_image_edit_2511_bf16.safetensors"],
        ["文本编码器", "qwen_2.5_vl_7b_fp8_scaled.safetensors · lumina2"],
        ["VAE", "qwen_image_vae.safetensors"],
        ["LoRA", "QcartoonV1_万物皆可Q 0.8 · Anime-2000 0.4 · Lightning 4 步加速 1.0"],
        ["预处理", "ImageScaleToTotalPixels · lanczos · 0.5 倍像素量"],
        ["采样", "8 步 · euler / sgm_uniform · cfg 1（靠 Lightning LoRA 压步数）"],
        ["放大", "SeedVR2VideoUpscaler → 2048 / 4096"],
        ["输出", "3 × PreviewImage + easy imageConcat 原图对比"],
        ["节点数", "30"]
      ],
      media: {
        src: "./assets/gallery/workflow-q36-result.webp",
        alt: "Q 版化结果：红裙角色转为 Q 版造型",
        caption: "Q VERSION · 调整后",
        note: "左为原图写真，右为 Q 版化结果"
      },
      compare: {
        a: { src: "./assets/gallery/workflow-q36-source.webp", alt: "原图：红裙角色全身写真", label: "原图", meta: "真人 / 厚涂全身像" },
        b: { src: "./assets/gallery/workflow-q36-result.webp", alt: "调整后：Q 版化角色，红裙造型保留", label: "调整后", meta: "Q 版化 · 造型与配色保留" },
        note: "Q 版化只压缩头身比与五官结构，红裙的亮片、开口与袖型都留着，所以调整后还能一眼认出是同一套衣服。"
      }
    }
  };

  const TABS = [
    ["overview", "01", "概览"],
    ["structure", "02", "结构图"],
    ["pipeline", "03", "技术链路"],
    ["compare", "04", "对比"]
  ];

  const esc = (value) =>
    String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  const pad2 = (n) => String(n).padStart(2, "0");

  /* ── 各标签页的内容渲染 ───────────────────────────────────── */

  function renderOverview(data) {
    const steps = data.steps
      .map(
        (step, i) => `
        <div class="wf-ov-step">
          <div class="wf-ov-step-top"><span>${pad2(i + 1)}</span><span class="wf-ov-step-en">${esc(step.en)}</span></div>
          <p class="wf-ov-step-zh">${esc(step.zh)}</p>
          <p class="wf-ov-step-text">${esc(step.text)}</p>
        </div>`
      )
      .join("");
    const stack = data.stack.map((item) => `<span class="wf-chip">${esc(item)}</span>`).join("");
    return `
      <div class="wf-ov">
        <div class="wf-ov-copy">
          <h3 class="wf-ov-headline">${data.headline.map((line) => `<span>${esc(line)}</span>`).join("")}</h3>
          <p class="wf-ov-summary">${esc(data.summary)}</p>
          <div class="wf-ov-steps">${steps}</div>
          <div class="wf-ov-stack"><span class="wf-ov-stack-label">STACK</span>${stack}</div>
        </div>
        <figure class="wf-ov-media">
          <div class="wf-media-frame"><img src="${esc(data.media.src)}" alt="${esc(data.media.alt)}" loading="lazy"></div>
          <figcaption><span>${esc(data.media.caption)}</span><span>${esc(data.media.note)}</span></figcaption>
        </figure>
      </div>`;
  }

  function renderStructure(data) {
    const stages = data.stages
      .map(
        (stage, i) => `
        <div class="wf-flow-stage">
          <p class="wf-flow-idx">STAGE ${pad2(i + 1)}</p>
          <h4>${esc(stage.name)}</h4>
          <ul>${stage.nodes.map((node) => `<li>${esc(node)}</li>`).join("")}</ul>
        </div>`
      )
      .join("");
    return `
      <div class="wf-flow">${stages}</div>
      <p class="wf-flow-note">${esc(data.nodes)} 个节点，按数据流拆成 ${data.stages.length} 段；节点名与 JSON 里的 <code>type</code> 一致，可直接对照下载文件。</p>`;
  }

  function renderPipeline(data) {
    const rows = data.specs
      .map(
        ([key, value]) => `
        <div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`
      )
      .join("");
    return `
      <dl class="wf-spec">${rows}</dl>
      <p class="wf-spec-note">参数取自工作流文件本身，改过模型或采样步数的话以 JSON 为准；文件可在 <a class="wf-spec-link" href="${esc(
        data.href
      )}" download="${esc(data.file)}">这里下载</a>。</p>`;
  }

  function renderCompare(data) {
    if (!data.compare) {
      // 有 prompt 的工作流，把出图提示词补在分隔线上方——那块原本是空的
      const prompt = data.prompt
        ? `
            <div class="wf-cmp-prompt">
              <div class="wf-cmp-prompt-head">
                <span>PROMPT · 这段画面当时的提示词</span>
                <button class="wf-cmp-prompt-copy" type="button" data-copy-prompt>复制</button>
              </div>
              <div class="wf-cmp-prompt-body">${data.prompt.map((line) => `<p>${esc(line)}</p>`).join("")}</div>
            </div>`
        : "";
      return `
        <div class="wf-cmp wf-cmp--single">
          <div class="wf-cmp-frame">
            <img src="${esc(data.media.src)}" alt="${esc(data.media.alt)}" loading="lazy">
          </div>
          <div class="wf-cmp-copy">
            <p class="wf-cmp-kicker">SINGLE OUTPUT</p>${prompt}
            <div class="wf-cmp-pair">
              <div><span>${esc(data.media.caption)}</span><strong>单图</strong></div>
            </div>
          </div>
        </div>`;
    }
    const { a, b, note } = data.compare;
    return `
      <div class="wf-cmp">
        <div class="wf-cmp-frame">
          <div class="compare" data-compare role="slider" tabindex="0" style="--p:50%" aria-label="${esc(
            data.title
          )}：左右拉动对照原图与调整后" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <div class="compare-layer compare-b"><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy"></div>
            <div class="compare-layer compare-a"><img src="${esc(a.src)}" alt="${esc(a.alt)}" loading="lazy"></div>
            <div class="compare-divider" aria-hidden="true"></div>
            <div class="compare-handle" aria-hidden="true"></div>
            <span class="compare-tag compare-tag-a">${esc(a.label)}</span>
            <span class="compare-tag compare-tag-b">${esc(b.label)}</span>
          </div>
        </div>
        <div class="wf-cmp-copy">
          <p class="wf-cmp-kicker">BEFORE / AFTER</p>
          <h3 class="wf-cmp-headline">拖动分割线，看这一步改了什么。</h3>
          <p class="wf-cmp-note">${esc(note)}</p>
          <div class="wf-cmp-pair">
            <div><span>${esc(a.label)}</span><strong>${esc(a.meta)}</strong></div>
            <div><span>${esc(b.label)}</span><strong>${esc(b.meta)}</strong></div>
          </div>
        </div>
      </div>`;
  }

  const RENDERERS = {
    overview: renderOverview,
    structure: renderStructure,
    pipeline: renderPipeline,
    compare: renderCompare
  };

  /* ── 弹层骨架（只建一次） ─────────────────────────────────── */

  let root = null;
  let panel = null;
  let parts = null;
  let current = null;
  let lastTrigger = null;
  let activeTab = 0;

  function build() {
    root = document.createElement("div");
    root.className = "wf-detail";
    root.hidden = true;
    root.innerHTML = `
      <div class="wf-detail-shade" data-close></div>
      <div class="wf-detail-panel" role="dialog" aria-modal="true" aria-labelledby="wf-detail-title">
        <button class="wf-detail-close" type="button" aria-label="关闭详情">×</button>
        <header class="wf-detail-head">
          <p class="wf-detail-kicker"></p>
          <h2 class="wf-detail-title" id="wf-detail-title"></h2>
          <p class="wf-detail-tag"></p>
        </header>
        <div class="wf-detail-tabbar">
          <div class="wf-detail-tabs" role="tablist" aria-label="工作流详情分页"></div>
          <button class="wf-detail-back" type="button">在主页面查看全部工作流 <span aria-hidden="true">↗</span></button>
        </div>
        <div class="wf-detail-body" tabindex="-1">
          <p class="wf-detail-case"></p>
          <div class="wf-detail-panes"></div>
        </div>
      </div>`;

    document.body.append(root);
    panel = root.querySelector(".wf-detail-panel");

    const tablist = root.querySelector(".wf-detail-tabs");
    const panes = root.querySelector(".wf-detail-panes");
    TABS.forEach(([id, index, label], i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "wf-detail-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(i === 0));
      tab.setAttribute("aria-controls", `wf-pane-${id}`);
      tab.tabIndex = i === 0 ? 0 : -1;
      tab.dataset.tab = id;
      tab.innerHTML = `<span class="wf-detail-tab-num">${index}</span><span>${label}</span>`;
      tab.addEventListener("click", () => selectTab(i));
      tablist.append(tab);

      const pane = document.createElement("div");
      pane.className = "wf-detail-pane";
      pane.id = `wf-pane-${id}`;
      pane.setAttribute("role", "tabpanel");
      pane.dataset.pane = id;
      if (i !== 0) pane.hidden = true;
      panes.append(pane);
    });

    parts = {
      kicker: root.querySelector(".wf-detail-kicker"),
      title: root.querySelector(".wf-detail-title"),
      tag: root.querySelector(".wf-detail-tag"),
      caseLabel: root.querySelector(".wf-detail-case"),
      tabs: [...tablist.querySelectorAll(".wf-detail-tab")],
      panes: [...panes.querySelectorAll(".wf-detail-pane")],
      body: root.querySelector(".wf-detail-body"),
      close: root.querySelector(".wf-detail-close"),
      back: root.querySelector(".wf-detail-back")
    };

    parts.close.addEventListener("click", close);
    parts.back.addEventListener("click", close);
    root.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));

    // 遮罩层挡住的滚轮 / 触摸一律不外传，否则引擎会在弹层后面翻章节
    ["wheel", "touchstart", "touchmove", "touchcancel"].forEach((type) => {
      root.addEventListener(type, (event) => event.stopPropagation(), { passive: true });
    });
    root.addEventListener("wheel", (event) => event.stopPropagation(), { passive: false });

    root.addEventListener("keydown", onKeydown);

    // 提示词的「复制」：剪贴板不可用时退回 textarea + execCommand
    panes.addEventListener("click", (event) => {
      const button = event.target.closest("[data-copy-prompt]");
      if (!button || !current || !current.prompt) return;
      const text = current.prompt.join("\n\n");
      const done = () => {
        button.textContent = "已复制";
        button.classList.add("is-done");
        window.setTimeout(() => {
          button.textContent = "复制";
          button.classList.remove("is-done");
        }, 1600);
      };
      const fallback = () => {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.cssText = "position:fixed;top:-9999px;left:0;opacity:0";
        document.body.append(area);
        area.select();
        try {
          document.execCommand("copy");
          done();
        } catch (error) {
          button.textContent = "复制失败";
        }
        area.remove();
      };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
      else fallback();
    });

    window.addEventListener("resize", () => {
      if (!root.hidden) tunePanelHeight();
    });
  }

  function tunePanelHeight() {
    // 窄屏 / 矮屏时按可视高度收紧，避免面板顶到底部页签条
    panel.style.setProperty("--wf-h", `${Math.min(window.innerHeight - 32, 772)}px`);
  }

  function selectTab(index, focusTab) {
    activeTab = index;
    parts.tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      parts.panes[i].hidden = !on;
    });
    if (focusTab) parts.tabs[index].focus();
    parts.body.scrollTop = 0;
    // 分页切回来时对照滑块要重新量一次尺寸
    const slider = parts.panes[index].querySelector("[data-compare]");
    if (slider) window.setupCompare?.(slider);
  }

  function fill(data) {
    parts.kicker.textContent = `COMFYUI / WORKFLOW ${data.index}`;
    parts.title.textContent = data.title;
    parts.tag.textContent = data.tag;
    parts.caseLabel.textContent = data.caseLabel;

    parts.panes.forEach((pane) => {
      const renderer = RENDERERS[pane.dataset.pane];
      pane.innerHTML = renderer(data);
    });
    selectTab(0);
  }

  function open(id, trigger) {
    const data = WORKFLOWS[id];
    if (!data) return;
    if (!root) build();
    current = data;
    lastTrigger = trigger || null;
    fill(data);
    root.hidden = false;
    tunePanelHeight();
    parts.body.scrollTop = 0;
    requestAnimationFrame(() => root.classList.add("is-open"));
    parts.close.focus({ preventScroll: true });
  }

  function close() {
    if (!root || root.hidden) return;
    root.classList.remove("is-open");
    const finish = () => {
      root.hidden = true;
      current = null;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
    else window.setTimeout(finish, 220);
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
    lastTrigger = null;
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    const inSlider = event.target.closest?.("[data-compare]");

    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) && !inSlider) {
      if (!event.target.closest(".wf-detail-tabs")) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === "Home") selectTab(0, true);
        else if (event.key === "End") selectTab(TABS.length - 1, true);
        else selectTab((activeTab + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length, true);
        return;
      }
    }

    if (event.key !== "Tab") return;
    // 焦点圈在面板里
    const focusables = [...panel.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter(
      (el) => !el.disabled && el.offsetParent !== null
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  }

  /* ── 绑定卡片上的入口 ─────────────────────────────────────── */

  const bind = (scope) => {
    scope.querySelectorAll("[data-workflow]").forEach((trigger) => {
      if (trigger.dataset.workflowBound) return;
      trigger.dataset.workflowBound = "1";
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        open(trigger.dataset.workflow, trigger);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bind(document));
  } else {
    bind(document);
  }

  window.workflowDetail = { open, close, data: WORKFLOWS };
})();
