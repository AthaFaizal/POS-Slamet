import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProducts,
} from "../services/productService.js";

import {
  getTransactions,
} from "../services/transactionService.js";

import {
  getDebts,
} from "../services/debtService.js";

import {
  getMembers,
} from "../services/memberService.js";


const rupiah = (value) =>
  `Rp. ${Number(
    value || 0
  ).toLocaleString("id-ID")}`;


const toLocalDateKey = (value) => {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
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
};

const parseTransactionDate = (value) => {
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
};

const getDateKey = (value) => {
  const date =
    parseTransactionDate(
      value
    );

  return date
    ? toLocalDateKey(
        date
      )
    : "";
};



const getTransactionDateKey = (transaction) => {
  if (transaction?.date) {
    return getDateKey(
      transaction.date
    );
  }

  if (transaction?.createdAt) {
    return getDateKey(
      transaction.createdAt
    );
  }

  return "";
};



const getTransactionReceived = (transaction) => {
  const total =
    Number(
      transaction?.total ||
      0
    );

  const remaining =
    Number(
      transaction?.remaining ||
      0
    );

  const paid =
    Number(
      transaction?.paid ||
      0
    );

  if (remaining > 0) {
    return Math.max(
      total - remaining,
      0
    );
  }

  return Math.min(
    paid > 0 ? paid : total,
    total
  );
};


const shortDayLabel = (date) =>
  date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
    }
  );


function ProductIcon({
  type,
}) {
  return (
    <span
      className={`product-icon ${type}`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </span>
  );
}


function MetricIcon({
  name,
}) {
  if (name === "dot") {
    return (
      <span
        className="metric-symbol dot"
        aria-hidden="true"
      />
    );
  }

  if (name === "diamond") {
    return (
      <span
        className="metric-symbol diamond"
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="metric-svg"
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="13"
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  );
}

const getProductImage = (product) => {
  return (
    product.imageUrl ||
    product.image_url ||
    product.image ||
    product.thumbnail ||
    product.photo ||
    ""
  );
};

function Dashboard() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [
    debts,
    setDebts,
  ] = useState([]);

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const loadDashboard =
    async () => {
      try {
        setLoading(true);
        setError("");

        const [
          productData,
          transactionData,
          debtData,
          memberData,
        ] =
          await Promise.all([
            getProducts({
              active: true,
            }),

            getTransactions(),

            getDebts(),

            getMembers(),
          ]);

        setProducts(
          productData || []
        );

        setTransactions(
          transactionData || []
        );

        setDebts(
          debtData || []
        );

        setMembers(
          memberData || []
        );

      } catch (err) {
        console.error(
          "Gagal mengambil data dashboard:",
          err
        );

        setError(
          err.message ||
          "Gagal mengambil data dashboard."
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadDashboard();
  }, []);


  const todayKey =
    toLocalDateKey(
      new Date()
    );


  const todayTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) => {
          const transactionDate =
            getTransactionDateKey(
              transaction
            );

          return (
            transactionDate ===
            todayKey
          );
        }
      );
    }, [
      transactions,
      todayKey,
    ]);


  const todaySales =
    useMemo(() => {
      return todayTransactions.reduce(
        (
          total,
          transaction
        ) =>
          total +
          getTransactionReceived(
            transaction
          ),
        0
      );
    }, [
      todayTransactions,
    ]);


  const todayProfit =
    useMemo(() => {
      return todayTransactions.reduce(
        (
          transactionProfit,
          transaction
        ) => {
          const grossProfit =
            (
              transaction.items ||
              []
            ).reduce(
              (
                itemTotal,
                item
              ) => {
                const qty =
                  Number(
                    item.quantity ||
                    item.qty ||
                    0
                  );

                const sellPrice =
                  Number(
                    item.sellingPrice ??
                    item.selling_price ??
                    0
                  );

                const buyPrice =
                  Number(
                    item.buyPrice ??
                    item.buy_price ??
                    0
                  );

                return (
                  itemTotal +
                  (
                    sellPrice -
                    buyPrice
                  ) *
                  qty
                );
              },
              0
            );

          const transactionTotal =
            Number(
              transaction.total ||
              0
            );

          const received =
            getTransactionReceived(
              transaction
            );

          const collectionRatio =
            transactionTotal > 0
              ? Math.min(
                  received /
                    transactionTotal,
                  1
                )
              : 0;

          return (
            transactionProfit +
            grossProfit *
              collectionRatio
          );
        },
        0
      );
    }, [
      todayTransactions,
    ]);

  const marginPercent =
    todaySales > 0
      ? (
        todayProfit /
        todaySales
      ) * 100
      : 0;


  const activeDebts =
    useMemo(() => {
      return debts.filter(
        (debt) =>
          Number(
            debt.remaining ||
            0
          ) > 0
      );
    }, [debts]);


  const activeDebtTotal =
    useMemo(() => {
      return activeDebts.reduce(
        (
          total,
          debt
        ) =>
          total +
          Number(
            debt.remaining ||
            0
          ),
        0
      );
    }, [
      activeDebts,
    ]);


  const activeDebtCustomers =
    useMemo(() => {
      const customers =
        new Set(
          activeDebts.map(
            (debt) =>
              debt.memberId
                ? `member-${debt.memberId}`
                : `${debt.customerName || ""}-${debt.customerPhone || ""}`
          )
        );

      return customers.size;
    }, [
      activeDebts,
    ]);


  const lowStockProducts =
    useMemo(() => {
      return products
        .filter(
          (product) => {
            const stock =
              Number(
                product.stock ||
                0
              );

            const minStock =
              Number(
                product.minStock ??
                product.min_stock ??
                0
              );

            return (
              stock <=
              minStock &&
              stock > 0
            );
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            Number(
              a.stock ||
              0
            ) -
            Number(
              b.stock ||
              0
            )
        );
    }, [
      products,
    ]);


  const outOfStockCount =
    useMemo(() => {
      return products.filter(
        (product) =>
          Number(
            product.stock ||
            0
          ) <= 0
      ).length;
    }, [
      products,
    ]);


  const summaryCards =
    useMemo(() => {
      return [
        {
          title:
            "Pemasukan Hari Ini",

          value:
            rupiah(
              todaySales
            ),

          caption:
            `${todayTransactions.length} transaksi`,

          icon:
            "receipt",
        },

        {
          title:
            "Laba Terealisasi Hari Ini",

          value:
            rupiah(
              todayProfit
            ),

          caption:
            `Margin ${marginPercent.toFixed(
              1
            )}%`,

          icon:
            "receipt",
        },

        {
          title:
            "Piutang Aktif",

          value:
            rupiah(
              activeDebtTotal
            ),

          caption:
            `${activeDebtCustomers} pelanggan`,

          icon:
            "dot",
        },

        {
          title:
            "Stok Menipis",

          value:
            `${lowStockProducts.length} barang`,

          caption:
            outOfStockCount >
              0
              ? `${outOfStockCount} barang habis`
              : "Perlu restock",

          icon:
            "diamond",
        },
      ];
    }, [
      todaySales,
      todayTransactions.length,
      todayProfit,
      marginPercent,
      activeDebtTotal,
      activeDebtCustomers,
      lowStockProducts.length,
      outOfStockCount,
    ]);


  const salesBars =
    useMemo(() => {
      const days = [];

      for (
        let offset = 6;
        offset >= 0;
        offset -= 1
      ) {
        const date =
          new Date();

        date.setHours(
          0,
          0,
          0,
          0
        );

        date.setDate(
          date.getDate() -
          offset
        );

        const key =
          toLocalDateKey(
            date
          );

        const total =
          transactions
            .filter(
              (transaction) => {
                const transactionDate =
                  getTransactionDateKey(
                    transaction
                  );

                return (
                  transactionDate ===
                  key
                );
              }
            )
            .reduce(
              (
                sum,
                transaction
              ) =>
                sum +
                getTransactionReceived(
                  transaction
                ),
              0
            );

        days.push({
          date,
          day:
            shortDayLabel(
              date
            ),

          total,

          active:
            offset === 0,
        });
      }

      const maxTotal =
        Math.max(
          ...days.map(
            (item) =>
              item.total
          ),
          1
        );

      return days.map(
        (item) => ({
          ...item,

          value:
            item.total > 0
              ? Math.max(
                (
                  item.total /
                  maxTotal
                ) *
                240,
                18
              )
              : 0,
        })
      );
    }, [
      transactions,
    ]);


  const maxSales =
    useMemo(() => {
      return Math.max(
        ...salesBars.map(
          (item) =>
            item.total
        ),
        0
      );
    }, [
      salesBars,
    ]);


  const chartStep =
    maxSales > 0
      ? maxSales / 3
      : 0;


  const stockItems =
    useMemo(() => {
      return lowStockProducts
        .slice(0, 6)
        .map((product) => {
          const stock = Number(product.stock || 0);
          const minStock = Number(
            product.minStock ??
            product.min_stock ??
            0
          );

          return {
            id: product.id,
            name: product.name,
            image: getProductImage(product),
            stock,
            minStock,
            unit: product.unit || "pcs",
            category: product.category || "-",
          };
        });
    }, [lowStockProducts]);


  const activeMemberCount =
    useMemo(() => {
      return members.filter(
        (member) =>
          member.status ===
          "Aktif" ||
          member.status ===
          "active"
      ).length;
    }, [
      members,
    ]);


  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="panel">
          Memuat dashboard...
        </div>
      </section>
    );
  }


  if (error) {
    return (
      <section className="dashboard-page">
        <div className="panel">

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadDashboard
            }
          >
            Coba Lagi
          </button>

        </div>
      </section>
    );
  }


  return (
    <section className="dashboard-page">

      <div className="summary-grid">

        {summaryCards.map(
          ({
            title,
            value,
            caption,
            icon,
          }) => (
            <article
              className="summary-card"
              key={title}
            >

              <div className="metric-icon">
                <MetricIcon
                  name={icon}
                />
              </div>

              <h2>
                {title}
              </h2>

              <strong>
                {value}
              </strong>

              <p>
                {caption}
              </p>

            </article>
          )
        )}

      </div>


      <div className="dashboard-panels">

        <section
          className="panel sales-panel"
          aria-labelledby="sales-title"
        >

          <div
            className="panel-heading"
          >
            <h2 id="sales-title">
              Grafik Penjualan
              {" "}
              (7 Hari Terakhir)
            </h2>

            <span>
              {
                activeMemberCount
              }{" "}
              member aktif
            </span>
          </div>


          <div className="chart">

            <div
              className="chart-y-labels"
              aria-hidden="true"
            >
              <span>
                {rupiah(
                  maxSales
                )}
              </span>

              <span>
                {rupiah(
                  chartStep * 2
                )}
              </span>

              <span>
                {rupiah(
                  chartStep
                )}
              </span>

              <span>
                Rp. 0
              </span>
            </div>


            <div className="chart-plot">

              <div className="grid-line line-3" />
              <div className="grid-line line-2" />
              <div className="grid-line line-1" />
              <div className="grid-line line-0" />


              <div className="bars">

                {salesBars.map(
                  ({
                    day,
                    value,
                    active,
                    total,
                  }) => (
                    <div
                      className="bar-column"
                      key={day}
                      title={`${day}: ${rupiah(
                        total
                      )}`}
                    >

                      <div
                        className={`bar${active
                            ? " active"
                            : ""
                          }`}
                        style={{
                          height:
                            `${value}px`,
                        }}
                      />

                      <span>
                        {day}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </div>

        </section>


        <section
          className="panel stock-panel"
          aria-labelledby="stock-title"
        >

          <div className="panel-heading">

            <h2 id="stock-title">
              Stok Menipis
            </h2>

            <a href="/products">
              Lihat Semua
            </a>

          </div>


          <div className="stock-list">
            {stockItems.length === 0 ? (
              <article className="stock-empty">
                <h3>Stok aman</h3>
                <p>Tidak ada produk yang berada di bawah batas minimum.</p>
              </article>
            ) : (
              stockItems.map((item) => (
                <article
                  className="stock-item stock-item-card"
                  key={item.id || item.name}
                >
                  <div className="stock-thumb">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback =
                            e.currentTarget.parentElement?.querySelector(".stock-thumb-fallback");
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}

                    <div
                      className="stock-thumb-fallback"
                      style={{
                        display: item.image ? "none" : "flex",
                      }}
                    >
                      <span>{item.name?.charAt(0) || "P"}</span>
                    </div>
                  </div>

                  <div className="stock-copy">
                    <h3>{item.name}</h3>
                    <p className="stock-category">{item.category}</p>
                    <p className="stock-meta">
                      Stok: <strong>{item.stock} {item.unit}</strong>
                    </p>
                    <p className="stock-meta secondary">
                      Min. stok: {item.minStock} {item.unit}
                    </p>
                  </div>

                  <div className="stock-side">
                    <span className="stock-badge">{item.stock} {item.unit}</span>
                    <span className="stock-status">Menipis</span>
                  </div>
                </article>
              ))
            )}
          </div>

        </section>

      </div>

    </section>
  );
}


export default Dashboard;
