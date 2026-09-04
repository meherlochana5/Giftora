async function loadCart(){
 if(!requireLogin())return;const root=document.getElementById('cart');
 try{const items=await api('/cart');if(!items.length){root.innerHTML='<p>Your cart is empty.</p>';return;}
 let total=items.reduce((s,x)=>s+Number(x.subtotal),0);
 root.innerHTML=`<div class="card"><table class="table"><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr>${items.map(x=>`<tr><td>${esc(x.name)}</td><td><input style="max-width:90px" type="number" min="1" max="${x.stock}" value="${x.quantity}" onchange="updateQty(${x.product_id},this.value)"></td><td>${money(x.price)}</td><td>${money(x.subtotal)}</td><td><button class="danger" onclick="removeCart(${x.product_id})">Remove</button></td></tr>`).join('')}</table><h2>Total: ${money(total)}</h2><a href="/checkout.html"><button>Proceed to Checkout</button></a></div>`;}catch(e){root.innerHTML='<p class="error">'+esc(e.message)+'</p>';}
}
async function updateQty(id,q){try{await api('/cart/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({quantity:Number(q)})});loadCart();}catch(e){alert(e.message);loadCart();}}
async function removeCart(id){await api('/cart/'+id,{method:'DELETE'});loadCart();}
document.addEventListener('DOMContentLoaded',loadCart);
