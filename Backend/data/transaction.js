const STORAGE_KEY = "pos-transactions";

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const displayToday = today.toLocaleDateString("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const seedTransactions = [
  {
    id: "TRX-20250924-001",
    transactionNo: "TRX-001",
    date: "2025-09-24",
    displayDate: "24 Sep 2025",
    time: "09:18",
    customer: {
      customerType: "member",
      memberCode: "MBR-0001",
      customerName: "Pak Budi",
      phone: "0812xxxx0001",
    },
    paymentMethod: "Tunai",
    subtotal: 127000,
    memberDiscount: 1000,
    total: 126000,
    paid: 126000,
    remaining: 0,
    bonStatus: null,
    items: [
      { name: "Gula Pasir 1 Kg", qty: 2, sellingPrice: 17000, total: 34000 },
      { name: "Minyak Goreng 1 L", qty: 1, sellingPrice: 18000, total: 18000 },
      { name: "Beras 5 Kg", qty: 1, sellingPrice: 75000, total: 75000 },
    ],
  },
  {
    id: "TRX-20250924-002",
    transactionNo: "TRX-002",
    date: "2025-09-24",
    displayDate: "24 Sep 2025",
    time: "11:42",
    customer: {
      customerType: "guest",
      memberCode: null,
      customerName: "Pelanggan Umum",
      phone: null,
    },
    paymentMethod: "QRIS",
    subtotal: 48500,
    memberDiscount: 0,
    total: 48500,
    paid: 48500,
    remaining: 0,
    bonStatus: null,
    items: [
      { name: "Kopi Sachet", qty: 5, sellingPrice: 2500, total: 12500 },
      { name: "Telur Ayam 1 Kg", qty: 1, sellingPrice: 28000, total: 28000 },
      { name: "Teh Celup", qty: 1, sellingPrice: 8000, total: 8000 },
    ],
  },
  {
    id: "TRX-20250924-003",
    transactionNo: "TRX-003",
    date: "2025-09-24",
    displayDate: "24 Sep 2025",
    time: "14:07",
    customer: {
      customerType: "guest",
      memberCode: null,
      customerName: "Ibu Rina",
      phone: "0812xxxx0004",
    },
    paymentMethod: "Bon / Piutang",
    subtotal: 75000,
    memberDiscount: 0,
    total: 75000,
    paid: 0,
    remaining: 75000,
    bonStatus: "Belum Bayar",
    items: [{ name: "Beras 5 Kg", qty: 1, sellingPrice: 75000, total: 75000 }],
  },
];

export function getTransactions() {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return seedTransactions;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : seedTransactions;
  } catch {
    return seedTransactions;
  }
}

export function saveTransaction(transaction) {
  const current = getTransactions();
  const savedTransaction = {
    id: transaction.id || `TRX-${Date.now()}`,
    transactionNo:
      transaction.transactionNo ||
      `TRX-${String(current.length + 1).padStart(3, "0")}`,
    date: transaction.date || isoToday,
    displayDate: transaction.displayDate || displayToday,
    time:
      transaction.time ||
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    ...transaction,
  };

  const updated = [savedTransaction, ...current];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return savedTransaction;
}

