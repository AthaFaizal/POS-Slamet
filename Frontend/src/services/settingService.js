const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";


const SETTINGS_URL =
  `${API_BASE}/api/settings`;


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


export async function getMemberDiscount() {
  const response =
    await fetch(
      `${SETTINGS_URL}/member-discount`,
      {
        cache:
          "no-store",
      }
    );


  const result =
    await readResponse(
      response
    );


  return {
    amount:
      Number(
        result.data?.amount ||
        0
      ),

    updatedAt:
      result.data?.updatedAt ||
      null,
  };
}


export async function updateMemberDiscount(
  amount
) {
  const response =
    await fetch(
      `${SETTINGS_URL}/member-discount`,
      {
        method:
          "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            amount:
              Number(
                amount
              ),
          }),
      }
    );


  const result =
    await readResponse(
      response
    );


  return {
    amount:
      Number(
        result.data?.amount ||
        0
      ),

    updatedAt:
      result.data?.updatedAt ||
      null,
  };
}