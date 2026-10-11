import{g as M,a as $,b as k,n as D,s as R,c as U}from"./index-D2dBsxrj.js";import{s as j,r as B,a as F}from"./md2slides-DcMtG_-o.js";import{s as G,a as Y,g as O,b as X}from"./deckfs-DUhz3s-3.js";const _={mode:"horizontal",main:50,sub:50};function V(t){const C=new URLSearchParams(location.search),A=M(),d=$(C.get("id"))||$(k().lastDeck)||A[0]||D(),o={..._,...k().layout||{}};t.innerHTML=`
    <div class="create-page mode-${o.mode}" id="cp">
      <div class="editors" id="editors">
        <section class="editor">
          <h3>📝 Markdown <button id="btn-sep" class="mini" title="Insérer un séparateur de slide">+ slide</button></h3>
          <textarea id="ed-md" spellcheck="false"></textarea>
        </section>
        <div class="splitter sub-split" data-split="sub" title="Glisser pour redimensionner"><span></span></div>
        <section class="editor">
          <h3>🎨 CSS du deck</h3>
          <textarea id="ed-css" spellcheck="false"></textarea>
        </section>
      </div>
      <div class="splitter main-split" data-split="main" title="Glisser pour redimensionner"><span></span></div>
      <section class="preview">
        <div class="preview-bar">
          <select id="deck-sel" title="Deck courant"></select>
          <button id="btn-prev">←</button>
          <span id="p-counter">– / –</span>
          <button id="btn-next">→</button>
          <span class="spacer"></span>
          <button id="btn-new">+ Nouveau</button>
          <button id="btn-save" class="primary">💾 Enregistrer</button>
        </div>
        <div class="preview-stage" id="p-stage">
          <section class="slide" id="p-slide"></section>
        </div>
      </section>
    </div>`;const u=t.querySelector("#cp"),h=t.querySelector("#editors"),i=t.querySelector("#ed-md"),m=t.querySelector("#ed-css"),y=t.querySelector("#p-slide"),P=t.querySelector("#p-stage"),T=t.querySelector("#p-counter"),f=t.querySelector("#deck-sel");let a=[],r=0,v=!1;const z=e=>Math.max(15,Math.min(85,e));function I(){u.classList.toggle("mode-horizontal",o.mode==="horizontal"),u.classList.toggle("mode-vertical",o.mode==="vertical"),u.style.setProperty("--main",o.main+"%"),h.style.setProperty("--sub",o.sub+"%")}const N=()=>U({...k(),layout:{...o}});for(const e of t.querySelectorAll(".splitter"))e.addEventListener("pointerdown",s=>{s.preventDefault(),e.setPointerCapture(s.pointerId);const l=e.dataset.split==="main"?o.mode==="vertical":o.mode==="horizontal",n=e.dataset.split==="main"?u:h,w=x=>{const g=n.getBoundingClientRect(),H=l?(x.clientY-g.top)/g.height*100:(x.clientX-g.left)/g.width*100,q=e.dataset.split;o[q]=z(H),q==="main"?u.style.setProperty("--main",o.main+"%"):h.style.setProperty("--sub",o.sub+"%")},p=()=>{e.removeEventListener("pointermove",w),e.removeEventListener("pointerup",p),e.removeEventListener("pointercancel",p),N()};e.addEventListener("pointermove",w),e.addEventListener("pointerup",p),e.addEventListener("pointercancel",p)});I();const E=()=>{f.innerHTML=M().map(e=>`<option value="${e.id}" ${e.id===d.id?"selected":""}>${e.name}</option>`).join("")};E(),f.addEventListener("change",()=>{if(v&&!confirm("Modifications non enregistrées. Changer de deck ?")){E();return}location.search="?id="+f.value,location.hash="#/create"}),i.value=d.md,m.value=d.css;const c=()=>{a=j(i.value),r=Math.min(r,Math.max(0,a.length-1)),a.length?(B(y,a[r]),Y(y)):y.innerHTML='<p class="error">Deck vide — ajoutez du contenu Markdown.</p>',T.textContent=`${a.length?r+1:0} / ${a.length}`,F(P,m.value),v=!0};i.addEventListener("input",c),m.addEventListener("input",c),t.querySelector("#btn-prev").addEventListener("click",()=>{r=Math.max(0,r-1),c(),v=!0}),t.querySelector("#btn-next").addEventListener("click",()=>{r=Math.min(a.length-1,r+1),c(),v=!0}),t.querySelector("#btn-sep").addEventListener("click",()=>{const e=i.selectionStart,s=i.value.slice(0,e),l=i.value.slice(e);i.value=s.replace(/\s*$/,"")+`

---

`+l.replace(/^\s*/,""),i.selectionStart=i.selectionEnd=e+7,i.focus(),c()});const b=t.querySelector("#btn-save"),L=async()=>{const e=await O(d.id);if(e){b.title=`Enregistrer — fichier lié : ${e}`;return}const s=await X();b.title=s?`Enregistrer — écrit dans le dossier des decks : ${s}`:"Enregistrer — le dossier des decks sera demandé une seule fois"};L(),b.addEventListener("click",async()=>{const e={...d,md:i.value,css:m.value};R(e);const s=t.querySelector("#btn-save");s.disabled=!0,s.textContent="… Enregistrement";let l="✓ Enregistré (cache)";try{const n=await G(e);n&&!n.cancelled&&(n.where==="download"?l="✓ .mdk téléchargé":l=n.folder?`✓ ${n.folder}/${n.filename}`:`✓ ${n.filename}`,n.reason&&alert(`Info : ${n.reason}`)),L()}catch(n){n&&n.name!=="AbortError"&&alert("Enregistrement .mdk impossible : "+n.message)}v=!1,s.textContent=l,setTimeout(()=>{s.textContent="💾 Enregistrer",s.disabled=!1},1200)}),t.querySelector("#btn-new").addEventListener("click",()=>{const e=prompt("Nom du nouveau deck :");if(!e)return;const s=D(e);location.search="?id="+s.id,location.hash="#/create"});const S=e=>{document.activeElement===i||document.activeElement===m||(e.key==="ArrowLeft"&&(r=Math.max(0,r-1),c()),e.key==="ArrowRight"&&(r=Math.min(a.length-1,r+1),c()))};return document.addEventListener("keydown",S),c(),()=>document.removeEventListener("keydown",S)}export{V as mount};
