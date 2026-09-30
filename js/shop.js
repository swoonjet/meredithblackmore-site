/* ============ Shop ============ */
/* Rendered from products.json — managed via shop-admin.html.
   A card links to buy_url when set (a Square checkout link);
   until then the Buy button opens an enquiry form that emails
   the studio (FormSubmit relay). */

const ENQUIRY_TO = "meredithblackmore@yahoo.com";

function enquiryDialog() {
  let dlg = document.getElementById("enquiryDialog");
  if (dlg) return dlg;
  dlg = document.createElement("dialog");
  dlg.id = "enquiryDialog";
  dlg.innerHTML =
    `<form method="dialog" class="enq-close-row"><button class="enq-x" aria-label="Close">×</button></form>` +
    `<form class="enq-form" novalidate>` +
    `<h2 class="enq-title"></h2>` +
    `<p class="enq-sub">Send a note and Meredith will reply by email with payment and shipping details.</p>` +
    `<label>Your name<input name="name" required autocomplete="name"></label>` +
    `<label>Your email<input name="email" type="email" required autocomplete="email"></label>` +
    `<label>Message<textarea name="message" rows="4"></textarea></label>` +
    `<input type="text" name="_honey" tabindex="-1" autocomplete="off" style="display:none">` +
    `<button type="submit" class="card-cta enq-send">Send enquiry</button>` +
    `<p class="enq-status" role="status"></p>` +
    `</form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  const form = dlg.querySelector(".enq-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector(".enq-status");
    if (!form.name.value.trim() || !/^\S+@\S+\.\S+$/.test(form.email.value)) {
      status.textContent = "Please add your name and a valid email.";
      return;
    }
    const btn = form.querySelector(".enq-send");
    btn.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch("https://formsubmit.co/ajax/" + ENQUIRY_TO, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Shop enquiry: " + dlg.dataset.work,
          _replyto: form.email.value,
          _template: "table",
          _honey: form._honey.value,
          work: dlg.dataset.work,
          name: form.name.value,
          email: form.email.value,
          message: form.message.value,
        }),
      });
      if (!res.ok) throw new Error(res.status);
      form.innerHTML = `<h2 class="enq-title">Thank you</h2><p class="enq-sub">Your enquiry about “${dlg.dataset.work}” was sent. Meredith will be in touch by email.</p>`;
    } catch (err) {
      btn.disabled = false;
      status.innerHTML = `Something went wrong. Please email <a href="mailto:${ENQUIRY_TO}">${ENQUIRY_TO}</a> directly.`;
    }
  });
  return dlg;
}

function openEnquiry(p) {
  const dlg = enquiryDialog();
  dlg.dataset.work = p.title;
  const form = dlg.querySelector(".enq-form");
  if (!form.name) { dlg.remove(); return openEnquiry(p); }
  form.querySelector(".enq-title").textContent = p.title;
  form.message.value = `Hello, I'm interested in “${p.title}”.`;
  form.querySelector(".enq-status").textContent = "";
  form.querySelector(".enq-send").disabled = false;
  dlg.showModal();
}

(async function buildShop() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  let products = [];
  try {
    products = await (await fetch("products.json")).json();
  } catch (e) {
    return;
  }

  const shown = products
    .filter((p) => p.visible)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "sold" ? 1 : -1));

  const frag = document.createDocumentFragment();
  shown.forEach((p) => {
    const sold = p.status === "sold";
    const linked = !sold && p.buy_url;
    const card = document.createElement(linked ? "a" : "div");
    card.className = "product-card" + (sold ? " is-sold" : "");
    if (linked) {
      card.href = p.buy_url;
      card.target = "_blank";
      card.rel = "noopener";
    }

    const dollars = (p.price_cents / 100).toFixed(2);
    card.innerHTML =
      `<span class="card-media">` +
      `<img loading="lazy" src="${p.image}" alt="${p.title} — original painting">` +
      (sold ? `<span class="sold-badge">Sold</span>` : "") +
      `</span>` +
      `<h3>${p.title}</h3>` +
      (p.description ? `<p class="desc">${p.description}</p>` : "") +
      `<p class="price">$${dollars} ${p.currency}</p>` +
      (sold ? "" : linked ? `<span class="card-cta">Buy</span>` : `<button type="button" class="card-cta">Buy</button>`);
    const btn = card.querySelector("button.card-cta");
    if (btn) btn.addEventListener("click", () => openEnquiry(p));
    frag.appendChild(card);
  });
  grid.appendChild(frag);
})();
