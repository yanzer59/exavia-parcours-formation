// === EXAVIA - Parcours de Formation ===

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderParcours();
    renderCatalogue();
    initSearch();
    initFilters();
    initModal();
    initKeyboard();
    initScrollObserver();
});

// === Navigation ===
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('section-parcours').classList.toggle('hidden', section !== 'parcours');
            document.getElementById('section-catalogue').classList.toggle('hidden', section !== 'catalogue');
            document.getElementById('pdf-btn-parcours').style.display = section === 'parcours' ? '' : 'none';
            document.getElementById('pdf-btn-catalogue').style.display = section === 'catalogue' ? '' : 'none';
        });
    });
}

// === Parcours rendering with horizontal swipe ===
function renderParcours(filter = {}) {
    const container = document.getElementById('parcours-container');
    container.innerHTML = '';

    const searchTerm = (filter.search || '').toLowerCase();
    const niveauFilter = filter.niveau || 'all';
    let visibleCount = 0;

    FILIERES.forEach((filiere, idx) => {
        let formations = filiere.formations;

        if (niveauFilter !== 'all') {
            formations = formations.filter(f => f.niveau === parseInt(niveauFilter));
        }
        if (searchTerm) {
            formations = formations.filter(f =>
                f.titre.toLowerCase().includes(searchTerm) ||
                f.rncp.toLowerCase().includes(searchTerm) ||
                filiere.nom.toLowerCase().includes(searchTerm)
            );
        }

        if (formations.length === 0) return;
        visibleCount++;

        // Group by niveau
        const byNiveau = {};
        formations.forEach(f => {
            if (!byNiveau[f.niveau]) byNiveau[f.niveau] = [];
            byNiveau[f.niveau].push(f);
        });

        const niveaux = Object.keys(byNiveau).sort((a, b) => a - b);
        const niveauLabels = { 3: 'CAP/BEP', 4: 'BAC', 5: 'BAC+2', 6: 'BAC+3' };
        const niveauColors = { 3: 'n3', 4: 'n4', 5: 'n5', 6: 'n6' };

        const stepsHTML = niveaux.map((n, stepIdx) => {
            const yearNum = stepIdx + 1;
            const chips = byNiveau[n].map((f, chipIdx) => `
                <div class="formation-chip" data-niveau="${n}" data-rncp="${f.rncp}"
                     onclick="openFormationModal('${f.rncp}', '${escapeAttr(f.titre)}', ${n})"
                     style="transition-delay: ${stepIdx * 0.15 + chipIdx * 0.08}s">
                    <div class="chip-title">${highlightText(f.titre, searchTerm)}</div>
                    <div class="chip-rncp">${highlightText(f.rncp, searchTerm)}</div>
                </div>
            `).join('');

            return `
                <div class="parcours-step" data-step="${stepIdx}">
                    <div class="step-marker ${niveauColors[n]}">A${yearNum}</div>
                    <div class="step-label">Niveau ${n} — ${niveauLabels[n]}</div>
                    <div class="step-formations">${chips}</div>
                    <div class="step-dot-runner" style="background:var(--${niveauColors[n]});"></div>
                </div>
            `;
        }).join('');

        const card = document.createElement('div');
        card.className = 'filiere-card open';
        card.innerHTML = `
            <div class="filiere-header" onclick="toggleFiliere(this)">
                <div class="filiere-title">
                    <div class="filiere-icon" style="background:${filiere.color}15;color:${filiere.color};">${filiere.icon}</div>
                    <div>
                        <div>${highlightText(filiere.nom, searchTerm)}</div>
                        <div class="filiere-count">${formations.length} formation${formations.length > 1 ? 's' : ''} · ${niveaux.length} niveaux</div>
                    </div>
                </div>
                <div class="filiere-toggle">▼</div>
            </div>
            <div class="filiere-body">
                <div class="parcours-track-wrapper">
                    <div class="swipe-arrow left" onclick="scrollTrack(this, -1)">‹</div>
                    <div class="parcours-track">${stepsHTML}</div>
                    <div class="swipe-arrow right" onclick="scrollTrack(this, 1)">›</div>
                </div>
                <div class="swipe-hint">
                    <span>←</span> Glissez pour explorer le parcours <span>→</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    if (visibleCount === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">Aucune formation trouvée pour cette recherche.</div>
            </div>
        `;
    }

    // Re-observe new cards
    observeCards();

    // Update stat number
    document.getElementById('stat-formations').textContent = CATALOGUE.length;
    document.getElementById('stat-filieres').textContent = FILIERES.length;

    // Render parcours sidebar
    renderParcoursSidebar(filter);
}

function renderParcoursSidebar(filter = {}) {
    const list = document.getElementById('parcours-sidebar-list');
    if (!list) return;
    const niveauFilter = filter.niveau || 'all';
    const searchTerm = (document.getElementById('parcours-search-input')?.value || '').toLowerCase();

    list.innerHTML = '';
    FILIERES.forEach((filiere, idx) => {
        let formations = filiere.formations;
        if (niveauFilter !== 'all') {
            formations = formations.filter(f => f.niveau === parseInt(niveauFilter));
        }
        // Filter sidebar by search
        const matchSearch = !searchTerm ||
            filiere.nom.toLowerCase().includes(searchTerm) ||
            formations.some(f => f.titre.toLowerCase().includes(searchTerm));
        if (formations.length === 0 || !matchSearch) return;

        const item = document.createElement('div');
        item.className = 'parcours-sidebar-item';
        item.innerHTML = `
            <span class="sidebar-icon">${filiere.icon}</span>
            <span class="sidebar-name">${filiere.nom}</span>
            <span class="sidebar-count">${formations.length}</span>
        `;
        item.addEventListener('click', () => {
            const cards = document.querySelectorAll('.filiere-card');
            // Find the matching card by index among visible ones
            let visibleIdx = 0;
            for (let i = 0; i < FILIERES.length; i++) {
                let fmts = FILIERES[i].formations;
                if (niveauFilter !== 'all') fmts = fmts.filter(f => f.niveau === parseInt(niveauFilter));
                if (fmts.length === 0) continue;
                const fSearch = !searchTerm ||
                    FILIERES[i].nom.toLowerCase().includes(searchTerm) ||
                    fmts.some(f => f.titre.toLowerCase().includes(searchTerm));
                if (!fSearch) continue;
                if (i === idx) break;
                visibleIdx++;
            }
            if (cards[visibleIdx]) {
                cards[visibleIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                cards[visibleIdx].classList.add('open');
                // Highlight briefly
                document.querySelectorAll('.parcours-sidebar-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            }
        });
        list.appendChild(item);
    });
}

function toggleFiliere(header) {
    const card = header.parentElement;
    card.classList.toggle('open');
    if (card.classList.contains('open')) {
        // Re-trigger animations
        setTimeout(() => animateCard(card), 100);
    }
}
window.toggleFiliere = toggleFiliere;

function scrollTrack(arrow, direction) {
    const wrapper = arrow.parentElement;
    const track = wrapper.querySelector('.parcours-track');
    const scrollAmount = 260;
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}
window.scrollTrack = scrollTrack;

// === Scroll observer for animations ===
let observer;
function initScrollObserver() {
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                card.classList.add('visible');
                setTimeout(() => animateCard(card), 200);
                observer.unobserve(card);
            }
        });
    }, { threshold: 0.15 });
    observeCards();
}

function observeCards() {
    document.querySelectorAll('.filiere-card:not(.visible)').forEach(card => {
        observer?.observe(card);
    });
}

function animateCard(card) {
    if (!card.classList.contains('open')) return;

    // Animate steps
    const steps = card.querySelectorAll('.parcours-step');
    steps.forEach((step, i) => {
        setTimeout(() => {
            step.classList.add('animated');
        }, i * 200);
    });

    // Slide in formation chips
    const chips = card.querySelectorAll('.formation-chip');
    chips.forEach((chip, i) => {
        setTimeout(() => {
            chip.classList.add('slide-in');
        }, 300 + i * 80);
    });
}

// === Catalogue ===
function renderCatalogue(filter = {}) {
    const sidebar = document.getElementById('catalogue-sidebar');
    const grid = document.getElementById('catalogue-grid');

    const searchTerm = (filter.search || '').toLowerCase();
    const niveauFilter = filter.niveau || 'all';
    const domaineFilter = filter.domaine || null;

    let filtered = CATALOGUE;
    if (niveauFilter !== 'all') {
        filtered = filtered.filter(f => f.niveau === parseInt(niveauFilter));
    }
    if (searchTerm) {
        filtered = filtered.filter(f =>
            f.titre.toLowerCase().includes(searchTerm) ||
            f.rncp.toLowerCase().includes(searchTerm)
        );
    }
    if (domaineFilter) {
        filtered = filtered.filter(f => f.domaine === domaineFilter);
    }

    // Sidebar
    sidebar.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const domaines = DOMAINES_BY_CATEGORIE[cat];
        const catFormations = filtered.filter(f => f.categorie === cat);
        if (catFormations.length === 0) return;

        let domaineItems = domaines.map(d => {
            const count = filtered.filter(f => f.domaine === d).length;
            if (count === 0) return '';
            const isActive = domaineFilter === d ? 'active' : '';
            return `<div class="sidebar-item ${isActive}" onclick="filterByDomaine('${escapeAttr(d)}')" title="${d}">
                <span>${d}</span>
                <span class="sidebar-item-count">${count}</span>
            </div>`;
        }).join('');

        sidebar.innerHTML += `
            <div class="sidebar-category">
                <div class="sidebar-category-title">${cat}</div>
                ${domaineItems}
            </div>
        `;
    });

    // Grid
    grid.innerHTML = '';
    document.getElementById('catalogue-count-number').textContent = filtered.length;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1;">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">Aucune formation trouvée.</div>
            </div>
        `;
        return;
    }

    filtered.forEach((f, i) => {
        const card = document.createElement('div');
        card.className = 'catalogue-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
        card.onclick = () => openFormationModal(f.rncp, f.titre, f.niveau);

        card.innerHTML = `
            <div class="catalogue-card-top">
                <span class="catalogue-card-niveau n${f.niveau}">Niveau ${f.niveau}</span>
                <span class="catalogue-card-rncp">${highlightText(f.rncp, searchTerm)}</span>
            </div>
            <div class="catalogue-card-title">${highlightText(f.titre, searchTerm)}</div>
            <div class="catalogue-card-domain">${f.domaine}</div>
            <div>
                <span class="catalogue-card-statut ${f.statut.toLowerCase()}">${f.statut}</span>
                <span class="catalogue-card-duree">${f.duree}</span>
            </div>
        `;

        grid.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, Math.min(i * 30, 600));
    });
}

let currentDomaineFilter = null;
function filterByDomaine(domaine) {
    currentDomaineFilter = currentDomaineFilter === domaine ? null : domaine;
    applyFilters();
}
window.filterByDomaine = filterByDomaine;

// === Search ===
function initSearch() {
    const catalogueInput = document.getElementById('catalogue-search-input');
    const parcoursInput = document.getElementById('parcours-search-input');
    let debounceTimer;
    if (catalogueInput) {
        catalogueInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => applyFilters(), 200);
        });
    }
    if (parcoursInput) {
        parcoursInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => applyFilters(), 200);
        });
    }
}

// === Filters ===
let currentNiveau = 'all';
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentNiveau = btn.dataset.niveau;
            applyFilters();
        });
    });
}

function applyFilters() {
    const catalogueSearch = document.getElementById('catalogue-search-input')?.value || '';
    const parcoursSearch = document.getElementById('parcours-search-input')?.value || '';
    const filter = { niveau: currentNiveau, domaine: currentDomaineFilter };
    renderParcours({ ...filter, search: parcoursSearch });
    renderCatalogue({ ...filter, search: catalogueSearch });
}

// === Modal ===
function initModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

function openFormationModal(rncp, titre, niveau) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');

    const formation = CATALOGUE_BY_RNCP[rncp];
    const nc = { 3: 'n3', 4: 'n4', 5: 'n5', 6: 'n6' }[niveau] || 'n3';
    const nl = { 3: 'CAP/BEP', 4: 'BAC', 5: 'BAC+2', 6: 'BAC+3' }[niveau];

    if (formation) {
        const programmeHTML = formation.programme.map((bloc, i) => `
            <div class="modal-bloc">
                <div class="modal-bloc-title">${i + 1}. ${bloc.bloc}</div>
                ${bloc.competences.length > 0 ? `<ul class="modal-bloc-list">${bloc.competences.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
            </div>
        `).join('');

        const relatedFilieres = FILIERES.filter(fil => fil.formations.some(f => f.rncp === rncp));
        const filieresHTML = relatedFilieres.length > 0
            ? `<div class="modal-section">
                <div class="modal-section-title">Filières de parcours</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${relatedFilieres.map(fil => `<span class="modal-badge" style="background:${fil.color}15;color:${fil.color};border:1px solid ${fil.color}30;">${fil.icon} ${fil.nom}</span>`).join('')}
                </div>
               </div>` : '';

        content.innerHTML = `
            <div class="modal-badge-row">
                <span class="modal-badge catalogue-card-niveau ${nc}">Niveau ${niveau} — ${nl}</span>
                <span class="modal-badge" style="background:#f1f5f9;color:#64748b;">${formation.statut}</span>
            </div>
            <h2 class="modal-title">${formation.titre}</h2>
            <div class="modal-meta">
                <span class="modal-meta-item">📋 ${formation.rncp}</span>
                <span class="modal-meta-item">⏱️ ${formation.duree}</span>
                <span class="modal-meta-item">📁 ${formation.domaine}</span>
            </div>
            ${filieresHTML}
            <div class="modal-section">
                <div class="modal-section-title">Objectifs & Contexte</div>
                <p class="modal-objectifs">${formation.objectifs}</p>
            </div>
            <div class="modal-section">
                <div class="modal-section-title">Programme</div>
                ${programmeHTML}
            </div>
            <a href="https://www.francecompetences.fr/recherche/rncp/${rncp.replace('RNCP', '')}/" target="_blank" class="modal-link">
                Voir sur France Compétences ↗
            </a>
        `;
    } else {
        content.innerHTML = `
            <div class="modal-badge-row">
                <span class="modal-badge catalogue-card-niveau ${nc}">Niveau ${niveau} — ${nl}</span>
            </div>
            <h2 class="modal-title">${titre}</h2>
            <div class="modal-meta"><span class="modal-meta-item">📋 ${rncp}</span></div>
            <p class="modal-objectifs" style="margin-top:16px;">Les détails de cette formation seront bientôt disponibles.</p>
            <a href="https://www.francecompetences.fr/recherche/rncp/${rncp.replace('RNCP', '')}/" target="_blank" class="modal-link" style="margin-top:24px;">
                Voir sur France Compétences ↗
            </a>
        `;
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}
window.openFormationModal = openFormationModal;

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

// === Keyboard shortcuts ===
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-input').focus();
        }
        if (e.key === 'Escape') closeModal();
    });
}

// === Utilities ===
function highlightText(text, search) {
    if (!search || search.length < 2) return text;
    const regex = new RegExp(`(${escapeRegex(search)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function escapeAttr(str) { return str.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
