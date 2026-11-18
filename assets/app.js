/**
 * 小泽羊毛 - 站点核心配置注入与口令智能替换层
 */
(function initSiteConfig() {
  // 1. 尝试读取本地可视化预览临时配置（通过 admin.html 设置）
  try {
    const preview = JSON.parse(localStorage.getItem('XIAOZE_PREVIEW_CONFIG') || 'null');
    if (preview) {
      window.SITE_CONFIG = preview;
    }
  } catch(e) {}

  const cfg = window.SITE_CONFIG;
  if (!cfg || !Array.isArray(globalThis.TINGHUI_COUPONS)) return;

  const codes = cfg.codes || {};
  const idMap = {
    'coupon-001': codes.meituan_waimai,
    'coupon-002': codes.taobao_shangou,
    'coupon-003': codes.jd_waimai,
    'coupon-004': codes.meituan_card,
    'coupon-005': codes.jd_month_card,
    'jd-pay-one-cent': codes.jd_one_cent,
    'jd-limited-sale-30-coupon': codes.jd_limited_sale,
    'shopping-taobao-flash-sale-redpacket': codes.taobao_shangou,
    'shopping-taobao-billion-subsidy': codes.taobao_general,
    'shopping-taobao-tmall-supermarket': codes.taobao_supermarket,
    'phone-unicom-bill-voucher': codes.unicom_bill,
    'coupon-050': codes.ai_charge,
    'food-kfc': codes.food_kfc,
    'food-diancan': codes.food_diancan,
    'food-luckin': codes.food_luckin,
    'food-cotti': codes.food_cotti,
    'food-starbucks': codes.food_starbucks,
    'life-taopiaopiao-bag': codes.life_taopiaopiao_bag,
    'life-taopiaopiao-redpacket': codes.life_taopiaopiao_hb,
    'life-movie-discount': codes.life_movie,
    'life-express-discount': codes.life_express
  };

  // 遍历所有卡片，将站长在 config.js 中配置的口令自动注入
  globalThis.TINGHUI_COUPONS.forEach(item => {
    // 优先 ID 严格映射
    if (idMap[item.id]) {
      item.code = idMap[item.id];
      return;
    }
    const title = item.title || '';
    if (item.platform === '美团') {
      if ((title.includes('月卡') || title.includes('年卡') || title.includes('神券包')) && codes.meituan_card) {
        item.code = codes.meituan_card;
      } else if (codes.meituan_waimai) {
        item.code = codes.meituan_waimai;
      }
    } else if (item.platform === '京东') {
      if ((title.includes('1分') || title.includes('一分')) && codes.jd_one_cent) {
        item.code = codes.jd_one_cent;
      } else if (title.includes('月卡') && codes.jd_month_card) {
        item.code = codes.jd_month_card;
      } else if ((title.includes('限时') || title.includes('30元')) && codes.jd_limited_sale) {
        item.code = codes.jd_limited_sale;
      } else if (title.includes('外卖') && codes.jd_waimai) {
        item.code = codes.jd_waimai;
      } else if (codes.jd_general) {
        item.code = codes.jd_general;
      }
    } else if (item.platform === '淘宝' || item.platform === '淘宝闪购') {
      if (title.includes('超市') && codes.taobao_supermarket) {
        item.code = codes.taobao_supermarket;
      } else if ((title.includes('闪购') || title.includes('外卖')) && codes.taobao_shangou) {
        item.code = codes.taobao_shangou;
      } else if (codes.taobao_general) {
        item.code = codes.taobao_general;
      }
    } else if (item.platform === '饿了么' && codes.eleme_waimai) {
      item.code = codes.eleme_waimai;
    } else if ((item.category === 'AI代充' || item.platform === '银河录像局' || item.platform === 'ChatGPT') && codes.ai_charge) {
      item.code = codes.ai_charge;
      item.link = true;
    } else if ((item.platform === '滴滴' || title.includes('滴滴')) && codes.didi) {
      item.code = codes.didi;
    }
  });

  // 页面加载完成后同步社群联系方式与弹窗
  window.addEventListener('DOMContentLoaded', () => {
    const comm = cfg.community;
    if (!comm) return;
    if (comm.groupQr) {
      const qrImg = document.querySelector('#group-dialog img');
      if (qrImg) qrImg.src = comm.groupQr;
    }
    if (comm.groupNumber) {
      document.querySelectorAll('#group-dialog strong, .group-number-val').forEach(el => {
        el.textContent = comm.groupNumber;
      });
      const copyBtn = document.getElementById('copy-group-number');
      if (copyBtn) {
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(comm.groupNumber).then(() => {
            const statusEl = document.getElementById('group-copy-status');
            if (statusEl) statusEl.textContent = '✓ 群号已成功复制到剪贴板！';
          });
        };
      }
    }
    if (comm.groupLink) {
      const linkEl = document.querySelector('#group-dialog a.claim-btn');
      if (linkEl) linkEl.href = comm.groupLink;
    }
  });
})();

/**
 * 小泽羊毛 - 前端核心交互控制器 (app.js)
 * 功能包含：
 * 1. 优惠卡片渲染与分类筛选（外卖、闪购、买药、生活、电商、出行等）
 * 2. 银行支付优惠立减金渲染与地区/银行筛选
 * 3. 实时关键词全文搜索与结果动态反馈
 * 4. 一键复制口令与移动端 Scheme App 调起
 * 5. 页面多模式标签切换（吃喝玩乐 / 银行支付 / 电商购物 / 出行住宿）
 */
(function(){const H=globalThis.TINGHUI_COUPONS||[];let l=globalThis.TINGHUI_BANKS||[],K=!!globalThis.TINGHUI_BANKS,q;const O=["外卖","团购","双11·新","闪购","话费流量","买药","5折点餐","美妆","生活","AI代充","大牌优惠"],D=[...new Set([...H.filter(e=>!["出行","住宿","双11·新","电商购物"].includes(e.category)).map(e=>e.category==="大牌优惠"?"5折点餐":e.category),"话费流量"])].sort((e,t)=>{const n=O.indexOf(e),a=O.indexOf(t);return(n===-1?999:n)-(a===-1?999:a)}),M={"蚂蚁银行（澳门）":"/assets/banks/antbank-macao.webp",上海银行:"/assets/banks/shanghai.webp",中信国际香港:"/assets/banks/institution-1.webp",工银亚洲香港:"/assets/banks/institution-2.svg",建银亚洲香港:"/assets/banks/institution-3.svg",富邦银行香港:"/assets/banks/institution-4.webp",东亚银行香港:"/assets/banks/institution-5.webp",汇丰香港:"/assets/banks/institution-6.svg",恒生香港:"/assets/banks/institution-7.webp",支付宝:"/assets/banks/institution-8.svg",中国银行:"/assets/banks/institution-9.svg",建设银行:"/assets/banks/institution-10.svg",邮储银行:"/assets/banks/institution-11.svg",工商银行:"/assets/banks/institution-12.svg",交通银行:"/assets/banks/institution-13.svg",武汉农商银行:"/assets/banks/institution-14.webp",兴业银行:"/assets/banks/institution-15.svg",浦发银行:"/assets/banks/institution-16.svg",民生银行:"/assets/banks/institution-17.svg",光大银行:"/assets/banks/institution-18.svg",中信银行:"/assets/banks/institution-19.svg",农业银行:"/assets/banks/institution-20.svg",平安银行:"/assets/banks/institution-21.svg",广发银行:"/assets/banks/institution-22.svg",招商银行:"/assets/banks/institution-23.svg",汇丰中国:"/assets/banks/institution-24.svg",浙商银行:"/assets/banks/institution-25.svg",华夏银行:"/assets/banks/institution-26.svg",北京银行:"/assets/banks/institution-27.svg",Visa:"/assets/banks/institution-28.svg",福建农信:"/assets/banks/institution-29.webp",云闪付:"/assets/banks/institution-30.webp",美国运通:"/assets/banks/amex.svg",陕西农信:"/assets/banks/institution-32.webp",翼支付:"/assets/banks/institution-33.webp",微众银行:"/assets/banks/institution-34.webp",银联国际:"/assets/banks/institution-35.svg",万事达:"/assets/banks/institution-36.svg",中国银联:"/assets/banks/institution-37.svg",北京农商银行:"/assets/banks/institution-38.webp"},U=e=>M[e]?`<img class="bank-logo" src="${i(M[e])}" alt="" width="18" height="18" decoding="async" loading="lazy" onerror="this.style.visibility='hidden'" />`:"";let E=[...new Set(l.map(e=>e.bank))];const wt=["支付宝","云闪付","翼支付"],St=["中国银联","银联国际","Visa","万事达","美国运通"],pt={"蚂蚁银行（澳门）":"澳卡",光大银行:"银行",工商银行:"银行",浦发银行:"银行",招商银行:"银行",中信银行:"银行",中国银联:"卡组织",万事达:"卡组织",农业银行:"银行",民生银行:"银行",邮储银行:"银行",交通银行:"银行",平安银行:"银行",兴业银行:"银行",中国银行:"银行",华夏银行:"银行",上海银行:"银行",银联国际:"卡组织",中信国际香港:"港卡",工银亚洲香港:"港卡",建银亚洲香港:"港卡",富邦银行香港:"港卡",东亚银行香港:"港卡",汇丰香港:"港卡",恒生香港:"港卡",支付宝:"支付平台",建设银行:"银行",云闪付:"支付平台",美国运通:"卡组织",武汉农商银行:"银行",广发银行:"银行",Visa:"卡组织",汇丰中国:"银行",福建农信:"银行",浙商银行:"银行",陕西农信:"银行",北京银行:"银行",翼支付:"支付平台",微众银行:"银行",北京农商银行:"银行"},W=e=>pt[e]||"银行",z=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"});let C=z.format(new Date);const _=new WeakMap;let V=Object.fromEntries(E.map(e=>[e,l.filter(t=>t.bank===e&&!u(t)).length]));const F=["银行","港卡","澳卡","支付平台","卡组织"],Q={港卡:"2026-12-10",澳卡:"2026-12-16"};let g="全部",c=document.documentElement?.dataset.section||"life",y=/(?:[?&])category=food-deals(?:&|$)/.test(window.location?.search||"")?"5折点餐":D[0]||"",L="出行",k="京东",h="全部",b="全部",v="",$=decodeURIComponent((window.location?.search||"").match(/[?&]activity=([^&]*)/)?.[1]||"");if($){const e=H.find(t=>t.id===$);e&&(y=e.category==="大牌优惠"?"5折点餐":e.category,L=e.category,k=e.shoppingPlatform||e.platform)}globalThis.clearSharedActivity=()=>{$="",m()};const r={wrap:document.querySelector("#mode-bar-wrap"),categories:document.querySelector("#categories"),search:document.querySelector("#search-input"),couponGrid:document.querySelector("#coupon-grid"),bankGrid:document.querySelector("#bank-grid"),panelLife:document.querySelector("#panel-life"),panelBank:document.querySelector("#panel-bank"),bankNote:document.querySelector("#bank-note"),tabLife:document.querySelector("#tab-life"),tabBank:document.querySelector("#tab-bank"),tabBrand:document.querySelector("#tab-brand"),tabDouble11:document.querySelector("#tab-double11")};function i(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Z(e){const t=e||"";return t.startsWith("淘宝")?"taobao":t.startsWith("美团")?"meituan":t.startsWith("京东")?"jd":t.startsWith("滴滴")?"didi":t.includes("花小猪")?"huaxiaozhu":t.includes("T3")?"t3":t.startsWith("飞猪")?"fliggy":t.startsWith("同程")?"tongcheng":t.startsWith("携程")?"ctrip":t.startsWith("淘票票")?"taopiaopiao":t.startsWith("瑞幸")?"luckin":t.startsWith("库迪")?"cotti":t.startsWith("星巴克")?"starbucks":t.startsWith("奈雪")?"naixue":t.startsWith("喜茶")?"heytea":t.startsWith("麦当劳")?"mcdonalds":t.startsWith("德克士")?"dicos":t.includes("点餐")?"diancan":t.startsWith("肯德基")?"kfc":t.includes("快递")?"express":t.includes("电影")?"movie":"meituan"}function gt(e){const t=e||"";return t.startsWith("淘宝")?"淘宝":t.startsWith("美团")?"美团":t.startsWith("京东")?"京东":t.startsWith("滴滴")?"滴滴":t.includes("花小猪")?"花小猪":t.includes("T3")?"T3":t.startsWith("飞猪")?"飞猪":t.startsWith("同程")?"同程":t.startsWith("智行")?"智行":t.startsWith("淘票票")?"淘票票":"美团"}function J(e,t){return t?String(e||"").toLowerCase().includes(t):!0}function ft(){const e=[c,k,L,y,g,h,l.length].join("|");if(et!==e){if(et=e,c==="brand"){r.categories.innerHTML=["出行","住宿"].map(t=>`<button type="button" class="category${L===t?" active":""}" data-category="${t}" aria-pressed="${L===t}">${t}</button>`).join("");return}if(c==="double11"){r.categories.innerHTML=["京东","淘宝"].map(t=>`<button type="button" class="category${k===t?" active":""}" data-shopping="${t}" aria-pressed="${k===t}">${t}${t==="淘宝"?'<span class="category-new" aria-label="新增">NEW</span>':""}</button>`).join("");return}if(c==="bank"){const t=n=>`<button type="button" class="category${h===n?" active":""}" data-category="${i(n)}" aria-pressed="${h===n}">${U(n)}${i(n)} <span class="institution-count">${V[n]}</span></button>`;r.categories.innerHTML=`<div class="institution-groups" aria-label="机构类型">${["全部",...F].map(n=>`<button type="button" class="category${g===n?" active":""}" data-group="${n}" aria-pressed="${g===n}">${n==="全部"?"全部活动":n}${Q[n]&&P()<Q[n]?`<span class="category-new" aria-label="新增${n}信息">NEW</span>`:""} <span class="institution-count">${n==="全部"?l.filter(a=>!u(a)).length:l.filter(a=>W(a.bank)===n&&!u(a)).length}</span></button>`).join("")}</div>`+F.filter(n=>g==="全部"||g===n).map(n=>`<div class="institution-row${g!=="全部"&&g!==n?" mobile-group-hidden":""}"><span class="institution-label">${n}</span><div class="institution-options">${E.filter(a=>W(a)===n).map(t).join("")}</div></div>`).join("");return}r.categories.innerHTML=D.map(t=>`<button type="button" class="category${t===y?" active":""}" data-category="${i(t)}" aria-pressed="${t===y}">${i(t)}${t==="话费流量"?'<span class="category-new" aria-label="新分类">NEW</span>':""}</button>`).join("")}}function bt(e){const isUrl=Boolean(e.link||(typeof e.code==="string"&&/^https?:\/\//i.test(e.code.trim())));return isUrl?`<a href="${i(e.code)}" target="_blank" rel="noopener noreferrer">${i(e.code)}</a>`:`<code>${i(e.code)}</code>`}const X=new WeakMap,j=new WeakMap;let Y,G=[],tt=new Map,A="",et="";const T=30;let w=T,B="",S=Math.max(0,(Number(document.documentElement?.dataset.bankPage)||1)-1)*T;function I(e){const t=_.get(e);if(t?.year===C.slice(0,4))return t.date;const n=mt(e);return _.set(e,{year:C.slice(0,4),date:n}),n}function mt(e){const t=e.deadline||"",a=[...t.matchAll(/(20\d{2})-(\d{1,2})-(\d{1,2})/g)].at(-1);if(a)return`${a[1]}-${a[2].padStart(2,"0")}-${a[3].padStart(2,"0")}`;const s=[...t.matchAll(/(\d{1,2})月(\d{1,2})日/g)].at(-1);return s?`${P().slice(0,4)}-${s[1].padStart(2,"0")}-${s[2].padStart(2,"0")}`:""}function P(){return C}function u(e){const t=I(e);return e.expired===!0||!!(t&&t<P())}function nt(e,t){const n=u(e),a=u(t);return n!==a?Number(n)-Number(a):n?(I(t)||t.expiredAt||"").localeCompare(I(e)||e.expiredAt||""):0}function at(){const e=v.trim().toLowerCase();return H.filter(t=>{if($)return t.id===$;if(!e&&c==="double11")return["电商购物","双11·新"].includes(t.category)&&(t.shoppingPlatform||t.platform)===k&&!t.title.includes("外卖");if(!e){if(y==="5折点餐"){if(t.category!=="5折点餐"&&t.category!=="大牌优惠")return!1;}else if(t.category!==(c==="brand"?L:c==="double11"?"双11·新":y))return!1;}if(!e)return!0;const n=[t.platform,t.title,t.desc,t.tag,t.code].join(" ");return J(n,e)})}const st={武汉:"湖北",广州:"广东",深圳:"广东",东莞:"广东",佛山:"广东",惠州:"广东",珠海:"广东",中山:"广东",江门:"广东",肇庆:"广东",苏州:"江苏",杭州:"浙江",成都:"四川",福州:"福建",厦门:"福建",郑州:"河南",贵阳:"贵州",遵义:"贵州",毕节:"贵州",南京:"江苏",常州:"江苏",扬州:"江苏",南通:"江苏",徐州:"江苏",镇江:"江苏",泰州:"江苏",盐城:"江苏",连云港:"江苏",淮安:"江苏"},N=new Set(["香港","澳门","台湾","境外","新加坡","英国","马来西亚","泰国","日本","印度尼西亚","法国","美国","韩国","澳大利亚","意大利","瑞士","加拿大"]);function it(e,t){const n=e.regions||[];return t==="全部"?!0:t==="未注明地区"?n.length===0:t==="全国"?n.includes("全国"):t==="境外"?n.some(a=>N.has(a)):n.some(a=>a===t||st[a]===t||a===st[t]||!N.has(t)&&a==="全国")}function ht(){const e=document.querySelector("#region-filter");if(e.hidden=c!=="bank",c!=="bank")return;Y!==l&&(Y=l,G=[...new Set(l.flatMap(s=>s.regions||[]))].sort((s,d)=>s.localeCompare(d,"zh-CN")),tt=new Map(G.map(s=>[s,l.filter(d=>it(d,s)).length])),A="");const t=G,n=s=>`<option value="${i(s)}"${s===b?" selected":""}>${i(s)}（${tt.get(s)||0}）</option>`,a=[["省份与城市",[...t.filter(s=>s==="全国"),...t.filter(s=>s!=="全国"&&!N.has(s))]],["港澳台与境外",t.filter(s=>N.has(s))]];A!==b&&(document.querySelector("#bank-region").innerHTML=`<option value="全部" disabled hidden${b==="全部"?" selected":""}>选择地区</option>`+a.filter(([,s])=>s.length).map(([s,d])=>`<optgroup label="${s}">${d.map(n).join("")}</optgroup>`).join("")),A=b,document.querySelector("#reset-bank-region").hidden=!1,document.querySelector("#region-result-count").textContent=`当前匹配 ${R().filter(s=>!u(s)).length} 项活动`,document.querySelector("#region-note").textContent=b==="全部"?"仅列出现有活动涉及的城市和地区，点击重置取消地区筛选。":b==="未注明地区"?"这些活动未明确标注适用地区，请以活动细则为准。":"选择省市时包含当地、所属省份及全国活动；地区选项括号为全部银行的匹配数，参与资格以卡种及活动细则为准。"}function R(){const e=v.trim().toLowerCase();return l.filter(t=>{if($)return t.id===$;if(c==="bank"&&!it(t,b)||(c==="bank"||!e)&&h!=="全部"&&t.bank!==h||(c==="bank"||!e)&&h==="全部"&&g!=="全部"&&W(t.bank)!==g)return!1;if(!e)return!0;let n=X.get(t);return n||(n=[t.bank,t.title,t.summary,t.payMethod,t.tag,t.howTo,...t.rewards||[],...t.rules||[]].join(" "),X.set(t,n)),J(n,e)})}function rt(){const e=at().sort(nt);if(!e.length){if(c==="double11"&&!v.trim()){r.couponGrid.innerHTML=`<div class="empty">${k}购物优惠整理中，敬请期待</div>`;return}r.couponGrid.innerHTML=y==="话费流量"&&!v.trim()?'<div class="empty">话费流量优惠整理中，敬请期待</div>':'<div class="empty">这个分类暂时没有优惠，换个分类或关键词试试</div>';return}r.couponGrid.innerHTML=e.map(t=>{const n={中国移动:"/assets/platforms/cmcc.webp",中国联通:"/assets/platforms/unicom.webp",中国电信:"/assets/platforms/chinatelecom.webp",快手:"/assets/platforms/kuaishou.webp"},a=t.guide?n[t.platform]||M[t.platform]:"",s=a||(t.image==="/assets/logo.png"?"/assets/logo-small.webp":t.image)||"/assets/platforms/"+Z(t.platform)+(["luckin","cotti","starbucks","naixue","heytea","mcdonalds","dicos","kfc","diancan","express","movie"].includes(Z(t.platform))?".svg":".webp"),isUrl=Boolean(t.link||(typeof t.code==="string"&&/^https?:\/\//i.test(t.code.trim()))),d=isUrl?"链接：":t.search?"京东首页搜：":"口令：",f=t.guide?"":isUrl?`<a class="claim-btn" href="${i(t.code)}" target="_blank" rel="noopener noreferrer">直接跳转 ↗</a>`:`<div class="coupon-action"><span class="copy-feedback" role="status" aria-live="polite"></span><button type="button" class="copy" data-code="${i(t.code)}" data-platform="${i(t.platform)}" data-copy-hint="${i(typeof t.copyHint=="string"?t.copyHint:t.copyHint?"请发给微信好友或自己打开链接":"")}">${t.copyHint?"点击复制":"复制口令"}</button></div>`;return`<article class="coupon${t.isNew?" activity-new-card":""}${u(t)?" expired":""}" data-activity-id="${i(t.id)}">${t.isNew?'<span class="activity-new" aria-label="本批新增活动">NEW</span>':""}
              <div class="coupon-top">
                <div class="platform">${t.guide&&!a?'<span class="carrier-icon" aria-hidden="true">话费</span>':`<img class="platform-icon" src="${i(s.startsWith("assets/")?"/"+s:s)}" alt="${i(t.platform)}图标" width="36" height="36" decoding="async" onerror="this.onerror=null;this.src='/assets/logo-small.webp'" />`}${i(t.title)}</div>
                <span class="tag">${i(u(t)?"已过期":t.tag||"")}</span>
              </div>
              <p class="desc">${i(t.desc||"")}</p>
              <div class="coupon-code"><span>${t.guide?"参与路径：":d}</span>${bt(t)}</div>
              ${t.guide&&t.rules?.length?`<details class="bank-rules"><summary>活动细则</summary><ul>${t.rules.map(p=>`<li>${ot(p)}</li>`).join("")}</ul></details>`:""}
              ${t.guide&&t.deadline?`<p class="bank-meta"><strong>截止时间：</strong>${i(t.deadline)}</p>`:""}
              ${f?`<div class="coupon-bottom${t.deadline?" has-deadline":""}">${t.deadline?`<p class="coupon-deadline"><span>截止时间：</span><span>${i(t.deadline)}</span></p>`:""}${f}</div>`:""}
              <button type="button" class="share-button" data-share-id="${i(t.id)}">↗ 分享</button>
            </article>`}).join(""),r.couponGrid.querySelectorAll(".copy").forEach(t=>{t.addEventListener("click",()=>vt(t))})}function ot(e){const t="领取／报名渠道|领取/报名渠道|使用／支付渠道|使用/支付渠道|支付方式|参与方式|卡类别|卡组织|适用商户|适用卡种|指定 App|指定APP|使用截止|领取截止|活动期间|活动整体安排|适用条件";return String(e||"").replace(new RegExp("\\s*(?=(?:"+t+")[：:])","g"),`
`).replace(/([。；])\s*/g,`$1
`).split(/\n+/).map(a=>a.trim()).filter(Boolean).map(a=>{const s=a.match(new RegExp("^("+t+")[：:]\\s*(.*)$"));return s?`<p><strong>${i(s[1])}：</strong>${i(s[2])}</p>`:`<p>${i(a)}</p>`}).join("")}function yt(e){if(j.has(e))return j.get(e);const t=new Set;for(const a of[...e.rules||[],...e.rewards||[]])for(const s of a.matchAll(/卡类别[：:]\s*([^；;。\s]+)/g))for(const d of s[1].split("、"))t.add(d);const n=[...t].join(" / ")||"以实际为准";return j.set(e,n),n}function ct(e=!1){const t=[c,g,h,b,v,l.length,C].join("|");B!==t&&(B&&(S=0),w=T,B=t);const n=R(),a=n.filter(u),s=n.filter(o=>!u(o)).sort(nt);if(!s.length&&!a.length){r.bankGrid.innerHTML='<div class="empty">当前银行、地区或关键词下暂无活动，请调整筛选条件。</div>';return}const d=e&&typeof r.bankGrid.insertAdjacentHTML=="function",f=d?S+w-T:S,p=o=>{const ut=(o.rewards||[]).map($t=>`<li>${i($t)}</li>`).join("");return`<article class="bank-card${o.isNew?" activity-new-card":""}${u(o)?" expired":""}" data-activity-id="${i(o.id)}">${o.isNew?'<span class="activity-new" aria-label="本批新增活动">NEW</span>':""}
              <div class="bank-card-top">
                <div class="bank-name">${U(o.bank)}${i(o.bank)}</div>
                <span class="tag">${i(u(o)?"已过期":o.tag||"支付优惠")}</span>
              </div>
              <h3 class="bank-title">${i(o.title)}</h3>
              <p class="bank-summary">${i(o.summary||"")}</p>
              ${ut?`<ul class="bank-rewards">${ut}</ul>`:""}
              <p class="bank-howto"><strong>怎么领：</strong>${i(o.howTo||"")}</p>
              ${o.rules?.length?`<details class="bank-rules" data-bank-id="${i(o.id)}"><summary>活动细则</summary><ul></ul></details>`:""}
              <div class="bank-meta">
                <span><strong>适用地区：</strong>${i((o.regions||[]).join("、")||"未注明，以活动细则为准")}</span>
                <span class="card-category"><strong>卡类别：</strong>${i(yt(o))}</span>
                <span><strong>截止：</strong>${i(o.deadline||"以页面为准")}</span>
              </div>
              <button type="button" class="share-button" data-share-id="${i(o.id)}">↗ 分享</button>
            </article>`},dt=s.slice(f,S+w).map(p).join("")+(s.length>S+w?`<div class="bank-more"><p>已显示 ${Math.min(S+w,s.length)} / ${s.length} 项</p><a class="category" id="bank-load-more" href="/bank-payment/page/${Math.floor((S+w)/T)+1}/">加载更多活动</a></div>`:"");if(d?(r.bankGrid.querySelector(".bank-more")?.remove(),r.bankGrid.insertAdjacentHTML("beforeend",dt)):r.bankGrid.innerHTML=dt,typeof r.bankGrid.querySelector=="function"&&(r.bankGrid.querySelector(".expired-archive")?.remove(),a.length)){const o=document.createElement("details");o.className="expired-archive",o.style.gridColumn="1 / -1",o.innerHTML=`<summary>已过期（${a.length}项，点击查看）</summary><div class="expired-content"></div>`,o.addEventListener("toggle",()=>{o.querySelector(".expired-content").innerHTML=o.open?a.map(p).join(""):""}),r.bankGrid.appendChild(o)}}function kt(){return q||(q=new Promise((e,t)=>{const n=document.createElement("script");n.src="/assets/banks.js",n.onload=()=>{l=globalThis.TINGHUI_BANKS||[],K=!0,E=[...new Set(l.map(a=>a.bank))],V=Object.fromEntries(E.map(a=>[a,l.filter(s=>s.bank===a&&!u(s)).length])),e()},n.onerror=()=>{n.remove(),q=null,t(new Error("加载失败"))},document.head.appendChild(n)}),q)}function m(){C=z.format(new Date);const e=!!v.trim();if(ft(),ht(),r.categories.classList.toggle("bank-categories",c==="bank"),r.categories.hidden=e,document.querySelector(".category-hint").hidden=e,r.search.placeholder="全站搜索：平台、银行、优惠关键词",r.panelLife.hidden=!e&&c==="bank",r.panelLife.setAttribute("aria-labelledby",c==="brand"?"tab-brand":c==="double11"?"tab-double11":"tab-life"),r.panelBank.hidden=!e&&c!=="bank",r.bankNote.classList.toggle("show",!e&&c==="bank"),document.querySelector("#life-results").hidden=!e,document.querySelector("#bank-results").hidden=!e,document.querySelector("#search-summary").hidden=!e,(e||c==="bank")&&!K){e&&(rt(),document.querySelector("#search-summary").textContent="正在搜索全部优惠…"),r.bankGrid.innerHTML='<div class="empty" role="status">正在加载银行支付活动…</div>',kt().then(m).catch(()=>{r.bankGrid.innerHTML='<div class="empty">加载失败，请检查网络。<button type="button" class="category" id="retry-bank-load">重新加载</button></div>',document.querySelector("#retry-bank-load").addEventListener("click",m)});return}if(e){const t=at().length,n=R().filter(a=>!u(a)).length;document.querySelector("#search-summary").textContent=`找到 ${t+n} 条优惠 · 生活 ${t} 条 / 银行支付 ${n} 条`}(e||c!=="bank")&&rt(),(e||c==="bank")&&ct()}async function vt(e){const t=e.dataset.code,n=e.dataset.platform,a=e.dataset.copyHint,s=e.parentElement.querySelector(".copy-feedback"),d=gt(n);let f=!1;try{navigator.clipboard&&window.isSecureContext&&(await navigator.clipboard.writeText(t),f=!0)}catch{}if(!f){const p=document.createElement("textarea");p.value=t,p.setAttribute("readonly",""),p.style.cssText="position:fixed;left:-9999px;top:0;opacity:0;font-size:16px;",document.body.appendChild(p),p.focus(),p.select(),p.setSelectionRange(0,p.value.length);try{f=document.execCommand("copy")}catch{}p.remove()}e.textContent=f?"已复制":"请长按复制",e.classList.toggle("copied",f),s.textContent=f?a?`已复制，${a}`:`已成功复制口令，请打开${d}app进入会场`:a?`复制失败，${a}`:`请长按复制口令，再打开${d}app进入会场`,s.classList.add("show"),setTimeout(()=>{e.textContent=e.dataset.copyHint?"点击复制":"复制口令",e.classList.remove("copied"),s.classList.remove("show")},3e3)}r.categories.addEventListener("click",e=>{const t=e.target.closest("[data-shopping]");if(t){k=t.dataset.shopping,m();return}const n=e.target.closest("[data-group]");if(n){g=n.dataset.group,h="全部",m();return}const a=e.target.closest("[data-category]");if(!a)return;const s=a.dataset.category;c==="life"?y=s:c==="brand"?L=s:(h=s,g=W(s)),m()}),r.bankGrid.addEventListener("click",e=>{e.target.closest("#bank-load-more")&&(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||(e.preventDefault(),w+=T,ct(!0)))}),r.bankGrid.addEventListener("toggle",e=>{const t=e.target;if(!t.matches?.("details[data-bank-id]")||!t.open||t.dataset.loaded)return;const n=l.find(a=>a.id===t.dataset.bankId);n&&(t.querySelector("ul").innerHTML=n.rules.map(a=>`<li>${ot(a)}</li>`).join(""),t.dataset.loaded="true")},!0);const x=document.querySelector("#group-dialog");document.querySelector("#group-open-top").addEventListener("click",()=>x.showModal()),document.querySelector("#group-open-footer").addEventListener("click",()=>x.showModal()),document.querySelector("#copy-group-number").addEventListener("click",async()=>{let e=!1;try{await navigator.clipboard.writeText("300260356"),e=!0}catch{}if(!e){const t=document.createElement("textarea");t.value="300260356",t.style.cssText="position:fixed;left:-9999px;font-size:16px",x.appendChild(t),t.select();try{e=document.execCommand("copy")}catch{}t.remove()}document.querySelector("#group-copy-status").textContent=e?"群号已复制":"复制失败，请长按群号复制"}),document.querySelector("#group-close").addEventListener("click",()=>x.close()),x.addEventListener("click",e=>{e.target===x&&x.close()}),document.querySelector("#bank-region").addEventListener("change",e=>{b=e.target.value,m()}),document.querySelector("#reset-bank-region").addEventListener("click",()=>{b="全部",m()});let lt=0;r.search.addEventListener("input",()=>{clearTimeout(lt),lt=setTimeout(()=>{v=r.search.value||"",m()},120)}),m()})();

