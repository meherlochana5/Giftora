const API = '/api';

function getToken(){ return localStorage.getItem('giftora_token'); }
function getUser(){ try{return JSON.parse(localStorage.getItem('giftora_user'));}catch{return null;} }
function requireLogin() {

    if (getToken()) {
        return true;
    }

    showWebsiteMessage(
        'Please login or create an account to continue.',
        'error'
    );

    setTimeout(() => {
        location.href = '/login.html';
    }, 1500);

    return false;
}
function showWebsiteMessage(message, type = 'success') {

    const oldMessage = document.querySelector('.website-message');

    if (oldMessage) {
        oldMessage.remove();
    }

    const messageBox = document.createElement('div');

    messageBox.className = `website-message ${type}`;

    messageBox.textContent = message;

    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.classList.add('show');
    }, 10);

    setTimeout(() => {

        messageBox.classList.remove('show');

        setTimeout(() => {
            messageBox.remove();
        }, 300);

    }, 2500);
}
async function api(url, options={}){
  options.headers=options.headers||{};
  if(getToken()) options.headers.Authorization='Bearer '+getToken();
  const res=await fetch(API+url,options);
  let data={}; try{data=await res.json();}catch{}
  if(!res.ok) throw new Error(data.message||'Request failed');
  return data;
}
function money(n){return '₹'+Number(n).toFixed(2);}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

function renderNavbar(){
 const el=document.getElementById('navbar'); if(!el)return;
 const u=getUser();
 el.innerHTML=`<nav class="nav"><a class="brand" href="/">🎁 Giftora</a>
 <a href="/">Home</a><a href="/wishlist.html">Wishlist ❤️</a><a href="/cart.html">Cart 🛒</a>
 ${u?`<a href="/orders.html">Orders</a><a href="/profile.html">Profile</a><a href="#" onclick="logout()">Logout</a>`:`<a href="/login.html">Login</a><a href="/signup.html">Sign Up</a>`}
 </nav>`;
}
function logout(){localStorage.removeItem('giftora_token');localStorage.removeItem('giftora_user');location.href='/';}
document.addEventListener('DOMContentLoaded',renderNavbar);
