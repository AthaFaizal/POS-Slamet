const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const PRICES_URL =
  `${API_BASE}/api/prices`;


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


export async function getPriceHistory() {
  const response =
    await fetch(
      PRICES_URL,
      {
        cache:
          "no-store",
      }
    );

  const result =
    await readResponse(
      response
    );

  return result.data || [];
}


export async function updatePrice(
  productId,
  data
) {
  const payload = {
    buyPrice:
      Number(
        data.buyPrice
      ),

    sellPrice:
      Number(
        data.sellPrice
      ),

    reason:
      data.reason?.trim() ||
      "",

    effectiveDate:
      data.effectiveDate ||
      null,
  };


  console.log(
    "UPDATE PRICE:",
    productId,
    payload
  );


  const response =
    await fetch(
      `${PRICES_URL}/${productId}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );


  const result =
    await readResponse(
      response
    );


  console.log(
    "HASIL UPDATE PRICE:",
    result
  );


  return result.data;
}