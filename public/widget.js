(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var CODE = script.getAttribute("data-code") || "";
  var COLOR = script.getAttribute("data-color") || "#6366f1";
  var TITLE = script.getAttribute("data-title") || "Fale Conosco";
  var POSITION = script.getAttribute("data-position") || "right";
  var SIZE = script.getAttribute("data-size") || "medium";
  var API_URL = "https://sbcjupyigboefiqfrjqk.supabase.co/functions/v1/save-leads";

  var sizeMap = {
    small:  { width: 280, btn: 44, icon: 22, title: 15, label: 11, input: "8px 10px", font: 13 },
    medium: { width: 340, btn: 56, icon: 28, title: 18, label: 12, input: "10px 12px", font: 14 },
    large:  { width: 400, btn: 64, icon: 32, title: 20, label: 13, input: "12px 14px", font: 15 }
  };
  var sz = sizeMap[SIZE] || sizeMap.medium;

  var isOpen = false;
  var container = null;

  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return r + "," + g + "," + b;
  }

  var rgb = hexToRgb(COLOR);

  function createWidget() {
    container = document.createElement("div");
    container.id = "leads360-widget";
    container.innerHTML =
      '<div id="l360-btn" style="' +
        "position:fixed;bottom:20px;" + (POSITION === "left" ? "left" : "right") + ":20px;" +
        "width:" + sz.btn + "px;height:" + sz.btn + "px;border-radius:14px;background:" + COLOR + ";" +
        "color:#fff;display:flex;align-items:center;justify-content:center;" +
        "cursor:pointer;box-shadow:0 4px 20px rgba(" + rgb + ",0.4);" +
        "z-index:999999;transition:transform .2s;" +
      '">' +
        '<svg width="' + sz.icon + '" height="' + sz.icon + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
        "</svg>" +
      "</div>" +
      '<div id="l360-form" style="' +
        "position:fixed;bottom:" + (sz.btn + 34) + "px;" + (POSITION === "left" ? "left" : "right") + ":20px;" +
        "width:" + sz.width + "px;max-width:calc(100vw - 40px);background:#fff;border-radius:16px;" +
        "box-shadow:0 10px 40px rgba(0,0,0,0.15);z-index:999999;" +
        "display:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
        'overflow:hidden;">' +
        '<div style="background:' + COLOR + ";padding:18px 20px;color:#fff;\">" +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="font-size:' + sz.title + 'px;font-weight:600">' + TITLE + "</span>" +
            '<span id="l360-close" style="cursor:pointer;font-size:22px;line-height:1;opacity:.8">&times;</span>' +
          "</div>" +
          '<p style="font-size:' + sz.label + 'px;opacity:.85;margin:4px 0 0">Preencha e entraremos em contato!</p>' +
        "</div>" +
        '<form id="l360-contact" style="padding:16px 20px 20px">' +
          '<div style="margin-bottom:12px">' +
            '<label style="display:block;font-size:' + sz.label + 'px;font-weight:500;color:#374151;margin-bottom:4px">Nome *</label>' +
            '<input name="name" required maxlength="100" style="' +
              'width:100%;padding:' + sz.input + ';border:1px solid #e5e7eb;border-radius:8px;font-size:' + sz.font + 'px;' +
              'box-sizing:border-box;outline:none;transition:border .2s" onfocus="this.style.borderColor=\'' + COLOR + '\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
          "</div>" +
          '<div style="margin-bottom:12px">' +
            '<label style="display:block;font-size:' + sz.label + 'px;font-weight:500;color:#374151;margin-bottom:4px">WhatsApp *</label>' +
            '<input name="phone" required maxlength="20" style="' +
              'width:100%;padding:' + sz.input + ';border:1px solid #e5e7eb;border-radius:8px;font-size:' + sz.font + 'px;' +
              'box-sizing:border-box;outline:none;transition:border .2s" onfocus="this.style.borderColor=\'' + COLOR + '\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
          "</div>" +
          '<div style="margin-bottom:12px">' +
            '<label style="display:block;font-size:' + sz.label + 'px;font-weight:500;color:#374151;margin-bottom:4px">E-mail</label>' +
            '<input name="email" type="email" maxlength="255" style="' +
              'width:100%;padding:' + sz.input + ';border:1px solid #e5e7eb;border-radius:8px;font-size:' + sz.font + 'px;' +
              'box-sizing:border-box;outline:none;transition:border .2s" onfocus="this.style.borderColor=\'' + COLOR + '\'" onblur="this.style.borderColor=\'#e5e7eb\'">' +
          "</div>" +
          '<div style="margin-bottom:16px">' +
            '<label style="display:block;font-size:' + sz.label + 'px;font-weight:500;color:#374151;margin-bottom:4px">Mensagem</label>' +
            '<textarea name="notes" maxlength="1000" rows="3" style="' +
              'width:100%;padding:' + sz.input + ';border:1px solid #e5e7eb;border-radius:8px;font-size:' + sz.font + 'px;' +
              'box-sizing:border-box;outline:none;resize:vertical;transition:border .2s;font-family:inherit" onfocus="this.style.borderColor=\'' + COLOR + '\'" onblur="this.style.borderColor=\'#e5e7eb\'"></textarea>' +
          "</div>" +
          '<button type="submit" id="l360-submit" style="' +
            "width:100%;padding:12px;background:" + COLOR + ";color:#fff;border:none;border-radius:8px;" +
            'font-size:' + sz.font + 'px;font-weight:600;cursor:pointer;transition:opacity .2s">' +
            "Enviar" +
          "</button>" +
        "</form>" +
        '<div id="l360-success" style="display:none;padding:40px 20px;text-align:center">' +
          '<div style="font-size:40px;margin-bottom:12px">✅</div>' +
          '<p style="font-size:16px;font-weight:600;color:#111827;margin:0 0 6px">Mensagem enviada!</p>' +
          '<p style="font-size:13px;color:#6b7280;margin:0">Entraremos em contato em breve.</p>' +
        "</div>" +
      "</div>";

    document.body.appendChild(container);

    // Events
    document.getElementById("l360-btn").addEventListener("click", toggleForm);
    document.getElementById("l360-close").addEventListener("click", toggleForm);
    document.getElementById("l360-contact").addEventListener("submit", handleSubmit);

    // Hover effect
    var btn = document.getElementById("l360-btn");
    btn.addEventListener("mouseenter", function () { btn.style.transform = "scale(1.1)"; });
    btn.addEventListener("mouseleave", function () { btn.style.transform = "scale(1)"; });
  }

  function toggleForm() {
    isOpen = !isOpen;
    var form = document.getElementById("l360-form");
    var btn = document.getElementById("l360-btn");
    form.style.display = isOpen ? "block" : "none";
    btn.innerHTML = isOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var btn = document.getElementById("l360-submit");
    var name = (form.elements.name.value || "").trim();
    var phone = (form.elements.phone.value || "").trim().replace(/\D/g, "");
    var email = (form.elements.email.value || "").trim();
    var notes = (form.elements.notes.value || "").trim();

    if (!name || name.length < 2) { alert("Preencha seu nome."); return; }
    if (phone.length < 10) { alert("Insira um número válido com DDD."); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert("E-mail inválido."); return; }

    btn.disabled = true;
    btn.textContent = "Enviando...";
    btn.style.opacity = "0.7";

    var xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("apikey", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiY2p1cHlpZ2JvZWZpcWZyanFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDU3MzksImV4cCI6MjA4NzgyMTczOX0.9VxZ2f5oV97aZ5cetiKXwKPa9yTpY9a0u8ewZOV_Fz4");
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        document.getElementById("l360-contact").style.display = "none";
        document.getElementById("l360-success").style.display = "block";
        setTimeout(function () {
          toggleForm();
          // Reset
          form.reset();
          document.getElementById("l360-contact").style.display = "block";
          document.getElementById("l360-success").style.display = "none";
          btn.disabled = false;
          btn.textContent = "Enviar";
          btn.style.opacity = "1";
        }, 3000);
      } else {
        alert("Erro ao enviar. Tente novamente.");
        btn.disabled = false;
        btn.textContent = "Enviar";
        btn.style.opacity = "1";
      }
    };
    xhr.onerror = function () {
      alert("Erro de conexão. Tente novamente.");
      btn.disabled = false;
      btn.textContent = "Enviar";
      btn.style.opacity = "1";
    };
    xhr.send(JSON.stringify({
      code: CODE,
      leads: [{ name: name, phone: phone, email: email || null, notes: notes || null, category: "Widget" }]
    }));
  }

  // Init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createWidget);
  } else {
    createWidget();
  }
})();
