/* app.js — logica multi-page SXRATE (no audio) */

/* Shared storage key */
const STORAGE_KEY = 'sxrate_inputs_v1';
const HISTORY_KEY = 'sxrate_history_v1';
const KRE = 4; // Costante Rum-Enzo

/* Utility helpers */
function clampNumber(n, min, max) {
  if (typeof n !== 'number' || isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function fmt3(n){ return Number(n).toFixed(3); }
function readStored(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||{} }catch(e){return{}}}
function writeStored(o){ localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); }
function pushHistory(obj){
  const h = JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
  h.unshift(obj);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0,500)));
}

/* PAGE: generic initializer for parameter pages */
function pageInit(opts){
  // opts: { pageId, nextPage, frases, isBonus(false) }
  const isBonus = !!opts.isBonus;
  const display = document.getElementById('display');
  const keypad = document.getElementById('keypad');
  const nextBtn = document.getElementById('nextBtn') || document.getElementById('finishBtn');

  // set random didascalia
  const didaEl = document.getElementById('didascalia') || document.getElementById('bonus-dida');
  if(didaEl) didaEl.textContent = opts.frases[Math.floor(Math.random()*opts.frases.length)];

  // create keypad (shared)
  const keys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
  keypad.innerHTML = keys.map(k=>`<button class="key" data-key="${k}">${k}</button>`).join('');
  keypad.addEventListener('click', (e)=>{
    const k = e.target?.dataset?.key;
    if(!k) return;
    handleKeyPress(k, display, isBonus);
  });

  // set initial display value from stored if present
  const stored = readStored();
  const curVal = stored[opts.pageId];
  display.value = (typeof curVal !== 'undefined') ? fmt3(clampNumber(Number(curVal), isBonus?0:0, isBonus?1:10)) : '';

  // next button handler
  if(nextBtn){
    nextBtn.addEventListener('click', ()=> {
      let v = parseFloat(display.value);
      if(isNaN(v)) v = isBonus ? 0 : NaN;
      // clamp
      if(isBonus) v = clampNumber(v, 0, 1);
      else v = clampNumber(v, 0, 10);

      if(!isBonus && isNaN(v)){ alert('Inserisci un valore valido (0.000 – 10.000)'); return; }

      // save
      const s = readStored();
      s[opts.pageId] = Number(fmt3(v));
      writeStored(s);

      // navigate
      window.location.href = opts.nextPage;
    });
  }
}

/* keypad behaviour */
function handleKeyPress(k, display, isBonus){
  // display is an <input readonly>
  let val = display.value || '';
  if(k === '⌫'){ val = val.slice(0,-1); display.value = val; return; }
  if(k === '.'){
    if(val.includes('.')) return;
    if(val === '') val = '0.';
    else val += '.';
    display.value = val;
    return;
  }
  // digit
  val += k;
  // prevent multiple digits before decimals becoming too long
  // limit total length depending on bonus or param
  const maxLen = isBonus ? 5 : 6; // e.g. '10.000' => 6 chars, bonus '1.000' => 5
  if(val.length > maxLen) val = val.slice(0, maxLen);
  // prevent values > allowed numeric max by quick parse
  const parsed = parseFloat(val);
  if(!isNaN(parsed)){
    if(!isBonus && parsed > 10) val = '10.000';
    if(isBonus && parsed > 1) val = '1.000';
  }
  display.value = val;
}

/* RESULT calculation (shared) */
function computeFinal(){
  const s = readStored();
  // expected keys: bellezza,tette,culo,fascino,voce,abb,pork,fiero,eta  (all numbers 0..10)
  const keys = ['bellezza','tette','culo','fascino','voce','abbigliamento','porkaggine','fiero','eta'];
  const values = keys.map(k=> clampNumber(Number(s[k]||0),0,10) );
  // if any missing, treat as 0
  const media10 = values.reduce((a,b)=>a+b,0)/values.length; // 0..10
  const bonus = clampNumber(Number(s['bonus']||0),0,1); // 0..1
  const x = media10 + bonus; // 0..11

  // Conversion as defined (mirrors earlier spec)
  function convert(x){
    if(x <= 4) return 0.125 * x;
    if(x <= 7) return 0.5 + ((x-4)/3)*0.5;
    if(x < 8.5) return 1.0;
    if(x <= 10) return 1 + 4 * Math.pow((x - 8.5)/1.5, KRE);
    return 5 + Math.exp(KRE * (x - 10));
  }

  const val = convert(x);
  return {
    value: val,
    media10: media10,
    bonus: bonus,
    x: x
  };
}

/* show result page */
function showResultPage(){
  const out = computeFinal();
  document.getElementById('result-value').textContent = fmt3(out.value);
  // caption
  let cap = '';
  if(out.value < 0.5) cap = "ASSOLUTAMENTE NON CHIAVARE";
  else if(out.value < 0.9) cap = "SE È GIÀ DENTRO NON LO TOGLIERE";
  else if(out.value < 4.5) cap = "SCOPAAAAA";
  else if(out.value < 5) cap = "LIVELLO STXPRO";
  else cap = "POTRESTI MORIRE PER CHIAVARCI";
  document.getElementById('result-caption').textContent = cap;
  document.getElementById('result-meta').textContent = `Media: ${fmt3(out.media10)} • Bonus: ${fmt3(out.bonus)} • x=${fmt3(out.x)}`;

  // save button
  document.getElementById('saveBtn').onclick = ()=>{
    const s = readStored();
    pushHistory({
      name: s['name'] || '—',
      value: Number(fmt3(out.value)),
      media10: fmt3(out.media10),
      bonus: fmt3(out.bonus),
      date: (new Date()).toLocaleString()
    });
    alert('Salvato nello storico.');
  };

  // share link (simple)
  document.getElementById('shareLink')?.setAttribute('href', '#');
}

/* history page */
function loadHistoryPage(){
  const list = document.getElementById('historyList');
  const h = JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
  if(!h.length){ list.innerHTML = '<p>Nessun risultato salvato.</p>'; return; }
  list.innerHTML = h.map(it=>`<p><strong>${it.name||'—'}</strong> — ${fmt3(it.value)} <span class="muted">(${it.date})</span></p>`).join('');
  document.getElementById('clearHistory').onclick = ()=>{
    if(confirm('Svuotare lo storico?')){ localStorage.removeItem(HISTORY_KEY); loadHistoryPage(); }
  };
}

/* helper: when entering first page, reset stored inputs and allow user to set name */
function startFlowReset(){
  localStorage.removeItem(STORAGE_KEY);
  // optional: store name via prompt
  const n = prompt('Inserisci il nome della persona (campo obbligatorio)');
  const s = readStored();
  s['name'] = n ? String(n).slice(0,40) : '—';
  writeStored(s);
}

/* Optional small function to attach on index -> start btn */
document.addEventListener('DOMContentLoaded', ()=>{
  const startBtn = document.getElementById('start-btn');
  if(startBtn) startBtn.onclick = ()=>{
    startFlowReset();
    window.location.href = 'param_bellezza.html';
  };
  const historyBtn = document.getElementById('history-btn');
  if(historyBtn) historyBtn.onclick = ()=> window.location.href = 'history.html';
});
