/* Phonetic AI — anteprima del saluto con il nome del locale.
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
  var errore = document.getElementById("greeting-err");
  var frase = document.getElementById("greeting-out");

  modulo.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = campo.value.trim().replace(/\s+/g, " ");
    var messaggio = "";
    if (contaLettere(nome) < 2) {
      messaggio = "Scrivi il nome del tuo locale.";
    } else if (nome.length > LUNGHEZZA_MASSIMA) {
      messaggio = "Il nome è troppo lungo: usa al massimo " + LUNGHEZZA_MASSIMA + " caratteri.";
    } else if (eOsceno(nome)) {
      messaggio = "Non possiamo usare questo nome per la prova. Modificalo e riprova.";
    }
    errore.textContent = messaggio;
    if (messaggio) {
      frase.textContent = "";
      campo.setAttribute("aria-invalid", "true");
      campo.focus();
      return;
    }
    campo.removeAttribute("aria-invalid");
    frase.textContent = "«" + nome + ", buonasera! Come posso aiutarla?»";
  });
})();
