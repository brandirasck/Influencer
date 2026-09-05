const $ = s => document.querySelector(s);
const modal = $('#modal'), steps = $('#steps');
const API = String(window.BRANDIRASCK_API_URL || '/api').replace(/\/$/, '');
const WA = '212605320470';

let state = {
  codeId: null,
  downloadToken: null,
  registrationId: null,
  data: { categories: [], platforms: {}, services: {} }
};

const cats = ['Influencer','Content Creator','Singer','Musician','Actor','Comedian','Gamer','Fashion','Beauty','Lifestyle','Fitness','Food','Travel','Education','Business','Photography','Other'];
const platforms = ['Instagram','TikTok','Facebook','YouTube'];

async function api(action, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  const type = response.headers.get('content-type') || '';
  const data = type.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

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

function open(){ modal.classList.add('open'); }
function close(){ modal.classList.remove('open'); }
$('#start').onclick = () => { open(); renderCode(); };
$('#close').onclick = close;
$('#catalogBtn').onclick = () => document.querySelector('.catalog-section').scrollIntoView({behavior:'smooth'});
$('#loadCatalog').onclick = loadCatalog;
window.addEventListener('load', () => loadCatalog());

function renderCode(){
  steps.innerHTML = `<div class="step">
  <div class="eyebrow">PRIVATE REGISTRATION</div><h2>أدخل رمز التسجيل الخاص بك</h2>
  <p class="muted">الرمز صادر من BRANDIRASCK، صالح لمدة 30 دقيقة ويُستعمل مرة واحدة فقط.</p>
  <div class="field"><label>Registration Code</label><input id="code" autocomplete="off" placeholder="XXXXXXXXXXXX"></div>
  <div class="notice">ما عندكش Code؟ تقدر تطلبو من BRANDIRASCK عبر WhatsApp.</div>
  <button class="btn" id="verify">تحقق من الرمز</button>
  <a class="btn ghost" href="https://wa.me/${WA}?text=${encodeURIComponent('السلام عليكم، بغيت نطلب Registration Code للانضمام إلى شبكة BRANDIRASCK Influencers.')}" target="_blank" rel="noopener">طلب Code عبر WhatsApp</a>
  </div>`;
  $('#verify').onclick = verify;
  $('#code').addEventListener('keydown', event => { if (event.key === 'Enter') verify(); });
}

async function verify(){
  const code = $('#code').value.trim();
  if(!code) return alert('المرجو إدخال رمز التسجيل.');

  const button = $('#verify');
  button.disabled = true;
  button.textContent = 'جاري التحقق...';

  try {
    const result = await api('validate-code', {
      method: 'POST',
      body: { code }
    });
    state.codeId = result.codeId;
    renderForm();
  } catch (error) {
    alert(error.message === 'INVALID_OR_EXPIRED_CODE'
      ? 'الرمز غير صالح أو انتهت صلاحيته.'
      : error.message === 'CODE_NOT_AVAILABLE'
        ? 'الرمز لم يعد متاحاً. المرجو استعمال رمز آخر.'
        : 'تعذر التحقق من الرمز. حاول مرة أخرى.');
    button.disabled = false;
    button.textContent = 'تحقق من الرمز';
  }
}

function renderForm(){
  steps.innerHTML = `<div class="step">
  <div class="eyebrow">REGISTRATION</div><h2>معلومات المؤثر</h2>
  <p class="muted">دخل المعلومات بدقة. الأسعار غادي تتحسب تلقائياً حسب عدد المتابعين لكل منصة.</p>
  <div class="form">
  <div class="field"><label>الاسم الكامل</label><input id="name" required></div>
  <div class="field"><label>الاسم الفني / Nickname</label><input id="nickname"></div>
  <div class="field"><label>المدينة</label><input id="city"></div>
  <div class="field"><label>النوع</label><select id="type"><option>Individual</option><option>Group</option></select></div>
  <div class="field full"><label>Profile Photo URL</label><input id="photo" placeholder="رابط صورة البروفايل"></div>
  <div class="field full"><label>Categories</label><div class="choice">${cats.map(c=>`<label><input type="checkbox" value="${c}" name="cat">${c}</label>`).join('')}</div></div>
  <div class="field full"><label>Social Platforms</label><div class="choice">${platforms.map(c=>`<label><input type="checkbox" value="${c}" name="plat">${c}</label>`).join('')}</div></div>
  <div class="field full" id="socialFields"></div>
  <div class="field full"><label>3 Featured Photos (URLs)</label><input id="p1" placeholder="Photo 1 URL"><input id="p2" placeholder="Photo 2 URL"><input id="p3" placeholder="Photo 3 URL"></div>
  </div>
  <button class="btn" id="next">متابعة ومراجعة الأسعار</button></div>`;
  document.querySelectorAll('input[name=plat]').forEach(x=>x.onchange=renderSocial);
  $('#next').onclick=review;
}

function renderSocial(){
  const sel = [...document.querySelectorAll('input[name=plat]:checked')];
  $('#socialFields').innerHTML = sel.map(x=>`<div class="service">
  <strong>${escapeHtml(x.value)}</strong><div class="form">
  <div class="field"><label>Username / Handle</label><input data-u="${escapeHtml(x.value)}"></div>
  <div class="field"><label>URL</label><input data-l="${escapeHtml(x.value)}"></div>
  <div class="field"><label>Followers / Subscribers</label><input data-f="${escapeHtml(x.value)}" type="number" min="0"></div>
  </div></div>`).join('');
}

function price(n){
  n = Number(n)||0;
  if(n<=100000)return{stories:400,reel:600,collab:1500};
  if(n<=300000)return{stories:500,reel:800,collab:1900};
  if(n<=500000)return{stories:600,reel:1000,collab:2300};
  if(n<=700000)return{stories:700,reel:1100,collab:3000};
  return{stories:800,reel:1200,collab:3400};
}

function collect(){
  const ps = {};
  [...document.querySelectorAll('input[name=plat]:checked')].forEach(x=>{
    const n = x.value;
    ps[n] = {
      username: $(`[data-u="${n}"]`)?.value.trim() || '',
      url: $(`[data-l="${n}"]`)?.value.trim() || '',
      followers: Number($(`[data-f="${n}"]`)?.value || 0)
    };
  });
  const services = {};
  for(const [n,v] of Object.entries(ps)) services[n] = {...v, prices:price(v.followers)};
  return {
    name:$('#name').value.trim(), nickname:$('#nickname').value.trim(), city:$('#city').value.trim(),
    type:$('#type').value, profilePhoto:$('#photo').value.trim(),
    categories:[...document.querySelectorAll('input[name=cat]:checked')].map(x=>x.value),
    platforms:ps, services,
    featuredPhotos:[$('#p1').value.trim(),$('#p2').value.trim(),$('#p3').value.trim()].filter(Boolean)
  };
}

function money(n){return `${Number(n).toLocaleString('fr-MA')} DH`}
function serviceRows(d){
  return Object.entries(d.services).map(([name,v])=>`<tr><td>${escapeHtml(name)}</td><td>${Number(v.followers).toLocaleString('fr-MA')}</td><td>${money(v.prices.stories)}</td><td>${money(v.prices.reel)}</td><td>${money(v.prices.collab)}</td></tr>`).join('');
}

function review(){
  state.data = collect(); const d = state.data;
  if(!d.name || !Object.keys(d.platforms).length)return alert('دخل الاسم واختار على الأقل منصة واحدة.');
  steps.innerHTML = `<div class="step">
  <div class="eyebrow">REVIEW</div><h2>مراجعة المعلومات والأسعار</h2>
  <div class="contract-paper" id="reviewPaper">
  <h3>${escapeHtml(d.nickname||d.name)}</h3><p>${escapeHtml(d.city)} · ${escapeHtml(d.type)}</p>
  <p><b>Categories:</b> ${escapeHtml(d.categories.join('، ')||'—')}</p>
  <table><thead><tr><th>Platform</th><th>Followers</th><th>4 Stories</th><th>Reel + 4 Stories</th><th>Collab Reel + 4 Stories</th></tr></thead><tbody>${serviceRows(d)}</tbody></table>
  <div class="notice"><b>15% Agency Commission:</b> أي خدمة تتم عبر BRANDIRASCK أو يتم إسنادها للوكالة تخضع لشروط الوكالة ونسبة 15% وفق العقد.</div>
  <div class="notice"><b>Promo Code:</b> كود خاص بالمؤثر يمكن أن يُمنح من طرف BRANDIRASCK. يمنح المؤثر 10% reward/commission على المشتريات المؤهلة باستعمال الكود، باستثناء خدمات Influencer Collaboration، وفق الشروط التعاقدية.</div>
  </div>
  <button class="btn" id="contract">عرض العقد الكامل</button><button class="btn ghost" id="back">رجوع</button></div>`;
  $('#contract').onclick=contract; $('#back').onclick=renderForm;
}

function contract(){
  const d = state.data;
  steps.innerHTML = `<div class="step">
  <div class="eyebrow">BRANDIRASCK · INFLUENCERS NETWORK</div>
  <div class="contract-paper" id="contractPaper">
  <div class="contract-head"><img src="logo.jpeg"><div><h1>عقد الانضمام إلى شبكة المؤثرين</h1><p>BRANDIRASCK — Influencers / Creators / Artists Network</p></div></div>
  <p><b>مرجع التسجيل:</b> يُنشأ عند التأكيد النهائي &nbsp; | &nbsp; <b>تاريخ القبول:</b> تاريخ ووقت الخادم</p>
  <h3>1. تعريف الأطراف</h3><p>يبرم هذا العقد بين وكالة BRANDIRASCK، بصفتها الجهة المنظمة والمديرة لشبكة المؤثرين، وبين الشخص أو المجموعة المسجلة في هذا الطلب، ويشار إليه لاحقاً بـ«Influencer». تُعتمد المعلومات المدخلة والمقبولة في النظام كأساس لملف العضوية.</p>
  <h3>2. موضوع العقد والانضمام للشبكة</h3><p>يهدف العقد إلى تنظيم انضمام Influencer إلى شبكة BRANDIRASCK، وإتاحة فرص الخدمات والحملات والتعاون الإعلاني وفق الأسعار والشروط المحددة في هذا العقد وكل اتفاقية حملة لاحقة.</p>
  <h3>3. الحرية خارج BRANDIRASCK</h3><p>يحتفظ Influencer بحرية العمل والتعاقد والتفاوض خارج نطاق الخدمات التي تديرها BRANDIRASCK. لا تعتبر الوكالة الممثل الإعلاني الحصري للمؤثر، ولا تمنعه من ممارسة نشاطه المستقل. وتطبق شروط الوكالة ونسبة العمولة فقط على الخدمات التي تجلبها BRANDIRASCK للمؤثر أو الخدمات التي يقرر Influencer إسنادها إلى BRANDIRASCK.</p>
  <h3>4. الخدمات والأسعار</h3><p>يتم احتساب الأسعار آلياً حسب عدد المتابعين/المشتركين المصرح بهم لكل منصة على حدة. Influencer لا يختار سعر الوكالة لهذه الخدمات؛ الأسعار المعتمدة هي الأسعار المنشورة في ملف العضوية والعقد.</p>
  <table><thead><tr><th>Platform</th><th>Followers</th><th>4 Stories</th><th>Reel + 4 Stories</th><th>Collab Reel + 4 Stories</th></tr></thead><tbody>${serviceRows(d)}</tbody></table>
  <p class="small">شرائح التسعير المعتمدة: ≤100K: 400/600/1500 DH؛ 110K–300K: 500/800/1900 DH؛ 310K–500K: 600/1000/2300 DH؛ 510K–700K: 700/1100/3000 DH؛ 700K+: 800/1200/3400 DH. تطبق القيم حسب الجدول أعلاه.</p>
  <h3>5. عمولة BRANDIRASCK — 15%</h3><p>تستحق BRANDIRASCK نسبة 15% عن كل خدمة يتم توفيرها للمؤثر عن طريق الوكالة أو يتم إسنادها للوكالة من طرف Influencer. تفاصيل التسوية والمبلغ الصافي المستحق للمؤثر تحدد حسب قيمة الخدمة والاتفاقية التجارية الخاصة بالحملة.</p>
  <h3>6. 4 Stories</h3><p>يلتزم Influencer بنشر أربع (4) Stories مرتبطة بالحملة أو المنتج/الخدمة المتفق عليها. يجب احترام المحتوى والتعليمات والموعد أو النافذة الزمنية التي تحددها BRANDIRASCK. أي تغيير في التوقيت أو التأجيل يجب الاتفاق عليه مسبقاً.</p>
  <h3>7. Reel + 4 Stories</h3><p>يلتزم Influencer بنشر الـReel مع أربع (4) Stories وفق الحملة. يبقى الـReel منشوراً في حساب Influencer لمدة شهر (1) من تاريخ النشر، ما لم تنص اتفاقية الحملة على غير ذلك. لا توجد Collab مع حساب المعلن/العميل في هذا العرض. لا يملك المعلن/العميل حق إطلاق إعلانات مدفوعة باستعمال الـReel إلا إذا تم الاتفاق كتابياً على حقوق إضافية.</p>
  <h3>8. Collab Reel + 4 Stories</h3><p>ينشر الـReel كتعاون (Collab) على حساب Influencer وحساب العميل/المعلن. يبقى المحتوى لمدة شهرين (2) من تاريخ النشر. يحق للمعلن/العميل استعمال الـCollab في الإعلانات المدفوعة خلال مدة الشهرين وفق العقد/اتفاقية الحملة. بعد انتهاء المدة، يمكن إزالة المحتوى وفق الشروط المتفق عليها.</p>
  <h3>9. احترام توقيت النشر</h3><p>يلتزم Influencer باحترام تاريخ ووقت أو نافذة النشر التي يتم إرسالها واعتمادها للحملة، سواء تعلق الأمر بـReel أو Story. لا يجوز تغيير التوقيت أو حذف/تعديل المحتوى أثناء المدة المتفق عليها دون موافقة مسبقة من BRANDIRASCK، باستثناء الحالات الضرورية أو القانونية أو التقنية التي يتم الإبلاغ عنها فوراً.</p>
  <h3>10. حقوق استعمال المحتوى والإعلانات</h3><p>تحدد حقوق إعادة الاستعمال، الإعلانات المدفوعة، الـBoosting، whitelisting أو أي استعمال تجاري إضافي حسب نوع الخدمة والاتفاقية. لا تنتقل حقوق غير منصوص عليها تلقائياً. خدمة Reel العادية لا تمنح العميل حق تشغيل إعلانات باستعمال الفيديو إلا باتفاق إضافي، بينما Collab Reel يسمح بحق الإعلان خلال مدة الشهرين وفق الاتفاق.</p>
  <h3>11. الالتزام والاحترافية</h3><p>يلتزم Influencer بالحضور والتواصل في الوقت المناسب، تقديم المحتوى المطلوب بجودة مناسبة، احترام التعليمات المعتمدة، عدم تغيير الرسالة الأساسية للحملة دون موافقة، والمحافظة على صورة مهنية أثناء تنفيذ الخدمة.</p>
  <h3>12. Followers والتحقق</h3><p>تعتبر أرقام المتابعين المصرح بها عند التسجيل أساساً للتسعير الأولي. أي تغيير جوهري في الأرقام يجب التصريح به، ولا يعتمد لتغيير السعر داخل شبكة BRANDIRASCK إلا بعد التحقق والموافقة من الوكالة.</p>
  <h3>13. Catalog والصور</h3><p>يوافق Influencer على استعمال المعلومات والصور التي يختارها لإظهار ملفه داخل Catalog الخاص بشبكة BRANDIRASCK، وفق حالة العضوية. الصور الثلاث المخصصة للـCatalog منفصلة عن Profile Photo ويمكن تحديثها وفق إجراءات الوكالة.</p>
  <h3>14. Promo Code و10% Reward</h3><p>يمكن لـBRANDIRASCK منح Influencer Promo Code خاصاً به عبر نظام الوكالة الرئيسي. هذا المشروع لا ينشئ ولا يدير أكواد الخصم. عن المشتريات المؤهلة التي تتم باستعمال كود Influencer، يستحق المؤثر Reward/Commission بنسبة 10% وفق آلية الوكالة. لا تشمل هذه النسبة خدمات Influencer Collaboration أو الخدمات الخارجية غير التابعة للوكالة. تفاصيل احتساب المبلغ والتسوية تعتمد على شروط الحملة/الشراء والنظام المعتمد.</p>
  <h3>15. Confidentiality</h3><p>يلتزم الطرفان بالحفاظ على سرية المعلومات التجارية، أسعار الحملات الخاصة، بيانات العملاء، وأي معلومات غير متاحة للعموم، ما لم يكن الإفصاح مطلوباً قانوناً أو تمت الموافقة عليه.</p>
  <h3>16. الأداء والتسوية</h3><p>تحدد آجال وطريقة الأداء لكل حملة أو خدمة في الاتفاق التجاري المرتبط بها. لا تعتبر مدة بقاء المحتوى أو تاريخ النشر وحدهما دليلاً على إتمام التسوية المالية ما لم تنص اتفاقية الحملة على ذلك.</p>
  <h3>17. الإلغاء والإنهاء</h3><p>أي إلغاء أو انسحاب من خدمة مؤكدة بعد اعتماد الحملة يخضع لشروط الحملة والتزامات الطرفين. لا يجوز لـInfluencer ترك حملة مؤكدة أو حذف محتوى خلال مدة الالتزام دون تنسيق مسبق، إلا لسبب مشروع أو حالة قاهرة يتم الإبلاغ عنها.</p>
  <h3>18. التعليق أو التجميد</h3><p>يجوز لـBRANDIRASCK تعليق عضوية Influencer أو إيقاف ظهوره في Catalog عند وجود معلومات غير صحيحة، إخلال متكرر بالالتزامات، مخالفة شروط الحملات، أو سلوك يضر بشكل جوهري بالوكالة أو عملائها، مع مراعاة ما تقتضيه الاتفاقيات القائمة.</p>
  <h3>19. دقة المعلومات</h3><p>يؤكد Influencer أن المعلومات والحسابات وأرقام المتابعين المقدمة صحيحة، ويتحمل مسؤولية تحديثها وإبلاغ الوكالة بأي تغيير جوهري.</p>
  <h3>20. استعمال اسم BRANDIRASCK</h3><p>لا يجوز استعمال اسم أو شعار BRANDIRASCK بطريقة توحي بتمثيل رسمي غير مصرح به أو بطريقة تضر بسمعة الوكالة.</p>
  <h3>21. القبول الرقمي</h3><p>يعتبر الضغط على «تأكيد الانضمام» بعد الاطلاع على العقد، مع وضع علامة القبول، موافقة رقمية على الشروط المبينة في هذه الوثيقة. يسجل النظام تاريخ ووقت الخادم ومرجع التسجيل.</p>
  <h3>22. مدة العضوية</h3><p>تبدأ العضوية من تاريخ ووقت تأكيد الانضمام وتستمر إلى حين الإنهاء أو التعليق وفق أحكام العقد. كل حملة قد تتضمن مدة مستقلة للمحتوى والحقوق كما هو مبين أعلاه.</p>
  <h3>23. أحكام ختامية</h3><p>يشكل هذا العقد الإطار العام للانضمام إلى شبكة BRANDIRASCK. أي شروط خاصة بحملة معينة، بما فيها موعد النشر، مدة بقاء المحتوى، حقوق الإعلانات، deliverables والتسوية، يمكن توثيقها في اتفاقية الحملة أو تعليمات مكتوبة لاحقة وتكون مكملة لهذا العقد.</p>
  <div class="contract-sign"><p><b>Influencer:</b> ${escapeHtml(d.name)} ${d.nickname?`(${escapeHtml(d.nickname)})`:''}</p><p><b>City:</b> ${escapeHtml(d.city||'—')}</p><p><b>Digital acceptance:</b> Pending confirmation</p><p><b>Server timestamp:</b> Generated automatically by BRANDIRASCK system</p></div>
  </div>
  <label class="notice"><input type="checkbox" id="accept"> أؤكد أنني قرأت وفهمت جميع شروط وبنود العقد وأوافق عليها.</label>
  <button class="btn" id="confirm">تأكيد الانضمام وإنشاء PDF</button>
  <button class="btn ghost" id="back2">رجوع</button>
  </div>`;
  $('#confirm').onclick=confirmReg; $('#back2').onclick=review;
}

async function makePdf(){
  const node = $('#contractPaper');
  const canvas = await html2canvas(node,{scale:2,useCORS:true,backgroundColor:'#ffffff'});
  const {jsPDF} = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const pageW=210,pageH=297,margin=8,imgW=pageW-margin*2;
  const pagePx=Math.floor(canvas.width*((pageH-margin*2)/imgW));
  let y=0,page=0;
  while(y<canvas.height){
    const h=Math.min(pagePx,canvas.height-y);
    const slice=document.createElement('canvas'); slice.width=canvas.width; slice.height=h;
    slice.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
    const img=slice.toDataURL('image/jpeg',0.92);
    if(page)pdf.addPage();
    pdf.addImage(img,'JPEG',margin,margin,imgW,(h/canvas.width)*imgW);
    y+=h;page++;
  }
  return pdf.output('blob');
}

function blobToBase64(blob){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result).split(',')[1] || '');
    reader.onerror=reject;
    reader.readAsDataURL(blob);
  });
}

async function confirmReg(){
  if(!$('#accept').checked)return alert('خاصك توافق على العقد.');

  const button = $('#confirm');
  button.disabled = true;
  button.textContent = 'جاري إنشاء التسجيل...';

  try {
    // أولاً نثبت التسجيل في السيرفر ونستعمل الـcode مرة واحدة.
    const result = await api('submit', {
      method: 'POST',
      body: { codeId: state.codeId, payload: state.data }
    });

    state.registrationId = result.registrationId;
    state.downloadToken = result.downloadToken;
    state.data.registrationId = result.registrationId;

    // نولد نسخة PDF في المتصفح، ثم نخزنها مؤقتاً في السيرفر.
    button.textContent = 'جاري تجهيز PDF...';
    const blob = await makePdf();
    const pdfBase64 = await blobToBase64(blob);

    try {
      await api('pdf', {
        method: 'POST',
        body: {
          registrationId: state.registrationId,
          downloadToken: state.downloadToken,
          pdfBase64
        }
      });
    } catch (pdfError) {
      throw new Error(pdfError.message === 'REGISTRATION_EXPIRED' ? 'REGISTRATION_EXPIRED' : 'PDF_UPLOAD_FAILED');
    }

    const wa = `السلام عليكم BRANDIRASCK،\nتم تأكيد انضمامي إلى شبكة Influencers.\nReference: ${state.registrationId}\nName: ${state.data.name}\nNickname: ${state.data.nickname}\nCity: ${state.data.city}`;
    const downloadUrl = `${API}?action=download-pdf&registrationId=${encodeURIComponent(state.registrationId)}&token=${encodeURIComponent(state.downloadToken)}`;

    steps.innerHTML=`<div class="success"><div class="ok">✓</div><h2>تم تأكيد الانضمام 🎉</h2><p>تم إنشاء التسجيل والعقد بنجاح.</p>
    <button class="btn" id="download">تحميل العقد PDF</button>
    <a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${WA}?text=${encodeURIComponent(wa)}">التواصل عبر WhatsApp</a>
    <div class="notice">Reference: <b>${escapeHtml(state.registrationId)}</b><br>الـPDF محفوظ مؤقتاً على السيرفر لمدة 30 دقيقة.</div></div>`;

    $('#download').onclick = () => {
      window.location.href = downloadUrl;
      setTimeout(() => { modal.classList.remove('open'); location.reload(); }, 1200);
    };
  } catch (error) {
    console.error(error);
    const message = error.message === 'CODE_NOT_AVAILABLE'
      ? 'هاد الرمز ما بقاش متاح. المرجو طلب رمز جديد.'
      : error.message === 'REGISTRATION_EXPIRED'
        ? 'انتهت صلاحية التسجيل المؤقت.'
        : error.message === 'PDF_UPLOAD_FAILED'
          ? 'التسجيل تسجل بنجاح، ولكن رفع الـPDF للسيرفر فشل. حاول تحميل/إعادة المحاولة قبل انتهاء 30 دقيقة.'
          : 'وقع مشكل أثناء تأكيد التسجيل. حاول مرة أخرى.';
    alert(message);
    button.disabled = false;
    button.textContent = 'تأكيد الانضمام وإنشاء PDF';
  }
}

async function loadCatalog(){
  const button = $('#loadCatalog');
  button.disabled = true;
  button.textContent = 'جاري التحميل...';

  try {
    const data = await api('catalog');
    const catalog = data.items || [];
    $('#catalog').innerHTML = catalog.length
      ? catalog.map(x => {
          const p = x.profile || x;
          const fallback = 'logo.jpeg';
          const image = p.profilePhoto || fallback;
          return `<article class="card"><img src="${escapeHtml(image)}" onerror="this.src='${fallback}'"><div class="body"><h3>${escapeHtml(p.nickname||p.name||'Influencer')}</h3><p>${escapeHtml(p.city||'')} · ${escapeHtml(p.type||'')}</p><div class="tags">${(p.categories||[]).slice(0,5).map(c=>`<span class="tag">${escapeHtml(c)}</span>`).join('')}</div></div></article>`;
        }).join('')
      : '<p class="muted">لا توجد حسابات Active حالياً.</p>';
  } catch (error) {
    $('#catalog').innerHTML = '<p class="muted">تعذر تحميل الكتالوج من السيرفر.</p>';
    console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = 'عرض الكتالوج';
  }
}
