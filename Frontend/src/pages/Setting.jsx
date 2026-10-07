import {
  useEffect,
  useState,
} from "react";

import "../style/Setting.css";

import {
  getMemberDiscount,
  updateMemberDiscount,
} from "../services/settingService.js";

const formatNumberInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "";

  return Number(digits).toLocaleString("id-ID");
};

const parseNumberInput = (value) =>
  Number(String(value || "").replace(/\D/g, "")) || 0;

function Setting() {
  const [discountInput, setDiscountInput] = useState("");
  const [savedAmount, setSavedAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSetting = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMemberDiscount();

      setSavedAmount(data.amount);
      setDiscountInput(formatNumberInput(data.amount));
    } catch (err) {
      setError(err.message || "Gagal mengambil pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const amount = parseNumberInput(discountInput);
      const result = await updateMemberDiscount(amount);

      setSavedAmount(result.amount);
      setDiscountInput(formatNumberInput(result.amount));
      setMessage("Potongan harga member berhasil disimpan.");
    } catch (err) {
      setError(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="setting-page">
        <div className="setting-card">
          Memuat pengaturan...
        </div>
      </section>
    );
  }

  return (
    <section className="setting-page">
      <header className="setting-header">
        <div>
          <span className="setting-eyebrow">
            Pengaturan
          </span>

          <h1>
            Pengaturan Member
          </h1>

          <p>
            Atur potongan harga nominal yang berlaku untuk semua member saat transaksi di kasir.
          </p>
        </div>
      </header>

      <div className="setting-grid">
        <section className="setting-card">
          <div className="setting-card-heading">
            <div>
              <h2>
                Potongan Harga Member
              </h2>

              <p>
                Nominal ini otomatis dipotong dari subtotal ketika pelanggan member dipilih.
              </p>
            </div>

            <span className="setting-badge">
              Global
            </span>
          </div>

          <form
            className="setting-form"
            onSubmit={handleSubmit}
          >
            <label
              htmlFor="member-discount"
              className="setting-label"
            >
              Nominal potongan
            </label>

            <div className="currency-input">
              <span>
                Rp.
              </span>

              <input
                id="member-discount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={discountInput}
                onChange={(event) =>
                  setDiscountInput(
                    formatNumberInput(event.target.value)
                  )
                }
                placeholder="1.000"
              />
            </div>

            <div className="setting-example">
              <span>
                Contoh
              </span>

              <p>
                Jika subtotal transaksi <strong>Rp. 20.000</strong> dan potongan member{" "}
                <strong>Rp. {savedAmount.toLocaleString("id-ID")}</strong>, maka total menjadi{" "}
                <strong>
                  Rp. {Math.max(20000 - savedAmount, 0).toLocaleString("id-ID")}
                </strong>.
              </p>
            </div>

            {message && (
              <div className="setting-alert success">
                {message}
              </div>
            )}

            {error && (
              <div className="setting-alert error">
                {error}
              </div>
            )}

            <div className="setting-actions">
              <button
                type="submit"
                className="setting-save-button"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </form>
        </section>

        <aside className="setting-info-card">
          <h2>
            Cara kerja
          </h2>

          <div className="setting-rule">
            <span>01</span>
            <div>
              <strong>Pelanggan umum</strong>
              <p>Tidak mendapat potongan harga member.</p>
            </div>
          </div>

          <div className="setting-rule">
            <span>02</span>
            <div>
              <strong>Member dipilih</strong>
              <p>Potongan nominal otomatis diterapkan ke transaksi.</p>
            </div>
          </div>

          <div className="setting-rule">
            <span>03</span>
            <div>
              <strong>Transaksi bon</strong>
              <p>Sisa bon dihitung setelah potongan member diterapkan.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Setting;
