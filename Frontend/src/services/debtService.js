const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const DEBTS_URL =
  `${API_BASE}/api/debts`;


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


function normalizePayment(payment) {
  return {
    id:
      payment.id,

    amount:
      Number(
        payment.amount ??
          payment.payment_amount ??
          0
      ),

    paymentMethod:
      payment.paymentMethod ??
      payment.payment_method ??
      "Tunai",

    note:
      payment.note ??
      payment.notes ??
      "",

    createdAt:
      payment.createdAt ??
      payment.created_at ??
      null,
  };
}


function normalizeDebt(debt) {
  return {
    id:
      debt.id,

    debtNo:
      debt.debtNo ??
      debt.debt_no ??
      debt.bonNo ??
      debt.bon_no ??
      "",

    transactionId:
      debt.transactionId ??
      debt.transaction_id ??
      null,

    transactionNo:
      debt.transactionNo ??
      debt.transaction_no ??
      "",

    memberId:
      debt.memberId ??
      debt.member_id ??
      null,

    customerName:
      debt.customerName ??
      debt.customer_name ??
      debt.name ??
      "Pelanggan",

    customerPhone:
      debt.customerPhone ??
      debt.customer_phone ??
      debt.phone ??
      "",

    total:
      Number(
        debt.total ??
          debt.total_amount ??
          0
      ),

    paid:
      Number(
        debt.paid ??
          debt.paid_amount ??
          0
      ),

    remaining:
      Number(
        debt.remaining ??
          debt.remaining_amount ??
          0
      ),

    status:
      debt.status ??
      debt.paymentStatus ??
      debt.payment_status ??
      "Belum Bayar",

    note:
      debt.note ??
      debt.notes ??
      "",

    createdAt:
      debt.createdAt ??
      debt.created_at ??
      null,

    updatedAt:
      debt.updatedAt ??
      debt.updated_at ??
      null,

    payments:
      (
        debt.payments || []
      ).map(
        normalizePayment
      ),
  };
}


export async function getDebts(
  params = {}
) {
  const searchParams =
    new URLSearchParams();


  if (
    params.status &&
    params.status !==
      "Semua Status"
  ) {
    searchParams.set(
      "status",
      params.status
    );
  }


  const query =
    searchParams.toString();


  const response = await fetch(
    `${DEBTS_URL}${
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
    normalizeDebt
  );
}


export async function getDebt(id) {
  const response = await fetch(
    `${DEBTS_URL}/${id}`
  );


  const result =
    await readResponse(response);


  return normalizeDebt(
    result.data
  );
}


export async function payDebt(
  id,
  payment
) {
  const response = await fetch(
    `${DEBTS_URL}/${id}/payments`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          payment
        ),
    }
  );


  const result =
    await readResponse(response);


  return normalizeDebt(
    result.data
  );
}