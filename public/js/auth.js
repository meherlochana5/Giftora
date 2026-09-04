function msg(text,cls=''){const e=document.getElementById('msg');if(e){e.textContent=text;e.className=cls;}}
const signup = document.getElementById('signupForm');

if (signup) {
    signup.onsubmit = async e => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;

        try {
            const d = await api('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            });

            localStorage.setItem('verify_user_id', d.userId);
            location.href = '/verify-otp.html';

        } catch (x) {
            msg(x.message, 'error');
        }
    };
}
const verify=document.getElementById('verifyForm');
if(verify) verify.onsubmit=async e=>{
 e.preventDefault();try{const d=await api('/auth/verify-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:localStorage.getItem('verify_user_id'),otp:otp.value})});msg(d.message,'success');setTimeout(()=>location.href='/login.html',800);}catch(x){msg(x.message,'error');}
};
const login=document.getElementById('loginForm');
if(login) login.onsubmit=async e=>{
 e.preventDefault();try{const d=await api('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.value,password:password.value})});
 localStorage.setItem('giftora_token',d.token);localStorage.setItem('giftora_user',JSON.stringify(d.user));location.href='/';
 }catch(x){msg(x.message,'error');}
};
const adminLogin=document.getElementById('adminLoginForm');

if(adminLogin) adminLogin.onsubmit=async e=>{

 e.preventDefault();try{const d=await api('/auth/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.value,password:password.value})});

 if(d.user.role!=='ADMIN') throw new Error('This is not an admin account.');

 localStorage.setItem('giftora_token',d.token);localStorage.setItem('giftora_user',JSON.stringify(d.user));location.href='/admin-dashboard.html';

 }catch(x){msg(x.message,'error');}

};
const adminSignup = document.getElementById('adminSignupForm');

if (adminSignup) {

    adminSignup.onsubmit = async e => {

        e.preventDefault();

        const name =
            document.getElementById('name').value.trim();

        const email =
            document.getElementById('email').value.trim();

        const phone =
            document.getElementById('phone').value.trim();

        const password =
            document.getElementById('password').value;

        const adminKey =
            document.getElementById('adminKey').value.trim();


        try {

            const d = await api('/auth/admin-register', {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    adminKey
                })

            });


            msg(d.message, 'success');

        } catch (x) {

            msg(x.message, 'error');

        }

    };

}
const forgot = document.getElementById('forgotForm');

if (forgot) {
    forgot.onsubmit = async e => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();

        try {
            const d = await api('/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email
                })
            });

            localStorage.setItem('reset_user_id', d.userId);

            location.href = '/reset-password.html';

        } catch (x) {
            msg(x.message, 'error');
        }
    };
}
const reset=document.getElementById('resetForm');
if(reset) reset.onsubmit=async e=>{
 e.preventDefault();try{const d=await api('/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:localStorage.getItem('reset_user_id'),otp:otp.value,newPassword:newPassword.value})});msg(d.message,'success');setTimeout(()=>location.href='/login.html',800);}catch(x){msg(x.message,'error');}
};
