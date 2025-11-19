function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function calculate() {

    let params = [];
    for (let i = 1; i <= 9; i++) {
        params.push(parseFloat(document.getElementById("p" + i).value));
    }

    let nome = document.getElementById("nome").value;
    let bonus = parseFloat(document.getElementById("bonus").value) || 0;

    // media 1–10
    let media10 = params.reduce((a,b) => a + b, 0) / 9;

    // media 0–1
    let media = media10 / 10;

    // applichiamo Costante Rum‑Enzo (K•RE)
    const KRE = 4;

    let valore = Math.pow(media, KRE) * 5 + bonus;

    // tendenza a infinito oltre 10
    if (media10 > 10) {
        valore = 5 + (Math.exp(media10 - 10) - 1);
    }

    document.getElementById("valore").innerHTML = valore.toFixed(3);

    // didascalie
    let d = "";

    if (valore < 0.5) d = "ASSOLUTAMENTE NON CHIAVARE";
    else if (valore < 0.9) d = "SE È GIÀ DENTRO NON LO TOGLIERE";
    else if (valore < 4.5) d = "SCOPAAAAA";
    else if (valore < 5) d = "LIVELLO STXPRO";
    else d = "POTRESTI MORIRE PER CHIAVARCI";

    document.getElementById("didascalia").innerHTML = d;

    window.lastResult = { nome, valore: valore.toFixed(3) };
    showScreen("risultato");
}

function saveResult() {
    let storico = JSON.parse(localStorage.getItem("storico") || "[]");

    storico.push(window.lastResult);

    localStorage.setItem("storico", JSON.stringify(storico));

    loadStorico();
    showScreen("storico");
}

function loadStorico() {
    let storico = JSON.parse(localStorage.getItem("storico") || "[]");
    let html = "";

    storico.forEach(el => {
        html += `<p><b>${el.nome}</b>: ${el.valore}</p>`;
    });

    document.getElementById("lista").innerHTML = html;
}

loadStorico();

// Registrazione PWA
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}
