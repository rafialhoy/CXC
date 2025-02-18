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

// Load dashboard metrics
document.addEventListener("DOMContentLoaded", async () => {
    await loadDashboardMetrics();
    await loadRevenueChart();
});

// Fetch & display key metrics
async function loadDashboardMetrics() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    console.log("Fetching invoices from Supabase...");
    
    const { data: invoices, error: invoiceError } = await supabase
        .from("invoices")
        .select("rent_amount, services_amount, due_date, status");

    if (invoiceError) {
        console.error("Error fetching invoices:", invoiceError);
        return;
    }

    console.log("Fetching clients from Supabase...");

    const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, start_date, end_date");

    if (clientError) {
        console.error("Error fetching clients:", clientError);
        return;
    }

    // Compute metrics
    let totalInvoiced = 0;
    let totalPaid = 0;
    let activeClients = 0;
    let totalStayMonths = 0;

    invoices.forEach(invoice => {
        const invoiceMonth = invoice.due_date.slice(0, 7); // YYYY-MM
        const totalAmount = parseFloat(invoice.rent_amount) + parseFloat(invoice.services_amount);

        if (invoiceMonth === currentMonth) {
            totalInvoiced += totalAmount;
            if (invoice.status === "paid") {
                totalPaid += totalAmount;
            }
        }
    });

    clients.forEach(client => {
        if (!client.end_date) {
            activeClients++;
        }
        const start = new Date(client.start_date);
        const end = client.end_date ? new Date(client.end_date) : new Date();
        totalStayMonths += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    });

    const avgStay = activeClients > 0 ? (totalStayMonths / activeClients).toFixed(1) : "N/A";

    // Display results
    document.getElementById("total-invoiced").textContent = `$${totalInvoiced.toLocaleString()}`;
    document.getElementById("total-paid").textContent = `$${totalPaid.toLocaleString()}`;
    document.getElementById("active-clients").textContent = activeClients;
    document.getElementById("avg-stay").textContent = avgStay;
}

// Load and display revenue chart for last 12 months
async function loadRevenueChart() {
    console.log("Fetching revenue data...");
    
    const { data: invoices, error } = await supabase
        .from("invoices")
        .select("rent_amount, services_amount, due_date");

    if (error) {
        console.error("Error fetching revenue data:", error);
        return;
    }

    const revenueData = {};
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
            .toISOString().slice(0, 7); // YYYY-MM
        revenueData[month] = 0;
    }

    invoices.forEach(invoice => {
        const invoiceMonth = invoice.due_date.slice(0, 7);
        if (revenueData[invoiceMonth] !== undefined) {
            revenueData[invoiceMonth] += parseFloat(invoice.rent_amount) + parseFloat(invoice.services_amount);
        }
    });

    const labels = Object.keys(revenueData);
    const values = Object.values(revenueData);

    // Render Chart
    new Chart(document.getElementById("revenueChart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Ingresos Mensuales (COP)",
                data: values,
                borderColor: "#007bff",
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

async function loadPropertyRevenueChart() {
    console.log("📡 Fetching property revenue and active tenants...");

    // Fetch invoices to get revenue per property
    const { data: revenueData, error: revenueError } = await supabase
        .from("invoices")
        .select("client_id, rent_amount, services_amount");

    if (revenueError) {
        console.error("❌ Error fetching revenue data:", revenueError);
        return;
    }

    // Fetch active clients (tenants) and their assigned properties
    const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, property_id, end_date");

    if (clientsError) {
        console.error("❌ Error fetching clients:", clientsError);
        return;
    }

    // Fetch all properties with their names
    const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name");

    if (propertiesError) {
        console.error("❌ Error fetching properties:", propertiesError);
        return;
    }

    // Mapping: Client ID → Property ID & Name
    const clientToPropertyMap = {};
    clientsData.forEach(client => {
        clientToPropertyMap[client.id] = {
            property_id: client.property_id,
            name: client.name,
            isActive: !client.end_date || new Date(client.end_date) > new Date() // Check if rental is still active
        };
    });

    // Mapping: Property ID → Property Name & Active Tenant
    const propertyRevenue = {};
    propertiesData.forEach(property => {
        propertyRevenue[property.id] = { 
            name: property.name, 
            totalRevenue: 0, 
            tenant: "Vacante" // Default value
        };
    });

    // Calculate revenue per property and assign tenants
    revenueData.forEach(invoice => {
        const tenant = clientToPropertyMap[invoice.client_id];
        if (tenant && tenant.isActive) {
            const propertyId = tenant.property_id;
            if (propertyRevenue[propertyId]) {
                propertyRevenue[propertyId].totalRevenue += 
                    parseFloat(invoice.rent_amount) + parseFloat(invoice.services_amount);
                propertyRevenue[propertyId].tenant = tenant.name; // Assign active tenant
            }
        }
    });

    // Convert object to sorted array
    const sortedProperties = Object.values(propertyRevenue).sort((a, b) => b.totalRevenue - a.totalRevenue);

    console.log("📊 Sorted Properties Revenue:", sortedProperties);

    // Update the table in the dashboard
    updateRevenueTable(sortedProperties);
}


function updateRevenueTable(sortedProperties) {
    const tableBody = document.getElementById("property-revenue-list");
    tableBody.innerHTML = ""; // Clear previous data

    sortedProperties.forEach(property => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${property.name}</td>
            <td>$${property.totalRevenue.toLocaleString()}</td>
            <td>${property.tenant ? property.tenant : "Vacante"}</td>

        `;
        tableBody.appendChild(row);
    });
}



// Load data when the page loads
document.addEventListener("DOMContentLoaded", () => {
    loadPropertyRevenueChart();
});





function logout() {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "../index.html";
}

