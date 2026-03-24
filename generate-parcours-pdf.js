const puppeteer = require('puppeteer');
const fs = require('fs');

// Load data
const dataContent = fs.readFileSync('./data.js', 'utf-8');
eval(dataContent.replace(/^const /gm, 'var '));

const niveauLabel = {
  3: 'Niveau 3 - CAP/BEP',
  4: 'Niveau 4 - BAC',
  5: 'Niveau 5 - BAC+2',
  6: 'Niveau 6 - BAC+3'
};

const niveauShort = { 3: 'Niv.3', 4: 'Niv.4', 5: 'Niv.5', 6: 'Niv.6' };
const niveauColor = { 3: '#10b981', 4: '#3b82f6', 5: '#8b5cf6', 6: '#f59e0b' };

// Debouches metiers par filiere
const debouches = {
  "maconnerie-gros-oeuvre": {
    metiers: ["Macon", "Coffreur bancheur", "Tailleur de pierre", "Couvreur", "Chef d'equipe gros oeuvre", "Chef de chantier", "Conducteur de travaux BTP"],
    secteurs: ["BTP", "Genie civil", "Renovation du patrimoine"],
    salaire: "1 800 - 3 500 EUR/mois selon niveau et experience"
  },
  "second-oeuvre-finitions": {
    metiers: ["Plaquiste", "Peintre en batiment", "Carreleur", "Solier moquettiste", "Peintre decorateur", "Chef d'equipe finitions", "Conducteur de travaux amenagement"],
    secteurs: ["Amenagement interieur", "Renovation", "Construction neuve"],
    salaire: "1 800 - 3 200 EUR/mois"
  },
  "charpente-menuiserie-metallerie": {
    metiers: ["Charpentier bois", "Menuisier agenceur", "Menuisier fabricant", "Metallier", "Ferronnier d'art", "Dessinateur projeteur metallerie"],
    secteurs: ["Construction bois", "Menuiserie industrielle", "Metallerie/Serrurerie", "Aeronautique"],
    salaire: "1 800 - 3 400 EUR/mois"
  },
  "travaux-publics-vrd": {
    metiers: ["Canalisateur", "Macon VRD", "Conducteur d'engins", "Grutier", "Scaphandrier", "Chef de chantier TP"],
    secteurs: ["Travaux publics", "Voirie", "Reseaux", "Genie civil"],
    salaire: "1 900 - 3 500 EUR/mois"
  },
  "etudes-conception-batiment": {
    metiers: ["Metreur", "Technicien d'etudes batiment", "BIM modeleur", "Dessinateur projeteur", "Economiste de la construction", "Geometre topographe", "Charge d'affaires BTP", "Coordinateur BIM"],
    secteurs: ["Bureaux d'etudes", "Cabinets d'architecture", "Maitrise d'oeuvre", "Promoteurs"],
    salaire: "2 000 - 4 500 EUR/mois"
  },
  "electricite-batiment-connecte": {
    metiers: ["Electricien d'equipement", "Monteur reseaux electriques", "Agent de maintenance batiments", "Technicien electricien", "Technicien batiment connecte", "Domoticien"],
    secteurs: ["Installation electrique", "Domotique", "Smart building", "Energies renouvelables"],
    salaire: "1 800 - 3 200 EUR/mois"
  },
  "genie-climatique-thermique": {
    metiers: ["Installateur thermique", "Frigoriste", "Climaticien", "Agent de maintenance CVC", "Technicien en froid", "Technicien chauffage/ENR", "Charge d'etudes CVC"],
    secteurs: ["Chauffage", "Climatisation", "Froid industriel", "Energies renouvelables", "Maintenance immobiliere"],
    salaire: "1 900 - 3 800 EUR/mois"
  },
  "chaudronnerie-soudure": {
    metiers: ["Chaudronnier", "Soudeur industriel", "Tuyauteur", "Calorifugeur", "Technicien chaudronnerie", "Dessinateur projeteur tuyauterie", "Soudeur robotise"],
    secteurs: ["Industrie petroliere", "Nucleaire", "Aeronautique", "Navale", "Agroalimentaire"],
    salaire: "2 000 - 3 800 EUR/mois"
  },
  "usinage-mecanique": {
    metiers: ["Fraiseur", "Tourneur", "Usineur CN", "Ajusteur aeronautique", "Regleur machines-outils", "Technicien d'etudes mecanique", "Concepteur industriel"],
    secteurs: ["Aeronautique", "Automobile", "Mecanique de precision", "Defense", "Spatial"],
    salaire: "1 900 - 3 800 EUR/mois"
  },
  "production-industrielle": {
    metiers: ["Agent de fabrication", "Conducteur de ligne", "Conducteur equipements agroalimentaires", "Monteur industriel", "Technicien de production", "Responsable production"],
    secteurs: ["Industrie agroalimentaire", "Plasturgie", "Assemblage", "Production industrielle"],
    salaire: "1 800 - 3 500 EUR/mois"
  },
  "chimie-laboratoire": {
    metiers: ["Conducteur d'appareils chimie", "Technicien de fabrication chimie", "Technicien de laboratoire", "Physicien chimiste"],
    secteurs: ["Industrie chimique", "Pharmaceutique", "Cosmetique", "Agroalimentaire", "R&D"],
    salaire: "2 000 - 3 600 EUR/mois"
  },
  "materiaux-composites": {
    metiers: ["Stratifieur composites", "Operateur composites hautes performances", "Constructeur nautique", "Technicien composites"],
    secteurs: ["Aeronautique", "Nautisme", "Automobile", "Sport", "Energie eolienne"],
    salaire: "1 900 - 3 400 EUR/mois"
  },
  "controle-qualite": {
    metiers: ["Technicien controle metrologie", "Inspecteur CND", "Inspecteur qualite aeronautique", "Technicien fabrication additive"],
    secteurs: ["Aeronautique/Spatial", "Nucleaire", "Automobile", "Impression 3D industrielle"],
    salaire: "2 200 - 4 000 EUR/mois"
  },
  "maintenance-electronique": {
    metiers: ["Electromecanicien", "Cableur electronique", "Monteur cableur aeronautique", "Technicien SAV", "Technicien maintenance industrielle", "Electronicien", "Automaticien"],
    secteurs: ["Maintenance industrielle", "Electronique", "Aeronautique", "Automatisme"],
    salaire: "2 000 - 3 800 EUR/mois"
  },
  "mecanique-automobile": {
    metiers: ["Mecanicien automobile", "Mecanicien maintenance auto", "Mecanicien moto", "Technicien electromecanicien auto", "Controleur technique"],
    secteurs: ["Concessions automobiles", "Garages independants", "Centres auto", "Controle technique"],
    salaire: "1 800 - 3 200 EUR/mois"
  },
  "vehicules-engins": {
    metiers: ["Mecanicien vehicules industriels", "Mecanicien materiels agricoles", "Mecanicien espaces verts", "Mecanicien engins chantier", "Technicien maintenance engins"],
    secteurs: ["TP et chantier", "Agriculture", "Espaces verts", "Manutention"],
    salaire: "1 900 - 3 300 EUR/mois"
  },
  "gastronomie-arts-culinaires": {
    metiers: ["Commis de cuisine", "Cuisinier", "Chef de partie", "Patissier", "Chef de cuisine"],
    secteurs: ["Restauration gastronomique", "Hotels", "Traiteurs", "Restauration d'entreprise"],
    salaire: "1 800 - 3 500 EUR/mois"
  },
  "restauration-collective": {
    metiers: ["Cuisinier collectivite", "Serveur", "Responsable de salle", "Chef gerant collectivite"],
    secteurs: ["Cantines scolaires", "Hopitaux", "EHPAD", "Restaurants d'entreprise"],
    salaire: "1 700 - 2 800 EUR/mois"
  },
  "restauration-rapide": {
    metiers: ["Employe polyvalent restauration", "Equipier", "Responsable d'equipe restauration rapide"],
    secteurs: ["Fast-food", "Restauration rapide", "Cafeterias", "Boulangeries"],
    salaire: "1 700 - 2 200 EUR/mois"
  },
  "hotellerie-hebergement": {
    metiers: ["Femme/Valet de chambre", "Gouvernant(e)", "Receptionniste", "Chef de reception", "Directeur d'hebergement"],
    secteurs: ["Hotels", "Residences de tourisme", "Campings", "Villages vacances"],
    salaire: "1 800 - 3 000 EUR/mois"
  },
  "tourisme-loisirs": {
    metiers: ["Charge d'accueil touristique", "Guide accompagnateur", "Animateur de loisirs", "Conseiller voyages", "Responsable projets touristiques"],
    secteurs: ["Offices de tourisme", "Agences de voyage", "Tour-operateurs", "Parcs de loisirs"],
    salaire: "1 800 - 3 200 EUR/mois"
  },
  "vente-magasin": {
    metiers: ["Employe commercial", "Vendeur sport", "Conseiller de vente", "Manager de rayon", "Responsable de magasin"],
    secteurs: ["Grande distribution", "Commerce specialise", "Retail", "E-commerce"],
    salaire: "1 700 - 3 200 EUR/mois"
  },
  "commerce-negociation": {
    metiers: ["Conseiller commercial", "Commercial terrain", "Negociateur technico-commercial", "Assistant commercial", "Responsable commercial"],
    secteurs: ["B2B", "B2C", "Industrie", "Services", "Tech"],
    salaire: "1 900 - 4 000 EUR/mois + variable"
  },
  "developpement-web": {
    metiers: ["Agent reconditionnement numerique", "Developpeur web front-end", "Developpeur web back-end", "Developpeur fullstack", "Concepteur d'applications", "Lead developer"],
    secteurs: ["ESN", "Start-ups", "Grands groupes", "Agences web", "Freelance"],
    salaire: "2 200 - 4 500 EUR/mois"
  },
  "systemes-reseaux-cyber": {
    metiers: ["Technicien informatique", "Technicien reseaux", "Administrateur systemes et reseaux", "Administrateur DevOps/NetOps", "Ingenieur cybersecurite"],
    secteurs: ["ESN", "DSI entreprises", "Hebergeurs", "Operateurs telecom", "Securite IT"],
    salaire: "2 200 - 5 000 EUR/mois"
  },
  "design-creation-multimedia": {
    metiers: ["Graphiste", "Monteur audiovisuel", "Mediateur numerique", "Designer UI/UX", "Directeur artistique digital"],
    secteurs: ["Agences de communication", "Studios", "Presse/Media", "E-commerce", "Freelance"],
    salaire: "2 000 - 4 000 EUR/mois"
  },
  "telecom-fibre": {
    metiers: ["Installateur fibre optique", "Technicien fibre FTTH", "Charge d'etudes telecom", "Chef d'equipe fibre"],
    secteurs: ["Operateurs telecom", "Sous-traitants fibre", "Collectivites", "Data centers"],
    salaire: "1 800 - 3 500 EUR/mois"
  },
  "transport-conduite": {
    metiers: ["Conducteur PL/SPL", "Conducteur de bus", "Conducteur interurbain", "Exploitant transport", "Gestionnaire operations transport", "Organisateur transport international"],
    secteurs: ["Transport routier", "Logistique", "Transport voyageurs", "Maritime/Aerien"],
    salaire: "1 900 - 3 500 EUR/mois"
  },
  "logistique-entreposage": {
    metiers: ["Agent magasinier", "Cariste", "Preparateur de commandes", "Technicien logistique", "Responsable d'entrepot", "Supply chain manager"],
    secteurs: ["E-commerce", "Grande distribution", "Industrie", "Logistique 3PL"],
    salaire: "1 800 - 3 500 EUR/mois"
  },
  "comptabilite-gestion": {
    metiers: ["Comptable assistant", "Secretaire comptable", "Gestionnaire comptable et fiscal", "Gestionnaire de paie", "Assistant immobilier", "Assistant import-export", "Responsable de structure"],
    secteurs: ["Cabinets comptables", "PME/TPE", "Immobilier", "Import-export", "Toute entreprise"],
    salaire: "2 000 - 4 000 EUR/mois"
  },
  "secretariat-assistance": {
    metiers: ["Secretaire assistant(e)", "Secretaire medical(e)", "Assistant(e) de direction", "Office manager"],
    secteurs: ["Toute entreprise", "Sante", "Juridique", "Administration"],
    salaire: "1 800 - 3 200 EUR/mois"
  },
  "sante-medico-social": {
    metiers: ["Aide a domicile", "Accompagnant educatif et social", "Auxiliaire prothese dentaire", "Agent technique orthesiste", "Agent de proprete", "Opticien vendeur", "Technicien aide personne"],
    secteurs: ["EHPAD", "Domicile", "Hopitaux", "Laboratoires dentaires", "Magasins optique"],
    salaire: "1 700 - 3 000 EUR/mois"
  },
  "mediation-relation-client": {
    metiers: ["Agent de mediation", "Teleconseiller", "Mediateur social", "Manager relation client", "Responsable centre d'appels"],
    secteurs: ["Services publics", "Centres d'appels", "Collectivites", "Associations", "Telecoms"],
    salaire: "1 800 - 3 200 EUR/mois"
  },
  "formation-insertion": {
    metiers: ["Encadrant technique d'insertion", "Formateur professionnel", "Conseiller en insertion professionnelle", "Coordinateur pedagogique"],
    secteurs: ["Organismes de formation", "Missions locales", "Associations", "CFA", "Pole emploi"],
    salaire: "2 000 - 3 500 EUR/mois"
  },
  "environnement-energie": {
    metiers: ["Agent valorisation dechets", "Operateur amiante", "Demineur pyrotechnique", "Technicien batteries", "Paysagiste", "Horticulteur", "Technicien traitement eaux", "Charge d'etudes thermiques/ENR"],
    secteurs: ["Environnement", "Recyclage", "Depollution", "Paysage", "Energie renouvelable"],
    salaire: "1 800 - 3 800 EUR/mois"
  },
  "securite-surveillance": {
    metiers: ["Agent de securite", "Operateur videoprotection", "Operateur telesurveillance", "Technicien securite incendie", "Chef d'equipe securite"],
    secteurs: ["Societes de securite privee", "Grande distribution", "Evenementiel", "Sites sensibles"],
    salaire: "1 800 - 2 800 EUR/mois"
  },
  "artisanat-mode-metiers-art": {
    metiers: ["Tapissier", "Garnisseur", "Maroquinier", "Couturier mode/luxe", "Sellier", "Horloger", "Cordonnier", "Couturier retoucheur"],
    secteurs: ["Maisons de luxe", "Ateliers artisanaux", "Haute couture", "Restauration mobilier", "Horlogerie"],
    salaire: "1 800 - 3 500 EUR/mois"
  }
};

function generateHTML() {
  const parcoursSections = FILIERES.map((filiere, fi) => {
    const d = debouches[filiere.id] || { metiers: [], secteurs: [], salaire: '' };

    // Group formations by level
    const byLevel = {};
    filiere.formations.forEach(f => {
      if (!byLevel[f.niveau]) byLevel[f.niveau] = [];
      byLevel[f.niveau].push(f);
    });
    const levels = Object.keys(byLevel).sort((a, b) => a - b);

    // Build progression arrows
    const progressionHTML = levels.map((lvl, i) => {
      const formations = byLevel[lvl];
      return `
        <div class="level-block">
          <div class="level-badge" style="background:${niveauColor[lvl]}">${niveauShort[lvl]}</div>
          <div class="level-content">
            <div class="level-title">${niveauLabel[lvl]}</div>
            <div class="level-formations">
              ${formations.map(f => `
                <div class="level-formation">
                  <span class="dot" style="background:${niveauColor[lvl]}"></span>
                  <span>${f.titre}</span>
                  <span class="rncp-small">${f.rncp}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        ${i < levels.length - 1 ? '<div class="arrow-down"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' : ''}
      `;
    }).join('');

    return `
      <div class="parcours-section" id="parcours-${filiere.id}">
        <div class="parcours-header" style="background: linear-gradient(135deg, ${filiere.color}15, ${filiere.color}08); border-left: 5px solid ${filiere.color}">
          <div class="parcours-header-top">
            <span class="parcours-icon">${filiere.icon}</span>
            <div>
              <h2>${filiere.nom}</h2>
              <span class="parcours-count">${filiere.formations.length} formations - ${levels.length} niveaux de qualification</span>
            </div>
          </div>
        </div>

        <div class="parcours-body">
          <div class="progression-col">
            <h3 class="section-title">Parcours de progression</h3>
            ${progressionHTML}
          </div>

          <div class="debouches-col">
            <h3 class="section-title">Debouches professionnels</h3>

            <div class="debouche-block">
              <div class="debouche-label">Metiers accessibles</div>
              <div class="metiers-grid">
                ${d.metiers.map(m => `<span class="metier-tag">${m}</span>`).join('')}
              </div>
            </div>

            <div class="debouche-block">
              <div class="debouche-label">Secteurs d'activite</div>
              <div class="secteurs-list">
                ${d.secteurs.map(s => `<span class="secteur-tag">${s}</span>`).join('')}
              </div>
            </div>

            <div class="debouche-block salaire-block">
              <div class="debouche-label">Remuneration indicative</div>
              <div class="salaire">${d.salaire}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const totalFormations = FILIERES.reduce((acc, f) => acc + f.formations.length, 0);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 10px;
  }
  .page-break { page-break-before: always; }
  a { color: inherit; text-decoration: none; }

  /* Cover */
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #0c1222 0%, #1a1a4e 40%, #2d1b69 70%, #0c1222 100%);
    color: white;
    text-align: center;
    position: relative;
  }
  .cover-logo {
    font-size: 72px;
    font-weight: 900;
    letter-spacing: -2px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cover-subtitle {
    font-size: 14px;
    color: #94a3b8;
    margin-bottom: 40px;
    letter-spacing: 6px;
    text-transform: uppercase;
  }
  .cover-title {
    font-size: 40px;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: -1px;
  }
  .cover-tagline {
    font-size: 20px;
    font-weight: 300;
    color: #c4b5fd;
    margin-bottom: 12px;
  }
  .cover-desc {
    font-size: 14px;
    color: #a5b4c8;
    max-width: 520px;
    margin-bottom: 50px;
    line-height: 1.7;
  }
  .cover-stats {
    display: flex;
    gap: 50px;
  }
  .cover-stat-value {
    font-size: 44px;
    font-weight: 800;
    background: linear-gradient(135deg, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cover-stat-label {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .cover-footer {
    position: absolute;
    bottom: 30px;
    font-size: 10px;
    color: #475569;
  }

  /* TOC */
  .toc {
    padding: 50px 50px;
  }
  .toc h1 {
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 6px;
    color: #0f172a;
  }
  .toc h1::after {
    content: '';
    display: block;
    width: 60px;
    height: 3px;
    background: #8b5cf6;
    margin-top: 10px;
    margin-bottom: 20px;
  }
  .toc-subtitle {
    font-size: 11px;
    color: #64748b;
    margin-bottom: 24px;
  }
  .toc-list {
    list-style: none;
  }
  .toc-entry {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    border-bottom: 1px solid #f5f3ff;
  }
  .toc-entry:hover { background: #faf5ff; }
  .toc-link { display: flex; align-items: center; gap: 8px; flex: 1; text-decoration: none; color: inherit; }
  .toc-num {
    font-size: 9px;
    font-weight: 700;
    color: #a78bfa;
    min-width: 20px;
  }
  .toc-icon { font-size: 14px; min-width: 20px; text-align: center; }
  .toc-name { font-size: 10.5px; font-weight: 600; color: #1e293b; }
  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #c4b5fd;
    min-width: 20px;
    height: 0;
    align-self: center;
  }
  .toc-count {
    font-size: 9px;
    font-weight: 700;
    color: white;
    background: #8b5cf6;
    border-radius: 10px;
    padding: 2px 7px;
    white-space: nowrap;
  }
  .toc-page {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    min-width: 16px;
    text-align: right;
  }

  /* Parcours sections - compact, continuous flow */
  .parcours-section {
    padding: 12px 40px 8px;
    page-break-inside: avoid;
  }
  .parcours-header {
    padding: 12px 14px;
    border-radius: 8px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }
  .parcours-header-top {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .parcours-icon { font-size: 24px; }
  .parcours-header h2 {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
  }
  .parcours-count { font-size: 10px; color: #64748b; }

  .parcours-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .section-title {
    font-size: 10px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Progression */
  .progression-col {
    padding: 10px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
  }
  .level-block {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    page-break-inside: avoid;
  }
  .level-badge {
    font-size: 8px;
    font-weight: 800;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    white-space: nowrap;
    margin-top: 2px;
  }
  .level-content { flex: 1; }
  .level-title {
    font-size: 9px;
    font-weight: 700;
    color: #475569;
    margin-bottom: 4px;
  }
  .level-formations { margin-bottom: 4px; }
  .level-formation {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 9px;
    padding: 3px 0;
    color: #1e293b;
  }
  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .rncp-small {
    font-size: 7.5px;
    color: #94a3b8;
    margin-left: auto;
  }
  .arrow-down {
    display: flex;
    justify-content: center;
    padding: 2px 0;
  }

  /* Debouches */
  .debouches-col {
    padding: 10px;
  }
  .debouche-block {
    margin-bottom: 10px;
  }
  .debouche-label {
    font-size: 9.5px;
    font-weight: 700;
    color: #475569;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .metiers-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .metier-tag {
    font-size: 8.5px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    background: linear-gradient(135deg, #ede9fe, #f5f3ff);
    color: #5b21b6;
    border: 1px solid #ddd6fe;
  }
  .secteurs-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .secteur-tag {
    font-size: 8.5px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 6px;
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
  .salaire-block {
    background: linear-gradient(135deg, #fefce8, #fef9c3);
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 10px 12px;
  }
  .salaire {
    font-size: 11px;
    font-weight: 700;
    color: #92400e;
  }

  @page { margin: 0; size: A4; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-logo">CERTIVIA</div>
  <div class="cover-subtitle">Formation Professionnelle</div>
  <div class="cover-title">Parcours de Formation</div>
  <div class="cover-tagline">& Debouches Metiers</div>
  <div class="cover-desc">
    Decouvrez nos ${FILIERES.length} filieres metiers et construisez votre parcours
    professionnel du niveau CAP au BAC+3.
    Chaque parcours detaille les formations, la progression
    et les metiers accessibles.
  </div>
  <div class="cover-stats">
    <div style="text-align:center">
      <div class="cover-stat-value">${FILIERES.length}</div>
      <div class="cover-stat-label">Parcours</div>
    </div>
    <div style="text-align:center">
      <div class="cover-stat-value">231</div>
      <div class="cover-stat-label">Formations</div>
    </div>
    <div style="text-align:center">
      <div class="cover-stat-value">250+</div>
      <div class="cover-stat-label">Metiers</div>
    </div>
  </div>
  <div class="cover-footer">Edition Mars 2026 - Certivia</div>
</div>

<!-- TOC -->
<div class="toc page-break">
  <h1>Sommaire</h1>
  <p class="toc-subtitle">37 parcours metiers &bull; 231 formations &bull; 250+ debouches metiers</p>
  <ul class="toc-list">
    ${FILIERES.map((f, i) => `
      <li class="toc-entry">
        <a href="#parcours-${f.id}" class="toc-link">
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

<!-- PARCOURS SECTIONS -->
${parcoursSections}

</body>
</html>`;
}

(async () => {
  console.log('Generating Parcours HTML...');
  const html = generateHTML();
  fs.writeFileSync('./parcours-preview.html', html);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  console.log('Generating PDF...');
  await page.pdf({
    path: './Certivia_Parcours_Formations_2026.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '0', bottom: '40px', left: '0' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
      <div style="width:100%;text-align:center;font-size:8px;color:#94a3b8;font-family:Inter,sans-serif;padding:0 50px;display:flex;justify-content:space-between;">
        <span>CERTIVIA - Parcours de Formation 2026</span>
        <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();
  console.log('Done! PDF saved as Certivia_Parcours_Formations_2026.pdf');
})();
