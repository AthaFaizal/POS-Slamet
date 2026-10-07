const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const PRODUCTS_URL = `${API_BASE}/api/products`;

async function readResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Respons backend tidak valid.");
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Request gagal (${response.status}).`
    );
  }

  return result;
}

export async function getProducts(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.active !== undefined) {
    searchParams.set(
      "active",
      params.active ? "1" : "0"
    );
  }

  if (params.search) {
    searchParams.set(
      "search",
      params.search
    );
  }

  if (
    params.category &&
    params.category !== "all"
  ) {
    searchParams.set(
      "category",
      params.category
    );
  }

  const query =
    searchParams.toString();

  const response = await fetch(
    `${PRODUCTS_URL}${
      query ? `?${query}` : ""
    }`
  );

  const result =
    await readResponse(response);

  return result.data || [];
}

export async function getProduct(id) {
  const response = await fetch(
    `${PRODUCTS_URL}/${id}`
  );

  const result =
    await readResponse(response);

  return result.data;
}

export async function createProduct(product) {
  const response = await fetch(
    PRODUCTS_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(product),
    }
  );

  const result =
    await readResponse(response);

  return result.data;
}

export async function updateProduct(
  id,
  product
) {
  const response = await fetch(
    `${PRODUCTS_URL}/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(product),
    }
  );

  const result =
    await readResponse(response);

  return result.data;
}

export async function updateProductStock(
  id,
  amount,
  note = ""
) {
  const response = await fetch(
    `${PRODUCTS_URL}/${id}/stock`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        amount: Number(amount || 0),
        note,
      }),
    }
  );

  const result =
    await readResponse(response);

  return result.data;
}

export async function getStockHistory(id) {
  const response = await fetch(
    `${PRODUCTS_URL}/${id}/stock-history`
  );

  const result =
    await readResponse(response);

  return result.data || [];
}

export async function deleteProduct(id) {
  const response = await fetch(
    `${PRODUCTS_URL}/${id}`,
    {
      method: "DELETE",
    }
  );

  return readResponse(response);
}