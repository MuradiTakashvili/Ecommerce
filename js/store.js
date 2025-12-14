const CART_KEY = "cart";

export function loadCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(item) {
  const cart = loadCart();
  const existing = cart.find(x =>
    x.productId === item.productId && x.color === item.color && x.size === item.size
  );
  if (existing) existing.qty += item.qty;
  else cart.push(item);
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}
