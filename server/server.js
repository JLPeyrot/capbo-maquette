const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const ARTICLES_PATH = path.join(process.cwd(), 'public', 'data', 'articles_ref.json');
const PREREF_PATH = path.join(process.cwd(), 'public', 'data', 'articles-preref.json');
const ASSORTI_PATH = path.join(process.cwd(), 'public', 'data', 'article_assorti.json');
const TRONCS_PATH = path.join(process.cwd(), 'public', 'data', 'troncs.json');
const MAGASINS_PATH = path.join(process.cwd(), 'public', 'data', 'magasins.json');

function readArticles() {
  try {
    const raw = fs.readFileSync(ARTICLES_PATH, 'utf-8');
    const json = JSON.parse(raw);
    if (!json || !Array.isArray(json.articles)) {
      return { articles: [] };
    }
    return json;
  } catch (e) {
    console.error('Erreur lecture articles_ref.json:', e);
    return { articles: [] };
  }
}

function writeArticles(data) {
  try {
    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Erreur écriture articles_ref.json:', e);
    return false;
  }
}

function readPrerefArticles() {
  try {
    const raw = fs.readFileSync(PREREF_PATH, 'utf-8');
    const json = JSON.parse(raw);
    if (!json || !Array.isArray(json.articles)) {
      return { articles: [] };
    }
    return json;
  } catch (e) {
    console.error('Erreur lecture articles-preref.json:', e);
    return { articles: [] };
  }
}

function writePrerefArticles(data) {
  try {
    fs.writeFileSync(PREREF_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Erreur écriture articles-preref.json:', e);
    return false;
  }
}

function readAssortiments() {
  try {
    const raw = fs.readFileSync(ASSORTI_PATH, 'utf-8');
    const json = JSON.parse(raw);
    if (!json || !Array.isArray(json.assortiments)) {
      return { assortiments: [] };
    }
    return json;
  } catch (e) {
    console.error('Erreur lecture article_assorti.json:', e);
    return { assortiments: [] };
  }
}

function writeAssortiments(data) {
  try {
    fs.writeFileSync(ASSORTI_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Erreur écriture article_assorti.json:', e);
    return false;
  }
}

function readTroncs() {
  try {
    const raw = fs.readFileSync(TRONCS_PATH, 'utf-8');
    const json = JSON.parse(raw);
    if (!json || !Array.isArray(json.assortiments)) {
      return { assortiments: [] };
    }
    return json;
  } catch (e) {
    console.error('Erreur lecture troncs.json:', e);
    return { assortiments: [] };
  }
}

function writeTroncs(data) {
  try {
    fs.writeFileSync(TRONCS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Erreur écriture troncs.json:', e);
    return false;
  }
}

function readMagasins() {
  try {
    const raw = fs.readFileSync(MAGASINS_PATH, 'utf-8');
    const json = JSON.parse(raw);
    if (!json || !Array.isArray(json.magasins)) {
      return { magasins: [] };
    }
    return json;
  } catch (e) {
    console.error('Erreur lecture magasins.json:', e);
    return { magasins: [] };
  }
}

// Met à jour les attributs pour une liste d'articles par code
app.post('/api/articles/update-attributes', (req, res) => {
  const { articleCodes, attributes } = req.body || {};
  if (!Array.isArray(articleCodes) || !Array.isArray(attributes)) {
    return res.status(400).json({ error: 'Paramètres invalides: articleCodes et attributes doivent être des tableaux.' });
  }

  const data = readArticles();
  const codeSet = new Set(articleCodes);
  let updated = 0;
  const updatedArticles = data.articles.map(a => {
    if (codeSet.has(a.code)) {
      updated += 1;
      const current = Array.isArray(a.attributes) ? a.attributes : [];
      const union = Array.from(new Set([ ...current, ...attributes ]));
      return { ...a, attributes: union };
    }
    return a;
  });

  const newData = { articles: updatedArticles };
  const ok = writeArticles(newData);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated, articles: updatedArticles });
});

// Supprime une liste d'attributs des articles sélectionnés (différence d'ensemble)
app.post('/api/articles/remove-attributes', (req, res) => {
  const { articleCodes, attributesToRemove } = req.body || {};
  if (!Array.isArray(articleCodes) || !Array.isArray(attributesToRemove)) {
    return res.status(400).json({ error: 'Paramètres invalides: articleCodes et attributesToRemove doivent être des tableaux.' });
  }

  const data = readArticles();
  const codeSet = new Set(articleCodes);
  const removeSet = new Set(attributesToRemove);
  let updated = 0;

  const updatedArticles = data.articles.map(a => {
    if (codeSet.has(a.code)) {
      updated += 1;
      const current = Array.isArray(a.attributes) ? a.attributes : [];
      const filtered = current.filter(code => !removeSet.has(code));
      const copy = { ...a };
      if (filtered.length > 0) {
        copy.attributes = filtered;
      } else {
        // Retirer complètement la clé attributes quand elle est vide
        delete copy.attributes;
      }
      return copy;
    }
    return a;
  });

  const newData = { articles: updatedArticles };
  const ok = writeArticles(newData);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated, articles: updatedArticles });
});

// Met à jour le niveau (number) pour une liste d'articles par code
app.post('/api/articles/update-level', (req, res) => {
  const { articleCodes, level } = req.body || {};
  if (!Array.isArray(articleCodes)) {
    return res.status(400).json({ error: 'Paramètres invalides: articleCodes doit être un tableau.' });
  }
  const parsedLevel = Number(level);
  if (!Number.isFinite(parsedLevel) || parsedLevel < 1) {
    return res.status(400).json({ error: 'Paramètre invalide: level doit être un entier >= 1.' });
  }

  const data = readArticles();
  const codeSet = new Set(articleCodes);
  let updated = 0;
  const updatedArticles = data.articles.map(a => {
    if (codeSet.has(a.code)) {
      updated += 1;
      // Mettre à jour trunk_level (et level à l'identique pour cohérence)
      return { ...a, trunk_level: parsedLevel, level: parsedLevel };
    }
    return a;
  });

  const ok = writeArticles({ articles: updatedArticles });
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated, articles: updatedArticles });
});

// Supprime tous les attributs des articles sélectionnés (retire la clé attributes)
app.post('/api/articles/remove-all-attributes', (req, res) => {
  const { articleCodes } = req.body || {};
  if (!Array.isArray(articleCodes)) {
    return res.status(400).json({ error: 'Paramètres invalides: articleCodes doit être un tableau.' });
  }

  const data = readArticles();
  const codeSet = new Set(articleCodes);
  let updated = 0;

  const updatedArticles = data.articles.map(a => {
    if (codeSet.has(a.code)) {
      updated += 1;
      const copy = { ...a };
      delete copy.attributes;
      return copy;
    }
    return a;
  });

  const newData = { articles: updatedArticles };
  const ok = writeArticles(newData);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated, articles: updatedArticles });
});

// Assigne un tronc unique à une liste d'articles (écrit la clé trunk_id)
app.post('/api/articles/assign-trunk', (req, res) => {
  const { articleCodes, trunkId } = req.body || {};
  if (!Array.isArray(articleCodes) || typeof trunkId !== 'string' || !trunkId.trim()) {
    return res.status(400).json({ error: 'Paramètres invalides: articleCodes doit être un tableau et trunkId une chaîne non vide.' });
  }

  const data = readArticles();
  const codeSet = new Set(articleCodes);
  let updated = 0;

  const updatedArticles = data.articles.map(a => {
    if (codeSet.has(a.code)) {
      updated += 1;
      // Un seul tronc autorisé: trunk_id est une chaîne unique
      return { ...a, trunk_id: trunkId };
    }
    return a;
  });

  const newData = { articles: updatedArticles };
  const ok = writeArticles(newData);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated, articles: updatedArticles });
});

// Met à jour la typologie de déploiment pour une liste d'articles
app.post('/api/articles/update-deployment-typology', (req, res) => {
  const { articleCodes, typology } = req.body || {};
  const allowed = new Set(['ferme', 'mixte', 'ouvert']);
  if (!Array.isArray(articleCodes) || !allowed.has(String(typology))) {
    return res.status(400).json({ error: "Paramètres invalides: articleCodes doit être un tableau et typology parmi 'ferme'|'mixte'|'ouvert'." });
  }

  const data = readArticles();
  const codeSet = new Set(articleCodes.map(c => String(c)));
  let updated = 0;
  const updatedArticles = (data.articles || []).map(a => {
    if (codeSet.has(String(a.code))) {
      updated += 1;
      return { ...a, deployment_typology: String(typology) };
    }
    return a;
  });

  const ok = writeArticles({ articles: updatedArticles });
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated, articles: updatedArticles });
});

// ===== CRUD pour les troncs =====
// READ
app.get('/api/trunks', (req, res) => {
  const data = readTroncs();
  return res.json(data);
});

// CREATE
app.post('/api/trunks', (req, res) => {
  const payload = req.body || {};
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const groups = Array.isArray(payload.groups) ? payload.groups.map(String) : [];
  const attributes = Array.isArray(payload.attributes) ? payload.attributes.map(String) : [];
  const type = typeof payload.type === 'string' ? payload.type : 'TAC';
  const status = 'brouillon';
  const enseigne = typeof payload.enseigne === 'string' ? payload.enseigne.trim() : '';

  if (!name) {
    return res.status(400).json({ error: 'Paramètre invalide: name requis.' });
  }

  const troncsData = readTroncs();
  const assortiments = troncsData.assortiments || [];
  const nextId = String(
    (assortiments
      .map(t => Number(t.id))
      .filter(n => Number.isFinite(n))
      .reduce((max, n) => Math.max(max, n), 0)) + 1
  );

  // Optionnel: calcul du storesCount en fonction des groupes
  const magasinsData = readMagasins();
  const stores = magasinsData.magasins || [];
  const groupsSet = new Set(groups);
  const brandOf = (m) => {
    const nm = (m.nom_magasin || '').toLowerCase();
    if (nm.startsWith('electrodepot')) return 'electrodepot';
    if (nm.startsWith('boulanger')) return 'boulanger';
    return '';
  };
  const storesCount = stores.filter(m => {
    const g = Array.isArray(m.groupes) ? m.groupes : [];
    const groupsOk = groups.length === 0 ? true : Array.from(groupsSet).every(grp => g.includes(grp));
    const brand = brandOf(m);
    const enseigneOk = !enseigne ? true : brand === enseigne.toLowerCase();
    return groupsOk && enseigneOk;
  }).length;

  const nowIso = new Date().toISOString();
  const newTrunk = {
    id: nextId,
    type,
    name,
    status,
    storesCount,
    createdDate: nowIso,
    lastModified: nowIso,
    groups,
    attributes,
    enseigne
  };

  const updated = { assortiments: [ ...assortiments, newTrunk ] };
  const ok = writeTroncs(updated);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture de troncs.json échouée.' });
  }
  return res.json({ created: 1, trunk: newTrunk, troncs: updated.assortiments });
});

// UPDATE
app.put('/api/trunks/:id', (req, res) => {
  const trunkId = String(req.params.id || '').trim();
  if (!trunkId) {
    return res.status(400).json({ error: 'Paramètre invalide: id requis.' });
  }

  const payload = req.body || {};
  const name = typeof payload.name === 'string' ? payload.name.trim() : undefined;
  const groups = Array.isArray(payload.groups) ? payload.groups.map(String) : undefined;
  const attributes = Array.isArray(payload.attributes) ? payload.attributes.map(String) : undefined;
  const type = typeof payload.type === 'string' ? payload.type : undefined;
  const status = typeof payload.status === 'string' ? payload.status : undefined;
  const enseigne = typeof payload.enseigne === 'string' ? payload.enseigne.trim() : undefined;

  const troncsData = readTroncs();
  const assortiments = troncsData.assortiments || [];
  const index = assortiments.findIndex(t => String(t.id) === trunkId);
  if (index === -1) {
    return res.status(404).json({ error: `Tronc id=${trunkId} introuvable.` });
  }

  // Conserver createdDate, recalculer storesCount, mettre à jour lastModified
  const magasinsData = readMagasins();
  const stores = magasinsData.magasins || [];
  const nextGroups = groups ?? (assortiments[index].groups || []);
  const nextEnseigne = enseigne ?? (assortiments[index].enseigne || '');
  const brandOf = (m) => {
    const nm = (m.nom_magasin || '').toLowerCase();
    if (nm.startsWith('electrodepot')) return 'electrodepot';
    if (nm.startsWith('boulanger')) return 'boulanger';
    return '';
  };
  const storesCount = stores.filter(m => {
    const g = Array.isArray(m.groupes) ? m.groupes : [];
    const groupsOk = nextGroups.length === 0 ? true : nextGroups.every(grp => g.includes(grp));
    const brand = brandOf(m);
    const enseigneOk = !nextEnseigne ? true : brand === String(nextEnseigne).toLowerCase();
    return groupsOk && enseigneOk;
  }).length;

  const nowIso = new Date().toISOString();
  const updatedTrunk = {
    ...assortiments[index],
    name: name ?? assortiments[index].name,
    groups: nextGroups,
    attributes: attributes ?? (assortiments[index].attributes || []),
    type: type ?? assortiments[index].type,
    status: status ?? assortiments[index].status,
    storesCount,
    enseigne: nextEnseigne,
    lastModified: nowIso
  };

  const updatedAssortiments = assortiments.slice();
  updatedAssortiments[index] = updatedTrunk;

  const ok = writeTroncs({ assortiments: updatedAssortiments });
  if (!ok) {
    return res.status(500).json({ error: 'Écriture de troncs.json échouée.' });
  }
  return res.json({ updated: 1, trunk: updatedTrunk, troncs: updatedAssortiments });
});

// ===== CRUD pour les articles de pré-référencement =====
// READ
app.get('/api/preref-articles', (req, res) => {
  const data = readPrerefArticles();
  return res.json(data);
});

// CREATE
app.post('/api/preref-articles', (req, res) => {
  const newArticle = req.body || {};
  if (!newArticle || typeof newArticle !== 'object') {
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }
  if (!newArticle.Code || !newArticle.Libellé) {
    return res.status(400).json({ error: 'Champs requis: Code, Libellé' });
  }
  const data = readPrerefArticles();
  const exists = data.articles.some(a => a.Code === newArticle.Code);
  if (exists) {
    return res.status(409).json({ error: `Article avec Code ${newArticle.Code} existe déjà` });
  }
  data.articles.push(newArticle);
  const ok = writePrerefArticles(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.status(201).json(newArticle);
});

// UPDATE
app.put('/api/preref-articles/:code', (req, res) => {
  const code = req.params.code;
  const updates = req.body || {};
  const data = readPrerefArticles();
  const idx = data.articles.findIndex(a => a.Code === code);
  if (idx === -1) {
    return res.status(404).json({ error: `Article ${code} introuvable` });
  }
  data.articles[idx] = { ...data.articles[idx], ...updates, Code: code };
  const ok = writePrerefArticles(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json(data.articles[idx]);
});

// DELETE
app.delete('/api/preref-articles/:code', (req, res) => {
  const code = req.params.code;
  const data = readPrerefArticles();
  const before = data.articles.length;
  data.articles = data.articles.filter(a => a.Code !== code);
  if (data.articles.length === before) {
    return res.status(404).json({ error: `Article ${code} introuvable` });
  }
  const ok = writePrerefArticles(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ deleted: code });
});

// ===== CRUD pour les assortiments (article_assorti.json) =====
// READ tous
app.get('/api/assortiments', (req, res) => {
  const data = readAssortiments();
  return res.json(data);
});

// READ par id
app.get('/api/assortiments/:id', (req, res) => {
  const id = String(req.params.id);
  const data = readAssortiments();
  const item = data.assortiments.find(a => String(a.id) === id);
  if (!item) {
    return res.status(404).json({ error: `Assortiment ${id} introuvable` });
  }
  return res.json(item);
});

// CREATE
app.post('/api/assortiments', (req, res) => {
  const body = req.body || {};
  const allowedMeta = new Set(['vendable', 'commandable']);
  const allowedType = new Set(['permanent', 'catalogue', 'promotion']);

  let { id, metatype, type, dateDebut, dateFin, actif, articleId } = body;

  if (!metatype || !allowedMeta.has(metatype)) {
    return res.status(400).json({ error: "metatype requis parmi: 'vendable' | 'commandable'" });
  }
  if (!type || !allowedType.has(type)) {
    return res.status(400).json({ error: "type requis parmi: 'permanent' | 'catalogue' | 'promotion'" });
  }
  if (typeof actif !== 'boolean') {
    return res.status(400).json({ error: 'actif requis et doit être boolean' });
  }
  if (!articleId || typeof articleId !== 'string' || !articleId.trim()) {
    return res.status(400).json({ error: 'articleId requis (chaîne non vide)' });
  }

  const data = readAssortiments();
  const newId = id != null ? String(id) : String(Date.now());
  const exists = data.assortiments.some(a => String(a.id) === newId);
  if (exists) {
    return res.status(409).json({ error: `Assortiment avec id ${newId} existe déjà` });
  }

  const newItem = { id: newId, articleId, metatype, type, dateDebut: dateDebut || null, dateFin: dateFin || null, actif };
  data.assortiments.push(newItem);
  const ok = writeAssortiments(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.status(201).json(newItem);
});

// UPDATE
app.put('/api/assortiments/:id', (req, res) => {
  const id = String(req.params.id);
  const updates = req.body || {};
  const allowedMeta = new Set(['vendable', 'commandable']);
  const allowedType = new Set(['permanent', 'catalogue', 'promotion']);

  if (updates.metatype && !allowedMeta.has(updates.metatype)) {
    return res.status(400).json({ error: "metatype doit être 'vendable' ou 'commandable'" });
  }
  if (updates.type && !allowedType.has(updates.type)) {
    return res.status(400).json({ error: "type doit être 'permanent', 'catalogue' ou 'promotion'" });
  }
  if (updates.actif != null && typeof updates.actif !== 'boolean') {
    return res.status(400).json({ error: 'actif doit être boolean' });
  }

  const data = readAssortiments();
  const idx = data.assortiments.findIndex(a => String(a.id) === id);
  if (idx === -1) {
    return res.status(404).json({ error: `Assortiment ${id} introuvable` });
  }

  const current = data.assortiments[idx];
  const updated = {
    ...current,
    ...updates,
    id // id immuable
  };
  data.assortiments[idx] = updated;

  const ok = writeAssortiments(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json(updated);
});

// DELETE
app.delete('/api/assortiments/:id', (req, res) => {
  const id = String(req.params.id);
  const data = readAssortiments();
  const before = data.assortiments.length;
  data.assortiments = data.assortiments.filter(a => String(a.id) !== id);
  if (data.assortiments.length === before) {
    return res.status(404).json({ error: `Assortiment ${id} introuvable` });
  }
  const ok = writeAssortiments(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ deleted: id });
});

// IMPORT depuis les troncs: copier les articles liés à un tronc vers article_assorti.json
// Règles:
// - Sélectionner les articles qui possèdent un champ 'trunk_id' ou 'trunkId' non vide
// - Optionnel: filtrer uniquement ceux dont l'id de tronc existe dans troncs.json
// - Générer des objets assortiments avec: articleId=code, metatype='vendable', type='permanent', actif=true
// - Écraser le contenu existant de article_assorti.json avec la liste importée
app.post('/api/assortiments/import-from-trunks', (req, res) => {
  try {
    const troncsData = readTroncs();
    const trunkIds = new Set((troncsData.assortiments || []).map(t => String(t.id)));

    const articlesData = readArticles();
    const articles = articlesData.articles || [];

    // Garder les articles ayant un tronc et, si possible, dont le tronc existe
    const withTrunk = articles.filter(a => {
      const tid = a.trunk_id != null ? String(a.trunk_id) : (a.trunkId != null ? String(a.trunkId) : '');
      if (!tid || tid === 'undefined' || tid === 'null') return false;
      // Si aucun tronc n'est défini côté données, on accepte tout id non vide
      return trunkIds.size > 0 ? trunkIds.has(tid) : true;
    });

    // Dédupliquer par code article
    const seenCodes = new Set();
    const imported = withTrunk.filter(a => {
      if (!a.code) return false;
      if (seenCodes.has(a.code)) return false;
      seenCodes.add(a.code);
      return true;
    }).map(a => {
      const tid = a.trunk_id != null ? String(a.trunk_id) : (a.trunkId != null ? String(a.trunkId) : '');
      // id stable basé sur tronc + code pour éviter collisions
      const id = tid ? `${tid}-${a.code}` : `${Date.now()}-${a.code}`;
      return {
        id,
        articleId: String(a.code),
        // Métadonnées conservées si nécessaire
        metatype: 'vendable',
        type: 'permanent',
        // Blocs imbriqués demandés uniquement
        commandable: {
          dateDebut: null,
          dateFin: null,
          actif: false
        },
        vendable: {
          dateDebut: null,
          dateFin: null,
          actif: true
        }
      };
    });

    const ok = writeAssortiments({ assortiments: imported });
    if (!ok) {
      return res.status(500).json({ error: 'Écriture du fichier échouée.' });
    }
    return res.json({ imported: imported.length, assortiments: imported });
  } catch (e) {
    console.error('Erreur import assortiments depuis troncs:', e);
    return res.status(500).json({ error: 'Import échoué' });
  }
});

// BULK: mettre à jour la date de début pour un metatype (commandable/vendable)
app.post('/api/assortiments/update-start-date-bulk', (req, res) => {
  const body = req.body || {};
  const { articleCodes, trunkId, metatype, dateDebut } = body;
  const allowedMeta = new Set(['vendable', 'commandable']);

  if (!Array.isArray(articleCodes) || articleCodes.length === 0) {
    return res.status(400).json({ error: 'articleCodes requis (array non vide)' });
  }
  if (!trunkId || typeof trunkId !== 'string') {
    return res.status(400).json({ error: 'trunkId requis' });
  }
  if (!allowedMeta.has(metatype)) {
    return res.status(400).json({ error: "metatype doit être 'vendable' ou 'commandable'" });
  }
  if (!dateDebut || typeof dateDebut !== 'string') {
    return res.status(400).json({ error: 'dateDebut requis (string)' });
  }

  const data = readAssortiments();
  const setCodes = new Set(articleCodes.map(c => String(c)));
  let updated = 0;

  function ensureBlock(obj, key) {
    if (!obj[key] || typeof obj[key] !== 'object') {
      obj[key] = { dateDebut: null, dateFin: null, actif: key === 'vendable' };
    }
  }

  for (let i = 0; i < data.assortiments.length; i++) {
    const a = data.assortiments[i];
    if (!a || !a.articleId) continue;
    const code = String(a.articleId);
    if (!setCodes.has(code)) continue;
    // Optionnel: vérifier le tronc via l'id prefixé
    const hasPrefix = a.id && String(a.id).startsWith(`${trunkId}-`);
    // Si on ne trouve pas d’id avec préfixe, on met quand même à jour l’item par articleId
    if (hasPrefix || true) {
      ensureBlock(a, metatype);
      a[metatype].dateDebut = String(dateDebut);
      updated += 1;
    }
  }

  const ok = writeAssortiments(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated });
});

// BULK: mettre à jour la date de fin pour un metatype (commandable/vendable)
app.post('/api/assortiments/update-end-date-bulk', (req, res) => {
  const body = req.body || {};
  const { articleCodes, trunkId, metatype, dateFin } = body;
  const allowedMeta = new Set(['vendable', 'commandable']);

  if (!Array.isArray(articleCodes) || articleCodes.length === 0) {
    return res.status(400).json({ error: 'articleCodes requis (array non vide)' });
  }
  if (!trunkId || typeof trunkId !== 'string') {
    return res.status(400).json({ error: 'trunkId requis' });
  }
  if (!allowedMeta.has(metatype)) {
    return res.status(400).json({ error: "metatype doit être 'vendable' ou 'commandable'" });
  }
  if (!dateFin || typeof dateFin !== 'string') {
    return res.status(400).json({ error: 'dateFin requis (string)' });
  }

  const data = readAssortiments();
  const setCodes = new Set(articleCodes.map(c => String(c)));
  let updated = 0;

  function ensureBlock(obj, key) {
    if (!obj[key] || typeof obj[key] !== 'object') {
      obj[key] = { dateDebut: null, dateFin: null, actif: key === 'vendable' };
    }
  }

  for (let i = 0; i < data.assortiments.length; i++) {
    const a = data.assortiments[i];
    if (!a || !a.articleId) continue;
    const code = String(a.articleId);
    if (!setCodes.has(code)) continue;
    const hasPrefix = a.id && String(a.id).startsWith(`${trunkId}-`);
    if (hasPrefix || true) {
      ensureBlock(a, metatype);
      a[metatype].dateFin = String(dateFin);
      updated += 1;
    }
  }

  const ok = writeAssortiments(data);
  if (!ok) {
    return res.status(500).json({ error: 'Écriture du fichier échouée.' });
  }
  return res.json({ updated });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`[API] Serveur démarré sur http://localhost:${port}`);
});
