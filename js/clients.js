// Ensure Supabase is loaded from the global script
if (typeof window.supabase === "undefined") {
    console.error("Supabase SDK not loaded. Make sure to include the script in your HTML.");
} else {
    console.log("Initializing Supabase...");
    const SUPABASE_URL = "https://kmotaxxpiyyxazccpjdx.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb3RheHhwaXl5eGF6Y2NwamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MDc4MjMsImV4cCI6MjA1NDk4MzgyM30.oW6nOygHPogJ5KKKi3cuiQxfZUpK778xqmSF4TdXCyM";
    var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadClients() {
    console.log("Fetching clients...");

    const { data, error } = await supabase
        .from("clients")
        .select(`
            id, name, email, phone, identification, start_date, end_date,
            properties!inner(name)
        `);

    if (error) {
        console.error("Error fetching clients:", error);
        return;
    }

    console.log("Clients fetched:", data);

    const clientList = document.getElementById("client-list");
    clientList.innerHTML = ""; // Clear previous data

    data.forEach(client => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td>${client.identification}</td>
            <td>${client.properties ? client.properties.name : "Sin propiedad"}</td>
            <td>${client.start_date}</td>
            <td>${client.end_date || "Activo"}</td>
            <td>
                <button class="delete-btn" onclick="deleteClient('${client.id}')">Eliminar</button>
            </td>
        `;
        clientList.appendChild(row);
    });
}

async function addClient(event) {
    if (event) event.preventDefault(); // Prevent form submission

    console.log("🚀 addClient() function is running...");

    // Get elements safely
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const identificationInput = document.getElementById("identification");
    const propertySelect = document.getElementById("property");
    const startDateInput = document.getElementById("start_date");
    const endDateInput = document.getElementById("end_date");

    // Debugging: Check which fields are missing
    if (!nameInput) console.error("❌ Missing: #name input");
    if (!emailInput) console.error("❌ Missing: #email input");
    if (!phoneInput) console.error("❌ Missing: #phone input");
    if (!identificationInput) console.error("❌ Missing: #identification input");
    if (!propertySelect) console.error("❌ Missing: #property select");
    if (!startDateInput) console.error("❌ Missing: #start-date input");

    // Check if elements exist before accessing their value
    if (!nameInput || !emailInput || !phoneInput || !identificationInput || !propertySelect || !startDateInput) {
        console.error("❌ One or more input fields are missing in the HTML.");
        return;
    }

    // Now get the values
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value ? phoneInput.value.trim() : null; // Handle empty number field
    const identification = identificationInput.value ? identificationInput.value.trim() : null;
    const propertyId = propertySelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value || null;

    console.log("📌 Client Data to Insert:", {
        name,
        email,
        phone,
        identification,
        property_id: propertyId,
        start_date: startDate,
        end_date: endDate
    });

    if (!name || !email || !phone || !identification || !startDate || !propertyId) {
        console.warn("❌ Missing required fields.");
        showAlert("Error", "Todos los campos obligatorios deben completarse.");
        return;
    }

    console.log("📡 Sending data to Supabase...");

    try {
        const { data, error } = await supabase
            .from("clients")
            .insert([
                {
                    name,
                    email,
                    phone: phone ? parseInt(phone) : null, // Ensure it's stored as an integer
                    identification: identification ? parseInt(identification) : null, // Ensure it's stored as an integer
                    property_id: propertyId,
                    start_date: startDate,
                    end_date: endDate || null
                }
            ])
            .select();

        console.log("🟢 Supabase Insert Response:", data, error);

        if (error) {
            console.error("❌ Supabase Error Details:", error);
            showAlert("Error", `Error al agregar el cliente: ${JSON.stringify(error)}`);
            return;
        }

        showAlert("Éxito","Cliente agregado con éxito.");
        loadClients(); // Refresh the client list
    } catch (err) {
        console.error("🚨 Unhandled Exception:", err);
        showAlert("Error",`❌ Error crítico: ${err.message}`);
    }
}









async function loadProperties() {
    console.log("Fetching properties...");

    const { data, error } = await supabase.from("properties").select("id, name");

    if (error) {
        console.error("Error fetching properties:", error);
        return;
    }

    console.log("Properties fetched:", data);

    const propertyDropdown = document.getElementById("property");
    propertyDropdown.innerHTML = '<option value="">Seleccione una propiedad</option>'; // Reset options

    data.forEach(property => {
        let option = document.createElement("option");
        option.value = property.id; // Ensure the ID is stored, not the name
        option.textContent = property.name;
        propertyDropdown.appendChild(option);
    });

    console.log("Property dropdown updated.");
}


// ✅ Delete a client
async function deleteClient(clientId) {
    if (!confirm("¿Seguro que quieres eliminar este cliente?")) return;

    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
        console.error("Error deleting client:", error);
        showAlert("Error", "Error al eliminar el cliente.");
    } else {
        showAlert("Éxito", "Cliente eliminado con éxito.");
        loadClients(); // Refresh the client list
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ JavaScript Loaded Successfully");

    // Ensure clients and properties are loaded
    loadClients();
    loadProperties();

    // Attach event listener to button
    const addClientBtn = document.getElementById("add-client-btn");
    if (addClientBtn) {
        addClientBtn.addEventListener("click", addClient);
    } else {
        console.error("❌ No button with ID 'add-client-btn' found in the HTML.");
    }
});

// Show Custom Alert
function showAlert(title, message) {
    document.getElementById("alert-title").textContent = title;
    document.getElementById("alert-message").textContent = message;
    document.getElementById("custom-alert").style.display = "block";
    document.getElementById("alert-overlay").style.display = "block";
}

// Close Custom Alert
function closeAlert() {
    document.getElementById("custom-alert").style.display = "none";
    document.getElementById("alert-overlay").style.display = "none";
}


function logout() {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "../index.html";
}
