import { useEffect, useRef, useState } from "react";
import productImage from "../assets/images/product-store.svg";
import "../style/ProductStock.css";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductApi,
} from "../services/productService.js";

const defaultForm = {
  barcode: "",
  name: "",
  category: "",
  brand: "",
  unit: "",
  supplier: "",
  buyPrice: "",
  sellPrice: "",
  stock: "0",
  minStock: "0",
  status: "active",
  image: "",
};

const productExportColumns = [
  { key: "barcode", label: "Barcode" },
  { key: "name", label: "Nama Barang" },
  { key: "category", label: "Kategori" },
  { key: "brand", label: "Merek" },
  { key: "unit", label: "Satuan" },
  { key: "supplier", label: "Supplier" },
  { key: "buyPrice", label: "Harga Beli" },
  { key: "sellPrice", label: "Harga Jual" },
  { key: "stock", label: "Stok" },
  { key: "minStock", label: "Min. Stok" },
  { key: "status", label: "Status" },
  { key: "image", label: "URL Gambar" },
];

const templateRows = [
  {
    barcode: "8991234567890",
    name: "Gula Pasir 1 Kg",
    category: "Sembako",
    brand: "Gulaku",
    unit: "pcs",
    supplier: "Supplier Utama",
    buyPrice: 16000,
    sellPrice: 17000,
    stock: 20,
    minStock: 10,
    status: "active",
    image: "https://domainanda.com/images/gula-pasir.webp",
  },
  {
    barcode: "8991234567891",
    name: "Minyak Goreng 1 L",
    category: "Sembako",
    brand: "Bimoli",
    unit: "pcs",
    supplier: "Distributor Lokal",
    buyPrice: 15000,
    sellPrice: 18000,
    stock: 15,
    minStock: 10,
    status: "active",
    image: "",
  },
];

const escapeCsvCell = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const toCsv = (rows) => {
  const header = productExportColumns.map((column) => escapeCsvCell(column.label)).join(",");
  const body = rows
    .map((row) =>
      productExportColumns
        .map((column) => escapeCsvCell(row[column.key]))
        .join(",")
    )
    .join("\n");

  return `\uFEFF${header}\n${body}`;
};

const escapeXml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const toExcelXml = (rows) => `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Produk Stok">
    <Table>
      <Row>
        ${productExportColumns.map((column) => `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`).join("")}
      </Row>
      ${rows
        .map(
          (row) => `<Row>${productExportColumns
            .map((column) => {
              const value = row[column.key];
              const isNumber = ["buyPrice", "sellPrice", "stock", "minStock"].includes(column.key);
              return `<Cell><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`;
            })
            .join("")}</Row>`
        )
        .join("")}
    </Table>
  </Worksheet>
</Workbook>`;

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ");

const headerToKey = productExportColumns.reduce((map, column) => {
  map[normalizeHeader(column.label)] = column.key;
  return map;
}, {});

headerToKey["min stok"] = "minStock";
headerToKey["minimum stok"] = "minStock";
headerToKey["harga beli"] = "buyPrice";
headerToKey["harga jual"] = "sellPrice";
headerToKey["url gambar"] = "image";

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
};

const parseExcelXml = (text) => {
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const parserError = xml.querySelector("parsererror");
  if (parserError) throw new Error("File Excel tidak valid.");

  return Array.from(xml.getElementsByTagName("Row")).map((row) =>
    Array.from(row.getElementsByTagName("Cell")).map((cell) => {
      const data = cell.getElementsByTagName("Data")[0];
      return data?.textContent || "";
    })
  );
};

const readZipFile = async (arrayBuffer) => {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  let eocdOffset = -1;

  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset === -1) throw new Error("File .xlsx tidak valid.");

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let directoryOffset = view.getUint32(eocdOffset + 16, true);
  const files = {};

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(directoryOffset, true) !== 0x02014b50) break;

    const method = view.getUint16(directoryOffset + 10, true);
    const compressedSize = view.getUint32(directoryOffset + 20, true);
    const nameLength = view.getUint16(directoryOffset + 28, true);
    const extraLength = view.getUint16(directoryOffset + 30, true);
    const commentLength = view.getUint16(directoryOffset + 32, true);
    const localOffset = view.getUint32(directoryOffset + 42, true);
    const nameBytes = bytes.slice(directoryOffset + 46, directoryOffset + 46 + nameLength);
    const fileName = new TextDecoder().decode(nameBytes);

    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize);

    files[fileName] = { method, data: compressedData };
    directoryOffset += 46 + nameLength + extraLength + commentLength;
  }

  return files;
};

const readZipText = async (files, fileName) => {
  const entry = files[fileName];
  if (!entry) return "";

  if (entry.method === 0) {
    return new TextDecoder().decode(entry.data);
  }

  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("Browser tidak mendukung pembacaan kompresi file .xlsx ini.");
  }

  const stream = new Blob([entry.data])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const decompressed = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(decompressed);
};

const columnIndexFromRef = (cellRef = "") => {
  const letters = cellRef.match(/[A-Z]+/i)?.[0] || "";
  return letters
    .toUpperCase()
    .split("")
    .reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

const parseXlsx = async (arrayBuffer) => {
  const files = await readZipFile(arrayBuffer);
  const sharedStringsXml = await readZipText(files, "xl/sharedStrings.xml");
  const sheetFile = Object.keys(files).find((fileName) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(fileName)
  );

  if (!sheetFile) throw new Error("Sheet Excel tidak ditemukan.");

  const sharedStrings = sharedStringsXml
    ? Array.from(
        new DOMParser()
          .parseFromString(sharedStringsXml, "text/xml")
          .getElementsByTagName("si")
      ).map((item) =>
        Array.from(item.getElementsByTagName("t"))
          .map((textNode) => textNode.textContent || "")
          .join("")
      )
    : [];

  const sheetXml = await readZipText(files, sheetFile);
  const sheet = new DOMParser().parseFromString(sheetXml, "text/xml");

  return Array.from(sheet.getElementsByTagName("row")).map((row) => {
    const values = [];

    Array.from(row.getElementsByTagName("c")).forEach((cell) => {
      const cellIndex = columnIndexFromRef(cell.getAttribute("r"));
      const type = cell.getAttribute("t");
      const rawValue =
        cell.getElementsByTagName("v")[0]?.textContent ||
        cell.getElementsByTagName("t")[0]?.textContent ||
        "";
      values[cellIndex] = type === "s" ? sharedStrings[Number(rawValue)] || "" : rawValue;
    });

    return values.map((value) => value || "");
  });
};

const rowsToProducts = (rows, existingProducts) => {
  const [headers = [], ...bodyRows] = rows;
  const mappedHeaders = headers.map((header) => headerToKey[normalizeHeader(header)] || "");
  const existingBarcodes = new Set(existingProducts.map((product) => String(product.barcode || "")));

  return bodyRows
    .map((row, index) => {
      const raw = mappedHeaders.reduce((item, key, cellIndex) => {
        if (key) item[key] = row[cellIndex] || "";
        return item;
      }, {});

      const product = {
        barcode: String(raw.barcode || "").trim(),
        name: String(raw.name || "").trim(),
        category: String(raw.category || "Lainnya").trim(),
        brand: String(raw.brand || "").trim(),
        unit: String(raw.unit || "pcs").trim(),
        supplier: String(raw.supplier || "").trim(),
        buyPrice: Number(raw.buyPrice || 0),
        sellPrice: Number(raw.sellPrice || 0),
        stock: Number(raw.stock || 0),
        minStock: Number(raw.minStock || 0),
        isActive: String(raw.status || "active").toLowerCase() !== "inactive",
        image: String(raw.image || "").trim(),
      };

      const errors = [];
      if (!product.barcode) errors.push("Barcode kosong");
      if (!product.name) errors.push("Nama kosong");
      if (product.sellPrice <= 0) errors.push("Harga jual kosong");
      if (existingBarcodes.has(product.barcode)) errors.push("Duplikat barcode");

      return {
        no: index + 1,
        product,
        status: errors.length ? "error" : "valid",
        message: errors.join(", ") || "Valid",
      };
    })
    .filter((row) => row.product.barcode || row.product.name);
};

const downloadTextFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const normalizeProductForFile = (product) => ({
  barcode: product.barcode || "",
  name: product.name || "",
  category: product.category || "",
  brand: product.brand || "",
  unit: product.unit || "",
  supplier: product.supplier || "",
  buyPrice: Number(product.buyPrice || 0),
  sellPrice: Number(product.sellPrice || 0),
  stock: Number(product.stock || 0),
  minStock: Number(product.minStock || 0),
  status: product.isActive === false ? "inactive" : "active",
  image: product.image || "",
});

function SvgIcon({ name, size = 18, className = "" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": "true",
  };

  const icons = {
    box: (
      <svg {...common}>
        <path d="M4.5 7.1 12 3l7.5 4.1v9.8L12 21l-7.5-4.1V7.1Z" fill="currentColor" opacity=".14" />
        <path d="M4.5 7.1 12 11.2l7.5-4.1M12 11.2V21M4.5 7.1 12 3l7.5 4.1v9.8L12 21l-7.5-4.1V7.1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    barcode: (
      <svg {...common}>
        <path d="M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 5v14" stroke="currentColor" strokeWidth=".9" />
      </svg>
    ),
    coins: (
      <svg {...common}>
        <ellipse cx="12" cy="6.2" rx="7.2" ry="3.2" fill="currentColor" opacity=".14" />
        <path d="M4.8 6.2c0 1.8 3.2 3.2 7.2 3.2s7.2-1.4 7.2-3.2S16 3 12 3 4.8 4.4 4.8 6.2Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.8 6.2v4.2c0 1.8 3.2 3.2 7.2 3.2s7.2-1.4 7.2-3.2V6.2M4.8 10.4v4.2c0 1.8 3.2 3.2 7.2 3.2s7.2-1.4 7.2-3.2v-4.2M4.8 14.6v3.2C4.8 19.6 8 21 12 21s7.2-1.4 7.2-3.2v-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    image: (
      <svg {...common}>
        <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="9" cy="9" r="1.7" fill="currentColor" />
        <path d="m5.8 17 4.1-4.2 2.7 2.7 2.2-2.2 3.4 3.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    toggle: (
      <svg {...common}>
        <rect x="3" y="6.5" width="18" height="11" rx="5.5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="14.5" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
    save: (
      <svg {...common}>
        <path d="M5 3.5h11.8L20.5 7v13.5h-16v-17Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8 3.5v6h8v-6M8 20.5v-7h8v7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    upload: (
      <svg {...common}>
        <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    chevron: (
      <svg {...common}>
        <path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    more: (
      <svg {...common}>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
    download: (
      <svg {...common}>
        <path d="M11 3h2v9.2l3.2-3.2 1.4 1.4L12 16l-5.6-5.6L7.8 9l3.2 3.2V3Z" fill="currentColor" />
        <path d="M5 18h14v2H5z" fill="currentColor" opacity=".45" />
      </svg>
    ),
    file: (
      <svg {...common}>
        <path d="M6 2.8h8l4 4V21H6V2.8Z" fill="currentColor" opacity=".14" />
        <path d="M6 2.8h8l4 4V21H6V2.8Zm8 0v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 11h6M9 14.5h6M9 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    excel: (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2.2" fill="currentColor" opacity=".14" />
        <path d="M8 8.5 11 12l-3 3.5M14 8.5 11 12l3 3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    check: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".16" />
        <path d="m8 12.2 2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    warning: (
      <svg {...common}>
        <path d="M12 3.5 21 20H3L12 3.5Z" fill="currentColor" opacity=".16" />
        <path d="M12 8v5.2M12 16.5v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    arrowRight: (
      <svg {...common}>
        <path d="M5 12h12M13 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    arrowLeft: (
      <svg {...common}>
        <path d="M19 12H7M11 7l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    edit: (
      <svg {...common}>
        <path d="M4 20h4.2L18.4 9.8a2.1 2.1 0 0 0 0-3L17.2 5.6a2.1 2.1 0 0 0-3 0L4 15.8V20Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m12.8 7 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    trash: (
      <svg {...common}>
        <path d="M5 7h14M9 7V4.5h6V7M7.5 7l.7 13h7.6l.7-13M10 10.5v6M14 10.5v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    close: (
      <svg {...common}>
        <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function SectionTitle({ icon, title, description }) {
  return (
    <div className="product-form-section-title">
      <span className="product-form-section-icon">
        <SvgIcon name={icon} size={20} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, icon, accent = "green", onClose, children, footer, className = "" }) {
  return (
    <div className="stock-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`stock-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="stock-modal-header">
          <span className={`stock-modal-title-icon ${accent}`}>
            <SvgIcon name={icon} size={22} />
          </span>
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="stock-modal-close" type="button" onClick={onClose} aria-label={`Tutup ${title}`}>
            <SvgIcon name="close" size={19} />
          </button>
        </header>
        <div className="stock-modal-body">{children}</div>
        {footer && <footer className="stock-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

function ImportSteps({ step }) {
  const labels = ["Upload File", "Preview Data", "Import"];
  return (
    <div className="import-steps" aria-label="Tahapan import">
      {labels.map((label, index) => {
        const no = index + 1;
        const done = no < step;
        const active = no === step;
        return (
          <div className={`import-step ${active ? "active" : ""} ${done ? "done" : ""}`} key={label}>
            <span>{done ? <SvgIcon name="check" size={15} /> : no}</span>
            <strong>{label}</strong>
          </div>
        );
      })}
    </div>
  );
}

function ProductStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const barcodeRef = useRef(null);
  const importInputRef = useRef(null);
  const [activeModal, setActiveModal] = useState(null);
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importRows, setImportRows] = useState([]);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [exportScope, setExportScope] = useState("all");
  const [exportFormat, setExportFormat] = useState("xls");
  const [exportCategory, setExportCategory] = useState("");
  const [exportDone, setExportDone] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProductId, setEditingProductId] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();

      setProducts(
        data.map((product, index) => ({
          ...product,
          no: index + 1,
          price: `Rp. ${Number(product.sellPrice || 0).toLocaleString("id-ID")}`,
        }))
      );
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Gagal mengambil data produk.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const openAddForm = () => {
    setEditingProductId(null);
    setFormData(defaultForm);
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    setEditingProductId(null);
    setFormData(defaultForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        barcode: formData.barcode.trim(),
        name: formData.name.trim(),
        category: formData.category || "Lainnya",
        brand: formData.brand.trim(),
        unit: formData.unit || "pcs",
        supplier: formData.supplier || "",
        buyPrice: Number(formData.buyPrice || 0),
        sellPrice: Number(formData.sellPrice || 0),
        stock: Number(formData.stock || 0),
        minStock: Number(formData.minStock || 0),
        isActive: formData.status === "active",
        image: formData.image.trim(),
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
      } else {
        await createProduct(payload);
      }

      await loadProducts();
      closeAddForm();
    } catch (submitError) {
      console.error(submitError);
      window.alert(submitError.message || "Gagal menyimpan produk.");
    }
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);

    setFormData({
      barcode: product.barcode || "",
      name: product.name || "",
      category: product.category || "",
      brand: product.brand || "",
      unit: product.unit || "pcs",
      supplier: product.supplier || "",
      buyPrice: String(product.buyPrice || 0),
      sellPrice: String(product.sellPrice || 0),
      stock: String(product.stock || 0),
      minStock: String(product.minStock || 0),
      status: product.isActive ? "active" : "inactive",
      image: product.image || "",
    });

    setShowAddForm(true);
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Hapus barang "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await deleteProductApi(product.id);
      await loadProducts();
    } catch (deleteError) {
      console.error(deleteError);
      window.alert(deleteError.message || "Gagal menghapus produk.");
    }
  };

  const categories = [
    "all",
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ];

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      selectedCategory === "all" ||
      product.category === selectedCategory;

    const matchSearch =
      !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.barcode.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch);

    return matchCategory && matchSearch;
  });

  const importStats = {
    total: importRows.length,
    valid: importRows.filter((row) => row.status === "valid").length,
    imported: importRows.filter((row) => row.status === "imported").length,
    error: importRows.filter((row) => row.status === "error").length,
  };

  const openImport = () => {
    setImportFile(null);
    setImportStep(1);
    setActiveModal("import");
  };

  const openExport = () => {
    setExportScope("all");
    setExportFormat("xls");
    setExportCategory("");
    setExportDone(false);
    setActiveModal("export");
  };

  const closeModal = () => {
    setActiveModal(null);
    setImportFile(null);
    setImportRows([]);
    setImportError("");
    setImportStep(1);
    setExportDone(false);
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportRows([]);
    setImportError("");
  };

  const readImportFile = async () => {
    if (!importFile) return;

    try {
      setImportError("");
      const extension = importFile.name.split(".").pop()?.toLowerCase();
      let rows;

      if (extension === "csv") {
        const text = await importFile.text();
        rows = parseCsv(text);
      } else if (extension === "xls") {
        const text = await importFile.text();
        rows = parseExcelXml(text);
      } else if (extension === "xlsx") {
        const arrayBuffer = await importFile.arrayBuffer();
        rows = await parseXlsx(arrayBuffer);
      } else {
        throw new Error("Format file belum didukung. Gunakan Excel (.xlsx/.xls) atau CSV.");
      }

      const parsedRows = rowsToProducts(rows, products);

      if (parsedRows.length === 0) {
        throw new Error("Tidak ada data produk yang bisa dibaca dari file.");
      }

      setImportRows(parsedRows);
      setImportStep(2);
    } catch (parseError) {
      setImportError(parseError.message || "Gagal membaca file import.");
    }
  };

  const confirmImport = async () => {
    const validRows = importRows.filter((row) => row.status === "valid");
    if (validRows.length === 0) {
      window.alert("Tidak ada data valid untuk diimport.");
      return;
    }

    setImporting(true);

    try {
      for (const row of validRows) {
        await createProduct(row.product);
      }

      await loadProducts();
      setImportRows((current) =>
        current.map((row) =>
          row.status === "valid" ? { ...row, status: "imported", message: "Diimport" } : row
        )
      );
    } catch (importErrorValue) {
      console.error(importErrorValue);
      window.alert(importErrorValue.message || "Gagal mengimport data produk.");
      setImporting(false);
      return;
    }

    setImporting(false);
    setImportStep(3);
    window.setTimeout(() => {
      setActiveModal(null);
      setImportStep(1);
      setImportFile(null);
      setImportRows([]);
    }, 700);
  };

  const downloadImportTemplate = () => {
    downloadTextFile(
      "template-import-produk-stok.xls",
      toExcelXml(templateRows),
      "application/vnd.ms-excel;charset=utf-8"
    );
  };

  const getExportProducts = () => {
    if (exportScope === "category") {
      return products.filter((product) => product.category === exportCategory);
    }

    if (exportScope === "low") {
      return products.filter(
        (product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= Number(product.minStock || 0)
      );
    }

    if (exportScope === "empty") {
      return products.filter((product) => Number(product.stock || 0) === 0);
    }

    return products;
  };

  const downloadExportFile = () => {
    const rows = getExportProducts().map(normalizeProductForFile);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const scopeName =
      exportScope === "category" && exportCategory
        ? exportCategory.toLowerCase().replaceAll(" ", "-")
        : exportScope;
    const filename = `produk-stok-${scopeName}-${dateStamp}.${exportFormat}`;

    if (exportFormat === "csv") {
      downloadTextFile(filename, toCsv(rows), "text/csv;charset=utf-8");
      return;
    }

    downloadTextFile(
      filename,
      toExcelXml(rows),
      "application/vnd.ms-excel;charset=utf-8"
    );
  };

  const startExport = () => {
    if (exportScope === "category" && !exportCategory) {
      window.alert("Pilih kategori terlebih dahulu.");
      return;
    }

    downloadExportFile();
    setExportDone(true);
  };

  if (showAddForm) {
    return (
      <section className="product-stock-page product-add-page">
        <div className="product-add-heading">
          <div>
            <div className="product-add-breadcrumb">
              <button type="button" onClick={closeAddForm}>Produk &amp; Stok</button>
              <span>/</span>
              <strong>{editingProductId ? "Edit Barang" : "Tambah Barang"}</strong>
            </div>
            <h2>{editingProductId ? "Edit Barang" : "Tambah Barang"}</h2>
            <p>{editingProductId ? "Perbarui data barang yang dipilih." : "Tambahkan data barang baru ke dalam sistem."}</p>
          </div>
          <button className="product-form-close" type="button" onClick={closeAddForm} aria-label="Tutup form tambah barang">
            <SvgIcon name="close" size={20} />
          </button>
        </div>

        <form className="product-add-card" onSubmit={handleSubmit}>
          <section className="product-form-section">
            <SectionTitle icon="box" title="Informasi Barang" description="Masukkan informasi dasar barang." />

            <div className="product-form-grid">
              <div className="product-form-field barcode-field">
                <label htmlFor="product-barcode">Barcode / Kode Barang</label>
                <div className="barcode-input-row">
                  <input
                    ref={barcodeRef}
                    id="product-barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={updateField}
                    placeholder="Masukkan barcode atau kode barang"
                    autoComplete="off"
                  />
                  <button className="scan-barcode-button" type="button" onClick={() => barcodeRef.current?.focus()}>
                    <SvgIcon name="barcode" size={18} />
                    <span>Scan</span>
                  </button>
                </div>
                <small>Bisa diisi manual atau otomatis saat scan barcode.</small>
              </div>

              <div className="product-form-field">
                <label htmlFor="product-name">Nama Barang</label>
                <input
                  id="product-name"
                  name="name"
                  value={formData.name}
                  onChange={updateField}
                  placeholder="Masukkan nama barang"
                  required
                />
              </div>

              <div className="product-form-field">
                <label htmlFor="product-category">Kategori</label>
                <div className="select-wrap">
                  <select id="product-category" name="category" value={formData.category} onChange={updateField} required>
                    <option value="">Pilih kategori</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan Ringan">Makanan Ringan</option>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <SvgIcon name="chevron" size={18} />
                </div>
              </div>

              <div className="product-form-field">
                <label htmlFor="product-brand">Merek</label>
                <input id="product-brand" name="brand" value={formData.brand} onChange={updateField} placeholder="Masukkan merek barang (opsional)" />
              </div>

              <div className="product-form-field">
                <label htmlFor="product-unit">Satuan</label>
                <div className="select-wrap">
                  <select id="product-unit" name="unit" value={formData.unit} onChange={updateField} required>
                    <option value="">Pilih satuan</option>
                    <option value="pcs">Pcs</option>
                    <option value="rtg">Rtg</option>
                    <option value="bungkus">Bungkus</option>
                    <option value="botol">Botol</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                    <option value="dus">Dus</option>
                  </select>
                  <SvgIcon name="chevron" size={18} />
                </div>
              </div>

              <div className="product-form-field">
                <label htmlFor="product-supplier">Supplier</label>
                <div className="select-wrap">
                  <select id="product-supplier" name="supplier" value={formData.supplier} onChange={updateField}>
                    <option value="">Pilih supplier (opsional)</option>
                    <option value="Supplier Utama">Supplier Utama</option>
                    <option value="Distributor Lokal">Distributor Lokal</option>
                    <option value="Grosir Pasar">Grosir Pasar</option>
                  </select>
                  <SvgIcon name="chevron" size={18} />
                </div>
              </div>
            </div>
          </section>

          <section className="product-form-section">
            <SectionTitle icon="coins" title="Harga" description="Tentukan harga beli dan harga jual barang." />
            <div className="product-form-grid">
              <div className="product-form-field">
                <label htmlFor="buy-price">Harga Beli</label>
                <div className="currency-input">
                  <span>Rp.</span>
                  <input id="buy-price" name="buyPrice" type="number" min="0" value={formData.buyPrice} onChange={updateField} placeholder="Masukkan harga beli" />
                </div>
              </div>
              <div className="product-form-field">
                <label htmlFor="sell-price">Harga Jual</label>
                <div className="currency-input">
                  <span>Rp.</span>
                  <input id="sell-price" name="sellPrice" type="number" min="0" value={formData.sellPrice} onChange={updateField} placeholder="Masukkan harga jual" required />
                </div>
              </div>
            </div>
          </section>

          <section className="product-form-section">
            <SectionTitle icon="box" title="Stok" description="Atur stok awal dan stok minimum barang." />
            <div className="product-form-grid">
              <div className="product-form-field">
                <label htmlFor="initial-stock">Stok Awal</label>
                <input id="initial-stock" name="stock" type="number" min="0" value={formData.stock} onChange={updateField} />
              </div>
              <div className="product-form-field">
                <label htmlFor="minimum-stock">Stok Minimum</label>
                <input id="minimum-stock" name="minStock" type="number" min="0" value={formData.minStock} onChange={updateField} />
              </div>
            </div>
          </section>

          <section className="product-form-bottom-grid">
            <div className="product-form-upload-block">
              <SectionTitle
                icon="image"
                title="Gambar Barang"
                description="Paste URL gambar dari File Manager / CDN Anda."
              />

              <div className="product-form-field">
                <label htmlFor="product-image-url">URL Gambar</label>
                <input
                  id="product-image-url"
                  name="image"
                  type="url"
                  value={formData.image}
                  onChange={updateField}
                  placeholder="https://cdn.domainanda.com/products/nama-gambar.webp"
                  autoComplete="off"
                />
                <small>
                  Upload gambar melalui File Manager CDN, salin URL file, lalu paste URL-nya di sini.
                </small>
              </div>

              <div className={`product-image-upload ${formData.image ? "has-preview" : ""}`}>
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Preview barang"
                    onError={(event) => {
                      event.currentTarget.style.opacity = "0.25";
                    }}
                    onLoad={(event) => {
                      event.currentTarget.style.opacity = "1";
                    }}
                  />
                ) : (
                  <>
                    <span className="upload-icon-wrap">
                      <SvgIcon name="image" size={23} />
                    </span>
                    <strong>Preview Gambar</strong>
                    <small>Preview akan muncul setelah URL gambar CDN dimasukkan.</small>
                  </>
                )}
              </div>
            </div>

            <div className="product-form-status-block">
              <SectionTitle icon="toggle" title="Status" description="Tentukan status barang." />
              <label className="status-radio-card">
                <input type="radio" name="status" value="active" checked={formData.status === "active"} onChange={updateField} />
                <span className="custom-radio" />
                <span>
                  <strong>Aktif</strong>
                  <small>Barang akan muncul di kasir dan dapat digunakan.</small>
                </span>
              </label>
              <label className="status-radio-card">
                <input type="radio" name="status" value="inactive" checked={formData.status === "inactive"} onChange={updateField} />
                <span className="custom-radio" />
                <span>
                  <strong>Nonaktif</strong>
                  <small>Barang tidak akan muncul di kasir.</small>
                </span>
              </label>
            </div>
          </section>

          <div className="product-form-actions">
            <button className="product-form-cancel" type="button" onClick={closeAddForm}>Batal</button>
            <button className="product-form-submit" type="submit">
              <SvgIcon name="save" size={18} />
              <span>{editingProductId ? "Simpan Perubahan" : "Simpan Barang"}</span>
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="product-stock-page">
      <div className="stock-toolbar">
        <label className="stock-search">
          <span className="sr-only">Cari produk</span>
          <input
            placeholder="Cari nama barang, barcode, atau kategori..."
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <label className="stock-category-filter">
          <span className="sr-only">Filter kategori</span>
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "Semua Kategori" : category}
              </option>
            ))}
          </select>
          <SvgIcon name="chevron" size={16} />
        </label>
        <button className="toolbar-action" type="button" onClick={openImport}><SvgIcon name="upload" size={16} /><span>Import</span></button>
        <button className="toolbar-action" type="button" onClick={openExport}><SvgIcon name="download" size={16} /><span>Export</span></button>
        <button className="add-product" type="button" onClick={openAddForm}>
          Tambah Barang
        </button>
      </div>

      <section className="stock-table-card" aria-label="Daftar produk dan stok">
        <div className="stock-table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Gambar</th>
                <th>Nama Barang</th>
                <th>Barcode</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Min. Stok</th>
                <th>Status</th>
                <th>Harga Jual</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "28px" }}>
                    Memuat data produk...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "28px", color: "#dc2626" }}>
                    {error}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "28px" }}>
                    Belum ada produk.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.no}</td>
                  <td><img src={product.image || productImage} alt="" /></td>
                  <td>{product.name}</td>
                  <td>{product.barcode}</td>
                  <td>{product.category}</td>
                  <td>{product.stock}</td>
                  <td>{product.minStock}</td>
                  <td>
                    <span className={`status-badge ${product.status.toLowerCase()}`}>{product.status}</span>
                  </td>
                  <td>{`Rp. ${Number(product.sellPrice || 0).toLocaleString("id-ID")}`}</td>
                  <td className="action-cell">
                    <div className="row-actions">
                      <button
                        className="row-action-button edit"
                        type="button"
                        onClick={() => editProduct(product)}
                        aria-label={`Edit ${product.name}`}
                      >
                        <SvgIcon name="edit" size={15} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="row-action-button delete"
                        type="button"
                        onClick={() => deleteProduct(product)}
                        aria-label={`Hapus ${product.name}`}
                      >
                        <SvgIcon name="trash" size={15} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        <div className="stock-footer">
          <p>Menampilkan {filteredProducts.length ? 1 : 0} - {Math.min(filteredProducts.length, 5)} dari {filteredProducts.length} barang</p>
          <div className="pagination">
            <button className="active" type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button className="per-page" type="button">5 / halaman</button>
          </div>
        </div>
      </section>

      {activeModal === "import" && (
        <ModalShell
          title="Import Produk & Stok"
          subtitle="Upload file Excel atau CSV untuk menambahkan banyak produk sekaligus."
          icon="upload"
          onClose={closeModal}
          className="import-modal"
          footer={
            importStep === 1 ? (
              <>
                <button className="modal-secondary-button" type="button" onClick={closeModal}>Batal</button>
                <button className="modal-primary-button" type="button" disabled={!importFile} onClick={readImportFile}>
                  <span>Lanjutkan</span><SvgIcon name="arrowRight" size={17} />
                </button>
              </>
            ) : importStep === 2 ? (
              <>
                <button className="modal-secondary-button" type="button" onClick={() => setImportStep(1)}>
                  <SvgIcon name="arrowLeft" size={17} /><span>Kembali</span>
                </button>
                <button className="modal-primary-button" type="button" disabled={importing || importStats.valid === 0} onClick={confirmImport}>
                  <SvgIcon name="upload" size={17} /><span>{importing ? "Mengimport..." : `Import ${importStats.valid} Data`}</span>
                </button>
              </>
            ) : null
          }
        >
          <ImportSteps step={importStep} />

          {importStep === 1 && (
            <>
              <label className={`import-dropzone ${importFile ? "has-file" : ""}`}>
                <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} />
                <span className="import-file-icon"><SvgIcon name={importFile ? "check" : "file"} size={30} /></span>
                <strong>{importFile ? importFile.name : "Pilih file atau tarik dan lepas di sini"}</strong>
                <p>{importFile ? `${(importFile.size / 1024).toFixed(1)} KB siap dipreview` : "Format yang didukung: Excel (.xlsx/.xls) atau CSV (.csv)"}</p>
                {!importFile && <small>Maksimal ukuran file 10 MB</small>}
                <span className="choose-file-button">Pilih File</span>
              </label>
              {importError && (
                <div className="import-error-message">
                  <SvgIcon name="warning" size={16} />
                  <span>{importError}</span>
                </div>
              )}
              <div className="import-template-note">
                <div>
                  <SvgIcon name="file" size={18} />
                  <span>Gunakan template agar struktur kolom sesuai dengan sistem.</span>
                </div>
                <button type="button" onClick={downloadImportTemplate}><SvgIcon name="download" size={16} /> Download Template</button>
              </div>
            </>
          )}

          {importStep === 2 && (
            <>
              <div className="import-summary">
                <div className="import-summary-message">
                  <SvgIcon name="check" size={22} />
                  <div><strong>{importStats.valid} data siap diimport</strong><span>{importStats.error} data bermasalah akan dilewati</span></div>
                </div>
                <div className="import-stat"><span>Total Data</span><strong>{importStats.total}</strong></div>
                <div className="import-stat valid"><span>Valid</span><strong>{importStats.valid}</strong></div>
                <div className="import-stat duplicate"><span>Diimport</span><strong>{importStats.imported}</strong></div>
                <div className="import-stat error"><span>Error</span><strong>{importStats.error}</strong></div>
              </div>

              <div className="import-preview-heading">
                <h3>Preview Data</h3>
                <p>Cek kembali data sebelum diimport. Data duplikat atau error tidak akan diimport.</p>
              </div>
              <div className="import-preview-table-wrap">
                <table className="import-preview-table">
                  <thead>
                    <tr><th>No</th><th>Barcode</th><th>Nama Barang</th><th>Kategori</th><th>Stok</th><th>Harga Jual</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {importRows.map((row) => (
                      <tr key={`preview-${row.no}-${row.product.barcode}`}>
                        <td>{row.no}</td>
                        <td>{row.product.barcode}</td>
                        <td>{row.product.name}</td>
                        <td>{row.product.category}</td>
                        <td>{row.product.stock}</td>
                        <td>{`Rp. ${Number(row.product.sellPrice || 0).toLocaleString("id-ID")}`}</td>
                        <td>
                          <span className={`preview-status ${row.status === "valid" || row.status === "imported" ? "valid" : "duplicate"}`}>
                            <SvgIcon name={row.status === "valid" || row.status === "imported" ? "check" : "warning"} size={13} />
                            {row.message}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {importStep === 3 && (
            <div className="import-processing">
              <span><SvgIcon name="check" size={38} /></span>
              <h3>Import Berhasil</h3>
              <p>Data produk dan stok berhasil ditambahkan ke sistem.</p>
            </div>
          )}
        </ModalShell>
      )}

      {activeModal === "export" && (
        <ModalShell
          title="Export Produk & Stok"
          subtitle="Export data produk dan stok ke file Excel atau CSV."
          icon="download"
          accent="blue"
          onClose={closeModal}
          className="export-modal"
          footer={!exportDone ? (
            <>
              <button className="modal-secondary-button" type="button" onClick={closeModal}>Batal</button>
              <button className="modal-primary-button" type="button" onClick={startExport}>
                <SvgIcon name="download" size={17} /><span>Export Data</span>
              </button>
            </>
          ) : (
            <button className="modal-primary-button" type="button" onClick={closeModal}>Tutup</button>
          )}
        >
          {!exportDone ? (
            <>
              <section className="export-section">
                <h3>Pilih Data yang Diexport</h3>
                <div className="export-options">
                  {[
                    ["all", "file", "Semua Produk", "Export seluruh data produk dan stok"],
                    ["category", "file", "Produk per Kategori", "Export produk berdasarkan kategori tertentu"],
                    ["low", "warning", "Stok Menipis", "Export produk dengan stok ≤ minimum"],
                    ["empty", "warning", "Stok Habis", "Export produk yang stoknya habis (0)"],
                  ].map(([value, icon, title, description]) => (
                    <label className={`export-option ${exportScope === value ? "selected" : ""}`} key={value}>
                      <input type="radio" name="exportScope" value={value} checked={exportScope === value} onChange={() => setExportScope(value)} />
                      <span className="export-radio" />
                      <span className={`export-option-icon ${value === "low" ? "warning" : value === "empty" ? "danger" : ""}`}>
                        <SvgIcon name={icon} size={20} />
                      </span>
                      <span className="export-option-copy"><strong>{title}</strong><small>{description}</small></span>
                    </label>
                  ))}
                </div>
                {exportScope === "category" && (
                  <div className="export-category-select select-wrap">
                    <select value={exportCategory} onChange={(event) => setExportCategory(event.target.value)}>
                      <option value="" disabled>Pilih Kategori</option>
                      {categories.filter((category) => category !== "all").map((category) => (
                        <option key={`export-${category}`} value={category}>{category}</option>
                      ))}
                    </select>
                    <SvgIcon name="chevron" size={18} />
                  </div>
                )}
              </section>

              <section className="export-section export-format-section">
                <h3>Pilih Format File</h3>
                <div className="export-format-grid">
                  <label className={`export-format-card ${exportFormat === "xls" ? "selected" : ""}`}>
                    <input type="radio" name="exportFormat" value="xls" checked={exportFormat === "xls"} onChange={() => setExportFormat("xls")} />
                    <span className="export-radio" /><span className="format-icon excel"><SvgIcon name="excel" size={22} /></span>
                    <strong>Excel (.xls)</strong>
                  </label>
                  <label className={`export-format-card ${exportFormat === "csv" ? "selected" : ""}`}>
                    <input type="radio" name="exportFormat" value="csv" checked={exportFormat === "csv"} onChange={() => setExportFormat("csv")} />
                    <span className="export-radio" /><span className="format-icon"><SvgIcon name="file" size={22} /></span>
                    <strong>CSV (.csv)</strong>
                  </label>
                </div>
              </section>
            </>
          ) : (
            <div className="export-success">
              <span className="export-success-icon"><SvgIcon name="check" size={44} /></span>
              <h3>Export Berhasil!</h3>
              <p>Data produk & stok berhasil diexport.</p>
              <div className="export-file-card">
                <span><SvgIcon name={exportFormat === "xls" ? "excel" : "file"} size={24} /></span>
                <div><strong>produk-stok-{new Date().toISOString().slice(0, 10)}.{exportFormat}</strong><small>{getExportProducts().length} data • siap diunduh</small></div>
                <button type="button" onClick={downloadExportFile}><SvgIcon name="download" size={15} /> Download Lagi</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}
    </section>
  );
}

export default ProductStock;
