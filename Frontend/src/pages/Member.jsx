import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../style/Member.css";

import {
  getMembers,
  createMember,
  updateMember,
  deleteMember as deleteMemberApi,
} from "../services/memberService.js";


const formatRupiah = (value) =>
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
      month: "short",
      year: "numeric",
    }
  );
};


const Icon = ({
  name,
  size = 18,
}) => {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const map = {
    userPlus: (
      <svg {...p}>
        <circle
          cx="9"
          cy="8"
          r="4"
        />
        <path d="M3 20c0-4 2.7-6.5 6-6.5 1.2 0 2.3.3 3.2.8" />
        <path d="M18 11v7M14.5 14.5h7" />
      </svg>
    ),

    user: (
      <svg {...p}>
        <circle
          cx="12"
          cy="8"
          r="4"
        />
        <path d="M4 20c0-4.2 3.6-7 8-7s8 2.8 8 7" />
      </svg>
    ),

    phone: (
      <svg {...p}>
        <path d="M6.6 2.8 9 7.2 6.9 9.3c1.1 2.5 3.2 4.6 5.7 5.7l2.1-2.1 4.4 2.4c.5.3.7.8.5 1.4l-.9 3c-.2.7-.9 1.2-1.7 1.1C8.7 20 4 15.3 3.2 7c-.1-.8.4-1.5 1.1-1.7l3-.9c.5-.2 1.1 0 1.3.4Z" />
      </svg>
    ),

    pin: (
      <svg {...p}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle
          cx="12"
          cy="10"
          r="2.5"
        />
      </svg>
    ),

    note: (
      <svg {...p}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4M9 11h6M9 15h6" />
      </svg>
    ),

    calendar: (
      <svg {...p}>
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

    cart: (
      <svg {...p}>
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

    money: (
      <svg {...p}>
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
      <svg {...p}>
        <path d="M5 3h12l2 2v16H5z" />
        <path d="M8 3v6h8V3M8 21v-7h8v7" />
      </svg>
    ),

    close: (
      <svg {...p}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    ),

    edit: (
      <svg {...p}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    ),

    trash: (
      <svg {...p}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 15H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    ),
  };

  return map[name] || null;
};


const emptyForm = {
  name: "",
  phone: "",
  address: "",
  status: "Aktif",
  note: "",
};


function Member() {
  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

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
    form,
    setForm,
  ] = useState(emptyForm);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  const loadMembers =
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getMembers();

        setMembers(data);
      } catch (err) {
        console.error(
          "Gagal mengambil member:",
          err
        );

        setError(
          err.message ||
            "Gagal mengambil data member."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadMembers();
  }, []);


  const editingMember =
    members.find(
      (member) =>
        member.id ===
        editingId
    ) || null;


  const filtered =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return members.filter(
        (member) => {
          const okText =
            !keyword ||
            `${member.code} ${member.name} ${member.phone}`
              .toLowerCase()
              .includes(keyword);

          const okStatus =
            statusFilter ===
              "Semua Status" ||
            member.status ===
              statusFilter;

          return (
            okText &&
            okStatus
          );
        }
      );
    }, [
      members,
      search,
      statusFilter,
    ]);


  const close = () => {
    if (saving) {
      return;
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };


  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };


  const openEdit =
    (member) => {
      setEditingId(
        member.id
      );

      setForm({
        name:
          member.name || "",
        phone:
          member.phone || "",
        address:
          member.address || "",
        status:
          member.status ||
          "Aktif",
        note:
          member.note || "",
      });

      setOpen(true);
    };


  const handleDelete =
    async (member) => {
      const confirmed =
        window.confirm(
          `Hapus member ${member.name}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteMemberApi(
          member.id
        );

        await loadMembers();
      } catch (err) {
        console.error(
          "Gagal menghapus member:",
          err
        );

        window.alert(
          err.message ||
            "Gagal menghapus member."
        );
      }
    };


  const submit =
    async (event) => {
      event.preventDefault();

      if (
        !form.name.trim() ||
        !form.phone.trim()
      ) {
        return;
      }

      if (saving) {
        return;
      }

      try {
        setSaving(true);

        const payload = {
          name:
            form.name.trim(),

          phone:
            form.phone.trim(),

          address:
            form.address.trim(),

          status:
            form.status ===
            "Aktif"
              ? "active"
              : "inactive",

          notes:
            form.note.trim(),
        };


        if (editingId) {
          await updateMember(
            editingId,
            payload
          );
        } else {
          await createMember(
            payload
          );
        }


        await loadMembers();

        setOpen(false);
        setEditingId(null);
        setForm(emptyForm);

      } catch (err) {
        console.error(
          "Gagal menyimpan member:",
          err
        );

        window.alert(
          err.message ||
            "Gagal menyimpan member."
        );

      } finally {
        setSaving(false);
      }
    };


  return (
    <section className="member-page">

      <div className="member-toolbar">

        <label className="member-search">

          <span className="sr-only">
            Cari member
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Cari nama, nomor HP, atau kode member..."
            type="search"
          />

        </label>


        <select
          className="member-status-filter"
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
            Aktif
          </option>

          <option>
            Nonaktif
          </option>
        </select>


        <button
          className="add-member"
          type="button"
          onClick={openAdd}
        >
          <Icon
            name="userPlus"
            size={17}
          />

          Tambah Member
        </button>

      </div>


      <section
        className="member-table-card"
        aria-label="Data member"
      >

        <div className="member-table-wrap">

          <table className="member-table">

            <thead>
              <tr>
                <th>No</th>
                <th>Kode Member</th>
                <th>Nama Pelanggan</th>
                <th>No. HP</th>
                <th>Jumlah Transaksi</th>
                <th>Total Belanja</th>
                <th>Terakhir Belanja</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>


            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    Memuat data member...
                  </td>
                </tr>

              ) : error ? (
                <tr>
                  <td
                    colSpan="9"
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
                        loadMembers
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

              ) : filtered.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    Belum ada data member.
                  </td>
                </tr>

              ) : (
                filtered.map(
                  (
                    member,
                    index
                  ) => (
                    <tr
                      key={
                        member.id
                      }
                    >

                      <td>
                        {index + 1}
                      </td>


                      <td className="member-code">
                        {
                          member.code
                        }
                      </td>


                      <td>
                        {
                          member.name
                        }
                      </td>


                      <td>
                        {
                          member.phone
                        }
                      </td>


                      <td>
                        {
                          member.transactions
                        }
                      </td>


                      <td>
                        {formatRupiah(
                          member.totalSpending
                        )}
                      </td>


                      <td>
                        {formatDate(
                          member.lastPurchaseAt
                        )}
                      </td>


                      <td>
                        <span
                          className={`member-status ${
                            member.status ===
                            "Aktif"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {
                            member.status
                          }
                        </span>
                      </td>


                      <td>
                        <div className="member-action-group">

                          <button
                            className="member-action member-edit"
                            type="button"
                            onClick={() =>
                              openEdit(
                                member
                              )
                            }
                            aria-label={`Edit ${member.name}`}
                          >
                            <Icon
                              name="edit"
                              size={15}
                            />

                            <span>
                              Edit
                            </span>
                          </button>


                          <button
                            className="member-action member-delete"
                            type="button"
                            onClick={() =>
                              handleDelete(
                                member
                              )
                            }
                            aria-label={`Hapus ${member.name}`}
                          >
                            <Icon
                              name="trash"
                              size={15}
                            />

                            <span>
                              Hapus
                            </span>
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


        <div className="member-footer">

          <p>
            Menampilkan{" "}
            {filtered.length} dari{" "}
            {members.length} member
          </p>

          <div className="pagination">
            <button className="active">
              1
            </button>

            <button className="per-page">
              {Math.max(
                filtered.length,
                1
              )} / halaman
            </button>
          </div>

        </div>

      </section>


      {open && (
        <div className="member-modal-backdrop">

          <section
            className="member-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-form-title"
          >

            <header className="member-modal-header">

              <div className="member-modal-title-wrap">

                <div className="member-modal-icon">
                  <Icon
                    name="userPlus"
                    size={20}
                  />
                </div>


                <div>
                  <h2 id="member-form-title">
                    {editingMember
                      ? "Edit Member"
                      : "Tambah Member"}
                  </h2>

                  <p>
                    {editingMember
                      ? "Ubah data pelanggan member toko."
                      : "Tambahkan pelanggan baru yang akan menjadi member toko."}
                  </p>
                </div>

              </div>


              <button
                className="member-modal-close"
                type="button"
                onClick={close}
                aria-label="Tutup"
                disabled={saving}
              >
                <Icon
                  name="close"
                  size={19}
                />
              </button>

            </header>


            <form
              className="member-form"
              onSubmit={submit}
            >

              <section className="member-form-section">

                <div className="member-section-heading">
                  <h3>
                    Informasi Member
                  </h3>

                  <p>
                    Isi data utama pelanggan.
                  </p>
                </div>


                <div className="member-form-grid">

                  <div className="member-field">
                    <label>
                      Kode Member
                    </label>

                    <input
                      value={
                        editingMember?.code ||
                        "Dibuat otomatis"
                      }
                      readOnly
                    />

                    <small>
                      Dibuat otomatis oleh sistem.
                    </small>
                  </div>


                  <div className="member-field">

                    <label>
                      Nama Pelanggan{" "}
                      <span>*</span>
                    </label>

                    <div className="member-input-icon">
                      <Icon name="user" />

                      <input
                        value={
                          form.name
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            name:
                              event.target.value,
                          })
                        }
                        placeholder="Masukkan nama pelanggan"
                        required
                      />
                    </div>

                  </div>


                  <div className="member-field">

                    <label>
                      Nomor HP{" "}
                      <span>*</span>
                    </label>

                    <div className="member-input-icon">
                      <Icon name="phone" />

                      <input
                        value={
                          form.phone
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            phone:
                              event.target.value,
                          })
                        }
                        placeholder="08xxxxxxxxxx"
                        required
                      />
                    </div>

                  </div>


                  <div className="member-field member-field-full">

                    <label>
                      Alamat
                    </label>

                    <div className="member-textarea-icon">
                      <Icon name="pin" />

                      <textarea
                        maxLength={200}
                        value={
                          form.address
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            address:
                              event.target.value,
                          })
                        }
                        placeholder="Masukkan alamat pelanggan (opsional)"
                      />
                    </div>

                    <span className="member-char-count">
                      {
                        form.address.length
                      }
                      /200
                    </span>

                  </div>


                  <div className="member-field member-field-full">

                    <span className="member-field-label">
                      Status Member
                    </span>

                    <div className="member-radio-group">

                      {[
                        "Aktif",
                        "Nonaktif",
                      ].map(
                        (status) => (
                          <label
                            className={`member-radio-card ${
                              form.status ===
                              status
                                ? "selected"
                                : ""
                            }`}
                            key={status}
                          >

                            <input
                              type="radio"
                              name="status"
                              value={
                                status
                              }
                              checked={
                                form.status ===
                                status
                              }
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  status:
                                    event.target.value,
                                })
                              }
                            />

                            <span className="member-radio-mark" />

                            {status}

                          </label>
                        )
                      )}

                    </div>

                  </div>


                  <div className="member-field member-field-full">

                    <label>
                      Catatan
                    </label>

                    <div className="member-textarea-icon">
                      <Icon name="note" />

                      <textarea
                        maxLength={200}
                        value={
                          form.note
                        }
                        onChange={(event) =>
                          setForm({
                            ...form,
                            note:
                              event.target.value,
                          })
                        }
                        placeholder="Catatan tambahan (opsional)"
                      />
                    </div>

                    <span className="member-char-count">
                      {
                        form.note.length
                      }
                      /200
                    </span>

                  </div>

                </div>

              </section>


              <section className="member-system-section">

                <div className="member-section-heading">
                  <h3>
                    Informasi Sistem
                  </h3>

                  <p>
                    Data otomatis berdasarkan aktivitas transaksi member.
                  </p>
                </div>


                <div className="member-system-grid">

                  <div className="member-system-card">

                    <span className="member-system-icon">
                      <Icon name="calendar" />
                    </span>

                    <div>
                      <span>
                        Tanggal Daftar
                      </span>

                      <strong>
                        {formatDate(
                          editingMember?.createdAt
                        )}
                      </strong>
                    </div>

                  </div>


                  <div className="member-system-card">

                    <span className="member-system-icon">
                      <Icon name="cart" />
                    </span>

                    <div>
                      <span>
                        Jumlah Transaksi
                      </span>

                      <strong>
                        {
                          editingMember?.transactions ??
                          0
                        }
                      </strong>
                    </div>

                  </div>


                  <div className="member-system-card">

                    <span className="member-system-icon">
                      <Icon name="money" />
                    </span>

                    <div>
                      <span>
                        Total Belanja
                      </span>

                      <strong>
                        {formatRupiah(
                          editingMember?.totalSpending ??
                            0
                        )}
                      </strong>
                    </div>

                  </div>


                  <div className="member-system-card">

                    <span className="member-system-icon">
                      <Icon name="calendar" />
                    </span>

                    <div>
                      <span>
                        Terakhir Belanja
                      </span>

                      <strong>
                        {formatDate(
                          editingMember?.lastPurchaseAt
                        )}
                      </strong>
                    </div>

                  </div>

                </div>

              </section>


              <div className="member-form-actions">

                <button
                  className="member-cancel-button"
                  type="button"
                  onClick={close}
                  disabled={saving}
                >
                  Batal
                </button>


                <button
                  className="member-save-button"
                  type="submit"
                  disabled={saving}
                >
                  <Icon
                    name="save"
                    size={17}
                  />

                  {saving
                    ? "Menyimpan..."
                    : editingMember
                      ? "Simpan Perubahan"
                      : "Simpan Member"}
                </button>

              </div>

            </form>

          </section>

        </div>
      )}

    </section>
  );
}


export default Member;
