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
- **极简维护方案（告别复杂改码）**：
  - **方案一（极简单文件全局配置）**：仅需修改 `assets/config.js` 这一处，全站几十个卡片与社群信息全部自动同步！
  - **方案二（可视化管理后台）**：直接在浏览器中打开 `admin.html`，像填问卷一样输入口令，一键生成/下载配置文件或本地实时预览！
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
├── admin.html               # 【新】站长可视化口令配置中心（双击直接在浏览器打开修改）
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
    ├── config.js            # 【核心推荐】站长专属口令配置表（只改这一个文件即可！）
    ├── style.css            # 全局样式表（色彩系统、卡片、响应式布局）
    ├── app.js               # 前端核心业务逻辑（搜索、筛选、口令智能替换、交互）
    ├── share.js             # 分享与弹窗海报模块
    ├── coupons.js           # 完整优惠活动数据源（由 config.js 自动关联）
    ├── banks.js             # 各大银行支付与立减金数据源
    ├── logo.svg             # 小泽羊毛矢量品牌 Logo
    ├── platforms/           # 各大电商与平台图标（美团、淘宝、京东等）
    └── banks/               # 各大银行与卡组织图标
```

---

## ✏️ 极简修改口令教程（两种方法任选）

### 方法 A：通过可视化后台修改（零代码，最直观）
1. 双击用浏览器打开项目根目录下的 **`admin.html`**；
2. 在表单中填入您的交流群号、美团口令、淘宝口令、京东口令等；
3. 点击底部的 **【一键下载 config.js】**；
4. 将下载的文件拖入 `assets/` 目录替换原文件；
5. 运行 `git add . && git commit -m "update: 更新口令" && git push` 即可！

### 方法 B：直接修改 `assets/config.js`（10 秒搞定）
用任意文本编辑器打开 `assets/config.js`，只需修改以下几十行：
```javascript
window.SITE_CONFIG = {
  // 1. 社群与联系方式
  community: {
    groupNumber: "填你的QQ群或微信号",
    groupLink: "填加群链接（选填）",
    notice: "欢迎加入小泽羊毛线报群..."
  },

  // 2. 平台核心推广口令（填一次，全站几十个对应卡片自动全量替换）
  codes: {
    meituan_waimai: "填你的美团外卖口令",
    meituan_card: "填你的美团年卡口令",
    eleme_waimai: "填你的饿了么口令",
    taobao_shangou: "填你的淘宝闪购口令",
    taobao_supermarket: "填你的天猫超市口令",
    jd_waimai: "填你的京东外卖口令",
    jd_one_cent: "填你的京东1分购口令",
    jd_limited_sale: "填你的京东30元会场通用券",
    didi: "填你的滴滴打车口令"
  }
};
```
修改后，全站所有卡片都会**自动读取并优先展示**您填写的口令！

---

## 🚀 部署至 Cloudflare Pages 并绑定域名

1. 代码已同步至您的 GitHub 仓库：[https://github.com/janye2020/xiaozeyangmao](https://github.com/janye2020/xiaozeyangmao)
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)；
3. 点击 **Workers 和 Pages** -> **创建应用程序** -> **Pages** -> **连接到 Git**；
4. 选择仓库 `xiaozeyangmao`，构建预设选 `None`，构建命令留空，点击 **保存并部署**；
5. 进入 Pages 项目，在 **自定义域 (Custom Domains)** 绑定您的 Cloudflare 域名即可！
