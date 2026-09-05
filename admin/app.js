const app = document.querySelector('#app');
const API = String(window.BRANDIRASCK_API_URL || '/api').replace(/\/$/, '');

let token = sessionStorage.getItem('brd_inf_admin_token') || '';

async function api(action, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  let data = null;
  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error(data?.error || `HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function shell(content) {
  app.innerHTML = `
    <header>
      <div class="wrap top">
        <div class="brand">
          <img src="logo.jpeg" alt="Logo">
          <span>BRANDIRASCK<small>INFLUENCERS ADMIN</small></span>
        </div>
        ${token ? '<button class="btn" id="logout">Logout</button>' : ''}
      </div>
    </header>
    <main class="wrap">${content}</main>
  `;

  document.querySelector('#logout')?.addEventListener('click', async () => {
    try { await api('admin-logout', { method: 'POST', body: {} }); } catch (_) {}
    sessionStorage.removeItem('brd_inf_admin_token');
    token = '';
    renderLogin();
  });
}

function renderLogin(message = '') {
  shell(`
    <div class="login">
      <div class="eyebrow">PRIVATE ADMIN</div>
      <h1>Influencers Admin</h1>
      <p class="notice">هذا الـAdmin مستقل عن باقي مواقع BRANDIRASCK.</p>
      ${message ? `<p class="notice">${escapeHtml(message)}</p>` : ''}
      <div class="field"><label>Username</label><input id="u" type="text" autocomplete="username"></div>
      <div class="field"><label>Password</label><input id="p" type="password" autocomplete="current-password"></div>
      <button class="btn" id="loginBtn">دخول</button>
    </div>
  `);

  const submit = async () => {
    const user = document.querySelector('#u').value.trim();
    const pass = document.querySelector('#p').value;
    if (!user || !pass) return alert('المرجو إدخال Username وPassword.');

    const button = document.querySelector('#loginBtn');
    button.disabled = true;
    button.textContent = 'جاري الدخول...';

    try {
      const data = await api('admin-login', {
        method: 'POST',
        body: { username: user, password: pass }
      });
      token = data.token;
      sessionStorage.setItem('brd_inf_admin_token', token);
      await renderDash();
    } catch (error) {
      alert(error.status === 401 ? 'بيانات الدخول غير صحيحة.' : 'تعذر الاتصال بالسيرفر. تأكد من إعداد API وDATABASE_URL.');
      button.disabled = false;
      button.textContent = 'دخول';
    }
  };

  document.querySelector('#loginBtn').onclick = submit;
  document.querySelector('#p').addEventListener('keydown', event => {
    if (event.key === 'Enter') submit();
  });
}

function statusLabel(status) {
  return {
    ACTIVE: 'Active',
    USED: 'Used',
    EXPIRED: 'Expired',
    RESERVED: 'Reserved',
    PENDING_REVIEW: 'Pending Review',
    APPROVED: 'Approved'
  }[status] || status;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-MA', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Africa/Casablanca'
  });
}

async function renderDash() {
  shell('<div class="dashboard"><p class="notice">جاري تحميل البيانات من السيرفر...</p></div>');

  try {
    const [codesData, tempsData] = await Promise.all([
      api('admin-codes'),
      api('admin-temp')
    ]);

    const codes = codesData.items || [];
    const temps = tempsData.items || [];
    const activeCodesCount = codes.filter(c => c.status === 'ACTIVE' || c.status === 'RESERVED').length;
    const usedCodesCount = codes.filter(c => c.status === 'USED').length;

    shell(`
      <div class="dashboard">
        <div class="eyebrow">CONTROL CENTER</div>
        <h1>Influencers Dashboard</h1>
        <p class="notice">البيانات جاية مباشرة من PostgreSQL عبر الـAPI. المسار: Registration → Review → Contract → PDF → Approval → Catalog.</p>

        <div class="stats">
          <div class="stat"><b>${activeCodesCount}</b>Codes Active</div>
          <div class="stat"><b>${usedCodesCount}</b>Codes Used</div>
          <div class="stat"><b>${temps.length}</b>Temporary Registrations</div>
          <div class="stat"><b>30m</b>PDF Retention</div>
        </div>

        <section class="section">
          <div class="row">
            <h2>Registration Codes</h2>
            <button class="btn" id="gen">Generate Code</button>
          </div>
          <div id="codes">
            ${codes.length ? codes.map(c => `
              <div class="code-item" style="padding:8px;margin:4px 0;background:#f9f9f9;display:flex;justify-content:space-between;align-items:center;gap:12px;">
                <span><b>${escapeHtml(c.id)}</b></span>
                <span>${statusLabel(c.status)} · expires ${formatDate(c.expires_at)}</span>
              </div>
            `).join('') : '<p class="notice">لا توجد رموز حالياً.</p>'}
          </div>
        </section>

        <section class="section">
          <h2>Temporary Registrations</h2>
          <div id="temps">
            ${temps.length ? temps.map(t => {
              const p = t.payload || {};
              return `
                <div class="temp-item" style="padding:10px;margin:4px 0;background:#f9f9f9;display:flex;justify-content:space-between;align-items:center;gap:12px;">
                  <span><b>${escapeHtml(p.name || '—')}</b> — ${escapeHtml(p.city || '—')}<br><small>${escapeHtml(t.id)} · ${statusLabel(t.status)} · expires ${formatDate(t.expires_at)}</small></span>
                  <span>
                    ${t.has_pdf ? `<button class="btn ghost" data-pdf="${escapeHtml(t.id)}">PDF</button>` : '<small>PDF pending</small>'}
                    ${t.status === 'APPROVED' ? '<span class="notice">Approved</span>' : `<button class="btn" data-approve="${escapeHtml(t.id)}" ${t.has_pdf ? '' : 'disabled title="PDF must be uploaded before approval"'}>Approve</button>`}
                  </span>
                </div>
              `;
            }).join('') : '<p class="notice">لا توجد تسجيلات مؤقتة حالياً.</p>'}
          </div>
        </section>
      </div>
    `);

    document.querySelector('#gen').onclick = generateCode;
    document.querySelectorAll('[data-pdf]').forEach(button => {
      button.onclick = () => openAdminPdf(button.dataset.pdf);
    });
    document.querySelectorAll('[data-approve]').forEach(button => {
      button.onclick = () => approveRegistration(button.dataset.approve);
    });
  } catch (error) {
    if (error.status === 401) {
      sessionStorage.removeItem('brd_inf_admin_token');
      token = '';
      return renderLogin('انتهت جلسة Admin، المرجو تسجيل الدخول من جديد.');
    }
    shell(`<div class="login"><h1>تعذر تحميل لوحة التحكم</h1><p class="notice">${escapeHtml(error.message)}</p><button class="btn" id="retry">إعادة المحاولة</button></div>`);
    document.querySelector('#retry').onclick = renderDash;
  }
}

async function generateCode() {
  const button = document.querySelector('#gen');
  button.disabled = true;
  button.textContent = 'جاري التوليد...';
  try {
    const data = await api('admin-generate-code', { method: 'POST', body: {} });
    alert(`تم توليد رمز جديد:\n${data.code}\n\nصالح لمدة ${data.expiresMinutes} دقيقة.`);
    await renderDash();
  } catch (error) {
    if (error.status === 401) return renderLogin('انتهت جلسة Admin.');
    alert('تعذر توليد الكود: ' + error.message);
    button.disabled = false;
    button.textContent = 'Generate Code';
  }
}

async function approveRegistration(id) {
  if (!confirm('واش متأكد بغيتي توافق على هاد التسجيل وتضيفو للـCatalog؟')) return;
  try {
    await api('admin-approve', { method: 'POST', body: { id } });
    alert('تمت الموافقة وإضافة المؤثر إلى الـCatalog.');
    await renderDash();
  } catch (error) {
    if (error.status === 401) return renderLogin('انتهت جلسة Admin.');
    alert(error.message === 'PDF_NOT_READY' ? 'خاص الـPDF يكون جاهز قبل الموافقة.' : 'تعذر قبول التسجيل: ' + error.message);
  }
}

async function openAdminPdf(id) {
  try {
    const response = await fetch(`${API}?action=admin-pdf&id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(response.status === 404 ? 'PDF غير موجود أو انتهت صلاحيته.' : `HTTP_${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    alert('تعذر فتح PDF: ' + error.message);
  }
}

renderLogin();
