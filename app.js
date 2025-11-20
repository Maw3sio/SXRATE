// app.js — logica dell'app SXRATE
const KRE = 4; // Costante Rum-Enzo (K•RE)

function $(id){ return document.getElementById(id); }

// schermate
const screens = ["home","inizio","risultato","storico"];
function showScreen(id){
  screens.forEach(s => document.getElementById(s).classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if(id === "storico") loadStorico();
}
document.getElementById("btn-inizio").onclick = () => showScreen("inizio");
document.getElementById("btn-storico").onclick = () => showScreen("storico");
document.getElementById("back-home").onclick = () => showScreen("home");
document.getElementById("to-home").onclick = () => showScreen("home");
document.getElementById("home-from-storico")?.addEventListener("click", ()=>showScreen("home"));

// validazione: impedire valori fuori range -> clamp automatico via oninput
for(let i=1;i<=9;i++){
  const el = $("p"+i);
  el.addEventListener("input", ()=> {
    if(el.value === "") return;
    let v = parseFloat(el.value);
    if(isNaN(v)) { el.value = "0.000"; return; }
    if(v < 0) v = 0;
    if(v > 10) v = 10;
    el.value = v.toFixed(3);
  });
  // inizializza visuale al giusto formato
  el.value = parseFloat(el.value||5).toFixed(3);
}

// bonus clamp
$("bonus").addEventListener("input", ()=> {
  let b = parseFloat($("bonus").value);
  if(isNaN(b)) { $("bonus").value = "0.000"; return; }
  if(b < 0) b = 0;
  if(b > 1) b = 1;
  $("bonus").value = b.toFixed(3);
});

// calculo
document.getElementById("calcola").addEventListener("click", ()=> {
  $("error").textContent = "";
  const nome = $("nome").value.trim();
  if(!nome){ $("error").textContent = "Inserisci un nome valido."; return; }

  // leggi parametri (già formattati a 3 decimali)
  let params = [];
  for(let i=1;i<=9;i++){
    let v = parseFloat($("p"+i).value);
    if(isNaN(v)){ $("error").textContent = "Compila tutti i parametri."; return; }
    params.push(v);
  }
  const bonus = parseFloat($("bonus").value) || 0;

  // media su scala 1-10
  const media10 = params.reduce((a,b)=>a+b,0)/params.length; // 1..10

  // applichiamo il bonus come incremento agibile: bonus è 0..1, lo aggiungiamo come punti (0..1)
  let x = media10 + bonus; // può arrivare fino a 11

  // funzione di conversione a 0..5 e tendenza infinita (usiamo KRE)
  function convert(x){
    // x è il valore su scala 0..11 (qui 0..11 approx)
    if(x <= 4){
      return 0.125 * x; // 0..0.5
    } else if (x <= 7){
      return 0.5 + ((x-4)/3) * 0.5; // 0.5..1
    } else if (x < 8.5){
      return 1.0; // plateau
    } else if (x <= 10){
      // esponenziale controllata con KRE
      return 1 + 4 * Math.pow((x - 8.5) / 1.5, KRE);
    } else {
      // x > 10 -> esplosione
      return 5 + Math.exp(KRE * (x - 10));
    }
  }

  const valore = convert(x);
  // salva ultimo risultato in memoria temporanea per eventuale salvataggio nello storico
  window.lastResult = {
    nome: nome,
    data: (new Date()).toLocaleString(),
    media10: media10.toFixed(3),
    bonus: bonus.toFixed(3),
    x_effective: x.toFixed(3),
    valore: (typeof valore === "number") ? valore : Number(valore)
  };

  // mostra risultato (formattato)
  $("valore").textContent = (typeof valore === "number") ? valore.toFixed(3) : String(valore);
  // didascalia
  let d = "";
  if(valore < 0.5) d = "ASSOLUTAMENTE NON CHIAVARE";
  else if (valore < 0.9) d = "SE È GIÀ DENTRO NON LO TOGLIERE";
  else if (valore < 4.5) d = "SCOPAAAAA";
  else if (valore < 5) d = "LIVELLO STXPRO";
  else d = "POTRESTI MORIRE PER CHIAVARCI";

  $("didascalia").textContent = d;
  showScreen("risultato");
});

// storico
function loadStorico(){
  const storico = JSON.parse(localStorage.getItem("sxrate_storico")||"[]");
  const lista = $("lista");
  if(!storico.length){ lista.innerHTML = "<p>Nessun risultato salvato.</p>"; return; }
  lista.innerHTML = storico.map(s=> {
    return `<p><strong>${escapeHtml(s.nome)}</strong> — ${s.valore} <span class="muted">(${s.data})</span></p>`;
  }).join("");
}
document.getElementById("save").addEventListener("click", ()=> {
  if(!window.lastResult) return;
  const storico = JSON.parse(localStorage.getItem("sxrate_storico")||"[]");
  storico.unshift({ nome: window.lastResult.nome, data: window.lastResult.data, valore: window.lastResult.valore.toFixed ? window.lastResult.valore.toFixed(3) : String(window.lastResult.valore) });
  // mantieni solo ultimi 200 risultati (sicurezza)
  localStorage.setItem("sxrate_storico", JSON.stringify(storico.slice(0,200)));
  loadStorico();
  showScreen("storico");
});
document.getElementById("clear").addEventListener("click", ()=> {
  if(confirm("Svuotare lo storico?")) {
    localStorage.removeItem("sxrate_storico");
    loadStorico();
  }
});

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// registra service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}

// al load
loadStorico();
