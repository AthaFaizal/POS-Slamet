const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const MEMBERS_URL =
  `${API_BASE}/api/members`;


async function readResponse(response) {
  let result;

  try {
    result = await response.json();
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


function normalizeMember(member) {
  return {
    id:
      member.id,

    code:
      member.memberCode ??
      member.member_code ??
      member.code ??
      "",

    name:
      member.name ?? "",

    phone:
      member.phone ?? "",

    address:
      member.address ?? "",

    photo:
      member.photo ?? "",

    status:
      member.status === "inactive" ||
      member.status === "Nonaktif"
        ? "Nonaktif"
        : "Aktif",

    note:
      member.notes ??
      member.note ??
      "",

    transactions:
      Number(
        member.totalTransactions ??
          member.total_transactions ??
          member.transactions ??
          0
      ),

    totalSpending:
      Number(
        member.totalSpending ??
          member.total_spending ??
          0
      ),

    lastPurchaseAt:
      member.lastPurchaseAt ??
      member.last_purchase_at ??
      null,

    createdAt:
      member.createdAt ??
      member.created_at ??
      null,

    updatedAt:
      member.updatedAt ??
      member.updated_at ??
      null,
  };
}


export async function getMembers(
  params = {}
) {
  const searchParams =
    new URLSearchParams();


  if (params.search) {
    searchParams.set(
      "search",
      params.search
    );
  }


  if (
    params.status &&
    params.status !==
      "Semua Status"
  ) {
    const status =
      params.status === "Aktif"
        ? "active"
        : "inactive";

    searchParams.set(
      "status",
      status
    );
  }


  const query =
    searchParams.toString();


  const response = await fetch(
    `${MEMBERS_URL}${
      query
        ? `?${query}`
        : ""
    }`
  );


  const result =
    await readResponse(response);


  return (
    result.data || []
  ).map(
    normalizeMember
  );
}


export async function getMember(id) {
  const response = await fetch(
    `${MEMBERS_URL}/${id}`
  );


  const result =
    await readResponse(response);


  return normalizeMember(
    result.data
  );
}


export async function createMember(
  member
) {
  const response = await fetch(
    MEMBERS_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(member),
    }
  );


  const result =
    await readResponse(response);


  return normalizeMember(
    result.data
  );
}


export async function updateMember(
  id,
  member
) {
  const response = await fetch(
    `${MEMBERS_URL}/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(member),
    }
  );


  const result =
    await readResponse(response);


  return normalizeMember(
    result.data
  );
}


export async function deleteMember(id) {
  const response = await fetch(
    `${MEMBERS_URL}/${id}`,
    {
      method: "DELETE",
    }
  );


  return readResponse(response);
}