import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getTransactions,
} from "../services/transactionService.js";

import "../style/TransactionHistory.css";


const rupiah = (value) =>
  `Rp. ${Number(
    value || 0
  ).toLocaleString("id-ID")}`;


function Icon({
  name,
  size = 17,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
  };

  const icons = {
    search: (
      <svg {...common}>
        <path d="M10.5 3a7.5 7.5 0 1 0 4.73 13.32l4.72 4.72 1.42-1.42-4.72-4.72A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />
      </svg>
    ),

    calendar: (
      <svg {...common}>
        <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9ZM8 13h3v3H8v-3Z" />
      </svg>
    ),

    receipt: (
      <svg {...common}>
        <path d="M6 2a2 2 0 0 0-2 2v17.2c0 .7.8 1.1 1.4.7L8 20.2l2.6 1.7c.3.2.7.2 1 0l2.4-1.7 2.6 1.7c.6.4 1.4 0 1.4-.7V4a2 2 0 0 0-2-2H6Zm2 5h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z" />
      </svg>
    ),

    money: (
      <svg {...common}>
        <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm1 3v8h14V8H5Zm7 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-5 1h2v2H7v-2Zm8 2h2v2h-2v-2Z" />
      </svg>
    ),

    debt: (
      <svg {...common}>
        <path d="M7 2h10a2 2 0 0 1 2 2v17.2c0 .7-.8 1.1-1.4.7L15 20.2l-2.4 1.7a1 1 0 0 1-1.2 0L9 20.2l-2.6 1.7c-.6.4-1.4 0-1.4-.7V4a2 2 0 0 1 2-2Zm2 5v2h6V7H9Zm0 4v2h6v-2H9Zm0 4v2h4v-2H9Z" />
      </svg>
    ),

    eye: (
      <svg {...common}>
        <path d="M12 5c5 0 8.8 4.4 10 7-1.2 2.6-5 7-10 7S3.2 14.6 2 12c1.2-2.6 5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      </svg>
    ),

    close: (
      <svg {...common}>
        <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm11.2 0L19 6.4 6.4 19 5 17.6 17.6 5Z" />
      </svg>
    ),
  };

  return icons[name] || null;
}


function TransactionHistory() {
  const [
    transactions,
    setTransactions,
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
    query,
    setQuery,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState("Semua");

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState(null);


  const loadTransactions =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getTransactions();

        setTransactions(data);

      } catch (err) {
        console.error(
          "Gagal mengambil riwayat transaksi:",
          err
        );

        setError(
          err.message ||
            "Gagal mengambil riwayat transaksi."
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadTransactions();
  }, []);


  const filteredTransactions =
    useMemo(() => {
      const q =
        query
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          const transactionNo =
            String(
              transaction.transactionNo ||
              ""
            ).toLowerCase();

          const customerName =
            String(
              transaction.customer
                ?.customerName ||
              ""
            ).toLowerCase();

          const paymentMethod =
            String(
              transaction.paymentMethod ||
              ""
            ).toLowerCase();

          const matchQuery =
            !q ||
            transactionNo.includes(q) ||
            customerName.includes(q) ||
            paymentMethod.includes(q);

          const matchStart =
            !startDate ||
            transaction.date >=
              startDate;

          const matchEnd =
            !endDate ||
            transaction.date <=
              endDate;

          const matchPayment =
            paymentFilter ===
              "Semua" ||
            transaction.paymentMethod ===
              paymentFilter;

          return (
            matchQuery &&
            matchStart &&
            matchEnd &&
            matchPayment
          );
        }
      );
    }, [
      transactions,
      query,
      startDate,
      endDate,
      paymentFilter,
    ]);


  const summary =
    useMemo(() => {
      return filteredTransactions.reduce(
        (
          acc,
          transaction
        ) => {
          acc.count += 1;

          acc.sales +=
            Number(
              transaction.total ||
              0
            );

          acc.bon +=
            Number(
              transaction.remaining ||
              0
            );

          return acc;
        },
        {
          count: 0,
          sales: 0,
          bon: 0,
        }
      );
    }, [
      filteredTransactions,
    ]);


  const paymentMethods = [
    "Semua",
    "Tunai",
    "QRIS",
    "Transfer",
    "Bon / Piutang",
  ];


  return (
    <section className="history-page">

      <div className="history-summary-grid">

        <article className="history-summary-card">
          <span className="history-card-icon green">
            <Icon name="receipt" />
          </span>

          <div>
            <span>
              Total Transaksi
            </span>

            <strong>
              {summary.count}
            </strong>
          </div>
        </article>


        <article className="history-summary-card">
          <span className="history-card-icon blue">
            <Icon name="money" />
          </span>

          <div>
            <span>
              Total Penjualan
            </span>

            <strong>
              {rupiah(
                summary.sales
              )}
            </strong>
          </div>
        </article>


        <article className="history-summary-card">
          <span className="history-card-icon orange">
            <Icon name="debt" />
          </span>

          <div>
            <span>
              Sisa Bon
            </span>

            <strong>
              {rupiah(
                summary.bon
              )}
            </strong>
          </div>
        </article>

      </div>


      <div className="history-toolbar">

        <label className="history-search">
          <Icon name="search" />

          <input
            type="search"
            placeholder="Cari no. transaksi, pelanggan, atau metode..."
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
          />
        </label>


        <label className="history-date-field">
          <Icon name="calendar" />

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(
                event.target.value
              )
            }
            aria-label="Tanggal mulai"
          />
        </label>


        <label className="history-date-field">
          <Icon name="calendar" />

          <input
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(
                event.target.value
              )
            }
            aria-label="Tanggal akhir"
          />
        </label>


        <select
          className="history-payment-filter"
          value={paymentFilter}
          onChange={(event) =>
            setPaymentFilter(
              event.target.value
            )
          }
          aria-label="Filter metode pembayaran"
        >
          {paymentMethods.map(
            (method) => (
              <option
                key={method}
                value={method}
              >
                {method}
              </option>
            )
          )}
        </select>

      </div>


      <div className="history-table-card">

        <div className="history-table-wrap">

          <table className="history-table">

            <thead>
              <tr>
                <th>No</th>
                <th>No. Transaksi</th>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Item</th>
                <th>Metode</th>
                <th>Total</th>
                <th>Dibayar</th>
                <th>Sisa Bon</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>


            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="11"
                    className="history-empty"
                  >
                    Memuat riwayat transaksi...
                  </td>
                </tr>

              ) : error ? (
                <tr>
                  <td
                    colSpan="11"
                    className="history-empty"
                  >
                    <div>
                      {error}

                      <br />

                      <button
                        type="button"
                        onClick={
                          loadTransactions
                        }
                        style={{
                          marginTop:
                            "10px",
                        }}
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </td>
                </tr>

              ) : filteredTransactions.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="history-empty"
                  >
                    Belum ada transaksi sesuai filter.
                  </td>
                </tr>

              ) : (
                filteredTransactions.map(
                  (
                    transaction,
                    index
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                    >

                      <td>
                        {index + 1}
                      </td>


                      <td>
                        <strong className="history-number">
                          {
                            transaction.transactionNo
                          }
                        </strong>
                      </td>


                      <td>
                        <span>
                          {
                            transaction.displayDate
                          }
                        </span>

                        <small>
                          {
                            transaction.time
                          }
                        </small>
                      </td>


                      <td>
                        <span>
                          {
                            transaction.customer
                              ?.customerName ||
                            "Pelanggan Umum"
                          }
                        </span>

                        <small>
                          {
                            transaction.customer
                              ?.phone ||
                            "Umum"
                          }
                        </small>
                      </td>


                      <td>
                        <span>
                          {
                            transaction.items
                              .length
                          }{" "}
                          barang
                        </span>

                        <small>
                          {transaction.items
                            .map(
                              (item) =>
                                item.name
                            )
                            .filter(Boolean)
                            .join(", ") ||
                            "-"}
                        </small>
                      </td>


                      <td>
                        <span
                          className={`history-payment ${String(
                            transaction.paymentMethod ||
                            ""
                          )
                            .toLowerCase()
                            .replaceAll(
                              " / ",
                              "-"
                            )
                            .replaceAll(
                              " ",
                              "-"
                            )}`}
                        >
                          {
                            transaction.paymentMethod
                          }
                        </span>
                      </td>


                      <td>
                        {rupiah(
                          transaction.total
                        )}
                      </td>


                      <td>
                        {rupiah(
                          transaction.paid
                        )}
                      </td>


                      <td>
                        {transaction.remaining >
                        0
                          ? rupiah(
                              transaction.remaining
                            )
                          : "-"}
                      </td>


                      <td>
                        <span
                          className={`history-status ${
                            transaction.remaining >
                            0
                              ? "debt"
                              : "paid"
                          }`}
                        >
                          {transaction.remaining >
                          0
                            ? transaction.bonStatus ||
                              "Belum Lunas"
                            : "Lunas"}
                        </span>
                      </td>


                      <td>
                        <button
                          className="history-detail-button"
                          type="button"
                          onClick={() =>
                            setSelectedTransaction(
                              transaction
                            )
                          }
                        >
                          <Icon
                            name="eye"
                            size={14}
                          />
                          Detail
                        </button>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>


        <div className="history-footer">

          <p>
            Menampilkan{" "}
            {
              filteredTransactions.length
            }{" "}
            dari{" "}
            {
              transactions.length
            }{" "}
            transaksi
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
                  filteredTransactions.length,
                  1
                )
              }{" "}
              / halaman
            </button>

          </div>

        </div>

      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() =>
            setSelectedTransaction(null)
          }
        />
      )}

    </section>
  );
}


function TransactionDetailModal({
  transaction,
  onClose,
}) {
  const isDebt =
    Number(
      transaction.remaining || 0
    ) > 0;

  return (
    <div
      className="history-detail-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="history-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-detail-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="history-detail-header">
          <div>
            <span className="history-detail-kicker">
              Detail Transaksi
            </span>

            <h2 id="history-detail-title">
              {transaction.transactionNo}
            </h2>

            <p>
              {transaction.displayDate} · {transaction.time}
            </p>
          </div>

          <button
            type="button"
            aria-label="Tutup detail transaksi"
            onClick={onClose}
          >
            <Icon
              name="close"
              size={18}
            />
          </button>
        </header>

        <div className="history-detail-body">
          <div className="history-detail-grid">
            <div className="history-detail-info-card">
              <span>Pelanggan</span>
              <strong>
                {transaction.customer?.customerName ||
                  "Pelanggan Umum"}
              </strong>
              <small>
                {transaction.customer?.phone ||
                  "Umum / Non Member"}
              </small>
            </div>

            <div className="history-detail-info-card">
              <span>Metode Pembayaran</span>
              <strong>
                {transaction.paymentMethod}
              </strong>
              <small>
                {isDebt
                  ? transaction.bonStatus ||
                    "Belum Lunas"
                  : "Lunas"}
              </small>
            </div>

            <div className="history-detail-info-card">
              <span>Total Belanja</span>
              <strong>
                {rupiah(transaction.total)}
              </strong>
              <small>
                {transaction.items.length} barang
              </small>
            </div>
          </div>

          <section className="history-detail-section">
            <h3>Daftar Barang</h3>

            <div className="history-detail-items">
              {transaction.items.map((item, index) => (
                <div
                  className="history-detail-item"
                  key={`${item.productId}-${item.name}-${index}`}
                >
                  <div>
                    <strong>
                      {item.name || "Barang"}
                    </strong>
                    <span>
                      {item.barcode || "-"}
                    </span>
                  </div>

                  <span>
                    {item.quantity || item.qty || 0} x{" "}
                    {rupiah(item.sellingPrice)}
                  </span>

                  <strong>
                    {rupiah(
                      item.subtotal ||
                        item.total
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="history-detail-section">
            <h3>Ringkasan Pembayaran</h3>

            <dl className="history-detail-summary">
              <div>
                <dt>Subtotal</dt>
                <dd>
                  {rupiah(transaction.subtotal)}
                </dd>
              </div>

              <div>
                <dt>Diskon / Potongan</dt>
                <dd>
                  {rupiah(transaction.discount)}
                </dd>
              </div>

              <div>
                <dt>Total</dt>
                <dd>
                  {rupiah(transaction.total)}
                </dd>
              </div>

              <div>
                <dt>Dibayar</dt>
                <dd>
                  {rupiah(transaction.paid)}
                </dd>
              </div>

              <div>
                <dt>Kembalian</dt>
                <dd>
                  {rupiah(transaction.change)}
                </dd>
              </div>

              <div className={isDebt ? "warning" : ""}>
                <dt>Sisa Bon</dt>
                <dd>
                  {rupiah(transaction.remaining)}
                </dd>
              </div>
            </dl>
          </section>

          {transaction.notes && (
            <section className="history-detail-section">
              <h3>Catatan</h3>
              <p className="history-detail-note">
                {transaction.notes}
              </p>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}


export default TransactionHistory;
