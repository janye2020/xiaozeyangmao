#!/usr/bin/env node
/**
 * 小泽羊毛 - 自动化线报同步脚本 (sync_data.js)
 * 
 * 核心逻辑：
 * 1. 从 sheng.ganfan.work 抓取最新的银行支付立减金与话费流量活动；
 * 2. 严格过滤：仅同步 bank_payment（银行支付类）与话费流量类，绝不引入外部电商返利；
 * 3. 安全合并：严格保护 coupons.js 中站长配置的全部专属返利项目（5折点餐、外卖、电商购物、出行、住宿、生活等 100% 保护）；
 * 4. 自动生成规范的 assets/banks.js 与 assets/coupons.js。
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const API_URL = 'https://sheng.ganfan.work/api/site/coupons';

function fetchRemoteData() {
  return new Promise((resolve, reject) => {
    console.log(`[*] 正在从 ${API_URL} 获取最新线报数据...`);
    const req = https.get(API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 30000
    }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP 请求失败，状态码: ${res.statusCode}`));
      }
      let rawData = '';
      res.on('data', (chunk) => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          const acts = parsed.activities || [];
          console.log(`[+] 成功获取 ${acts.length} 条活动数据 (asOf: ${parsed.asOf})`);
          resolve(acts);
        } catch (err) {
          reject(new Error(`JSON 解析失败: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时 (30s)'));
    });
  });
}

function cleanText(text) {
  if (!text) return '';
  return String(text).replace(/\r/g, ' ').replace(/\n/g, ' ').trim();
}

/**
 * 将活动对象转为 banks.js 兼容格式
 */
function transformBankItem(act) {
  const rewardsDesc = [];
  (act.rewards || []).forEach(r => {
    if (r.description) rewardsDesc.append ? rewardsDesc.append(cleanText(r.description)) : rewardsDesc.push(cleanText(r.description));
  });

  const rules = [];
  (act.rewards || []).forEach(r => {
    (r.conditions || []).forEach(c => {
      if (c.text) {
        const cleaned = cleanText(c.text);
        if (!rules.includes(cleaned)) rules.push(cleaned);
      }
    });
  });
  (act.steps || []).forEach(s => {
    if (s.text) {
      const cleaned = cleanText(s.text);
      if (!rules.includes(cleaned)) rules.push(cleaned);
    }
  });

  const howToParts = [];
  (act.steps || []).forEach(s => {
    const title = s.title || '';
    const text = s.text || '';
    if (text) {
      howToParts.push(title ? `${title}：${text}` : text);
    }
  });
  if (howToParts.length === 0 && act.use) {
    howToParts.push(cleanText(act.use));
  }

  const howTo = howToParts.join('；') || '以银行活动详情页说明为准。';
  const summary = (rewardsDesc[0] || '') || cleanText(act.name || '');

  let deadline = act.end || act.useEnd || act.claimEnd || '以页面为准';
  if (deadline && deadline.length > 10 && deadline[10] === 'T') {
    deadline = deadline.slice(0, 10);
  }

  const bankName = act.group || '银联/云闪付';

  let regions = [];
  if (act.eligibility && Array.isArray(act.eligibility.regions)) {
    regions = act.eligibility.regions;
  }

  return {
    id: act.id,
    bank: bankName,
    title: cleanText(act.name),
    summary: summary,
    rewards: rewardsDesc,
    howTo: howTo,
    deadline: deadline,
    payMethod: '支付优惠',
    tag: '支付优惠',
    rules: rules.slice(0, 8),
    regions: regions,
    sourceUrl: `https://sheng.ganfan.work/offers?activity=${act.id}`,
    sourceUpdatedAt: act.addedAt || new Date().toISOString(),
    isNew: true
  };
}

/**
 * 判断是否为话费流量类活动
 */
function isPhoneActivity(act) {
  const str = JSON.stringify(act);
  const keywords = ['话费', '流量', '充值', '移动', '联通', '电信', '通信', '交话费', '缴费'];
  return keywords.some(k => str.includes(k));
}

/**
 * 转换为 coupons.js 的话费流量卡片
 */
function transformPhoneItem(act) {
  const bankName = act.group || '运营商特惠';
  const title = cleanText(act.name);

  const rewardsDesc = [];
  (act.rewards || []).forEach(r => {
    if (r.description) rewardsDesc.push(cleanText(r.description));
  });
  const desc = rewardsDesc[0] || title;

  const howToParts = [];
  (act.steps || []).forEach(s => {
    if (s.text) howToParts.push(cleanText(s.text));
  });
  const code = howToParts.join('；') || cleanText(act.use) || '详见各官方APP活动页';

  const rules = [];
  (act.rewards || []).forEach(r => {
    (r.conditions || []).forEach(c => {
      if (c.text) {
        const cleaned = cleanText(c.text);
        if (!rules.includes(cleaned)) rules.push(cleaned);
      }
    });
  });

  let deadline = act.end || act.useEnd || '以页面为准';
  if (deadline && deadline.length > 10 && deadline[10] === 'T') {
    deadline = deadline.slice(0, 10);
  }

  return {
    id: `phone-${act.id.replace('offer-', '')}`,
    platform: bankName,
    category: '话费流量',
    title: title,
    desc: desc,
    code: code,
    tag: '充值优惠',
    guide: true,
    rules: rules.slice(0, 5),
    deadline: deadline
  };
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const banksPath = path.join(rootDir, 'assets', 'banks.js');
  const couponsPath = path.join(rootDir, 'assets', 'coupons.js');

  // 1. 获取远程线报
  let activities = [];
  try {
    activities = await fetchRemoteData();
  } catch (err) {
    console.error(`[!] 获取远程线报失败: ${err.message}`);
    process.exit(1);
  }

  // 2. 筛选并生成纯银行支付立减金
  const bankActivities = activities.filter(a => a.section === 'bank_payment');
  console.log(`[*] 筛选出纯银行支付活动: ${bankActivities.length} 条`);
  const bankItems = bankActivities.map(transformBankItem);

  const banksContent = `globalThis.TINGHUI_BANKS=${JSON.stringify(bankItems)};\n`;
  fs.writeFileSync(banksPath, banksContent, 'utf8');
  console.log(`[+] 成功更新 ${banksPath} (共 ${bankItems.length} 条银行活动)`);

  // 3. 筛选并生成话费流量卡片
  const phoneActivities = activities.filter(isPhoneActivity);
  console.log(`[*] 筛选出话费流量相关活动: ${phoneActivities.length} 条`);
  const newPhoneCards = phoneActivities.map(transformPhoneItem);

  // 4. 读取现有 coupons.js，保护站长商业返利卡片
  const couponsText = fs.readFileSync(couponsPath, 'utf8');
  const sandbox = { globalThis: {} };
  try {
    vm.runInNewContext(couponsText, sandbox);
  } catch (err) {
    console.error(`[!] 读取本地 coupons.js 失败: ${err.message}`);
    process.exit(1);
  }

  const existingCoupons = sandbox.globalThis.TINGHUI_COUPONS || [];
  // 严格保留非“话费流量”分类的卡片（点餐、外卖、电商购物、出行、住宿、生活等 100% 保护）
  const preservedCoupons = existingCoupons.filter(c => c.category !== '话费流量');
  console.log(`[+] 完整保护站长专属返利卡片: ${preservedCoupons.length} 条 (点餐、外卖、电商、出行、住宿等 100% 独立安全)`);

  // 合并生成最新 coupons.js
  const finalCoupons = [...preservedCoupons, ...newPhoneCards];
  const couponsContent = `globalThis.TINGHUI_COUPONS=${JSON.stringify(finalCoupons)};\n`;
  fs.writeFileSync(couponsPath, couponsContent, 'utf8');
  console.log(`[+] 成功更新 ${couponsPath} (站长专属返利 ${preservedCoupons.length} 条 + 最新话费流量 ${newPhoneCards.length} 条，合计 ${finalCoupons.length} 条)`);

  console.log('[✔] 数据同步与安全过滤全部完成！');
}

main();
