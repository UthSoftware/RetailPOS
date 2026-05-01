import { useState, useEffect, useCallback, useRef } from "react";
import './Country.css';

const API   = "/api/sys-forms";
const LIMIT = 20;
const EMPTY = { sf_formcode: "", sf_formname: "", sf_primarytableid: "", sf_moduleid: "", sf_active: true };

const ALL_COLS = [
  { key: "sf_formcode",  label: "Form Code" },
  { key: "sf_formname",  label: "Form Name" },
  { key: "sf_tablename", label: "DB Table" },
  { key: "sf_modulename",label: "Module" },
  { key: "sf_active",    label: "Active" },
  { key: "actions",      label: "Actions" },
];

export default function SysFormManager() {
  const [view, setView]               = useState("list");
  const [rows, setRows]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [editRecid, setEditRecid]     = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [sortBy, setSortBy]           = useState("sf_formname");
  const [sortDir, setSortDir]         = useState("ASC");
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [formData, setFormData]       = useState(EMPTY);
  const [selected, setSelected]       = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast]             = useState(null);
  const [tables, setTables]           = useState([]);
  const [modules, setModules]         = useState([]);

  const [visibleCols, setVisibleCols] = useState(() => ALL_COLS.reduce((acc, c) => ({ ...acc, [c.key]: true }), {}));
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const handler = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) setShowColMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load dropdowns
  useEffect(() => {
    fetch(`${API}/tables`).then(r => r.json()).then(d => setTables(d.rows || [])).catch(() => {});
    fetch(`${API}/modules`).then(r => r.json()).then(d => setModules(d.rows || [])).catch(() => {});
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, page, limit: LIMIT, sortBy, sortDir });
      const res  = await fetch(`${API}?${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (e) {
      showToast(e.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [search, page, sortBy, sortDir]);

  useEffect(() => { if (view === "list") loadList(); }, [loadList, view]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortDir("ASC"); }
    setPage(1);
  };
  const sortIcon = (col) => sortBy !== col ? " ↕" : sortDir === "ASC" ? " ↑" : " ↓";

  const openCreate = async () => {
    setFormData({ ...EMPTY, sf_formcode: "Loading..." });
    setEditRecid(null);
    setView("form");
    try {
      const res  = await fetch(`${API}/next-code`);
      const data = await res.json();
      if (data.success) setFormData(f => ({ ...f, sf_formcode: data.code }));
    } catch {
      setFormData(f => ({ ...f, sf_formcode: "SF-AUTO" }));
    }
  };

  const openEdit = async (recid) => {
    try {
      const res  = await fetch(`${API}/${recid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const f = data.data;
      setFormData({
        sf_formcode:       f.sf_formcode,
        sf_formname:       f.sf_formname,
        sf_primarytableid: f.sf_primarytableid || "",
        sf_moduleid:       f.sf_moduleid || "",
        sf_active:         f.sf_active,
      });
      setEditRecid(recid);
      setView("form");
    } catch (e) {
      showToast(e.message || "Failed to load record", "error");
    }
  };

  const handleSave = async () => {
    if (!formData.sf_formname.trim()) { showToast("Form Name is required.", "error"); return; }
    setSaving(true);
    try {
      const body = JSON.stringify({
        sf_formname:       formData.sf_formname.trim(),
        sf_primarytableid: formData.sf_primarytableid || null,
        sf_moduleid:       formData.sf_moduleid || null,
        sf_active:         formData.sf_active,
      });
      const url    = editRecid ? `${API}/${editRecid}` : API;
      const method = editRecid ? "PUT" : "POST";
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      showToast(editRecid ? "Form updated successfully." : "Form created successfully.");
      setView("list");
      setEditRecid(null);
    } catch (e) {
      showToast(e.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      let res, data;
      if (confirmDelete === "bulk") {
        res  = await fetch(`${API}/bulk-delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recids: selected }) });
        data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showToast(`${selected.length} record(s) deleted.`);
        setSelected([]);
      } else {
        res  = await fetch(`${API}/${confirmDelete}`, { method: "DELETE" });
        data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showToast("Form deleted.");
      }
      setConfirmDelete(null);
      loadList();
    } catch (e) {
      showToast(e.message || "Delete failed", "error");
    }
  };

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

  const allChecked = rows.length > 0 && rows.every(r => selected.includes(r.sf_recid));
  const toggleAll  = (e) => setSelected(e.target.checked ? rows.map(r => r.sf_recid) : []);
  const toggleRow  = (recid, checked) => setSelected(prev => checked ? [...prev, recid] : prev.filter(id => id !== recid));

  const toggleCol  = (key) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));
  const activeCols = ALL_COLS.filter(c => visibleCols[c.key]);
  const colSpan    = 1 + activeCols.length;

  const selectStyle = { padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 14, fontFamily: "inherit", color: "var(--text)", background: "var(--white)", outline: "none" };

  return (
    <div className="cm-root">
      <div className="cm-page">
        <div className="cm-subheader">
          <span className="cm-subheader-title">Sys Form</span>
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
          {view === "form" && (
            <>
              <div className="cm-card-header">SYS FORM – {editRecid ? "EDIT RECORD" : "SINGLE RECORD VIEW"}</div>
              <div className="cm-form-grid">
                <div className="cm-field">
                  <label>Form Code</label>
                  <input type="text" value={formData.sf_formcode} disabled />
                </div>
                <div className="cm-field">
                  <label>Form Name *</label>
                  <input type="text" value={formData.sf_formname} placeholder="e.g. Country Master"
                    onChange={e => setField("sf_formname", e.target.value)} />
                </div>
                <div className="cm-field">
                  <label>DB Table</label>
                  <select value={formData.sf_primarytableid} onChange={e => setField("sf_primarytableid", e.target.value)} style={selectStyle}>
                    <option value="">— Select Table —</option>
                    {tables.map(t => <option key={t.st_recid} value={t.st_recid}>{t.st_tablename}</option>)}
                  </select>
                </div>
                <div className="cm-field">
                  <label>Module</label>
                  <select value={formData.sf_moduleid} onChange={e => setField("sf_moduleid", e.target.value)} style={selectStyle}>
                    <option value="">— Select Module —</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="cm-field">
                  <label>Active</label>
                  <label className="cm-toggle" style={{ marginTop: 6 }}>
                    <input type="checkbox" checked={formData.sf_active}
                      onChange={e => setField("sf_active", e.target.checked)} />
                    <span className="cm-toggle-slider" />
                  </label>
                </div>
              </div>
            </>
          )}

          {view === "list" && (
            <>
              <div className="cm-card-header">SYS FORM – LIST VIEW</div>
              <div className="cm-search-bar">
                <input className="cm-search-input" type="text"
                  placeholder="Search by form name or code…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)} />
                {selected.length > 0 && (
                  <button className="cm-btn-danger" style={{ marginLeft: 10 }}
                    onClick={() => setConfirmDelete("bulk")}>
                    🗑 Delete ({selected.length})
                  </button>
                )}
                <span className="cm-count-badge">{total} record{total !== 1 ? "s" : ""}</span>
                <div className="cm-col-chooser" ref={colMenuRef}>
                  <button className="cm-col-btn" title="Show/hide columns" onClick={() => setShowColMenu(v => !v)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Columns
                  </button>
                  {showColMenu && (
                    <div className="cm-col-menu">
                      <div className="cm-col-menu-title">Toggle Columns</div>
                      {ALL_COLS.map(col => (
                        <label key={col.key} className="cm-col-menu-item">
                          <input type="checkbox" checked={visibleCols[col.key]} onChange={() => toggleCol(col.key)} />
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
                      <th style={{ width: 36 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                      {visibleCols.sf_formcode  && <th onClick={() => handleSort("sf_formcode")} style={{ cursor: "pointer" }}>Form Code{sortIcon("sf_formcode")}</th>}
                      {visibleCols.sf_formname  && <th onClick={() => handleSort("sf_formname")} style={{ cursor: "pointer" }}>Form Name{sortIcon("sf_formname")}</th>}
                      {visibleCols.sf_tablename && <th>DB Table</th>}
                      {visibleCols.sf_modulename && <th>Module</th>}
                      {visibleCols.sf_active    && <th className="center">Active</th>}
                      {visibleCols.actions      && <th className="center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={colSpan} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Loading…</td></tr>
                    ) : rows.length === 0 ? (
                      <tr><td colSpan={colSpan}>
                        <div className="cm-empty">
                          <div className="cm-empty-icon">📋</div>
                          <div>{search ? "No matching forms." : "No forms yet. Click + Create New."}</div>
                        </div>
                      </td></tr>
                    ) : rows.map(r => (
                      <tr key={r.sf_recid}>
                        <td><input type="checkbox" checked={selected.includes(r.sf_recid)}
                          onChange={e => toggleRow(r.sf_recid, e.target.checked)} /></td>
                        {visibleCols.sf_formcode  && <td><strong>{r.sf_formcode}</strong></td>}
                        {visibleCols.sf_formname  && <td>{r.sf_formname}</td>}
                        {visibleCols.sf_tablename && <td style={{ color: "#666" }}>{r.sf_tablename || "—"}</td>}
                        {visibleCols.sf_modulename && <td style={{ color: "#666" }}>{r.sf_modulename || "—"}</td>}
                        {visibleCols.sf_active    && (
                          <td className="center">
                            <label className="cm-toggle" title="Toggle active">
                              <input type="checkbox" checked={r.sf_active}
                                onChange={e => toggleActive(r.sf_recid, e)} />
                              <span className="cm-toggle-slider" />
                            </label>
                          </td>
                        )}
                        {visibleCols.actions && (
                          <td className="center">
                            <button className="cm-btn-edit" onClick={() => openEdit(r.sf_recid)}>Edit</button>
                            <button className="cm-btn-danger" onClick={() => setConfirmDelete(r.sf_recid)}>Delete</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

      {confirmDelete && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
          <div style={{ background:"#fff", borderRadius:12, padding:"28px 32px", minWidth:320, textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
            <h3 style={{ marginBottom:8 }}>Are you sure?</h3>
            <p style={{ color:"#6b7280", marginBottom:20, fontSize:13 }}>
              {confirmDelete === "bulk" ? `Permanently delete ${selected.length} selected forms?` : "Permanently delete this form?"}
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button className="cm-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="cm-btn-danger" onClick={handleDeleteConfirmed}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`cm-toast cm-toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}