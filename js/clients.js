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
        console.log("Loading clients...");
        loadClients();
    });
} else {
    console.error("Supabase is not defined. Check initialization.");
}

// Function to add a client
document.getElementById("client-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const identification = document.getElementById("identification").value.trim();
    const property = document.getElementById("property").value.trim();
    const start_date = document.getElementById("start_date").value;
    const end_date = document.getElementById("end_date").value || null;

    if (!name || !phone || !identification || !property || !start_date) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }

    console.log("Attempting to insert client:", { name, email, phone, identification, property, start_date, end_date });

    const { data, error } = await supabase.from("clients").insert([
        { name, email, phone: Number(phone), identification: Number(identification), property, start_date, end_date }
    ]);

    if (error) {
        console.error("Error al crear el cliente:", error);
        alert(`Error al crear el cliente: ${error.message}`);
    } else {
        console.log("Cliente agregado con éxito:", data);
        alert("Cliente agregado con éxito");
        document.getElementById("client-form").reset();
        loadClients(); // Reload the list of clients
    }
});

async function loadClients() {
    console.log("Fetching clients from Supabase...");

    const { data, error } = await supabase.from("clients").select("*");

    if (error) {
        console.error("Error fetching clients:", error);
        return;
    }

    console.log("Clients retrieved:", data); // This will show clients in the console

    const clientList = document.getElementById("client-list");
    clientList.innerHTML = ""; // Clear previous data

    data.forEach(client => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.email || "N/A"}</td>
            <td>${client.phone}</td>
            <td>${client.identification}</td>
            <td>${client.property}</td>
            <td>${client.start_date}</td>
            <td>${client.end_date || "Activo"}</td>
            <td>
                <button class="delete-btn" onclick="deleteClient('${client.id}')">Eliminar</button>
            </td>
        `;
        clientList.appendChild(row);
    });
}


// Function to delete a client
async function deleteClient(clientId) {
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este cliente?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
        console.error("Error al eliminar cliente:", error);
        alert("No se pudo eliminar el cliente");
    } else {
        alert("Cliente eliminado con éxito");
        loadClients(); // Reload list
    }
}

function logout() {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "../index.html";
}
