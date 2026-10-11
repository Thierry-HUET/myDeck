import{n as k,g as u,s as v,a as h,b as g}from"./index-D2dBsxrj.js";import{D as c,o as p,i as f,r as b,s as w,c as y,e as $,d as M,g as D,b as m,l as x}from"./deckfs-DUhz3s-3.js";const a={nouveau:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',ouvrir:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',enregistrer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',saveas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/><path d="m10 15 4 4"/><path d="m14 15-4 4"/></svg>',exporter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',parametres:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M2 14h4M10 8h4M18 16h4"/></svg>'};function S(s){s.innerHTML=`
    <div class="deck-page">
      <h2>Slides</h2>
      <p id="d-status" class="deck-status"></p>

      <section class="card">
        <div class="deck-menu">
          <button id="d-new">${a.nouveau}Nouveau deck</button>
          <button id="d-open">${a.ouvrir}Ouvrir (.mdk)…</button>
          <button id="d-save">${a.enregistrer}Enregistrer</button>
          <button id="d-saveas">${a.saveas}Enregistrer sous…</button>
          <button id="d-export">${a.exporter}Exporter (.zip)</button>
          <hr class="menu-sep">
          <button id="d-settings">${a.parametres}Paramètres</button>
        </div>
      </section>

      <section class="card">
        <h3>Dossier des decks</h3>
        <p id="d-lib-list" class="muted"></p>
        <div class="card-actions">
          <button id="d-lib-change">📁 Changer de dossier…</button>
        </div>
      </section>

      <section class="card">
        <h3>Comment ça marche</h3>
        <p>La copie de travail du deck est <strong>en cache dans le navigateur</strong> : vous pouvez modifier et prévisualiser sans rien écrire sur le disque.</p>
        <p>Sur le disque, un deck est <strong>un fichier unique <code>&lt;nom&gt;.mdk</code></strong> — une archive ZIP contenant toute l'arborescence du projet :</p>
        <pre class="deck-structure">MonDeck.mdk
├── mydeck.json    manifeste : version du format deck (${c})
├── deck.md        Markdown du deck
├── style.css      style du deck
├── images/        images et SVG référencés
└── versions/      versions antérieures de deck.md (10 max)</pre>
        <p class="muted">À chaque enregistrement sur disque, si le Markdown a changé, l'ancien <code>deck.md</code> est archivé dans <code>versions/</code> à l'intérieur du .mdk.</p>
        <p class="muted">« Enregistrer » réutilise l'emplacement du dernier « Enregistrer sous » de la session ; sinon il se comporte comme « Enregistrer sous ».</p>
      </section>
    </div>`;const d=s.querySelector("#d-status"),o=()=>h(g().lastDeck)||u()[0]||null,i=async()=>{const e=o(),t=[];t.push(e?`Deck en cache : « ${e.name} »`:"Aucun deck en cache");const r=e?await D(e.id):null,n=await m();t.push(r?`fichier lié : ${r}`:n?`dossier des decks : ${n}`:"dossier des decks non choisi"),d.textContent=t.join(" — "),d.classList.toggle("linked",!!r)};i(),s.querySelector("#d-new").addEventListener("click",()=>{const e=prompt("Nom du nouveau deck :","Deck sans titre");e!==null&&(k(e.trim()||"Deck sans titre"),location.hash="#/create")}),s.querySelector("#d-open").addEventListener("click",async()=>{try{const e=await p();if(!e)return;if(e.format&&!f(e.format)){if(!confirm(`Ce deck utilise un format plus récent (${e.format} > ${c}).
myDeck ne garantit pas la compatibilité : l'enregistrer pourrait le rendre inutilisable par cette version.

L'ouvrir quand même ?`))return}else!e.format&&(e.md||e.css)&&alert(`Deck sans manifeste (ancien format) — il sera mis au format ${c} au prochain enregistrement.`);if(!e.md&&!e.css&&!confirm("Ce .mdk ne contient pas de deck.md — l'initialiser comme nouveau deck ?"))return;const t=u().find(n=>n.name===e.name),r=t?{...t,md:e.md,css:e.css}:{id:crypto.randomUUID(),name:e.name,md:e.md,css:e.css};v(r),e.handle&&await b(r.id,e.handle),i(),location.hash="#/create"}catch(e){alert("Ouverture impossible : "+e.message)}}),s.querySelector("#d-save").addEventListener("click",async()=>{const e=o();if(!e)return alert("Aucun deck courant.");try{const t=await w(e);if(!t||t.cancelled)return;i(),alert(t.where==="download"?`Deck « ${e.name} » enregistré : ${t.filename} (téléchargement).`:`Deck « ${e.name} » enregistré : ${t.folder?t.folder+"/":""}${t.filename}`)}catch(t){alert("Enregistrement impossible : "+t.message)}}),s.querySelector("#d-saveas").addEventListener("click",async()=>{const e=o();if(!e)return alert("Aucun deck courant.");try{const t=await y(e);if(!t||t.cancelled)return;i(),alert(t.where==="download"?`Deck « ${e.name} » enregistré : ${t.filename} (téléchargement — votre navigateur ne supporte pas le choix d'emplacement).`:`Deck « ${e.name} » enregistré dans ${t.filename}.`)}catch(t){alert("Enregistrement impossible : "+t.message)}}),s.querySelector("#d-export").addEventListener("click",async()=>{const e=o();if(!e)return alert("Aucun deck courant.");try{const t=await $(e);alert(`Archive exportée : ${t.filename}`)}catch(t){alert("Export impossible : "+t.message)}});const l=async()=>{const e=s.querySelector("#d-lib-list"),t=await m(),r=await x();if(!t){e.textContent="Aucun dossier des decks désigné (il sera demandé au premier enregistrement).";return}e.textContent=r&&r.length?`Dossier « ${t} » — decks : ${r.join(", ")}`:`Dossier « ${t} » — aucun fichier .mdk pour le moment.`};l(),s.querySelector("#d-lib-change").addEventListener("click",async()=>{try{await M()&&(await l(),await i())}catch(e){alert("Changement de dossier impossible : "+e.message)}}),s.querySelector("#d-settings").addEventListener("click",()=>{location.hash="#/settings"})}export{S as mount};
