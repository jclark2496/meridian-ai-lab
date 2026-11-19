(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("nav.main");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
      });
    }

    // PDP gallery thumbs
    document.querySelectorAll("[data-gallery]").forEach((gal) => {
      const main = gal.querySelector("[data-gallery-main]");
      gal.querySelectorAll("[data-gallery-thumb]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const src = btn.getAttribute("data-src");
          if (main && src) main.src = src;
          gal.querySelectorAll("[data-gallery-thumb]").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    });

    // Size pills
    document.querySelectorAll(".size-row").forEach((row) => {
      row.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          row.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    });

    // Qty controls
    document.querySelectorAll(".qty-ctrl").forEach((ctrl) => {
      const input = ctrl.querySelector("input");
      ctrl.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          const d = Number(btn.getAttribute("data-delta") || 0);
          input.value = String(Math.max(1, Number(input.value || 1) + d));
        });
      });
    });

    // Add to cart buttons
    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const root = btn.closest("[data-product]") || document;
        const sizeBtn = root.querySelector(".size-row button.active");
        const qtyInput = root.querySelector(".qty-ctrl input");
        window.MeridianCart.add({
          id: btn.getAttribute("data-id"),
          name: btn.getAttribute("data-name"),
          price: Number(btn.getAttribute("data-price")),
          image: btn.getAttribute("data-image"),
          size: sizeBtn ? sizeBtn.textContent.trim() : "One size",
          qty: qtyInput ? Number(qtyInput.value || 1) : 1
        });
      });
    });

    // Shop filters (client-side hide/show)
    const grid = document.querySelector("[data-shop-grid]");
    if (grid) {
      const checks = document.querySelectorAll(".filters input[type=checkbox]");
      const sort = document.querySelector("[data-shop-sort]");
      const countEl = document.querySelector("[data-shop-count]");
      function apply() {
        const active = {};
        checks.forEach((c) => {
          if (!c.checked) return;
          (active[c.name] = active[c.name] || []).push(c.value);
        });
        let cards = [...grid.querySelectorAll("[data-product-card]")];
        cards.forEach((card) => {
          let show = true;
          for (const [key, vals] of Object.entries(active)) {
            const v = card.getAttribute("data-" + key);
            if (vals.length && !vals.includes(v)) show = false;
          }
          card.hidden = !show;
        });
        cards = cards.filter((c) => !c.hidden);
        if (sort && sort.value !== "featured") {
          const mode = sort.value;
          cards.sort((a, b) => {
            const pa = Number(a.getAttribute("data-price"));
            const pb = Number(b.getAttribute("data-price"));
            if (mode === "price-asc") return pa - pb;
            if (mode === "price-desc") return pb - pa;
            return a.getAttribute("data-name").localeCompare(b.getAttribute("data-name"));
          });
          cards.forEach((c) => grid.appendChild(c));
        }
        if (countEl) countEl.textContent = cards.length + " products";
      }
      checks.forEach((c) => c.addEventListener("change", apply));
      if (sort) sort.addEventListener("change", apply);
      apply();
    }

    // Render cart page
    const cartRoot = document.querySelector("[data-cart-page]");
    if (cartRoot && window.MeridianCart) {
      renderCart(cartRoot);
      window.addEventListener("meridian:cart", () => renderCart(cartRoot));
    }
  });

  function renderCart(root) {
    const items = window.MeridianCart.read();
    const empty = root.querySelector("[data-cart-empty]");
    const filled = root.querySelector("[data-cart-filled]");
    if (!items.length) {
      empty.hidden = false;
      filled.hidden = true;
      return;
    }
    empty.hidden = true;
    filled.hidden = false;
    const body = root.querySelector("[data-cart-body]");
    body.innerHTML = items
      .map(
        (i) => `<tr>
        <td>
          <div class="cart-item">
            <img src="${i.image}" alt="" />
            <div>
              <h3>${i.name}</h3>
              <div class="meta">Size: ${i.size}</div>
              <button type="button" class="cart-remove" data-remove="${i.id}" data-size="${i.size}">Remove</button>
            </div>
          </div>
        </td>
        <td>$${i.price.toFixed(0)}</td>
        <td>
          <div class="qty-ctrl">
            <button type="button" data-qdelta="-1" data-id="${i.id}" data-size="${i.size}">−</button>
            <input value="${i.qty}" readonly />
            <button type="button" data-qdelta="1" data-id="${i.id}" data-size="${i.size}">+</button>
          </div>
        </td>
        <td>$${(i.price * i.qty).toFixed(0)}</td>
      </tr>`
      )
      .join("");
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    root.querySelector("[data-subtotal]").textContent = "$" + sub.toFixed(0);
    root.querySelector("[data-total]").textContent = "$" + sub.toFixed(0);
    body.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () =>
        window.MeridianCart.remove(btn.getAttribute("data-remove"), btn.getAttribute("data-size"))
      );
    });
    body.querySelectorAll("[data-qdelta]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const size = btn.getAttribute("data-size");
        const row = window.MeridianCart.read().find((x) => x.id === id && x.size === size);
        if (!row) return;
        window.MeridianCart.setQty(id, size, row.qty + Number(btn.getAttribute("data-qdelta")));
      });
    });
  }
})();
