import { getProducts } from "./api.js";
import { addToCart } from "./store.js";
import { wireDropdown } from "./ui.js";

function getId() {
  return Number(new URLSearchParams(location.search).get("id"));
}

$(async function() {
  wireDropdown("#catBtn", "#catMenu");

  const products = await getProducts();
  const product = products.find(p => p.id === getId());
  if (!product) return;

  $("#title").text(product.title);
  $("#price").text(`$${product.price.toFixed(2)}`);
  $("#descText").text(product.description || "");
  $("#stockPill").text(product.stock ? "IN STOCK" : "OUT OF STOCK");
  $("#mainImg").attr("src", product.images[0]).attr("alt", product.title);

  $("#colors").html((product.colors || []).map(c => `
    <div class="dot dot--${c}" data-c="${c}" title="${c}"></div>
  `).join(""));

  $("#sizes").html((product.sizes || []).map(s => `
    <button class="pill" data-s="${s}" type="button">${s}</button>
  `).join(""));

  let selectedColor = null;
  let selectedSize = null;
  let qty = 1;

  $("#colors").on("click", ".dot", function(){
    $("#colors .dot").removeClass("is-active");
    $(this).addClass("is-active");
    selectedColor = $(this).data("c");
  });

  $("#sizes").on("click", ".pill", function(){
    $("#sizes .pill").removeClass("is-active");
    $(this).addClass("is-active");
    selectedSize = $(this).data("s");
  });

  $("#qtyMinus").on("click", () => { if (qty > 1) qty--; $("#qty").text(qty); });
  $("#qtyPlus").on("click", () => { qty++; $("#qty").text(qty); });

  $("#addToCart").on("click", () => {
    if (!selectedColor) selectedColor = (product.colors && product.colors[0]) || "black";
    if (!selectedSize) selectedSize = (product.sizes && product.sizes[0]) || "M";

    addToCart({ productId: product.id, qty, color: selectedColor, size: selectedSize });
    location.href = "cart.html";
  });

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
  $("#relatedGrid").html(related.map(p => `
    <div class="product" data-id="${p.id}">
      <div class="product__img"><img src="${p.images[0]}" alt="${p.title}"></div>
      <div class="product__title">${p.title}</div>
      <div class="product__bottom">
        <span class="badge">${p.stock ? "IN STOCK" : "OUT OF STOCK"}</span>
        <span class="product__price">$${p.price.toFixed(2)}</span>
      </div>
    </div>
  `).join(""));

  $("#relatedGrid").on("click", ".product", function(){
    location.href = `details.html?id=${$(this).data("id")}`;
  });

  $("#catMenu").on("click", "a", function(e){
    e.preventDefault();
    location.href = "listing.html";
  });
});
