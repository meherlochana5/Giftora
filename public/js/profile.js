async function loadProfile(){
 if(!requireLogin())return;const root=document.getElementById('profile');const u=getUser();
 root.innerHTML=`<div class="card"><p><b>Name:</b> ${esc(u.name)}</p><p><b>Email:</b> ${esc(u.email)}</p><p><b>Role:</b> ${esc(u.role)}</p><div class="actions"><a href="/orders.html"><button>My Orders</button></a><a href="/wishlist.html"><button>Wishlist</button></a><button onclick="logout()">Logout</button></div></div>`;
}
document.addEventListener('DOMContentLoaded',loadProfile);
