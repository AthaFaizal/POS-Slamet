import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../style/Report.css";

import {
  getTransactions,
} from "../services/transactionService.js";


const rupiah = (value) =>
  `Rp. ${Number(
    value || 0
  ).toLocaleString("id-ID")}`;


const toDate = (value) => {
  if (!value) return null;

  // SQLite often returns "YYYY-MM-DD HH:mm:ss".
  // Replace the space so the browser parses it consistently.
  const normalized =
    typeof value === "string"
      ? value.replace(" ", "T")
      : value;

  const date =
    normalized instanceof Date
      ? normalized
      : new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};


const localDateKey = (value) => {
  const date =
    value instanceof Date
      ? value
      : toDate(value);

  if (!date) return "";

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


const transactionDate = (
  transaction
) => {
  if (transaction?.date) {
    const parts =
      String(
        transaction.date
      ).split("-");

    if (parts.length === 3) {
      const [
        year,
        month,
        day,
      ] = parts.map(Number);

      return new Date(
        year,
        month - 1,
        day
      );
    }
  }

  return toDate(
    transaction?.createdAt
  );
};


const getTransactionHour = (
  transaction
) => {
  const date =
    toDate(
      transaction?.createdAt
    );

  return date
    ? date.getHours()
    : 0;
};



const getTransactionReceived = (
  transaction
) => {
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
    paid > 0
      ? paid
      : total,
    total
  );
};


const getGrossProfit = (
  transaction
) =>
  (
    transaction.items || []
  ).reduce(
    (
      total,
      item
    ) => {
      const qty =
        Number(
          item.quantity ??
          item.qty ??
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
        total +
        (
          sellPrice -
          buyPrice
        ) *
          qty
      );
    },
    0
  );


const getRemainingDebt = (
  transaction
) =>
  Math.max(
    Number(
      transaction.remaining ||
      0
    ),
    0
  );


const summarizeTransactions = (
  transactions
) => {
  return transactions.reduce(
    (
      summary,
      transaction
    ) => {
      summary.transactions += 1;

      const transactionTotal =
        Number(
          transaction.total ||
          0
        );

      const received =
        getTransactionReceived(
          transaction
        );

      const grossProfit =
        getGrossProfit(
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

      summary.sales +=
        received;

      summary.profit +=
        grossProfit *
        collectionRatio;

      summary.debt +=
        getRemainingDebt(
          transaction
        );

      return summary;
    },
    {
      transactions: 0,
      sales: 0,
      profit: 0,
      debt: 0,
    }
  );
};


const startOfDay = (date) => {
  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
};


const addDays = (
  date,
  amount
) => {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
    amount
  );

  return result;
};


const isSameDay = (
  left,
  right
) =>
  localDateKey(left) ===
  localDateKey(right);


const isDateBetween = (
  date,
  start,
  end
) => {
  if (!date) return false;

  const value =
    startOfDay(
      date
    ).getTime();

  return (
    value >=
      startOfDay(
        start
      ).getTime() &&
    value <=
      startOfDay(
        end
      ).getTime()
  );
};


const dateLabel = (date) =>
  date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
    }
  );


function Report() {
  const [
    activePeriod,
    setActivePeriod,
  ] = useState("Harian");

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
    now,
    setNow,
  ] = useState(
    () => new Date()
  );


  useEffect(() => {
    const loadReport =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getTransactions();

          setTransactions(
            data || []
          );

        } catch (err) {
          console.error(
            "Gagal mengambil laporan:",
            err
          );

          setError(
            err.message ||
            "Gagal mengambil data laporan."
          );

        } finally {
          setLoading(false);
        }
      };

    loadReport();
  }, []);


  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setNow(
            new Date()
          );
        },
        60_000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);


  const activeReport =
    useMemo(() => {
      const currentTime =
        now;

      if (
        activePeriod ===
        "Harian"
      ) {
        const todayTransactions =
          transactions.filter(
            (transaction) =>
              isSameDay(
                transactionDate(
                  transaction
                ),
                currentTime
              )
          );

        const currentHour =
          currentTime.getHours();

        const currentMinute =
          currentTime.getMinutes();

        const allGroups = [
          {
            icon: "night",
            period: "Dini Hari",
            startLabel: "00.00",
            endLabel: "05.59",
            from: 0,
            to: 5,
          },
          {
            icon: "day",
            period: "Pagi",
            startLabel: "06.00",
            endLabel: "11.59",
            from: 6,
            to: 11,
          },
          {
            icon: "day",
            period: "Siang",
            startLabel: "12.00",
            endLabel: "17.59",
            from: 12,
            to: 17,
          },
          {
            icon: "night",
            period: "Malam",
            startLabel: "18.00",
            endLabel: "23.59",
            from: 18,
            to: 23,
          },
        ];

        const groups =
          allGroups
            .filter(
              (group) =>
                group.from <=
                currentHour
            )
            .map(
              (group) => {
                const isCurrent =
                  currentHour >=
                    group.from &&
                  currentHour <=
                    group.to;

                const currentLabel =
                  `${String(
                    currentHour
                  ).padStart(
                    2,
                    "0"
                  )}.${String(
                    currentMinute
                  ).padStart(
                    2,
                    "0"
                  )}`;

                return {
                  ...group,
                  time:
                    isCurrent
                      ? `${group.startLabel} - ${currentLabel}`
                      : `${group.startLabel} - ${group.endLabel}`,
                };
              }
            );

        const rows =
          groups.map(
            (group) => {
              const selected =
                todayTransactions.filter(
                  (
                    transaction
                  ) => {
                    const hour =
                      getTransactionHour(
                        transaction
                      );

                    return (
                      hour >=
                        group.from &&
                      hour <=
                        group.to
                    );
                  }
                );

              return {
                ...group,
                ...summarizeTransactions(
                  selected
                ),
              };
            }
          );

        const total =
          summarizeTransactions(
            todayTransactions
          );

        const lastBucketStart =
          Math.floor(
            currentHour / 2
          ) * 2;

        const chartLabels =
          Array.from(
            {
              length:
                lastBucketStart / 2 +
                1,
            },
            (
              _,
              index
            ) =>
              String(
                index * 2
              ).padStart(
                2,
                "0"
              )
          );

        const chartValues =
          chartLabels.map(
            (
              label,
              index
            ) => {
              const from =
                index * 2;

              const to =
                from + 1;

              return todayTransactions.filter(
                (
                  transaction
                ) => {
                  const date =
                    toDate(
                      transaction.createdAt
                    );

                  if (!date) {
                    return false;
                  }

                  const hour =
                    date.getHours();

                  if (
                    hour <
                      from ||
                    hour >
                      to
                  ) {
                    return false;
                  }

                  if (
                    hour ===
                      currentHour &&
                    date >
                      currentTime
                  ) {
                    return false;
                  }

                  return true;
                }
              ).length;
            }
          );

        return {
          chartNote:
            `Jumlah transaksi per 2 jam sampai ${currentTime.toLocaleTimeString(
              "id-ID",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}`,
          totalLabel:
            "Total Hari Ini",
          rows,
          total,
          chartLabels:
            chartLabels.map(
              (item) =>
                `${item}:00`
            ),
          chartValues,
        };
      }


      if (
        activePeriod ===
        "Mingguan"
      ) {
        const days =
          Array.from(
            { length: 7 },
            (
              _,
              index
            ) =>
              addDays(
                startOfDay(
                  currentTime
                ),
                index - 6
              )
          );

        const rows =
          days.map(
            (date) => {
              const selected =
                transactions.filter(
                  (
                    transaction
                  ) =>
                    isSameDay(
                      transactionDate(
                        transaction
                      ),
                      date
                    )
                );

              const summary =
                summarizeTransactions(
                  selected
                );

              return {
                icon:
                  date.getDay() ===
                    0 ||
                  date.getDay() ===
                    6
                    ? "night"
                    : "day",

                period:
                  date.toLocaleDateString(
                    "id-ID",
                    {
                      weekday:
                        "long",
                    }
                  ),

                time:
                  dateLabel(
                    date
                  ),

                ...summary,
              };
            }
          );

        const start =
          days[0];

        const selected =
          transactions.filter(
            (
              transaction
            ) =>
              isDateBetween(
                transactionDate(
                  transaction
                ),
                start,
                currentTime
              )
          );

        const total =
          summarizeTransactions(
            selected
          );

        return {
          chartNote:
            "Jumlah transaksi selama 7 hari terakhir",
          totalLabel:
            "Total 7 Hari",
          rows,
          total,
          chartLabels:
            rows.map(
              (row) =>
                row.period.slice(
                  0,
                  3
                )
            ),
          chartValues:
            rows.map(
              (row) =>
                row.transactions
            ),
        };
      }


      const year =
        currentTime.getFullYear();

      const month =
        currentTime.getMonth();

      const firstDay =
        new Date(
          year,
          month,
          1
        );

      const lastDay =
        new Date(
          year,
          month + 1,
          0
        );

      const numberOfWeeks =
        Math.ceil(
          lastDay.getDate() /
            7
        );

      const rows =
        Array.from(
          {
            length:
              numberOfWeeks,
          },
          (
            _,
            index
          ) => {
            const startDay =
              index * 7 + 1;

            const endDay =
              Math.min(
                startDay + 6,
                lastDay.getDate()
              );

            const start =
              new Date(
                year,
                month,
                startDay
              );

            const end =
              new Date(
                year,
                month,
                endDay
              );

            const selected =
              transactions.filter(
                (
                  transaction
                ) =>
                  isDateBetween(
                    transactionDate(
                      transaction
                    ),
                    start,
                    end
                  )
              );

            return {
              icon:
                index ===
                numberOfWeeks - 1
                  ? "night"
                  : "day",

              period:
                `Minggu ${
                  index + 1
                }`,

              time:
                `${String(
                  startDay
                ).padStart(
                  2,
                  "0"
                )} - ${String(
                  endDay
                ).padStart(
                  2,
                  "0"
                )} ${lastDay.toLocaleDateString(
                  "id-ID",
                  {
                    month:
                      "short",
                  }
                )}`,

              ...summarizeTransactions(
                selected
              ),
            };
          }
        );

      const selected =
        transactions.filter(
          (
            transaction
          ) =>
            isDateBetween(
              transactionDate(
                transaction
              ),
              firstDay,
              lastDay
            )
        );

      const total =
        summarizeTransactions(
          selected
        );

      return {
        chartNote:
          "Jumlah transaksi per minggu pada bulan berjalan",
        totalLabel:
          "Total Bulan Ini",
        rows,
        total,
        chartLabels:
          rows.map(
            (
              _,
              index
            ) =>
              `M${index + 1}`
          ),
        chartValues:
          rows.map(
            (row) =>
              row.transactions
          ),
      };
    }, [
      activePeriod,
      transactions,
      now,
    ]);


  const metrics =
    useMemo(() => {
      const total =
        activeReport.total;

      return [
        {
          title:
            "Jumlah Transaksi",
          subtitle:
            activePeriod,
          value:
            total.transactions.toLocaleString(
              "id-ID"
            ),
          note:
            "transaksi pada periode ini",
        },
        {
          title:
            "Pemasukan",
          subtitle:
            activePeriod,
          value:
            rupiah(
              total.sales
            ),
          note:
            "uang yang benar-benar sudah diterima",
        },
        {
          title:
            "Laba Terealisasi",
          subtitle:
            activePeriod,
          value:
            rupiah(
              total.profit
            ),
          note:
            "laba berdasarkan pembayaran yang sudah diterima",
        },
        {
          title:
            "Sisa Piutang",
          subtitle:
            activePeriod,
          value:
            rupiah(
              total.debt
            ),
          note:
            "sisa bon dari transaksi periode ini",
        },
      ];
    }, [
      activePeriod,
      activeReport,
    ]);


  if (loading) {
    return (
      <section className="report-page">
        <section className="report-panel">
          Memuat laporan...
        </section>
      </section>
    );
  }


  if (error) {
    return (
      <section className="report-page">
        <section className="report-panel">
          <p>{error}</p>
        </section>
      </section>
    );
  }


  return (
    <section className="report-page">

      <div
        className="report-tabs"
        aria-label="Periode laporan"
      >
        {[
          "Harian",
          "Mingguan",
          "Bulanan",
        ].map(
          (item) => (
            <button
              className={
                activePeriod ===
                item
                  ? "active"
                  : ""
              }
              type="button"
              key={item}
              onClick={() =>
                setActivePeriod(
                  item
                )
              }
            >
              {item}
            </button>
          )
        )}
      </div>


      <div className="report-metrics">
        {metrics.map(
          (metric) => (
            <article
              className="report-card"
              key={
                metric.title
              }
            >
              <div>
                <div className="report-card-title">
                  <h2>
                    {
                      metric.title
                    }
                  </h2>
                  <span aria-hidden="true">
                    ›
                  </span>
                </div>

                <p>
                  {
                    metric.subtitle
                  }
                </p>

                <strong>
                  {
                    metric.value
                  }
                </strong>

                <div className="metric-change">
                  <em>
                    {
                      metric.note
                    }
                  </em>
                </div>
              </div>
            </article>
          )
        )}
      </div>


      <section
        className="report-panel chart-panel"
        aria-labelledby="chart-title"
      >
        <div className="report-panel-heading">
          <div>
            <h2 id="chart-title">
              Jumlah Transaksi
            </h2>
            <p>
              {
                activeReport.chartNote
              }
            </p>
          </div>

          <button type="button">
            {activePeriod}
            {" "}
            <span>⌄</span>
          </button>
        </div>

        <TransactionChart
          labels={
            activeReport.chartLabels
          }
          values={
            activeReport.chartValues
          }
        />
      </section>


      <section
        className="report-panel summary-panel"
        aria-labelledby="summary-title"
      >
        <div className="report-panel-heading compact">
          <div>
            <h2 id="summary-title">
              Ringkasan Periode
            </h2>
            <p>
              Rekap transaksi, pemasukan, piutang dan laba terealisasi berdasarkan waktu
            </p>
          </div>
        </div>

        <table className="report-summary-table">
          <thead>
            <tr>
              <th>
                Periode
              </th>
              <th>
                Transaksi
              </th>
              <th>
                Omzet
              </th>
              <th>
                Sisa Piutang
              </th>
              <th>
                Laba Kotor
              </th>
            </tr>
          </thead>

          <tbody>
            {activeReport.rows.map(
              (row) => (
                <tr
                  key={`${row.period}-${row.time}`}
                >
                  <td>
                    <span
                      className={`period-icon ${row.icon}`}
                    />
                    <strong>
                      {
                        row.period
                      }
                    </strong>
                    <span>
                      ({row.time})
                    </span>
                  </td>

                  <td>
                    {
                      row.transactions
                    }
                  </td>

                  <td>
                    {
                      rupiah(
                        row.sales
                      )
                    }
                  </td>

                  <td>
                    {
                      rupiah(
                        row.debt
                      )
                    }
                  </td>

                  <td>
                    {
                      rupiah(
                        row.profit
                      )
                    }
                  </td>
                </tr>
              )
            )}

            <tr className="summary-total-row">
              <td>
                {
                  activeReport.totalLabel
                }
              </td>

              <td>
                {
                  activeReport.total.transactions
                }
              </td>

              <td>
                {
                  rupiah(
                    activeReport.total.sales
                  )
                }
              </td>

              <td>
                {
                  rupiah(
                    activeReport.total.debt
                  )
                }
              </td>

              <td>
                {
                  rupiah(
                    activeReport.total.profit
                  )
                }
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  );
}


function TransactionChart({
  labels,
  values,
}) {
  const width = 1528;

  const maxValue =
    Math.max(
      ...values,
      1
    );

  const step =
    values.length > 1
      ? width /
        (
          values.length -
          1
        )
      : width;

  const points =
    values.map(
      (
        value,
        index
      ) => {
        const x =
          20 +
          index *
            step;

        const y =
          160 -
          (
            value /
            maxValue
          ) *
            148;

        return [
          x,
          y,
        ];
      }
    );

  const line =
    points
      .map(
        ([x, y]) =>
          `${x},${y}`
      )
      .join(" ");

  const area =
    `20,160 ${line} ${
      20 + width
    },160`;

  const yLabels = [
    maxValue,
    Math.round(
      maxValue * 0.8
    ),
    Math.round(
      maxValue * 0.6
    ),
    Math.round(
      maxValue * 0.4
    ),
    Math.round(
      maxValue * 0.2
    ),
    0,
  ];

  return (
    <div className="transaction-chart">

      <div className="chart-labels-y">
        {yLabels.map(
          (
            label,
            index
          ) => (
            <span
              key={`${label}-${index}`}
            >
              {label}
            </span>
          )
        )}
      </div>

      <svg
        viewBox="0 0 1560 190"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[
          10,
          40,
          70,
          100,
          130,
          160,
        ].map(
          (y) => (
            <line
              key={y}
              x1="20"
              x2="1530"
              y1={y}
              y2={y}
              className="grid"
            />
          )
        )}

        {points.length >
          1 && (
          <>
            <polygon
              points={
                area
              }
              className="area"
            />

            <polyline
              points={
                line
              }
              className="line"
            />
          </>
        )}

        {points.map(
          (
            [x, y],
            index
          ) => (
            <circle
              key={`${x}-${index}`}
              cx={x}
              cy={y}
              r="6"
              className="dot"
            />
          )
        )}
      </svg>

      <div
        className="chart-labels-x"
        style={{
          gridTemplateColumns:
            `repeat(${labels.length}, 1fr)`,
        }}
      >
        {labels.map(
          (
            label,
            index
          ) => (
            <span
              key={`${label}-${index}`}
            >
              {label}
            </span>
          )
        )}
      </div>
    </div>
  );
}


export default Report;
