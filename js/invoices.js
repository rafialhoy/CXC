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


// Load clients into dropdown
async function loadClients() {
    const { data, error } = await supabase.from("clients").select("id, name");

    if (error) {
        console.error("Error fetching clients:", error);
        return;
    }

    console.log("Clients fetched:", data); // Log fetched clients


    const clientDropdown = document.getElementById("client");
    data.forEach(client => {
        let option = document.createElement("option");
        option.value = client.id;
        option.textContent = client.name;
        clientDropdown.appendChild(option);
    });
}

// Create invoice on form submission
document.getElementById("invoice-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const clientId = document.getElementById("client").value;
    const rentAmount = document.getElementById("rent_amount").value;
    const servicesAmount = document.getElementById("services_amount").value;
    const dueDate = document.getElementById("due_date").value;

    if (!clientId || !rentAmount || !servicesAmount || !dueDate) {
        alert("Todos los campos son obligatorios");
        return;
    }

    console.log("Fetching client details...");

    // Fetch client data
    const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

    if (clientError || !clientData) {
        console.error("Error fetching client details:", clientError);
        alert("No se pudo obtener la información del cliente.");
        return;
    }

    console.log("Fetching highest invoice number...");

    const { data: maxInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("invoice_number", { ascending: false })
        .limit(1);
    
    let newInvoiceNumber = "0001"; // Default for first invoice
    
    if (maxInvoice.length > 0 && maxInvoice[0].invoice_number) {
        const lastNumber = parseInt(maxInvoice[0].invoice_number, 10);
        newInvoiceNumber = String(lastNumber + 1).padStart(4, "0"); // Ensure it's always 4 digits
    }

    console.log("New invoice number:", newInvoiceNumber);

    console.log("Generating PDF...");
    generatePDFInvoice(clientData, newInvoiceNumber, rentAmount, servicesAmount, dueDate);

    console.log("Saving invoice to database...");

    // Insert the new invoice into Supabase
    const { error: insertError } = await supabase
        .from("invoices")
        .insert([{ 
            client_id: clientId, 
            invoice_number: newInvoiceNumber, 
            rent_amount: parseFloat(rentAmount),
            services_amount: parseFloat(servicesAmount),
            due_date: dueDate 
        }]);

    if (insertError) {
        console.error("Error saving invoice:", insertError);
        alert("Error al guardar la factura en la base de datos.");
    } else {
        alert("Factura generada y guardada con éxito.");
        document.getElementById("invoice-form").reset();
    }
});

function generatePDFInvoice(client, invoiceNumber, rentAmount, servicesAmount, dueDate) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logoURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAV4AAABkCAYAAADOvVhlAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAE0GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTAyLTEzPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPmIyNTdjMjhkLTNkMDUtNDZjOS04MjgzLWNjZGQyMjlhMWQxZTwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5Db3B5IG9mIHdlYnNpdGVsb2dvIGJpZyAtIDE8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRl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"; // Replace with actual URL or Base64


    const logoWidth = 60; // Adjust width as needed
const logoHeight = 20; // Adjust height as needed

// Get page width
const pageWidth = doc.internal.pageSize.getWidth();

// Calculate centered X position
const logoX = (pageWidth - logoWidth) / 2;
const logoY = 10; // Adjust Y position as needed

// Add centered logo
doc.addImage(logoURL, "PNG", logoX, logoY, logoWidth, logoHeight);

    // Company Information
    const companyInfo = {
        name: "Office Space 96 SaS",
        nit: "900.914.143",
        city: "Barranquilla",
        bank: "Bancolombia S.A.",
        account: "40427585330",
        cedula: "8739922",
        contact: "Rafael Alvarez Serrano",
        phone: "3126194336",
    };

    // Invoice Header (Left-aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Fecha: ${dueDate}`, 20, 20);
    doc.text(`Ciudad: ${companyInfo.city}`, 20, 25);


    doc.setFontSize(21);
    doc.text(`Cuenta de Cobro #${invoiceNumber}`, pageWidth / 2, 50, { align: "center" });

    doc.setFontSize(14);
    doc.text(`${client.name}`, pageWidth / 2, 75, { align: "center" });
    doc.text(`${client.identification}`, pageWidth / 2, 80, { align: "center" });

    doc.setFontSize(8);
    doc.text("DEBE A:", pageWidth / 2, 95, { align: "center" });
    doc.setFont("helvetica", "bold");

    doc.setFontSize(14);
    doc.text(`${companyInfo.name}`, pageWidth / 2, 110, { align: "center" });
    doc.text(`NIT. ${companyInfo.nit}`, pageWidth / 2, 115, { align: "center" });

    doc.setFontSize(8);
    doc.text("LA SUMA DE:", pageWidth / 2, 135, { align: "center" });

    doc.setFontSize(14);
    doc.text(`$${(parseFloat(rentAmount) + parseFloat(servicesAmount)).toLocaleString()}`, pageWidth / 2, 150, { align: "center" });

    // Table with Rent & Services Breakdown
    doc.autoTable({
        startY: 165,
        head: [["Concepto", "Valor", "Cantidad", "Total"]],
        body: [
            ["ARRIENDO", `$${parseFloat(rentAmount).toLocaleString()}`, "1", `$${parseFloat(rentAmount).toLocaleString()}`],
            ["CONSUMO ENERGIA", `$${parseFloat(servicesAmount).toLocaleString()}`, "1", `$${parseFloat(servicesAmount).toLocaleString()}`],
        ],
        foot: [["TOTAL", "", "", `$${(parseFloat(rentAmount) + parseFloat(servicesAmount)).toLocaleString()}`]],
        theme: "grid",
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }, // Black header, White text
    footStyles: { fillColor: [0, 123, 255], textColor: [255, 255, 255], fontStyle: "bold" }, // TOTAL row (Blue background, White text)
    styles: { fontSize: 10, cellPadding: 5 }
    });

    // Payment Details (Centered)
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text("Consignar a la cuenta:", 20, finalY, { align: "left" });
    doc.text(`Banco: ${companyInfo.bank}`, 20, finalY + 5, { align: "left" });
    doc.text(`Cuenta de ahorros: ${companyInfo.account}`, 20, finalY + 10, { align: "left" });
    doc.text(`Cédula de ciudadanía: ${companyInfo.cedula}`, 20, finalY + 15, { align: "left" });

    // Contact Info (Centered)
    doc.setFont("helvetica", "bold");
    doc.text("Cordialmente,", 20, finalY + 30);
    doc.text(`${companyInfo.contact}`, 20, finalY + 35);
    doc.text(`C.C. ${companyInfo.cedula}`, 20, finalY + 40);
    doc.text(`Teléfono ${companyInfo.phone}`, 20, finalY + 45);

    doc.save(`Factura-${invoiceNumber}.pdf`);
}







function logout() {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "../index.html";
}
