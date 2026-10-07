import express from "express";
import db from "../database/db.js";

const router = express.Router();


db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL DEFAULT '0',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


db.prepare(`
  INSERT OR IGNORE INTO app_settings (
    setting_key,
    setting_value
  )
  VALUES (
    'member_discount_amount',
    '0'
  )
`).run();


router.get(
  "/member-discount",
  (req, res) => {
    try {
      const row =
        db.prepare(`
          SELECT
            setting_value,
            updated_at
          FROM app_settings
          WHERE setting_key = ?
        `).get(
          "member_discount_amount"
        );

      res.json({
        success: true,

        data: {
          amount:
            Math.max(
              Number(
                row?.setting_value ||
                0
              ),
              0
            ),

          updatedAt:
            row?.updated_at ||
            null,
        },
      });

    } catch (error) {
      console.error(
        "GET MEMBER DISCOUNT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Gagal mengambil potongan harga member.",
      });
    }
  }
);


router.put(
  "/member-discount",
  (req, res) => {
    try {
      const amount =
        Number(
          req.body?.amount
        );


      if (
        !Number.isFinite(
          amount
        ) ||
        amount < 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Nominal potongan harga tidak valid.",
          });
      }


      const roundedAmount =
        Math.round(
          amount
        );


      db.prepare(`
        INSERT INTO app_settings (
          setting_key,
          setting_value,
          updated_at
        )
        VALUES (
          ?,
          ?,
          CURRENT_TIMESTAMP
        )

        ON CONFLICT(setting_key)

        DO UPDATE SET
          setting_value =
            excluded.setting_value,

          updated_at =
            CURRENT_TIMESTAMP
      `).run(
        "member_discount_amount",
        String(
          roundedAmount
        )
      );


      const updated =
        db.prepare(`
          SELECT
            setting_value,
            updated_at
          FROM app_settings
          WHERE setting_key = ?
        `).get(
          "member_discount_amount"
        );


      res.json({
        success: true,

        message:
          "Potongan harga member berhasil disimpan.",

        data: {
          amount:
            Number(
              updated.setting_value ||
              0
            ),

          updatedAt:
            updated.updated_at,
        },
      });

    } catch (error) {
      console.error(
        "UPDATE MEMBER DISCOUNT ERROR:",
        error
      );

      res.status(500).json({
        success: false,

        message:
          "Gagal menyimpan potongan harga member.",
      });
    }
  }
);


export default router;