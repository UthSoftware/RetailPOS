import { useState } from "react";
import "./Layout.css";
import CountryManager  from './Country.jsx';
import LanguagesPage  from './LanguageSetting.jsx';
import StateManager   from './state.jsx';
import CityManager    from './city.jsx';
import AreaManager    from './area.jsx';
import BanksManager   from './Banks.jsx';
import SysFormManager from './Form.jsx';
import SysTableManager from './Dbtable.jsx';
import SysModuleManager from './SysModule.jsx';

// ================== NAV ITEMS ==================
const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "sales",
    label: "Sales",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "purchase",
    label: "Purchase",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "inventory",
    label: "Product & Inventory",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "System Settings",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    children: [
      "User Management",
      "Security & Permissions",
      {
        label: "Localization & Configuration",
        children: ["Language", "Country", "State", "City", "Area"],
      },
      {
        label: "Financial Masters",
        children: ["Banks"],
      },
      {
        label: "System Masters",
        children: ["Sys Form", "Sys Table", "Sys Module"],
      },
      "Audit Log & Delete Records",
    ],
  },
  {
    id: "financial",
    label: "Financial & Accounting",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "org",
    label: "Organization & Branch",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: "order",
    label: "Order & Service Mgmt",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

// ================== CHEVRON ICON ==================
const ChevronIcon = ({ open }) => (
  <svg
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.2s",
      flexShrink: 0,
    }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ================== RENDER PAGE CONTENT ==================
// ✅ All nav clicks do subChild.toLowerCase() so:
//    "Language" → "language"
//    "Country"  → "country"
//    "Timezone" → "timezone"  etc.
const renderPage = (activeNav) => {
  switch (activeNav) {
    case "language":   return <LanguagesPage />;
    case "country":    return <CountryManager />;
    case "state":      return <StateManager />;
    case "city":       return <CityManager />;
    case "area":       return <AreaManager />;
    case "banks":      return <BanksManager />;
    case "sys form":   return <SysFormManager />;
    case "sys table":  return <SysTableManager />;
    case "sys module": return <SysModuleManager />;
    default:
      return (
        <>
          <h1>Welcome to {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}</h1>
          <p style={{ marginTop: 8, color: "#6b7280" }}>
            This is the {activeNav} page content area.
          </p>
        </>
      );
  }
};

// ================== MAIN LAYOUT COMPONENT ==================
export default function Layout() {
  const [activeNav, setActiveNav] = useState("home");
  const [expanded, setExpanded] = useState(null);
  const [expandedSubGroup, setExpandedSubGroup] = useState(null);

  const toggle = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  const toggleSubGroup = (label) => {
    setExpandedSubGroup(expandedSubGroup === label ? null : label);
  };

  const pageTitle =
    activeNav
      ? activeNav.charAt(0).toUpperCase() + activeNav.slice(1)
      : "Dashboard";

  return (
    <div className="app-container">

      {/* ================== SIDEBAR ================== */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark"><span>U</span></div>
          <div className="logo-text-wrap">
            <span className="logo-title">UTH</span>
            <span className="logo-sub">POS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <div key={item.id}>

              {/* Level-0: main nav button */}
              <button
                className={`nav-item ${
                  activeNav === item.id || (item.children && expanded === item.id)
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveNav(item.id);
                  if (item.children) toggle(item.id);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.children && (
                  <span className="nav-chevron">
                    <ChevronIcon open={expanded === item.id} />
                  </span>
                )}
              </button>

              {/* Level-1: submenu */}
              {item.children && expanded === item.id && (
                <div className="nav-sub">
                  {item.children.map((child) =>
                    typeof child === "string" ? (
                      <button key={child} className="nav-sub-item">
                        {child}
                      </button>
                    ) : (
                      <div key={child.label}>
                        <button
                          className={`nav-sub-item-group ${
                            expandedSubGroup === child.label ? "open" : ""
                          }`}
                          onClick={() => toggleSubGroup(child.label)}
                        >
                          <span className="label">{child.label}</span>
                          <ChevronIcon open={expandedSubGroup === child.label} />
                        </button>

                        {/* Level-2: sub-sub items */}
                        {expandedSubGroup === child.label && (
                          <div className="nav-sub-sub">
                            {child.children.map((subChild) => (
                              <button
                                key={subChild}
                                className={`nav-sub-sub-item ${
                                  activeNav === subChild.toLowerCase() ? "active" : ""
                                }`}
                                onClick={() => setActiveNav(subChild.toLowerCase())}
                              >
                                {subChild}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

            </div>
          ))}
        </nav>
      </aside>

      {/* ================== MAIN CONTENT AREA ================== */}
      <div className="main-wrapper">

        {/* ================== NAVBAR ================== */}
        <nav className="navbar">
          <div className="navbar-left">
            <button className="hamburger">
              <span></span><span></span><span></span>
            </button>
            <div className="current-page">
              <h2>{pageTitle}</h2>
            </div>
          </div>

          <div className="navbar-right">
            <button className="nav-icon-btn" title="Notifications">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="notification-dot"></span>
            </button>

            <button className="nav-icon-btn" title="Messages">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2.01 2.01 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            <div className="navbar-divider"></div>

            <div className="user-profile">
              <div className="user-avatar">AD</div>
              <div className="user-details">
                <span className="user-name">Admin</span>
                <span className="user-role">CEO</span>
              </div>
            </div>

            <button className="nav-icon-btn" title="Logout">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </nav>

        {/* ================== PAGE CONTENT ================== */}
        <main className="page-content">
          {renderPage(activeNav)}
        </main>

      </div>
    </div>
  );
}