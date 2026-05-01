import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./LanguageSetting.css";
import { FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";

const API_URL = "http://localhost:5000/api/languages";

// All available columns definition
const ALL_COLUMNS = [
  { key: "code",   label: "CODE" },
  { key: "en",     label: "LANGUAGE (EN)" },
  { key: "reg",    label: "LANGUAGE (REG)" },
  { key: "active", label: "STATUS" },
  { key: "action", label: "ACTION" },
];

const LanguagesPage = () => {
  const [data, setData]           = useState([]);
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);

  // Column visibility: all on by default
  const [visibleCols, setVisibleCols] = useState(
    () => ALL_COLUMNS.reduce((acc, c) => ({ ...acc, [c.key]: true }), {})
  );
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef(null);

  const [newLang, setNewLang] = useState({ code: "", en: "", reg: "", active: true });

  // Close column menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) {
        setShowColMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => { fetchLanguages(); }, []);

  const fetchLanguages = async () => {
    try {
      const res = await axios.get(API_URL);
      setData(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!newLang.en || !newLang.reg) { alert("Language name is required"); return; }
    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, newLang);
      } else {
        await axios.post(API_URL, newLang);
      }
      fetchLanguages();
      setShowModal(false);
      setEditId(null);
      setNewLang({ code: "", en: "", reg: "", active: true });
    } catch (err) { console.error("Save Error:", err); }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!id) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchLanguages();
    } catch (err) { console.error("Delete Error:", err); }
  };

  // ── Toggle active ──────────────────────────────────────────
  const toggleStatus = async (item) => {
    try {
      await axios.put(`${API_URL}/${item.id}`, { ...item, active: !item.active });
      fetchLanguages();
    } catch (err) { console.error("Toggle Error:", err); }
  };

  // ── Column visibility toggle ───────────────────────────────
  const toggleCol = (key) => {
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCols = ALL_COLUMNS.filter(c => visibleCols[c.key]);
  const filtered   = data.filter(item =>
    item.en?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">

      {/* ── Header ── */}
      <div className="lm-header">
        <div className="lm-header-left">
          <h2 className="lm-title">Languages – List View</h2>
          <button
            className="lm-btn-primary"
            onClick={() => {
              setEditId(null);
              setNewLang({ code: "", en: "", reg: "", active: true });
              setShowModal(true);
            }}
          >
            + Create New
          </button>
        </div>

        <div className="lm-header-right">
          {/* Column chooser */}
          <div className="lm-col-chooser" ref={colMenuRef}>
            <button
              className="lm-col-btn"
              title="Show/hide columns"
              onClick={() => setShowColMenu(v => !v)}
            >
              <FaEllipsisV />
              <span>Columns</span>
            </button>
            {showColMenu && (
              <div className="lm-col-menu">
                <div className="lm-col-menu-title">Toggle Columns</div>
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="lm-col-menu-item">
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key]}
                      onChange={() => toggleCol(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <input
            className="lm-search"
            placeholder="Search language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="lm-table-box">
        <table className="lm-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              {activeCols.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={activeCols.length + 1} className="lm-empty-cell">
                  No languages found. Click "+ Create New" to add one.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td><input type="checkbox" /></td>

                  {visibleCols.code && <td>{item.code}</td>}
                  {visibleCols.en   && <td>{item.en}</td>}
                  {visibleCols.reg  && <td>{item.reg}</td>}

                  {visibleCols.active && (
                    <td>
                      <div className="lm-status">
                        <label className="lm-switch">
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={() => toggleStatus(item)}
                          />
                          <span className="lm-slider"></span>
                        </label>
                        <span className={`lm-badge ${item.active ? "green" : "red"}`}>
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                  )}

                  {visibleCols.action && (
                    <td>
                      <button
                        className="lm-icon-btn edit"
                        onClick={() => {
                          setNewLang(item);
                          setEditId(item.id);
                          setShowModal(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="lm-icon-btn delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="lm-modal-overlay">
          <div className="lm-modal">
            <div className="lm-modal-top">
              <h3>{editId ? "Edit Language" : "Create Language"}</h3>
              <span className="lm-modal-close" onClick={() => setShowModal(false)}>×</span>
            </div>

            <div className="lm-modal-body">
              <div className="lm-field">
                <label>Language Code</label>
                <input value={newLang.code || "Auto Generated"} disabled />
              </div>
              <div className="lm-field">
                <label>Language Name (English)</label>
                <input
                  placeholder="Enter language name"
                  value={newLang.en}
                  onChange={(e) => setNewLang({ ...newLang, en: e.target.value })}
                />
              </div>
              <div className="lm-field">
                <label>Regional Name</label>
                <input
                  placeholder="Enter regional name"
                  value={newLang.reg}
                  onChange={(e) => setNewLang({ ...newLang, reg: e.target.value })}
                />
              </div>
              <div className="lm-toggle-line">
                <label className="lm-switch">
                  <input
                    type="checkbox"
                    checked={newLang.active}
                    onChange={() => setNewLang({ ...newLang, active: !newLang.active })}
                  />
                  <span className="lm-slider"></span>
                </label>
                <span className={`lm-badge ${newLang.active ? "green" : "red"}`}>
                  {newLang.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="lm-modal-actions">
              <button className="lm-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="lm-btn-save" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguagesPage;