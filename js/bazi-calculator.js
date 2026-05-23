/**
 * 茂盛易理 — 八字排盘计算引擎
 * 支持公历和农历输入，计算四柱八字、五行、藏干、纳音
 */

// ===== 基础常量 =====

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 五行映射
const STEM_WUXING = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
const BRANCH_WUXING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

// 藏干
const HIDDEN_STEMS = {
  0: [9],           // 子 → 癸
  1: [5, 9, 7],     // 丑 → 己癸辛
  2: [0, 2, 4],     // 寅 → 甲丙戊
  3: [1],           // 卯 → 乙
  4: [1, 4, 9],     // 辰 → 乙戊癸
  5: [2, 6, 4],     // 巳 → 丙庚戊
  6: [3, 5],        // 午 → 丁己
  7: [1, 5, 3],     // 未 → 乙己丁
  8: [4, 6, 8],     // 申 → 戊庚壬
  9: [7],           // 酉 → 辛
  10: [7, 3, 4],    // 戌 → 辛丁戊
  11: [8, 0]        // 亥 → 壬甲
};

// 纳音 (六十甲子纳音表)
const NAYIN_TABLE = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火',
  '涧下水', '城头土', '白蜡金', '杨柳木', '泉中水', '屋上土',
  '霹雳火', '松柏木', '流年水', '砂石金', '山下火', '平地木',
  '壁上土', '金箔金', '覆灯火', '天河水', '大驿土', '钗钏金',
  '桑柘木', '柘榴木', '大海水', '石榴木', '大海水', '海中金',
  '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水',
  '城头土', '白蜡金', '杨柳木', '泉中水', '屋上土', '霹雳火',
  '松柏木', '流年水', '砂石金', '山下火', '平地木', '壁上土',
  '金箔金', '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '柘榴木', '大海水', '石榴木', '大海水', '海中金', '炉中火'
];

// 十神名称
const SHISHEN_MAP = {
  same: '比肩',
  generateSame: '劫财',
  generate: '食神',
  generateDiff: '伤官',
  generateBy: '偏财',
  generateByDiff: '正财',
  control: '七杀',
  controlDiff: '正官',
  controlledBy: '偏印',
  controlledByDiff: '正印'
};

// ===== 节气计算 =====

// 节气常数 (寿星万年历公式)
// 索引: 0=小寒,1=大寒,2=立春,...,23=冬至
const JIEQI_CONSTANTS = [
  5.4055, 20.12,  4.475, 19.43,  5.795, 21.34,
  6.195,  20.79,  6.105, 21.87,  7.905, 23.46,
  7.805,  23.30,  8.175, 23.69,  9.155, 24.10,
  8.745,  23.42,  8.405, 22.72,  7.485, 21.73
];

/**
 * 计算指定年份的节气日期 (寿星公式, 适用于1900-2100)
 */
function getJieQiDate(year, index) {
  const C = JIEQI_CONSTANTS[index];
  const diff = year - 1900;
  const day = Math.floor(C + diff * 0.2422 - Math.floor(diff / 4));
  const month = Math.floor(index / 2) + 1;
  return new Date(year, month - 1, Math.max(1, Math.min(day, 31)));
}

/**
 * 根据公历日期确定月柱地支索引
 * 月份以12个"节"为界，按时间区间精确匹配
 */
function getMonthBranchIndex(date) {
  const y = date.getFullYear();

  const xiaoHan = getJieQiDate(y, 0);        // 小寒 (当年1月)
  const liChun = getJieQiDate(y, 2);         // 立春
  const jingZhe = getJieQiDate(y, 4);        // 惊蛰
  const qingMing = getJieQiDate(y, 6);       // 清明
  const liXia = getJieQiDate(y, 8);          // 立夏
  const mangZhong = getJieQiDate(y, 10);     // 芒种
  const xiaoShu = getJieQiDate(y, 12);       // 小暑
  const liQiu = getJieQiDate(y, 14);         // 立秋
  const baiLu = getJieQiDate(y, 16);         // 白露
  const hanLu = getJieQiDate(y, 18);         // 寒露
  const liDong = getJieQiDate(y, 20);        // 立冬
  const daXue = getJieQiDate(y, 22);         // 大雪
  const xiaoHanNext = getJieQiDate(y + 1, 0); // 次年小寒

  // 丑月: [小寒, 立春)
  if (date >= xiaoHan && date < liChun) return 1;
  // 寅月~子月
  if (date >= liChun && date < jingZhe) return 2;
  if (date >= jingZhe && date < qingMing) return 3;
  if (date >= qingMing && date < liXia) return 4;
  if (date >= liXia && date < mangZhong) return 5;
  if (date >= mangZhong && date < xiaoShu) return 6;
  if (date >= xiaoShu && date < liQiu) return 7;
  if (date >= liQiu && date < baiLu) return 8;
  if (date >= baiLu && date < hanLu) return 9;
  if (date >= hanLu && date < liDong) return 10;
  if (date >= liDong && date < daXue) return 11;
  if (date >= daXue && date < xiaoHanNext) return 0;
  // 次年小寒之后 → 丑月
  if (date >= xiaoHanNext) return 1;
  // 当年小寒之前 (1月1-4日) → 子月 (上年延续)
  return 0;
}

// ===== 年柱计算 =====

function getYearPillar(date) {
  let year = date.getFullYear();
  const liChun = getJieQiDate(year, 2); // 立春
  if (date < liChun) year--;
  const stemIdx = (year - 4) % 10;
  const branchIdx = (year - 4) % 12;
  // 处理负数
  const s = ((stemIdx % 10) + 10) % 10;
  const b = ((branchIdx % 12) + 12) % 12;
  return { stem: s, branch: b };
}

// ===== 月柱计算 =====

function getMonthPillar(yearStemIndex, monthBranchIndex) {
  // 年干决定寅月天干
  const firstMonthStem = (yearStemIndex * 2 + 2) % 10;
  const stemIdx = (firstMonthStem + ((monthBranchIndex - 2 + 12) % 12)) % 10;
  return { stem: stemIdx, branch: monthBranchIndex };
}

// ===== 日柱计算 =====

function getDayPillar(date) {
  // 参考: 1900-01-01 = 甲戌 (60周期索引10, 0-indexed)
  const refDate = new Date(1900, 0, 1);
  const refDayIndex = 10;
  const msPerDay = 86400000;
  const daysDiff = Math.floor((date.getTime() - refDate.getTime()) / msPerDay);
  const dayIndex = ((refDayIndex + daysDiff) % 60 + 60) % 60;
  return {
    stem: dayIndex % 10,
    branch: dayIndex % 12,
    sexagenaryIndex: dayIndex
  };
}

// ===== 时柱计算 =====

function getHourPillar(dayStemIndex, hourBranchIdx) {
  // hourBranchIdx 直接对应地支索引: 0=子,1=丑,...,11=亥
  // 日干决定子时天干: 甲己→甲子, 乙庚→丙子, 丙辛→戊子, 丁壬→庚子, 戊癸→壬子
  const ziStem = [0, 2, 4, 6, 8][dayStemIndex % 5];
  const stemIdx = (ziStem + hourBranchIdx) % 10;
  return { stem: stemIdx, branch: hourBranchIdx };
}

// ===== 农历转公历(简化) =====

function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth) {
  // 使用简化换算: 农历年对应公历年，农历正月初一大约在公历1月底到2月底
  // 此处使用粗略估算，适合排盘展示
  const base = new Date(lunarYear, 0, 21); // 大约在正月初一附近
  const dayOffset = (lunarMonth - 1) * 29.5 + (lunarDay - 1);
  return new Date(base.getTime() + dayOffset * 86400000);
}

// ===== 主排盘函数 =====

function calculateBazi({ name, gender, year, month, day, hour, calendarType }) {
  let solarDate;

  if (calendarType === 'lunar') {
    solarDate = lunarToSolar(year, month, day);
  } else {
    solarDate = new Date(year, month - 1, day, hour || 0, 0, 0);
  }

  const yp = getYearPillar(solarDate);
  const mbIdx = getMonthBranchIndex(solarDate);
  const mp = getMonthPillar(yp.stem, mbIdx);
  const dp = getDayPillar(solarDate);
  const hp = getHourPillar(dp.stem, hour);

  const pillars = [
    { stem: yp.stem, branch: yp.branch, label: '年柱' },
    { stem: mp.stem, branch: mp.branch, label: '月柱' },
    { stem: dp.stem, branch: dp.branch, label: '日柱' },
    { stem: hp.stem, branch: hp.branch, label: '时柱' }
  ];

  // 十神 (以日干为中心)
  const dayStem = dp.stem;
  const shiShen = pillars.map(p => {
    return getShiShen(dayStem, p.stem);
  });

  // 日主五行
  const dayWuxing = STEM_WUXING[dayStem];

  return {
    name: name || '未填写',
    gender: gender === '1' ? '男' : '女',
    solarDate: `${solarDate.getFullYear()}年${solarDate.getMonth()+1}月${solarDate.getDate()}日`,
    hour: hour,
    pillars,
    dayStem,
    dayWuxing,
    shiShen,
    zodiac: ZODIAC[yp.branch],
    nayin: pillars.map(p => getNayin(p.stem, p.branch)),
    hiddenStems: pillars.map(p => getHiddenStems(p.branch)),
    wuxing: pillars.map(p => ({
      stem: STEM_WUXING[p.stem],
      branch: BRANCH_WUXING[p.branch]
    }))
  };
}

// ===== 辅助函数 =====

function getShiShen(dayStem, otherStem) {
  const dayWuxing = STEM_WUXING[dayStem];
  const otherWuxing = STEM_WUXING[otherStem];
  const dayYinYang = dayStem % 2; // 0=阳, 1=阴
  const otherYinYang = otherStem % 2;
  const sameYinYang = dayYinYang === otherYinYang;

  const rel = getWuxingRelation(dayWuxing, otherWuxing);
  switch (rel) {
    case 'same': return sameYinYang ? '比肩' : '劫财';
    case 'generate': return sameYinYang ? '食神' : '伤官';
    case 'generatedBy': return sameYinYang ? '偏印' : '正印';
    case 'control': return sameYinYang ? '七杀' : '正官';
    case 'controlledBy': return sameYinYang ? '偏财' : '正财';
    default: return '—';
  }
}

function getWuxingRelation(center, other) {
  // 五行相生: 木→火→土→金→水→木
  // 五行相克: 木→土→水→火→金→木
  const generate = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const control = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  if (center === other) return 'same';
  if (generate[center] === other) return 'generate';
  if (generate[other] === center) return 'generatedBy';
  if (control[center] === other) return 'control';
  if (control[other] === center) return 'controlledBy';
  return 'same';
}

function getNayin(stemIdx, branchIdx) {
  const index = (stemIdx % 10) * 6 + (branchIdx % 12);
  // 纳音表以6组循环排列
  const nayinIdx = Math.floor(stemIdx / 2) * 6 + (branchIdx % 6);
  const lookup = [
    ['海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火'],
    ['涧下水', '城头土', '白蜡金', '杨柳木', '泉中水', '屋上土'],
    ['霹雳火', '松柏木', '流年水', '砂石金', '山下火', '平地木'],
    ['壁上土', '金箔金', '覆灯火', '天河水', '大驿土', '钗钏金'],
    ['桑柘木', '柘榴木', '大海水', '石榴木', '大海水', '海中金']
  ];
  const row = Math.floor(stemIdx / 2);
  const col = branchIdx % 6;
  // 修正: 纳音按甲子乙丑一组排列
  const pairIdx = Math.floor((stemIdx * 12 + branchIdx) / 2);
  return getNayinByIndex(pairIdx);
}

function getNayinByIndex(idx) {
  const table = [
    '海中金','炉中火','大林木','路旁土','剑锋金','山头火',
    '涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土',
    '霹雳火','松柏木','流年水','砂石金','山下火','平地木',
    '壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金',
    '桑柘木','柘榴木','大海水','石榴木','大海水','海中金'
  ];
  return table[idx % 30] || '';
}

function getHiddenStems(branchIdx) {
  return (HIDDEN_STEMS[branchIdx] || []).map(s => STEMS[s]);
}

// ===== 导出 =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateBazi, STEMS, BRANCHES, STEM_WUXING, BRANCH_WUXING };
}
