import express from "express";
import db from "../database/db.js";

const router = express.Router();

function transactionNumber() {
  const now = new Date();

  const date =
    now
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");

  const last = db
    .prepare(`
      SELECT id
      FROM transactions
      ORDER BY id DESC
      LIMIT 1
    `)
    .get();

  const next =
    (last?.id || 0) + 1;

  return `TRX-${date}-${String(next).padStart(4, "0")}`;
}

function debtNumber() {
  const last = db
    .prepare(`
      SELECT id
      FROM debts
      ORDER BY id DESC
      LIMIT 1
    `)
    .get();

  const next =
    (last?.id || 0) + 1;

  return `BON-${String(next).padStart(5, "0")}`;
}

router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM transactions
        ORDER BY id DESC
      `)
      .all();

    const itemQuery =
      db.prepare(`
        SELECT *
        FROM transaction_items
        WHERE transaction_id = ?
      `);

    const result = rows.map(
      (transaction) => ({
        ...transaction,
        items:
          itemQuery.all(transaction.id),
      })
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil transaksi.",
    });
  }
});

router.get("/:id", (req, res) => {
  try {
    const transaction = db
      .prepare(`
        SELECT *
        FROM transactions
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan.",
      });
    }

    const items = db
      .prepare(`
        SELECT *
        FROM transaction_items
        WHERE transaction_id = ?
      `)
      .all(req.params.id);

    res.json({
      success: true,
      data: {
        ...transaction,
        items,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil transaksi.",
    });
  }
});

router.post("/", (req, res) => {
  try {
    const {
      memberId,
      customerType = "guest",
      customerName = "Pelanggan Umum",
      customerPhone,
      paymentMethod,
      discount = 0,
      paid = 0,
      notes = "",
      dueDate,
      items,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Keranjang masih kosong.",
      });
    }

    const createTransaction =
      db.transaction(() => {

        let subtotal = 0;

        const preparedItems =
          items.map((item) => {
            const product = db
              .prepare(`
                SELECT *
                FROM products
                WHERE id = ?
              `)
              .get(item.productId);

            if (!product) {
              throw new Error(
                `Produk ID ${item.productId} tidak ditemukan.`
              );
            }

            const qty =
              Number(item.quantity || 1);

            if (product.stock < qty) {
              throw new Error(
                `Stok ${product.name} tidak mencukupi.`
              );
            }

            const sellingPrice =
              Number(
                item.sellingPrice ??
                product.sell_price
              );

            const itemDiscount =
              Number(item.discount || 0);

            const itemSubtotal =
              sellingPrice * qty -
              itemDiscount;

            subtotal += itemSubtotal;

            return {
              product,
              qty,
              sellingPrice,
              itemDiscount,
              itemSubtotal,
            };
          });

        const total =
          Math.max(
            subtotal - Number(discount || 0),
            0
          );

        const paidValue =
          Math.max(
            Number(paid || 0),
            0
          );

        const settledValue =
          Math.min(
            paidValue,
            total
          );

        const remaining =
          Math.max(
            total - settledValue,
            0
          );

        const paymentStatus =
          remaining <= 0
            ? "Lunas"
            : settledValue > 0
            ? "Sebagian"
            : "Belum Bayar";

        const changeAmount =
          paymentMethod === "Tunai"
            ? Math.max(
                paidValue - total,
                0
              )
            : 0;

        const trxNo =
          transactionNumber();

        const transactionResult =
          db.prepare(`
            INSERT INTO transactions (
              transaction_no,
              member_id,
              customer_type,
              customer_name,
              customer_phone,
              payment_method,
              subtotal,
              discount,
              total,
              paid,
              change_amount,
              remaining,
              payment_status,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            trxNo,
            memberId || null,
            customerType,
            customerName,
            customerPhone || null,
            paymentMethod,
            subtotal,
            Number(discount || 0),
            total,
            paidValue,
            changeAmount,
            remaining,
            paymentStatus,
            notes
          );

        const transactionId =
          transactionResult.lastInsertRowid;

        const insertItem =
          db.prepare(`
            INSERT INTO transaction_items (
              transaction_id,
              product_id,
              barcode,
              product_name,
              quantity,
              buy_price,
              normal_price,
              selling_price,
              discount,
              subtotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

        const updateStock =
          db.prepare(`
            UPDATE products
            SET
              stock = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);

        const stockMovement =
          db.prepare(`
            INSERT INTO stock_movements (
              product_id,
              transaction_id,
              movement_type,
              quantity,
              stock_before,
              stock_after,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

        for (
          const item of preparedItems
        ) {
          insertItem.run(
            transactionId,
            item.product.id,
            item.product.barcode,
            item.product.name,
            item.qty,
            item.product.buy_price,
            item.product.sell_price,
            item.sellingPrice,
            item.itemDiscount,
            item.itemSubtotal
          );

          const before =
            item.product.stock;

          const after =
            before - item.qty;

          updateStock.run(
            after,
            item.product.id
          );

          stockMovement.run(
            item.product.id,
            transactionId,
            "SALE",
            -item.qty,
            before,
            after,
            `Penjualan ${trxNo}`
          );
        }

        if (remaining > 0) {
          db.prepare(`
            INSERT INTO debts (
              debt_no,
              transaction_id,
              member_id,
              customer_type,
              customer_name,
              customer_phone,
              total_amount,
              paid_amount,
              remaining_amount,
              status,
              due_date,
              notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            debtNumber(),
            transactionId,
            memberId || null,
            customerType,
            customerName,
            customerPhone || null,
            total,
            settledValue,
            remaining,
            paymentStatus,
            dueDate || null,
            notes
          );
        }

        if (memberId) {
          db.prepare(`
            UPDATE members
            SET
              total_transactions =
                total_transactions + 1,

              total_spending =
                total_spending + ?,

              last_purchase_at =
                CURRENT_TIMESTAMP,

              updated_at =
                CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(
            total,
            memberId
          );
        }

        return {
          transactionId,
          transactionNo: trxNo,
          subtotal,
          total,
          paid: paidValue,
          paidApplied: settledValue,
          remaining,
          change: changeAmount,
          paymentStatus,
        };
      });

    const result =
      createTransaction();

    res.status(201).json({
      success: true,
      message:
        "Transaksi berhasil disimpan.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Gagal menyimpan transaksi.",
    });
  }
});

export default router;
