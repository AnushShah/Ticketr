(function(){
"use strict";
var UP=["Majestic","Town Hall","Lalbagh","South End","Jayanagar 4th","Jayanagar 9th","JP Nagar 2nd","JP Nagar 6th","Puttenahalli","Konanakunte","Vajarahalli","Gubbalala"];
var FARE=[5,10,10,15,15,20,20,25,25,30,30];
var TRIPS=[["06:00","07:40"],["07:55","09:35"],["10:00","11:40"],["11:55","13:35"],["14:00","15:40"],["15:55","17:35"]];
/* Every category is a rule on the adult base fare. main = on the ticket page, the rest live under "All categories". */
var CATS=[
 {id:"wa",l:"Woman",main:1,women:1,f:function(b){return(S.opts.shakti&&S.opts.scheme==="free")?0:(S.opts.shakti&&S.opts.scheme==="half")?Math.ceil(b/2):b}},
 {id:"st",l:"Student",main:1,f:function(b){return Math.round(b*.75)}},
 {id:"ad",l:"Adult",main:1,f:function(b){return b}},
 {id:"ch",l:"Child",main:1,f:function(b){return Math.ceil(b/2)}},
 {id:"ps",l:"Pass holder",pass:1,f:function(b){return 0}},
 {id:"sr",l:"Senior citizen",f:function(b){return Math.round(b*.5)}},
 {id:"dv",l:"PwD",f:function(b){return Math.round(b*.25)}},
 {id:"lg",l:"Luggage",kg:1,f:function(b,kg){return Math.ceil(kg/10)*Math.ceil(b/2)}}];
function schemeTag(){return(S.opts.shakti&&S.opts.scheme!=="none")?(S.opts.scheme==="free"?"free":"half fare"):""}
function cat(id){return CATS.filter(function(c){return c.id===id})[0]}
/* Rush "who": tap to cycle through the four ticket-page categories. Adult is the default. */
var WHO=["ad","ch","wa","st"];
var WHOI={ad:'<circle cx="14" cy="10" r="4"/><path d="M6.5 23c0-4.2 3.4-7.5 7.5-7.5s7.5 3.3 7.5 7.5"/>',
 st:'<path d="M5.5 7.5 14 3.5l8.5 4-8.5 4z"/><circle cx="14" cy="14.5" r="3.2"/><path d="M7.5 25c0-3.7 2.9-6.3 6.5-6.3s6.5 2.6 6.5 6.3"/>',
 wa:'<circle cx="14" cy="7.5" r="3.6"/><path d="M14 13.2 8 24.5h12z"/>',
 ch:'<circle cx="14" cy="14" r="3.1"/><path d="M8.6 25c0-3.2 2.4-5.4 5.4-5.4s5.4 2.2 5.4 5.4"/>'};
var WSEL='<svg class="wsel" width="12" height="28" viewBox="0 0 12 28" fill="none" stroke="var(--k-ic-2c82ff)" stroke-width="1.4" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true"><path d="M9 10.6 3 14l6 3.4"/></svg>';
function whoIc(){return '<svg class="ic" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--k-ic-2c82ff)" stroke-width="1.4" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true"><path d="M12 10.6 18 14l-6 3.4"/></svg>'}
function whoSvg(id){return '<svg width="22" height="22" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+WHOI[id]+"</svg>"}
function defCnt(){var o={};CATS.forEach(function(c){o[c.id]=0});o.ad=1;return o}
var $=function(id){return document.getElementById(id)};
var S={screen:"start",open:null,tripSel:1,sstep:"login",lg:{id:"4821",pw:"ticketr26"},tripList:false,trip:null,stages:UP.slice(),cur:0,sel:null,entry:"",kerr:null,toMode:"pad",use:{},rush:{on:false,n:1,pay:"cash",who:"ad"},pre:false,H:720,cnt:defCnt(),kg:{open:false,pad:false,entry:""},
  bus:"5120",drv:"2231",exp:[],xid:1,xd:{type:null,val:""},tripKey:0,edit:null,coll:"duty",
  tickets:[],nextId:41,overlay:null,opts:{confirm:"complex",scheme:"half",shakti:true,net:true,paper:true,low:false,batt:82,order:"top",sound:true,vol:2},ddOpen:false,unsynced:0,arch:[],resumeInfo:false,ended:{val:"",done:false},vf:{val:"",res:null},pt:null,
  flash:null,printFree:0,upiTimer:null,upiShown:false};

/* ---------- helpers ---------- */
function last(){return S.stages.length-1}
function base(i){return FARE[Math.abs(i-S.cur)-1]||0}
function lines(){
  if(S.sel==null)return[];
  var b=base(S.sel);
  return CATS.filter(function(c){return S.cnt[c.id]>0}).map(function(c){var n=S.cnt[c.id];return c.kg?{c:c.id,n:n,u:null,amt:c.f(b,n)}:{c:c.id,n:n,u:c.f(b),amt:n*c.f(b)}});
}
function sumAmt(ls){return ls.reduce(function(a,x){return a+x.amt},0)}
function extraCats(){var o=CATS.filter(function(c){return!c.main&&!c.kg}).sort(function(a,b){return(S.use[b.id]||0)-(S.use[a.id]||0)||CATS.indexOf(a)-CATS.indexOf(b)});return o.concat(CATS.filter(function(c){return c.kg}))}
function cntText(){return CATS.filter(function(c){return S.cnt[c.id]>0}).map(function(c){return c.kg?S.cnt[c.id]+" kg "+c.l:S.cnt[c.id]+" "+c.l}).join(", ")}
function lineQ(x){var c=cat(x.c);return c.kg?x.n+" kg "+c.l:x.n+" "+c.l}
function pax(t){return t.lines.map(lineQ).join(", ")}
function payKind(ls){if(!ls.length)return"none";if(ls.every(function(x){return cat(x.c).pass}))return"pass";return sumAmt(ls)===0?"free":"pay"}
function needConfirm(ls){return false;var m=S.opts.confirm;return m==="always"||(m==="complex"&&payKind(ls)!=="pass"&&ls.some(function(x){return!cat(x.c).main}))}
function no(i){return S.trip&&S.trip.dir==="Down"?S.stages.length-i:i+1}
function idxOf(n){return S.trip&&S.trip.dir==="Down"?S.stages.length-n:n-1}
function stageValid(n){var k=idxOf(n);return n>=1&&n<=S.stages.length&&k>S.cur&&k<=last()}
function dutyAll(){return S.arch.concat(S.tickets)}
function modeLabel(t){return t.mode==="free"?"Scheme":t.mode==="cash"?"Cash":t.mode==="pass"?"Pass":"UPI"}
function openDD(){return S.sel==null||S.ddOpen}
function flashTone(f){if(f.tone)return"t-"+f.tone;var t=f.text||"";return/^Out of paper/.test(t)?"t-err":/^(Battery|Paper low|Offline)/.test(t)?"t-warn":/^Voided/.test(t)?"t-void":"t-ok"}
function flashWarn(a,b,ms){S.flash={text:a,sub:b,until:Date.now()+(ms||4000)};if(S.screen==="core")renderStrip();setTimeout(function(){if(S.screen==="core")renderStrip()},(ms||4000)+100)}
function pad(n){return String(n).padStart(4,"0")}
function nowStr(){var d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}
function lastTicket(){for(var i=S.tickets.length-1;i>=0;i--){var s=S.tickets[i].status;if(s==="printing"||s==="printed"||s==="fault"||s==="counted")return S.tickets[i]}return null}
function byId(id){return S.tickets.filter(function(t){return t.id===id})[0]}
function canRepeat(){return!!lastTicket()}

/* ---------- feedback ---------- */
var actx=null;
function audio(){try{if(!actx){var C=window.AudioContext||window.webkitAudioContext;if(C)actx=new C()}if(actx&&actx.state==="suspended")actx.resume()}catch(e){}}
var lastSnd=0,noiseBuf=null;
function lvl(){return[0,.04,.08,.14][S.opts.vol]}
/* soft pitched pop: a sine with a quick pitch glide, an optional glassy octave overtone, low-passed so it never gets sharp */
function blip(f0,f1,d,gain,when,glass){if(!S.opts.sound||!actx||S.opts.vol===0)return;try{
  var t=actx.currentTime+(when||0),g=actx.createGain(),lp=actx.createBiquadFilter();
  lp.type="lowpass";lp.frequency.value=5200;lp.Q.value=.5;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(lvl()*(gain||1),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  g.connect(lp);lp.connect(actx.destination);
  [[1,1],[2,glass?.2:0]].forEach(function(p){if(!p[1])return;var o=actx.createOscillator(),og=actx.createGain();
    o.type="sine";o.frequency.setValueAtTime(f0*p[0],t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(f1*p[0],t+d*.7);
    og.gain.value=p[1];o.connect(og);og.connect(g);o.start(t);o.stop(t+d+.02)})}catch(e){}}
/* tiny filtered-noise transient: the tactile "tap" under a blip */
function snap(when,gain,freq){if(!S.opts.sound||!actx||S.opts.vol===0)return;try{
  if(!noiseBuf){var n=Math.floor(actx.sampleRate*.03),b=actx.createBuffer(1,n,actx.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=Math.random()*2-1;noiseBuf=b}
  var t=actx.currentTime+(when||0),src=actx.createBufferSource(),f=actx.createBiquadFilter(),g=actx.createGain();
  src.buffer=noiseBuf;f.type="bandpass";f.frequency.value=freq||3000;f.Q.value=1.1;
  g.gain.setValueAtTime(lvl()*(gain||1),t);g.gain.exponentialRampToValueAtTime(.0001,t+.014);
  src.connect(f);f.connect(g);g.connect(actx.destination);src.start(t);src.stop(t+.03)}catch(e){}}
function vib(p){try{if(navigator.vibrate)navigator.vibrate(p)}catch(e){}}
/* sounds are gated: soft, one per action, never stacked. Haptics always fire. */
function snd(fn,force){var n=Date.now();if(!force&&n-lastSnd<150)return;lastSnd=n;fn()}
var fx={tick:function(){vib(8)},
  /* short, soft, tactile: every sound is under ~0.3 s */
  press:function(){vib(18);snd(function(){snap(0,1.4,2600);blip(760,430,.075,.9)})},
  printed:function(){vib(25);snd(function(){snap(0,1,4200);blip(1250,1560,.07,.55)})},
  free:function(){vib(25);snd(function(){snap(0,1,3200);blip(880,880,.1,.7,0,1);blip(1320,1320,.14,.7,.075,1)})},
  paid:function(){vib([30,50,30]);snd(function(){snap(0,1,3600);blip(1047,1047,.11,.7,0,1);blip(1568,1568,.2,.75,.085,1)})},
  void:function(){vib(60);snd(function(){snap(0,1,1800);blip(640,330,.13,.8)})},
  error:function(){vib([30,40,30,40,30]);snd(function(){snap(0,1.2,1500);blip(300,210,.1,1);snap(.12,1.2,1500);blip(300,210,.1,1,.12)},true)}};

/* ---------- state actions ---------- */
function resetRush(){S.rush.on=false;S.rush.n=1;S.rush.who="ad";S.rush.pop=false}
function resetPick(){S.sel=null;S.ddOpen=false;S.open=null;S.entry="";S.kerr=null;S.cnt=defCnt();S.pre=false;S.kg={open:false,pad:false,entry:""}}
function startTrip(){S.tripKey++;
  var down=S.tripSel%2===0;S.stages=down?UP.slice().reverse():UP.slice();S.trip={n:S.tripSel,dir:down?"Down":"Up"};
  S.arch=S.arch.concat(S.tickets);S.cur=0;resetPick();S.tickets=[];S.flash=null;S.resumeInfo=false;S.pt=null;S.screen="core";S.overlay=null;resetRush();render();
}
function rushIssue(){var w=S.rush.who||"ad";S.cnt=defCnt();S.cnt.ad=0;S.cnt[w]=S.rush.n;S.rush.n=1;issue(payKind(lines())==="free"?"free":"cash")}
function go(mode){
  var ls=lines();if(S.sel==null||!ls.length)return;
  if(mode==="upi"){openUpay();return}
  if(needConfirm(ls)){S.overlay={type:"cfm",mode:mode};renderOverlay()}else issue(mode);
}
function issue(mode){
  if(S.sel==null)return;
  var ls=lines();if(!ls.length)return;
  if(S.overlay&&(S.overlay.type==="cfm"||S.overlay.type==="cats"||S.overlay.type==="upay"))S.overlay=null;clearInterval(S.upiTimer);
  var tot=sumAmt(ls);
  ls.forEach(function(x){S.use[x.c]=(S.use[x.c]||0)+1});
  var t={id:S.nextId++,destIdx:S.sel,dest:S.stages[S.sel],lines:ls,amount:tot,mode:mode,status:"recorded",ts:Date.now(),boardIdx:S.cur};
  S.tickets.push(t);
  if(!S.opts.net)S.unsynced++;
  resetPick();
  if(mode==="upi"){fx.paid();S.flash={text:"₹"+t.amount+" paid by UPI",sub:"Ticket #"+pad(t.id)+" printing",until:Date.now()+2000,rep:1};startPrint(t);setTimeout(renderStrip,2100)}
  else if(mode==="pass"){t.status="counted";fx.press();var pcn=ls.reduce(function(a,x){return a+x.n},0);S.flash={text:pcn+(pcn===1?" pass":" passes")+" counted",sub:"No ticket printed for #"+pad(t.id),until:Date.now()+1800,rep:1};setTimeout(renderStrip,1900)}
  else{fx[mode==="free"?"free":"press"]();startPrint(t)}
  render();
}
function startPrint(t){
  if(!S.opts.paper){t.status="fault";fx.error();return}
  t.status="printing";
  var at=Math.max(Date.now(),S.printFree)+1000;S.printFree=at;
  setTimeout(function(){
    if(t.status!=="printing")return;
    if(!S.opts.paper){t.status="fault";fx.error();renderStrip();return}
    t.status="printed";addSlip(t);vib(25);renderStrip();
  },at-Date.now());
}
function retry(){
  var f=S.tickets.filter(function(t){return t.status==="fault"});
  if(!f.length)return;
  if(!S.opts.paper){fx.error();return}
  f.forEach(function(t){startPrint(t)});renderStrip();
}
function openUpay(){clearInterval(S.upiTimer);S.overlay={type:"upay",end:Date.now()+120000,fail:false,exp:false};S.upiTimer=setInterval(tickUpay,1000);renderOverlay()}
function upayLeft(){return S.overlay&&S.overlay.type==="upay"?Math.max(0,Math.ceil((S.overlay.end-Date.now())/1000)):0}
function fmtT(n){return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")}
function tickUpay(){var o=S.overlay;if(!o||o.type!=="upay"){clearInterval(S.upiTimer);return}var l=upayLeft(),el=$("upT");if(el)el.textContent=fmtT(l);if(l<=0&&!o.exp){o.exp=true;clearInterval(S.upiTimer);fx.error();renderOverlay()}}
function pay(){var o=S.overlay;if(!o||o.type!=="upay"||o.exp||o.fail)return;issue("upi")}
function payFail(){var o=S.overlay;if(!o||o.type!=="upay"||o.exp)return;o.fail=true;clearInterval(S.upiTimer);fx.error();renderOverlay()}
function nextStage(){
  if(S.cur>=last())return;S.cur++;resetRush();if(S.sel!=null&&S.sel<=S.cur)S.sel=null;S.open=null;S.entry="";S.kerr=null;render();
}
function addSlip(t,dup){
  var tape=$("tape");if(tape.querySelector("p"))tape.innerHTML="";
  var d=new Date(t.ts),tm=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0");
  var fare="₹"+t.amount+"   "+modeLabel(t).toUpperCase();
  var ln=t.lines.map(function(x){var c=cat(x.c);return(c.kg?c.l+" "+x.n+" kg":c.l+" x"+x.n)+(x.amt?"   ₹"+x.amt:"")}).join("\n");
  var txt=(dup?"** DUPLICATE COPY **\n":"")+"SAMPLE TRANSPORT  ETM\nRoute 500A  Trip "+S.trip.n+" "+S.trip.dir+"\nFrom: "+no(t.boardIdx)+"-"+S.stages[t.boardIdx]+"\nTo:   "+no(t.destIdx)+"-"+t.dest+"\n"+ln+"\nFare  "+fare+"\n#"+pad(t.id)+"  "+tm;
  var el=document.createElement("div");el.className="slip";el.textContent=txt;tape.insertBefore(el,tape.firstChild);
}
function slipText(txt){var tape=$("tape");if(tape.querySelector("p"))tape.innerHTML="";var el=document.createElement("div");el.className="slip";el.textContent=txt;tape.insertBefore(el,tape.firstChild)}
function stats(list){
  list=list||S.tickets;
  var live=list.filter(function(t){return t.status==="printing"||t.status==="printed"||t.status==="fault"});
  var cnt=list.filter(function(t){return t.status==="counted"});
  var s={tix:live.length,pax:0,kg:0,womenPax:0,freePax:0,cash:0,upi:0,passPax:0,by:{},voids:list.filter(function(t){return t.status==="voided"}).length};
  live.concat(cnt).forEach(function(t){t.lines.forEach(function(x){var c=cat(x.c);if(!c.kg)s.by[c.id]=(s.by[c.id]||0)+x.n;if(c.pass)s.passPax+=x.n;else if(c.kg)s.kg+=x.n;else{s.pax+=x.n;if(c.women)s.womenPax+=x.n;if(!x.amt)s.freePax+=x.n}})});
  live.forEach(function(t){if(t.mode==="cash")s.cash+=t.amount;if(t.mode==="upi")s.upi+=t.amount});
  return s;
}

var XT=["Toll","Parking","Repair","Fine","Food","Other"];
var DRV={"2231":"R. Kumar","2305":"S. Naik","2417":"M. Reddy"};
function expSum(l){return l.reduce(function(a,x){return a+x.amt},0)}
function expScope(sc){return sc==="trip"?S.exp.filter(function(x){return x.tk===S.tripKey}):S.exp}
function rs(n){return n<0?"\u2212₹"+(-n):"₹"+n}
function ticketRange(l){var ids=l.filter(function(t){return t.status==="printing"||t.status==="printed"||t.status==="fault"||t.status==="counted"||t.status==="voided"}).map(function(t){return t.id});if(!ids.length)return"None yet";return "#"+pad(Math.min.apply(null,ids))+" \u2013 #"+pad(Math.max.apply(null,ids))}
function fareTable(){return FARE.map(function(b,i){return{n:i+1,a:cat("ad").f(b),c:cat("ch").f(b)}})}
function fareRows(from){var o=[];for(var q=from+1;q<S.stages.length;q++){var b=FARE[q-from-1]||0;o.push({i:q,n:S.stages[q],a:cat("ad").f(b),c:cat("ch").f(b)})}return o}
/* ---------- rendering ---------- */
/* trip summary template: every category listed on every trip, same order, zeros dimmed, rows add up to Total boarded. Luggage and voids only when present. */
function catRows(st){var o=[];["st","wa","ch","ad","sr","dv","ps"].forEach(function(id){var c=cat(id);o.push([c.l,st.by[c.id]||0])});return o}
function kf(l,v,c){return '<div class="tcard kf"><div class="tk1">'+l+'</div><div class="tk2'+(c?' '+c:'')+'">'+v+'</div></div>'}
function statTbl(st){
  var xp=expSum(expScope("trip")),net=st.cash+st.upi-xp,z=xp?'':' class="z"',p="",m='<span'+(st.cash?'':' class="z"')+'>Cash</span><b'+(st.cash?'':' class="z"')+'>₹'+st.cash+'</b><span'+(st.upi?'':' class="z"')+'>UPI</span><b'+(st.upi?'':' class="z"')+'>₹'+st.upi+'</b><span'+z+'>Expenses</span><b'+z+'>₹'+xp+'</b>';
  catRows(st).forEach(function(r){var q=r[1]?'':' class="z"';p+='<span'+q+'>'+r[0]+'</span><b'+q+'>'+r[1]+'</b>'});
  p+='<span class="hi">Total boarded</span><b class="hi">'+(st.pax+st.passPax)+'</b>';
  if(st.kg)m+='<span>Luggage</span><b>'+st.kg+' kg</b>';
  if(st.voids)m+='<span>Voids</span><b>'+st.voids+'</b>';
  if(!(st.pax+st.passPax)&&!st.cash&&!st.upi&&!xp)return kf("Net collected",rs(net),"z")+'<div class="tsc"><div class="empty2"><b>No tickets this trip</b>Nothing was issued, so there is nothing to hand in.</div></div>';
  return kf("Net collected",rs(net),net<0?"neg":net===0?"z":"")+'<div class="tsc"><div class="tbl">'+p+'</div><div class="tbl">'+m+'</div></div>'}
function lrow(a,b){a=String(a);b=String(b);return a+new Array(Math.max(1,32-a.length-b.length)+1).join(" ")+b}
function tripSlip(st){var xp=expSum(expScope("trip")),net=st.cash+st.upi-xp,L=["TRIP REPORT  Trip "+S.trip.n+" "+S.trip.dir,"--------------------------------",lrow("Net collected",net<0?"-₹"+(-net):"₹"+net),"--------------------------------"];
  catRows(st).forEach(function(r){L.push(lrow(r[0],r[1]))});
  L.push("--------------------------------",lrow("Total boarded",st.pax+st.passPax),"--------------------------------",lrow("Cash","₹"+st.cash),lrow("UPI","₹"+st.upi),lrow("Expenses","₹"+xp));
  if(st.kg)L.push(lrow("Luggage",st.kg+" kg"));
  if(st.voids)L.push(lrow("Voids",st.voids));
  return L.join("\n")}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function paxCount(){var on=0,off=0;S.tickets.forEach(function(t){if(!(t.status==="printing"||t.status==="printed"||t.status==="fault"||t.status==="counted"))return;var n=0;t.lines.forEach(function(x){if(!cat(x.c).kg)n+=x.n});if(t.destIdx>S.cur)on+=n;else off+=n});return{on:on,off:off}}
function renderStatus(){
  var o=S.opts,P=o.paper?(o.low?"warn":"ok"):"bad",N=o.net?"ok":"warn",B=o.batt<=10?"bad":o.batt<=20?"warn":"ok";
  var sv='width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var paper='<span class="si '+P+'" role="img" aria-label="Printer paper '+(o.paper?(o.low?"low":"ok"):"out")+'"><svg '+sv+'><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'+(o.paper?"":'<path d="M3 3l18 18"/>')+'</svg></span>';
  var sig='<span class="si '+N+'" role="img" aria-label="Network '+(o.net?"online":"offline")+'"><svg '+sv+'><path d="M5 19v-4M10 19v-8M15 19v-12M20 19V5"/>'+(o.net?"":'<path d="M3 3l18 18"/>')+'</svg>'+(S.unsynced>0?"<b>"+S.unsynced+"</b>":"")+"</span>";
  var bt='<span class="si '+B+'" role="img" aria-label="Battery '+o.batt+' percent"><svg '+sv+'><rect x="3" y="7" width="16" height="10" rx="2.5"/><path d="M21 10v4"/><rect x="5" y="9" width="'+(12*o.batt/100).toFixed(1)+'" height="6" rx="1" fill="currentColor" stroke="none"/></svg></span>';
  var pc=paxCount(),cn='<div class="cnt" role="img" aria-label="'+pc.on+' passengers on board, '+pc.off+' alighted"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c0-3.2 2.6-5.1 6-5.1s6 1.9 6 5.1"/><circle cx="17.2" cy="9.2" r="2.4"/><path d="M17.6 14.4c2.4.2 3.9 1.7 3.9 4.1"/></svg>'+pc.on+'</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'+pc.off+"</span></div>";
  var ics=paper+sig+bt;
  $("status").innerHTML='<div class="sts"><span class="clk">'+nowStr()+"</span>"+(ics?'<span class="sic">'+ics+"</span>":"")+'</div><div class="tt"><b>Trip '+S.trip.n+" "+S.trip.dir+"</b>"+cn+'</div><button class="menu-btn" data-a="menu" data-tap aria-label="Menu"><i></i><i></i><i></i>Menu</button>';
}
function paxS(l){var p=pax(l);if(p.length<=20)return p;var n=0;l.lines.forEach(function(x){if(!cat(x.c).kg)n+=x.n});return n+" passengers"}
function renderStrip(){
  var el=$("strip");if(!el)return;
  var l=lastTicket(),parked=S.tickets.filter(function(t){return t.status==="parked"}),faults=S.tickets.filter(function(t){return t.status==="fault"}),fault=faults[0];
  var cls="strip",html="";
  var repeat=l?'<button class="rb" data-a="repeat" aria-label="Repeat last ticket" data-tap'+(canRepeat()?"":" disabled")+'><span>'+RPI+'</span></button>':'';
  if(fault){cls+=" amber t-err";html='<div class="sb"><div class="l1">'+(S.opts.paper?"Paper back":"Out of paper")+'</div><div class="l2">'+(faults.length>1?faults.length+" tickets":"#"+pad(fault.id))+' saved, unprinted</div></div><button class="rb" data-a="retry" data-tap><span>Retry</span></button>'}
  else if(S.flash&&S.flash.until>Date.now()){cls+=" amber "+flashTone(S.flash);html='<div class="sb"><div class="l1">'+esc(S.flash.text)+'</div><div class="l2">'+esc(S.flash.sub)+"</div></div>"+(S.flash.rep?repeat:"")}
  else if(l){var ok=(l.mode==="pass"||l.status==="printed")?CKI:"&hellip;";
    html='<button class="sb" data-a="voidtap" data-tap aria-label="Last ticket, tap for options"><span class="sch">'+RTI+'</span><div class="l0">Last ticket &middot; #'+pad(l.id)+'</div><div class="l1"><span class="ln">'+no(l.destIdx)+"-"+esc(l.dest)+'</span><span class="lsep" aria-hidden="true">&ndash;</span><span class="la">'+(l.mode==="pass"?"Pass":"₹"+l.amount)+'</span></div><div class="l2">'+ok+" "+esc(paxS(l))+(l.mode==="pass"?"":", "+modeLabel(l))+"</div></button>"+repeat}
  else{cls+=" empty";html='<div class="sb"><span class="sch">'+RTI+'</span><div class="l0">Last ticket</div><div class="l1"><span class="ln">&ndash; &ndash; &ndash;</span></div><div class="l2">&nbsp;</div></div>'}
  el.className=cls;el.innerHTML='<div class="sc">'+html+"</div>";$("v-core").classList.toggle("ns",!l&&!fault);
}
function chev(up){return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(up?"M6 15l6-6 6 6":"M6 9l6 6 6-6")+'"/></svg>'}
function arrow(dir){return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(dir<0?"M15 5l-7 7 7 7":"M9 5l7 7-7 7")+'"/></svg>'}
function stepper(id,compact){
  var c=cat(id),n=S.cnt[id];
  return '<button class="stp" data-a="dec" data-c="'+id+'" data-tap aria-label="Fewer '+c.l+'"'+(n<1?" disabled":"")+'><span>&minus;</span></button><b>'+n+'</b><button class="stp" data-a="inc" data-c="'+id+'" data-tap aria-label="More '+c.l+'"'+(n>=30?" disabled":"")+"><span>+</span></button>";
}
function rushRow(){
  var r=S.rush,h,padm=S.toMode==="pad";
  if(r.on){
    var wid=r.who||"ad",wl=cat(wid).l;
    h='<div class="rrow"><span class="rch rbar" role="group" aria-label="Rush: who and how many"><button class="rwho'+(r.pop?" pop":"")+(S.wseen?"":" nudge")+'" data-a="rwho" data-tap aria-label="Rush passenger type: '+wl+'. Tap to change."><span class="wi">'+whoIc()+"<span>"+wl+'</span>'+WSEL+'</span></button><i class="rsep" aria-hidden="true"></i>';r.pop=false;S.wseen=true;for(var i=1;i<=4;i++)h+='<button class="'+(r.n===i?"sel":"")+'" data-a="rn" data-i="'+i+'" data-tap aria-label="'+i+" "+wl+'">'+i+"</button>";h+="</span>";
  }else{
    if(!S.pre)return padm?'<div class="rrow"></div>':"";
    h='<div class="rrow"><button class="pre" data-a="clearpre" data-tap aria-label="Clear the repeated passengers">'+RPI+' '+esc(cntText())+' '+XSI+'</button>';
  }
  return h+"</div>";
}
function renderForm(){
  var el=$("form");if(!el)return;
  var end=S.cur>=last(),has=S.sel!=null&&!end,nm=S.stages[S.cur],i,h="";
  var bus='<svg class="ic" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--k-ic-7b8499)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="4.5" y="3.5" width="19" height="17" rx="3.5"/><path d="M4.5 12.5h19M9.5 20.5v3M18.5 20.5v3"/><circle cx="10" cy="16.5" r="1" fill="var(--k-ic-7b8499)"/><circle cx="18" cy="16.5" r="1" fill="var(--k-ic-7b8499)"/></svg>';
  var pin='<svg class="ic" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--k-ic-7b8499)" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M14 25s7.5-6.4 7.5-12a7.5 7.5 0 1 0-15 0C6.5 18.6 14 25 14 25z"/><circle cx="14" cy="13" r="2.6"/></svg>';
  var op=S.open==="from"?"from":"to";
  function box(key,label,val,aria,act,up){return '<button class="fb'+(op===key?" op":"")+'" data-a="'+act+'" data-k="'+key+'" data-tap aria-label="'+aria+'"><span class="fk">'+label+'</span><span class="fv">'+val+"</span></button>"}
  function row(a,idx,sel,name,right,num){return '<button class="srow'+(sel?" sel":"")+'" data-a="'+a+'" data-i="'+idx+'" data-tap>'+(num?'<span class="sno">'+num+"</span>":"")+'<span class="nm">'+esc(name)+'</span><span class="fr">'+right+"</span></button>"}
  el.className="form"+(has||end?"":" kmode")+(S.rush.on?" rushon":"")+(!has&&!end&&S.toMode==="pad"&&S.open!=="from"?" padm":"");
  if(has){
    /* ---- page 2: who is travelling ---- */
    var tn=S.stages[S.sel],ls=lines(),tot=sumAmt(ls);
    var ex=CATS.filter(function(c){return!c.main&&S.cnt[c.id]>0}).map(function(c){return c.kg?S.cnt[c.id]+" kg "+c.l:S.cnt[c.id]+" "+c.l});
    function cell(id){var c=cat(id);return '<div class="cell'+(S.cnt[id]>0?" on":"")+'"><span class="t">'+c.l+'</span><span class="rw">'+stepper(id)+"</span></div>"}
    h+='<button class="sumr" data-a="toedit" data-tap aria-label="Change destination"><span class="sl"><span class="pk">From</span><span class="sno">'+no(S.cur)+"</span><b>"+esc(nm)+'</b></span><span class="sl"><span class="pk">To</span><span class="sno">'+no(S.sel)+"</span><b>"+esc(tn)+'</b></span><span class="ed"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></span></button>';
    h+='<div class="cgrid">'+(cell("st")+cell("wa")+cell("ch")+cell("ad"))+"</div>";
    h+='<button class="allc'+(ex.length?" on":"")+'" data-a="cats" data-tap><span class="a1">All categories</span>'+(ex.length?"<small>"+esc(ex.join(", "))+"</small>":"")+'<span class="chv">'+RTI+'</span></button>';
    h+='<div class="tot"><div class="tl2"><span>Total fare</span><small>'+(ls.length?esc(pax({lines:ls})):"0 passengers")+"</small></div><b>₹"+tot+"</b></div>";
  }else{
    /* ---- page 1: where to ---- */
    var fs=nm.length<=10?16:nm.length<=13?15:14;
    h+='<div class="fx">'+box("from","From",bus+'<span class="sno">'+no(S.cur)+'</span><span class="tn" style="font-size:'+fs+'px">'+esc(nm)+"</span>","From "+esc(nm)+", tap for the stage list","open",S.open==="from")+
      '<button class="next" data-a="next" data-tap aria-label="Next stage"'+(end?" disabled":"")+"><span>Next</span>"+arrow(1)+"</button></div>";
    if(S.open==="from"){h+='<div class="pn pn-big">';for(i=0;i<S.stages.length;i++)h+=row("jumppick",i,i===S.cur,S.stages[i],i===S.cur?CKI:"",no(i));h+="</div>"}
    if(end){h+='<div class="endbox fixed"><b>Last stage reached</b><span>End the trip to see the totals.</span></div>'}
    else{
      var tv=S.kerr?'<span class="tn ph err">'+((+S.kerr)<1||(+S.kerr)>S.stages.length?'No stage '+S.kerr:S.kerr+' not ahead')+'</span>':S.entry?'<span class="sno ent">'+S.entry+'</span><span class="tn ph">&hellip;</span>':'<span class="tn ph">'+(S.toMode==="pad"?"Stage number":"Destination")+"</span>";
      h+='<div class="fx'+(S.open==="from"?" nochip":"")+'">'+box("to","To",pin+tv,"Destination","sko",S.toMode==="list"&&S.open!=="from")+(S.open==="from"?"":'<button class="next rushc'+(S.rush.on?" on":"")+'" data-a="rush" data-tap aria-pressed="'+(S.rush.on?"true":"false")+'" aria-label="Rush mode'+(S.rush.on?", on, tap to turn off":"")+'"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 2 5 13.5h6L10 22l9-12h-6z"/></svg><span>Rush</span></button>')+"</div>";
      if(S.open!=="from"){
        h+=rushRow();
        if(S.toMode==="list"){
          var rows=[];for(i=S.cur+1;i<=last();i++)rows.push(i);
          var bottom=S.opts.order==="bottom";if(bottom)rows.reverse();
          h+='<div class="pn pn-big'+(bottom?" bot":"")+'">'+rows.map(function(r){return row("sel",r,S.sel===r,S.stages[r],"",no(r))}).join("")+"</div>";
        }else{
          var k="";for(i=1;i<=9;i++)k+='<button class="skb" data-a="sk" data-v="'+i+'" data-tap>'+i+"</button>";
          h+='<div class="skp">'+k+'<button class="skb sk2" data-a="skb" data-tap aria-label="Delete">'+BSI+'</button><button class="skb" data-a="sk" data-v="0" data-tap>0</button><button class="skb go" data-a="sgo" data-tap aria-label="Go to stage"'+(S.entry?"":" disabled")+'><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>';
        }
      }
    }
  }
  el.innerHTML=h;
  var pn=el.querySelector(".pn");
  if(pn){var sr=pn.querySelector(".srow.sel");if(pn.classList.contains("bot"))pn.scrollTop=pn.scrollHeight;else if(sr)pn.scrollTop=Math.max(0,sr.offsetTop-48)}
}
function renderIssue(){
  var el=$("issue");
  if(S.cur>=last()){el.innerHTML='<button class="ib cash" data-a="endtrip" data-tap>End trip</button>';return}
  if(S.sel==null){el.innerHTML="";return}
  var k=payKind(lines());
  if(k==="none")el.innerHTML='<button class="ib cash" disabled>Add a passenger</button>';
  else if(k==="pass")el.innerHTML='<button class="ib cash" data-a="pass1" data-tap>Count pass holders</button>';
  else if(k==="free")el.innerHTML='<button class="ib cash" data-a="free" data-tap>Issue ticket</button>';
  else el.innerHTML='<button class="ib upi" data-a="upi" data-tap'+(S.opts.net?"":" disabled")+'>UPI</button><button class="ib cash" data-a="cash" data-tap>Cash</button>';
}
function renderCore(){renderStatus();renderStrip();renderForm();renderIssue()}

function qr(seed){
  var n=25,m=[],x=seed*2654435761>>>0;function r(){x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296}
  for(var i=0;i<n;i++){m[i]=[];for(var j=0;j<n;j++)m[i][j]=r()>.5?1:0}
  function fin(a,b){for(var i=-1;i<8;i++)for(var j=-1;j<8;j++){var y=a+i,z=b+j;if(y<0||z<0||y>=n||z>=n)continue;var on=(i>=0&&i<7&&j>=0&&j<7)&&(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));m[y][z]=on?1:0}}
  fin(0,0);fin(0,n-7);fin(n-7,0);
  var s='<svg class="qr" viewBox="-2 -2 29 29" shape-rendering="crispEdges" role="img" aria-label="Sample QR code"><rect x="-2" y="-2" width="29" height="29" fill="#fff"/>';
  for(var a=0;a<n;a++)for(var b=0;b<n;b++)if(m[a][b])s+='<rect x="'+b+'" y="'+a+'" width="1" height="1" fill="#000"/>';
  return s+"</svg>";
}
function farListHTML(){
  var h='<div class="full"><div class="fhead">Far stages<span class="sp"></span><button class="xb" data-a="close" data-tap aria-label="Close">&times;</button></div><div class="fbody">';
  for(var i=S.cur+6;i<=last();i++)h+='<button class="srow" style="padding:0 16px" data-a="farpick" data-i="'+i+'" data-tap><span class="nm">'+esc(S.stages[i])+'</span><span class="fr">₹'+base(i)+"</span></button>";
  return h+"</div></div>";
}
function kgPanel(){var h='<div class="kgr">';[5,10,15,20,30,40].forEach(function(v){h+='<button class="kgc'+(S.cnt.lg===v?" sel":"")+'" data-a="kgset" data-v="'+v+'" data-tap>'+v+"</button>"});return h+"</div>"}
function lineRows(ls){return ls.map(function(x){var c=cat(x.c);return "<span>"+esc(c.kg?x.n+" kg "+c.l:c.l+" × "+x.n)+"</span><b>"+(c.pass?"Pass":"₹"+x.amt)+"</b>"}).join("")}
function kgView(){var el=document.querySelector(".kgp");if(el&&el.scrollIntoView)el.scrollIntoView({block:"nearest"})}
function expList(){
  var xs=S.exp.slice().reverse(),xh="";
  xs.forEach(function(x){xh+='<button class="erow" data-a="expask" data-id="'+x.id+'" data-tap><span class="a"><b>'+esc(x.type)+"</b><span>"+x.s+"-"+esc(x.sn)+", "+x.tm+'</span></span><span class="r">₹'+x.amt+'</span><span class="rm">'+TRI+"</span></button>"});
  return '<div class="full"><div class="fhead">Expenses<span class="sp"></span><button class="xb" data-a="menu" data-tap aria-label="Back">&#8249;</button></div><div class="fbody col">'+
    kf("Total this duty","₹"+expSum(S.exp),S.exp.length?"":"z")+(xs.length?'<div class="fsc">'+xh+"</div>":'<div class="empty2"><span class="eic">'+WLT+'</span><b>No expenses yet</b>Add toll, parking or repairs as you pay them.</div>')+
    '</div><div class="btnrow cfb"><button class="pri" data-a="expnew" data-tap>Add expense</button></div></div>';
}
function syncPay(){var o=S.overlay,live=!!o&&o.type==="upay"&&S.sel!=null;$("payNow").disabled=!(live&&!o.exp&&!o.fail);$("payFail").disabled=!(live&&!o.exp&&!o.fail)}
function ic2(p,w){return '<svg class="ic2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||2.4)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var RTI=ic2('<path d="M9 5l7 7-7 7"/>'),LFI=ic2('<path d="M15 5l-7 7 7 7"/>'),CKI=ic2('<path d="M5 12.5l4.5 4.5L19 7.5"/>',2.6),RPI=ic2('<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',2.4),XSI=ic2('<path d="M7.5 7.5l9 9M16.5 7.5l-9 9"/>',2.6),BSI=ic2('<path transform="translate(-1.19 0)" d="M7.8 4.8h12.6A1.6 1.6 0 0 1 22 6.4v11.2a1.6 1.6 0 0 1-1.6 1.6H7.8a1.6 1.6 0 0 1-1.25-.6L2.7 13.1a1.5 1.5 0 0 1 0-2.2l3.85-5.0a1.6 1.6 0 0 1 1.25-.6z"/><path d="M9.1 9.1l5.8 5.8M14.9 9.1l-5.8 5.8"/>',2.6),TRI=ic2('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',2),WRI=ic2('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',2.2),RCI=ic2('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',1.8),WLT=ic2('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><path d="M4 7.5V17a2 2 0 0 0 2 2h12.5a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z"/><circle cx="15.5" cy="13.5" r="1" fill="currentColor"/>',1.8);
var BI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.75 6.5L9.25 12l5.5 5.5"/></svg>',XI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M7.5 7.5l9 9M16.5 7.5l-9 9"/></svg>';
/* thumb zone: the back / close control lives at the bottom left, beside the main button, not in the far top corner */
function dock(root){
  if(!root)return;
  var x=root.querySelector(".fhead .xb");if(!x)return;
  var shut=/Close/.test(x.getAttribute("aria-label")||"");
  x.parentNode.removeChild(x);x.className="xb";x.innerHTML=shut?XI:BI;
  var bar=root.querySelector(":scope>.tsb,:scope>.btnrow.cfb,:scope>.cfoot>.btnrow");
  if(!bar){bar=document.createElement("div");root.appendChild(bar)}
  var bs=[].slice.call(bar.children).filter(function(c){return c.tagName==="BUTTON"});
  bs=bs.filter(function(b){if(b.textContent==="Cancel"&&b.getAttribute("data-a")===x.getAttribute("data-a")){bar.removeChild(b);return false}return true});
  var anyPri=bs.some(function(b){return b.classList.contains("pri")||b.classList.contains("tn")});
  bs.forEach(function(b,i){var pri=b.classList.contains("pri")||b.classList.contains("tn")||bs.length===1||(!anyPri&&i===bs.length-1);b.className=pri?"tn":"tpr"});
  bar.className="tsb dock";bar.removeAttribute("style");
  bar.insertBefore(x,bar.firstChild);
}
function renderOverlay(){var ot=S.overlay&&S.overlay.type;if(ot&&ot!=="cfm"&&ot!=="upay"&&ot!=="cats"&&ot!=="jump")resetRush();drawOverlay();syncPay()}
function drawOverlay(){
  var o=S.overlay,el=$("ov"),h="";
  if(!o){el.innerHTML="";return}
  if(o.type==="upay"){
    if(S.sel==null){el.innerHTML="";return}
    var ul=lines(),utot=sumAmt(ul),bad=o.exp||o.fail;
    h='<div class="full"><div class="fhead">UPI payment<span class="sp"></span><button class="xb l" data-a="close" data-tap aria-label="Back to ticket">&#8249;</button></div><div class="fbody pyb">'+
      '<div class="pv"><div class="pvs2"><span class="pk">From</span><b>'+no(S.cur)+"-"+esc(S.stages[S.cur])+'</b></div><div class="pvs2"><span class="pk">To</span><b>'+no(S.sel)+"-"+esc(S.stages[S.sel])+'</b></div>'+
      '<div class="pvl">'+lineRows(ul)+'</div><div class="pvt"><span>Total</span><b>₹'+utot+'</b></div></div>'+
      '<div class="qrbox'+(bad?" off":"")+'">'+qr(S.nextId)+(bad?'<div class="qrx"><span>'+(o.fail?(o.net?"No network":"Payment failed"):"QR expired")+"</span></div>":"")+"</div>"+
      (bad?'<div class="upm">Take cash, or show a new QR.</div>':'<div class="upt"><span id="upT">'+fmtT(upayLeft())+'</span></div><div class="upbar"><i style="animation:upbar 120s linear forwards;animation-delay:-'+(120-upayLeft())+'s"></i></div>')+
      '</div><div class="btnrow cfb">'+(bad?'<button data-a="cashinstead" data-tap>Cash</button><button class="pri" data-a="newqr" data-tap'+(S.opts.net?"":" disabled")+'>New QR</button>':'<button data-a="close" data-tap>Cancel</button><button data-a="cashinstead" data-tap>Cash</button>')+"</div></div>";
  }else if(o.type==="cfm"){
    if(S.sel==null){el.innerHTML="";return}
    var cl=lines(),ctot=sumAmt(cl),cm=o.mode;
    var cls2=lineRows(cl);
    var cnote=cm==="pass"?"Pass holders are counted. No ticket is printed.":cm==="free"?"Free ticket. Nothing to collect.":cm==="upi"?"Pay by UPI. The QR code opens next.":"Collect cash from the passenger.";
    var cword=cm==="pass"?"Pass":cm==="free"?"Free":cm==="upi"?"UPI":"Cash";
    h='<div class="full"><div class="fhead">Confirm ticket<span class="sp"></span><button class="xb l" data-a="close" data-tap aria-label="Back to ticket">&#8249;</button></div><div class="fbody pyb">'+
      '<div class="pv"><div class="pvh">Ticket preview</div><div class="pvs2"><span class="pk">From</span><b>'+no(S.cur)+"-"+esc(S.stages[S.cur])+'</b></div><div class="pvs2"><span class="pk">To</span><b>'+no(S.sel)+"-"+esc(S.stages[S.sel])+'</b></div>'+
      '<div class="pvl">'+cls2+'</div><div class="pvt"><span>Total</span><b>₹'+ctot+'</b></div><div class="pvn">Route 500A, Trip '+S.trip.n+" "+S.trip.dir+'</div></div>'+
      '</div>'+
      '<div class="btnrow cfb"><button data-a="close" data-tap>Cancel</button><button class="pri" data-a="cfmyes" data-tap>Confirm '+cword+'</button></div></div>';
  }else if(o.type==="cats"){
    var crow=extraCats().map(function(c){var n=S.cnt[c.id],ctl;
      if(c.kg)ctl='<span class="cs"><button class="stp" data-a="dec" data-c="'+c.id+'" data-tap aria-label="Less luggage"'+(n<1?" disabled":"")+'><span>&minus;</span></button><button class="kgv" data-a="kgopen" data-tap aria-label="Luggage weight in kilograms"><span class="n">'+n+'</span><small>kg</small></button><button class="stp" data-a="inc" data-c="'+c.id+'" data-tap aria-label="More luggage"'+(n>=200?" disabled":"")+"><span>+</span></button></span>";
      else ctl='<span class="cs">'+stepper(c.id)+"</span>";
      return '<div class="crow'+(n?" on":"")+'"><span class="cn">'+c.l+"</span>"+ctl+"</div>"+(c.kg&&S.kg.open?kgPanel():"")}).join("");
    var ct=sumAmt(lines());
    h='<div class="full"><div class="fhead">All categories<span class="sp"></span><button class="xb l" data-a="close" data-tap aria-label="Back to ticket">&#8249;</button></div><div class="fbody">'+crow+'</div>'+
      '<div class="cfoot"><div class="tot"><div class="tl2"><span>Total fare</span><small>'+(lines().length?esc(pax({lines:lines()})):"0 passengers")+'</small></div><b>₹'+ct+'</b></div><div class="btnrow" style="padding:0"><button class="pri" data-a="close" data-tap>Done</button></div></div></div>';
  }else if(o.type==="far"){h=farListHTML()}
  else if(o.type==="jump"){
    h='<div class="full"><div class="fhead">Bus is at…<span class="sp"></span><button class="xb" data-a="close" data-tap aria-label="Close">&times;</button></div><div class="fbody">';
    for(var i=0;i<S.stages.length;i++)h+='<button class="srow'+(i===S.cur?" sel":"")+'" style="padding:0 16px" data-a="jumppick" data-i="'+i+'" data-tap><span class="tk">'+(i===S.cur?CKI:"")+'</span><span class="nm">'+esc(S.stages[i])+"</span></button>";
    h+="</div></div>";
  }else if(o.type==="menu"){
    h='<div class="full"><div class="fhead">Menu<span class="sp"></span><button class="xb" data-a="close" data-tap aria-label="Back to ticket">&#8249;</button></div><div class="fbody">'+
      '<button class="mi" data-a="exp" data-tap><span>Expenses</span><span>'+(S.exp.length?'<small style="font-size:13px;color:var(--k-fg-4b5563);margin-right:8px">₹'+expSum(S.exp)+"</small>":"")+RTI+'</span></button>'+
      '<button class="mi" data-a="fare" data-tap><span>Fare table</span><span>'+RTI+'</span></button>'+
      '<button class="mi" data-a="report" data-tap><span>Collection report</span><span>'+RTI+'</span></button>'+
      '<button class="mi" data-a="tickets" data-tap><span>Issued tickets</span><span>'+(S.unsynced>0?'<small style="font-size:13px;color:var(--k-fg-7a4100);margin-right:8px">'+S.unsynced+" to sync</small>":"")+RTI+'</span></button>'+
      '<button class="mi" data-a="night" data-tap role="switch" aria-checked="'+(S.opts.night?"true":"false")+'"><span>Night mode</span><span class="sw'+(S.opts.night?" on":"")+'"><i></i></span></button>'+
      '<div style="height:18px"></div>'+
      '<button class="mi dg" data-a="endtrip" data-tap><span>End trip</span><span>'+RTI+'</span></button>'+
      '<button class="mi dg" data-a="endduty" data-tap><span>End duty</span><span>'+RTI+'</span></button></div></div>';
  }else if(o.type==="tickets"){
    h='<div class="full"><div class="fhead">Issued tickets<span class="sp"></span><button class="xb" data-a="menu" data-tap aria-label="Back">&#8249;</button></div><div class="fbody">'+(S.unsynced>0?'<div class="sync">'+S.unsynced+" ticket"+(S.unsynced===1?"":"s")+" waiting to sync. They are saved on this machine.</div>":"");
    var all=S.tickets.filter(function(t){return t.status!=="cancelled"}).slice().reverse();
    if(!all.length)h+='<div class="empty2" style="margin-top:88px"><span class="eic">'+RCI+'</span><b>No tickets yet</b>Tickets you issue on this trip appear here.</div>';
    all.forEach(function(t){var d=new Date(t.ts),tm=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
      var right=t.status==="voided"?"Voided":t.mode==="pass"?"Pass":"₹"+t.amount;
      h+='<button class="trow'+(t.status==="voided"?" vd":"")+'" data-a="tkt" data-id="'+t.id+'" data-tap><span class="a"><b>'+no(t.destIdx)+" "+esc(t.dest)+"</b><span>"+esc(pax(t))+", "+tm+(t.mode==="pass"?"":", "+modeLabel(t))+'</span></span><span class="r">'+right+'</span><span class="cv2">'+RTI+"</span></button>"});
    h+="</div></div>";
  }else if(o.type==="tkt"){
    var tk=byId(o.id);if(!tk){el.innerHTML="";return}
    var ll=lastTicket(),isLast=!!ll&&ll.id===tk.id,vd=tk.status==="voided";
    var why=vd?"Already voided.":tk.mode==="upi"?"Paid UPI tickets cannot be voided here.":!isLast?"Only the last ticket can be voided.":"";
    var canV=isLast&&tk.mode!=="upi"&&!vd,canR=tk.mode!=="pass"&&!vd&&tk.status==="printed";
    var d2=new Date(tk.ts),tm2=String(d2.getHours()).padStart(2,"0")+":"+String(d2.getMinutes()).padStart(2,"0");
    h='<div class="scrim" data-a="close"></div><div class="sheet tk"><div class="tkt-h"><div class="tkt-t">'+no(tk.destIdx)+"-"+esc(tk.dest)+'</div><b class="tkt-f'+(vd?" vd":"")+'">'+(tk.mode==="pass"?"Pass":"₹"+tk.amount)+'</b></div><div class="tkt-s">#'+pad(tk.id)+" &middot; "+tm2+" &middot; from "+no(tk.boardIdx)+"-"+esc(S.stages[tk.boardIdx])+'</div>'+
      '<div class="tkt-g"><span>Passengers</span><b>'+esc(pax(tk))+'</b>'+(tk.mode==="pass"?"":'<span>Payment</span><b>'+modeLabel(tk)+"</b>")+'</div>'+
      (why?'<div class="tkt-n">'+why+"</div>":"")+'<div class="btnrow"><button class="cn" data-a="close" data-tap>Close</button><button class="go" data-a="reprint" data-tap data-id="'+tk.id+'"'+(canR?"":" disabled")+'>Reprint</button><button class="vo" data-a="dovoid" data-tap data-id="'+tk.id+'"'+(canV?"":" disabled")+'>Void</button></div></div>';
  }else if(o.type==="report"){
    var sc=S.coll,rl=sc==="trip"?S.tickets:dutyAll(),rst=stats(rl),rxt=expSum(expScope(sc)),ho=rst.cash-rxt;
    h='<div class="full"><div class="fhead">Collection report<span class="sp"></span><button class="xb" data-a="menu" data-tap aria-label="Back">&#8249;</button></div><div class="fbody col">'+
      '<div class="sg2" role="group"><button data-a="cscope" data-v="trip" aria-pressed="'+(sc==="trip")+'" data-tap>This trip</button><button data-a="cscope" data-v="duty" aria-pressed="'+(sc==="duty")+'" data-tap>Whole duty</button></div>'+
      kf("Cash expected",rs(ho),ho<0?"neg":ho===0?"z":"")+'<div class="hn">'+(ho<0?"Expenses are more than the cash collected.":"Cash sales minus expenses")+"</div>"+
      '<div class="dl"><span>Total sales</span><b>₹'+(rst.cash+rst.upi)+"</b><span>Cash</span><b>₹"+rst.cash+"</b><span>UPI</span><b>₹"+rst.upi+"</b><span>Expenses</span><b>₹"+rxt+"</b><span>Tickets</span><b>"+rst.tix+"</b><span>Ticket nos.</span><b>"+ticketRange(rl)+'</b></div>'+
      '<div class="foot2">Route 500A, Bus '+esc(S.bus)+', Conductor 4821</div></div><div class="btnrow cfb"><button data-a="reportprint" data-tap>Print</button></div></div>';
  }else if(o.type==="exp"){
    h=expList();
  }else if(o.type==="expadd"){
    var ed=S.xd,eok=ed.type&&+ed.val>0,th="",lc=ed.loc==null?S.cur:ed.loc;
    XT.forEach(function(t){th+="<button"+(ed.type===t?' class="on"':"")+' data-a="etype" data-v="'+t+'" data-tap>'+t+"</button>"});
    var lf='<div class="xlw"><button class="fb'+(ed.lo?" op":"")+'" data-a="xlocopen" data-tap aria-label="Expense location, tap to change"><span class="fk">Location</span><span class="fv"><svg class="ic" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--k-ic-7b8499)" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M14 25s7.5-6.4 7.5-12a7.5 7.5 0 1 0-15 0C6.5 18.6 14 25 14 25z"/><circle cx="14" cy="13" r="2.6"/></svg><span class="sno">'+no(lc)+'</span><span class="tn">'+esc(S.stages[lc])+'</span></span><span class="cv">'+chev(ed.lo)+'</span></button></div>';
    var lb;
    if(ed.lo){lb='<div class="xls"><div class="pn pn-big">';for(var q=0;q<S.stages.length;q++)lb+='<button class="srow'+(q===lc?" sel":"")+'" data-a="xlocpick" data-i="'+q+'" data-tap><span class="sno">'+no(q)+'</span><span class="nm">'+esc(S.stages[q])+'</span><span class="fr">'+(q===lc?CKI:"")+"</span></button>";lb+="</div></div>"}
    else lb='<div class="kd"><span class="lb">Amount</span><b'+(ed.val?"":' class="ph"')+">"+(ed.val?"₹"+ed.val:"₹ \u2013")+"</b></div>"+keypad();
    h='<div class="full xadd"><div class="fhead">Add expense<span class="sp"></span><button class="xb" data-a="exp" data-tap aria-label="Back">&#8249;</button></div>'+
      '<div class="etg"><div class="elab">Type</div><div class="ety">'+th+"</div></div>"+lf+lb+
      '<div class="tsb"><button class="tn" data-a="expsave" data-tap'+(eok?"":" disabled")+">Save</button></div></div>";
  }else if(o.type==="expdel"){
    var xd=S.exp.filter(function(x){return x.id===o.id})[0];if(!xd){el.innerHTML="";return}
    h=expList()+'<div class="scrim" data-a="exp"></div><div class="sheet cfm" style="top:calc(var(--H) - 188px);height:188px"><div class="cft">Remove this expense?</div><div class="cfp">'+esc(xd.type)+", ₹"+xd.amt+" at "+xd.s+"-"+esc(xd.sn)+'.</div><div class="btnrow"><button class="cn" data-a="exp" data-tap>Keep</button><button class="dg" data-a="expdo" data-id="'+xd.id+'" data-tap>Remove</button></div></div>';
  }else if(o.type==="fare"){
    var fr=fareRows(0),fh="";
    fr.forEach(function(r){fh+='<div class="fr3"><span class="n">'+no(r.i)+'</span><span class="t">'+esc(r.n)+'</span><span class="a">₹'+r.a+'</span><span class="c">₹'+r.c+"</span></div>"});
    h='<div class="full"><div class="fhead">Fare table<span class="sp"></span><button class="xb" data-a="menu" data-tap aria-label="Back">&#8249;</button></div><div class="fbody col">'+
      '<div class="ffrom"><small>From</small><b>'+no(0)+"-"+esc(S.stages[0])+'</b></div><div class="fh"><span>No.</span><span>To</span><span>Adult</span><span>Child</span></div><div class="fsc">'+fh+'</div><div class="fnote">Fare counts the stages travelled, so these rates apply from any stage.</div></div><div class="btnrow cfb"><button data-a="fareprint" data-tap>Print</button></div></div>';
  }else if(o.type==="confirm"){
    h='<div class="scrim" data-a="close"></div><div class="sheet cfm" style="top:calc(var(--H) - 188px);height:188px"><div class="cft">'+(o.what==="trip"?"End this trip?":"End duty?")+'</div><div class="cfp">'+(o.what==="trip"?"Shows the totals and prints the report.":"The machine locks until the next login.")+'</div><div class="btnrow"><button class="cn" data-a="close" data-tap>Cancel</button><button class="'+(o.what==="trip"?"go":"dg")+'" data-a="confirmyes" data-tap>'+(o.what==="trip"?"End trip":"End duty")+"</button></div></div>";
  }
  el.innerHTML=h;dock(el.querySelector(".full"));
  var xl=el.querySelector(".xls .pn");if(xl){var xs=xl.querySelector(".srow.sel");if(xs)xl.scrollTop=Math.max(0,xs.offsetTop-48)}
}
var LOGO='<svg class="mark" viewBox="3 11 58 42" aria-hidden="true"><path fill="#0A64F0" d="M15 14H49A9 9 0 0 1 58 23V28A4 4 0 0 0 58 36V41A9 9 0 0 1 49 50H15A9 9 0 0 1 6 41V36A4 4 0 0 0 6 28V23A9 9 0 0 1 15 14Z"/><path d="M22 20V44" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 4.6" fill="none"/><path d="M34 24.5 43.5 32 34 39.5" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
var EYE='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var EYEX='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/></svg>';
function renderLogin(){
  var g=S.lg,ic=function(p){return '<svg class="ic" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--k-ic-7b8499)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+p+'</svg>'};
  var icId=ic('<rect x="3.5" y="6.5" width="21" height="15" rx="3.5"/><circle cx="10.5" cy="12.5" r="2.2"/><path d="M7 18c.6-1.6 1.9-2.3 3.5-2.3S13.4 16.4 14 18M16.5 12h4.5M16.5 16h4.5"/>');
  var icPw=ic('<rect x="6" y="12.5" width="16" height="11" rx="3.2"/><path d="M9.5 12.5V10a4.5 4.5 0 0 1 9 0v2.5"/><circle cx="14" cy="18" r="1" fill="var(--k-ic-7b8499)" stroke="none"/>');
  var h='<div class="start lg"><div class="brand">'+LOGO+'<div class="word">ticketr</div></div>'+
    '<div class="lform">'+
    '<div class="bdf"><label class="bk" for="lgId">Employee ID</label><span class="bv">'+icId+'<input id="lgId" class="li" type="text" inputmode="numeric" autocomplete="off" value="'+esc(g.id)+'"></span></div>'+
    '<div class="bdf"><label class="bk" for="lgPw">Password</label><span class="bv">'+icPw+'<input id="lgPw" class="li" type="password" autocomplete="off" value="'+esc(g.pw)+'"></span><button class="be" data-a="pwshow" type="button" aria-label="Show password" aria-pressed="false">'+EYE+'</button></div>'+
    '</div>'+
    '<div class="tsb"><button class="tn" id="lgGo" data-a="login" data-tap'+(g.id&&g.pw?"":" disabled")+'>Log in</button></div></div>';
  $("v-start").innerHTML=h;
  var a=$("lgId"),b=$("lgPw"),go=$("lgGo");
  function sync(){S.lg.id=a.value.trim();S.lg.pw=b.value;go.disabled=!(S.lg.id&&S.lg.pw)}
  a.addEventListener("input",sync);b.addEventListener("input",sync);
  [a,b].forEach(function(el){el.addEventListener("keydown",function(e){if(e.key==="Enter"&&!go.disabled){e.preventDefault();go.click()}})})
}
function renderStart(){
  if(S.sstep==="login"){renderLogin();return}
  var o=S.opts,st=S.sstep,n=S.tripSel,up=n%2===1,d=up?"Up":"Down",from=up?"Majestic":"Gubbalala",to=up?"Gubbalala":"Majestic",tm=TRIPS[n-1];
  var notes=[];
  if(!o.paper)notes.push(["bad","Printer is out of paper. Load a roll to start."]);
  else if(o.low)notes.push(["warn","Paper is low. About 10 tickets left."]);
  if(o.batt<=20)notes.push(["warn","Battery "+o.batt+"%. Plug in when you can."]);
  if(!o.net)notes.push(["warn","Offline. UPI is off, cash and free tickets still work."]);
  var nh="";notes.forEach(function(x){nh+='<div class="note2 '+x[0]+'">'+x[1]+"</div>"});
  var back='<button class="xb l" data-a="sback" data-tap aria-label="Back">&#8249;</button>';
  var h='<div class="start">';
  if(st==="trip"){
    h+='<div class="fhead">Next trip'+back+'</div>';
    if(S.resumeInfo&&S.trip){var rs=stats();h+='<button class="resume" data-a="resume" data-tap><span class="rt"><b>Resume Trip '+S.trip.n+" "+S.trip.dir+'</b><span>Bus at '+esc(S.stages[S.cur])+'</span><span>'+rs.tix+" ticket"+(rs.tix===1?"":"s")+", ₹"+rs.cash+' cash</span></span>'+RTI+'</button>'}
    h+='<div class="tcard"><div class="tk1 tkr"><span>Trip '+n+' of 6</span><button class="chg" data-a="triplist" data-tap>'+(S.tripList?"Hide":"Other trips")+'</button></div><div class="tk2">Trip '+n+" "+d+'</div><div class="tk3">'+from+" to "+to+'</div><div class="tk3">'+tm[0]+" – "+tm[1]+"</div></div>";
    if(S.tripList){h+='<div class="tlist">';TRIPS.forEach(function(t,k){var u=(k+1)%2===1;h+='<button class="srow'+(k+1===n?" sel":"")+'" data-a="trip" data-i="'+(k+1)+'" data-tap><span class="sno">'+(k+1)+'</span><span class="nm">Trip '+(k+1)+" "+(u?"Up":"Down")+'</span><span class="fr">'+t[0]+" – "+t[1]+"</span></button>"});h+="</div>"}
    else h+=nh;
    h+='<div class="tsb"><button class="tn" data-a="start" data-tap'+(o.paper?"":" disabled")+'>Start trip</button></div>';
  }else if(st==="edit"){
    var ef=S.edit.f,lab=ef==="bus"?"Bus number":"Driver ID",cur=ef==="bus"?S.bus:S.drv;
    h+='<div class="fhead">'+lab+'<button class="xb l" data-a="editback" data-tap aria-label="Back">&#8249;</button></div>';
    h+='<div class="kd"><span class="lb">'+lab+'<em class="kr">'+(S.edit.val?"&nbsp;":"Type to replace")+'</em></span><b'+(S.edit.val?"":' class="ph cur"')+">"+(S.edit.val||cur)+"</b></div>"+keypad()+'<div class="tsb"><button class="tn" data-a="editdone" data-tap'+(S.edit.val?"":" disabled")+">Save</button></div>";
  }else{
    var pen='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
    var icB='<svg class="ic" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--k-ic-7b8499)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="4.5" y="3.5" width="19" height="17" rx="3.5"/><path d="M4.5 12.5h19M9.5 20.5v3M18.5 20.5v3"/><circle cx="10" cy="16.5" r="1" fill="var(--k-ic-7b8499)" stroke="none"/><circle cx="18" cy="16.5" r="1" fill="var(--k-ic-7b8499)" stroke="none"/></svg>';
    var icD='<svg class="ic" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--k-ic-7b8499)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><circle cx="14" cy="9.5" r="4.5"/><path d="M5 24c0-5 4-8 9-8s9 3 9 8z"/></svg>';
    var dn=DRV[S.drv]||"",nm2=function(){return dn?esc(dn):'No name on file'};
    var fld=function(act,lab,ic,val,chip,ph,warn){return '<button class="bdf" data-a="'+act+'" data-tap aria-label="Edit '+lab.toLowerCase()+(warn?", no driver name on file":"")+'"><span class="bk">'+lab+'</span><span class="bv">'+ic+'<span class="bt'+(ph?" ph":"")+'">'+val+'</span>'+(chip&&!warn?'<span class="bn">'+chip+'</span>':"")+'</span><span class="be">'+pen+'</span>'+(warn?'<span class="bw">'+WRI+'No name on file. You can continue.</span>':"")+'</button>'};
    h+='<div class="fhead">Details'+back+'</div><div class="bdw">'+
      fld("editbus","Bus",icB,esc(S.bus),"")+
      fld("editdrv","Driver",icD,"D-"+esc(S.drv),dn?esc(dn):"",false,!dn)+
      '</div><div class="dnote">Conductor 4821 on route 500A for Trip '+n+" "+d+'</div>';
    h+='<div class="tsb"><button class="tn" data-a="confirmtrip" data-tap'+(o.paper?"":" disabled")+'>Confirm</button></div>';
  }
  $("v-start").innerHTML=h+"</div>";dock($("v-start").querySelector(".start"));
}
function keypad(){
  var k="";["1","2","3","4","5","6","7","8","9"].forEach(function(d){k+='<button data-a="kd" data-v="'+d+'">'+d+"</button>"});
  return '<div class="kp">'+k+'<button data-a="kb" aria-label="Delete">'+BSI+'</button><button data-a="kd" data-v="0">0</button><span></span></div>';
}
function renderEnd(){
  var st=stats(),h;
  if(S.screen==="summary"){
    h='<div class="start"><div class="fhead">Trip '+S.trip.n+" "+S.trip.dir+'</div>'+statTbl(st)+'<div class="tsb"><button class="tn" data-a="nexttrip" data-tap>Next trip</button><div class="tpair"><button class="tpr" data-a="printrep" data-tap>Print report</button><button class="dt" data-a="endduty" data-tap>End duty</button></div></div></div>';
  }else{
    var d=stats(dutyAll()),e=S.ended,xp=expSum(S.exp);d.tot=d.cash+d.upi;d.cash-=xp;
    var zr=function(l,v,n){var q=n?"":' class="z"';return"<span"+q+">"+l+"</span><b"+q+">"+v+"</b>"};
    var chain=zr("Total sales","₹"+d.tot,d.tot)+zr("Paid by UPI","₹"+d.upi,d.upi)+zr("Expenses","₹"+xp,xp);
    var xhero=kf("Cash expected",rs(d.cash),d.cash<0?"neg":d.cash===0?"z":"");
    if(e.done){
      var diff=(+e.val)-d.cash,msg=diff===0?"Cash check":diff<0?"Short":"Excess",dv=Math.abs(diff);
      h='<div class="start"><div class="fhead">Duty closed</div>'+kf(msg,diff===0?"Matched":"₹"+dv,diff===0?"":diff<0?"neg":"pos")+'<div class="tsc"><div class="tbl">'+chain+'<span class="hi">Cash expected</span><b class="hi">'+rs(d.cash)+"</b><span>Cash counted</span><b>₹"+(+e.val)+'</b></div></div><div class="tsb"><button class="tn" data-a="restart" data-tap>Start again</button></div></div>';
    }else{
      var has=e.val!=="",df=(+e.val)-d.cash,res=!has?'<em class="kr">&nbsp;</em>':df===0?'<em class="kr ok">Matches</em>':df<0?'<em class="kr warn">Short by ₹'+(-df)+"</em>":'<em class="kr gain">Excess ₹'+df+"</em>";
      h='<div class="start"><div class="fhead">Hand in cash</div>'+xhero+'<div class="tsc"><div class="tbl">'+chain+'</div></div><div class="kd"><span class="lb">Cash counted'+res+"</span><b"+(has?"":' class="ph"')+">"+(has?"₹"+e.val:"₹ \u2013")+"</b></div>"+keypad()+'<div class="tsb"><button class="tn" data-a="finish" data-tap'+(has?"":" disabled")+">Finish duty</button></div></div>";
    }
  }
  $("v-end").innerHTML=h;
}
function render(){
  nightClass();
  var rk=S.screen+"|"+S.tripKey+"|"+S.cur;if(S._rk!==rk){S._rk=rk;resetRush()}
  $("v-start").style.display=S.screen==="start"?"block":"none";
  $("v-core").style.display=S.screen==="core"?"block":"none";
  $("v-end").style.display=(S.screen==="summary"||S.screen==="ended")?"block":"none";
  if(S.screen==="start")renderStart();
  else if(S.screen==="core")renderCore();
  else renderEnd();
  renderOverlay();
}
/* ---------- events ---------- */
var scr=$("scr");
/* lists that scroll get a bottom fade while more rows are hidden */
function fades(){[].forEach.call(scr.querySelectorAll(".pn,.fsc,.fbody,.tsc"),function(e){e.classList.toggle("more",e.scrollHeight-e.scrollTop-e.clientHeight>6)})}
scr.addEventListener("scroll",function(e){var t=e.target;if(t&&t.classList&&t.scrollHeight&&/^(pn|fsc|fbody|tsc)$/.test((t.className+"").split(" ")[0]))t.classList.toggle("more",t.scrollHeight-t.scrollTop-t.clientHeight>6)},true);
var fq=0;new MutationObserver(function(){if(!fq)fq=requestAnimationFrame(function(){fq=0;fades()})}).observe(scr,{childList:true,subtree:true});
scr.addEventListener("pointerdown",function(){audio()},true);
scr.addEventListener("click",function(e){
  var b=e.target.closest("[data-a]");if(!b||b.disabled)return;
  var a=b.getAttribute("data-a"),i=+b.getAttribute("data-i"),id=+b.getAttribute("data-id");
  switch(a){
    case"login":S.sstep="trip";fx.tick();renderStart();break;
    case"pwshow":{var pi=$("lgPw"),on=pi.type==="password";pi.type=on?"text":"password";b.innerHTML=on?EYEX:EYE;b.setAttribute("aria-pressed",on?"true":"false");b.setAttribute("aria-label",on?"Hide password":"Show password");break}
    case"start":S.sstep="driver";renderStart();break;
    case"confirmtrip":startTrip();break;
    case"sback":S.sstep=S.sstep==="driver"?"trip":"login";renderStart();break;
    case"triplist":S.tripList=!S.tripList;renderStart();break;
    case"trip":S.tripSel=i;S.tripList=false;renderStart();break;
    case"sel":S.sel=i;S.open=null;fx.tick();if(S.rush.on){rushIssue();break}renderForm();renderIssue();break;
    case"rush":S.rush.on=!S.rush.on;S.rush.n=1;if(S.rush.on){S.rush.who="ad";S.pre=false;S.cnt=defCnt()}fx.tick();renderForm();break;
    case"rwho":{var wi=WHO.indexOf(S.rush.who||"ad");S.rush.who=WHO[(wi+1)%WHO.length];S.rush.pop=true;fx.tick();renderForm();break}
    case"rn":S.rush.n=i;fx.tick();renderForm();break;
    case"clearpre":S.cnt=defCnt();S.pre=false;fx.tick();renderForm();break;
    case"open":S.open=S.open==="from"?null:"from";fx.tick();renderForm();break;
    case"sk":{
      var d0=b.getAttribute("data-v");if(d0==="0"&&S.entry==="")break;
      var ent=S.entry+d0;if(ent.length>2)break;
      var nn=+ent,longer=false,x0;for(x0=0;x0<10;x0++){if(stageValid(+(ent+x0)))longer=true}
      S.kerr=null;
      if(stageValid(nn)&&!longer){S.sel=idxOf(nn);S.entry="";S.open=null;fx.tick();if(S.rush.on)rushIssue()}
      else if(longer){S.entry=ent;fx.tick()}
      else{S.kerr=ent;S.entry="";fx.error();setTimeout(function(){if(S.kerr===ent){S.kerr=null;if(S.screen==="core")renderForm()}},1800)}
      renderForm();renderIssue();break}
    case"sgo":{var e1=S.entry;if(!e1)break;var n1=+e1;S.kerr=null;
      if(stageValid(n1)){S.sel=idxOf(n1);S.entry="";S.open=null;fx.tick();if(S.rush.on)rushIssue()}
      else{S.kerr=e1;S.entry="";fx.error();setTimeout(function(){if(S.kerr===e1){S.kerr=null;if(S.screen==="core")renderForm()}},1800)}
      renderForm();renderIssue();break}
    case"skb":S.entry=S.entry.slice(0,-1);S.kerr=null;fx.tick();renderForm();break;
    case"sko":S.toMode=S.toMode==="pad"?"list":"pad";S.open=null;S.entry="";S.kerr=null;fx.tick();renderForm();break;
    case"toedit":S.sel=null;S.open=null;S.entry="";S.kerr=null;fx.tick();renderForm();renderIssue();break;
    case"prev":if(S.cur>0){fx.tick();S.cur--;S.open=null;S.entry="";S.kerr=null;render()}break;
    case"inc":case"dec":{var cid=b.getAttribute("data-c"),kgc=!!cat(cid).kg,stp=1,nv=S.cnt[cid]+(a==="inc"?stp:-stp);if(nv>=0&&nv<=(kgc?200:30)){S.cnt[cid]=nv;fx.tick()}renderForm();renderIssue();if(S.overlay)renderOverlay();break}
    case"cats":if(S.sel!=null){S.kg.open=false;S.kg.pad=false;fx.tick();S.overlay={type:"cats"};renderOverlay()}break;
    case"cfmyes":{var cmode=S.overlay&&S.overlay.mode;if(cmode)issue(cmode);break}
    case"pass1":go("pass");break;
    case"kgopen":S.kg.open=!S.kg.open;S.kg.pad=false;fx.tick();renderOverlay();kgView();break;
    case"kgset":S.cnt.lg=+b.getAttribute("data-v");S.kg.open=false;S.kg.pad=false;fx.tick();renderForm();renderIssue();renderOverlay();break;
    case"tickets":S.overlay={type:"tickets"};renderOverlay();break;
    case"kd":{var v0=b.getAttribute("data-v");
      if(S.overlay&&S.overlay.type==="expadd"){var xv=S.xd.val;if(xv.length<5){S.xd.val=(xv==="0"?"":xv)+v0;fx.tick();renderOverlay()}}
      else if(S.screen==="start"&&S.edit){if(S.edit.val.length<4){S.edit.val+=v0;fx.tick();renderStart()}}
      else if(S.screen==="ended"&&!S.ended.done){if(S.ended.val.length<6)S.ended.val=(S.ended.val==="0"?"":S.ended.val)+v0;render()}
      break}
    case"kb":
      if(S.overlay&&S.overlay.type==="expadd"){S.xd.val=S.xd.val.slice(0,-1);fx.tick();renderOverlay()}
      else if(S.screen==="start"&&S.edit){S.edit.val=S.edit.val.slice(0,-1);fx.tick();renderStart()}
      else if(S.screen==="ended"&&!S.ended.done){S.ended.val=S.ended.val.slice(0,-1);render()}
      break;
    case"finish":{var dd=stats(dutyAll()),dxp=expSum(S.exp);dd.tot=dd.cash+dd.upi;dd.cash-=dxp;S.ended.done=true;var df2=(+S.ended.val)-dd.cash;slipText("DUTY CLOSED  Emp 4821\nTotal sales   ₹"+dd.tot+"\nPaid by UPI   ₹"+dd.upi+"\nExpenses      ₹"+dxp+"\nCash expected "+(dd.cash<0?"-₹"+(-dd.cash):"₹"+dd.cash)+"\nCash counted  ₹"+(+S.ended.val)+"\n"+(df2===0?"Matched":df2<0?"SHORT ₹"+(-df2):"EXCESS ₹"+df2));fx.printed();render();break}
    case"resume":S.screen="core";S.resumeInfo=false;resetPick();render();break;
    case"tkt":S.overlay={type:"tkt",id:id,from:"list"};renderOverlay();break;
        case"far":S.overlay={type:"far"};renderOverlay();break;
    case"farpick":S.sel=i;S.overlay=null;fx.tick();render();break;
    case"jump":S.overlay={type:"jump"};renderOverlay();break;
    case"jumppick":S.cur=i;if(S.sel!=null&&S.sel<=S.cur)S.sel=null;S.open=null;S.overlay=null;render();break;
    case"next":fx.tick();nextStage();break;
    case"free":go("free");break;
    case"cash":go("cash");break;
    case"upi":go("upi");break;
    case"cashinstead":issue("cash");break;
    case"newqr":openUpay();break;
    case"repeat":{var l=lastTicket();if(l&&canRepeat()){S.cnt=defCnt();S.cnt.ad=0;l.lines.forEach(function(x){S.cnt[x.c]=x.n});S.rush.on=false;S.rush.n=1;if(l.destIdx>S.cur){S.sel=l.destIdx;S.open=null;S.entry="";S.kerr=null;S.pre=false;fx.tick();renderForm();renderIssue()}else{S.sel=null;S.open=null;S.entry="";S.kerr=null;S.pre=true;fx.tick();renderForm();renderIssue()}}break}
    case"retry":retry();break;
    case"voidtap":{var l2=lastTicket();if(l2){S.overlay={type:"tkt",id:l2.id};renderOverlay()}break}
    case"reprint":{var tr=byId(id);if(!tr)break;S.overlay=null;if(!S.opts.paper){fx.error();S.flash={text:"Out of paper",sub:"Reprint of #"+pad(tr.id)+" not printed",until:Date.now()+2800}}else{fx.printed();S.flash={text:"Reprint #"+pad(tr.id),sub:"Duplicate copy printing",until:Date.now()+2000};addSlip(tr,true)}render();setTimeout(renderStrip,2900);break}
    case"dovoid":{var l3=lastTicket();if(l3&&l3.id===id&&l3.mode!=="upi"){l3.status="voided";fx.void();slipText("** VOID **  #"+pad(l3.id)+"\n"+no(l3.destIdx)+"-"+l3.dest+"   ₹"+l3.amount+"\n"+nowStr());S.flash={text:"Voided #"+pad(l3.id),sub:"Logged. Take back the ticket.",until:Date.now()+1800}}S.overlay=null;render();setTimeout(renderStrip,1900);break}
    case"menu":S.overlay={type:"menu"};renderOverlay();break;case"night":S.opts.night=!S.opts.night;applyNight();renderOverlay();fx.press();break;
    case"report":S.overlay={type:"report"};renderOverlay();break;
    case"volm":S.opts.vol=Math.max(0,S.opts.vol-1);renderOverlay();fx.press();break;
    case"volp":S.opts.vol=Math.min(3,S.opts.vol+1);renderOverlay();fx.press();break;
    case"endtrip":S.overlay={type:"confirm",what:"trip"};renderOverlay();break;
    case"endduty":S.overlay={type:"confirm",what:"duty"};renderOverlay();break;
    case"confirmyes":{var w=S.overlay.what;S.overlay=null;if(w==="duty")S.ended={val:"",done:false};if(w==="trip"){S.screen="summary";slipText(tripSlip(stats()))}else{S.screen="ended"}render();break}
    case"printrep":{slipText(tripSlip(stats()));fx.printed();break}
    case"nexttrip":S.tripSel=S.trip.n<6?S.trip.n+1:1;S.sstep="trip";S.tripList=false;S.screen="start";render();break;
    case"restart":S.cur=0;S.unsynced=0;S.flash=null;S.use={};S.overlay=null;resetPick();resetRush();S.exp=[];S.edit=null;S.coll="duty";S.tripKey=0;S.tripSel=1;S.sstep="login";S.tripList=false;S.screen="start";S.tickets=[];S.arch=[];S.resumeInfo=false;S.ended={val:"",done:false};S.pt=null;render();break;
    case"close":S.kg.open=false;S.kg.pad=false;clearInterval(S.upiTimer);if(S.overlay&&S.overlay.type==="tkt"&&S.overlay.from==="list")S.overlay={type:"tickets"};else S.overlay=null;render();break;
    case"exp":S.overlay={type:"exp"};renderOverlay();break;
    case"expnew":S.xd={type:null,val:"",loc:S.cur,lo:false};fx.tick();S.overlay={type:"expadd"};renderOverlay();break;
    case"xlocopen":S.xd.lo=!S.xd.lo;fx.tick();renderOverlay();break;
    case"xlocpick":S.xd.loc=i;S.xd.lo=false;fx.tick();renderOverlay();break;
    case"etype":S.xd.type=b.getAttribute("data-v");fx.tick();renderOverlay();break;
    case"expsave":{var xe=S.xd;if(!xe.type||!(+xe.val>0))break;var xl2=xe.loc==null?S.cur:xe.loc;S.exp.push({id:S.xid++,type:xe.type,amt:+xe.val,s:no(xl2),sn:S.stages[xl2],tm:nowStr(),tk:S.tripKey});fx.press();S.overlay={type:"exp"};renderOverlay();break}
    case"expask":S.overlay={type:"expdel",id:id};renderOverlay();break;
    case"expdo":S.exp=S.exp.filter(function(x){return x.id!==id});fx.void();S.overlay={type:"exp"};renderOverlay();break;
    case"fare":S.overlay={type:"fare",from:S.cur};renderOverlay();break;
    case"fromd":{var fo=S.overlay;if(fo&&fo.type==="fare"){fo.from=Math.max(0,Math.min(last(),fo.from+(+b.getAttribute("data-d"))));fx.tick();renderOverlay()}break}
    case"fareprint":{if(!S.overlay||S.overlay.type!=="fare")break;var ft="FARE TABLE  Route 500A\nFrom "+no(0)+"-"+S.stages[0]+"\nNo To            Adult Child";fareRows(0).forEach(function(r){ft+="\n"+String(no(r.i)).padStart(2," ")+" "+r.n.slice(0,13).padEnd(13," ")+" "+String(r.a).padStart(4," ")+"  "+String(r.c).padStart(4," ")});slipText(ft);fx.printed();break}
    case"cscope":S.coll=b.getAttribute("data-v");fx.tick();renderOverlay();break;
    case"reportprint":{var rc=S.coll,rl2=rc==="trip"?S.tickets:dutyAll(),rs2=stats(rl2),rx2=expSum(expScope(rc));slipText("COLLECTION  "+(rc==="trip"?"Trip "+S.trip.n+" "+S.trip.dir:"Whole duty")+"\nBus "+S.bus+"  Cond 4821\nTickets "+rs2.tix+"  "+ticketRange(rl2)+"\nTotal sales ₹"+(rs2.cash+rs2.upi)+"\n Cash ₹"+rs2.cash+"\n UPI  ₹"+rs2.upi+"\nExpenses ₹"+rx2+"\nCASH EXPECTED ₹"+(rs2.cash-rx2));fx.printed();break}
    case"editbus":S.edit={f:"bus",val:""};S.sstep="edit";fx.tick();renderStart();break;
    case"editdrv":S.edit={f:"drv",val:""};S.sstep="edit";fx.tick();renderStart();break;
    case"editback":S.edit=null;S.sstep="driver";renderStart();break;
    case"editdone":{if(S.edit&&S.edit.val){if(S.edit.f==="bus")S.bus=S.edit.val;else S.drv=S.edit.val}S.edit=null;S.sstep="driver";fx.tick();renderStart();break}
    default:break;
  }
});

/* bench controls */
function seg(id,fn){var g=$(id);g.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;Array.prototype.forEach.call(g.children,function(c){c.setAttribute("aria-pressed",c===b?"true":"false")});fn(b.getAttribute("data-v"))})}
seg("sg-net",function(v){var was=S.opts.net;S.opts.net=v==="on";var uo=S.overlay;if(uo&&uo.type==="upay"){if(!S.opts.net&&!uo.exp&&!uo.fail){uo.fail=true;uo.net=true;clearInterval(S.upiTimer);fx.error()}renderOverlay()}if(S.screen==="start")renderStart();if(S.screen==="core"){if(!S.opts.net&&was)flashWarn("Offline","UPI off. Tickets sync later.");else if(S.opts.net&&!was){var n=S.unsynced;S.unsynced=0;flashWarn("Back online",n?"Synced "+n+" ticket"+(n===1?"":"s"):"Everything is synced",3000)}renderStatus();renderForm();renderIssue();if(S.overlay)renderOverlay()}});
seg("sg-batt",function(v){S.opts.batt=v==="low"?15:82;if(S.screen==="start")renderStart();if(S.screen==="core"){if(v==="low")flashWarn("Battery 15%","Plug in at next terminus");else S.flash=null;renderStatus();renderStrip()}});
seg("sg-paper",function(v){S.opts.paper=v!=="out";S.opts.low=v==="low";if(S.screen==="start")renderStart();if(S.screen==="core"){if(v==="low")flashWarn("Paper low","About 10 tickets left");else if(v==="out")flashWarn("Out of paper","Tickets are saved, not printed",6000);else S.flash=null;renderStrip();renderStatus()}});
$("payNow").addEventListener("click",function(){audio();pay()});
$("payFail").addEventListener("click",function(){audio();payFail()});
$("simRestart").addEventListener("click",function(){if(S.screen!=="core")return;clearInterval(S.upiTimer);S.overlay=null;S.screen="start";S.sstep="login";S.resumeInfo=true;S.pt=null;render()});
/* fit device to the viewport width */
function fit(){
  /* frameless phone: 360 screen + 10px border each side (7 black, 3 rim), plus 4px side buttons each side */
  var W=388,BH=S.H+20,stack=document.documentElement.clientWidth<820;
  var w=document.documentElement.clientWidth-32,h=window.innerHeight-(stack?32:48);
  var sc=Math.max(.6,Math.min(1,w/W,h/BH));
  $("bezel").style.transform="scale("+sc+")";
  $("fit").style.width=Math.round(W*sc)+"px";$("fit").style.height=Math.round(BH*sc)+"px";
}
window.addEventListener("resize",fit);fit();
setInterval(function(){if(S.screen==="core")renderStatus()},20000);
/* Night mode: one switch point. Set S.opts.night then call applyNight(); the choice is remembered on this device.
   It applies to every screen (login, trip, ticketing, end), so a conductor who chose night never gets a white flash first. */
function nightClass(){$("scr").classList.toggle("night",!!S.opts.night)}
function applyNight(){nightClass();try{localStorage.setItem("ticketr.night",S.opts.night?"1":"0")}catch(e){}}
(function(){var v=null;try{v=localStorage.getItem("ticketr.night")}catch(e){}S.opts.night=v!==null?v==="1":!!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)})();
S.trip={n:1,dir:"Up"};
render();
})();

/* Snap both Adult chevrons to the device pixel grid so they render with the same weight */
(function(){var raf=0;
function snap(){raf=0;var scr=document.querySelector(".scr");if(!scr||!scr.offsetWidth)return;
var r=scr.getBoundingClientRect(),k=r.width/scr.offsetWidth||1,eff=(window.devicePixelRatio||1)*k;
var sp=scr.querySelector(".rwho .wi span"),a=scr.querySelector(".rwho svg.ic"),b=scr.querySelector(".rwho svg.wsel");
if(!sp||!a||!b)return;var sr=sp.getBoundingClientRect();
function one(el,x){var d=(Math.round(x*eff)/eff-x)/k;el.style.setProperty("--sx",d.toFixed(3)+"px")}
one(a,sr.left-26*k);one(b,sr.right+(8-3.4)*k)}
function sched(){if(!raf)raf=requestAnimationFrame(snap)}
new MutationObserver(sched).observe(document.body,{childList:true,subtree:true});
window.addEventListener("resize",sched);sched()})();

/* ===================================================================
   Reach map
   Paints how easy each point of the 360 x 720 screen is to tap, for a
   chosen grip, and marks every control on the current screen.
   The model follows thumb-zone research (Hoober, Wroblewski): with one
   hand, the thumb pivots near the lower edge on the gripping side. A
   band around that pivot is comfortable; very close is a cramped curl;
   far away (the opposite top corner) needs a regrip. With two hands
   (one holds, the other taps with a thumb or index finger) almost all of
   the screen is easy, and only the top edge asks the hand to reach over.
   Distances are in dp and assume a hand-sized device, so treat the
   result as a guide, not a measurement.
   =================================================================== */
(function(){
"use strict";
var W=360,H=720,mode="off";
var scr=document.getElementById("scr"),cv=document.createElement("canvas");
cv.id="reach";cv.setAttribute("aria-hidden","true");scr.appendChild(cv);
var info=document.getElementById("rinfo"),stat=document.getElementById("rstat"),note=document.getElementById("rnote");
var NOTES={right:"Thumb pivots near the lower right edge. The far top-left needs a regrip.",
  left:"Mirror of the right-thumb grip. The far top-right needs a regrip.",
  two:"One hand holds, the other taps with a thumb or index finger. Only the top edge asks you to reach over."};

/* difficulty: 0 = easy, 1 = stretch, 2 = hard */
function thumb(x,y,px,py){
  var d=Math.hypot(x-px,y-py);
  if(d<45)return 1.5;
  if(d<95)return 1.5*(95-d)/50;
  if(d<270)return 0;
  if(d<350)return(d-270)/80;
  return Math.min(2,1+(d-350)/60);
}
function diff(x,y){
  if(mode==="right")return thumb(x,y,372,575);
  if(mode==="left")return thumb(x,y,-12,575);
  var t=y<90?(90-y)/90*1.15:0;                         /* reaching over the top */
  var e=Math.min(x,W-x);if(e<14)t=Math.max(t,(14-e)/14*.6); /* hard edges */
  return t;
}

/* dashed zone boundaries with small labels, so the map reads without the legend */
var PIV={right:[372,575,60,200],left:[-12,575,300,200]};
function pill(g,x,y,txt,rgb){
  g.font="700 11px Montserrat,system-ui,sans-serif";var w=g.measureText(txt).width+14;
  g.beginPath();g.roundRect(x-w/2,y-10,w,20,10);g.fillStyle="rgba("+rgb.join(",")+",.92)";g.fill();
  g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";g.fillText(txt,x,y+.5);
}
function guides(g){
  g.save();g.setLineDash([5,5]);g.lineWidth=1.5;
  if(PIV[mode]){
    var p=PIV[mode],px=p[0],py=p[1],dx=p[2]-px,dy=p[3]-py,L=Math.hypot(dx,dy);dx/=L;dy/=L;
    [[78,C[1]],[310,C[1]],[380,C[2]]].forEach(function(a){g.beginPath();g.arc(px,py,a[0],0,Math.PI*2);g.strokeStyle="rgba("+a[1].join(",")+",.85)";g.stroke()});
    g.restore();
    pill(g,px+dx*200,py+dy*200,"Easy",C[0]);pill(g,px+dx*345,py+dy*345,"Stretch",C[1]);pill(g,px+dx*450,py+dy*450,"Hard",C[2]);
  }else{
    g.beginPath();g.moveTo(0,51);g.lineTo(W,51);g.strokeStyle="rgba("+C[1].join(",")+",.85)";g.stroke();g.restore();
  }
}
function zone(t){return t<.5?0:t<1.5?1:2}
var C=[[34,165,90],[240,160,32],[229,72,77]];
function col(t){var a=t<=1?C[0]:C[1],b=t<=1?C[1]:C[2],f=t<=1?t:t-1;return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f]}

/* the heat layer only changes with the grip, so it is drawn once per grip */
var heat=document.createElement("canvas"),HS=4;heat.width=W/HS;heat.height=H/HS;
function drawHeat(){
  var g=heat.getContext("2d"),img=g.createImageData(heat.width,heat.height),d=img.data,i=0;
  for(var y=0;y<heat.height;y++)for(var x=0;x<heat.width;x++){
    var t=diff(x*HS+HS/2,y*HS+HS/2),c=col(t);
    d[i++]=c[0];d[i++]=c[1];d[i++]=c[2];d[i++]=Math.round(255*(.07+.1*t));
  }
  g.putImageData(img,0,0);
}

function controls(){
  var sr=scr.getBoundingClientRect(),k=sr.width/W,seen=[],out=[];
  scr.querySelectorAll("button,input,[data-a]").forEach(function(el){
    if(el.classList.contains("scrim"))return;
    var own=el.parentElement&&el.parentElement.closest("button,[data-a]");if(own&&scr.contains(own))return;
    var r=el.getBoundingClientRect();if(r.width<4||r.height<4)return;
    if(r.width>sr.width*.9&&r.height>sr.height*.5)return;
    var cx=r.left+r.width/2,cy=r.top+r.height/2;
    if(cx<sr.left||cx>sr.right||cy<sr.top||cy>sr.bottom)return;
    var hit=document.elementFromPoint(cx,cy);if(!hit||!(hit===el||el.contains(hit)))return;
    if(seen.indexOf(el)>=0)return;seen.push(el);
    var x=(cx-sr.left)/k,y=(cy-sr.top)/k,t=diff(x,y),bx=r.width/k>160?(r.left-sr.left)/k+8:(r.right-sr.left)/k-Math.min(9,r.width/(2*k)),by=r.width/k>160?(r.bottom-sr.top)/k-6:(r.top-sr.top)/k+Math.min(9,r.height/(2*k));
    var name=(el.getAttribute("aria-label")||el.textContent||"").replace(/\s+/g," ").trim().split(",")[0]||el.getAttribute("data-a")||"control";
    out.push({x:x,y:y,bx:bx,by:by,z:zone(t),t:t,name:name.length>22?name.slice(0,21)+"…":name,off:el.disabled});
  });
  return out;
}

function draw(){
  raf=0;
  if(mode==="off"){cv.classList.remove("on");return}
  var dpr=Math.min(2,window.devicePixelRatio||1);
  if(cv.width!==W*dpr){cv.width=W*dpr;cv.height=H*dpr}
  var g=cv.getContext("2d");g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(heat,0,0,W,H);
  guides(g);
  var cs=controls(),n=[0,0,0],hard=[];
  cs.forEach(function(c){
    n[c.z]++;if(c.z===2&&hard.indexOf(c.name)<0)hard.push(c.name);
    var rgb=C[c.z];
    g.beginPath();g.arc(c.bx,c.by,6,0,Math.PI*2);g.fillStyle="rgba(255,255,255,.95)";g.shadowColor="rgba(0,0,0,.3)";g.shadowBlur=4;g.fill();
    g.shadowBlur=0;g.beginPath();g.arc(c.bx,c.by,4,0,Math.PI*2);g.fillStyle="rgba("+rgb.join(",")+","+(c.off?.45:1)+")";g.fill();
  });
  cv.classList.add("on");
  var tot=n[0]+n[1]+n[2];
  if(stat)stat.innerHTML=tot?"This screen: <b>"+n[0]+"</b> easy, <b>"+n[1]+"</b> stretch, <b>"+n[2]+"</b> hard"+
    (hard.length?'<span class="b-hl">Hard to reach: '+hard.slice(0,4).map(esc).join(", ")+(hard.length>4?" and "+(hard.length-4)+" more":"")+"</span>":'<span class="b-hl">Every control on this screen is within reach.</span>'):"No controls on this screen.";
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var raf=0;function sched(){if(mode!=="off"&&!raf)raf=requestAnimationFrame(draw)}

/* redraw when the screen changes; settle once more after entry animations */
var late=0;
new MutationObserver(function(ms){
  if(ms.every(function(m){return m.target===cv}))return;
  sched();clearTimeout(late);late=setTimeout(sched,320);
}).observe(scr,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style","disabled","hidden"]});
window.addEventListener("resize",sched);window.addEventListener("scroll",sched,{passive:true});

var g=document.getElementById("sg-reach");
g.addEventListener("click",function(e){
  var b=e.target.closest("button");if(!b)return;
  [].forEach.call(g.children,function(c){c.setAttribute("aria-pressed",c===b?"true":"false")});
  mode=b.getAttribute("data-v");info.hidden=mode==="off";
  if(mode!=="off")drawHeat();
  draw();
});
})();
