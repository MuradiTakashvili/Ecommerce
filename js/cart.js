import { getProducts } from "./api.js";
import { loadCart, saveCart } from "./store.js";
import { wireDropdown } from "./ui.js";

const TAX_RATE = 0.03;

$(async function() {
  wireDropdown("#catBtn", "#catMenu");

  const products = await getProducts();
  let cart = loadCart();

  function calcSubtotal() {
    return cart.reduce((sum, item) => {
      const p = products.find(x => x.id === item.productId);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  }

  function keyOf(item){ return `${item.productId}|${item.color}|${item.size}`; }

  function render() {
    $("#cartItems").html(cart.map(item => {
      const p = products.find(x => x.id === item.productId);
      if (!p) return "";
      return `
        <div class="cartRow" data-key="${keyOf(item)}">
          <div class="thumb"><img src="${p.images[0]}" alt=""></div>
          <div>
            <div class="cTitle">${p.title}</div>
            <div class="cMeta">Color: ${item.color} — Size: ${item.size}</div>
          </div>
          <div class="cPrice">$${p.price.toFixed(2)}</div>
          <div class="cQty">
            <button class="qtyBtn" data-act="minus">-</button>
            <div class="qtyVal">${item.qty}</div>
            <button class="qtyBtn" data-act="plus">+</button>
          </div>
          <button class="xBtn" data-act="remove">×</button>
        </div>
      `;
    }).join(""));

    const subtotal = calcSubtotal();
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    $("#subtotal").text(`$ ${subtotal.toFixed(2)}`);
    $("#tax").text(`$ ${tax.toFixed(2)}`);
    $("#total").text(`$ ${total.toFixed(2)}`);
  }

  function findIndexByKey(key) {
    const [id, color, size] = key.split("|");
    return cart.findIndex(x => x.productId === Number(id) && x.color === color && x.size === size);
  }

  $("#cartItems").on("click", ".qtyBtn, .xBtn", function() {
    const $row = $(this).closest(".cartRow");
    const key = $row.data("key");
    const i = findIndexByKey(key);
    if (i < 0) return;

    const act = $(this).data("act");
    if (act === "minus") {
      if (cart[i].qty > 1) cart[i].qty--;
    } else if (act === "plus") {
      cart[i].qty++;
    } else if (act === "remove") {
      cart = cart.filter((_, idx) => idx !== i);
    }
    saveCart(cart);
    render();
  });

  $("#checkoutBtn").on("click", () => location.href = "checkout.html");

  render();
});
