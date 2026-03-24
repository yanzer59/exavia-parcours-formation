const puppeteer = require('puppeteer');
const fs = require('fs');

// Load data
const dataContent = fs.readFileSync('./data.js', 'utf-8');
eval(dataContent.replace(/^const /gm, 'var '));

const catalogueByRncp = {};
CATALOGUE.forEach(f => { catalogueByRncp[f.rncp] = f; });

const niveauLabel = { 3: 'CAP/BEP (Niveau 3)', 4: 'BAC (Niveau 4)', 5: 'BAC+2 (Niveau 5)', 6: 'BAC+3 (Niveau 6)' };
const niveauBadgeColor = { 3: '#10b981', 4: '#3b82f6', 5: '#8b5cf6', 6: '#f59e0b' };

function generateHTML() {
  let formationIndex = 0;

  const filieresHTML = FILIERES.map((filiere, fi) => {
    const formationsHTML = filiere.formations.map((f) => {
      formationIndex++;
      const cat = catalogueByRncp[f.rncp];
      const objectifs = cat ? cat.objectifs : '';
      const duree = cat ? cat.duree : '441h';
      const domaine = cat ? cat.domaine : '';
      const programme = cat && cat.programme ? cat.programme : [];

      const programmeHTML = programme.length > 0 && programme[0].competences && programme[0].competences.length > 0
        ? `<div class="programme">
            ${programme.map(bloc => `
              <div class="bloc">
                <div class="bloc-title">${bloc.bloc}</div>
                ${bloc.competences.length > 0 ? `<ul>${bloc.competences.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
              </div>
            `).join('')}
          </div>`
        : '';

      return `
        <div class="formation-card">
          <div class="formation-header">
            <div class="formation-number">${String(formationIndex).padStart(3, '0')}</div>
            <div class="formation-info">
              <h3>${f.titre}</h3>
              <div class="formation-meta">
                <span class="badge rncp">${f.rncp}</span>
                <span class="badge niveau" style="background:${niveauBadgeColor[f.niveau]}">${niveauLabel[f.niveau]}</span>
                <span class="badge duree">${duree}</span>
                ${domaine ? `<span class="badge domaine">${domaine}</span>` : ''}
              </div>
            </div>
          </div>
          ${objectifs ? `<p class="objectifs">${objectifs}</p>` : ''}
          ${programmeHTML}
        </div>`;
    }).join('');

    // NO page-break: let content flow naturally
    return `
      <div class="filiere-section" id="filiere-${filiere.id}">
        <div class="filiere-header" style="border-left: 5px solid ${filiere.color}">
          <span class="filiere-icon">${filiere.icon}</span>
          <div>
            <h2>${filiere.nom}</h2>
            <span class="filiere-count">${filiere.formations.length} formation${filiere.formations.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        ${formationsHTML}
      </div>`;
  }).join('');

  const allFormations = FILIERES.flatMap(f => f.formations);
  const niv3 = allFormations.filter(f => f.niveau === 3).length;
  const niv4 = allFormations.filter(f => f.niveau === 4).length;
  const niv5 = allFormations.filter(f => f.niveau === 5).length;
  const niv6 = allFormations.filter(f => f.niveau === 6).length;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; line-height: 1.5; font-size: 10px; }
  .page-break { page-break-before: always; }
  a { color: inherit; text-decoration: none; }

  /* Cover */
  .cover {
    height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
    color: white; text-align: center; position: relative;
  }
  .cover-logo { font-size: 72px; font-weight: 900; letter-spacing: -2px; margin-bottom: 8px; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .cover-subtitle { font-size: 28px; font-weight: 300; color: #94a3b8; margin-bottom: 40px; letter-spacing: 4px; text-transform: uppercase; }
  .cover-title { font-size: 42px; font-weight: 800; margin-bottom: 12px; }
  .cover-desc { font-size: 16px; color: #cbd5e1; max-width: 500px; margin-bottom: 50px; }
  .cover-stats { display: flex; gap: 40px; }
  .cover-stat { text-align: center; }
  .cover-stat-value { font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .cover-stat-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
  .cover-footer { position: absolute; bottom: 30px; font-size: 10px; color: #475569; }

  /* TOC */
  .toc { padding: 50px 50px; }
  .toc h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; color: #0f172a; }
  .toc h1::after { content: ''; display: block; width: 60px; height: 3px; background: #3b82f6; margin-top: 10px; margin-bottom: 16px; }
  .toc-subtitle { font-size: 11px; color: #64748b; margin-bottom: 20px; }
  .toc-list { list-style: none; }
  .toc-entry { display: flex; align-items: center; gap: 8px; padding: 6px 4px; border-bottom: 1px solid #f1f5f9; }
  .toc-entry:hover { background: #f8fafc; }
  .toc-link { display: flex; align-items: center; gap: 8px; flex: 1; text-decoration: none; color: inherit; }
  .toc-num { font-size: 9px; font-weight: 700; color: #94a3b8; min-width: 20px; }
  .toc-icon { font-size: 14px; min-width: 20px; text-align: center; }
  .toc-name { font-size: 11px; font-weight: 600; color: #1e293b; }
  .toc-dots { flex: 1; border-bottom: 1px dotted #cbd5e1; min-width: 20px; margin: 0 4px; }
  .toc-count { font-size: 9px; font-weight: 700; color: white; background: #3b82f6; border-radius: 10px; padding: 2px 7px; white-space: nowrap; }

  /* Stats inline */
  .stats-row { display: flex; gap: 12px; margin: 20px 50px 10px; }
  .stat-card { flex: 1; background: linear-gradient(135deg, #f0f9ff, #eff6ff); border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px; text-align: center; }
  .stat-card .value { font-size: 28px; font-weight: 800; color: #1e40af; }
  .stat-card .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }

  /* Filiere sections - NO page break, continuous flow */
  .filiere-section { padding: 16px 50px 8px; }
  .filiere-header {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px;
    page-break-after: avoid;
  }
  .filiere-icon { font-size: 26px; }
  .filiere-header h2 { font-size: 16px; font-weight: 800; color: #0f172a; }
  .filiere-count { font-size: 10px; color: #64748b; }

  /* Formation cards - compact */
  .formation-card {
    border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 8px; background: white;
    page-break-inside: avoid;
  }
  .formation-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 4px; }
  .formation-number { font-size: 9px; font-weight: 700; color: #94a3b8; background: #f1f5f9; border-radius: 5px; padding: 3px 6px; min-width: 32px; text-align: center; }
  .formation-info h3 { font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .formation-meta { display: flex; flex-wrap: wrap; gap: 4px; }
  .badge { font-size: 8px; font-weight: 600; padding: 2px 6px; border-radius: 5px; display: inline-block; }
  .badge.rncp { background: #dbeafe; color: #1e40af; }
  .badge.niveau { color: white; }
  .badge.duree { background: #fef3c7; color: #92400e; }
  .badge.domaine { background: #f0fdf4; color: #166534; }
  .objectifs { font-size: 9px; color: #475569; line-height: 1.4; padding: 6px 10px; background: #fafbfc; border-radius: 5px; border-left: 3px solid #e2e8f0; margin-bottom: 4px; }
  .programme { margin-top: 4px; }
  .bloc { margin-bottom: 4px; }
  .bloc-title { font-size: 9px; font-weight: 700; color: #334155; margin-bottom: 1px; }
  .bloc ul { margin-left: 14px; font-size: 8.5px; color: #64748b; }
  .bloc li { margin-bottom: 0; }

  @page { margin: 0; size: A4; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-logo">CERTIVIA</div>
  <div class="cover-subtitle">Formation Professionnelle</div>
  <div class="cover-title">Catalogue des Formations</div>
  <div class="cover-desc">L'ensemble de nos titres professionnels certifies RNCP, organises par filiere metier pour construire votre avenir.</div>
  <div class="cover-stats">
    <div class="cover-stat"><div class="cover-stat-value">231</div><div class="cover-stat-label">Formations</div></div>
    <div class="cover-stat"><div class="cover-stat-value">${FILIERES.length}</div><div class="cover-stat-label">Filieres</div></div>
    <div class="cover-stat"><div class="cover-stat-value">4</div><div class="cover-stat-label">Niveaux</div></div>
  </div>
  <div class="cover-footer">Edition Mars 2026 - Tous droits reserves Certivia</div>
</div>

<!-- TOC + STATS on same page -->
<div class="toc page-break">
  <h1>Sommaire</h1>
  <p class="toc-subtitle">37 filieres metiers &bull; 231 formations &bull; 4 niveaux de qualification</p>
  <ul class="toc-list">
    ${FILIERES.map((f, i) => `
      <li class="toc-entry">
        <a href="#filiere-${f.id}" class="toc-link">
          <span class="toc-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="toc-icon">${f.icon}</span>
          <span class="toc-name">${f.nom}</span>
          <span class="toc-dots"></span>
          <span class="toc-count">${f.formations.length} form.</span>
        </a>
      </li>
    `).join('')}
  </ul>
</div>

<!-- STATS ROW -->
<div class="stats-row">
  <div class="stat-card"><div class="value">${niv3}</div><div class="label">Niveau 3 - CAP/BEP</div></div>
  <div class="stat-card"><div class="value">${niv4}</div><div class="label">Niveau 4 - BAC</div></div>
  <div class="stat-card"><div class="value">${niv5}</div><div class="label">Niveau 5 - BAC+2</div></div>
  <div class="stat-card"><div class="value">${niv6}</div><div class="label">Niveau 6 - BAC+3</div></div>
</div>

<!-- FORMATIONS - continuous flow -->
${filieresHTML}

</body>
</html>`;
}

(async () => {
  console.log('Generating HTML...');
  const html = generateHTML();
  fs.writeFileSync('./catalogue-preview.html', html);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('Generating PDF...');
  await page.pdf({
    path: './Certivia_Catalogue_Formations_2026.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '0', bottom: '40px', left: '0' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%;font-size:8px;color:#94a3b8;font-family:sans-serif;padding:0 50px;display:flex;justify-content:space-between;"><span>CERTIVIA - Catalogue des Formations 2026</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });

  await browser.close();
  console.log('Done! Certivia_Catalogue_Formations_2026.pdf');
})();
