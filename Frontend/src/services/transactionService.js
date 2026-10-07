const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const TRANSACTIONS_URL =
  `${API_BASE}/api/transactions`;


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


function getLocalDateKey(date) {
  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseTransactionDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const text =
    String(value).trim();

  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T00:00:00`);
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) {
    return new Date(`${text.replace(" ", "T")}Z`);
  }

  return new Date(text);
}

function normalizeTransactionItem(item) {
  return {
    id:
      item.id,

    productId:
      item.productId ??
      item.product_id ??
      null,

    barcode:
      item.barcode ?? "",

    name:
      item.productName ??
      item.product_name ??
      item.name ??
      "",

    quantity:
      Number(
        item.quantity ??
        item.qty ??
        0
      ),

    buyPrice:
      Number(
        item.buyPrice ??
        item.buy_price ??
        0
      ),

    normalPrice:
      Number(
        item.normalPrice ??
        item.normal_price ??
        0
      ),

    sellingPrice:
      Number(
        item.sellingPrice ??
        item.selling_price ??
        0
      ),

    discount:
      Number(
        item.discount ??
        0
      ),

    subtotal:
      Number(
        item.subtotal ??
        item.total ??
        0
      ),
  };
}


function normalizeTransaction(transaction) {
  const createdAt =
    transaction.createdAt ??
    transaction.created_at ??
    transaction.date ??
    null;

  const createdDate =
    parseTransactionDate(
      createdAt
    );

  const validDate =
    createdDate &&
    !Number.isNaN(
      createdDate.getTime()
    );

  return {
    id:
      transaction.id,

    transactionNo:
      transaction.transactionNo ??
      transaction.transaction_no ??
      "",

    memberId:
      transaction.memberId ??
      transaction.member_id ??
      null,

    customerType:
      transaction.customerType ??
      transaction.customer_type ??
      "guest",

    customer: {
      customerName:
        transaction.customer?.customerName ??
        transaction.customer?.name ??
        transaction.customerName ??
        transaction.customer_name ??
        "Pelanggan Umum",

      phone:
        transaction.customer?.phone ??
        transaction.customerPhone ??
        transaction.customer_phone ??
        null,
    },

    paymentMethod:
      transaction.paymentMethod ??
      transaction.payment_method ??
      "-",

    subtotal:
      Number(
        transaction.subtotal ??
        0
      ),

    discount:
      Number(
        transaction.discount ??
        transaction.memberDiscount ??
        transaction.member_discount ??
        0
      ),

    total:
      Number(
        transaction.total ??
        0
      ),

    paid:
      Number(
        transaction.paid ??
        0
      ),

    change:
      Number(
        transaction.change ??
        transaction.changeAmount ??
        transaction.change_amount ??
        0
      ),

    remaining:
      Number(
        transaction.remaining ??
        0
      ),

    paymentStatus:
      transaction.paymentStatus ??
      transaction.payment_status ??
      "",

    bonStatus:
      transaction.bonStatus ??
      transaction.bon_status ??
      transaction.paymentStatus ??
      transaction.payment_status ??
      null,

    notes:
      transaction.notes ??
      "",

    createdAt,

date:
  validDate
    ? getLocalDateKey(
        createdDate
      )
    : "",

    displayDate:
      validDate
        ? createdDate.toLocaleDateString(
            "id-ID",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }
          )
        : "-",

    time:
      validDate
        ? createdDate.toLocaleTimeString(
            "id-ID",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        : "-",

    items:
      (
        transaction.items || []
      ).map(
        normalizeTransactionItem
      ),
  };
}


export async function createTransaction(
  transaction
) {
  const response = await fetch(
    TRANSACTIONS_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          transaction
        ),
    }
  );

  const result =
    await readResponse(response);

  return normalizeTransaction(
    result.data
  );
}


export async function getTransactions() {
  const response = await fetch(
    TRANSACTIONS_URL
  );

  const result =
    await readResponse(response);

  return (
    result.data || []
  ).map(
    normalizeTransaction
  );
}


export async function getTransaction(
  id
) {
  const response = await fetch(
    `${TRANSACTIONS_URL}/${id}`
  );

  const result =
    await readResponse(response);

  return normalizeTransaction(
    result.data
  );
}
