import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Cashier from "./pages/Cashier";
import Dashboard from "./pages/Dashboard";
import Debt from "./pages/Debt";
import Login from "./pages/Login.jsx";
import Member from "./pages/Member";
import PriceManagement from "./pages/PriceManagement";
import ProductStock from "./pages/ProductStock";
import Report from "./pages/Report";
import Setting from "./pages/Setting.jsx";
import TransactionHistory from "./pages/TransactionHistory";

import "./style/Dashboard.css";


function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Header />

        <Routes>
          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/kasir"
            element={<Cashier />}
          />

          <Route
            path="/produk-stok"
            element={<ProductStock />}
          />

          <Route
            path="/member"
            element={<Member />}
          />

          <Route
            path="/piutang"
            element={<Debt />}
          />

          <Route
            path="/harga-barang"
            element={<PriceManagement />}
          />

          <Route
            path="/riwayat-transaksi"
            element={<TransactionHistory />}
          />

          <Route
            path="/laporan"
            element={<Report />}
          />

          <Route
            path="/pengaturan"
            element={<Setting />}
          />
        </Routes>
      </main>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN - tanpa Sidebar dan Header */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* SEMUA HALAMAN YANG HARUS LOGIN */}
        <Route
          element={<ProtectedRoute />}
        >
          <Route
            path="/*"
            element={<AppLayout />}
          />
        </Route>

      </Routes>

    </BrowserRouter>
  );
}


export default App;
