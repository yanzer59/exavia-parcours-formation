const fs = require('fs');
const https = require('https');

// Load data
const dataContent = fs.readFileSync('./data.js', 'utf-8');
eval(dataContent.replace(/^const /gm, 'var '));

const catalogueByRncp = {};
CATALOGUE.forEach(f => { catalogueByRncp[f.rncp] = f; });

const niveauLabel = { 3: 'Niveau 3 — CAP / BEP', 4: 'Niveau 4 — BAC', 5: 'Niveau 5 — BAC+2', 6: 'Niveau 6 — BAC+3' };
const niveauAccent = { 3: '#0d9488', 4: '#4f46e5', 5: '#be185d', 6: '#b45309' };

const debouches = {
  "maconnerie-gros-oeuvre": { metiers: ["Maçon", "Coffreur bancheur", "Tailleur de pierre", "Couvreur", "Chef d'équipe gros œuvre", "Chef de chantier", "Conducteur de travaux BTP"], secteurs: ["BTP", "Génie civil", "Rénovation du patrimoine"] },
  "second-oeuvre-finitions": { metiers: ["Plaquiste", "Peintre en bâtiment", "Carreleur", "Solier moquettiste", "Peintre décorateur", "Chef d'équipe finitions", "Conducteur de travaux"], secteurs: ["Aménagement intérieur", "Rénovation", "Construction neuve"] },
  "charpente-menuiserie-metallerie": { metiers: ["Charpentier bois", "Menuisier agenceur", "Menuisier fabricant", "Métallier", "Ferronnier d'art", "Dessinateur projeteur"], secteurs: ["Construction bois", "Menuiserie industrielle", "Métallerie"] },
  "travaux-publics-vrd": { metiers: ["Canalisateur", "Maçon VRD", "Conducteur d'engins", "Grutier", "Scaphandrier", "Chef de chantier TP"], secteurs: ["Travaux publics", "Voirie", "Réseaux", "Génie civil"] },
  "etudes-conception-batiment": { metiers: ["Métreur", "Technicien d'études", "BIM modeleur", "Dessinateur projeteur", "Économiste de la construction", "Géomètre topographe", "Chargé d'affaires", "Coordinateur BIM"], secteurs: ["Bureaux d'études", "Cabinets d'architecture", "Maîtrise d'œuvre"] },
  "electricite-batiment-connecte": { metiers: ["Électricien d'équipement", "Monteur réseaux électriques", "Agent de maintenance", "Technicien électricien", "Domoticien"], secteurs: ["Installation électrique", "Domotique", "Smart building"] },
  "genie-climatique-thermique": { metiers: ["Installateur thermique", "Frigoriste", "Climaticien", "Technicien froid", "Technicien chauffage/ENR", "Chargé d'études CVC"], secteurs: ["Chauffage", "Climatisation", "Froid industriel", "Énergies renouvelables"] },
  "chaudronnerie-soudure": { metiers: ["Chaudronnier", "Soudeur industriel", "Tuyauteur", "Calorifugeur", "Technicien chaudronnerie", "Dessinateur projeteur tuyauterie"], secteurs: ["Industrie pétrolière", "Nucléaire", "Aéronautique", "Navale"] },
  "usinage-mecanique": { metiers: ["Fraiseur", "Tourneur", "Usineur CN", "Ajusteur aéronautique", "Régleur machines-outils", "Concepteur industriel"], secteurs: ["Aéronautique", "Automobile", "Mécanique de précision", "Défense"] },
  "production-industrielle": { metiers: ["Agent de fabrication", "Conducteur de ligne", "Monteur industriel", "Technicien de production", "Responsable production"], secteurs: ["Agroalimentaire", "Plasturgie", "Assemblage"] },
  "chimie-laboratoire": { metiers: ["Conducteur d'appareils chimie", "Technicien de fabrication", "Technicien de laboratoire", "Physicien chimiste"], secteurs: ["Industrie chimique", "Pharmaceutique", "Cosmétique", "R&D"] },
  "materiaux-composites": { metiers: ["Stratifieur composites", "Opérateur composites", "Constructeur nautique", "Technicien composites"], secteurs: ["Aéronautique", "Nautisme", "Automobile", "Énergie éolienne"] },
  "controle-qualite": { metiers: ["Technicien contrôle", "Inspecteur CND", "Inspecteur qualité aéro", "Technicien fabrication additive"], secteurs: ["Aéronautique/Spatial", "Nucléaire", "Automobile"] },
  "maintenance-electronique": { metiers: ["Électromécanicien", "Câbleur électronique", "Monteur câbleur aéro", "Technicien maintenance industrielle", "Automaticien"], secteurs: ["Maintenance industrielle", "Électronique", "Aéronautique"] },
  "mecanique-automobile": { metiers: ["Mécanicien automobile", "Mécanicien moto", "Technicien électromécanicien auto", "Contrôleur technique"], secteurs: ["Concessions", "Garages", "Centres auto"] },
  "vehicules-engins": { metiers: ["Mécanicien VI", "Mécanicien agricole", "Mécanicien espaces verts", "Mécanicien engins", "Technicien maintenance engins"], secteurs: ["TP et chantier", "Agriculture", "Espaces verts"] },
  "gastronomie-arts-culinaires": { metiers: ["Commis de cuisine", "Cuisinier", "Chef de partie", "Pâtissier", "Chef de cuisine"], secteurs: ["Restauration gastronomique", "Hôtels", "Traiteurs"] },
  "restauration-collective": { metiers: ["Cuisinier collectivité", "Serveur", "Responsable de salle", "Chef gérant"], secteurs: ["Cantines", "Hôpitaux", "EHPAD", "Entreprises"] },
  "restauration-rapide": { metiers: ["Employé polyvalent", "Équipier", "Responsable de point de restauration", "Manager de restauration rapide", "Directeur d'établissement", "Responsable de structure"], secteurs: ["Fast-food", "Restauration rapide", "Restauration collective", "Cafétérias", "Grande distribution"] },
  "hotellerie-hebergement": { metiers: ["Femme/Valet de chambre", "Gouvernant(e)", "Réceptionniste", "Chef de réception"], secteurs: ["Hôtels", "Résidences de tourisme", "Campings"] },
  "tourisme-loisirs": { metiers: ["Chargé d'accueil touristique", "Guide accompagnateur", "Animateur de loisirs", "Conseiller voyages", "Responsable projets touristiques"], secteurs: ["Offices de tourisme", "Agences de voyage", "Parcs de loisirs"] },
  "vente-magasin": { metiers: ["Employé commercial", "Conseiller de vente", "Manager de rayon", "Responsable de magasin"], secteurs: ["Grande distribution", "Commerce spécialisé", "Retail"] },
  "commerce-negociation": { metiers: ["Conseiller commercial", "Commercial terrain", "Négociateur technico-commercial", "Assistant commercial"], secteurs: ["B2B", "B2C", "Industrie", "Services"] },
  "developpement-web": { metiers: ["Agent reconditionnement", "Développeur web", "Développeur fullstack", "Concepteur d'applications", "Lead developer"], secteurs: ["ESN", "Start-ups", "Agences web", "Freelance"] },
  "systemes-reseaux-cyber": { metiers: ["Technicien informatique", "Technicien réseaux", "Admin systèmes et réseaux", "Admin DevOps/NetOps", "Ingénieur cybersécurité"], secteurs: ["ESN", "DSI entreprises", "Hébergeurs", "Sécurité IT"] },
  "design-creation-multimedia": { metiers: ["Graphiste", "Monteur audiovisuel", "Médiateur numérique", "Designer UI/UX", "Directeur artistique"], secteurs: ["Agences de communication", "Studios", "Presse/Média"] },
  "telecom-fibre": { metiers: ["Installateur fibre optique", "Technicien fibre FTTH", "Chargé d'études télécom", "Chef d'équipe fibre"], secteurs: ["Opérateurs télécom", "Sous-traitants fibre", "Data centers"] },
  "transport-conduite": { metiers: ["Conducteur PL/SPL", "Conducteur de bus", "Exploitant transport", "Gestionnaire opérations", "Organisateur transport international"], secteurs: ["Transport routier", "Logistique", "Transport voyageurs"] },
  "logistique-entreposage": { metiers: ["Agent magasinier", "Cariste", "Préparateur de commandes", "Technicien logistique", "Responsable d'entrepôt"], secteurs: ["E-commerce", "Grande distribution", "Industrie"] },
  "comptabilite-gestion": { metiers: ["Comptable assistant", "Secrétaire comptable", "Gestionnaire comptable", "Gestionnaire de paie", "Assistant immobilier", "Responsable de structure"], secteurs: ["Cabinets comptables", "PME/TPE", "Immobilier"] },
  "secretariat-assistance": { metiers: ["Secrétaire assistant(e)", "Secrétaire médical(e)", "Assistant(e) de direction", "Office manager"], secteurs: ["Toute entreprise", "Santé", "Juridique"] },
  "sante-medico-social": { metiers: ["Aide à domicile", "Accompagnant éducatif et social", "Auxiliaire prothèse dentaire", "Agent de propreté", "Opticien vendeur"], secteurs: ["EHPAD", "Domicile", "Hôpitaux", "Laboratoires dentaires"] },
  "mediation-relation-client": { metiers: ["Agent de médiation", "Téléconseiller", "Médiateur social", "Manager relation client"], secteurs: ["Services publics", "Centres d'appels", "Collectivités"] },
  "formation-insertion": { metiers: ["Encadrant technique", "Formateur professionnel", "Conseiller en insertion professionnelle"], secteurs: ["Organismes de formation", "Missions locales", "Associations"] },
  "environnement-energie": { metiers: ["Agent valorisation déchets", "Opérateur amiante", "Paysagiste", "Horticulteur", "Technicien traitement eaux", "Chargé d'études thermiques"], secteurs: ["Environnement", "Recyclage", "Dépollution", "Énergie renouvelable"] },
  "securite-surveillance": { metiers: ["Agent de sécurité", "Opérateur vidéoprotection", "Technicien sécurité incendie", "Chef d'équipe sécurité"], secteurs: ["Sociétés de sécurité", "Grande distribution", "Événementiel"] },
  "artisanat-mode-metiers-art": { metiers: ["Tapissier", "Maroquinier", "Couturier mode/luxe", "Sellier", "Horloger", "Cordonnier"], secteurs: ["Maisons de luxe", "Ateliers artisanaux", "Haute couture", "Horlogerie"] }
};

function generateHTML() {
  // Reorder: Commerce, Vente/Distribution, Admin/RH, Restauration first
  const priorityIds = [
    'commerce-negociation',
    'vente-magasin',
    'comptabilite-gestion',
    'secretariat-assistance',
    'gastronomie-arts-culinaires',
    'restauration-collective',
    'restauration-rapide',
  ];
  const priorityFilieres = priorityIds.map(id => FILIERES.find(f => f.id === id)).filter(Boolean);
  const restFilieres = FILIERES.filter(f => !priorityIds.includes(f.id));
  const orderedFilieres = [...priorityFilieres, ...restFilieres];

  const parcoursSections = orderedFilieres.map((filiere, fi) => {
    const d = debouches[filiere.id] || { metiers: [], secteurs: [] };
    const byLevel = {};
    filiere.formations.forEach(f => {
      if (!byLevel[f.niveau]) byLevel[f.niveau] = [];
      byLevel[f.niveau].push(f);
    });
    const levels = Object.keys(byLevel).sort((a, b) => a - b);

    // Build table rows - find max formations in any level
    const maxRows = Math.max(...levels.map(l => byLevel[l].length));

    // Build columns
    const colHeaders = levels.map(lvl =>
      `<th class="col-header">${niveauLabel[lvl]}</th>`
    ).join('');

    // Build rows
    let tableRows = '';
    for (let r = 0; r < maxRows; r++) {
      tableRows += '<tr>';
      for (const lvl of levels) {
        const f = byLevel[lvl][r];
        if (f) {
          const cat = catalogueByRncp[f.rncp];
          const duree = cat ? cat.duree : '441h';
          tableRows += `<td class="cell">
            <div class="cell-title">${f.titre.replace('TP ', '')}</div>
            <div class="cell-meta">${f.rncp} — ${duree}</div>
          </td>`;
        } else {
          tableRows += '<td class="cell empty"></td>';
        }
      }
      tableRows += '</tr>';
    }

    const arrowHeader = levels.map((lvl, i) => {
      const arrow = i < levels.length - 1 ? '<span class="arrow-hint">&#8594;</span>' : '';
      return `<th class="col-header"><span class="col-dot" style="background:${niveauAccent[lvl]}"></span>${niveauLabel[lvl]}${arrow}</th>`;
    }).join('');

    return `
      <div class="parcours-block" id="parcours-${filiere.id}">
        <div class="parcours-content">
          <div class="parcours-header">
            <div class="parcours-num">${String(fi + 1).padStart(2, '0')}</div>
            <div>
              <h2>Parcours ${filiere.nom}</h2>
              <p class="parcours-sub">${filiere.formations.length} formations — ${levels.length} niveau${levels.length > 1 ? 'x' : ''} de qualification</p>
            </div>
          </div>

          <table class="parcours-table">
            <thead><tr>${arrowHeader}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>

          <div class="parcours-pfooter">
            <div class="footer-col">
              <span class="footer-label">Debouches metiers :</span>
              <span class="footer-list">${d.metiers.join(' — ')}</span>
            </div>
            <div class="footer-col">
              <span class="footer-label">Secteurs :</span>
              <span class="footer-list">${d.secteurs.join(' — ')}</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  const brandColor = '#0c1e3d';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1e293b; font-size: 12px; line-height: 1.5; background: #eef2f7; }

  /* Logo */
  .logo { display: inline-flex; align-items: center; gap: 0; }
  .logo-box { background: ${brandColor}; color: white; font-size: 18px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: -0.5px; }
  .logo-text { font-size: 12px; font-weight: 600; color: ${brandColor}; margin-left: 8px; letter-spacing: 1px; }

  /* Page header bar */
  .page-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 40px;
    background: white;
    border-bottom: 2px solid ${brandColor};
  }
  .page-bar-right { font-size: 10px; color: #6b7280; }

  /* Cover */
  .cover {
    width: 100%; height: 100vh;
    background: ${brandColor};
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    color: white; text-align: center; position: relative;
  }
  .cover-logo { background: white; color: ${brandColor}; font-size: 48px; font-weight: 800; padding: 12px 24px; border-radius: 10px; letter-spacing: -1px; margin-bottom: 30px; }
  .cover h1 { font-size: 42px; font-weight: 700; margin-bottom: 8px; }
  .cover-line { width: 60px; height: 2px; background: rgba(255,255,255,0.3); margin: 14px auto; }
  .cover-sub { font-size: 16px; color: rgba(255,255,255,0.6); font-weight: 300; }
  .cover-stats { display: flex; gap: 60px; margin-top: 40px; }
  .cover-stat { text-align: center; }
  .cover-stat-val { font-size: 36px; font-weight: 700; }
  .cover-stat-lbl { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 2px; }
  .cover-footer { position: absolute; bottom: 20px; font-size: 9px; color: rgba(255,255,255,0.25); }

  /* TOC */
  .toc { padding: 0; page-break-before: always; }
  .toc-content { padding: 14px 50px; }
  .toc h1 { font-size: 22px; font-weight: 700; color: ${brandColor}; margin-bottom: 2px; }
  .toc-line { width: 40px; height: 2px; background: ${brandColor}; margin-bottom: 4px; }
  .toc-sub { font-size: 11px; color: #6b7280; margin-bottom: 8px; }
  .toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px; }
  .toc-row { display: flex; align-items: baseline; gap: 8px; padding: 4px 0; border-bottom: 1px solid #dde3ea; text-decoration: none; color: inherit; }
  .toc-num { font-size: 12px; font-weight: 700; color: ${brandColor}; min-width: 22px; }
  .toc-name { font-size: 12px; font-weight: 500; color: #1e293b; white-space: nowrap; }
  .toc-dots { flex: 1; border-bottom: 1px dotted #94a3b8; min-width: 10px; margin: 0 4px; }
  .toc-page { font-size: 11px; font-weight: 600; color: #6b7280; }

  /* Parcours blocks */
  .parcours-block {
    page-break-inside: avoid;
    margin-bottom: 8px;
  }
  .parcours-content { padding: 14px 40px 8px; }
  .parcours-header {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 0;
    padding: 10px 16px;
    background: white;
    border-left: 4px solid ${brandColor};
  }
  .parcours-num { font-size: 28px; font-weight: 800; color: ${brandColor}; }
  .parcours-header h2 { font-size: 20px; font-weight: 800; color: ${brandColor}; }
  .parcours-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }

  /* Table */
  .parcours-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    border-radius: 0;
    overflow: hidden;
  }
  .col-header {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: white;
    padding: 7px 10px;
    background: ${brandColor};
    border-right: 1px solid rgba(255,255,255,0.15);
    white-space: nowrap;
  }
  .col-header:last-child { border-right: none; }
  .col-dot {
    display: inline-block;
    width: 10px; height: 10px;
    border-radius: 50%;
    margin-right: 8px;
    vertical-align: middle;
  }
  .arrow-hint {
    color: rgba(255,255,255,0.4);
    margin-left: 10px;
    font-size: 14px;
  }
  .cell {
    padding: 6px 12px;
    border-bottom: 1px solid #e5e7eb;
    border-right: 1px solid #e5e7eb;
    vertical-align: top;
    background: white;
  }
  .cell:last-child { border-right: none; }
  .cell.empty { background: #f3f6f9; }
  .cell-title { font-size: 12px; font-weight: 600; color: #1e293b; line-height: 1.3; }
  .cell-meta { font-size: 9px; color: #94a3b8; margin-top: 2px; }

  /* Footer of each parcours */
  .parcours-pfooter {
    display: flex; gap: 24px;
    padding: 7px 10px;
    background: #f8fafc;
    border-top: 1px solid #e5e7eb;
  }
  .footer-col { flex: 1; }
  .footer-label { font-size: 11px; font-weight: 700; color: ${brandColor}; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer-list { font-size: 11px; color: #4b5563; }

  @page { size: A4 landscape; margin: 0; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-logo">M&amp;E</div>
  <h1>Parcours de Formation</h1>
  <div class="cover-line"></div>
  <div class="cover-sub">Debouches metiers et progression professionnelle</div>
  <div class="cover-stats">
    <div class="cover-stat"><div class="cover-stat-val">${FILIERES.length}</div><div class="cover-stat-lbl">Parcours</div></div>
    <div class="cover-stat"><div class="cover-stat-val">235</div><div class="cover-stat-lbl">Formations</div></div>
    <div class="cover-stat"><div class="cover-stat-val">4</div><div class="cover-stat-lbl">Niveaux</div></div>
  </div>
  <div class="cover-footer">M&amp;E Consulting — Edition Mars 2026</div>
</div>

<!-- TOC -->
<div class="toc">
  <div class="page-bar">
    <div class="page-bar-right" style="margin-left:auto">Parcours de Formation — Sommaire</div>
  </div>
  <div class="toc-content">
    <h1>Sommaire</h1>
    <div class="toc-line"></div>
    <p class="toc-sub">37 parcours metiers — 235 formations — Du CAP au BAC+3</p>
    <div class="toc-grid">
      ${orderedFilieres.map((f, i) => `
        <a href="#parcours-${f.id}" class="toc-row">
          <span class="toc-num">${String(i+1).padStart(2,'0')}</span>
          <span class="toc-name">${f.nom}</span>
          <span class="toc-dots"></span>
          <span class="toc-page" id="toc-page-${f.id}">p.—</span>
        </a>
      `).join('')}
    </div>
  </div>
</div>

${parcoursSections}

</body></html>`;
}

(async () => {
  console.log('Generating HTML...');
  const html = generateHTML();
  fs.writeFileSync('./parcours-preview.html', html);

  console.log('Sending to Gotenberg...');
  const boundary = '----GotenbergBoundary' + Date.now();
  const auth = Buffer.from('ZzbjAsC7rUSRy1wv:i4gdtQNRdx3c1kvTGQL3nxrvh64wsxm3').toString('base64');

  const parts = [];
  function addField(name, value) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`);
  }
  function addFile(name, filename, content, contentType) {
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n${content}`);
  }

  addFile('files', 'index.html', html, 'text/html');
  addField('landscape', 'true');
  addField('paperWidth', '11.7');
  addField('paperHeight', '8.27');
  addField('marginTop', '0');
  addField('marginBottom', '0');
  addField('marginLeft', '0');
  addField('marginRight', '0');
  addField('printBackground', 'true');
  addField('preferCssPageSize', 'false');
  addField('generateDocumentOutline', 'true');

  const body = parts.join('\r\n') + '\r\n--' + boundary + '--\r\n';

  const options = {
    hostname: 'gotenberg.eduvia.app',
    path: '/forms/chromium/convert/html',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Basic ${auth}`,
    },
  };

  const result = await new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) resolve(Buffer.concat(chunks));
        else reject(new Error(`Gotenberg ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  // PASS 1: Parse PDF to find actual page numbers for each parcours
  // PASS 1: Parse PDF to find actual page numbers for each parcours
  console.log('Pass 1 done. Parsing pages...');
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(result) }).promise;
  const totalPages = pdfDoc.numPages;
  console.log('Total pages:', totalPages);

  // Extract text per page
  const parcourPages = {};
  for (let p = 1; p <= totalPages; p++) {
    const page = await pdfDoc.getPage(p);
    const tc = await page.getTextContent();
    const text = tc.items.map(i => i.str).join(' ');
    // Check each filiere - normalize spaces and accents for comparison
    const norm = s => s.replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const normText = norm(text);
    for (const filiere of FILIERES) {
      if (parcourPages[filiere.id]) continue;
      // Use just the first word of the filiere name after "Parcours"
      const firstWord = filiere.nom.split(/[,&]/)[0].trim();
      const search = norm('Parcours ' + firstWord);
      if (normText.includes(search)) {
        parcourPages[filiere.id] = p;
      }
    }
  }

  console.log('Page mapping found for', Object.keys(parcourPages).length, 'parcours');

  // PASS 2: Regenerate with correct page numbers
  console.log('Pass 2: Regenerating with correct pages...');
  let html2 = generateHTML();
  for (const filiere of FILIERES) {
    const pageNum = parcourPages[filiere.id] || '?';
    html2 = html2.replace(`id="toc-page-${filiere.id}">p.—`, `id="toc-page-${filiere.id}">p.${pageNum}`);
  }
  fs.writeFileSync('./parcours-preview.html', html2);

  // Send pass 2 to Gotenberg
  const parts2 = [];
  function addField2(name, value) {
    parts2.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`);
  }
  function addFile2(name, filename, content, contentType) {
    parts2.push(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n${content}`);
  }
  addFile2('files', 'index.html', html2, 'text/html');
  addField2('landscape', 'true');
  addField2('paperWidth', '11.7');
  addField2('paperHeight', '8.27');
  addField2('marginTop', '0');
  addField2('marginBottom', '0');
  addField2('marginLeft', '0');
  addField2('marginRight', '0');
  addField2('printBackground', 'true');
  addField2('preferCssPageSize', 'false');
  addField2('generateDocumentOutline', 'true');

  const body2 = parts2.join('\r\n') + '\r\n--' + boundary + '--\r\n';
  const result2 = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'gotenberg.eduvia.app',
      path: '/forms/chromium/convert/html',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body2),
        'Authorization': `Basic ${auth}`,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) resolve(Buffer.concat(chunks));
        else reject(new Error(`Gotenberg pass2 ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
      });
    });
    req.on('error', reject);
    req.write(body2);
    req.end();
  });

  fs.writeFileSync('./Certivia_Parcours_Formations_2026.pdf', result2);
  console.log('Done! ' + (result2.length / 1024 / 1024).toFixed(1) + ' MB');
})();
