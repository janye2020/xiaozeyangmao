# 小泽羊毛 (Xiaoze Yangmao)

> 吃喝玩乐优惠券与省钱攻略 · 每日线报导航站

一个基于移动端优先、响应式设计、数据与结构解耦的轻量级优惠聚合网站。界面视觉与交互对标知名优惠导购平台，支持 0 成本部署至 **Cloudflare Pages** 并绑定您的自定义域名。

---

## 🌟 核心特性

- **视觉与交互对标**：采用现代化暖橙色系，卡片式布局、圆角、标签与微阴影，完美适配手机、平板与电脑端。
- **四大核心板块**：
  - **吃喝玩乐**：外卖神券（美团/饿了么）、团购折扣、电影票、买药特惠、大牌 5 折点餐等。
  - **银行支付**：各大银行微信立减金、支付宝红包、云闪付满减、数字人民币红包。
  - **电商购物**：京东、淘宝、天猫、拼多多大额补贴与一分购。
  - **出行住宿**：打车券、加油满减、机票酒店特惠。
- **高效交互体验**：
  - 一键复制口令与 App Scheme 自动唤醒。
  - 实时关键词搜索与分类即时筛选。
  - 活动卡片一键生成直达链接与分享。
  - “添加到手机桌面”快捷引导教程。
  - 交流群 / 微信二维码弹窗引导（私域引流闭环）。
- **零成本运维**：
  - 纯静态前端架构，无需购买云服务器与数据库。
  - 完美适配 **Cloudflare Pages**，全球 CDN 节点秒级响应，自带免费 HTTPS。

---

## 📁 目录结构

```text
.
├── index.html               # 首页（默认展示吃喝玩乐板块）
├── shopping/
│   └── index.html           # 电商购物板块
├── travel/
│   └── index.html           # 出行住宿板块
├── bank-payment/
│   └── index.html           # 银行支付板块
├── add-to-home.html         # 添加到手机桌面教程
├── about.html               # 关于小泽羊毛
├── privacy.html             # 隐私与免责声明
├── _headers                 # Cloudflare Pages 静态缓存与安全响应头
├── _redirects               # Cloudflare Pages 友好路由规则
└── assets/
    ├── style.css            # 全局样式表（色彩系统、卡片、响应式布局）
    ├── app.js               # 前端核心业务逻辑（搜索、筛选、复制、交互）
    ├── share.js             # 分享与弹窗海报模块
    ├── coupons.js           # 【核心】优惠活动与推广口令数据源
    ├── banks.js             # 【核心】各大银行支付与立减金数据源
    ├── logo.svg             # 小泽羊毛矢量品牌 Logo
    ├── platforms/           # 各大电商与平台图标（美团、淘宝、京东等）
    └── banks/               # 各大银行与卡组织图标
```

---

## ✏️ 如何修改为你自己的推广口令与链接

当你申请了美团联盟、淘宝客、京粉或其他推客联盟账号后，只需修改 `assets/` 目录下的数据文件，**无需改动任何页面 HTML 样式代码**：

### 1. 修改优惠活动与口令 (`assets/coupons.js`)
打开 `assets/coupons.js`，找到对应的活动条目修改即可。例如：
```javascript
{
  id: "meituan-waimai-01",      // 活动唯一ID（用于生成直达链接）
  platform: "美团",             // 平台名称
  category: "外卖",             // 所属分类
  title: "美团外卖大额神券",     // 卡片标题
  desc: "天天可领大额神券",      // 优惠描述
  code: "http://💰你的美团口令💰", // 【换成你的推广口令或推广短链】
  tag: "热门",                  // 标签文本
  deadline: "长期有效"
}
```

### 2. 修改交流群与微信客服 (`index.html`)
打开 `index.html`，搜索 `group-dialog` 区域，将群号 `300260356` 或说明替换为您自己的微信群号、公众号名称或个人微信号二维码即可。

---

## 🚀 部署至 Cloudflare Pages 并绑定域名

由于您拥有 Cloudflare 域名，推荐使用 **GitHub + Cloudflare Pages** 联动部署，后续在 GitHub 上修改代码后，网站会自动重新构建上线：

### 第一步：推送到 GitHub 仓库
1. 本地代码已全部就绪并完成 Git 初始化；
2. 推送至您的 GitHub 账号（例如仓库名 `xiaozeyangmao`）。

### 第二步：登录 Cloudflare 控制台
1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) 并登录；
2. 在左侧菜单点击 **Workers 和 Pages (Workers & Pages)** -> 点击 **创建应用程序 (Create application)**；
3. 选择 **Pages** 选项卡 -> 点击 **连接到 Git (Connect to Git)**；
4. 选择刚刚创建的 GitHub 仓库 `xiaozeyangmao`；
5. 在构建配置（Build Settings）中：
   - **Framework preset（框架预设）**：选择 `None`
   - **Build command（构建命令）**：留空无需填写
   - **Build output directory（构建输出目录）**：留空或填写 `/`
6. 点击 **保存并部署 (Save and Deploy)**。

### 第三步：绑定您的 Cloudflare 自定义域名
1. 部署完成后，在 Pages 项目详情页点击 **自定义域 (Custom Domains)**；
2. 点击 **设置自定义域 (Set up a custom domain)**；
3. 输入您在 Cloudflare 托管的域名（如 `yangmao.yourdomain.com` 或根域名 `yourdomain.com`）；
4. 点击继续，Cloudflare 会自动为您配置 DNS CNAME 记录并签发全球 SSL 证书；
5. 等待 1~2 分钟，即可通过您的自定义域名访问「小泽羊毛」！

---

## 💻 本地预览与调试

如需在本地电脑查看效果：
```bash
# 在项目根目录下启动本地预览服务（使用 Python 自带的 HTTP 服务）
python -m http.server 18080

# 然后在浏览器中打开：
# http://localhost:18080
```
