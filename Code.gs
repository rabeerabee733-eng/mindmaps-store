
/**
 * الخلفية الخاصة بموقع الخرائط الذهنية.
 * اربط هذا المشروع بملف Google Sheets الذي تريد استقبال الطلبات فيه.
 *
 * خطوات النشر:
 * 1) افتح Extensions > Apps Script من ملف Google Sheets.
 * 2) الصق هذا الملف في Code.gs.
 * 3) Deploy > New deployment > Web app.
 * 4) Execute as: Me
 * 5) Who has access: Anyone
 * 6) انسخ رابط Web App وضعه في SCRIPT_URL داخل app.js.
 */

const SHEET_NAME = 'الطلبات';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('الخرائط الذهنية')
    .addItem('تهيئة ورقة الطلبات', 'setupOrdersSheet')
    .addItem('تصدير نسخة Excel إلى Drive', 'exportOrdersToExcel')
    .addToUi();
}

function setupOrdersSheet() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);

  const headers = [
    'التاريخ والوقت',
    'رقم الطلب',
    'اسم المستلم',
    'الهاتف',
    'المحافظة',
    'المنطقة / اللواء',
    'العنوان التفصيلي',
    'تفاصيل المنتجات',
    'عدد القطع',
    'قيمة الكتب',
    'التوصيل',
    'الإجمالي',
    'طريقة الدفع',
    'الملاحظات',
    'الحالة',
    'المصدر'
  ];

  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length)
      .setFontWeight('bold')
      .setBackground('#0a5a40')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  sh.autoResizeColumns(1, headers.length);
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = e.parameter || {};
    const sh = setupOrdersSheet();

    const orderNo = String(p.orderNo || '').trim();
    if (!orderNo) throw new Error('Missing orderNo');

    // يمنع تسجيل نفس الطلب مرتين
    if (findOrderRow_(sh, orderNo) > 0) {
      return json_({ok:true, duplicate:true, orderNo:orderNo});
    }

    let items = [];
    try { items = JSON.parse(p.items || '[]'); } catch (_) {}

    const itemText = items.map(x =>
      `${x.name} × ${x.qty} = ${Number(x.lineTotal || 0).toFixed(2)} د.أ`
    ).join(' | ');

    const qty = items.reduce((sum,x)=>sum + Number(x.qty || 0),0);

    sh.appendRow([
      new Date(),
      orderNo,
      safe_(p.name),
      safe_(p.phone),
      safe_(p.governorate),
      safe_(p.area),
      safe_(p.address),
      itemText,
      qty,
      num_(p.subtotal),
      num_(p.shipping),
      num_(p.total),
      safe_(p.payment || 'الدفع عند الاستلام'),
      safe_(p.notes),
      'جديد',
      safe_(p.source || 'الموقع')
    ]);

    return json_({ok:true, orderNo:orderNo});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = e.parameter || {};
  const action = p.action || '';

  if (action === 'check') {
    const callback = String(p.callback || 'callback').replace(/[^\w.$]/g,'');
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(SHEET_NAME);
    const found = sh ? findOrderRow_(sh, String(p.orderNo || '').trim()) > 0 : false;

    const out = `${callback}(${JSON.stringify({found:found})});`;
    return ContentService.createTextOutput(out)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_({ok:true, service:'mindmaps-orders'});
}

function findOrderRow_(sh, orderNo) {
  if (!orderNo || sh.getLastRow() < 2) return -1;
  const finder = sh.getRange(2,2,Math.max(sh.getLastRow()-1,1),1)
    .createTextFinder(orderNo)
    .matchEntireCell(true)
    .findNext();
  return finder ? finder.getRow() : -1;
}

function safe_(v) {
  v = String(v == null ? '' : v);
  // حماية بسيطة من صيغ الجداول عند الإدخال
  if (/^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ينشئ نسخة Excel من ملف الطلبات ويحفظها في Google Drive.
 * ستظهر النسخة باسم: طلبات الخرائط الذهنية YYYY-MM-DD.xlsx
 */
function exportOrdersToExcel() {
  const ss = SpreadsheetApp.getActive();
  const url = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=xlsx`;
  const token = ScriptApp.getOAuthToken();

  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  });

  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Amman', 'yyyy-MM-dd');
  const blob = response.getBlob().setName(`طلبات الخرائط الذهنية ${stamp}.xlsx`);
  const file = DriveApp.createFile(blob);

  SpreadsheetApp.getUi().alert('تم إنشاء ملف Excel في Google Drive:\n' + file.getName());
}
