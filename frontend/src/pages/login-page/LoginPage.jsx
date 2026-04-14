import { useState } from "react";
import "./LoginPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function LoginPage({ onLogin }) {
  const [authMode, setAuthMode] = useState("signin");
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = authMode === "signup";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setCredentials((previousCredentials) => ({
      ...previousCredentials,
      [name]: value,
    }));
  };

  const handleModeChange = (mode) => {
    setAuthMode(mode);
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!credentials.email || !credentials.password || (isSignUp && !credentials.name)) {
      setErrorMessage(
        isSignUp
          ? "Enter your name, email, and password to create an account."
          : "Enter your email and password to continue."
      );
      return;
    }

    if (isSignUp && credentials.password !== credentials.confirmPassword) {
      setErrorMessage("Password and confirm password must match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/signin";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      onLogin(data.user);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-page__intro">
        <p className="login-page__eyebrow">AI support workspace</p>
        <h1>
          {isSignUp
            ? "Create your support workspace account."
            : "Sign in to manage support tickets faster."}
        </h1>
        <p className="login-page__copy">
          {isSignUp
            ? "Start handling customer issues, image-based reports, and ticket intake from one dashboard."
            : "Access the dashboard, track customer issues, and keep screenshot-based reports in one place."}
        </p>
      </div>

      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__switcher" role="tablist" aria-label="Authentication mode">
            <button
              className={`login-card__tab ${authMode === "signin" ? "login-card__tab--active" : ""}`}
              type="button"
              onClick={() => handleModeChange("signin")}
            >
              Sign In
            </button>
            <button
              className={`login-card__tab ${authMode === "signup" ? "login-card__tab--active" : ""}`}
              type="button"
              onClick={() => handleModeChange("signup")}
            >
              Sign Up
            </button>
          </div>

          <h2>{isSignUp ? "Create account" : "Welcome back"}</h2>
          <p>
            {isSignUp
              ? "Create a demo account with your details to enter the support dashboard."
              : "Use your email and password for this demo sign in."}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label className="login-form__field">
              <span>Name</span>
              <input
                className="login-form__input"
                type="text"
                name="name"
                value={credentials.name}
                onChange={handleChange}
                placeholder="Alex Johnson"
                required
              />
            </label>
          )}

          <label className="login-form__field">
            <span>Email</span>
            <input
              className="login-form__input"
              type="text"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder={isSignUp ? "alex@company.com" : "alex@company.com or admin"}
              required
            />
          </label>

          <label className="login-form__field">
            <span>Password</span>
            <input
              className="login-form__input"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </label>

          {isSignUp && (
            <label className="login-form__field">
              <span>Confirm Password</span>
              <input
                className="login-form__input"
                type="password"
                name="confirmPassword"
                value={credentials.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </label>
          )}

          {errorMessage && <p className="login-form__error">{errorMessage}</p>}

          <button className="login-form__button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;