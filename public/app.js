const $=s=>document.querySelector(s), modal=$('#modal'),steps=$('#steps');
const WA='212605320470';
let state={codeId:null,downloadToken:null,data:{categories:[],platforms:{},services:{}}};

const cats=['Influencer','Content Creator','Singer','Musician','Actor','Comedian','Gamer','Fashion','Beauty','Lifestyle','Fitness','Food','Travel','Education','Business','Photography','Other'];
const platforms=['Instagram','TikTok','Facebook','YouTube'];

function open(){modal.classList.add('open')}
function close(){modal.classList.remove('open')}
$('#start').onclick=()=>{open();renderCode()};
$('#close').onclick=close;
$('#catalogBtn').onclick=()=>document.querySelector('.catalog-section').scrollIntoView({behavior:'smooth'});
$('#loadCatalog').onclick=loadCatalog;

function renderCode(){
 steps.innerHTML=`<div class="step">
 <div class="eyebrow">PRIVATE REGISTRATION</div><h2>أدخل رمز التسجيل الخاص بك</h2>
 <p class="muted">الرمز صادر من BRANDIRASCK، صالح لمدة 30 دقيقة ويُستعمل مرة واحدة فقط.</p>
 <div class="field"><label>Registration Code</label><input id="code" autocomplete="off" placeholder="XXXXXXXXXXXX"></div>
 <div class="notice">ما عندكش Code؟ تقدر تطلبو من BRANDIRASCK عبر WhatsApp.</div>
 <button class="btn" id="verify">تحقق من الرمز</button>
 <a class="btn ghost" href="https://wa.me/${WA}?text=${encodeURIComponent('السلام عليكم، بغيت نطلب Registration Code للانضمام إلى شبكة BRANDIRASCK Influencers.')}" target="_blank">طلب Code عبر WhatsApp</a>
 </div>`;
 $('#verify').onclick=verify;
}

async function verify(){
 const code=$('#code').value.trim();
 const r=await fetch('/api/index?action=validate-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
 const j=await r.json();
 if(!r.ok)return alert('الرمز غير صالح أو انتهت صلاحيته.');
 state.codeId=j.codeId; renderForm();
}

function renderForm(){
 steps.innerHTML=`<div class="step">
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
 const sel=[...document.querySelectorAll('input[name=plat]:checked')];
 $('#socialFields').innerHTML=sel.map(x=>`<div class="service">
 <strong>${x.value}</strong><div class="form">
 <div class="field"><label>Username / Handle</label><input data-u="${x.value}"></div>
 <div class="field"><label>URL</label><input data-l="${x.value}"></div>
 <div class="field"><label>Followers / Subscribers</label><input data-f="${x.value}" type="number" min="0"></div>
 </div></div>`).join('');
}

function price(n){
 n=Number(n)||0;
 if(n<=100000)return{stories:400,reel:600,collab:1500};
 if(n<=300000)return{stories:500,reel:800,collab:1900};
 if(n<=500000)return{stories:600,reel:1000,collab:2300};
 if(n<=700000)return{stories:700,reel:1100,collab:3000};
 return{stories:800,reel:1200,collab:3400};
}

function collect(){
 const ps={};
 [...document.querySelectorAll('input[name=plat]:checked')].forEach(x=>{
  const n=x.value;
  ps[n]={username:$(`[data-u="${n}"]`)?.value.trim()||'',url:$(`[data-l="${n}"]`)?.value.trim()||'',followers:Number($(`[data-f="${n}"]`)?.value||0)};
 });
 const services={}; for(const [n,v] of Object.entries(ps)) services[n]={...v,prices:price(v.followers)};
 return {
  name:$('#name').value.trim(),nickname:$('#nickname').value.trim(),city:$('#city').value.trim(),
  type:$('#type').value,profilePhoto:$('#photo').value.trim(),
  categories:[...document.querySelectorAll('input[name=cat]:checked')].map(x=>x.value),
  platforms:ps,services,
  featuredPhotos:[$('#p1').value.trim(),$('#p2').value.trim(),$('#p3').value.trim()].filter(Boolean)
 };
}

function money(n){return `${Number(n).toLocaleString('fr-MA')} DH`}
function serviceRows(d){
 return Object.entries(d.services).map(([name,v])=>`<tr><td>${name}</td><td>${v.followers.toLocaleString('fr-MA')}</td><td>${money(v.prices.stories)}</td><td>${money(v.prices.reel)}</td><td>${money(v.prices.collab)}</td></tr>`).join('');
}

function review(){
 state.data=collect(); const d=state.data;
 if(!d.name||!Object.keys(d.platforms).length)return alert('دخل الاسم واختار على الأقل منصة واحدة.');
 steps.innerHTML=`<div class="step">
 <div class="eyebrow">REVIEW</div><h2>مراجعة المعلومات والأسعار</h2>
 <div class="contract-paper" id="reviewPaper">
 <h3>${d.nickname||d.name}</h3><p>${d.city} · ${d.type}</p>
 <p><b>Categories:</b> ${d.categories.join('، ')||'—'}</p>
 <table><thead><tr><th>Platform</th><th>Followers</th><th>4 Stories</th><th>Reel + 4 Stories</th><th>Collab Reel + 4 Stories</th></tr></thead><tbody>${serviceRows(d)}</tbody></table>
 <div class="notice"><b>15% Agency Commission:</b> أي خدمة تتم عبر BRANDIRASCK أو يتم إسنادها للوكالة تخضع لشروط الوكالة ونسبة 15% وفق العقد.</div>
 <div class="notice"><b>Promo Code:</b> كود خاص بالمؤثر يمكن أن يُمنح من طرف BRANDIRASCK. يمنح المؤثر 10% reward/commission على المشتريات المؤهلة باستعمال الكود، باستثناء خدمات Influencer Collaboration، وفق الشروط التعاقدية.</div>
 </div>
 <button class="btn" id="contract">عرض العقد الكامل</button><button class="btn ghost" id="back">رجوع</button></div>`;
 $('#contract').onclick=contract; $('#back').onclick=renderForm;
}

function contract(){
 const d=state.data;
 steps.innerHTML=`<div class="step">
 <div class="eyebrow">BRANDIRASCK · INFLUENCERS NETWORK</div>
 <div class="contract-paper" id="contractPaper">
 <div class="contract-head"><img src="/influencers/logo.jpeg"><div><h1>عقد الانضمام إلى شبكة المؤثرين</h1><p>BRANDIRASCK — Influencers / Creators / Artists Network</p></div></div>
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
 <div class="contract-sign"><p><b>Influencer:</b> ${d.name} ${d.nickname?`(${d.nickname})`:''}</p><p><b>City:</b> ${d.city||'—'}</p><p><b>Digital acceptance:</b> Pending confirmation</p><p><b>Server timestamp:</b> Generated automatically by BRANDIRASCK system</p></div>
 </div>
 <label class="notice"><input type="checkbox" id="accept"> أؤكد أنني قرأت وفهمت جميع شروط وبنود العقد وأوافق عليها.</label>
 <button class="btn" id="confirm">تأكيد الانضمام وإنشاء PDF</button>
 <button class="btn ghost" id="back2">رجوع</button>
 </div>`;
 $('#confirm').onclick=confirmReg; $('#back2').onclick=review;
}

async function makePdf(){
 const node=$('#contractPaper');
 const canvas=await html2canvas(node,{scale:2,useCORS:true,backgroundColor:'#ffffff'});
 const {jsPDF}=window.jspdf;
 const pdf=new jsPDF('p','mm','a4');
 const pageW=210,pageH=297,margin=8,imgW=pageW-margin*2;
 const pagePx=Math.floor(canvas.width*((pageH-margin*2)/imgW));
 let y=0, page=0;
 while(y<canvas.height){
  const h=Math.min(pagePx,canvas.height-y);
  const slice=document.createElement('canvas'); slice.width=canvas.width; slice.height=h;
  slice.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
  const img=slice.toDataURL('image/jpeg',0.92);
  if(page)pdf.addPage();
  pdf.addImage(img,'JPEG',margin,margin,imgW,(h/canvas.width)*imgW);
  y+=h; page++;
 }
 return pdf.output('blob');
}

async function confirmReg(){
 if(!$('#accept').checked)return alert('خاصك توافق على العقد.');
 const r=await fetch('/api/index?action=submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({codeId:state.codeId,payload:state.data})});
 const j=await r.json(); if(!r.ok)return alert(j.error||'حدث خطأ');
 const blob=await makePdf();
 const base64=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result.split(',')[1]);fr.onerror=reject;fr.readAsDataURL(blob)});
 const up=await fetch('/api/index?action=pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({registrationId:j.registrationId,downloadToken:j.downloadToken,pdfBase64:base64})});
 if(!up.ok)return alert('تم التسجيل لكن تعذر تسليم PDF المؤقت.');
 state.downloadToken=j.downloadToken; state.data.registrationId=j.registrationId;
 const wa=`السلام عليكم BRANDIRASCK،\nتم تأكيد انضمامي إلى شبكة Influencers.\nReference: ${j.registrationId}\nName: ${state.data.name}\nNickname: ${state.data.nickname}\nCity: ${state.data.city}`;
 steps.innerHTML=`<div class="success"><div class="ok">✓</div><h2>تم تأكيد الانضمام 🎉</h2><p>تم إنشاء العقد. الـPDF المتوفر عند النظام مؤقت فقط لمدة 30 دقيقة.</p>
 <button class="btn" id="download">تحميل العقد PDF</button>
 <a class="btn ghost" target="_blank" href="https://wa.me/${WA}?text=${encodeURIComponent(wa)}">التواصل عبر WhatsApp</a>
 <div class="notice">من بعد تحميل العقد، كتسالي جلسة التسجيل ومايمكنش ترجع للمعلومات أو تعاود تستعمل نفس Code. احتفظ بالنسخة عندك.</div></div>`;
 $('#download').onclick=downloadPdf;
}

async function downloadPdf(){
 const r=await fetch('/api/index?action=download-pdf&registrationId='+encodeURIComponent(state.data.registrationId||'')+'&token='+encodeURIComponent(state.downloadToken));
 if(!r.ok)return alert('انتهت صلاحية نسخة PDF المؤقتة.');
 const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='BRANDIRASCK-Influencer-Agreement.pdf';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 setTimeout(()=>{modal.classList.remove('open');location.reload()},1200);
}
async function loadCatalog(){
 const r=await fetch('/api/index?action=catalog');const j=await r.json();
 $('#catalog').innerHTML=j.items.length?j.items.map(x=>{const p=x.profile;return `<article class="card"><img src="${p.profilePhoto||'/influencers/logo.jpeg'}" onerror="this.src='/influencers/logo.jpeg'"><div class="body"><h3>${p.nickname||p.name}</h3><p>${p.city||''} · ${p.type||''}</p><div class="tags">${(p.categories||[]).slice(0,5).map(c=>`<span class="tag">${c}</span>`).join('')}</div></div></article>`}).join(''):'<p class="muted">لا توجد حسابات Active حالياً.</p>';
}
