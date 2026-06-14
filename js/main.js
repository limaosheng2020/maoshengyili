/**
 * 茂盛易理 — 主交互脚本
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initBaziForm();
  initContactForm();
  initSmoothScroll();
});

// ===== 导航 =====
function initNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
    // 点击链接后关闭
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }
}

// ===== 八字排盘表单 =====
function initBaziForm() {
  const yearSelect = document.getElementById('year');
  const monthSelect = document.getElementById('month');
  const daySelect = document.getElementById('day');

  // 填充年份
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1930; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y + '年';
    yearSelect.appendChild(opt);
  }
  yearSelect.value = 1995;

  // 填充月份
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m + '月';
    monthSelect.appendChild(opt);
  }

  // 填充日期
  updateDayOptions(31);

  // 年月变化时更新日期
  yearSelect.addEventListener('change', () => updateDaySelect());
  monthSelect.addEventListener('change', () => updateDaySelect());

  function updateDaySelect() {
    const y = parseInt(yearSelect.value);
    const m = parseInt(monthSelect.value);
    const daysInMonth = new Date(y, m, 0).getDate();
    updateDayOptions(daysInMonth);
  }

  function updateDayOptions(count) {
    daySelect.innerHTML = '';
    for (let d = 1; d <= count; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d + '日';
      daySelect.appendChild(opt);
    }
  }

  // 表单提交
  document.getElementById('baziForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const gender = document.getElementById('gender').value;
    const calendarType = document.getElementById('calendarType').value;
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);
    const hour = parseInt(document.getElementById('hour').value);

    const result = calculateBazi({ name, gender, year, month, day, hour, calendarType });

    displayBaziResult(result);

    // 滚动到结果
    document.getElementById('baziResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

// ===== 显示排盘结果 =====
function displayBaziResult(data) {
  const resultDiv = document.getElementById('baziResult');
  resultDiv.style.display = 'block';

  // 填充天干
  document.getElementById('yStem').textContent = STEMS[data.pillars[0].stem];
  document.getElementById('mStem').textContent = STEMS[data.pillars[1].stem];
  document.getElementById('dStem').textContent = STEMS[data.pillars[2].stem];
  document.getElementById('hStem').textContent = STEMS[data.pillars[3].stem];

  // 填充地支
  document.getElementById('yBranch').textContent = BRANCHES[data.pillars[0].branch];
  document.getElementById('mBranch').textContent = BRANCHES[data.pillars[1].branch];
  document.getElementById('dBranch').textContent = BRANCHES[data.pillars[2].branch];
  document.getElementById('hBranch').textContent = BRANCHES[data.pillars[3].branch];

  // 填充额外信息
  const extrasDiv = document.getElementById('baziExtras');
  const pNames = ['年柱', '月柱', '日柱', '时柱'];
  const pNamesShort = ['年', '月', '日', '时'];

  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;">';

  for (let i = 0; i < 4; i++) {
    const p = data.pillars[i];
    html += `
      <div style="padding:12px;background:#fff;border-radius:4px;border:1px solid var(--border);">
        <p style="font-weight:600;color:var(--red);margin-bottom:8px;">${pNamesShort[i]}柱</p>
        <p><span class="label">干支：</span><span class="value">${STEMS[p.stem]}${BRANCHES[p.branch]}</span></p>
        <p><span class="label">纳音：</span><span class="value">${data.nayin[i]}</span></p>
        <p><span class="label">十神：</span><span class="value">${data.shiShen[i]}</span></p>
        <p><span class="label">天干五行：</span><span class="value">${data.wuxing[i].stem}</span></p>
        <p><span class="label">地支五行：</span><span class="value">${data.wuxing[i].branch}</span></p>
        <p><span class="label">藏干：</span><span class="value">${data.hiddenStems[i].join(' ')}</span></p>
      </div>`;
  }
  html += '</div>';

  // 基本信息
  html += `
    <div style="margin-top:16px;padding:12px;background:#fff;border-radius:4px;border:1px solid var(--border);text-align:center;">
      <p style="font-weight:600;color:var(--ink);">
        ${data.name} · ${data.gender} · ${data.solarDate} · ${BRANCHES[data.hour]}时
      </p>
      <p style="font-size:14px;color:#888;margin-top:4px;">
        日主：<strong style="color:var(--red);">${STEMS[data.dayStem]}</strong>（${data.dayWuxing}） ·
        生肖：${data.zodiac}
      </p>
    </div>`;

  extrasDiv.innerHTML = html;
}

// ===== 联系表单 =====
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = form.querySelector('input[name="name"]').value;
    const contact = form.querySelector('input[name="contact"]').value;
    const type = form.querySelector('select[name="type"]').value;
    const message = form.querySelector('textarea[name="message"]').value;

    if (!name || !contact) {
      alert('请至少填写您的称呼和联系方式');
      return;
    }

    // 提交到 Netlify Forms
    const formData = new FormData();
    formData.append('form-name', 'contact');
    formData.append('name', name);
    formData.append('contact', contact);
    formData.append('type', type);
    formData.append('message', message);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    })
    .then(() => {
      alert(`${name}，提交成功！我会尽快通过微信或手机联系您。\n\n如有急事可直接添加微信：MSYLJBB\n或拨打电话：17612193548`);
      form.reset();
    })
    .catch(() => {
      alert('提交成功！我会尽快与您联系。\n\n微信：MSYLJBB\n手机：17612193548');
      form.reset();
    });
  });
}

// ===== 平滑滚动 =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = 64;
        const position = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    });
  });
}
