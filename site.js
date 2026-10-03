(function(){
var b=document.getElementById('burger'),m=document.getElementById('mnav');
if(b&&m){b.addEventListener('click',function(){m.classList.toggle('open')});
m.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){m.classList.remove('open')})});}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
var f=document.querySelector('.contact form');
if(f){f.addEventListener('submit',function(e){e.preventDefault();
var st=document.getElementById('fstatus');
var hpEl=f.elements['hp_check'];
var data={name:f.name.value,email:f.email.value,phone:f.phone.value,type:f.type.value,message:f.message.value,hp:(hpEl?hpEl.value:'')};
var btn=f.querySelector('button');btn.disabled=true;btn.textContent='Sending\u2026';
fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
.then(function(r){if(!r.ok)throw new Error('api');return r.json()})
.then(function(){if(st){st.className='f-status ok';st.textContent='Enquiry sent \u2014 confirmation on its way to your inbox.'}if(window.gtag)gtag('event','generate_lead',{enquiry_type:data.type});f.reset();btn.textContent='Sent';})
.catch(function(){
var n=encodeURIComponent(data.name),em=encodeURIComponent(data.email),ph=encodeURIComponent(data.phone),t=encodeURIComponent(data.type),msg=encodeURIComponent(data.message);
location.href='mailto:enquiries@epccomponents.ie?cc=colmring2020@gmail.com&subject=Project%20Enquiry%20('+t+')&body=Name:%20'+n+'%0AEmail:%20'+em+'%0APhone:%20'+ph+'%0A%0A'+msg;
btn.disabled=false;btn.textContent='Send enquiry';
});
})}
})();
(function(){
function track(n,p){if(window.gtag)gtag('event',n,p||{});}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="tel:"],a[href^="mailto:"]');if(!a)return;var h=a.getAttribute('href');if(h.indexOf('tel:')===0)track('click_to_call',{link_url:h});else track('click_email',{link_url:h});});
var KEY='epc-consent',v=null;try{v=localStorage.getItem(KEY);}catch(e){}
if(v==='granted'||v==='denied')return;
var b=document.createElement('div');b.className='cc';b.setAttribute('role','dialog');b.setAttribute('aria-label','Cookie choice');
b.innerHTML='<p>We use analytics cookies to see how people use this site. No advertising, and nothing is sold on. <a href="/privacy">Privacy</a></p><button type="button" class="cc-no">Reject</button><button type="button" class="cc-ok">Accept</button>';
function set(c){try{localStorage.setItem(KEY,c);}catch(e){}if(window.gtag)gtag('consent','update',{analytics_storage:c});b.remove();}
b.querySelector('.cc-ok').addEventListener('click',function(){set('granted');});
b.querySelector('.cc-no').addEventListener('click',function(){set('denied');});
document.body.appendChild(b);
})();
document.addEventListener('click',function(e){var r=e.target.closest&&e.target.closest('[data-cookie-reset]');if(!r)return;e.preventDefault();try{localStorage.removeItem('epc-consent');}catch(x){}if(window.gtag)gtag('consent','update',{analytics_storage:'denied'});location.reload();});
