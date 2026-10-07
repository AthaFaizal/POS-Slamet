import express from "express";
import db from "../database/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT *
      FROM debts
    `;

    const params = [];

    if (status) {
      sql += `
        WHERE status = ?
      `;

      params.push(status);
    }

    sql += `
      ORDER BY id DESC
    `;

    const rows =
      db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil bon.",
    });
  }
});

router.get("/:id", (req, res) => {
  try {
    const debt = db
      .prepare(`
        SELECT *
        FROM debts
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: "Bon tidak ditemukan.",
      });
    }

    const payments = db
      .prepare(`
        SELECT *
        FROM debt_payments
        WHERE debt_id = ?
        ORDER BY id DESC
      `)
      .all(req.params.id);

    res.json({
      success: true,
      data: {
        ...debt,
        payments,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail bon.",
    });
  }
});

router.post("/:id/payments", (req, res) => {
  try {
    const debtId =
      Number(req.params.id);

    const {
      amount,
      paymentMethod = "Tunai",
      notes = "",
    } = req.body;

    const payDebt =
      db.transaction(() => {

        const debt = db
          .prepare(`
            SELECT *
            FROM debts
            WHERE id = ?
          `)
          .get(debtId);

        if (!debt) {
          throw new Error(
            "Bon tidak ditemukan."
          );
        }

        const payAmount =
          Number(amount || 0);

        if (payAmount <= 0) {
          throw new Error(
            "Nominal pembayaran tidak valid."
          );
        }

        if (
          payAmount >
          debt.remaining_amount
        ) {
          throw new Error(
            "Pembayaran melebihi sisa bon."
          );
        }

        const paidAmount =
          debt.paid_amount +
          payAmount;

        const remaining =
          debt.remaining_amount -
          payAmount;

        const status =
          remaining <= 0
            ? "Lunas"
            : paidAmount > 0
            ? "Sebagian"
            : "Belum Bayar";

        db.prepare(`
          INSERT INTO debt_payments (
            debt_id,
            amount,
            payment_method,
            notes
          )
          VALUES (?, ?, ?, ?)
        `).run(
          debtId,
          payAmount,
          paymentMethod,
          notes
        );

        db.prepare(`
          UPDATE debts
          SET
            paid_amount = ?,
            remaining_amount = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          paidAmount,
          remaining,
          status,
          debtId
        );

        db.prepare(`
          UPDATE transactions
          SET
            paid = ?,
            remaining = ?,
            payment_status = ?
          WHERE id = ?
        `).run(
          paidAmount,
          remaining,
          status,
          debt.transaction_id
        );

        return {
          paidAmount,
          remaining,
          status,
        };
      });

    const result =
      payDebt();

    res.json({
      success: true,
      message:
        "Pembayaran bon berhasil disimpan.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;