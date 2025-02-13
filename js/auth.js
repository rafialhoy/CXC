// Ensure Supabase is loaded from the global script
if (typeof window.supabase === "undefined") {
    console.error("Supabase SDK not loaded. Make sure to include the script in your HTML.");
} else {
    console.log("Initializing Supabase...");
    const SUPABASE_URL = "https://kmotaxxpiyyxazccpjdx.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb3RheHhwaXl5eGF6Y2NwamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MDc4MjMsImV4cCI6MjA1NDk4MzgyM30.oW6nOygHPogJ5KKKi3cuiQxfZUpK778xqmSF4TdXCyM";
    var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Ensure Supabase is defined before calling functions
if (typeof supabase !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("Supabase initialized.");
    });
} else {
    console.error("Supabase is not defined. Check initialization.");
}

// Function to verify password
async function verifyPassword() {
    const enteredPassword = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    if (!enteredPassword) {
        errorMessage.textContent = "Ingrese una contraseña";
        errorMessage.classList.remove("hidden");
        return;
    }

    console.log("Verifying password...");

    try {
        // Call Supabase function to check password
        const { data, error } = await supabase.rpc("verify_password", { input_password: enteredPassword });

        if (error) {
            throw new Error("Error verifying password: " + error.message);
        }

        console.log("Supabase response:", data);

        // Supabase should return `true` or `false`
        if (data) {
            console.log("Login successful");
            localStorage.setItem("isAuthenticated", "true");
            window.location.href = "pages/dashboard.html";
        } else {
            console.log("Incorrect password");
            errorMessage.textContent = "Contraseña incorrecta";
            errorMessage.classList.remove("hidden");
            showIncorrectPasswordAlert();
        }
    } catch (err) {
        console.error(err);
        errorMessage.textContent = "Error de conexión. Intente de nuevo.";
        errorMessage.classList.remove("hidden");
    }
}

// Function to show incorrect password alert
function showIncorrectPasswordAlert() {
    alert("Contraseña incorrecta. Inténtelo de nuevo.");
}

// Protect pages if user is not logged in
document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("isAuthenticated") && !window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
    }
});

