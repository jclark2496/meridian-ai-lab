(function () {
  const KEY = "meridian_cart_v1";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  }
  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadges();
    window.dispatchEvent(new CustomEvent("meridian:cart", { detail: items }));
  }
  function updateBadges() {
    const n = read().reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  }
  function add(item) {
    const items = read();
    if (item.image) item.image = item.image.replace(/^(\.\.\/)+/, "").replace(/^\//, "");
    const idx = items.findIndex(
      (x) => x.id === item.id && x.size === item.size
    );
    if (idx >= 0) items[idx].qty += item.qty || 1;
    else items.push({ ...item, qty: item.qty || 1 });
    write(items);
    toast(`${item.name} added to cart`);
  }
  function remove(id, size) {
    write(read().filter((x) => !(x.id === id && x.size === size)));
  }
  function setQty(id, size, qty) {
    const items = read();
    const row = items.find((x) => x.id === id && x.size === size);
    if (!row) return;
    row.qty = Math.max(1, qty);
    write(items);
  }
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  window.MeridianCart = { read, write, add, remove, setQty, updateBadges, toast };
  document.addEventListener("DOMContentLoaded", updateBadges);
})();
