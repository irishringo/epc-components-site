(function(){
var b=document.getElementById('burger'),m=document.getElementById('mnav');
if(b&&m){b.addEventListener('click',function(){m.classList.toggle('open')});
m.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){m.classList.remove('open')})});}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
var f=document.querySelector('.contact form');
if(f){f.addEventListener('submit',function(e){e.preventDefault();
var st=document.getElementById('fstatus');
var data={name:f.name.value,email:f.email.value,phone:f.phone.value,type:f.type.value,message:f.message.value,company:f.company.value};
var btn=f.querySelector('button');btn.disabled=true;btn.textContent='Sending\u2026';
fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
.then(function(r){if(!r.ok)throw new Error('api');return r.json()})
.then(function(){if(st){st.className='f-status ok';st.textContent='Enquiry sent \u2014 confirmation on its way to your inbox.'}f.reset();btn.textContent='Sent';})
.catch(function(){
var n=encodeURIComponent(data.name),em=encodeURIComponent(data.email),ph=encodeURIComponent(data.phone),t=encodeURIComponent(data.type),msg=encodeURIComponent(data.message);
location.href='mailto:Ian_r@eircom.net?cc=colmring2020@gmail.com&subject=Project%20Enquiry%20('+t+')&body=Name:%20'+n+'%0AEmail:%20'+em+'%0APhone:%20'+ph+'%0A%0A'+msg;
btn.disabled=false;btn.textContent='Send enquiry';
});
})}
})();
