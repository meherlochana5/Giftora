async function loadSummary(){
 if(!requireLogin())return;try{const items=await api('/cart');const total=items.reduce((s,x)=>s+Number(x.subtotal),0);document.getElementById('summary').innerHTML='<h3>Order Summary</h3>'+items.map(x=>`<p>${esc(x.name)} × ${x.quantity} — ${money(x.subtotal)}</p>`).join('')+`<h2>Total: ${money(total)}</h2>`;}catch(e){document.getElementById('msg').textContent=e.message;}}
document.getElementById('checkoutForm').onsubmit=async e=>{
 e.preventDefault();try{const d=await api('/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
 recipientName:recipientName.value,phone:phone.value,address:address.value,city:city.value,state:state.value,pincode:pincode.value})});
 document.getElementById('msg').textContent=`Order #GIF${String(d.orderId).padStart(5,'0')} received successfully. Thank you for shopping!`;document.getElementById('msg').className='success';setTimeout(()=>location.href='/orders.html',1200);
 }catch(x){document.getElementById('msg').textContent=x.message;document.getElementById('msg').className='error';}
};
document.addEventListener('DOMContentLoaded',loadSummary);
