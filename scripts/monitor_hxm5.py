#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
小泽羊毛 - 线报屋 (赚客吧精选) 实时监控与微信推送系统
目标站点: https://www.hxm5.com/xianbao/5/

功能特点:
1. 自动计算 FNV-1a 签名，调用线报屋底层 JSON API；
2. 获取最新线报列表与详细领券步骤/内容；
3. 关键词白名单智能筛选（优先推送高价值羊毛，如立减金/话费/免单/神价等）；
4. 历史记录去重机制，绝不重复轰炸；
5. 支持 PushPlus、Server酱、企业微信/钉钉 Webhook 微信实时弹窗推送。
"""

import urllib.request
import urllib.parse
import json
import time
import os
import sys

# ==============================================================================
# 1. 核心配置区域
# ==============================================================================
CONFIG = {
    # 推送通道配置
    # 推荐 PushPlus: 请确保在 https://verify.pushplus.plus 完成了微信微信实名认证
    "pushplus_token": "990136ade6e2406b887870ef6aec4bf3",
    
    # 备用推送通道 (若使用其他平台，填入对应 Token 即可自动兼容)
    "serverchan_key": "",          # 例如 SCT...
    "wechat_webhook": "",          # 企业微信群机器人 Webhook URL
    "dingtalk_webhook": "",        # 钉钉群机器人 Webhook URL

    # 监控频道 (5 表示赚客吧线报精选)
    "cate_id": "5",

    # 关键词过滤白名单 (命中任意关键词则推送；设为空列表 [] 则表示全量无过滤推送)
    "keyword_filter": [
        "银行", "立减金", "立减", "话费", "流量", "中行", "工行", "建行", "农行", "交行", "招行", "邮储", "兴业", "华夏", "浦发", "广发", "中信", "平安",
        "美团", "京东", "淘宝", "红包", "神价", "bug", "BUG", "免单", "1元", "0元", "券",
        "抽奖", "羊毛", "返现", "会员", "盒马", "麦当劳", "肯德基", "外卖", "支付宝", "云闪付", "数币", "信用卡", "速览"
    ],

    # 已推送历史 ID 存储文件 (自动在本地去重)
    "history_file": os.path.join(os.path.dirname(os.path.abspath(__file__)), "hxm5_seen_ids.json")
}

# ==============================================================================
# 2. 线报屋底层逆向与请求逻辑 (FNV-1a 签名)
# ==============================================================================
def fnv1a_32_base36(text):
    """线报屋前端专用的 FNV-1a 32-bit 哈希与 Base36 转换算法"""
    u = 2166136261
    for char in text:
        u ^= ord(char)
        u = (u * 16777619) & 0xFFFFFFFF
    
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'
    if u == 0:
        return '0'
    res = []
    while u:
        u, rem = divmod(u, 36)
        res.append(chars[rem])
    return ''.join(reversed(res))

def request_hxm5_api(endpoint, params):
    """封装带防盗链签名的 POST 请求"""
    url = f"https://www.hxm5.com{endpoint}"
    
    # 180秒周期时间戳
    jt = int(time.time() * 1000 // 180000)
    params["jt"] = str(jt)
    
    qs = urllib.parse.urlencode(params)
    guard_str = f"/api|{qs}|hxm5-json-guard-v1"
    params["jx"] = fnv1a_32_base36(guard_str)
    
    body = urllib.parse.urlencode(params).encode('utf-8')
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-HXM5-JSON": "1",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://www.hxm5.com/xianbao/5/"
    }
    
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_latest_threads(cid="5", page=1):
    """获取最新线报帖子列表"""
    params = {
        "r": "list",
        "type": "xianbao",
        "cid": str(cid),
        "page": str(page),
        "view": "rows"
    }
    res = request_hxm5_api(f"/api?cate={cid}&page={page}", params)
    data = res.get("data", {})
    return data.get("list", []) if isinstance(data, dict) else res.get("list", [])

def get_thread_detail(tid):
    """获取单个线报的正文详情与步骤"""
    params = {
        "r": "thread",
        "id": str(tid)
    }
    res = request_hxm5_api(f"/api?tid={tid}", params)
    return res.get("data", res)

# ==============================================================================
# 3. 消息通知与多通道发送层
# ==============================================================================
def send_push(title, content_html):
    """统一消息推送接口"""
    # 1. 优先尝试 PushPlus
    token = CONFIG.get("pushplus_token")
    if token:
        try:
            url = "http://www.pushplus.plus/send"
            payload = {
                "token": token,
                "title": title[:30],
                "content": content_html,
                "template": "html"
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                if result.get("code") == 200:
                    print(f"[✔] PushPlus 微信推送成功: {title}")
                    return True
                else:
                    print(f"[!] PushPlus 提示: {result.get('msg')} ({result.get('data')})")
        except Exception as e:
            print(f"[!] PushPlus 发送异常: {e}")

    # 2. 备选 Server酱
    sct_key = CONFIG.get("serverchan_key")
    if sct_key:
        try:
            url = f"https://sctapi.ftqq.com/{sct_key}.send"
            payload = urllib.parse.urlencode({"title": title, "desp": content_html}).encode('utf-8')
            req = urllib.request.Request(url, data=payload)
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[✔] Server酱 推送成功: {title}")
                return True
        except Exception as e:
            print(f"[!] Server酱 发送异常: {e}")

    # 3. 备选企业微信 Webhook
    wx_bot = CONFIG.get("wechat_webhook")
    if wx_bot:
        try:
            payload = {
                "msgtype": "markdown",
                "markdown": {"content": f"### {title}\n{content_html}"}
            }
            req = urllib.request.Request(wx_bot, data=json.dumps(payload).encode('utf-8'), headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"[✔] 企业微信群机器人推送成功: {title}")
                return True
        except Exception as e:
            print(f"[!] 企业微信推送异常: {e}")

    return False

# ==============================================================================
# 4. 历史记录去重管理
# ==============================================================================
def load_history():
    hist_file = CONFIG["history_file"]
    if os.path.exists(hist_file):
        try:
            with open(hist_file, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except:
            return set()
    return set()

def save_history(history_set):
    hist_file = CONFIG["history_file"]
    # 仅保留最近 2000 个 ID，防止文件过大
    ids_to_save = list(history_set)[-2000:]
    with open(hist_file, "w", encoding="utf-8") as f:
        json.dump(ids_to_save, f, ensure_ascii=False)

# ==============================================================================
# 5. 核心监控主循环
# ==============================================================================
def check_once():
    """执行一次新线报扫描"""
    print(f"[*] [{time.strftime('%Y-%m-%d %H:%M:%S')}] 正在检查线报屋 (赚客吧精选)...")
    history = load_history()
    is_first_run = (len(history) == 0)

    try:
        threads = get_latest_threads(CONFIG["cate_id"], 1)
    except Exception as e:
        print(f"[!] 获取线报列表失败: {e}")
        return

    new_threads = []
    for t in threads:
        tid = str(t.get("ID") or t.get("id"))
        if tid and tid not in history:
            new_threads.append(t)

    print(f"[+] 发现新帖子 {len(new_threads)} 条 (当前历史记录: {len(history)} 条)")

    # 如果是第一次运行，默认先将当前已有帖子标记为已读，避免一次性推送几十条旧线报
    if is_first_run and len(new_threads) > 1:
        print("[*] 首次初始化运行，自动将现有旧帖子同步为已读状态...")
        for t in new_threads[1:]:
            history.add(str(t.get("ID") or t.get("id")))
        save_history(history)
        # 仅拿最新的一条作为测试推送
        new_threads = new_threads[:1]

    # 按时间正序处理（先发生的先推）
    for t in reversed(new_threads):
        tid = str(t.get("ID") or t.get("id"))
        title = t.get("Title") or t.get("title") or "无标题线报"
        post_time = t.get("time") or time.strftime("%Y-%m-%d %H:%M")

        # 关键词匹配过滤
        keywords = CONFIG.get("keyword_filter", [])
        if keywords:
            is_match = any(kw.lower() in title.lower() for kw in keywords)
        else:
            is_match = True

        if not is_match:
            print(f"[-] 跳过不感兴趣的内容: {title}")
            history.add(tid)
            continue

        # 获取详情正文
        try:
            detail = get_thread_detail(tid)
            content = detail.get("Content") or detail.get("content") or "暂无详细说明"
            imgs = detail.get("img") or []
        except Exception as e:
            content = "详情抓取超时"
            imgs = []

        # 构造富文本消息
        img_html = "".join([f'<p><img src="{u}" style="max-width:100%;border-radius:8px;" /></p>' for u in imgs[:2]])
        detail_url = f"https://www.hxm5.com/t/{tid}/"
        
        msg_html = f"""
        <div style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #333;">
            <h3 style="color: #ff5500; margin: 0 0 8px;">🔥 {title}</h3>
            <p style="font-size: 13px; color: #888; margin: 0 0 10px;">⏰ 发布时间：{post_time}</p>
            <div style="background: #fff8f0; border: 1px solid #ffe4cc; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <strong>参与步骤 / 线报说明：</strong><br/>
                <div style="margin-top: 6px; font-size: 14px; color: #444;">{content}</div>
            </div>
            {img_html}
            <p style="margin-top: 12px; font-size: 12px;">
                <a href="{detail_url}" target="_blank" style="color: #ff5500; text-decoration: none; font-weight: bold;">查看原帖完整详情 ↗</a>
            </p>
        </div>
        """

        # 发送推送
        send_push(f"【线报速递】{title}", msg_html)
        history.add(tid)
        save_history(history)
        time.sleep(1) # 防止请求过密

def run_loop(interval_seconds=120):
    """常驻循环监听模式"""
    print(f"[*] 启动线报屋常驻实时监控，每 {interval_seconds} 秒轮询一次...")
    while True:
        try:
            check_once()
        except Exception as e:
            print(f"[!] 监控异常: {e}")
        time.sleep(interval_seconds)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--loop":
        run_loop(120)
    else:
        check_once()
