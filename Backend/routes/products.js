import express from "express";
import db from "../database/db.js";

const router = express.Router();

function getStockStatus(stock, minStock) {
  if (stock <= 0) return "Habis";
  if (stock <= minStock) return "Menipis";
  return "Aman";
}

function mapProduct(row) {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    category: row.category || "",
    brand: row.brand || "",
    unit: row.unit || "pcs",
    supplier: row.supplier || "",
    buyPrice: Number(row.buy_price || 0),
    sellPrice: Number(row.sell_price || 0),
    stock: Number(row.stock || 0),
    minStock: Number(row.min_stock || 0),
    status: getStockStatus(
      Number(row.stock || 0),
      Number(row.min_stock || 0)
    ),
    isActive: Boolean(row.is_active),
    image: row.image || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/", (req, res) => {
  try {
    const { active, search, category } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (active === "1") {
      sql += " AND is_active = 1";
    }

    if (search) {
      sql += `
        AND (
          name LIKE ?
          OR barcode LIKE ?
          OR category LIKE ?
        )
      `;

      const keyword = `%${search}%`;

      params.push(
        keyword,
        keyword,
        keyword
      );
    }

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY id DESC";

    const rows = db
      .prepare(sql)
      .all(...params);

    res.json({
      success: true,
      data: rows.map(mapProduct),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil produk.",
    });
  }
});

router.get("/:id", (req, res) => {
  try {
    const row = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      data: mapProduct(row),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil produk.",
    });
  }
});

router.post("/", (req, res) => {
  try {
    const {
      barcode,
      name,
      category,
      brand,
      unit,
      supplier,
      buyPrice,
      sellPrice,
      stock,
      minStock,
      isActive,
      image,
    } = req.body;

    if (!barcode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Barcode wajib diisi.",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama barang wajib diisi.",
      });
    }

    const existing = db
      .prepare(`
        SELECT id
        FROM products
        WHERE barcode = ?
      `)
      .get(barcode.trim());

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Barcode sudah digunakan.",
      });
    }

    const insertProduct = db.prepare(`
      INSERT INTO products (
        barcode,
        name,
        category,
        brand,
        unit,
        supplier,
        buy_price,
        sell_price,
        stock,
        min_stock,
        is_active,
        image
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialStock =
      Number(stock || 0);

    const result = insertProduct.run(
      barcode.trim(),
      name.trim(),
      category || "Lainnya",
      brand || "",
      unit || "pcs",
      supplier || "",
      Number(buyPrice || 0),
      Number(sellPrice || 0),
      initialStock,
      Number(minStock || 0),
      isActive === false ? 0 : 1,
      image || ""
    );

    if (initialStock !== 0) {
      db.prepare(`
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity,
          stock_before,
          stock_after,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        result.lastInsertRowid,
        "INITIAL",
        initialStock,
        0,
        initialStock,
        "Stok awal produk"
      );
    }

    const product = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan.",
      data: mapProduct(product),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan produk.",
    });
  }
});

router.put("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const oldProduct = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(id);

    if (!oldProduct) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    const {
      barcode,
      name,
      category,
      brand,
      unit,
      supplier,
      buyPrice,
      sellPrice,
      stock,
      minStock,
      isActive,
      image,
    } = req.body;

    const duplicate = db
      .prepare(`
        SELECT id
        FROM products
        WHERE barcode = ?
        AND id != ?
      `)
      .get(barcode, id);

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Barcode sudah digunakan produk lain.",
      });
    }

    const newStock =
      Number(stock || 0);

    db.prepare(`
      UPDATE products
      SET
        barcode = ?,
        name = ?,
        category = ?,
        brand = ?,
        unit = ?,
        supplier = ?,
        buy_price = ?,
        sell_price = ?,
        stock = ?,
        min_stock = ?,
        is_active = ?,
        image = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      barcode,
      name,
      category || "Lainnya",
      brand || "",
      unit || "pcs",
      supplier || "",
      Number(buyPrice || 0),
      Number(sellPrice || 0),
      newStock,
      Number(minStock || 0),
      isActive === false ? 0 : 1,
      image || "",
      id
    );

    if (newStock !== oldProduct.stock) {
      db.prepare(`
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity,
          stock_before,
          stock_after,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        "ADJUSTMENT",
        newStock - oldProduct.stock,
        oldProduct.stock,
        newStock,
        "Perubahan stok dari edit produk"
      );
    }

    const product = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(id);

    res.json({
      success: true,
      message: "Produk berhasil diperbarui.",
      data: mapProduct(product),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui produk.",
    });
  }
});

router.patch("/:id/stock", (req, res) => {
  try {
    const id = Number(req.params.id);

    const amount =
      Number(req.body.amount || 0);

    const note =
      req.body.note || "Perubahan stok";

    const product = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    const newStock =
      product.stock + amount;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stok tidak boleh minus.",
      });
    }

    db.prepare(`
      UPDATE products
      SET
        stock = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newStock,
      id
    );

    db.prepare(`
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      amount > 0
        ? "STOCK_IN"
        : "ADJUSTMENT",
      amount,
      product.stock,
      newStock,
      note
    );

    const updated = db
      .prepare(`
        SELECT *
        FROM products
        WHERE id = ?
      `)
      .get(id);

    res.json({
      success: true,
      message: "Stok berhasil diperbarui.",
      data: mapProduct(updated),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui stok.",
    });
  }
});

router.get("/:id/stock-history", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM stock_movements
        WHERE product_id = ?
        ORDER BY id DESC
      `)
      .all(req.params.id);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil histori stok.",
    });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const info = db
      .prepare(`
        DELETE FROM products
        WHERE id = ?
      `)
      .run(req.params.id);

    if (!info.changes) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message: "Produk berhasil dihapus.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus produk.",
    });
  }
});

export default router;