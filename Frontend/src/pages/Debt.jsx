import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../style/Debt.css";

import {
  getDebts,
  getDebt,
  payDebt,
} from "../services/debtService.js";


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

  return date.toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};


function getStatus(debt) {
  if (
    Number(debt.remaining || 0) <= 0
  ) {
    return "Lunas";
  }

  if (
    Number(debt.paid || 0) > 0
  ) {
    return "Sebagian";
  }

  return "Belum Bayar";
}


function statusClass(status) {
  if (status === "Lunas") {
    return "paid";
  }

  if (status === "Sebagian") {
    return "partial";
  }

  return "unpaid";
}


const Icon = ({
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
    close: (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
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
      </svg>
    ),

    save: (
      <svg {...common}>
        <path d="M5 3h12l2 2v16H5z" />
        <path d="M8 3v6h8V3M8 21v-7h8v7" />
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
  };

  return icons[name] || null;
};


function Debt() {
  const [
    debts,
    setDebts,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "Semua Status"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedDebt,
    setSelectedDebt,
  ] = useState(null);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("Tunai");

  const [
    paymentNote,
    setPaymentNote,
  ] = useState("");

  const [
    savingPayment,
    setSavingPayment,
  ] = useState(false);


  const loadDebts =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getDebts();

        setDebts(data);

      } catch (err) {
        console.error(
          "Gagal mengambil bon:",
          err
        );

        setError(
          err.message ||
            "Gagal mengambil data bon."
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadDebts();
  }, []);


  const filteredDebts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return debts.filter(
        (debt) => {
          const status =
            getStatus(debt);

          const text =
            `${debt.debtNo} ${debt.transactionNo} ${debt.customerName} ${debt.customerPhone}`
              .toLowerCase();

          const matchesSearch =
            !keyword ||
            text.includes(keyword);

          const matchesStatus =
            statusFilter ===
              "Semua Status" ||
            status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      debts,
      search,
      statusFilter,
    ]);


  const totalRemaining =
    filteredDebts.reduce(
      (sum, debt) =>
        sum +
        Number(
          debt.remaining || 0
        ),
      0
    );


  const openPayment =
    async (debt) => {
      try {
        const detail =
          await getDebt(
            debt.id
          );

        setSelectedDebt(
          detail
        );

        setPaymentAmount("");
        setPaymentMethod("Tunai");
        setPaymentNote("");

      } catch (err) {
        window.alert(
          err.message ||
            "Gagal membuka detail bon."
        );
      }
    };


  const closePayment = () => {
    if (savingPayment) {
      return;
    }

    setSelectedDebt(null);
    setPaymentAmount("");
    setPaymentMethod("Tunai");
    setPaymentNote("");
  };


  const handlePayment =
    async (event) => {
      event.preventDefault();

      if (!selectedDebt) {
        return;
      }

      const amount =
        Number(
          paymentAmount || 0
        );

      if (amount <= 0) {
        window.alert(
          "Nominal pembayaran harus lebih dari 0."
        );

        return;
      }

      if (
        amount >
        Number(
          selectedDebt.remaining ||
          0
        )
      ) {
        window.alert(
          "Nominal pembayaran tidak boleh melebihi sisa bon."
        );

        return;
      }

      try {
        setSavingPayment(true);

        await payDebt(
          selectedDebt.id,
          {
            amount,
            paymentMethod,
            note:
              paymentNote.trim(),
          }
        );

        window.alert(
          "Pembayaran bon berhasil disimpan."
        );

        closePayment();

        await loadDebts();

      } catch (err) {
        console.error(
          "Gagal menyimpan pembayaran bon:",
          err
        );

        window.alert(
          err.message ||
            "Gagal menyimpan pembayaran bon."
        );

      } finally {
        setSavingPayment(false);
      }
    };


  return (
    <section className="debt-page">

      <div className="debt-toolbar">

        <label className="debt-search">
          <span className="sr-only">
            Cari pelanggan bon
          </span>

          <input
            placeholder="Cari nama pelanggan, no. bon, atau transaksi..."
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
          className="debt-status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option>
            Semua Status
          </option>

          <option>
            Belum Bayar
          </option>

          <option>
            Sebagian
          </option>

          <option>
            Lunas
          </option>
        </select>

      </div>


      <section
        className="debt-table-card"
        aria-label="Data piutang dan bon"
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            gap: "16px",
            padding: "18px 20px",
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Total Sisa Piutang
            </span>

            <strong
              style={{
                fontSize: "20px",
              }}
            >
              {rupiah(
                totalRemaining
              )}
            </strong>
          </div>

          <div>
            <span
              style={{
                display: "block",
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Jumlah Data
            </span>

            <strong
              style={{
                fontSize: "20px",
              }}
            >
              {
                filteredDebts.length
              }
            </strong>
          </div>
        </div>


        <div className="debt-table-wrap">

          <table className="debt-table">

            <thead>
              <tr>
                <th>No</th>
                <th>No. Bon</th>
                <th>No. Transaksi</th>
                <th>Nama Pelanggan</th>
                <th>No. HP</th>
                <th>Total Bon</th>
                <th>Dibayar</th>
                <th>Sisa</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>


            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    Memuat data bon...
                  </td>
                </tr>

              ) : error ? (
                <tr>
                  <td
                    colSpan="10"
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
                        loadDebts
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

              ) : filteredDebts.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="10"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    Belum ada data bon.
                  </td>
                </tr>

              ) : (
                filteredDebts.map(
                  (
                    debt,
                    index
                  ) => {
                    const status =
                      getStatus(
                        debt
                      );

                    return (
                      <tr
                        key={
                          debt.id
                        }
                      >
                        <td>
                          {index + 1}
                        </td>

                        <td className="debt-bon-number">
                          {
                            debt.debtNo
                          }
                        </td>

                        <td>
                          {
                            debt.transactionNo ||
                            "-"
                          }
                        </td>

                        <td>
                          {
                            debt.customerName
                          }
                        </td>

                        <td>
                          {
                            debt.customerPhone ||
                            "-"
                          }
                        </td>

                        <td>
                          {rupiah(
                            debt.total
                          )}
                        </td>

                        <td>
                          {rupiah(
                            debt.paid
                          )}
                        </td>

                        <td>
                          {rupiah(
                            debt.remaining
                          )}
                        </td>

                        <td>
                          <span
                            className={`debt-status ${statusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td>
                          <div className="debt-actions">

                            <button
                              className="debt-action edit"
                              type="button"
                              disabled={
                                Number(
                                  debt.remaining ||
                                  0
                                ) <= 0
                              }
                              onClick={() =>
                                openPayment(
                                  debt
                                )
                              }
                            >
                              <Icon
                                name="money"
                                size={15}
                              />

                              <span>
                                Bayar
                              </span>
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>


        <div className="debt-footer">

          <p>
            Menampilkan{" "}
            {
              filteredDebts.length
            }{" "}
            dari{" "}
            {debts.length} data bon
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
                  filteredDebts.length,
                  1
                )
              }{" "}
              / halaman
            </button>
          </div>

        </div>

      </section>


      {selectedDebt && (
        <div className="debt-modal-backdrop">

          <section
            className="debt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="debt-modal-title"
          >

            <header className="debt-modal-header">

              <div className="debt-modal-heading">

                <div className="debt-modal-icon">
                  <Icon
                    name="money"
                    size={20}
                  />
                </div>

                <div>
                  <h2 id="debt-modal-title">
                    Pembayaran Bon
                  </h2>

                  <p>
                    Catat pembayaran piutang pelanggan.
                  </p>
                </div>

              </div>


              <button
                type="button"
                className="debt-modal-close"
                aria-label="Tutup"
                onClick={
                  closePayment
                }
                disabled={
                  savingPayment
                }
              >
                <Icon
                  name="close"
                  size={19}
                />
              </button>

            </header>


            <form
              className="debt-form"
              onSubmit={
                handlePayment
              }
            >

              <section className="debt-form-section">

                <div className="debt-section-title">
                  <Icon
                    name="receipt"
                    size={18}
                  />

                  <h3>
                    Informasi Bon
                  </h3>
                </div>


                <div className="debt-form-grid">

                  <div className="debt-field">
                    <label>
                      No. Bon
                    </label>

                    <input
                      value={
                        selectedDebt.debtNo
                      }
                      readOnly
                    />
                  </div>


                  <div className="debt-field">
                    <label>
                      No. Transaksi
                    </label>

                    <input
                      value={
                        selectedDebt.transactionNo ||
                        "-"
                      }
                      readOnly
                    />
                  </div>


                  <div className="debt-field">
                    <label>
                      Pelanggan
                    </label>

                    <input
                      value={
                        selectedDebt.customerName
                      }
                      readOnly
                    />
                  </div>


                  <div className="debt-field">
                    <label>
                      No. HP
                    </label>

                    <input
                      value={
                        selectedDebt.customerPhone ||
                        "-"
                      }
                      readOnly
                    />
                  </div>

                </div>

              </section>


              <section className="debt-form-section">

                <div className="debt-section-title">
                  <Icon
                    name="money"
                    size={18}
                  />

                  <h3>
                    Nominal Pembayaran
                  </h3>
                </div>


                <div className="debt-payment-grid">

                  <div className="debt-field">
                    <label>
                      Total Bon
                    </label>

                    <div className="debt-readonly-value">
                      {rupiah(
                        selectedDebt.total
                      )}
                    </div>
                  </div>


                  <div className="debt-field">
                    <label>
                      Sudah Dibayar
                    </label>

                    <div className="debt-readonly-value">
                      {rupiah(
                        selectedDebt.paid
                      )}
                    </div>
                  </div>


                  <div className="debt-field">
                    <label>
                      Sisa Bon
                    </label>

                    <div className="debt-readonly-value warning">
                      {rupiah(
                        selectedDebt.remaining
                      )}
                    </div>
                  </div>


                  <div className="debt-field">
                    <label>
                      Bayar Sekarang
                    </label>

                    <div className="debt-money-input">
                      <span>
                        Rp
                      </span>

                      <input
                        type="number"
                        min="1"
                        max={
                          selectedDebt.remaining
                        }
                        value={
                          paymentAmount
                        }
                        onChange={(event) =>
                          setPaymentAmount(
                            event.target.value
                          )
                        }
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>


                  <div className="debt-field">
                    <label>
                      Metode Pembayaran
                    </label>

                    <select
                      value={
                        paymentMethod
                      }
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        Tunai
                      </option>
                      <option>
                        QRIS
                      </option>
                      <option>
                        Transfer
                      </option>
                    </select>
                  </div>


                  <div className="debt-field debt-field-full">
                    <label>
                      Catatan
                    </label>

                    <textarea
                      value={
                        paymentNote
                      }
                      onChange={(event) =>
                        setPaymentNote(
                          event.target.value
                        )
                      }
                      placeholder="Catatan pembayaran (opsional)"
                      maxLength={200}
                    />
                  </div>

                </div>

              </section>


              <section className="debt-system-section">

                <div className="debt-section-title">
                  <Icon
                    name="calendar"
                    size={18}
                  />

                  <h3>
                    Riwayat Pembayaran
                  </h3>
                </div>


                {selectedDebt.payments
                  ?.length ? (
                  <div
                    style={{
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    {selectedDebt.payments.map(
                      (
                        payment,
                        index
                      ) => (
                        <div
                          key={
                            payment.id ||
                            index
                          }
                          className="debt-system-card green"
                        >
                          <Icon
                            name="money"
                            size={18}
                          />

                          <div>
                            <span>
                              {formatDate(
                                payment.createdAt
                              )}{" "}
                              —{" "}
                              {
                                payment.paymentMethod
                              }
                            </span>

                            <strong>
                              {rupiah(
                                payment.amount
                              )}
                            </strong>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p>
                    Belum ada riwayat pembayaran.
                  </p>
                )}

              </section>


              <div className="debt-form-actions">

                <button
                  type="button"
                  className="debt-cancel"
                  onClick={
                    closePayment
                  }
                  disabled={
                    savingPayment
                  }
                >
                  Batal
                </button>


                <button
                  type="submit"
                  className="debt-save"
                  disabled={
                    savingPayment
                  }
                >
                  <Icon
                    name="save"
                    size={17}
                  />

                  {savingPayment
                    ? "Menyimpan..."
                    : "Simpan Pembayaran"}
                </button>

              </div>

            </form>

          </section>

        </div>
      )}

    </section>
  );
}


export default Debt;
