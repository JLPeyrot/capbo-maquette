const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const ARTICLES_PATH = path.join(process.cwd(), 'public', 'data', 'articles.json');

function readArticles() {
  try {
    const raw = fs.readFileSync(ARTICLES_PATH, 'utf-8');
    const json = JSON.parse(raw);
    if (!json || !Array.isArray(json.articles)) {
      return { articles: [] };
    }
    return json;
  } catch (e) {
    console.error('Erreur lecture articles.json:', e);
    return { articles: [] };
  }
}

function writeArticles(data) {
  try {
    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Erreur écriture articles.json:', e);
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

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`[API] Serveur démarré sur http://localhost:${port}`);
});
