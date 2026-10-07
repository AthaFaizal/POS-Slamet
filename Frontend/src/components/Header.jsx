import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

const pageMeta = {
  "/": {
    title: "Dashboard",
    description: "Ringkasan aktivitas toko hari ini",
  },
  "/kasir": {
    title: "Kasir",
    description: "Scan barcode atau cari barang untuk menambah ke keranjang",
  },
  "/produk-stok": {
    title: "Produk & Stok",
    description: "Kelola data barang, stok, dan kategori",
  },
  "/member": {
    title: "Data Member / Pelanggan",
    description: "Kelola data member dan diskon",
  },
  "/piutang": {
    title: "Piutang / Bon",
    description: "Kelola data pelanggan yang memiliki bon",
  },
  "/harga-barang": {
    title: "Manajemen Harga",
    description: "Kelola harga beli, harga jual, dan riwayat perubahan",
  },
  "/riwayat-transaksi": {
    title: "Riwayat Transaksi",
    description: "Pantau transaksi kasir berdasarkan tanggal dan metode pembayaran",
  },
  "/laporan": {
    title: "Laporan",
    description: "Ringkasan penjualan dan performa toko",
  },
};

const formatHeaderDate = (date) =>
  date.toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

const getDateTimeValue = (date) => {
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

function Header() {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] ?? pageMeta["/"];
  const [now, setNow] = useState(
    () => new Date()
  );

  useEffect(() => {
    const intervalId =
      window.setInterval(
        () => {
          setNow(new Date());
        },
        60000
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, []);

  const currentDate =
    useMemo(
      () =>
        formatHeaderDate(
          now
        ),
      [now]
    );

  const dateTime =
    useMemo(
      () =>
        getDateTimeValue(
          now
        ),
      [now]
    );

  return (
    <header
      className={`dashboard-header${
        pathname === "/kasir" ||
        pathname === "/produk-stok" ||
        pathname === "/member" ||
        pathname === "/piutang" ||
        pathname === "/harga-barang" ||
        pathname === "/riwayat-transaksi" ||
        pathname === "/laporan"
          ? " cashier-header"
          : ""
      }${pathname === "/laporan" ? " report-header" : ""}`}
    >
      <div>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>
      <time dateTime={dateTime}>
        {currentDate}
      </time>
    </header>
  );
}

export default Header;
