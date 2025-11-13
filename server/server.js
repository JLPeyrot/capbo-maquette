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

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`[API] Serveur démarré sur http://localhost:${port}`);
});
