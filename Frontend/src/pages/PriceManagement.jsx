import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../style/PriceManagement.css";

import {
  getProducts,
} from "../services/productService.js";

import {
  getPriceHistory,
  updatePrice,
} from "../services/priceService.js";


const rupiah = (value) =>
  `Rp. ${Number(
    value || 0
  ).toLocaleString("id-ID")}`;


const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};


const todayInputValue = () => {
  const date =
    new Date();

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
};


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
    tag: (
      <svg {...common}>
        <path d="M20 13 13 20l-9-9V4h7z" />
        <circle
          cx="8.5"
          cy="8.5"
          r="1.5"
        />
      </svg>
    ),

    box: (
      <svg {...common}>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </svg>
    ),

    chart: (
      <svg {...common}>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),

    calendar: (
      <svg {...common}>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    ),

    note: (
      <svg {...common}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4M9 11h6M9 15h6" />
      </svg>
    ),

    edit: (
      <svg {...common}>
        <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16z" />
        <path d="m13.5 6.5 4 4" />
      </svg>
    ),

    save: (
      <svg {...common}>
        <path d="M5 3h12l2 2v16H5z" />
        <path d="M8 3v6h8V3M8 21v-7h8v7" />
      </svg>
    ),

    close: (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    ),

    info: (
      <svg {...common}>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="M12 10v6M12 7h.01" />
      </svg>
    ),

    arrowUp: (
      <svg {...common}>
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    ),

    arrowDown: (
      <svg {...common}>
        <path d="m7 7 10 10M9 17h8V9" />
      </svg>
    ),

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
  };

  return icons[name] || null;
};


function PriceManagement() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState(
    "Semua Kategori"
  );

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState(null);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    newBuyPrice,
    setNewBuyPrice,
  ] = useState("");

  const [
    newSellPrice,
    setNewSellPrice,
  ] = useState("");

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    effectiveDate,
    setEffectiveDate,
  ] = useState(
    todayInputValue()
  );

  const [
    saving,
    setSaving,
  ] = useState(false);


  const loadData =
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          productData,
          historyData,
        ] =
          await Promise.all([
            getProducts({
              active: true,
            }),

            getPriceHistory(),
          ]);

        setProducts(
          productData
        );

        setHistory(
          historyData
        );

      } catch (err) {
        console.error(
          "Gagal mengambil manajemen harga:",
          err
        );

        setError(
          err.message ||
            "Gagal mengambil data harga."
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadData();
  }, []);


  const latestHistoryByProduct =
    useMemo(() => {
      const map =
        new Map();

      history.forEach(
        (item) => {
          const key =
            Number(
              item.productId
            );

          const current =
            map.get(key);

          if (!current) {
            map.set(
              key,
              item
            );

            return;
          }

          const currentTime =
            new Date(
              current.createdAt ||
              0
            ).getTime();

          const itemTime =
            new Date(
              item.createdAt ||
              0
            ).getTime();

          if (
            itemTime >
            currentTime
          ) {
            map.set(
              key,
              item
            );
          }
        }
      );

      return map;
    }, [history]);


  const priceRows =
    useMemo(() => {
      return products.map(
        (
          product,
          index
        ) => {
          const latest =
            latestHistoryByProduct.get(
              Number(
                product.id
              )
            );

          return {
            ...product,

            no:
              index + 1,

            buy:
              Number(
                product.buyPrice ||
                0
              ),

            sell:
              Number(
                product.sellPrice ||
                0
              ),

            update:
              latest?.createdAt ||
              product.updatedAt ||
              product.updated_at ||
              null,

            updatedBy:
              latest?.changedBy ||
              "Admin",

            reason:
              latest?.reason ||
              "",
          };
        }
      );
    }, [
      products,
      latestHistoryByProduct,
    ]);


  const categories =
    useMemo(() => {
      return [
        "Semua Kategori",

        ...new Set(
          priceRows
            .map(
              (item) =>
                item.category
            )
            .filter(Boolean)
        ),
      ];
    }, [priceRows]);


  const filteredPrices =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return priceRows.filter(
        (item) => {
          const searchable =
            `${item.name} ${item.barcode} ${item.category}`
              .toLowerCase();

          const matchSearch =
            !keyword ||
            searchable.includes(
              keyword
            );

          const matchCategory =
            category ===
              "Semua Kategori" ||
            item.category ===
              category;

          return (
            matchSearch &&
            matchCategory
          );
        }
      );
    }, [
      priceRows,
      search,
      category,
    ]);


  const selectedProduct =
    priceRows.find(
      (item) =>
        item.id ===
        selectedProductId
    ) || null;


  const currentBuyPrice =
    selectedProduct?.buy ||
    0;

  const currentSellPrice =
    selectedProduct?.sell ||
    0;

  const numericNewBuyPrice =
    Number(
      newBuyPrice || 0
    );

  const numericNewSellPrice =
    Number(
      newSellPrice || 0
    );

  const difference =
    numericNewSellPrice -
    currentSellPrice;

  const percentage =
    currentSellPrice > 0
      ? (
          difference /
          currentSellPrice
        ) * 100
      : 0;


  const openUpdateForm =
    (product) => {
      const target =
        product ||
        priceRows[0];

      if (!target) {
        window.alert(
          "Belum ada produk yang dapat diubah."
        );

        return;
      }

      setSelectedProductId(
        target.id
      );

      setNewBuyPrice(
        String(
          target.buy || 0
        )
      );

      setNewSellPrice(
        String(
          target.sell || 0
        )
      );

      setReason("");

      setEffectiveDate(
        todayInputValue()
      );

      setShowForm(true);
    };


  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);

    setSelectedProductId(
      null
    );

    setNewBuyPrice("");

    setNewSellPrice("");

    setReason("");
  };


  const handleSelectProduct =
    (productId) => {
      const id =
        Number(
          productId
        );

      const product =
        priceRows.find(
          (item) =>
            Number(
              item.id
            ) === id
        );

      if (!product) {
        return;
      }

      setSelectedProductId(
        product.id
      );

      setNewBuyPrice(
        String(
          product.buy || 0
        )
      );

      setNewSellPrice(
        String(
          product.sell || 0
        )
      );

      setReason("");
    };


  const handleUpdatePrice =
    async (event) => {
      event.preventDefault();

      if (
        !selectedProduct ||
        numericNewBuyPrice <= 0 ||
        numericNewSellPrice <= 0 ||
        !reason.trim()
      ) {
        return;
      }

      try {
        setSaving(true);

        await updatePrice(
          selectedProduct.id,
          {
            buyPrice:
              numericNewBuyPrice,

            sellPrice:
              numericNewSellPrice,

            reason:
              reason.trim(),

            changedBy:
              "Admin",

            effectiveDate,
          }
        );

        window.alert(
          "Harga berhasil diperbarui."
        );

        setShowForm(false);

        setSelectedProductId(
          null
        );

        setNewBuyPrice("");

        setNewSellPrice("");

        setReason("");

        await loadData();

      } catch (err) {
        console.error(
          "Gagal update harga:",
          err
        );

        window.alert(
          err.message ||
            "Gagal memperbarui harga."
        );

      } finally {
        setSaving(false);
      }
    };


  return (
    <section className="price-page">

      <div className="price-toolbar">

        <label className="price-search">

          <span className="sr-only">
            Cari barang
          </span>

          <SvgIcon
            name="search"
            size={17}
          />

          <input
            placeholder="Cari nama barang atau barcode..."
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </label>


        <select
          className="price-category-filter"
          value={category}
          onChange={(event) =>
            setCategory(
              event.target.value
            )
          }
        >
          {categories.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>


        <button
          className="add-price"
          type="button"
          onClick={() =>
            openUpdateForm(
              priceRows[0]
            )
          }
          disabled={
            priceRows.length ===
            0
          }
        >
          <SvgIcon
            name="tag"
            size={17}
          />

          Update Harga
        </button>

      </div>


      <section
        className="price-table-card"
        aria-label="Manajemen harga barang"
      >

        <div className="price-table-wrap">

          <table className="price-table">

            <thead>
              <tr>
                <th>No</th>
                <th>Nama Barang</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Update Terakhir</th>
                <th>Aksi</th>
              </tr>
            </thead>


            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    Memuat data harga...
                  </td>
                </tr>

              ) : error ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                      color:
                        "#dc2626",
                    }}
                  >
                    {error}

                    <br />

                    <button
                      type="button"
                      onClick={
                        loadData
                      }
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      Coba Lagi
                    </button>
                  </td>
                </tr>

              ) : filteredPrices.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    Belum ada data harga.
                  </td>
                </tr>

              ) : (
                filteredPrices.map(
                  (price) => (
                    <tr
                      key={
                        price.id
                      }
                    >

                      <td>
                        {
                          price.no
                        }
                      </td>


                      <td>
                        <div className="price-product-cell">

                          <strong>
                            {
                              price.name
                            }
                          </strong>

                          <span>
                            {
                              price.barcode
                            }
                          </span>

                        </div>
                      </td>


                      <td>
                        {rupiah(
                          price.buy
                        )}
                      </td>


                      <td>
                        {rupiah(
                          price.sell
                        )}
                      </td>


                      <td>
                        <div className="price-update-cell">

                          <strong>
                            {formatDate(
                              price.update
                            )}
                          </strong>

                          <span>
                            oleh{" "}
                            {
                              price.updatedBy
                            }
                          </span>

                        </div>
                      </td>


                      <td>
                        <div className="price-actions">

                          <button
                            className="price-action edit"
                            type="button"
                            onClick={() =>
                              openUpdateForm(
                                price
                              )
                            }
                          >
                            <SvgIcon
                              name="edit"
                              size={15}
                            />

                            Edit
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>


        <div className="price-footer">

          <p>
            Menampilkan{" "}
            {
              filteredPrices.length
            }{" "}
            dari{" "}
            {
              priceRows.length
            }{" "}
            barang
          </p>

          <div className="pagination">
            <button
              className="active"
              type="button"
            >
              1
            </button>

            <button
              className="per-page"
              type="button"
            >
              {
                Math.max(
                  filteredPrices.length,
                  1
                )
              }{" "}
              / halaman
            </button>
          </div>

        </div>

      </section>


      {showForm &&
        selectedProduct && (
          <div className="price-modal-backdrop">

            <section
              className="price-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="price-modal-title"
            >

              <header className="price-modal-header">

                <div className="price-modal-heading">

                  <div className="price-modal-icon">
                    <SvgIcon
                      name="tag"
                      size={21}
                    />
                  </div>


                  <div>
                    <h2 id="price-modal-title">
                      Update Harga Barang
                    </h2>

                    <p>
                      Ubah harga beli dan harga jual serta simpan riwayat perubahannya.
                    </p>
                  </div>

                </div>


                <button
                  className="price-modal-close"
                  type="button"
                  onClick={
                    closeForm
                  }
                  aria-label="Tutup form"
                  disabled={saving}
                >
                  <SvgIcon
                    name="close"
                    size={19}
                  />
                </button>

              </header>


              <form
                className="price-update-form"
                onSubmit={
                  handleUpdatePrice
                }
              >

                <section className="price-form-section">

                  <div className="price-section-heading">

                    <SvgIcon
                      name="box"
                      size={18}
                    />

                    <h3>
                      Pilih Barang
                    </h3>

                  </div>


                  <div className="price-section-body">

                    <div className="price-field">

                      <label htmlFor="price-product">
                        Barang *
                      </label>

                      <select
                        id="price-product"
                        value={
                          selectedProduct.id
                        }
                        onChange={(event) =>
                          handleSelectProduct(
                            event.target.value
                          )
                        }
                        disabled={saving}
                      >

                        {priceRows.map(
                          (item) => (
                            <option
                              key={
                                item.id
                              }
                              value={
                                item.id
                              }
                            >
                              {item.name}
                              {" ("}
                              {item.barcode}
                              {")"}
                            </option>
                          )
                        )}

                      </select>

                    </div>


                    <div className="selected-product-summary">

                      <div className="selected-product-image">
                        <SvgIcon
                          name="box"
                          size={30}
                        />
                      </div>


                      <div className="selected-product-details">

                        <div>
                          <span>
                            Kategori
                          </span>

                          <strong>
                            {
                              selectedProduct.category ||
                              "-"
                            }
                          </strong>
                        </div>


                        <div>
                          <span>
                            Merek
                          </span>

                          <strong>
                            {
                              selectedProduct.brand ||
                              "-"
                            }
                          </strong>
                        </div>


                        <div>
                          <span>
                            Satuan
                          </span>

                          <strong>
                            {
                              selectedProduct.unit ||
                              "-"
                            }
                          </strong>
                        </div>


                        <div>
                          <span>
                            Stok Saat Ini
                          </span>

                          <strong>
                            {
                              selectedProduct.stock
                            }
                          </strong>
                        </div>

                      </div>

                    </div>

                  </div>

                </section>


                <section className="price-form-section">

                  <div className="price-section-heading blue">

                    <SvgIcon
                      name="chart"
                      size={18}
                    />

                    <h3>
                      Informasi Harga Saat Ini
                    </h3>

                  </div>


                  <div className="price-current-grid">

                    <div className="price-info-card">

                      <div className="price-info-icon">
                        <SvgIcon
                          name="tag"
                          size={18}
                        />
                      </div>

                      <div>
                        <span>
                          Harga Beli Saat Ini
                        </span>

                        <strong>
                          {rupiah(
                            currentBuyPrice
                          )}
                        </strong>
                      </div>

                    </div>


                    <div className="price-info-card">

                      <div className="price-info-icon">
                        <SvgIcon
                          name="tag"
                          size={18}
                        />
                      </div>

                      <div>
                        <span>
                          Harga Jual Saat Ini
                        </span>

                        <strong>
                          {rupiah(
                            currentSellPrice
                          )}
                        </strong>

                        <small>
                          terakhir{" "}
                          {formatDate(
                            selectedProduct.update
                          )}
                        </small>
                      </div>

                    </div>

                  </div>

                </section>


                <section className="price-form-section">

                  <div className="price-section-heading blue">

                    <SvgIcon
                      name="chart"
                      size={18}
                    />

                    <h3>
                      Perubahan Harga
                    </h3>

                  </div>


                  <div className="price-change-body">

                    <div className="price-change-top">

                      <div className="price-field">

                        <label htmlFor="new-buy-price">
                          Harga Beli Baru *
                        </label>

                        <div className="price-money-input">

                          <span>
                            Rp
                          </span>

                          <input
                            id="new-buy-price"
                            type="number"
                            min="1"
                            value={
                              newBuyPrice
                            }
                            onChange={(event) =>
                              setNewBuyPrice(
                                event.target.value
                              )
                            }
                            required
                            disabled={saving}
                          />

                        </div>

                      </div>


                      <div className="price-field">

                        <label htmlFor="new-sell-price">
                          Harga Jual Baru *
                        </label>

                        <div className="price-money-input">

                          <span>
                            Rp
                          </span>

                          <input
                            id="new-sell-price"
                            type="number"
                            min="1"
                            value={
                              newSellPrice
                            }
                            onChange={(event) =>
                              setNewSellPrice(
                                event.target.value
                              )
                            }
                            required
                            disabled={saving}
                          />

                        </div>

                      </div>

                    </div>


                    <div
                      className={`price-change-summary ${
                        difference < 0
                          ? "down"
                          : difference > 0
                            ? "up"
                            : "same"
                      }`}
                    >

                      <div className="price-change-icon">
                        <SvgIcon
                          name={
                            difference <
                            0
                              ? "arrowDown"
                              : "arrowUp"
                          }
                          size={18}
                        />
                      </div>


                      <div>

                        <span>
                          {difference > 0
                            ? "Harga jual naik"
                            : difference < 0
                              ? "Harga jual turun"
                              : "Harga jual tetap"}
                        </span>


                        <strong>
                          {difference > 0
                            ? "+"
                            : ""}

                          {rupiah(
                            difference
                          )}{" "}

                          (
                          {difference > 0
                            ? "+"
                            : ""}

                          {percentage.toFixed(
                            2
                          )}
                          %)
                        </strong>


                        <small>
                          dari{" "}
                          {rupiah(
                            currentSellPrice
                          )}{" "}
                          menjadi{" "}
                          {rupiah(
                            numericNewSellPrice
                          )}
                        </small>

                      </div>

                    </div>


                    <div className="price-field">

                      <label htmlFor="price-reason">
                        Alasan Perubahan *
                      </label>

                      <div className="price-textarea-icon">

                        <SvgIcon
                          name="note"
                          size={17}
                        />

                        <textarea
                          id="price-reason"
                          placeholder="Contoh: Harga supplier naik"
                          value={reason}
                          onChange={(event) =>
                            setReason(
                              event.target.value
                            )
                          }
                          required
                          disabled={saving}
                        />

                      </div>

                    </div>


                    <div className="price-field">

                      <label htmlFor="effective-date">
                        Tanggal Berlaku *
                      </label>

                      <div className="price-input-icon">

                        <SvgIcon
                          name="calendar"
                          size={17}
                        />

                        <input
                          id="effective-date"
                          type="date"
                          value={
                            effectiveDate
                          }
                          onChange={(event) =>
                            setEffectiveDate(
                              event.target.value
                            )
                          }
                          required
                          disabled={saving}
                        />

                      </div>

                    </div>


                    <div className="price-info-note">

                      <SvgIcon
                        name="info"
                        size={17}
                      />

                      <span>
                        Perubahan harga disimpan ke riwayat harga dan digunakan oleh transaksi berikutnya.
                      </span>

                    </div>

                  </div>

                </section>


                <div className="price-form-actions">

                  <button
                    className="price-cancel"
                    type="button"
                    onClick={
                      closeForm
                    }
                    disabled={saving}
                  >
                    Batal
                  </button>


                  <button
                    className="price-save"
                    type="submit"
                    disabled={saving}
                  >
                    <SvgIcon
                      name="save"
                      size={17}
                    />

                    {saving
                      ? "Menyimpan..."
                      : "Update Harga"}
                  </button>

                </div>

              </form>

            </section>

          </div>
        )}

    </section>
  );
}


export default PriceManagement;
