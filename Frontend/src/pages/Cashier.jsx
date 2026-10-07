import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../style/Cashier.css";

import productStoreImage from "../assets/images/product-store.svg";

import {
  getProducts,
} from "../services/productService.js";

import {
  createTransaction,
} from "../services/transactionService.js";

import {
  getMembers,
} from "../services/memberService.js";

import {
  getMemberDiscount,
} from "../services/settingService.js";


/* =========================================================
   FORMAT RUPIAH
   ========================================================= */

const rupiah = (value) =>
  `Rp. ${Number(
    value || 0
  ).toLocaleString("id-ID")}`;


/* =========================================================
   SVG ICON
   ========================================================= */

const SvgIcon = ({
  name,
  size = 18,
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    search: (
      <svg {...common}>
        <circle
          cx="11"
          cy="11"
          r="7"
        />
        <path d="m20 20-4-4" />
      </svg>
    ),

    barcode: (
      <svg {...common}>
        <path d="M4 5v14M7 5v14M10 5v14M14 5v14M17 5v14M20 5v14" />
      </svg>
    ),

    user: (
      <svg {...common}>
        <circle
          cx="12"
          cy="8"
          r="4"
        />

        <path d="M4 20c0-4.2 3.6-7 8-7s8 2.8 8 7" />
      </svg>
    ),

    phone: (
      <svg {...common}>
        <path d="M6.5 3 9 7.5 7 9.5c1.2 2.6 3.3 4.7 5.9 5.9l2-2 4.5 2.5c.5.3.7.8.5 1.4l-1 3c-.2.7-.9 1.1-1.7 1C8.8 20.5 3.5 15.2 2.7 6.8c-.1-.8.3-1.5 1-1.7l3-1c.6-.2 1.1 0 1.4.5Z" />
      </svg>
    ),

    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),

    cart: (
      <svg {...common}>
        <circle
          cx="9"
          cy="20"
          r="1"
        />

        <circle
          cx="18"
          cy="20"
          r="1"
        />

        <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 1.9-1.4L21 8H7" />
      </svg>
    ),

    trash: (
      <svg {...common}>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      </svg>
    ),

    printer: (
      <svg {...common}>
        <path d="M6 9V3h12v6" />

        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />

        <path d="M6 14h12v7H6z" />
      </svg>
    ),

    save: (
      <svg {...common}>
        <path d="M5 3h12l2 2v16H5z" />

        <path d="M8 3v6h8V3M8 21v-7h8v7" />
      </svg>
    ),

    receipt: (
      <svg {...common}>
        <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" />

        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    ),

    money: (
      <svg {...common}>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <circle
          cx="12"
          cy="12"
          r="3"
        />

        <path d="M7 9h.01M17 15h.01" />
      </svg>
    ),
  };

  return icons[name] || null;
};


/* =========================================================
   CASHIER
   ========================================================= */

function Cashier() {
  /* =======================================================
     PRODUCT
     ======================================================= */

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(true);

  const [
    productError,
    setProductError,
  ] = useState("");


  /* =======================================================
     FILTER
     ======================================================= */

  const [
    activeCategory,
    setActiveCategory,
  ] = useState("Semua");

  const [
    query,
    setQuery,
  ] = useState("");


  /* =======================================================
     CART
     ======================================================= */

  const [
    cart,
    setCart,
  ] = useState([]);


  /* =======================================================
     MEMBER
     ======================================================= */

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    loadingMembers,
    setLoadingMembers,
  ] = useState(true);

  const [
    memberError,
    setMemberError,
  ] = useState("");

  const [
    selectedMemberCode,
    setSelectedMemberCode,
  ] = useState("");

  const [
    memberDiscountAmount,
    setMemberDiscountAmount,
  ] = useState(0);


  /* =======================================================
     PAYMENT
     ======================================================= */

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("Tunai");

  const [
    paidAmount,
    setPaidAmount,
  ] = useState("");


  /* =======================================================
     BON NON MEMBER
     ======================================================= */

  const [
    guestBonName,
    setGuestBonName,
  ] = useState("");

  const [
    guestBonPhone,
    setGuestBonPhone,
  ] = useState("");

  const [
    savingTransaction,
    setSavingTransaction,
  ] = useState(false);


  /* =======================================================
     LOAD PRODUCTS
     ======================================================= */

  const loadCashierProducts =
    async () => {
      try {
        setLoadingProducts(true);

        setProductError("");

        const data =
          await getProducts({
            active: true,
          });

        setProducts(data);
      } catch (error) {
        console.error(
          "Gagal mengambil produk:",
          error
        );

        setProductError(
          error.message ||
            "Gagal mengambil produk."
        );
      } finally {
        setLoadingProducts(false);
      }
    };


  useEffect(() => {
    loadCashierProducts();
  }, []);


  const loadMemberDiscount =
    async () => {
      try {
        const data =
          await getMemberDiscount();

        setMemberDiscountAmount(
          Number(
            data.amount ||
            0
          )
        );

      } catch (error) {
        console.error(
          "Gagal mengambil potongan member:",
          error
        );

        setMemberDiscountAmount(0);
      }
    };


  useEffect(() => {
    loadMemberDiscount();
  }, []);


  /* =======================================================
     LOAD MEMBERS
     ======================================================= */

  const loadCashierMembers =
    async () => {
      try {
        setLoadingMembers(true);
        setMemberError("");

        const data =
          await getMembers({
            status: "Aktif",
          });

        setMembers(data);

      } catch (error) {
        console.error(
          "Gagal mengambil member:",
          error
        );

        setMemberError(
          error.message ||
            "Gagal mengambil data member."
        );

      } finally {
        setLoadingMembers(false);
      }
    };


  useEffect(() => {
    loadCashierMembers();
  }, []);


  /* =======================================================
     MEMBER
     ======================================================= */

  const selectedMember =
    members.find(
      (member) =>
        member.code ===
        selectedMemberCode
    ) || null;

  const isMember =
    Boolean(selectedMember);

  const isBon =
    paymentMethod ===
    "Bon / Piutang";


  /* =======================================================
     CATEGORY
     ======================================================= */

  const categories =
    useMemo(() => {
      return [
        "Semua",

        ...new Set(
          products
            .map(
              (product) =>
                product.category
            )
            .filter(Boolean)
        ),
      ];
    }, [products]);


  /* =======================================================
     FILTER PRODUCT
     ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const keyword =
        query
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchCategory =
            activeCategory ===
              "Semua" ||
            product.category ===
              activeCategory;

          const matchSearch =
            !keyword ||
            product.name
              ?.toLowerCase()
              .includes(keyword) ||
            product.barcode
              ?.toLowerCase()
              .includes(keyword);

          return (
            matchCategory &&
            matchSearch
          );
        }
      );
    }, [
      products,
      activeCategory,
      query,
    ]);


  /* =======================================================
     CART DETAIL
     ======================================================= */

  const cartDetails =
    useMemo(() => {
      return cart
        .map((item) => {
          const product =
            products.find(
              (productItem) =>
                productItem.id ===
                item.productId
            );

          if (!product) {
            return null;
          }

          const normalPrice =
            Number(
              product.sellPrice || 0
            );

          const unitPrice =
            normalPrice;

          return {
            ...item,

            product,

            normalPrice,

            discountPerItem: 0,

            unitPrice,

            total:
              unitPrice *
              item.qty,
          };
        })
        .filter(Boolean);
    }, [
      cart,
      products,
    ]);


  /* =======================================================
     TOTAL
     ======================================================= */

  const subtotalNormal =
    cartDetails.reduce(
      (sum, item) =>
        sum +
        item.normalPrice *
          item.qty,
      0
    );

  const memberDiscount =
    isMember
      ? Math.min(
          memberDiscountAmount,
          subtotalNormal
        )
      : 0;


  const total =
    Math.max(
      subtotalNormal -
        memberDiscount,
      0
    );


  /* =======================================================
     PAYMENT CALCULATION
     ======================================================= */

  const paid =
    Number(
      paidAmount || 0
    );


  /* TUNAI */

  const cashChange =
    paymentMethod === "Tunai"
      ? Math.max(
          paid - total,
          0
        )
      : 0;


  const cashShortage =
    paymentMethod === "Tunai"
      ? Math.max(
          total - paid,
          0
        )
      : 0;


  /* BON */

  const remainingBon =
    isBon
      ? Math.max(
          total -
            Math.min(
              paid,
              total
            ),
          0
        )
      : 0;


  const bonStatus =
    paid <= 0
      ? "Belum Bayar"
      : remainingBon > 0
        ? "Sebagian"
        : "Lunas";


  const bonCustomerValid =
    Boolean(selectedMember) ||
    (
      guestBonName.trim() !== "" &&
      guestBonPhone.trim() !== ""
    );


  /* TUNAI HARUS CUKUP */

  const cashPaymentValid =
    paymentMethod !== "Tunai" ||
    paid >= total;


  /* BUTTON SAVE */

  const canSave =
    cartDetails.length > 0 &&
    cashPaymentValid &&
    (
      !isBon ||
      bonCustomerValid
    );


  /* =======================================================
     ADD TO CART
     ======================================================= */

  const addToCart =
    (product) => {
      const stock =
        Number(
          product.stock || 0
        );

      if (stock <= 0) {
        return;
      }

      setCart(
        (current) => {
          const existing =
            current.find(
              (item) =>
                item.productId ===
                product.id
            );

          if (existing) {
            return current.map(
              (item) =>
                item.productId ===
                product.id
                  ? {
                      ...item,

                      qty:
                        Math.min(
                          item.qty +
                            1,

                          stock
                        ),
                    }
                  : item
            );
          }

          return [
            ...current,

            {
              productId:
                product.id,

              qty: 1,
            },
          ];
        }
      );
    };


  /* =======================================================
     UPDATE QTY
     ======================================================= */

  const updateQty = (
    productId,
    direction
  ) => {
    setCart(
      (current) =>
        current
          .map((item) => {
            if (
              item.productId !==
              productId
            ) {
              return item;
            }

            const product =
              products.find(
                (productItem) =>
                  productItem.id ===
                  productId
              );

            const stock =
              Number(
                product?.stock || 0
              );

            const nextQty =
              direction === "plus"
                ? Math.min(
                    item.qty + 1,
                    stock
                  )
                : item.qty - 1;

            return {
              ...item,
              qty: nextQty,
            };
          })
          .filter(
            (item) =>
              item.qty > 0
          )
    );
  };


  /* =======================================================
     CLEAR CART
     ======================================================= */

  const clearCart = () => {
    setCart([]);

    setPaidAmount("");
  };


  /* =======================================================
     SCAN BARCODE
     ======================================================= */

  const handleSearchKeyDown =
    (event) => {
      if (
        event.key !== "Enter"
      ) {
        return;
      }

      const barcode =
        query.trim();

      const exact =
        products.find(
          (product) =>
            product.barcode ===
            barcode
        );

      if (!exact) {
        return;
      }

      if (
        Number(
          exact.stock || 0
        ) <= 0
      ) {
        window.alert(
          "Stok barang habis."
        );

        return;
      }

      addToCart(exact);

      setQuery("");
    };


  /* =======================================================
     PAYMENT METHOD
     ======================================================= */

  const choosePaymentMethod =
    (method) => {
      setPaymentMethod(method);

      setPaidAmount("");

      if (
        method !==
        "Bon / Piutang"
      ) {
        setGuestBonName("");

        setGuestBonPhone("");
      }
    };


  /* =======================================================
     MEMBER CHANGE
     ======================================================= */

  const handleMemberChange =
    (value) => {
      setSelectedMemberCode(
        value
      );

      if (value) {
        setGuestBonName("");

        setGuestBonPhone("");
      }
    };


  /* =======================================================
     PRINT RECEIPT
     ======================================================= */

  const handlePrintReceipt =
    () => {
      if (
        cartDetails.length === 0
      ) {
        window.alert(
          "Keranjang masih kosong."
        );

        return;
      }


      const customerName =
        selectedMember
          ? selectedMember.name

          : isBon
            ? (
                guestBonName.trim() ||
                "Pelanggan"
              )

            : "Pelanggan Umum";


      const receiptItems =
        cartDetails
          .map(
            (item) => `
              <tr>
                <td>
                  <strong>
                    ${item.product.name}
                  </strong>

                  <div class="item-detail">
                    ${item.qty}
                    x
                    ${rupiah(
                      item.unitPrice
                    )}
                  </div>
                </td>

                <td class="right">
                  ${rupiah(
                    item.total
                  )}
                </td>
              </tr>
            `
          )
          .join("");


      const paymentValue =
        paymentMethod ===
        "Tunai"
          ? paid

          : isBon
            ? Math.min(
                paid,
                total
              )

            : total;


      const printWindow =
        window.open(
          "",
          "_blank",
          "width=420,height=700"
        );


      if (!printWindow) {
        window.alert(
          "Popup print diblokir browser. Izinkan popup untuk website POS."
        );

        return;
      }


      printWindow.document.write(`
        <!DOCTYPE html>

        <html lang="id">
          <head>
            <meta charset="UTF-8" />

            <title>
              Struk Pembelian
            </title>

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                width: 80mm;
                margin: 0 auto;
                padding: 12px;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
                font-size: 12px;
                color: #111;
              }

              h1 {
                margin: 0;
                text-align: center;
                font-size: 18px;
              }

              .subtitle {
                margin-top: 4px;
                text-align: center;
                font-size: 11px;
              }

              .divider {
                margin: 10px 0;
                border-top:
                  1px dashed #555;
              }

              .meta {
                display: grid;
                gap: 4px;
              }

              .meta-row {
                display: flex;
                justify-content:
                  space-between;
                gap: 12px;
              }

              table {
                width: 100%;
                border-collapse:
                  collapse;
              }

              td {
                padding: 5px 0;
                vertical-align: top;
              }

              .right {
                text-align: right;
                white-space: nowrap;
              }

              .item-detail {
                margin-top: 2px;
                font-size: 10px;
                color: #555;
              }

              .summary {
                display: grid;
                gap: 5px;
              }

              .summary-row {
                display: flex;
                justify-content:
                  space-between;
                gap: 10px;
              }

              .summary-total {
                padding-top: 6px;
                margin-top: 4px;
                border-top:
                  1px solid #111;
                font-size: 14px;
                font-weight: 700;
              }

              .footer {
                margin-top: 14px;
                text-align: center;
                font-size: 11px;
                line-height: 1.5;
              }

              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }

                body {
                  width: 80mm;
                }
              }
            </style>
          </head>

          <body>

            <h1>
              Toko Sembako
            </h1>

            <div class="subtitle">
              Struk Pembelian
            </div>

            <div class="divider"></div>


            <div class="meta">

              <div class="meta-row">
                <span>
                  Tanggal
                </span>

                <strong>
                  ${new Date().toLocaleString(
                    "id-ID"
                  )}
                </strong>
              </div>


              <div class="meta-row">
                <span>
                  Pelanggan
                </span>

                <strong>
                  ${customerName}
                </strong>
              </div>


              <div class="meta-row">
                <span>
                  Pembayaran
                </span>

                <strong>
                  ${paymentMethod}
                </strong>
              </div>

            </div>


            <div class="divider"></div>


            <table>
              <tbody>
                ${receiptItems}
              </tbody>
            </table>


            <div class="divider"></div>


            <div class="summary">

              <div class="summary-row">
                <span>
                  Subtotal
                </span>

                <strong>
                  ${rupiah(
                    subtotalNormal
                  )}
                </strong>
              </div>


              ${
                memberDiscount > 0
                  ? `
                    <div class="summary-row">
                      <span>
                        Potongan Member
                      </span>

                      <strong>
                        - ${rupiah(
                          memberDiscount
                        )}
                      </strong>
                    </div>
                  `
                  : ""
              }


              <div class="
                summary-row
                summary-total
              ">
                <span>
                  Total
                </span>

                <strong>
                  ${rupiah(total)}
                </strong>
              </div>


              <div class="summary-row">
                <span>
                  Dibayar
                </span>

                <strong>
                  ${rupiah(
                    paymentValue
                  )}
                </strong>
              </div>


              ${
                paymentMethod ===
                "Tunai"
                  ? `
                    <div class="summary-row">
                      <span>
                        Kembalian
                      </span>

                      <strong>
                        ${rupiah(
                          cashChange
                        )}
                      </strong>
                    </div>
                  `
                  : ""
              }


              ${
                isBon
                  ? `
                    <div class="summary-row">
                      <span>
                        Sisa Bon
                      </span>

                      <strong>
                        ${rupiah(
                          remainingBon
                        )}
                      </strong>
                    </div>
                  `
                  : ""
              }

            </div>


            <div class="divider"></div>


            <div class="footer">
              Terima kasih
              telah berbelanja.

              <br />

              Barang yang sudah
              dibeli harap
              diperiksa kembali.
            </div>

          </body>
        </html>
      `);


      printWindow.document.close();

      printWindow.focus();


      setTimeout(
        () => {
          printWindow.print();

          printWindow.close();
        },
        300
      );
    };


  /* =======================================================
     SAVE TRANSACTION
     ======================================================= */

  const handleSaveTransaction =
    async () => {
      if (
        !canSave ||
        savingTransaction
      ) {
        return;
      }

      try {
        setSavingTransaction(true);

        const customerType =
          selectedMember
            ? "member"
            : "guest";

        const customerName =
          selectedMember
            ? selectedMember.name
            : isBon
              ? guestBonName.trim()
              : "Pelanggan Umum";

        const customerPhone =
          selectedMember
            ? selectedMember.phone
            : isBon
              ? guestBonPhone.trim()
              : null;

        let transactionPaid =
          total;

        if (
          paymentMethod ===
          "Tunai"
        ) {
          transactionPaid =
            paid;
        }

        if (isBon) {
          transactionPaid =
            Math.min(
              paid,
              total
            );
        }

        const payload = {
          memberId:
            selectedMember?.id ||
            null,

          customerType,

          customerName,

          customerPhone,

          paymentMethod,

          discount:
            memberDiscount,

          paid:
            transactionPaid,

          items:
            cartDetails.map(
              (item) => ({
                productId:
                  item.product.id,

                quantity:
                  item.qty,

                sellingPrice:
                  item.normalPrice,

                discount: 0,
              })
            ),
        };

        console.log(
          "PAYLOAD TRANSAKSI:",
          payload
        );

        const saved =
          await createTransaction(
            payload
          );

        console.log(
          "TRANSAKSI BERHASIL DISIMPAN:",
          saved
        );

        let message =
          "Transaksi berhasil disimpan.";

        if (
          paymentMethod ===
          "Tunai"
        ) {
          message +=
            `\nKembalian: ${rupiah(
              cashChange
            )}`;
        }

        if (isBon) {
          message +=
            `\nSisa Bon: ${rupiah(
              remainingBon
            )}`;
        }

        window.alert(message);

        setCart([]);
        setPaidAmount("");
        setGuestBonName("");
        setGuestBonPhone("");
        setSelectedMemberCode("");
        setPaymentMethod("Tunai");
        setQuery("");
        setActiveCategory("Semua");

        await loadCashierProducts();
        await loadMemberDiscount();

      } catch (error) {
        console.error(
          "Gagal menyimpan transaksi:",
          error
        );

        window.alert(
          error.message ||
            "Gagal menyimpan transaksi."
        );

      } finally {
        setSavingTransaction(false);
      }
    };


  /* =======================================================
     UI
     ======================================================= */

  return (
    <section className="cashier-page">

      {/* ===================================================
          LEFT / PRODUCT
          =================================================== */}

      <div className="cashier-left">

        {/* SEARCH */}

        <label className="barcode-search">

          <span className="sr-only">
            Cari barang
          </span>

          <SvgIcon
            name="barcode"
            size={20}
          />

          <input
            placeholder="Scan barcode atau ketik nama barang..."
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            onKeyDown={
              handleSearchKeyDown
            }
          />

          <span className="scan-hint">
            Enter untuk scan
          </span>

        </label>


        {/* CATEGORY */}

        <div
          className="category-list"
          aria-label="Kategori barang"
        >

          {categories.map(
            (category) => (
              <button
                className={
                  activeCategory ===
                  category
                    ? "active"
                    : ""
                }
                key={category}
                type="button"
                onClick={() =>
                  setActiveCategory(
                    category
                  )
                }
              >
                {category}
              </button>
            )
          )}

        </div>


        {/* LOADING */}

        {loadingProducts && (
          <div
            style={{
              padding: "40px",
              textAlign:
                "center",
            }}
          >
            Memuat produk...
          </div>
        )}


        {/* ERROR */}

        {!loadingProducts &&
          productError && (
            <div
              style={{
                padding: "30px",
                textAlign:
                  "center",
                color:
                  "#dc2626",
              }}
            >
              {productError}

              <br />

              <button
                type="button"
                onClick={
                  loadCashierProducts
                }
              >
                Coba Lagi
              </button>
            </div>
          )}


        {/* PRODUCT GRID */}

        {!loadingProducts &&
          !productError && (
            <div className="product-grid">

              {filteredProducts.map(
                (product) => {
                  const stock =
                    Number(
                      product.stock ||
                        0
                    );

                  const outOfStock =
                    stock <= 0;


                  return (
                    <button
                      className={`product-card ${
                        outOfStock
                          ? "out-of-stock"
                          : ""
                      }`}
                      key={
                        product.id
                      }
                      type="button"
                      disabled={
                        outOfStock
                      }
                      onClick={() =>
                        addToCart(
                          product
                        )
                      }
                    >

                      {/* IMAGE */}

                      <img
                        className="product-thumb"
                        src={
                          product.image ||
                          productStoreImage
                        }
                        alt={
                          product.name
                        }
                        referrerPolicy="no-referrer"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            productStoreImage;
                        }}
                      />


                      {/* NAME */}

                      <h2>
                        {product.name}
                      </h2>


                      {/* PRICE */}

                      <strong>
                        {rupiah(
                          product.sellPrice
                        )}
                      </strong>


                      {/* STOCK */}

                      <p>
                        {outOfStock
                          ? "Stok Habis"
                          : `Stok ${stock} ${
                              product.unit ||
                              "pcs"
                            }`}
                      </p>

                    </button>
                  );
                }
              )}

            </div>
          )}

      </div>


      {/* ===================================================
          CART
          =================================================== */}

      <aside className="cart-panel">

        {/* HEADER */}

        <div className="cart-title-row">

          <div className="cart-title-group">
            <h2>
              Keranjang Belanja
            </h2>

            <span>
              {
                cartDetails.length
              }
            </span>
          </div>


          <button
            className="clear-cart"
            type="button"
            onClick={
              clearCart
            }
          >
            <SvgIcon
              name="trash"
              size={14}
            />

            Kosongkan
          </button>

        </div>


        {/* CART TABLE */}

        <div className="cart-table">

          <div className="cart-head cart-row">
            <span>
              Nama Barang
            </span>

            <span>
              Qty
            </span>

            <span>
              Harga
            </span>

            <span>
              Total
            </span>
          </div>


          {cartDetails.length ===
          0 ? (
            <div className="cart-empty">

              <SvgIcon
                name="cart"
                size={27}
              />

              <span>
                Keranjang masih kosong
              </span>

            </div>
          ) : (
            cartDetails.map(
              (item) => (
                <div
                  className="cart-row"
                  key={
                    item.productId
                  }
                >

                  <span className="cart-product-name">
                    {
                      item.product
                        .name
                    }


                  </span>


                  <div className="qty-control">

                    <button
                      type="button"
                      onClick={() =>
                        updateQty(
                          item.productId,
                          "minus"
                        )
                      }
                    >
                      −
                    </button>


                    <span>
                      {item.qty}
                    </span>


                    <button
                      type="button"
                      onClick={() =>
                        updateQty(
                          item.productId,
                          "plus"
                        )
                      }
                    >
                      +
                    </button>

                  </div>


                  <span className="muted-price">
                    {rupiah(
                      item.unitPrice
                    )}
                  </span>


                  <strong>
                    {rupiah(
                      item.total
                    )}
                  </strong>

                </div>
              )
            )
          )}

        </div>


        {/* =================================================
            MEMBER
            ================================================= */}

        <div className="member-row">

          <h3>
            Pelanggan / Member
          </h3>

          <button type="button">

            <SvgIcon
              name="plus"
              size={13}
            />

            Baru

          </button>

        </div>


        <label className="member-select-wrap">

          <SvgIcon
            name="user"
            size={16}
          />

          <select
            className="member-select"
            value={
              selectedMemberCode
            }
            onChange={(event) =>
              handleMemberChange(
                event.target.value
              )
            }
            disabled={
              loadingMembers
            }
          >

            <option value="">
              {loadingMembers
                ? "Memuat member..."
                : "Umum / Non Member"}
            </option>


            {members.map(
              (member) => (
                <option
                  key={
                    member.id
                  }
                  value={
                    member.code
                  }
                >
                  {member.name}
                  {" — "}
                  {member.code}
                </option>
              )
            )}

          </select>

        </label>


        {memberError && (
          <div
            style={{
              marginTop: "8px",
              padding: "9px 11px",
              borderRadius: "8px",
              background: "#fff5f5",
              color: "#c53030",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {memberError}

            <button
              type="button"
              onClick={
                loadCashierMembers
              }
              style={{
                marginLeft: "8px",
              }}
            >
              Coba Lagi
            </button>
          </div>
        )}


        {selectedMember && (
          <div className="member-selected-info">

            <div>
              <strong>
                {
                  selectedMember.name
                }
              </strong>

              <span>
                {
                  selectedMember.phone
                }
              </span>
            </div>


            <span className="member-price-badge">
              Member Aktif · Potongan {rupiah(
                memberDiscountAmount
              )}
            </span>

          </div>
        )}


        {/* =================================================
            SUMMARY
            ================================================= */}

        <div className="payment-summary">

          <h3>
            Ringkasan Pembayaran
          </h3>


          <dl>

            <div>
              <dt>
                Subtotal
              </dt>

              <dd>
                {rupiah(
                  subtotalNormal
                )}
              </dd>
            </div>


            <div>
              <dt>
                Potongan Member
              </dt>

              <dd
                className={
                  memberDiscount > 0
                    ? "discount-value"
                    : ""
                }
              >
                {memberDiscount >
                0
                  ? `- ${rupiah(
                      memberDiscount
                    )}`
                  : rupiah(0)}
              </dd>
            </div>


            <div className="summary-total">
              <dt>
                Total
              </dt>

              <dd>
                {rupiah(total)}
              </dd>
            </div>

          </dl>

        </div>


        {/* =================================================
            PAYMENT METHODS
            ================================================= */}

        <div className="payment-methods">

          <h3>
            Metode Pembayaran
          </h3>


          <div>

            {[
              "Tunai",
              "QRIS",
              "Transfer",
              "Bon / Piutang",
            ].map(
              (method) => (
                <button
                  className={
                    paymentMethod ===
                    method
                      ? "active"
                      : ""
                  }
                  key={method}
                  type="button"
                  onClick={() =>
                    choosePaymentMethod(
                      method
                    )
                  }
                >
                  {method}
                </button>
              )
            )}

          </div>

        </div>


        {/* =================================================
            CASH PAYMENT
            ================================================= */}

        {paymentMethod ===
          "Tunai" && (
          <div className="bon-payment-box">

            <div className="bon-title">

              <div>
                <SvgIcon
                  name="money"
                  size={17}
                />

                <strong>
                  Pembayaran Tunai
                </strong>
              </div>

            </div>


            <label className="paid-input">

              <span>
                Uang Dibayar
              </span>


              <div>

                <span>
                  Rp.
                </span>


                <input
                  type="number"
                  min="0"
                  value={
                    paidAmount
                  }
                  onChange={(
                    event
                  ) =>
                    setPaidAmount(
                      event.target
                        .value
                    )
                  }
                  placeholder="0"
                />

              </div>

            </label>


            {/* UANG KURANG */}

            {paid > 0 &&
              paid < total && (
                <div
                  style={{
                    padding:
                      "10px 12px",
                    borderRadius:
                      "8px",
                    background:
                      "#fff5f5",
                    color:
                      "#c53030",
                    fontSize:
                      "13px",
                    fontWeight:
                      "600",
                  }}
                >
                  Uang kurang{" "}
                  {rupiah(
                    cashShortage
                  )}
                </div>
              )}


            {/* KEMBALIAN */}

            <div className="bon-summary">

              <span>
                Kembalian
              </span>


              <strong>
                {rupiah(
                  cashChange
                )}
              </strong>

            </div>

          </div>
        )}


        {/* =================================================
            BON
            ================================================= */}

        {isBon && (
          <div className="bon-payment-box">

            <div className="bon-title">

              <div>
                <SvgIcon
                  name="receipt"
                  size={17}
                />

                <strong>
                  Bon / Piutang
                </strong>
              </div>


              <span
                className={`bon-status ${bonStatus
                  .toLowerCase()
                  .replace(
                    " ",
                    "-"
                  )}`}
              >
                {bonStatus}
              </span>

            </div>


            {/* NON MEMBER */}

            {!selectedMember && (
              <div className="guest-bon-form">

                <div className="guest-bon-heading">

                  <strong>
                    Data Pelanggan
                    Non Member
                  </strong>

                  <span>
                    Isi nama dan nomor
                    HP agar bon dapat
                    disimpan.
                  </span>

                </div>


                <label className="guest-bon-field">

                  <span>
                    Nama Pelanggan *
                  </span>


                  <div>

                    <SvgIcon
                      name="user"
                      size={15}
                    />

                    <input
                      type="text"
                      value={
                        guestBonName
                      }
                      onChange={(
                        event
                      ) =>
                        setGuestBonName(
                          event.target
                            .value
                        )
                      }
                      placeholder="Contoh: Pak Joko"
                    />

                  </div>

                </label>


                <label className="guest-bon-field">

                  <span>
                    Nomor HP *
                  </span>


                  <div>

                    <SvgIcon
                      name="phone"
                      size={15}
                    />

                    <input
                      type="tel"
                      value={
                        guestBonPhone
                      }
                      onChange={(
                        event
                      ) =>
                        setGuestBonPhone(
                          event.target
                            .value
                        )
                      }
                      placeholder="08xxxxxxxxxx"
                    />

                  </div>

                </label>

              </div>
            )}


            {/* MEMBER BON */}

            {selectedMember && (
              <div className="bon-customer-member">

                <div>
                  <span>
                    Pelanggan Bon
                  </span>

                  <strong>
                    {
                      selectedMember.name
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    No. HP
                  </span>

                  <strong>
                    {
                      selectedMember.phone
                    }
                  </strong>
                </div>

              </div>
            )}


            {/* BAYAR BON */}

            <label className="paid-input">

              <span>
                Uang Dibayar Sekarang
              </span>


              <div>

                <span>
                  Rp.
                </span>


                <input
                  type="number"
                  min="0"
                  max={total}
                  value={
                    paidAmount
                  }
                  onChange={(
                    event
                  ) =>
                    setPaidAmount(
                      event.target
                        .value
                    )
                  }
                  placeholder="0"
                />

              </div>

            </label>


            {/* SISA BON */}

            <div className="bon-summary">

              <span>
                Sisa masuk bon
              </span>


              <strong>
                {rupiah(
                  remainingBon
                )}
              </strong>

            </div>

          </div>
        )}


        {/* =================================================
            ACTION BUTTON
            ================================================= */}

        <div className="cart-actions">

          {/* PRINT */}

          <button
            className="print-button"
            type="button"
            aria-label="Cetak struk"
            disabled={
              cartDetails.length ===
              0
            }
            onClick={
              handlePrintReceipt
            }
          >

            <SvgIcon
              name="printer"
              size={21}
            />

          </button>


          {/* SAVE */}

          <button
            className="save-transaction"
            type="button"
            disabled={
              !canSave ||
              savingTransaction
            }
            onClick={
              handleSaveTransaction
            }
          >

            <SvgIcon
              name="save"
              size={17}
            />


            {savingTransaction
              ? "Menyimpan..."

              : isBon
                ? "Simpan Transaksi & Bon"

                : "Simpan Transaksi"}

          </button>

        </div>

      </aside>

    </section>
  );
}


export default Cashier;