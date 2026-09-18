import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">🌍 Darukaa.Earth</div>
        <div className="topbar-user">
          <span>{user?.name}</span>
          <button className="btn-link" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <div className="app-body">
        <nav className="sidebar">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Overview
          </NavLink>
          <NavLink
            to="/dashboard/projects"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Projects
          </NavLink>
          <NavLink
            to="/dashboard/map"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Map
          </NavLink>
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
