// Ensure Supabase SDK is loaded from the global script
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
        console.log("Loading clients into dropdown...");
        loadClients();
    });
} else {
    console.error("Supabase is not defined. Check initialization.");
}

// Function to load invoices
async function loadInvoices() {
    console.log("Fetching invoices from Supabase...");
    
    const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, client_id, rent_amount, services_amount, due_date, status");

    if (error) {
        console.error("Error fetching invoices:", error);
        return;
    }

    const clientMap = await fetchClientNames();
    const invoiceList = document.getElementById("invoice-list");
    invoiceList.innerHTML = ""; // Clear previous entries

    data.forEach(invoice => {
        let totalAmount = parseFloat(invoice.rent_amount) + parseFloat(invoice.services_amount);

        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${invoice.invoice_number}</td>
            <td>${clientMap[invoice.client_id] || "Desconocido"}</td>
            <td>$${invoice.rent_amount.toLocaleString()}</td>
            <td>$${invoice.services_amount.toLocaleString()}</td>
            <td>$${totalAmount.toLocaleString()}</td>
            <td>${invoice.due_date}</td>
            <td>${invoice.status === "pending" ? "Pendiente" : "Pagado"}</td>
            <td>
                ${invoice.status === "pending" ? 
                    `<button class="mark-paid" onclick="markAsPaid('${invoice.id}')">Marcar Pagado</button>` 
                    : ""}
            </td>
        `;
        invoiceList.appendChild(row);
    });
}

// Function to get client names
async function fetchClientNames() {
    const { data, error } = await supabase.from("clients").select("id, name");

    if (error) {
        console.error("Error fetching clients:", error);
        return {};
    }

    return data.reduce((map, client) => {
        map[client.id] = client.name;
        return map;
    }, {});
}

function updateTable(data, clientMap) {
    const invoiceList = document.getElementById("invoice-list");
    invoiceList.innerHTML = ""; // Clear previous data

    data.forEach(invoice => {
        let totalAmount = parseFloat(invoice.rent_amount) + parseFloat(invoice.services_amount);

        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${invoice.invoice_number}</td>
            <td>${clientMap[invoice.client_id] || "Desconocido"}</td>
            <td>$${invoice.rent_amount.toLocaleString()}</td>
            <td>$${invoice.services_amount.toLocaleString()}</td>
            <td>$${totalAmount.toLocaleString()}</td>
            <td>${invoice.due_date}</td>
            <td>${invoice.status === "pending" ? "Pendiente" : "Pagado"}</td>
            <td>
                ${invoice.status === "pending" ? 
                    `<button class="mark-paid" onclick="markAsPaid('${invoice.id}')">Marcar Pagado</button>` 
                    : ""}
            </td>
        `;
        invoiceList.appendChild(row);
    });

    console.log("Updated table with filtered data");
}


async function filterInvoices() {
    console.log("Applying filters...");

    const clientName = document.getElementById("client-filter").value.toLowerCase();
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const status = document.getElementById("status-filter").value;

    // Fetch all invoices again
    let { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, client_id, rent_amount, services_amount, due_date, status");

    if (error) {
        console.error("Error fetching invoices:", error);
        return;
    }

    console.log("Invoices before filtering:", data);

    const clientMap = await fetchClientNames();

    // Apply Client Name Filter
    if (clientName) {
        data = data.filter(invoice => 
            clientMap[invoice.client_id]?.toLowerCase().includes(clientName)
        );
    }

    // Apply Date Filters
    if (startDate) {
        data = data.filter(invoice => new Date(invoice.due_date) >= new Date(startDate));
    }
    if (endDate) {
        data = data.filter(invoice => new Date(invoice.due_date) <= new Date(endDate));
    }

    // Apply Status Filter
    if (status) {
        data = data.filter(invoice => invoice.status === status);
    }

    console.log("Invoices after filtering:", data);

    updateTable(data, clientMap);
}


// Function to mark an invoice as paid
async function markAsPaid(invoiceId) {
    const { error } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);

    if (error) {
        console.error("Error updating invoice:", error);
    } else {
        loadInvoices(); // Refresh list
    }
}

// Load invoices on page load
document.addEventListener("DOMContentLoaded", loadInvoices);

function logout() {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "../index.html";
}
