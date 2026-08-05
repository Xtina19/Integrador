/**
 * Catálogo JSON en disco para entidades sin tabla en scriptdb
 * (Roles, Formas de pago). Códigos auto PREFIX######.
 */
const fs = require('fs');
const path = require('path');

function storePath(fileName) {
  return path.join(__dirname, '..', 'data', fileName);
}

function ensureDir(file) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readStore(fileName) {
  const file = storePath(fileName);
  ensureDir(file);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ seq: 0, items: [] }, null, 2), 'utf8');
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeStore(fileName, data) {
  const file = storePath(fileName);
  ensureDir(file);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function nextCode(store, prefix, pad = 6) {
  store.seq = Number(store.seq || 0) + 1;
  return `${String(prefix).toUpperCase()}${String(store.seq).padStart(pad, '0')}`;
}

function createCatalogRouter({ fileName, prefix, entityLabel }) {
  const express = require('express');
  const router = express.Router();

  function mapItem(item) {
    return {
      id: String(item.id),
      code: item.code,
      name: item.name,
      description: item.description || '',
      status: item.status || 'active',
      users: Number(item.users || 0),
    };
  }

  router.get('/', (req, res) => {
    const store = readStore(fileName);
    let items = store.items.map(mapItem);
    const q = String(req.query.q || req.query.search || '').trim().toLowerCase();
    if (q) {
      items = items.filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q),
      );
    }
    if (req.query.status) {
      const st = String(req.query.status).toLowerCase();
      items = items.filter((i) => i.status === st);
    }
    return res.json({ success: true, data: items, total: items.length });
  });

  router.get('/:id', (req, res) => {
    const store = readStore(fileName);
    const item = store.items.find((i) => String(i.id) === String(req.params.id));
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: `${entityLabel} no encontrado` },
      });
    }
    return res.json(mapItem(item));
  });

  router.post('/', (req, res) => {
    const body = req.body || {};
    const name = String(body.name || body.nombre || '').trim();
    const description = String(body.description || body.descripcion || '').trim();
    const statusRaw = String(body.status || body.estado || 'active').toLowerCase();
    const status = statusRaw === 'inactive' || statusRaw === 'inactivo' ? 'inactive' : 'active';

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'El nombre es obligatorio.' },
      });
    }

    const store = readStore(fileName);
    const id = String(Date.now());
    const code = nextCode(store, prefix);
    const item = { id, code, name, description, status, users: 0 };
    store.items.push(item);
    writeStore(fileName, store);
    return res.status(201).json(mapItem(item));
  });

  router.put('/:id', (req, res) => {
    const store = readStore(fileName);
    const idx = store.items.findIndex((i) => String(i.id) === String(req.params.id));
    if (idx < 0) {
      return res.status(404).json({
        success: false,
        error: { message: `${entityLabel} no encontrado` },
      });
    }
    const body = req.body || {};
    const current = store.items[idx];
    const name =
      body.name != null || body.nombre != null
        ? String(body.name || body.nombre || '').trim()
        : current.name;
    const description =
      body.description != null || body.descripcion != null
        ? String(body.description || body.descripcion || '').trim()
        : current.description || '';
    let status = current.status;
    if (body.status != null || body.estado != null) {
      const statusRaw = String(body.status || body.estado).toLowerCase();
      status = statusRaw === 'inactive' || statusRaw === 'inactivo' ? 'inactive' : 'active';
    }
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'El nombre es obligatorio.' },
      });
    }
    store.items[idx] = { ...current, name, description, status, code: current.code };
    writeStore(fileName, store);
    return res.json(mapItem(store.items[idx]));
  });

  router.patch('/:id/estado', (req, res) => {
    const store = readStore(fileName);
    const idx = store.items.findIndex((i) => String(i.id) === String(req.params.id));
    if (idx < 0) {
      return res.status(404).json({
        success: false,
        error: { message: `${entityLabel} no encontrado` },
      });
    }
    const statusRaw = String(req.body?.status || req.body?.estado || 'active').toLowerCase();
    const status = statusRaw === 'inactive' || statusRaw === 'inactivo' ? 'inactive' : 'active';
    store.items[idx] = { ...store.items[idx], status };
    writeStore(fileName, store);
    return res.json(mapItem(store.items[idx]));
  });

  return router;
}

module.exports = { createCatalogRouter, readStore, writeStore, nextCode };
