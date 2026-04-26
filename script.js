const DOMAIN = "@timpmeyl.indevs.in";
const INBOX_API = "https://temporary-emaill.netlify.app/api/messages";

function randomUsername(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let u = "";
  for (let i = 0; i < len; i++) u += chars[Math.floor(Math.random() * chars.length)];
  return u;
}
function generateRandomEmail() { return randomUsername() + DOMAIN; }
function generateCustomEmail(name) {
  const username = String(name || "").trim().toLowerCase().split("@")[0].replace(/[^a-z0-9]/g, "");
  return (username || randomUsername()) + DOMAIN;
}

const $ = (id) => document.getElementById(id);
const customName = $('customName');
const generateBtn = $('generateBtn');
const randomBtn = $('randomBtn');
const genBtnText = $('genBtnText');
const emailWrap = $('emailWrap');
const emailValue = $('emailValue');
const copyBtn = $('copyBtn');
const copyText = $('copyText');
const useBtn = $('useBtn');
const genErrorMsg = $('genErrorMsg');
const emailInput = $('emailInput');

let currentEmail = '';

function showGenError(m) { genErrorMsg.textContent = '⚠️ ' + m; genErrorMsg.classList.add('show'); setTimeout(() => genErrorMsg.classList.remove('show'), 4000); }

function setEmail(email) {
  currentEmail = email;
  emailValue.textContent = email;
  emailWrap.style.display = 'block';
  emailInput.value = email;
}

generateBtn.addEventListener('click', () => {
  const name = customName.value;
  const email = name.trim() ? generateCustomEmail(name) : generateRandomEmail();
  setEmail(email);
});

randomBtn.addEventListener('click', () => {
  customName.value = '';
  setEmail(generateRandomEmail());
});

copyBtn.addEventListener('click', async () => {
  if (!currentEmail) return;
  try {
    await navigator.clipboard.writeText(currentEmail);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = currentEmail; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
  }
  copyText.textContent = '✓ Copied';
  setTimeout(() => copyText.textContent = 'Copy', 1800);
});

useBtn.addEventListener('click', () => {
  if (currentEmail) emailInput.value = currentEmail;
  emailInput.focus();
  emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

const checkBtn = $('checkBtn');
const checkBtnText = $('checkBtnText');
const inboxErrorMsg = $('inboxErrorMsg');
const messagesWrap = $('messagesWrap');
let isChecking = false;

function showInboxError(m) { inboxErrorMsg.textContent = '⚠️ ' + m; inboxErrorMsg.classList.add('show'); setTimeout(() => inboxErrorMsg.classList.remove('show'), 4500); }
function escape(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }

async function fetchInbox(email) {
  const url = `${INBOX_API}?address=${encodeURIComponent(email)}&nocache=${Date.now()}`;
  const r = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.json();
}

function normalizeMessages(data) {
  let arr = [];
  if (Array.isArray(data)) arr = data;
  else if (Array.isArray(data?.messages)) arr = data.messages;
  else if (Array.isArray(data?.data)) arr = data.data;
  else if (Array.isArray(data?.emails)) arr = data.emails;
  else if (Array.isArray(data?.inbox)) arr = data.inbox;
  else if (data && typeof data === 'object') {
    const keys = Object.keys(data).filter(k => !isNaN(k));
    arr = keys.map(k => data[k]).filter(x => x && typeof x === 'object');
  }
  return arr.map(m => ({
    from: m.from || m.sender || m.fromAddress || m.from_address || 'Unknown sender',
    subject: m.subject || m.title || '(No subject)',
    date: m.date || m.created_at || m.createdAt || m.timestamp || m.receivedAt || '',
    body: m.body_text || m.text || m.body || m.message || m.content || m.html || '',
  }));
}

function renderMessages(list) {
  if (!list.length) {
    messagesWrap.innerHTML = `<div class="empty"><span class="em">📭</span>No messages yet. Try again in a few seconds.</div>`;
    return;
  }
  messagesWrap.innerHTML = `<div class="messages">${list.map(m => `
    <div class="msg" onclick="this.classList.toggle('expanded')">
      <div class="from">${escape(m.from)}</div>
      <div class="subj">${escape(m.subject)}</div>
      ${m.date ? `<div class="date">${escape(m.date)}</div>` : ''}
      <div class="preview">${escape(m.body)}</div>
    </div>
  `).join('')}</div>`;
}

checkBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!email) return showInboxError('Please enter a temporary email address.');
  if (isChecking) return;
  isChecking = true;
  checkBtn.disabled = true;
  checkBtnText.innerHTML = '<div class="spinner"></div> Checking…';
  messagesWrap.innerHTML = '';
  try {
    const data = await fetchInbox(email);
    console.log('inbox', data);
    renderMessages(normalizeMessages(data));
  } catch (e) {
    console.error(e);
    messagesWrap.innerHTML = `<div class="empty"><span class="em">📭</span>No messages found yet. Check back in a moment.</div>`;
  } finally {
    isChecking = false;
    checkBtn.disabled = false;
    checkBtnText.textContent = 'Check Inbox';
  }
});

emailInput.addEventListener('keypress', e => { if (e.key === 'Enter') checkBtn.click(); });
customName.addEventListener('keypress', e => { if (e.key === 'Enter') generateBtn.click(); });
