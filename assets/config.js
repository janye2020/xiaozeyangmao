/**
 * ============================================================================
 * 小泽羊毛 - 站长全局专属配置文件 (assets/config.js)
 * ============================================================================
 * 【使用说明】：
 * 这是全站唯一的“核心口令与信息配置表”。
 * 您只需在此文件中修改一次，全站所有卡片的口令、加群弹窗信息都会自动替换为您的专属内容！
 * 
 * 留空（""）的字段会自动使用系统默认的备用口令。
 */

window.SITE_CONFIG = {
  // --------------------------------------------------------------------------
  // 1. 网站基础信息
  // --------------------------------------------------------------------------
  siteName: "小泽羊毛",
  siteSlogan: "把省下来的钱，留给更重要的事",

  // --------------------------------------------------------------------------
  // 2. 社群与私域引流（全站弹窗与底部自动同步）
  // --------------------------------------------------------------------------
  community: {
    groupName: "小泽羊毛线报交流群",
    groupNumber: "1128491901", // 您的QQ群号
    groupLink: "", // 点击直接加群的链接（若无请留空 ""）
    notice: "欢迎加入小泽羊毛线报群，每天同步最新外卖立减券、银行立减金与大额补贴！"
  },

  // --------------------------------------------------------------------------
  // 3. 核心平台推广口令（在此填入您的淘客、美团、京粉等推广口令）
  // --------------------------------------------------------------------------
  codes: {
        // ===【聚推客 · 连锁餐饮与大牌5折点餐】===
    food_kfc: "https://kurl05.cn/t9xKHw",            // 肯德基在线点餐推广短链
    food_diancan: "https://s.t28.cn/rXkY9kRN",        // 大牌餐饮点餐聚合推广短链
    food_luckin: "https://kurl04.cn/t9xKeE",          // 瑞幸咖啡推广短链
    food_cotti: "https://kzurl18.cn/tHrC3M",          // 库迪咖啡推广短链
    food_starbucks: "https://kurl05.cn/t9xKgz",      // 星巴克特惠点餐推广短链

    // ===【生活 · 淘票票/电影票与特价寄快递】===
    life_taopiaopiao_bag: "https://dwz.cn/iD313Omm",    // 淘票票买券包推广短链
    life_taopiaopiao_hb: "https://dwz.cn/IQmlQFKT",     // 淘票票优惠券红包推广短链
    life_movie: "https://kurl05.cn/t9xWT6",             // 特价电影票推广短链
    life_express: "https://kurl05.cn/t9xWW8",           // 特价寄快递推广短链

    // ===【AI代充 / 会员订阅类】===
    ai_charge: "https://nf.video/VBCKk",             // 银河录像局 · ChatGPT/Claude会员代充推广短链

    // ===【美团 / 饿了么 外卖生活类】===
    meituan_waimai: "http:/💰x5YTFiODFmZTM💰",       // 美团外卖大额天天神券口令
    meituan_card: "http:/💰ycMTM1YzIzMmU💰",         // 美团神券包/9.9元年卡口令
    meituan_general: "",                            // 美团其他通用口令（备用）
    eleme_waimai: "",                               // 饿了么天天领红包口令

    // ===【淘宝 / 天猫 电商类】===
    taobao_shangou: "￥hff26Wdoq5J￥/ HU7405",      // 淘宝闪购/外卖优惠口令
    taobao_supermarket: "",                         // 天猫超市立减券口令
    taobao_general: "",                             // 淘宝百亿补贴通用口令

    // ===【京东 电商与外卖类】===
    jd_waimai: "https://u.jd.com/ogAzZ5z",          // 京东外卖优惠口令/短链
    jd_one_cent: "https://u.jd.com/oOEIZw5",        // 京东新老用户1分购口令/短链
    jd_limited_sale: "https://u.jd.com/ogAzZ5z",    // 京东30元限时优惠会场口令/短链
    jd_month_card: "",                              // 京东外卖月卡口令
    jd_general: "",                                 // 京东通用返利口令

    // ===【出行 / 打车 / 机票火车票类】===
    travel_meituan_flight: "http:/💰qeZjAyYmM3MTM💰",                               // 美团机票优惠券口令
    travel_meituan_train: "http:/💰p8MzJlYzYyN2Y💰",                                // 美团火车票特惠口令
    travel_didi_flight: "https://www.yunkahulian.com/tg/pages/didi/index?sid=YK0000881364", // 滴滴机票优惠券链接
    travel_didi_ride: "https://kurl05.cn/t9e8a7",                                    // 滴滴打车优惠券链接
    travel_huaxiaozhu_ride: "https://kurl04.cn/t9e8Nz",                              // 花小猪打车优惠券链接
    travel_tongcheng_ride: "https://s.ly.com/nXaJWR6xF",                             // 同程打车优惠券链接
    didi: "https://kurl05.cn/t9e8a7",                                               // 滴滴打车通用备用
    gaode: "",                                                                      // 高德打车券口令
    oil: "",                                                                        // 加油优惠满减口令

    // ===【住宿 / 酒店民宿特惠类】===
    hotel_meituan: "http:/💰0oYmQ1MDQzNjA💰",                                        // 美团酒店优惠券口令
    hotel_tongcheng: "https://kurl05.cn/t9eGLY",                                     // 同程酒店优惠券链接
    hotel_fliggy: "https://a.feizhu.com/3c10Eg",                                     // 飞猪酒店优惠券链接
    hotel_didi: "https://kurl04.cn/t9eGy2",                                          // 滴滴酒店优惠券链接

    // ===【通信 / 话费流量类】===
    unicom_bill: "",                                // 中国联通积分/话费口令
    cmcc_bill: "",                                  // 中国移动话费优惠口令
    telecom_bill: ""                                // 中国电信话费优惠口令
  }
};
