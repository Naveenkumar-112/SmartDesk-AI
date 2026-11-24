// ==========================================
// SMARTDESK AI - FRONTEND AUTHENTICATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const app = document.querySelector(".app-container");

    if (!app) {
        console.error("SmartDesk AI dashboard not found.");
        return;
    }

    // ======================================
    // HIDE DASHBOARD UNTIL AUTHENTICATED
    // ======================================

    app.style.display = "none";

    // ======================================
    // CREATE AUTHENTICATION INTERFACE
    // ======================================

    const authContainer = document.createElement("div");

    authContainer.id = "authContainer";

    authContainer.innerHTML = `
        <div class="auth-card">

            <div class="auth-logo">
                <i class="fa-solid fa-headset"></i>
            </div>

            <h1>SmartDesk AI</h1>

            <p class="auth-subtitle">
                Intelligent IT Service Management
            </p>

            <div id="authMessage"></div>

            <!-- LOGIN FORM -->

            <form id="loginForm">

                <h2>Employee Login</h2>

                <input
                    type="email"
                    id="loginEmail"
                    placeholder="Enter your email"
                    required
                >

                <input
                    type="password"
                    id="loginPassword"
                    placeholder="Enter your password"
                    required
                >

                <button type="submit" id="loginButton">
                    Login
                </button>

                <p>
                    New employee?
                    <a href="#" id="showRegister">
                        Create an account
                    </a>
                </p>

            </form>

            <!-- REGISTRATION FORM -->

            <form id="registerForm" style="display:none;">

                <h2>Employee Registration</h2>

                <input
                    type="text"
                    id="registerName"
                    placeholder="Enter your full name"
                    required
                >

                <input
                    type="email"
                    id="registerEmail"
                    placeholder="Enter your email"
                    required
                >

                <input
                    type="password"
                    id="registerPassword"
                    placeholder="Create a password (minimum 8 characters)"
                    minlength="8"
                    required
                >

                <button type="submit" id="registerButton">
                    Register
                </button>

                <p>
                    Already registered?
                    <a href="#" id="showLogin">
                        Login here
                    </a>
                </p>

            </form>

        </div>
    `;

    document.body.appendChild(authContainer);


    // ======================================
    // AUTHENTICATION STYLING
    // ======================================

    const authStyle = document.createElement("style");

    authStyle.textContent = `

        #authContainer {
            position: fixed;
            inset: 0;
            z-index: 99999;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f1f5f9;
            padding: 20px;
            box-sizing: border-box;
            font-family: Inter, sans-serif;
        }

        .auth-card {
            width: 100%;
            max-width: 420px;
            padding: 35px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 35px rgba(0,0,0,0.08);
            text-align: center;
            box-sizing: border-box;
        }

        .auth-logo {
            width: 65px;
            height: 65px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #2563eb;
            color: white;
            border-radius: 16px;
            font-size: 28px;
        }

        .auth-card h1 {
            margin-bottom: 8px;
            color: #1e293b;
        }

        .auth-subtitle {
            color: #64748b;
            margin-bottom: 25px;
        }

        .auth-card h2 {
            margin-bottom: 20px;
            color: #334155;
        }

        .auth-card input {
            width: 100%;
            padding: 13px;
            margin-bottom: 15px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
        }

        .auth-card button {
            width: 100%;
            padding: 13px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
        }

        .auth-card button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .auth-card p {
            margin-top: 20px;
            color: #64748b;
            font-size: 14px;
        }

        .auth-card a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
        }

        #authMessage {
            margin-bottom: 15px;
            font-size: 14px;
        }

        .auth-success {
            color: #15803d;
        }

        .auth-error {
            color: #dc2626;
        }

    `;

    document.head.appendChild(authStyle);


    // ======================================
    // FIX SIDEBAR AND DASHBOARD LAYOUT
    // ======================================

    const layoutFix = document.createElement("style");

    layoutFix.textContent = `

        .app-container {
            display: flex;
            width: 100%;
            min-height: 100vh;
            align-items: stretch;
        }

        .sidebar {
            display: flex;
            flex-direction: column;
            flex: 0 0 260px;
            width: 260px;
            min-height: 100vh;
            padding: 28px 18px;
            background: #172554;
            color: #ffffff;
            box-sizing: border-box;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 40px;
        }

        .brand h2 {
            color: #ffffff;
            margin: 0;
        }

        .brand p {
            color: #aebbd3;
            font-size: 11px;
            margin: 5px 0 0;
        }

        .brand-icon {
            color: #ffffff;
            font-size: 25px;
        }

        .sidebar-menu {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .menu-heading {
            color: #94a3b8;
            font-size: 11px;
            font-weight: 700;
            margin: 20px 0 8px;
        }

        .sidebar-menu .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 8px;
            color: #dbeafe;
            text-decoration: none;
        }

        .sidebar-menu .nav-item:hover,
        .sidebar-menu .nav-item.active {
            background: #ffffff;
            color: #172554;
        }

        .sidebar-help {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: auto;
            padding: 15px 8px;
            color: #ffffff;
            cursor: pointer;
        }

        .sidebar-help h4 {
            color: #ffffff;
            margin: 0;
        }

        .sidebar-help p {
            color: #aebbd3;
            margin: 4px 0 0;
            font-size: 11px;
        }

        .sidebar-version {
            color: #94a3b8;
            font-size: 11px;
            padding: 12px 8px;
        }

        .main-content {
            flex: 1;
            min-width: 0;
            width: calc(100% - 260px);
        }

        @media (max-width: 768px) {

            .sidebar {
                flex-basis: 75px;
                width: 75px;
                padding: 20px 8px;
            }

            .brand > div:last-child,
            .menu-heading,
            .nav-item span,
            .sidebar-help div,
            .sidebar-version {
                display: none;
            }

            .sidebar-menu .nav-item {
                justify-content: center;
            }

            .main-content {
                width: calc(100% - 75px);
            }

        }

    `;

    document.head.appendChild(layoutFix);


    // ======================================
    // DOM ELEMENTS
    // ======================================

    const loginForm = document.getElementById("loginForm");

    const registerForm = document.getElementById("registerForm");

    const authMessage = document.getElementById("authMessage");


    // ======================================
    // DISPLAY AUTHENTICATION MESSAGE
    // ======================================

    function showMessage(message, type = "error") {

        authMessage.textContent = message;

        authMessage.className =
            type === "success"
                ? "auth-success"
                : "auth-error";

    }


    // ======================================
    // SWITCH BETWEEN LOGIN AND REGISTER
    // ======================================

    document.getElementById("showRegister")
        .addEventListener("click", event => {

            event.preventDefault();

            loginForm.style.display = "none";

            registerForm.style.display = "block";

            authMessage.textContent = "";

        });


    document.getElementById("showLogin")
        .addEventListener("click", event => {

            event.preventDefault();

            registerForm.style.display = "none";

            loginForm.style.display = "block";

            authMessage.textContent = "";

        });


    // ======================================
    // SHOW DASHBOARD AFTER LOGIN
    // ======================================

    function showDashboard(user) {

        authContainer.remove();

        // Reveal dashboard only after successful authentication
        app.style.display = "flex";

        // Display employee information
        const profile = document.querySelector(".profile");

        if (profile) {

            const heading = profile.querySelector("h4");

            const role = profile.querySelector("p");

            const avatar = profile.querySelector(".profile-avatar");

            if (heading) {
                heading.textContent = user.name;
            }

            if (role) {
                role.textContent = user.role;
            }

            if (avatar) {
                avatar.textContent =
                    user.name.substring(0, 2).toUpperCase();
            }

        }

        // Fill employee name automatically
        const employeeName =
            document.getElementById("employeeName");

        if (employeeName) {
            employeeName.value = user.name;
        }

        // Create logout button
        const topbarRight =
            document.querySelector(".topbar-right");

        if (topbarRight && !document.getElementById("logoutButton")) {

            const logoutButton = document.createElement("button");

            logoutButton.id = "logoutButton";

            logoutButton.textContent = "Logout";

            logoutButton.style.cssText = `
                padding: 10px 18px;
                margin-left: 15px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 7px;
                cursor: pointer;
                font-weight: 600;
            `;

            logoutButton.addEventListener("click", logout);

            topbarRight.appendChild(logoutButton);

        }

        // Notify script.js that authentication succeeded
        window.dispatchEvent(
            new CustomEvent("smartdesk:authenticated", {
                detail: { user: user }
            })
        );

    }


    // ======================================
    // EMPLOYEE LOGIN
    // ======================================

    loginForm.addEventListener("submit", async event => {

        event.preventDefault();

        const button = document.getElementById("loginButton");

        button.disabled = true;

        button.textContent = "Logging in...";

        try {

            const response = await fetch("/api/auth/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({

                    email: document.getElementById("loginEmail").value.trim(),

                    password: document.getElementById("loginPassword").value

                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            if (!data.user) {
                throw new Error("User information was not returned.");
            }

            showDashboard(data.user);

        } catch (error) {

            showMessage(error.message);

        } finally {

            button.disabled = false;

            button.textContent = "Login";

        }

    });


    // ======================================
    // EMPLOYEE REGISTRATION
    // ======================================

    registerForm.addEventListener("submit", async event => {

        event.preventDefault();

        const button = document.getElementById("registerButton");

        button.disabled = true;

        button.textContent = "Registering...";

        try {

            const response = await fetch("/api/auth/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({

                    name: document.getElementById("registerName").value.trim(),

                    email: document.getElementById("registerEmail").value.trim(),

                    password: document.getElementById("registerPassword").value

                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            showMessage(
                "Registration successful! Please login.",
                "success"
            );

            registerForm.reset();

            registerForm.style.display = "none";

            loginForm.style.display = "block";

            document.getElementById("loginEmail").value =
                data.user.email;

        } catch (error) {

            showMessage(error.message);

        } finally {

            button.disabled = false;

            button.textContent = "Register";

        }

    });


    // ======================================
    // VERIFY EXISTING SESSION
    // ======================================

    async function checkSession() {

        try {

            const response = await fetch("/api/auth/me", {

                method: "GET",

                credentials: "same-origin"

            });

            // 401 means no existing login session.
            // Keep the login screen visible.
            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (data.success && data.user) {

                showDashboard(data.user);

            }

        } catch (error) {

            console.error("Session Verification Error:", error);

        }

    }


    // ======================================
    // EMPLOYEE LOGOUT
    // ======================================

    async function logout() {

        const confirmation = confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmation) {
            return;
        }

        try {

            const response = await fetch("/api/auth/logout", {

                method: "POST",

                credentials: "same-origin"

            });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            window.location.reload();

        } catch (error) {

            alert(error.message);

        }

    }


    // ======================================
    // START AUTHENTICATION CHECK
    // ======================================

    checkSession();

});
