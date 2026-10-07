import express from "express";
import db from "../database/db.js";

const router = express.Router();

function generateMemberCode() {
  const last = db
    .prepare(`
      SELECT id
      FROM members
      ORDER BY id DESC
      LIMIT 1
    `)
    .get();

  const next =
    (last?.id || 0) + 1;

  return `MBR-${String(next).padStart(4, "0")}`;
}

router.get("/", (req, res) => {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT *
      FROM members
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          name LIKE ?
          OR phone LIKE ?
          OR member_code LIKE ?
        )
      `;

      const keyword = `%${search}%`;

      params.push(
        keyword,
        keyword,
        keyword
      );
    }

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    sql += " ORDER BY id DESC";

    const members =
      db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil member.",
    });
  }
});

router.post("/", (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      photo,
      status,
      notes,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama member wajib diisi.",
      });
    }

    const memberCode =
      generateMemberCode();

    const result = db
      .prepare(`
        INSERT INTO members (
          member_code,
          name,
          phone,
          address,
          photo,
          status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        memberCode,
        name.trim(),
        phone || null,
        address || "",
        photo || "",
        status || "active",
        notes || ""
      );

    const member = db
      .prepare(`
        SELECT *
        FROM members
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: "Member berhasil ditambahkan.",
      data: member,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menambahkan member.",
    });
  }
});

router.put("/:id", (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      photo,
      status,
      notes,
    } = req.body;

    db.prepare(`
      UPDATE members
      SET
        name = ?,
        phone = ?,
        address = ?,
        photo = ?,
        status = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      phone || null,
      address || "",
      photo || "",
      status || "active",
      notes || "",
      req.params.id
    );

    const member = db
      .prepare(`
        SELECT *
        FROM members
        WHERE id = ?
      `)
      .get(req.params.id);

    res.json({
      success: true,
      message: "Member berhasil diperbarui.",
      data: member,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui member.",
    });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare(`
      DELETE FROM members
      WHERE id = ?
    `).run(req.params.id);

    res.json({
      success: true,
      message: "Member berhasil dihapus.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus member.",
    });
  }
});

export default router;