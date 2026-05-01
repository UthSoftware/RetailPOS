import { useState, useEffect, useCallback, useRef } from "react";
import './Country.css';

const API   = "/api/country";
const LIMIT = 20;
const EMPTY = { con_code: "", con_nameen: "", con_namereg: "", con_isdcode: "", con_active: true };

// All available columns for Country list
const ALL_COLS = [
  { key: "con_code",    label: "Code" },
  { key: "con_nameen",  label: "Name (English)" },
  { key: "con_namereg", label: "Name (Regional)" },
  { key: "con_isdcode", label: "ISD" },
  { key: "con_active",  label: "Active" },
  { key: "actions",     label: "Actions" },
];

export default function CountryManager() {
  const [view, setView]               = useState("list");
  const [countries, setCountries]     = useState([]);
  const [total, setTotal]             = useState(0);
  const [editRecid, setEditRecid]     = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [sortBy, setSortBy]           = useState("con_nameen");
  const [sortDir, setSortDir]         = useState("ASC");
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [formData, setFormData]       = useState(EMPTY);
  const [selected, setSelected]       = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast]             = useState(null);

  // Column visibility
  const [visibleCols, setVisibleCols] = useState(
    () => ALL_COLS.reduce((acc, c) => ({ ...acc, [c.key]: true }), {})
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Close col menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target))
        setShowColMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Load list ──────────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, page, limit: LIMIT, sortBy, sortDir });
      const res  = await fetch(`${API}?${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCountries(data.rows || []);
      setTotal(data.total  || 0);
    } catch (e) {
      showToast(e.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [search, page, sortBy, sortDir]);

  useEffect(() => {
    if (view === "list") loadList();
  }, [loadList, view]);

  // ── Debounced search ───────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Sort ───────────────────────────────────────────────────
  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortDir("ASC"); }
    setPage(1);
  };
  const sortIcon = (col) => sortBy !== col ? " ↕" : sortDir === "ASC" ? " ↑" : " ↓";

  // ── Open create ────────────────────────────────────────────
  const openCreate = async () => {
    setFormData({ ...EMPTY, con_code: "Loading..." });
    setEditRecid(null);
    setView("form");
    try {
      const res  = await fetch(`${API}/next-code`);
      const data = await res.json();
      if (data.success) setFormData(f => ({ ...f, con_code: data.code }));
    } catch {
      setFormData(f => ({ ...f, con_code: "CON-AUTO" }));
    }
  };

  // ── Open edit ──────────────────────────────────────────────
  const openEdit = async (recid) => {
    try {
      const res  = await fetch(`${API}/${recid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const c = data.data;
      setFormData({
        con_code:    c.con_code,
        con_nameen:  c.con_nameen,
        con_namereg: c.con_namereg || "",
        con_isdcode: c.con_isdcode,
        con_active:  c.con_active,
      });
      setEditRecid(recid);
      setView("form");
    } catch (e) {
      showToast(e.message || "Failed to load record", "error");
    }
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.con_nameen.trim()) { showToast("Country Name (English) is required.", "error"); return; }
    if (!formData.con_isdcode.trim()) { showToast("ISD Code is required.", "error"); return; }
    setSaving(true);
    try {
      const body = JSON.stringify({
        con_nameen:  formData.con_nameen.trim(),
        con_namereg: formData.con_namereg.trim(),
        con_isdcode: formData.con_isdcode.trim(),
        con_active:  formData.con_active,
      });
      const url    = editRecid ? `${API}/${editRecid}` : API;
      const method = editRecid ? "PUT" : "POST";
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      showToast(editRecid ? "Country updated successfully." : "Country created successfully.");
      setView("list");
      setEditRecid(null);
    } catch (e) {
      showToast(e.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    try {
      let res, data;
      if (confirmDelete === "bulk") {
        res  = await fetch(`${API}/bulk-delete`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ recids: selected }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showToast(`${selected.length} record(s) deleted.`);
        setSelected([]);
      } else {
        res  = await fetch(`${API}/${confirmDelete}`, { method: "DELETE" });
        data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showToast("Country deleted.");
      }
      setConfirmDelete(null);
      loadList();
    } catch (e) {
      showToast(e.message || "Delete failed", "error");
    }
  };

  // ── Toggle active ──────────────────────────────────────────
  const toggleActive = async (recid, e) => {
    e.stopPropagation();
    try {
      const res  = await fetch(`${API}/${recid}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      loadList();
    } catch (e) {
      showToast(e.message || "Failed to update status", "error");
    }
  };

  const handleCancel = () => { setView("list"); setEditRecid(null); };
  const setField     = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  // ── Checkbox helpers ───────────────────────────────────────
  const allChecked = countries.length > 0 && countries.every(c => selected.includes(c.con_recid));
  const toggleAll  = (e) => setSelected(e.target.checked ? countries.map(c => c.con_recid) : []);
  const toggleRow  = (recid, checked) =>
    setSelected(prev => checked ? [...prev, recid] : prev.filter(id => id !== recid));

  // ── Column toggle ──────────────────────────────────────────
  const toggleCol = (key) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));
  const activeCols = ALL_COLS.filter(c => visibleCols[c.key]);

  // Visible col count for colspan
  const colSpan = 1 + activeCols.length; // +1 for checkbox

  // ══════════════════════════════════════════════════════════
  return (
    <div className="cm-root">

      <div className="cm-page">

        {/* Sub-header */}
        <div className="cm-subheader">
          <span className="cm-subheader-title">Country</span>
          <div style={{ flex: 1 }} />
          {view === "form" ? (
            <>
              <button className="cm-btn-cancel" onClick={handleCancel}>Cancel</button>
              <button className="cm-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editRecid ? "Update" : "Save"}
              </button>
            </>
          ) : (
            <button className="cm-btn-primary" onClick={openCreate}>+ Create New</button>
          )}
        </div>

        <div className="cm-card">

          {/* ── FORM ── */}
          {view === "form" && (
            <>
              <div className="cm-card-header">
                COUNTRY – {editRecid ? "EDIT RECORD" : "SINGLE RECORD VIEW"}
              </div>
              <div className="cm-form-grid">
                <div className="cm-field">
                  <label>Country Code</label>
                  <input type="text" value={formData.con_code} disabled />
                </div>
                <div className="cm-field">
                  <label>Country Name (English) *</label>
                  <input type="text" value={formData.con_nameen} placeholder="e.g. India"
                    onChange={e => setField("con_nameen", e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>Country Name (Regional)</label>
                  <input type="text" value={formData.con_namereg} placeholder="e.g. भारत"
                    onChange={e => setField("con_namereg", e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>ISD Code *</label>
                  <input type="text" value={formData.con_isdcode} placeholder="e.g. +91"
                    onChange={e => setField("con_isdcode", e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>Active</label>
                  <label className="cm-toggle" style={{ marginTop: 6 }}>
                    <input type="checkbox" checked={formData.con_active}
                      onChange={e => setField("con_active", e.target.checked)} />
                    <span className="cm-toggle-slider" />
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ── LIST ── */}
          {view === "list" && (
            <>
              <div className="cm-card-header">COUNTRY – LIST VIEW</div>
              <div className="cm-search-bar">
                <input className="cm-search-input" type="text"
                  placeholder="Search by name, code or ISD…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)} />

                {selected.length > 0 && (
                  <button className="cm-btn-danger" style={{ marginLeft: 10 }}
                    onClick={() => setConfirmDelete("bulk")}>
                    🗑 Delete ({selected.length})
                  </button>
                )}

                <span className="cm-count-badge">{total} record{total !== 1 ? "s" : ""}</span>

                {/* Column chooser */}
                <div className="cm-col-chooser" ref={colMenuRef}>
                  <button
                    className="cm-col-btn"
                    title="Show/hide columns"
                    onClick={() => setShowColMenu(v => !v)}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Columns
                  </button>
                  {showColMenu && (
                    <div className="cm-col-menu">
                      <div className="cm-col-menu-title">Toggle Columns</div>
                      {ALL_COLS.map(col => (
                        <label key={col.key} className="cm-col-menu-item">
                          <input type="checkbox"
                            checked={visibleCols[col.key]}
                            onChange={() => toggleCol(col.key)} />
                          <span>{col.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="cm-table-wrap">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                      </th>
                      {visibleCols.con_code && (
                        <th onClick={() => handleSort("con_code")} style={{ cursor: "pointer" }}>
                          Code{sortIcon("con_code")}
                        </th>
                      )}
                      {visibleCols.con_nameen && (
                        <th onClick={() => handleSort("con_nameen")} style={{ cursor: "pointer" }}>
                          Name (English){sortIcon("con_nameen")}
                        </th>
                      )}
                      {visibleCols.con_namereg && <th>Name (Regional)</th>}
                      {visibleCols.con_isdcode && (
                        <th onClick={() => handleSort("con_isdcode")} style={{ cursor: "pointer" }}>
                          ISD{sortIcon("con_isdcode")}
                        </th>
                      )}
                      {visibleCols.con_active  && <th className="center">Active</th>}
                      {visibleCols.actions     && <th className="center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={colSpan} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Loading…</td></tr>
                    ) : countries.length === 0 ? (
                      <tr><td colSpan={colSpan}>
                        <div className="cm-empty">
                          <div className="cm-empty-icon">🌍</div>
                          <div>{search ? "No matching countries." : "No countries yet. Click + Create New."}</div>
                        </div>
                      </td></tr>
                    ) : countries.map(c => (
                      <tr key={c.con_recid}>
                        <td>
                          <input type="checkbox" checked={selected.includes(c.con_recid)}
                            onChange={e => toggleRow(c.con_recid, e.target.checked)} />
                        </td>
                        {visibleCols.con_code    && <td><strong>{c.con_code}</strong></td>}
                        {visibleCols.con_nameen  && <td>{c.con_nameen}</td>}
                        {visibleCols.con_namereg && <td style={{ color: "#666" }}>{c.con_namereg || "—"}</td>}
                        {visibleCols.con_isdcode && <td>{c.con_isdcode}</td>}
                        {visibleCols.con_active  && (
                          <td className="center">
                            <label className="cm-toggle" title="Toggle active">
                              <input type="checkbox" checked={c.con_active}
                                onChange={e => toggleActive(c.con_recid, e)} />
                              <span className="cm-toggle-slider" />
                            </label>
                          </td>
                        )}
                        {visibleCols.actions && (
                          <td className="center">
                            <button className="cm-btn-edit" onClick={() => openEdit(c.con_recid)}>Edit</button>
                            <button className="cm-btn-danger" onClick={() => setConfirmDelete(c.con_recid)}>Delete</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > LIMIT && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", fontSize:13, color:"#6b7280" }}>
                  <span>Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="cm-btn-cancel" onClick={() => setPage(1)} disabled={page===1}>«</button>
                    <button className="cm-btn-cancel" onClick={() => setPage(p=>p-1)} disabled={page===1}>‹</button>
                    <span style={{ padding:"4px 10px" }}>Page {page} / {totalPages}</span>
                    <button className="cm-btn-cancel" onClick={() => setPage(p=>p+1)} disabled={page===totalPages}>›</button>
                    <button className="cm-btn-cancel" onClick={() => setPage(totalPages)} disabled={page===totalPages}>»</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#fff", borderRadius:12, padding:"28px 32px", minWidth:320, textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
            <h3 style={{ marginBottom:8 }}>Are you sure?</h3>
            <p style={{ color:"#6b7280", marginBottom:20, fontSize:13 }}>
              {confirmDelete === "bulk"
                ? `Permanently delete ${selected.length} selected countries?`
                : "Permanently delete this country?"}
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button className="cm-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="cm-btn-danger" onClick={handleDeleteConfirmed}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`cm-toast cm-toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}