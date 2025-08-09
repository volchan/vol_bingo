import { MoonIcon, SunIcon, TwitchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import type { ApiResponse, TwitchUser } from "shared";
import { Button } from "./components/ui/button";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

function App() {
  const [data, setData] = useState<ApiResponse | undefined>();
  const [user, setUser] = useState<TwitchUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get("user");
    const tokenParam = urlParams.get("token");

    if (userParam && tokenParam) {
      try {
        const userData = JSON.parse(userParam);
        setUser(userData);
        setToken(tokenParam);
        localStorage.setItem("twitch_token", tokenParam);
        localStorage.setItem("twitch_user", userParam);

        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (error) {
        console.error("Failed to parse auth data:", error);
      }
    } else {
      // Check localStorage for existing auth
      const storedToken = localStorage.getItem("twitch_token");
      const storedUser = localStorage.getItem("twitch_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  async function sendRequest() {
    try {
      const req = await fetch(`${SERVER_URL}/hello`);
      const res: ApiResponse = await req.json();
      setData(res);
    } catch (error) {
      console.log(error);
    }
  }

  function loginWithTwitch() {
    window.location.href = `${SERVER_URL}/auth/twitch`;
  }

  async function logout() {
    try {
      if (token) {
        await fetch(`${SERVER_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.log("Logout request failed:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("twitch_token");
      localStorage.removeItem("twitch_user");
    }
  }

  async function fetchUserProfile() {
    if (!token) return;

    try {
      const response = await fetch(`${SERVER_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Current user:", userData);
      } else {
        console.log("Failed to fetch user profile");
        // Token might be expired, logout user
        logout();
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

  const [isDark, setIsDark] = useState(false);

  return (
    <>
      <h1 className="text-5xl font-black">Vol Bingo</h1>

      <button type="button" onClick={() => setIsDark(!isDark)}>
        <HugeiconsIcon icon={SunIcon} altIcon={MoonIcon} showAlt={isDark} />
      </button>

      {user ? (
        <div className="auth-section">
          <div className="user-info">
            <img
              src={user.profile_image_url}
              alt={user.display_name}
              className="profile-image"
              style={{ width: "50px", height: "50px", borderRadius: "50%" }}
            />
            <div>
              <h3>Welcome, {user.display_name}!</h3>
              <p>@{user.login}</p>
              <p>Email: {user.email}</p>
            </div>
          </div>
          <div className="auth-actions">
            <button type="button" onClick={fetchUserProfile}>
              Refresh Profile
            </button>
            <button
              type="button"
              onClick={logout}
              style={{ marginLeft: "10px" }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="auth-section">
          <Button variant="twitch" size="lg" onClick={loginWithTwitch} asChild>
            <p>
              <HugeiconsIcon icon={TwitchIcon} size={24} color="currentColor" />
              Connect with Twitch
            </p>
          </Button>
        </div>
      )}

      <div className="card">
        <button type="button" onClick={sendRequest}>
          Call API
        </button>
        {data && (
          <pre className="response">
            <code>
              Message: {data.message} <br />
              Success: {data.success.toString()}
            </code>
          </pre>
        )}
      </div>
      <p className="read-the-docs">Click the beaver to learn more</p>
    </>
  );
}

export default App;
