const STORAGE_KEY = "pos_products_v1";
const UPDATE_EVENT = "pos-products-updated";

export const DEFAULT_PRODUCTS = [
  {
    no: 1,
    name: "Gula Pasir 1 Kg",
    barcode: "8991234567890",
    category: "Sembako",
    brand: "Gulaku",
    unit: "pcs",
    supplier: "",
    buyPrice: 16000,
    sellPrice: 17000,
    stock: 3,
    minStock: 10,
    stockStatus: "Menipis",
    isActive: true,
    image: "",
  },
  {
    no: 2,
    name: "Minyak Goreng 1 L",
    barcode: "8991234567891",
    category: "Sembako",
    brand: "",
    unit: "pcs",
    supplier: "",
    buyPrice: 15000,
    sellPrice: 18000,
    stock: 5,
    minStock: 10,
    stockStatus: "Menipis",
    isActive: true,
    image: "",
  },
  {
    no: 3,
    name: "Beras 5 Kg",
    barcode: "8991234567892",
    category: "Sembako",
    brand: "",
    unit: "pcs",
    supplier: "",
    buyPrice: 70000,
    sellPrice: 75000,
    stock: 25,
    minStock: 10,
    stockStatus: "Aman",
    isActive: true,
    image: "",
  },
  {
    no: 4,
    name: "Telur Ayam 1 Kg",
    barcode: "8991234567893",
    category: "Sembako",
    brand: "",
    unit: "kg",
    supplier: "",
    buyPrice: 25000,
    sellPrice: 28000,
    stock: 2,
    minStock: 10,
    stockStatus: "Menipis",
    isActive: true,
    image: "",
  },
  {
    no: 5,
    name: "Kopi Sachet",
    barcode: "8991234567894",
    category: "Minuman",
    brand: "",
    unit: "pcs",
    supplier: "",
    buyPrice: 2000,
    sellPrice: 2500,
    stock: 50,
    minStock: 10,
    stockStatus: "Aman",
    isActive: true,
    image: "",
  },
];

function normalizeProduct(product, index = 0) {
  const stock = Number(product.stock || 0);
  const minStock = Number(product.minStock || 0);

  const sellPrice =
    typeof product.sellPrice === "number"
      ? product.sellPrice
      : Number(
          product.sellPrice ||
            String(product.price || "").replace(/[^0-9]/g, "") ||
            0
        );

  const buyPrice =
    typeof product.buyPrice === "number"
      ? product.buyPrice
      : Number(product.buyPrice || 0);

  const stockStatus =
    stock <= 0
      ? "Habis"
      : stock <= minStock
      ? "Menipis"
      : "Aman";

  return {
    no: index + 1,
    name: product.name || "Barang",
    barcode:
      product.barcode ||
      `TOKO-${String(index + 1).padStart(6, "0")}`,
    category: product.category || "Lainnya",
    brand: product.brand || "",
    unit: product.unit || "pcs",
    supplier: product.supplier || "",
    buyPrice,
    sellPrice,
    stock,
    minStock,
    stockStatus,
    isActive:
      typeof product.isActive === "boolean"
        ? product.isActive
        : product.active !== false,
    image: product.image || "",
  };
}

function canUseStorage() {
  return (
    typeof window !== "undefined" &&
    window.localStorage
  );
}

export function getProducts() {
  if (!canUseStorage()) {
    return DEFAULT_PRODUCTS.map(normalizeProduct);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const seeded =
        DEFAULT_PRODUCTS.map(normalizeProduct);

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(seeded)
      );

      return seeded;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid product data");
    }

    return parsed.map(normalizeProduct);
  } catch {
    return DEFAULT_PRODUCTS.map(normalizeProduct);
  }
}

export function saveProducts(products) {
  const normalized =
    products.map(normalizeProduct);

  if (canUseStorage()) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalized)
    );

    window.dispatchEvent(
      new CustomEvent(UPDATE_EVENT, {
        detail: normalized,
      })
    );
  }

  return normalized;
}

export function subscribeProducts(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomUpdate = (event) => {
    callback(
      event.detail || getProducts()
    );
  };

  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      callback(getProducts());
    }
  };

  window.addEventListener(
    UPDATE_EVENT,
    handleCustomUpdate
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      UPDATE_EVENT,
      handleCustomUpdate
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}