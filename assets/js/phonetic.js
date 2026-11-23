/* Phonetic AI — prepara il saluto della prossima chiamata alla demo.
   Filtro semplice per i nomi osceni: si confronta il nome senza accenti e senza simboli. */
(function () {
  "use strict";

  // Bloccate anche dentro altre parole o scritte attaccate (es. «stronzata», «porco dio»).
  var PAROLE_VIETATE = [
    "minchia", "merda", "stronz", "vaffanculo", "fanculo", "coglion", "mignott", "zoccol",
    "porcodio", "porcamadonna", "diocane", "dioporco", "madonnaputtana", "frocio",
    "fuck", "asshole", "nigger"
  ];
  // Bloccate solo se scritte da sole: sono anche pezzi di nomi veri
  // (Bar Negroni, La Puttanesca, Al Cazzotto). «Troia» (paese in Puglia) e «Dick» (nome) non ci sono apposta.
  var PAROLE_SOLO_INTERE = [
    "cazzo", "cazzi", "fica", "figa", "culo", "puttana", "puttane", "troie", "bastardo", "bastarda",
    "negro", "negri", "sega", "seghe", "pompino", "trombare", "scopare",
    "shit", "bitch", "cunt", "pussy", "whore", "slut"
  ];
  var LUNGHEZZA_MASSIMA = 80;

  function pulisci(testo) {
    return testo.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/@/g, "a")
      .replace(/[^a-z\s]/g, " ");
  }

  function eOsceno(nome) {
    var parole = pulisci(nome).split(/\s+/).filter(Boolean);
    var attaccato = parole.join("");
    return PAROLE_VIETATE.some(function (v) { return attaccato.indexOf(v) !== -1; }) ||
      PAROLE_SOLO_INTERE.some(function (v) { return parole.indexOf(v) !== -1; });
  }

  function contaLettere(testo) {
    return (testo.match(/\p{L}/gu) || []).length;
  }

  var modulo = document.getElementById("greeting-form");
  if (!modulo) return;
  var campo = document.getElementById("nome-locale");
  var telefono = document.getElementById("telefono-demo");
  var errore = document.getElementById("greeting-err");
  var esito = document.getElementById("greeting-out");
  var chiamata = document.getElementById("demo-personalizzata");
  var pulsante = modulo.querySelector("button[type=submit]");
  var scadenza;

  function azzeraEsito() {
    clearTimeout(scadenza);
    errore.textContent = "";
    esito.textContent = "";
    chiamata.hidden = true;
    campo.removeAttribute("aria-invalid");
    telefono.removeAttribute("aria-invalid");
  }

  function mostraErrore(campoErrato, messaggio) {
    errore.textContent = messaggio;
    if (!campoErrato) return;
    campoErrato.setAttribute("aria-invalid", "true");
    campoErrato.focus();
  }

  modulo.addEventListener("input", azzeraEsito);
  modulo.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (pulsante.disabled) return;
    azzeraEsito();
    var nome = campo.value.trim().replace(/\s+/g, " ");
    var numero = telefono.value.trim();
    if (contaLettere(nome) < 2) {
      return mostraErrore(campo, "Scrivi il nome del tuo locale.");
    }
    if (nome.length > LUNGHEZZA_MASSIMA) {
      return mostraErrore(campo, "Usa al massimo " + LUNGHEZZA_MASSIMA + " caratteri.");
    }
    if (eOsceno(nome)) {
      return mostraErrore(campo, "Scegli un altro nome per la prova.");
    }
    if (!/^\+?[0-9 () .-]+$/.test(numero) || numero.replace(/\D/g, "").length < 6) {
      return mostraErrore(telefono, "Scrivi il numero da cui chiamerai, con il prefisso internazionale se non è italiano.");
    }

    pulsante.disabled = campo.readOnly = telefono.readOnly = true;
    esito.textContent = "Sto preparando la chiamata…";
    var controllo = new AbortController();
    var attesa = setTimeout(function () { controllo.abort(); }, 8000);
    try {
      var risposta = await fetch(modulo.dataset.endpoint, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({nome: nome, telefono: numero}),
        signal: controllo.signal
      });
      if (risposta.status === 422) {
        var problema = await risposta.json();
        esito.textContent = "";
        campo.readOnly = telefono.readOnly = false;
        return problema.campo === "nome"
          ? mostraErrore(campo, "Controlla il nome del tuo locale e riprova.")
          : mostraErrore(telefono, "Controlla il numero da cui chiamerai e riprova.");
      }
      if (!risposta.ok) throw new Error("Demo non disponibile");
      var dati = await risposta.json();
      if (!Number.isFinite(dati.valida_per) || dati.valida_per <= 0) {
        throw new Error("Scadenza della demo non valida");
      }
      esito.textContent = "Saluto pronto per " + nome + ". Chiama adesso dallo stesso numero.";
      chiamata.hidden = false;
      scadenza = setTimeout(function () {
        chiamata.hidden = true;
        esito.textContent = "Il saluto è scaduto. Puoi preparare di nuovo la chiamata.";
      }, dati.valida_per * 1000);
    } catch (erroreRichiesta) {
      esito.textContent = "";
      mostraErrore(null, "Il saluto personalizzato non è disponibile in questo momento. Puoi comunque chiamare la demo.");
    } finally {
      clearTimeout(attesa);
      pulsante.disabled = campo.readOnly = telefono.readOnly = false;
    }
  });
})();
