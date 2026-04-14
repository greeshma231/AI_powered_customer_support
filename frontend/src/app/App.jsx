import { useState } from "react";
import DashboardPage from "../pages/dashboard-page/DashboardPage";
import LoginPage from "../pages/login-page/LoginPage";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (nextUser) => {
    setUser(nextUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app-shell">
      <div className="app-backdrop app-backdrop--one" />
      <div className="app-backdrop app-backdrop--two" />

      <main className="app-content">
        {user ? (
          <DashboardPage user={user} onLogout={handleLogout} />
        ) : (
          <LoginPage onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}

export default App;
