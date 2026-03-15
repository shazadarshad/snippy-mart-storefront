(function(){
  if(window.__eaWD) return;
  var extId=document.documentElement.dataset.eaEid;
  if(!extId) return;
  window.__eaWD=setInterval(function(){
    var img=new Image();
    img.onload=function(){};
    img.onerror=function(){
      clearInterval(window.__eaWD);
      window.__eaWD=null;
      try{
        document.cookie.split(';').forEach(function(c){
          var n=c.trim().split('=')[0];
          if(!n) return;
          var h=location.hostname;
          var pts=h.split('.');
          var base=pts.length>2?pts.slice(-2).join('.'):h;
          [h,'.'+h,base,'.'+base].forEach(function(dm){
            ['/',location.pathname].forEach(function(p){
              document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path='+p+';domain='+dm;
            });
          });
          document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });
      }catch(e){}
      try{localStorage.clear()}catch(e){}
      try{sessionStorage.clear()}catch(e){}
      document.title='Session Ended';
      document.body.innerHTML='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#0a0a0e;color:#f0ece4;display:flex;align-items:center;justify-content:center;z-index:999999;font-family:sans-serif;text-align:center"><div><h2 style="color:#D4AF37">Elite Access</h2><p style="color:#9a968e">Session ended. Extension was removed.</p><p style="color:#555;font-size:12px">Cookies will expire shortly.</p></div></div>';
      setTimeout(function(){location.reload()},95000);
    };
    img.src='chrome-extension://'+extId+'/icons/icon-16.png?_='+Date.now();
  },3000);
})();
