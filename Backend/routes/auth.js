import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../database/db.js";

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "dev-secret-change-this";

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN ||
  "12h";


function mapUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    isActive:
      Number(
        row.is_active
      ) === 1,
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  };
}


/* =========================================================
   LOGIN
   ========================================================= */

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        username,
        password,
      } = req.body;


      if (
        !username?.trim() ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Username dan password wajib diisi.",
          });
      }


      const user =
        db.prepare(`
          SELECT *
          FROM users
          WHERE username = ?
          LIMIT 1
        `).get(
          username.trim()
        );


      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Username atau password salah.",
          });
      }


      if (
        Number(
          user.is_active
        ) !== 1
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Akun tidak aktif.",
          });
      }


      const passwordValid =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if (!passwordValid) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Username atau password salah.",
          });
      }


      const token =
        jwt.sign(
          {
            userId:
              user.id,

            username:
              user.username,

            role:
              user.role,

            name:
              user.name,
          },
          JWT_SECRET,
          {
            expiresIn:
              JWT_EXPIRES_IN,
          }
        );


      res.json({
        success: true,

        message:
          "Login berhasil.",

        data: {
          token,

          user:
            mapUser(
              user
            ),
        },
      });

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Terjadi kesalahan saat login.",
      });
    }
  }
);


/* =========================================================
   CEK SESSION / USER LOGIN
   ========================================================= */

router.get(
  "/me",
  (req, res) => {
    try {
      const authHeader =
        req.headers.authorization;


      if (
        !authHeader ||
        !authHeader.startsWith(
          "Bearer "
        )
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Token tidak ditemukan.",
          });
      }


      const token =
        authHeader.substring(7);


      let decoded;

      try {
        decoded =
          jwt.verify(
            token,
            JWT_SECRET
          );

      } catch {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Token tidak valid atau sudah kadaluarsa.",
          });
      }


      const user =
        db.prepare(`
          SELECT *
          FROM users
          WHERE id = ?
          LIMIT 1
        `).get(
          decoded.userId
        );


      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "User tidak ditemukan.",
          });
      }


      if (
        Number(
          user.is_active
        ) !== 1
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Akun tidak aktif.",
          });
      }


      res.json({
        success: true,

        data: {
          user:
            mapUser(
              user
            ),
        },
      });

    } catch (error) {
      console.error(
        "GET AUTH ME ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Gagal mengambil data user.",
      });
    }
  }
);


/* =========================================================
   LOGOUT
   JWT TIDAK PERLU DIHAPUS DI SERVER
   FRONTEND CUKUP HAPUS TOKEN
   ========================================================= */

router.post(
  "/logout",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Logout berhasil.",
    });
  }
);


export default router;