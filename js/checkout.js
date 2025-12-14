import { getProducts } from "./api.js";
import { loadCart, clearCart } from "./store.js";
import { wireDropdown } from "./ui.js";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const zipRe = /^[0-9]{4,10}$/;
const TAX_RATE = 0.03;

$(async function() {
  wireDropdown("#catBtn", "#catMenu");

  const products = await getProducts();
  const cart = loadCart();

  const subtotal = cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  $("#subtotal").text(`$ ${subtotal.toFixed(2)}`);
  $("#tax").text(`$ ${tax.toFixed(2)}`);
  $("#total").text(`$ ${total.toFixed(2)}`);

  const uniqueIds = [];
  cart.forEach(item => {
    if (!uniqueIds.includes(item.productId)) uniqueIds.push(item.productId);
  });

  $("#miniThumbs").html(
    uniqueIds.slice(0, 3).map(id => {
      const p = products.find(x => x.id === id);
      if (!p) return "";
      return `
        <div class="mini">
          <img src="${p.images[0]}" alt="${p.title}">
        </div>
      `;
    }).join("")
  );

  $("#placeOrder").on("click", function() {
    const data = {
      street: $("#street").val().trim(),
      city: $("#city").val().trim(),
      state: $("#state").val().trim(),
      zip: $("#zip").val().trim(),
      country: $("#country").val().trim(),
      email: $("#email").val().trim(),
      fullName: $("#fullName").val().trim()
    };

    const ok =
      data.street && data.city && data.state && data.country && data.fullName &&
      emailRe.test(data.email) && zipRe.test(data.zip) &&
      cart.length > 0;

    if (!ok) return;

    sessionStorage.setItem("lastOrder", JSON.stringify({ data, cart, total }));
    clearCart();
    alert("Order placed");
  });
});
