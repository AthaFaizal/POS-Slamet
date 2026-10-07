import express from "express";
import db from "../database/db.js";

const router = express.Router();


function mapHistory(row) {
  return {
    id: row.id,

    productId:
      row.product_id,

    productName:
      row.product_name,

    barcode:
      row.barcode,

    oldBuyPrice:
      Number(
        row.old_buy_price || 0
      ),

    newBuyPrice:
      Number(
        row.new_buy_price || 0
      ),

    oldSellPrice:
      Number(
        row.old_sell_price || 0
      ),

    newSellPrice:
      Number(
        row.new_sell_price || 0
      ),

    differenceAmount:
      Number(
        row.difference_amount || 0
      ),

    differencePercent:
      Number(
        row.difference_percent || 0
      ),

    reason:
      row.reason || "",

    effectiveDate:
      row.effective_date,

    createdAt:
      row.created_at,
  };
}


/* =========================================================
   GET RIWAYAT HARGA
   ========================================================= */

router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT
          ph.*,
          p.name AS product_name,
          p.barcode
        FROM price_history ph
        LEFT JOIN products p
          ON p.id = ph.product_id
        ORDER BY ph.id DESC
      `)
      .all();

    res.json({
      success: true,
      data: rows.map(mapHistory),
    });

  } catch (error) {
    console.error(
      "GET PRICE HISTORY ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal mengambil riwayat harga.",
    });
  }
});


/* =========================================================
   UPDATE HARGA PRODUK
   ========================================================= */

router.post(
  "/:productId",
  (req, res) => {
    try {
      const productId =
        Number(
          req.params.productId
        );

      const {
        buyPrice,
        sellPrice,
        reason,
        effectiveDate,
      } = req.body;


      if (!productId) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "ID produk tidak valid.",
          });
      }


      const newBuyPrice =
        Number(buyPrice);

      const newSellPrice =
        Number(sellPrice);


      if (
        !Number.isFinite(
          newBuyPrice
        ) ||
        newBuyPrice <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Harga beli tidak valid.",
          });
      }


      if (
        !Number.isFinite(
          newSellPrice
        ) ||
        newSellPrice <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Harga jual tidak valid.",
          });
      }


      const product =
        db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(productId);


      if (!product) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Produk tidak ditemukan.",
          });
      }


      const oldBuyPrice =
        Number(
          product.buy_price || 0
        );

      const oldSellPrice =
        Number(
          product.sell_price || 0
        );


      const differenceAmount =
        newSellPrice -
        oldSellPrice;


      const differencePercent =
        oldSellPrice > 0
          ? (
              differenceAmount /
              oldSellPrice
            ) * 100
          : 0;


      const priceTransaction =
        db.transaction(() => {

          /* =============================================
             UPDATE HARGA DI PRODUCTS
             ============================================= */

          db.prepare(`
            UPDATE products
            SET
              buy_price = ?,
              sell_price = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(
            newBuyPrice,
            newSellPrice,
            productId
          );


          /* =============================================
             SIMPAN KE PRICE HISTORY
             SESUAI KOLOM DATABASE ANDA
             ============================================= */

          db.prepare(`
            INSERT INTO price_history (
              product_id,
              old_buy_price,
              new_buy_price,
              old_sell_price,
              new_sell_price,
              difference_amount,
              difference_percent,
              reason,
              effective_date,
              created_at
            )
            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              CURRENT_TIMESTAMP
            )
          `).run(
            productId,
            oldBuyPrice,
            newBuyPrice,
            oldSellPrice,
            newSellPrice,
            differenceAmount,
            differencePercent,
            reason?.trim() ||
              "Update harga",
            effectiveDate ||
              new Date()
                .toISOString()
                .slice(0, 10)
          );

        });


      priceTransaction();


      const updatedProduct =
        db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(productId);


      console.log(
        "HARGA PRODUK BERUBAH:",
        {
          id:
            updatedProduct.id,

          name:
            updatedProduct.name,

          oldBuyPrice,

          newBuyPrice:
            updatedProduct.buy_price,

          oldSellPrice,

          newSellPrice:
            updatedProduct.sell_price,
        }
      );


      res.json({
        success: true,

        message:
          "Harga berhasil diperbarui.",

        data: {
          id:
            updatedProduct.id,

          barcode:
            updatedProduct.barcode,

          name:
            updatedProduct.name,

          buyPrice:
            Number(
              updatedProduct.buy_price
            ),

          sellPrice:
            Number(
              updatedProduct.sell_price
            ),

          stock:
            Number(
              updatedProduct.stock ||
              0
            ),

          updatedAt:
            updatedProduct.updated_at,
        },
      });

    } catch (error) {
      console.error(
        "UPDATE PRICE ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          error.message ||
          "Gagal memperbarui harga.",
      });
    }
  }
);


export default router;