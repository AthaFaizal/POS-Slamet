const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const AUTH_URL =
  `${API_BASE}/api/auth`;

const TOKEN_KEY =
  "pos_auth_token";


async function readResponse(
  response
) {
  let result;

  try {
    result =
      await response.json();

  } catch {
    throw new Error(
      "Respons backend tidak valid."
    );
  }


  if (!response.ok) {
    throw new Error(
      result?.message ||
      `Request gagal (${response.status}).`
    );
  }


  return result;
}


/* =========================================================
   TOKEN
   ========================================================= */

export function getToken() {
  return localStorage.getItem(
    TOKEN_KEY
  );
}


export function setToken(
  token
) {
  if (!token) {
    localStorage.removeItem(
      TOKEN_KEY
    );

    return;
  }

  localStorage.setItem(
    TOKEN_KEY,
    token
  );
}


export function removeToken() {
  localStorage.removeItem(
    TOKEN_KEY
  );
}


/* =========================================================
   LOGIN
   ========================================================= */

export async function loginUser({
  username,
  password,
}) {
  const response =
    await fetch(
      `${AUTH_URL}/login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            username,
            password,
          }),
      }
    );


  const result =
    await readResponse(
      response
    );


  const token =
    result.data?.token;

  const user =
    result.data?.user;


  if (!token || !user) {
    throw new Error(
      "Data login dari backend tidak lengkap."
    );
  }


  setToken(
    token
  );


  return {
    token,
    user,
  };
}


/* =========================================================
   USER YANG SEDANG LOGIN
   ========================================================= */

export async function getCurrentUser() {
  const token =
    getToken();


  if (!token) {
    return null;
  }


  const response =
    await fetch(
      `${AUTH_URL}/me`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      }
    );


  if (
    response.status === 401 ||
    response.status === 403
  ) {
    removeToken();

    return null;
  }


  const result =
    await readResponse(
      response
    );


  return (
    result.data?.user ||
    null
  );
}


/* =========================================================
   LOGOUT
   ========================================================= */

export async function logoutUser() {
  const token =
    getToken();


  try {
    if (token) {
      await fetch(
        `${AUTH_URL}/logout`,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );
    }

  } finally {
    removeToken();
  }
}


/* =========================================================
   FETCH DENGAN TOKEN OTOMATIS
   ========================================================= */

export async function authFetch(
  url,
  options = {}
) {
  const token =
    getToken();


  const headers = {
    ...(options.headers || {}),
  };


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  return fetch(
    url,
    {
      ...options,
      headers,
    }
  );
}