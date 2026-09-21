
/* =========================================================
   إعداد الربط:
   بعد نشر Google Apps Script كـ Web App، ضع الرابط هنا.
   مثال:
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwxFRwNBsumcsj85en8lBRynkBCn2Mda4uLF7reBUvLkLxWq2b2uAkJPS_lX70pH1W/exec";
   ========================================================= */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwxFRwNBsumcsj85en8lBRynkBCn2Mda4uLF7reBUvLkLxWq2b2uAkJPS_lX70pH1W/exec";

const PRODUCTS = [
  { id: "juz-amma", name: "جزء عمّ", price: 3 },
  { id: "juz-tabarak", name: "جزء تبارك", price: 3 },
  { id: "juz-mujadila", name: "جزء المجادلة", price: 3 },
  { id: "surah-yasin", name: "سورة يس", price: 3 },
  { id: "surah-kahf", name: "سورة الكهف", price: 3 },
  { id: "surah-baqarah", name: "سورة البقرة", price: 5 },
  { id: "nawawi40", name: "الأربعون النووية", price: 3 }
];

const DISTRICTS_BY_GOVERNORATE = {
  "عمّان": [
    "لواء قصبة عمّان",
    "لواء الجامعة",
    "لواء ماركا",
    "لواء القويسمة",
    "لواء وادي السير",
    "لواء سحاب",
    "لواء الجيزة",
    "لواء الموقر",
    "لواء ناعور"
  ],
  "إربد": [
    "لواء قصبة إربد",
    "لواء المزار الشمالي",
    "لواء الطيبة",
    "لواء الكورة",
    "لواء بني عبيد",
    "لواء الأغوار الشمالية",
    "لواء الوسطية",
    "لواء الرمثا",
    "لواء بني كنانة"
  ],
  "الزرقاء": [
    "لواء قصبة الزرقاء",
    "لواء الرصيفة",
    "لواء الهاشمية"
  ],
  "البلقاء": [
    "لواء قصبة السلط",
    "لواء الشونة الجنوبية",
    "لواء دير علا",
    "لواء عين الباشا",
    "لواء ماحص والفحيص"
  ],
  "المفرق": [
    "لواء قصبة المفرق",
    "لواء البادية الشمالية",
    "لواء البادية الشمالية الغربية",
    "لواء الرويشد"
  ],
  "جرش": [
    "لواء قصبة جرش"
  ],
  "عجلون": [
    "لواء قصبة عجلون",
    "لواء كفرنجة"
  ],
  "مادبا": [
    "لواء قصبة مادبا",
    "لواء ذيبان"
  ],
  "الكرك": [
    "لواء قصبة الكرك",
    "لواء المزار الجنوبي",
    "لواء الأغوار الجنوبية",
    "لواء القطرانة",
    "لواء القصر",
    "لواء فقوع",
    "لواء عي"
  ],
  "الطفيلة": [
    "لواء قصبة الطفيلة",
    "لواء بصيرا",
    "لواء الحسا"
  ],
  "معان": [
    "لواء قصبة معان",
    "لواء البتراء",
    "لواء الشوبك",
    "لواء الحسينية"
  ],
  "العقبة": [
    "لواء قصبة العقبة",
    "لواء القويرة"
  ]
};

const cart = new Map();

const $ = (id) => document.getElementById(id);
const money = (n) => `${Number(n).toFixed(2)} د.أ`;

function renderProducts(){
  $("productsGrid").innerHTML = PRODUCTS.map(p => `
    <article class="product-card">
      <div class="product-visual">
        <div class="book-icon" aria-hidden="true">📖</div>
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <div class="price">${p.price} دنانير <small>للكتاب</small></div>
        <div class="product-actions">
          <span class="qty-label">العدد</span>
          <div class="qty-control" aria-label="اختيار الكمية">
            <button type="button" onclick="changeProductQty('${p.id}',-1)" aria-label="إنقاص الكمية">−</button>
            <span id="qty-${p.id}">${cart.get(p.id) || 0}</span>
            <button type="button" onclick="changeProductQty('${p.id}',1)" aria-label="زيادة الكمية">+</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

window.changeProductQty = function(id, delta){
  let q = (cart.get(id) || 0) + delta;
  q = Math.max(0, Math.min(50, q));

  if(q === 0) cart.delete(id);
  else cart.set(id, q);

  const el = $(`qty-${id}`);
  if(el) el.textContent = q;
  renderCart();
};

window.changeCartQty = function(id, delta){
  changeProductQty(id, delta);
};

window.removeFromCart = function(id){
  cart.delete(id);
  const el = $(`qty-${id}`);
  if(el) el.textContent = "0";
  renderCart();
};

function shippingCost(){
  const gov = $("governorate").value;
  if(!gov) return null;
  return gov === "عمّان" ? 2 : 3;
}

function subtotal(){
  return PRODUCTS.reduce((sum,p)=>sum + p.price*(cart.get(p.id)||0),0);
}

function renderCart(){
  const items = PRODUCTS.filter(p => cart.has(p.id));
  $("cartCount").textContent = [...cart.values()].reduce((a,b)=>a+b,0);
  $("emptyCart").style.display = items.length ? "none" : "block";

  $("cartItems").innerHTML = items.map(p => {
    const qty = cart.get(p.id);
    return `
      <div class="cart-item">
        <div>
          <h4>${p.name}</h4>
          <small>${p.price} د.أ × ${qty}</small>
          <div class="qty-control" style="margin-top:8px;width:max-content">
            <button type="button" onclick="changeCartQty('${p.id}',-1)">−</button>
            <span>${qty}</span>
            <button type="button" onclick="changeCartQty('${p.id}',1)">+</button>
          </div>
        </div>
        <div class="line-total">${money(p.price*qty)}</div>
        <button class="remove" type="button" onclick="removeFromCart('${p.id}')">حذف</button>
      </div>`;
  }).join("");

  const sub = subtotal();
  const ship = shippingCost();
  $("subtotal").textContent = money(sub);
  $("shipping").textContent = ship === null ? "—" : money(ship);
  $("grandTotal").textContent = money(sub + (ship || 0));
}

function normalizePhone(v){
  return v.replace(/[^\d+]/g,"").replace(/^00962/,"0").replace(/^\+962/,"0");
}

function validate(){
  if(cart.size === 0) return "اختر عددًا لمنتج واحد على الأقل قبل إرسال الطلب.";
  const required = ["name","phone","governorate","area","address"];
  for(const id of required){
    if(!$(id).value.trim()) return "يرجى تعبئة جميع الحقول المطلوبة.";
  }
  const phone = normalizePhone($("phone").value);
  if(!/^07\d{8}$/.test(phone)) return "يرجى إدخال رقم هاتف أردني صحيح بصيغة 07XXXXXXXX.";
  if(!$("agree").checked) return "يرجى تأكيد صحة بيانات الطلب.";
  if(SCRIPT_URL.includes("PUT_YOUR")) return "الموقع غير مربوط بعد بملف الطلبات. يجب إضافة رابط Google Apps Script في ملف app.js.";
  return "";
}

function setMessage(text,type="error"){
  const el = $("formMessage");
  el.textContent = text;
  el.className = `form-message show ${type}`;
}
function clearMessage(){
  const el = $("formMessage");
  el.textContent = "";
  el.className = "form-message";
}

function makeOrderNo(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const rnd = Math.floor(10000 + Math.random()*90000);
  return `MM-${y}${m}${day}-${rnd}`;
}

function itemsPayload(){
  return PRODUCTS.filter(p=>cart.has(p.id)).map(p=>({
    id:p.id,name:p.name,price:p.price,qty:cart.get(p.id),lineTotal:p.price*cart.get(p.id)
  }));
}

function postOrder(payload){
  const body = new URLSearchParams();
  Object.entries(payload).forEach(([k,v]) => body.append(k, typeof v === "string" ? v : JSON.stringify(v)));
  return fetch(SCRIPT_URL,{
    method:"POST",
    mode:"no-cors",
    headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
    body:body.toString()
  });
}

function verifyOrder(orderNo, attempt=0){
  return new Promise((resolve,reject)=>{
    const cb = `cb_${Date.now()}_${Math.floor(Math.random()*100000)}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[cb];
      script.remove();
    };
    window[cb] = (data) => {
      cleanup();
      if(data && data.found) resolve(true);
      else if(attempt < 3) setTimeout(()=>verifyOrder(orderNo,attempt+1).then(resolve).catch(reject),900);
      else reject(new Error("not-found"));
    };
    script.onerror = () => {
      cleanup();
      if(attempt < 3) setTimeout(()=>verifyOrder(orderNo,attempt+1).then(resolve).catch(reject),900);
      else reject(new Error("verify-error"));
    };
    script.src = `${SCRIPT_URL}?action=check&orderNo=${encodeURIComponent(orderNo)}&callback=${encodeURIComponent(cb)}&_=${Date.now()}`;
    document.body.appendChild(script);
  });
}

function updateDistrictOptions(){
  const gov = $("governorate").value;
  const area = $("area");
  const districts = DISTRICTS_BY_GOVERNORATE[gov] || [];

  area.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = gov ? "اختر اللواء" : "اختر المحافظة أولًا";
  area.appendChild(first);

  districts.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    area.appendChild(option);
  });

  area.disabled = !gov;
  area.value = "";
}

$("governorate").addEventListener("change",()=>{
  updateDistrictOptions();
  renderCart();
});

$("orderForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  clearMessage();
  const err = validate();
  if(err){ setMessage(err); return; }

  const btn = $("submitBtn");
  btn.disabled = true;
  btn.textContent = "جارٍ إرسال الطلب...";

  const orderNo = makeOrderNo();
  const items = itemsPayload();
  const ship = shippingCost();
  const sub = subtotal();
  const payload = {
    orderNo,
    name:$("name").value.trim(),
    phone:normalizePhone($("phone").value),
    governorate:$("governorate").value,
    area:$("area").value.trim(),
    address:$("address").value.trim(),
    notes:$("notes").value.trim(),
    items,
    subtotal:sub,
    shipping:ship,
    total:sub+ship,
    payment:"الدفع عند الاستلام",
    source:"موقع الخرائط الذهنية"
  };

  try{
    await postOrder(payload);
    await new Promise(r=>setTimeout(r,800));
    await verifyOrder(orderNo);

    $("orderForm").hidden = true;
    $("successOrderNo").textContent = orderNo;
    $("successBox").hidden = false;
    $("successBox").scrollIntoView({behavior:"smooth",block:"center"});
  }catch(ex){
    setMessage("تعذر تأكيد حفظ الطلب في ملف الطلبات. تحقق من اتصال الإنترنت أو من رابط Google Apps Script ثم حاول مرة أخرى.");
  }finally{
    btn.disabled = false;
    btn.textContent = "تأكيد وإرسال الطلب";
  }
});

$("newOrderBtn").addEventListener("click",()=>{
  cart.clear();
  $("orderForm").reset();
  updateDistrictOptions();
  $("orderForm").hidden = false;
  $("successBox").hidden = true;
  renderProducts();
  renderCart();
  $("products").scrollIntoView({behavior:"smooth"});
});

renderProducts();
renderCart();
