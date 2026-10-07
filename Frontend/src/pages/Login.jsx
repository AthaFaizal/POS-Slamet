import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import "../style/Login.css";

function Login() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    loading,
    login,
  } = useAuth();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    setError("");
  }, [
    username,
    password,
  ]);

  if (loading) {
    return (
      <div className="login-loading">
        Memeriksa sesi...
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !username.trim() ||
        !password
      ) {
        setError(
          "Username dan password wajib diisi."
        );

        return;
      }

      try {
        setSubmitting(true);
        setError("");

        await login(
          username.trim(),
          password
        );

        const target =
          location.state?.from ||
          "/";

        navigate(
          target,
          {
            replace: true,
          }
        );
      } catch (err) {
        setError(
          err.message ||
          "Login gagal."
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <main className="login-page">
      <section className="login-card">

        <div className="login-brand">
          <div className="login-logo">
            POS
          </div>

          <div>
            <h1>
              Toko Sembako
            </h1>

            <p>
              Point of Sale System
            </p>
          </div>
        </div>

        <div className="login-heading">
          <h2>
            Masuk
          </h2>

          <p>
            Masukkan akun Anda untuk mengakses sistem.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            <span>
              Username
            </span>

            <input
              type="text"
              autoComplete="username"
              value={
                username
              }
              onChange={
                (event) =>
                  setUsername(
                    event.target.value
                  )
              }
              placeholder="Masukkan username"
            />
          </label>

          <label>
            <span>
              Password
            </span>

            <div className="password-field">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={
                  password
                }
                onChange={
                  (event) =>
                    setPassword(
                      event.target.value
                    )
                }
                placeholder="Masukkan password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
              >
                {showPassword
                  ? "Sembunyikan"
                  : "Lihat"}
              </button>
            </div>
          </label>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? "Memproses..."
              : "Masuk"}
          </button>
        </form>

      </section>
    </main>
  );
}

export default Login;
