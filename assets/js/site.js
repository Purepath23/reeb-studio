/* REEB STUDIO — comportamenti del sito (nessuna dipendenza, nessun tracciamento) */
(function () {
  "use strict";

  /* Anno nel piè di pagina */
  var year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = year; });

  /* Menu su mobile */
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("nav-panel");
  if (toggle && panel) {
    var label = toggle.querySelector(".sr-only");
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Chiudi il menu" : "Apri il menu";
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* Comparsa degli elementi durante lo scorrimento */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Modulo contatti
     - Se data-endpoint contiene l'indirizzo di un servizio di invio moduli
       (es. Formspree), la richiesta viene inviata lì in JSON.
     - Altrimenti si apre il programma di posta con il messaggio già compilato
       verso l'indirizzo in data-email. */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var richiesta = params.get("richiesta");
  if (richiesta === "phonetic-ai") {
    var tema = form.querySelector("#cf-tema");
    if (tema) tema.value = "Phonetic AI";
  }

  var status = form.querySelector(".form-status");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, message) {
    var err = document.getElementById(input.id + "-err");
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    if (err) err.textContent = message || "";
    return !message;
  }

  function validate() {
    var nome = form.elements.nome;
    var email = form.elements.email;
    var messaggio = form.elements.messaggio;
    var privacy = form.elements.privacy;
    var ok = true;
    var first = null;

    if (!setError(nome, nome.value.trim().length < 2 ? "Inserisci il tuo nome." : "")) { ok = false; first = first || nome; }
    if (!setError(email, !emailRe.test(email.value.trim()) ? "Inserisci un indirizzo email valido." : "")) { ok = false; first = first || email; }
    if (!setError(messaggio, messaggio.value.trim().length < 10 ? "Scrivi qualche riga sulla tua richiesta." : "")) { ok = false; first = first || messaggio; }
    if (!setError(privacy, !privacy.checked ? "Per inviare la richiesta serve il consenso." : "")) { ok = false; first = first || privacy; }

    if (first) first.focus();
    return ok;
  }

  function show(message, type) {
    status.textContent = message;
    status.className = "form-status" + (type ? " is-" + type : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    show("");
    if (!validate()) return;

    var data = {
      nome: form.elements.nome.value.trim(),
      azienda: form.elements.azienda.value.trim(),
      email: form.elements.email.value.trim(),
      telefono: form.elements.telefono.value.trim(),
      tema: form.elements.tema.value,
      messaggio: form.elements.messaggio.value.trim()
    };

    var endpoint = form.getAttribute("data-endpoint");
    var button = form.querySelector('button[type="submit"]');

    if (endpoint) {
      button.disabled = true;
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        show("Grazie, abbiamo ricevuto la tua richiesta. Ti risponderemo al più presto.", "ok");
      }).catch(function () {
        show("Non è stato possibile inviare la richiesta. Riprova o scrivici a " + form.getAttribute("data-email") + ".", "error");
      }).finally(function () {
        button.disabled = false;
      });
      return;
    }

    var subject = "Richiesta dal sito — " + data.tema;
    var body = [
      "Nome: " + data.nome,
      data.azienda ? "Azienda: " + data.azienda : "",
      "Email: " + data.email,
      data.telefono ? "Telefono: " + data.telefono : "",
      "Argomento: " + data.tema,
      "",
      data.messaggio
    ].filter(function (line, i) { return line !== "" || i === 5; }).join("\n");

    window.location.href = "mailto:" + form.getAttribute("data-email") +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    show("Si è aperto il tuo programma di posta con il messaggio già pronto: premi «Invia» per inviarcelo.", "ok");
  });
})();
