# Leo — 个人作品集（基于 kora 真实源码改造）

不是仿制，是**在原项目源码上改的**。所有 3D 模型、着色器、物理、滚动逻辑、过场动画都是 kora 线上那份原文件，只换掉了文案、品牌与内容层。

## 仓库与发布

- 仓库 `GyroJolyne/student2`，分支 `main`，入口为仓库根目录的 `index.html`。
- Cloudflare Pages 走 Git 集成，静态站点无需安装依赖或构建命令，**发布目录 = 仓库根目录**。
- 首次接入与子域名绑定（`student2.town-slacker.top`）由域名管理员处理；之后更新 `main` 即自动发布。
- 原占位页的 `noindex, nofollow` 已随入口替换消失，当前页面允许被收录。
- 每人只使用自己的仓库，不改主站仓库；不使用账号级 Pages Write 令牌作为单人权限。

## 与平台约定的对应

| 约定 | 本仓库的处理 |
|---|---|
| 禁止提交个人手机号 | 已从 `index.html` 联系方式块与 `profile.html` 信息表中移除，仅保留邮箱 |
| 单文件不超过 25 MiB（Cloudflare Pages） | `video-02.mp4` 66 MB → 18.7 MB，`video-05.mp4` 54 MB → 18.1 MB，720×1280 与时长均未变；现有最大单文件 23.1 MB |
| 禁止提交密码 / 令牌 / 身份证 | 未包含；`.gitignore` 保留 `.env*`、`*.pem`、`*.key` 规则 |
| 需要登录、数据库或 AI 接口时另设计后端 | 本站为纯静态，无后端依赖 |

## 运行

```bash
cd portfolio
python serve.py --port 8080
```

打开 `http://127.0.0.1:8080/`。本地服务支持 HTTP Range 分段请求，视频可拖动进度；不要用 `file://` 直接打开。

**不能用 file:// 直接双击**：`.glb` 模型走 fetch，file 协议会被 CORS 拦。

---

## 重要修复：卡在兔子 loader（2026-11-14）

现象：打开后永远停在居中那只兔子，滚轮、点击全部无响应。

原因是一条链，不是单点：

1. 托管环境的 CSP 把 `blob:` 放进了 `img-src` / `default-src`，**但没有放进 `connect-src`**
2. GLTFLoader 默认用 `ImageBitmapLoader`，它靠 `fetch(blob:...)` 读取 GLB 内嵌贴图 → 被 CSP 直接拒绝
3. 贴图返回 `null`，引擎在 `assignTexture` 里执行 `o.encoding = ...` → `TypeError: Cannot set properties of null`
4. 异常中断了 `Promise.all`，`world` 的 `load` 事件永不触发
5. loader 的解除条件是 `world.addEventListener("load", ...)`，所以永远停在那里

**修法**（`index.html` 里 `<script src="./js/script.js">` 之前的一段垫片）：

```js
window.createImageBitmap = undefined;
```

GLTFLoader 内部有 `typeof createImageBitmap === "undefined" ? new TextureLoader() : new ImageBitmapLoader()` 的分支，置空后自动回退到 `TextureLoader`（img 标签 + blob URL），而 `blob:` 在 `img-src` 中是放行的。

副作用：贴图解码少一次 `createImageBitmap`，这点量级可以忽略。

---

## 结构

| 屏 | 原站 | 现在 | 内容载体 |
|---|---|---|---|
| 1 | Brand strategy | **首页** | AI Production Engineer 职业档案 + 3D 紫灰熊与网格地面 |
| 2 | Digital experiences | **作品展示** | 三个独立切换页面：游戏宣发四列作品墙（24 张）、人像写真错落墙（17 张）、商业海报错落墙（12 张），均可纵向滚动 |
| 3 | 视频章节 | **视频作品** | 5 部 H.264/AAC MP4，原生播放器与旁侧解说文案纵向排列 |
| 4 | 扩展内容 | **LORO** | 两个已训练模型及 ModelScope 文件页链接 |
| 5 | 扩展内容 | **ComfyUI 工作流** | 4 份可下载 JSON 工作流 |
| 6 | Selected work | **关于我** | AIGC、ComfyUI、Agent、AI Coding 能力摘要 |

交互与动画全部保留：载入吉祥物、滚轮翻屏、底部 6 点分镜器、`EXPLORE` 圆环、鼠标视差、移动端适配。

`profile.html` 是独立简历页；`scene.html` 保留沉浸式主视觉布局，入口页 `index.html` 采用档案式首屏。

## 相对原站做过的三类改动

**1. 移除别人的品牌标识**

首屏那四个立体字母是模型里的 `Logo` / `LogoPart_1~5` 节点（几何体形状固定就是 kora 字标，改文字贴图改不掉形状）。在 `loadGLTF` 的加载回调里遍历隐藏：

```js
t.scene.traverse(o => {
  const n = (o.name || "").toLowerCase();
  (n === "logo" || n.indexOf("logopart") === 0) && (o.visible = false);
});
```

**2. 字体本地化**

原 `style.css` 首行是 `@import "https://fonts.googleapis.com/..."`，同样被 CSP 的 `style-src`（回退到 `default-src 'self'`）拦掉，导致全站回退成 Arial。现已改为本地 `@import "./fonts.css"`：

- `fonts/` 37 个 woff2，共 2.87 MB，只保留 latin / latin-ext 子集
- 中文不下载（Noto Sans JP 的中文子集每个几百 KB），走系统字体回退，观感正常

**3. 内容层（职业档案、作品与关于信息）**

- 桌面端 `.leo-panel` 固定在左侧，仅随当前章节显示；暗紫渐变向右淡出，与 3D 场景衔接，长内容可在面板内滚动。
- 首页以职业档案为主，直接呈现 AI Production Engineer 身份、AIGC/ComfyUI/Agent/AI Coding 简介，以及联系方式和学历。
- 移动端（≤640px）信息栏改为底部面板，高度最高 46vh、保留滚动；上半屏继续展示 3D 场景。
- 第 2 屏保留三个分类页签。游戏宣发 24 张作品按四系列排成桌面四条**独立纵向滚动泳道**：鼠标停在哪一列，滚轮就只推动该列，其他列保持位置；平板两列各自可滑，手机回退为单列自然滚动。保留原图比例和聚焦预览。人像写真（17 张）与商业海报（12 张）分别只取对应目录素材，按文件名自然顺序分列为作品墙。
- 画廊、视频、LORO 与工作流页将滚轮交给对应内部滚动容器，隔离场景滚动事件；支持触摸与键盘浏览。滚至边缘不自动跳章，使用底部圆点或章节导航按钮切换。章节跳转直接提交目标页，由内容页 CSS 淡入，不再等待原来约 2 秒的 WebGL 漫长过渡；不透明内容页静止与切换期间跳过其后方 WebGL 逐帧渲染，降低滚动争抢资源。
- 视频章节位于第 3 位；新增 LORO 与 ComfyUI 工作流章节并移除末尾联系方式章节后，顺序为：首页 → 作品画廊 → 视频作品 → LORO → ComfyUI 工作流 → 关于。`js/section-extension.js` 同步六章数组、视觉索引与 6 点时间轴；原联系场景仅保留为 Three.js 变换模板，不再可导航。
- 视频素材从 `C:/Users/XLM/Desktop/M/video` 只读复制到 `assets/video/video-01.mp4` 至 `video-05.mp4`；源文件为 MP4/H.264（AVC）+ AAC，480×854 或 720×1280，约 10–25 秒。`poster-01.png` 至 `poster-05.png` 是本地海报帧。视频页以五条简单纵向内容列直接展示原生播放器，旁侧配对应说明；`serve.py` 提供 HTTP Range 分段响应，支持拖动进度。
- LORO 采用两组大图、右侧资料格和下方作品带；Q 版主视觉指定为 `1_end.jpg`，作品带换成提供的 Q 版图；新海诚风格页换为用户提供的天空、人物与街景图。工作流仍为四张双列文图卡片：Krea2 卡片使用 `Clipboard_Screenshot-3`（Pyro Heart 视觉），一键转 Q 版卡片使用 `36_end.jpg`；其余工作流下载与节点详情不变。
- 末尾“联系方式”章节已按要求移除；个人资料区域仍保留已有联系信息。
- 排版延续小标题宽字距、中文正文充足行高与低对比度紫灰色系；`EXPLORE` 圆环保持轻描边。

## 改文案要动哪里

**HTML** —— 普通标签，直接改：

- 页头字标：`<text>leo</text>` 与 `AI PRODUCTION & ENGINEERING`
- 首屏标题：`.leo-profile-role` 或 `.leo-hero-title`（取决于入口布局）
- 第 2 屏作品画廊由 `js/gallery.js` 与 `assets/gallery/` 管理；视频源文件和封面位于 `assets/video/`，原生播放器与解说文案位于两个入口 HTML，滚动/章节导航由 `js/video-gallery.js` 管理；LORO 与 ComfyUI 卡片位于 `index.html` / `scene.html`，工作流副本位于 `assets/workflows/`；旧作品信息面板已移除。
- 关于文案：`.leo-panel-lead` / `.leo-panel-body` / `.leo-tags`
- 首页档案中的联系方式：`.leo-profile-block` 对应联系信息
- 页脚版权、6 个分镜按钮的 `aria-label`

**JS（`js/script.js`）** —— 文案埋在压缩代码里，共 6 处，按字符串搜：

| 搜这个 | 作用 |
|---|---|
| `"LEO","COUNTDOWN\|OVERLAY"` | 8 格文字图集，3D 切片上的项目名 |
| `"Title" / "Transparents" / "Flexible"` | 第 2 屏旧 3D 装饰节点，加载时移除 |
| `"LEOABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"` | 噪点乱序动画的字符集 |
| `./assets/gallery/*.webp` | 当前 53 张作品图：`campaign-character` / `campaign-night` / `campaign-beast` / `campaign-runway` 为游戏宣发；`portrait-photo` 为人像写真；`commercial-poster` 为商业海报 |
| `./assets/video/video-*.mp4` | 第 3 章 5 部可播放视频；配套 `poster-*.png` 为对应视频帧缩略图 |
| `"AIGC / AGENT / BUILT FOR PRODUCTION"` | 第 6 屏关于页背后巨幅文字 |
| `this.textList=[...]` | 首页与作品页字幕文案 |

画廊数据、图片自然顺序和切换逻辑在 `js/gallery.js`；样式在 `css/gallery.css`，两种入口都引用。人像写真和商业海报改为桌面四列、平板两列、手机单列的错落作品墙，图片保留原始比例、方向与分类隔离。视频页由 `js/video-gallery.js` 管理内部滚动与章节导航，原生视频和说明文案写在两个入口的 HTML；LORO / ComfyUI 页面样式在 `css/video-gallery.css`。`js/section-extension.js` 将视频、模型与工作流接入第 3–5 主章节并从底层章节数组移除最后联系场景，页面共六章。`assets/workflows/` 保存从指定 ComfyUI 目录只读复制的 4 份 JSON 文件，网页提供下载。`serve.py` 是本地预览入口，使用标准库并支持 HTTP Range，便于 MP4 元数据读取与时间轴定位。

## 设计令牌

- 底色 `#000`，场景内衬 `#08080c`
- 强调色 `#c8c3f2`，正文 `#eeeaf8` / `#a9a4bd`
- 字体：Jura（标签）、Roboto Serif（句子）、Noto Sans JP（正文）、Arial（3D 贴图字形）

## 自己截图验收

本机 Chrome 无头模式用 `--screenshot` 完全不出图，但**走 CDP 可以**。工具在 `../_diag/final.mjs`：

```bash
cd ../_diag
node final.mjs "http://127.0.0.1:8080/" 2 1440 900 out.png
#                        URL          屏号  宽    高    输出
```

启动器用 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` 保证软件渲染也有 WebGL。

**注意**：切屏动画在软件渲染下很慢，`sleep` 要给足（≥15s），并且**每个屏单独开一次会话截图**，否则拿到的会是上一屏的合成帧。

## 吉祥物与 3D 字标（本轮改版）

### 1. 兔子 GLB → 独立悬浮紫灰熊头图标（改造原模型，非重建）

**不新建一只熊，而是把原站的紫兔子改成独立熊头图标**——保留原模型的质感管线（自定义着色器 `Ch` + 全屏共用的分屏配色），头部由运行时几何重建；原脚、尾巴、耳朵和眼睛节点隐藏，避免旧兔子零件叠加。

原模型 `assets/scene/kora-bunny.glb` 是 8 个**静态网格**（无骨骼、无动画）：`body / earLeft / earRight / eyeLeft / eyeRight / tail / footLeft / footRight`。`eyeLeft/Right` 是 `body` 的子节点，其余是 `Rabbit` 的子节点。加载回调里每个网格都被换成深色材质再包进 `Ch`，所以它的「紫」原本不是固有色，是边缘光打出来的。

**改造全部在 `js/script.js` 注入块里完成**（搜索 `BEAR_ERR`），步骤：

1. **头：椭球 + 高度剖面**。`RX/RY/RZ = 0.264/0.294/0.282`（纵向比横向长 11%）。剖面 `pf(t,u)` 一次做三件事：额线收 7.8%、下颌收 3% 收出下巴、颏上微鼓 1.5%；再加 `0.056·exp(-((u/0.50)²+((t+0.15)/0.34)²))` 鼓出一块**吻部**——鼻子和嘴就长在这个鼓包上，不再另贴一块面部网格（贴过，正面没有光，必然读成一块深色面具）。
2. **躯干**：旋转体（lathe）剖面 `TR` 直接做出**肩—腰—胯**三段，最宽 0.452（肩）、最窄 0.40（腰），前后压扁 12%。躯干顶端半径 0.226 比该高度上的头宽还大，头是「长进肩膀里」而不是「搁在桶上」。
3. **四肢：旋转体一体化**。`_limbGeo()` 沿轴变半径、两端球冠收口，脚底再按 `flatB` 把球冠压扁成圆角平底；`bend` 参数让踝部前弯，**弯度同时写进解析法线**，脚背过渡才顺。臂、腿、耳、圆球全部由 `_lathe()/_sphere()` 生成，没有一处是「一堆球拼起来」。
4. **耳：耳壳自带浅碟**。耳不是球，是一条沿 `+Z` 的旋转体剖面 `EAR`：正面一圈边缘（r=0.056 处最高 0.034）+ 中间浅碟（中心 0.026，落差 8‰ 的半径），所以有「轻微内凹」，也和头顶连成一体。半径比上一版小 15%。
5. **五官**：眼缩到 15%～20%（`scale 0.64/0.48/0.44`，约 0.062×0.061 的半轴），并**按脸面法线只做 yaw 摆正**，否则外侧会被颊面切掉一半，看着像半闭眼。眼的 albedo 线性 `0.076/0.064/0.112`、roughness 0.34——深紫灰玻璃，只剩一枚柔和高光。鼻 `0.026/0.019/0.017`、roughness 0.66；嘴是一条贴合吻部的 triangle strip，半宽 0.0048→端部 26%。
6. **材质：紫灰陶瓷**。全站用四色：#817695 主体（线性 `0.220/0.181/0.300`）、#A99BCB 耳（`0.397/0.328/0.597`）、#D0C6E5 淡银紫（面部位混色）、#292435 五官（`0.022/0.018/0.036`）。
7. **打光改写**。原式 `outColor += EF * (0.5 + uRimLight*0.3)` 是 fresnel（`pow(1-d,5)`），只在极掠射角陡增，再叠上单侧主光就是「右边一圈白边、左边死黑」。换成两层：
   - 宽而柔的边缘光 `vec3(0.86,0.80,1.00) * (0.036 + 0.052*pow(1-dNV,1.5)) * (0.55+uRimLight*0.45)`
   - 面向镜头的补光 `mat.diffuseColor * (0.15 + 0.30*pow(dNV,1.6))`，把「头亮身体黑」的落差压平
   - 末尾把 `gl_FragColor` 换成 `outColor = 1.0 - exp(-outColor*1.05)`，高光软压缩，不会出现过曝白团。
8. **构图**。`_b.position.y += 0.135`、`i.scale/position ×0.86`（绕原点缩放，不跑位）；窄屏（<700px）再 ×1.08。

**为什么不能 `mesh.clone()`**：这些网格已经被包成 `Ch`（`extends SkinnedMesh`，构造签名 `(geometry|mesh, opts)`）。`clone()` 会用 `(geometry, material)` 调构造器，直接抛
`Cannot use 'in' operator to search for 'isBufferGeometry' in undefined`。正确做法见 `_mk()`：`new Ch(geo,{uniforms:{}})` 建，再把源材质的 `vertexShader / fragmentShader / defines / uniforms` **按引用**搬过去；颜色/粗糙度/金属度换成各自的新对象，否则所有零件共用一份值、整只熊一个色。

**零件坐标表**（body 局部坐标，头心 y=CY≈0.251，下表 y 相对头心）

| 部位 | 位置 | 尺寸（半轴/半径） |
|---|---|---|
| 头（球化后的 body） | 中心 (0, CY, −0.002) | 0.264 / 0.294 / 0.282 + 吻部鼓包 |
| 耳 ×2 | (±0.132, CY+0.262, 0.012)，外倾 0.16 rad | 半径 0.100，厚 0.084（带 8‰ 浅碟） |
| 眼 ×2 | (±0.089, CY+0.094, 面 +0.004) | 0.062 × 0.061 × 0.043 |
| 鼻 | (0, CY−0.030, 面 −0.004) | 0.026 / 0.019 / 0.017 |
| 嘴（细带） | y = CY−0.074+0.012t²，x = 0.045t | 半宽 0.0048→端部 26% |
| 躯干 | (0, CY−0.395, −0.008) | 高 0.428，最宽半径 0.226，Z×0.88 |
| 手臂 ×2 | (±0.212, CY−0.408, 0.026)，外摆 0.10 rad | 长 0.150 + 端帽 0.053/0.046 |
| 腿 ×2 | (±0.094, CY−0.612, 0.010) | 长 0.140 + 端帽 0.076/0.092（平底） |

整只熊高约 1.08，头占 51%，头宽 0.528 / 肩宽 0.452。

**坑**（按踩坑顺序）

0. **旋转体的法线符号**：`P(θ,t)=(r cosθ, y, r sinθ)` 的 `dP/dθ × dP/dt` 指向**内侧**，法线要取反 `(y'cosθ, -(r'+s·g'·y'), y'sinθ)`。写错时物体是「亮面朝里」，整条手臂/躯干会黑成一坨——现象和「材质没生效」一模一样，很容易误判。
1. **剖面数组必须按 y 递增**。耳壳剖面一开始是从前缘往后缘写的（y 递减），`dy` 变负，法线整体翻转，耳朵直接变黑。
2. **`_lathe` 里用到 `_g`，会踩 TDZ**：`const _g=_b.geometry` 必须在第一次调用 `_lathe/_sphere` 之前声明，否则 `Cannot access '_g' before initialization`。
3. **绝不能在改造后的几何上 `computeVertexNormals()`**。这颗球来自 GLB，顶点按面拆开，重算的法线逐面跳变 → 线上高光一照就是满身三角面。自己生成的 lathe 几何是共用顶点的，才可以用。
4. **`Ch` 是 `SkinnedMesh` 子类**，新建网格要补 `isSkinnedMesh=!1; skeleton=null`。
5. **`uniforms.color` 必须是 `{value:Vector3}`**，且可能是另一个 three 副本的 Vector3，统一写 `.x/.y/.z`。
6. **零件尺寸是「绝对半径」不是缩放倍数**：`_put()` 按各自几何半径换算缩放；拿眼睛几何当鼻子又按球半径给尺寸，会得到一颗 11 倍大的深色椭球把脸糊住。
7. **注入点是逗号表达式链的一环**，块内可写分号，但**整块末尾的 `,` 不能丢**，否则后面的 `null===(e=this.onLoaded)` 会断。
8. **截图前先关缓存**：CDP 会话用的是持久 profile，改完 CSS 刷新拿到的可能是旧样式（表现为「抽屉默认就展开了」）。脚本里补 `Network.setCacheDisabled`。
9. **相机是离轴透视**，耳朵/眼睛在画面上天然左右不等大，这是透视不是 bug。

### 1.1 熊头图标比例精修（v2）

本轮只调整吉祥物自身几何参数，不改场景、灯光系统、相机、滚动控制、鼠标交互、悬停、转场或原有动画接口：

- 耳朵整体缩小约 8%，并略微收窄左右间距，降低“兔耳/毛绒玩具”观感。
- 眼睛横向与纵向尺寸同步微收，位置向面部中心靠拢，保持双眼对称。
- 鼻子体积微缩，嘴部弧线收短并变细，让五官更接近独立品牌图标。
- 保留紫灰陶瓷材质、面部柔和补光、悬浮呼吸与轻微转头动画。

验证状态：`node --check` 语法检查通过；本轮未完成真实浏览器 WebGL 截图验收，因此不能把外观效果标记为已通过最终视觉验收。建议在本地 HTTP 服务中打开后重点检查正面、三分之四和侧面轮廓。

### 2. KORA → LEO

3D 字母不是模型里烘焙的，而是运行时用内嵌的 **Helvetiker 字体**（`Xl` 字符串 → `FontLoader.parse` → `Yl`）生成 `TextGeometry`，再由 `Jl(mesh, letter)` 拉伸填满原槽位包围盒。所以改字只要改数组：

```js
const t=["L","E","O"];        // 原 ["K","O","R","A"]
if(e>=t.length)return void(n.visible=!1);   // 多出来的槽位自动隐藏
```

注意两件事：

- 原数组有 4 个字母、5 个槽位，后面写死的 `LogoPart_4` 会取到 `undefined` 并抛错 → 已改成 `meshList.forEach` + `meshList[i]&&` 的保护写法。
- 只有 3 个字母后需要重新布点，否则会挤在左侧。现在是右下角竖向散落：`[[.74,.52,1.0],[1.4,-.04,.82],[.9,-.74,1.06]]`，缩放 `.48`，并给每个字母一点 Z 轴小角度斜置。

字母表面用的是 `matCap` 贴图（`eh` 类），颜色取自网格材质的 `emissive`，观感与原版一致。

### 3. 加载页图形

`index.html` 里 `.kora-loader-bunny` 的 SVG 由"两只长椭圆耳 + 头 + 两只脚"改成"两个圆 + 头 + 两只脚"，仍是双图层（浅色描边层 + 黑色实心层 + 两个亮点当眼睛）。因为下面还有一层黑色实心同形状，所以**只改一组不够，两组都要改**。

## 章节切换动效（2026-11-16）

参考 `eason-portfolio.top` 的 reveal 语言重做了翻章交互。三处改动互相咬合，单独改一处会破坏观感。

### 1. 过渡曲线：0.72s expo-out

原来三个内容页只有 `transition:opacity .3s ease`，而且 `visibility` 没有延迟——离场时 `visibility` 立即变 `hidden`，页面是**瞬间消失**再谈淡出，所以显得硬。

现在统一为：

```css
opacity / transform  0.72s cubic-bezier(.16,1,.3,1)
visibility           0s linear .72s   /* 离场：等淡出走完再隐藏 */
.is-active           visibility 0s linear 0s  /* 入场：立刻可见 */
```

入场额外带 `translate3d(0,26px,0) scale(.994)` → `none`。涉及 `.photo-gallery`（`css/gallery.css`）、`.video-showcase` / `.resource-showcase`（`css/video-gallery.css`）。

**坑**：`.photo-gallery` 一旦带 `transform` 就成了 `position:fixed` 的包含块。页面内的 `.photo-gallery-sticky`（浮动页签）原本靠 `fixed` 定位，离场时会退化成 `absolute`。因为 `.photo-gallery` 是 `inset:0` 的全屏容器，两者的计算结果一致，所以看不出跳变——但**不要**给它加 `translate` 以外的位移或改容器尺寸，否则页签会跑位。

### 2. 内容阶梯进场

`.is-active` 重新加上时触发 `chapterRise`（262 → 0，26px 上浮），用 `animation-fill-mode: backwards` 而不是 `both`——`both` 会把结束帧的 `transform:none` 一直挂在元素上，`.workflow-card:hover` 的位移就被吃掉了。

延迟节奏：标题 0.06s → 页签 0.12s → 引导块 0.18s → 泳道/卡片每档 +0.06~0.07s。

### 3. 遮住 WebGL 硬切：冻结帧交叉溶解（别再压黑）

引擎切章是相机**瞬移**到目标章节。内容页淡入前的那一瞬会直接暴露目标场景，看起来像"闪一下"。

> 早期做法是给 `<body>` 打 `data-chapter-moving`，CSS 把 `#canvas` 瞬时压到 `opacity:0`、140ms 后淡回。问题是 `body` 底色是纯黑，压黑期间就是**一块黑屏**——这就是后来用户反馈的"翻章闪黑"。**不要再退回这套做法。**

现在的做法（`js/chapter-motion.js`）：

1. 切章前，把 `#canvas` 当前帧 `drawImage` 到一张同尺寸的 `.chapter-freeze` 画布上，`position:absolute;inset:0;z-index:0`（和画布同层，DOM 顺序在后 → 盖在画布上、内容页之下）；
2. 引擎照常硬切（观众看到的是冻结的旧帧）；
3. 下一帧起，冻结层按 0.52s expo-out 淡出，新画面自己浮现。

`#canvas` 的 `opacity` 全程不动，黑场从结构上就不可能发生。

三个实现约束，改之前先读：

- **必须放在 rAF 里**。这个 WebGL 上下文没开 `preserveDrawingBuffer`，帧缓冲一旦被合成器清掉就再也读不到——在普通事件回调里 `drawImage` 只能得到全透明。所以 `withFreeze()` 把「冻结 + 真正切章」一起推迟一帧（~16ms，肉眼无感）。
- **不要用 `getImageData` 做校验**。它会强制 GPU→CPU 全量回读，软件渲染下实测单次 **1.2s**，直接把切章钉死；而 `drawImage` 只要 **6ms**。拷贝失败时 2D 画布本来就是透明的，等于没盖东西，绝不会变黑，所以也不需要校验。
- **一个动作只冻一次**。`goToSection` 内部还会再调一次 `scroller.move`，第二次冻到的已经是切换后的新帧，反而把硬切暴露出来。`withFreeze()` 用 120ms 窗口去重。

两条切章入口都要挂：`main.scroller.move`（滚轮）与 `main.goToSection`（程序/圆点/键盘）。`body[data-section]` 是 1-based，判断"是否真的换了章"要 `-1` 换算。

### 4. 切换节流

`mainScene.goToSection` 被包装了一层 620ms 冷却，避免惯性滚轮一次连翻两三章。冷却期内的重复请求不丢弃，合并成最后一次，在冷却结束时补发——快速连点导航不会"点了没反应"。

### 5. 底部章节导航

6 个裸圆点升级成玻璃胶囊：`data-state` 由引擎的 `changeTimelineSection()` 驱动（`ready` / `passed` / `viewing`），当前项换成淡紫亮球 + 光环，每个按钮里补了 `.tl-label`（文字取自原 `aria-label`），hover / focus / 当前章节时浮出。移动端（≤800px）隐藏文字标签。

## 作品页：漂移墙

「游戏宣发」页不再是四条独立滚动的泳道，改成参考 reactbits Drift Wall 的透视漂移墙，实现在 `js/drift-wall.js` + `css/gallery.css` 末尾。

**机制**

- 素材一次性铺成一条扁平淡池（24 张），按 `i % columns` 轮流分到各列，所以每列都是混合系列，看起来才像一整面墙。
- 每列把内容渲染**两份**，位移量取「一份的精确高度」`seq.length × (tileH + gap)`，因此动画从 0 走到 `-shift` 时第二份正好顶上来，循环无缝。**不能用 `translateY(-50%)`**：轨道里的 `gap` 只有 n−1 个，半高会比一个周期少半个 gap，每轮回跳半格。
- 相邻列 `animation-direction` 相反（even 向上 / odd 反向），速度按 `[0, .24, -.16, .32, -.08, .18]` 抖动，负 `animation-delay` 错开相位。
- 列数不写死，按 `视口宽 × 1.08 ÷ (tileW + colGap)` 计算（3–9 列），所以宽屏 7 列、手机 4 列，两侧瓦片自然出血被裁。
- 指针视差只写 `--sx / --sy` 两个 CSS 变量（`requestAnimationFrame` 合并），平面 transform 里用 `calc(var(--sy) * 2.4deg)`，不触发布局。
- 悬停的**列**暂停（`.drift-column:hover .drift-track`），瓦片 `translateZ(104px)` 抬升、其余瓦片压到 `.58`。这样点击不会追着跑的图跑。
- 上下边缘用 `.drift-page::after` 的 `#070c0e` 渐变盖住，配合墙面自身的径向 mask；否则瓦片会在页面上下边界被硬切一条直线。

**踩过的两个坑**

1. `.drift-wall:hover .drift-tile`（3 个类）会压过 `.drift-tile:hover`（2 个类），悬停项永远是暗的。压暗规则必须写成 `.not(:hover):not(:focus-visible)`。
2. 画廊是 `inset:0` 的全屏覆盖层，**引擎收不到滚轮**（它的监听挂在画布那一侧），所以墙面的滚轮必须自己 `preventDefault` 再调 `mainScene.goToSection(2 / 0)`，否则整页滚轮是死的。

**其它**

- 点击瓦片复用原来的 `.photo-lightbox`；`aria-hidden` 的第二份只作视觉循环，不进 Tab 序列。
- 「人像写真」「商业海报」两页仍是原有的 masonry，未改。

## 视频章节：环形画廊

五张卡片排成一条环，实现在 `js/video-gallery.js` 与 `css/video-gallery.css` 末尾。

**几何**

每张卡相对当前进度算一个环绕偏移：

```js
let off = (((i - progress) % total) + total) % total;
if (off > total / 2) off -= total;      // 折到 [-n/2, n/2]
x = off * step;                          // step = 卡宽 × 1.16
y = 34 * off * off;                      // 弧线下沉
rotateY = -off * 16deg;                  // 侧向转体
scale = max(.74, 1 - |off| * .065);
opacity = max(0, 1 - |off| * .28);
```

`progress` 是浮点进度，`target` 是吸附目标；`requestAnimationFrame` 里按 `diff * .17` 逼近，停下时归零。**取模折返**这一行是关键：它让第 1 张左边接上第 5 张，环才是闭合的，否则首帧只有半个屏幕有内容。

**交互**

- 拖拽：横向位移 ÷ step 直接写进 `progress`，松手按 `round(progress + moved * .6)` 吸附。
- 指针捕获**只在位移超过 6px 后才启用**。一开始就 `setPointerCapture`，`click` 会被重定向到舞台元素，卡片永远点不开（踩过）。
- 滚轮：一次一格，46px 阈值 + 220ms 归零，**环形无限循环**——第 5 张的下一个就是第 1 张。转满一圈（`cycleSteps > total`）之后继续同方向滚，才翻到上一章 / 下一章；`cycleSteps` 用 4 秒的空闲计时器清零，慢慢看的人不会被误判。
- 点击：命中的是中心卡就直接播；不是中心卡就先转到中间，**停稳后自动开始播**——一次点击完成「看这张」，不用点两下（`pendingPlay`，在 `tick()` 归零那一帧兑现）。
- 播放是**卡片内就地**的：`.video-card-inline` 绝对定位铺满卡片，不弹层、不跳页。`video.src` 按需挂上，关闭时 `removeAttribute('src') + load()` 释放解码器——五条片合计 164 MB，不能同时挂着。
- 键盘：聚焦到舞台（`tabindex=0`）后 `← →` 切卡（环形）、`Home/End` 到首尾；`↑ ↓` 任何位置都由引擎翻章；`ESC` 收回就地播放。
- **滚轮按指针位置分工**：指针压在卡片带上 → 只转卡片（无限循环，不会离开本章）；指针在别处（标题 / 字幕 / 空白）→ 直接 `goToSection(3 / 1)` 翻章，和其他章节手感一致。

  **坑**：不能用 `event.target.closest('.video-card')` 判断。卡片在环形里一直在动，光标很容易正好落在两张卡的缝隙里，那一帧 `target` 是舞台容器，会被判成"别处"直接翻章。改成 `isOverCarousel()`：拿所有卡片的 `getBoundingClientRect()` 外扩 40px 取并集，光标落在并集里就算在卡片带上——转卡过程中这片区域不变，判定才稳定。

**坑：负 `translateZ` 会让卡片点不动**。原先深度用 `translate3d(x, y, -|off|*42px)` 表达，`.video-arc` 带 `preserve-3d`，卡片就落到容器平面之后；Chromium 的 3D 命中测试优先命中容器，`elementFromPoint` 一律返回 `.video-arc`，侧边卡片整片死区（中心卡 z=0 才正常）。深度改由 `scale` 表达、`translateZ` 归零即可。排查手法：`elementFromPoint` 在卡片矩形里取九宫格采样，看命中是 `CARD` 还是容器。

**排版坑**：标题块压在弧线上，靠 `.video-showcase-shell::before` 的径向渐变撑出一块暗底。这块遮罩的 `z-index` 必须小于标题（5）、大于舞台（1）；挂在标题自身上用 `z-index:-1` 会掉到舞台下面，等于没加。

## 章节切换：只有滚轮，没有按钮

原来每一章底部都挂两个「← 上一章 / 下一章 →」按钮。这套按钮已经全部删掉（`gallery.js` / `video-gallery.js` 动态创建的两组、`index.html` / `scene.html` 里 LORO 与工作流的两组），改为滚轮统一翻章：

- **漂移墙**（`.photo-gallery` 第 0 页）没有内部滚动，滚轮直接翻章：上滚回首页、下滚去视频。
- **砌体页**（人像写真 / 商业海报）先滚自己的内容，`scrollTop` 到顶 / 到底后继续滚才翻章。
- **LORO / ComfyUI** 同理：`.resource-showcase` 内部滚动到边界后，滚轮交给章节。
- **视频** 例外：滚轮先转环形画廊（见下节），转满一圈再继续滚才离开。

统一用 `window.__navLock`（`performance.now()`）做 620ms 冷却，防止一次连续滚动连翻两三章。

**坑：`document.body.dataset.section` 是 1-based**，比 `world.sections` 的实际索引大 1。拿它算上一章 / 下一章必须先 `- 1`，否则从 LORO 往下会直接跳到「关于我」，把 ComfyUI 那一章跳过。

## 工作流详情：四张卡共用同一个弹层

四张卡片原来的「查看详情」是 `<details>`，在卡片里就地展开一段文字。现在统一成一个弹层（`js/workflow-detail.js` + `css/video-gallery.css` 末尾 `.wf-detail-*`）：

- **结构只有一份**：`build()` 里建一次 DOM（关闭按钮 / 标题区 / 四个分页 / 内容区），之后所有卡片复用同一个节点，只换数据。
- **数据与视图分离**：`WORKFLOWS` 是一个以 `data-workflow` 为键的对象，卡片上写 `<button data-workflow="qwen-chibi">`，点谁就把谁的数据填进去。新增一条工作流 = 往 `WORKFLOWS` 加一项 + 卡片上写个 id，不用碰样式。
- 数据取自 `assets/workflows/` 那四份 JSON 的真实节点类型与参数（底模、LoRA 强度、采样步数、分辨率、放大档位），不是编的。

四个分页固定为 **01 概览 / 02 结构图 / 03 技术链路 / 04 对比**：

| 分页 | 内容 |
|---|---|
| 概览 | 两行大标语 + 说明 + 三列步骤（序号/英文码/中文/一句解释）+ STACK 标签行 + 右侧主图 |
| 结构图 | 按数据流拆的 4–5 段，每段列出该段的节点 `type`，段间有连接箭头；底部标注节点总数 |
| 技术链路 | 参数表（底模 / 文本编码器 / VAE / LoRA / 采样 / 放大 / 输出 / 节点数），末尾给下载入口 |
| 对比 | 有图对的工作流给左右对照滑块；没有图对的给单图 + 一段 `prompt`（出图提示词，带「复制」按钮） |

交互：`Esc` / 右上角 × / 点遮罩都关闭，关闭后焦点回到触发按钮；`← →` `Home` `End` 切分页（焦点在对照滑块上时不抢键）；`Tab` 圈在面板里；弹层内滚轮 `stopPropagation`，不会在背后翻章。

**坑**：弹层里的对照滑块是打开时才创建的，`compare-slider.js` 加载时的那次 `querySelectorAll` 扫不到它。所以 `compare-slider.js` 把单实例初始化挂成了 `window.setupCompare(root)`，`selectTab()` 切回应答页时再调一次。

### 对比页的提示词

没有前后对照的两条工作流（CASE 01 壁纸、CASE 02 MOSS），右侧原本是「SINGLE OUTPUT + 一句大标题 + 一段说明」。那两句已经删掉，位置换成这张图当初的出图提示词：数据里给 `prompt` 一个字符串数组（一段一个 `<p>`），`renderCompare()` 单图分支就渲染一个 `.wf-cmp-prompt`。

- 现在单图分页只剩三块：`SINGLE OUTPUT` 小标 → 提示词框 → 分隔线下方的「图注 / 单图」。信息本来就重复（`media.note` 在概览页的图注里还有一份），不必在对比页再说一遍。
- `max-height: clamp(104px, 22vh, 214px)` + 自己 `overflow-y`，提示词一千字左右，不能让它把面板顶穿；底部一条 `::after` 渐隐，暗示还可以往下滚。
- 「复制」按钮走 `navigator.clipboard`，不可用时退回 `textarea + execCommand`；复制成功按钮文字变「已复制」1.6 秒。
- 没写 `prompt` 的工作流不会渲染这一块（`renderCompare()` 里按 `data.prompt` 分支），补一条新工作流想加提示词，只加数据即可。

## 工作流卡片内的对照滑块

「Qwen Image 2.1 人像姿势编辑」这张卡的配图换成了左右对照：`js/compare-slider.js` + `.compare` 样式。

两张图上下叠放，A 层用 `clip-path: inset(0 calc(100% - var(--p)) 0 0)` 裁切，分割线与把手都跟着同一个 `--p` 走，所以只有一个真值要维护。拖动分割线、`← →` 微调（`Shift` 加速）、`Home/End` 到两端；`role="slider"` + `aria-valuenow` 供读屏使用。

要换对比的两张图，直接改卡片里的两个 `<img src>`（`.compare-b` 是右侧「调整后」，`.compare-a` 是左侧「原图」）即可，不需要动 JS。

当前图对：

| 位置 | `.compare-a`（原图） | `.compare-b`（调整后） |
|---|---|---|
| 03 人像姿势编辑 | `workflow-qwen-source.webp`（蹲姿角色，`8_start.jpg`） | `workflow-qwen-result.webp`（同角色站姿） |
| 04 一键转 Q 版 | `workflow-q36-source.webp`（红裙全身写真，`36_start.jpg`） | `workflow-q36-result.webp`（Q 版化结果，`36_end.jpg`） |
| LORO · Q 版人物卡封面 | `loro-q-1-source.webp`（魔女全身立绘，`1_start.jpg`） | `loro-q-1-result.webp`（Q 版化结果，`1_end.jpg`） |

三处都默认 `--p:50%`，两边各露一半，方便看前后差异。

LORO 那处不是卡片配图，而是整个 dossier 的封面 —— `.loro-dossier-cover` 加 `--compare` 修饰类，把 `.compare` 直接铺进原来的封面框（`inset:0`）。封面框是 `position:relative`，所以对照滑块不用额外定位。**坑**：`figcaption` 压在封面底部，会吃掉贴着底边那 40px 的指针事件，得给它 `pointer-events:none`，否则从底部起手拖不动。

## 灯箱：三个分页共用一套

灯箱 `openSelection(index, card, set)` 的第三个参数决定它挂哪一套图：

- 游戏宣发 → `{ records: gameRecords, label: "游戏宣发", tabs: true }`，带「角色海报 / 暗夜锋芒 / 兽灵机能 / 秀场高光」四个系列页签，计数 24 张。
- 人像写真 / 商业海报 → `{ records: 该页的图片数组, label: 页码, tabs: false }`，灯箱加 `.is-plain` 把页签整条隐藏，计数分别是 17 / 12。

砌体项的点击 / `Enter` / 空格都绑在 `renderMasonry()` 里，所以窗口尺寸变化重建列之后依然有效。

## 已知限制

1. 末尾联系方式章节与表单已移除；首页个人档案中仍显示现有联系方式。
2. `Continue ↓` 原本向 Next 外壳 `postMessage`，独立部署后无接收方，点击无反应。
3. `assets/scene/*.glb`、`.kora-*` 类名保持原样（引用写死在 JS / CSS 里），不影响展示。
4. 作品页三个分页都能点开灯箱；「人像写真 / 商业海报」是 masonry 排布，浮动页签条会压住内容上沿，靠页面顶部内边距让位。
5. 视频章节没有内部滚动：滚轮先转卡片（环形），转满一圈再继续滚才离开本章；上下翻也可以直接用 `↑ ↓` 或底部圆点。
