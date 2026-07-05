const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');

// GET - Obtener todos los productos (con nombres de autor, editorial y categoría)
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        p.id_producto,
        p.titulo,
        p.isbn,
        a.nombre AS autor,
        e.nombre AS editorial,
        c.nombre_categoria AS categoria,
        p.precio,
        p.stock
      FROM Producto p
      INNER JOIN Autor a ON p.id_autor = a.id_autor
      INNER JOIN Editorial e ON p.id_editorial = e.id_editorial
      INNER JOIN CategoriaProducto c ON p.id_categoria = c.id_categoria
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener un producto por id
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT 
          p.id_producto,
          p.titulo,
          p.isbn,
          a.nombre AS autor,
          e.nombre AS editorial,
          c.nombre_categoria AS categoria,
          p.precio,
          p.stock
        FROM Producto p
        INNER JOIN Autor a ON p.id_autor = a.id_autor
        INNER JOIN Editorial e ON p.id_editorial = e.id_editorial
        INNER JOIN CategoriaProducto c ON p.id_categoria = c.id_categoria
        WHERE p.id_producto = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;