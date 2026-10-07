import jwt from "jsonwebtoken";
import db from "../database/db.js";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "dev-secret-change-this";


export function requireAuth(
  req,
  res,
  next
) {
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
            "Akses ditolak. Silakan login.",
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
        SELECT
          id,
          username,
          name,
          role,
          is_active
        FROM users
        WHERE id = ?
      `).get(
        decoded.userId
      );


    if (!user) {
      return res
        .status(401)
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


    req.user = {
      id:
        user.id,

      username:
        user.username,

      name:
        user.name,

      role:
        user.role,
    };


    next();

  } catch (error) {
    console.error(
      "AUTH MIDDLEWARE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal memvalidasi autentikasi.",
    });
  }
}


export function requireRole(
  ...roles
) {
  return (
    req,
    res,
    next
  ) => {
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "User belum login.",
        });
    }


    if (
      !roles.includes(
        req.user.role
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Anda tidak memiliki akses ke fitur ini.",
        });
    }


    next();
  };
}