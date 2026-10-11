import{d as S,c as h,g as m,b as g}from"./index-D2dBsxrj.js";function f(t){const s=g(),l=s.theme,v=["Segoe UI","Calibri","Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Georgia","Times New Roman","Cambria","Garamond","Palatino Linotype","Courier New","Consolas","Lucida Console","Comic Sans MS","Impact"],y=["system-ui","sans-serif","serif","monospace"],b=e=>{try{return document.fonts.check(`16px "${e}"`)}catch{return!0}},a=[...v.filter(b),...y],n=(e,o)=>{const u=a.map(c=>`<option value="${c}" ${c===o?"selected":""}>${c}</option>`);a.includes(o)||u.unshift(`<option value="${o.replace(/"/g,"&quot;")}" selected>${o} (actuelle)</option>`),e.innerHTML=u.join("")};t.innerHTML=`
    <div class="settings-page">
      <h2>⚙️ Paramètres</h2>

      <section class="card">
        <h3>Disposition (page Création)</h3>
        <div class="form-grid">
          <label>Mode de la zone de travail
            <select id="s-layout-mode">
              <option value="horizontal" ${s.layout?.mode!=="vertical"?"selected":""}>Horizontal — WYSIWYG à droite</option>
              <option value="vertical" ${s.layout?.mode==="vertical"?"selected":""}>Vertical — WYSIWYG en haut</option>
            </select>
          </label>
        </div>
      </section>

      <section class="card">
        <h3>Thème (variables CSS)</h3>
        <div class="form-grid">
          <label>Fond des slides (CSS — couleur ou gradient)
            <input id="s-bg" value="${l.bg.replace(/"/g,"&quot;")}">
          </label>
          <label>Couleur du texte
            <input id="s-color" type="color" value="${l.color}">
          </label>
          <label>Couleur d'accent
            <input id="s-accent" type="color" value="${l.accent}">
          </label>
          <label>Police des titres
            <select id="s-heading"></select>
          </label>
          <label>Police du corps
            <select id="s-body"></select>
          </label>
        </div>
        <div class="card-actions">
          <button id="s-save" class="primary">💾 Appliquer</button>
          <button id="s-reset">↺ Valeurs par défaut</button>
        </div>
      </section>

      <section class="card">
        <h3>Decks enregistrés (navigateur)</h3>
        <ul id="deck-list" class="deck-list"></ul>
        <div class="card-actions">
          <button id="s-export">⬇️ Exporter (JSON)</button>
          <button id="s-import">⬆️ Importer</button>
          <input type="file" id="s-file" accept="application/json" hidden>
        </div>
      </section>

      <section class="card theme-demo">
        <h3>Aperçu</h3>
        <section class="slide"><h2>Titre de slide</h2><p>Texte avec <strong>gras</strong>, <em>italique</em> et <code>code</code>.</p><ul><li>Élément de liste</li></ul></section>
      </section>
    </div>`;const r=t.querySelector("#deck-list");n(t.querySelector("#s-heading"),l.heading),n(t.querySelector("#s-body"),l.body);const d=()=>{r.innerHTML=m().map(e=>`
      <li>
        <span>${e.name} <small>${new Date(e.updatedAt||Date.now()).toLocaleString("fr-FR")}</small></span>
        <button data-del="${e.id}" class="danger">🗑 Supprimer</button>
      </li>`).join("")||"<li><em>Aucun deck.</em></li>"};d(),r.addEventListener("click",e=>{const o=e.target.dataset?.del;o&&confirm("Supprimer ce deck ?")&&(S(o),d())}),t.querySelector("#s-save").addEventListener("click",()=>{const e={...s,theme:{bg:t.querySelector("#s-bg").value,color:t.querySelector("#s-color").value,accent:t.querySelector("#s-accent").value,heading:t.querySelector("#s-heading").value,body:t.querySelector("#s-body").value},layout:{...s.layout||{},mode:t.querySelector("#s-layout-mode").value}};h(e),alert("Thème appliqué.")}),t.querySelector("#s-reset").addEventListener("click",()=>{localStorage.removeItem("mydeck.settings"),location.reload()}),t.querySelector("#s-export").addEventListener("click",()=>{const e=new Blob([JSON.stringify({settings:g(),decks:m()},null,2)],{type:"application/json"}),o=document.createElement("a");o.href=URL.createObjectURL(e),o.download="mydeck-export.json",o.click(),URL.revokeObjectURL(o.href)});const i=t.querySelector("#s-file");t.querySelector("#s-import").addEventListener("click",()=>i.click()),i.addEventListener("change",async()=>{try{const e=JSON.parse(await i.files[0].text());e.decks&&localStorage.setItem("mydeck.decks",JSON.stringify(e.decks)),e.settings&&localStorage.setItem("mydeck.settings",JSON.stringify(e.settings)),location.reload()}catch{alert("Fichier JSON invalide.")}})}export{f as mount};
