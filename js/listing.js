import { getProducts } from "./api.js";
import { wireDropdown } from "./ui.js";

let products = [];
const PAGE_SIZE = 9;

let filters = {
  category: null,
  color: null,
  size: null,
  minPrice: 0,
  maxPrice: 100,
  search: "",
  sort: "default",
  page: 1
};

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function applyFilters(list) {
  return list
    .filter(p => !filters.category || p.category === filters.category)
    .filter(p => !filters.color || (p.colors || []).includes(filters.color))
    .filter(p => !filters.size || (p.sizes || []).includes(filters.size))
    .filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice)
    .filter(p => p.title.toLowerCase().includes(filters.search.toLowerCase()));
}

function applySort(list) {
  if (filters.sort === "price_asc") return [...list].sort((a,b)=>a.price-b.price);
  if (filters.sort === "price_desc") return [...list].sort((a,b)=>b.price-a.price);
  if (filters.sort === "name_asc") return [...list].sort((a,b)=>a.title.localeCompare(b.title));
  return list;
}

function paginate(list) {
  const start = (filters.page - 1) * PAGE_SIZE;
  return list.slice(start, start + PAGE_SIZE);
}

function renderApplied() {
  const tags = [];
  if (filters.category) tags.push({ key:"category", label: filters.category });
  if (filters.color) tags.push({ key:"color", label: filters.color });
  if (filters.size) tags.push({ key:"size", label: filters.size });
  if (filters.minPrice !== 0 || filters.maxPrice !== 100) {
    tags.push({ key:"price", label: `$${filters.minPrice} - $${filters.maxPrice}` });
  }
  if (filters.search.trim()) tags.push({ key:"search", label: `Search: ${filters.search.trim()}` });

  $("#appliedTags").html(tags.map(t => `
    <div class="tag" data-k="${t.key}">
      <span>${t.label}</span>
      <button class="tagX" type="button">×</button>
    </div>
  `).join(""));
}

function renderRange() {
  const min = filters.minPrice;
  const max = filters.maxPrice;

  $("#minPriceVal").text(`$${min}`);
  $("#maxPriceVal").text(`$${max}`);

  const left = (min / 100) * 100;
  const right = (max / 100) * 100;
  $("#trackFill").css({
    left: `${left}%`,
    width: `${right - left}%`
  });
}

function renderPagination(totalItems) {
  const pages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  filters.page = clamp(filters.page, 1, pages);

  const btn = (p, text = null, cls = "") =>
    `<button class="pageBtn ${cls} ${p===filters.page ? "is-active":""}" data-p="${p}">${text ?? p}</button>`;

  let html = "";
  html += `<button class="pageBtn icon" data-nav="prev">‹</button>`;

  if (pages <= 6) {
    for (let i=1;i<=pages;i++) html += btn(i);
  } else {
    html += btn(1);
    html += btn(2);
    html += btn(3);

    html += `<button class="pageBtn is-ghost" disabled>…</button>`;
    html += btn(pages);
  }

  html += `<button class="pageBtn icon" data-nav="next">›</button>`;
  $("#pagination").html(html);
}

function renderGrid() {
  const filtered = applySort(applyFilters(products));
  const pageItems = paginate(filtered);

  $("#showCount").text(pageItems.length);
  $("#totalCount").text(filtered.length);

  $("#grid").html(pageItems.map(p => `
    <div class="product" data-id="${p.id}">
      <div class="product__img">
        <img src="${p.images[0]}" alt="${p.title}">
      </div>
      <div class="product__title">${p.title}</div>
      <div class="product__bottom">
        <span class="badge">${p.stock ? "IN STOCK" : "OUT OF STOCK"}</span>
        <span class="product__price">$${p.price.toFixed(2)}</span>
      </div>
    </div>
  `).join(""));

  renderPagination(filtered.length);
  renderApplied();
}

function setSingleCategory(cat) {
  filters.category = cat;
  filters.page = 1;
  $(".cat").prop("checked", false);
  if (cat) $(`.cat[value="${cat}"]`).prop("checked", true);
}

function setActiveColor(c) {
  filters.color = c;
  filters.page = 1;
  $("#colorPicker .dot").removeClass("is-active");
  if (c) $(`#colorPicker .dot[data-color="${c}"]`).addClass("is-active");
}

function setActiveSize(s) {
  filters.size = s;
  filters.page = 1;
  $("#sizePicker .pill").removeClass("is-active");
  if (s) $(`#sizePicker .pill[data-size="${s}"]`).addClass("is-active");
}

function wireRange() {
  const $min = $("#minRange");
  const $max = $("#maxRange");

  $min.on("input", function(){
    const v = Number(this.value);
    filters.minPrice = clamp(v, 0, filters.maxPrice - 1);
    $min.val(filters.minPrice);
    renderRange();
    filters.page = 1;
    renderGrid();
  });

  $max.on("input", function(){
    const v = Number(this.value);
    filters.maxPrice = clamp(v, filters.minPrice + 1, 100);
    $max.val(filters.maxPrice);
    renderRange();
    filters.page = 1;
    renderGrid();
  });
}

$(async function() {
  products = await getProducts();

  wireDropdown("#catBtn", "#catMenu");
  wireDropdown("#sortBtn", "#sortMenu");

  $("#search").on("input", function() {
    filters.search = this.value;
    filters.page = 1;
    renderGrid();
  });

  $(".cat").on("change", function(){
    if (this.checked) setSingleCategory(this.value);
    else setSingleCategory(null);
    renderGrid();
  });

  $("#colorPicker").on("click", ".dot", function(){
    const c = $(this).data("color");
    setActiveColor(filters.color === c ? null : c);
    renderGrid();
  });

  $("#sizePicker").on("click", ".pill", function(){
    const s = $(this).data("size");
    setActiveSize(filters.size === s ? null : s);
    renderGrid();
  });

  $("#appliedTags").on("click", ".tagX", function(){
    const key = $(this).closest(".tag").data("k");
    if (key === "category") setSingleCategory(null);
    if (key === "color") setActiveColor(null);
    if (key === "size") setActiveSize(null);
    if (key === "price") { filters.minPrice = 0; filters.maxPrice = 100; $("#minRange").val(0); $("#maxRange").val(100); renderRange(); }
    if (key === "search") { filters.search = ""; $("#search").val(""); }
    filters.page = 1;
    renderGrid();
  });

  $("#pagination").on("click", ".pageBtn", function(){
    const nav = $(this).data("nav");
    const pages = Math.max(1, Math.ceil(applyFilters(products).length / PAGE_SIZE));

    if (nav === "prev") filters.page = clamp(filters.page - 1, 1, pages);
    else if (nav === "next") filters.page = clamp(filters.page + 1, 1, pages);
    else {
      const p = Number($(this).data("p"));
      if (p) filters.page = p;
    }
    renderGrid();
  });

  $("#grid").on("click", ".product", function(){
    const id = $(this).data("id");
    location.href = `details.html?id=${id}`;
  });

  $("#catMenu").on("click", "a", function(e){
    e.preventDefault();
    const cat = $(this).data("cat");
    setSingleCategory(cat || null);
    $("#catMenu").hide();
    renderGrid();
  });

  $("#sortMenu").on("click", "button", function(){
    filters.sort = $(this).data("sort");
    $("#sortBtnText").text($(this).text());
    $("#sortMenu").hide();
    filters.page = 1;
    renderGrid();
  });

  wireRange();
  renderRange();

  renderGrid();
});
