document.addEventListener("DOMContentLoaded", async () => {
    const user = await checkSession();
    if (!user) return;
    applyRoleRestrictions(user.role);
    initRecipientDropdown();
});

// SEND
document.getElementById("sendBtn").addEventListener("click", async () => {
    await sendMessage();
});

// CLEAR
document.getElementById("clearBtn").addEventListener("click", () => {
    clearMessagingForm();
});

async function initRecipientDropdown() {
    const select = document.getElementById("recipientSelect");
    select.innerHTML = `<option value="all"> -- Send to All Opted-In Customers --</option>`;
    try {
        const response = await fetch("/api/customer/getCustomerIds");
        const customers = await response.json();
        customers.forEach((cust) => {
            const option = document.createElement("option");
            option.value = cust.customerId;
            option.textContent = `${cust.customerId}: ${cust.firstName} ${cust.lastName}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load customers:", err);
    }
}

async function sendMessage() {
    const recipient = document.getElementById("recipientSelect").value;
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!subject || !message) {
        alert("❌ Please fill out both subject and message fields.");
        return;
    }

    try {
        let res;

        if (recipient === "all") {
            res = await fetch("/api/messaging/sendToAll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, message })
            });
        } else {
            res = await fetch("/api/messaging/sendToCustomer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerId: recipient, subject, message })
            });
        }

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to send message");

        alert(`✅ ${result.message}`);
        clearMessagingForm();

    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

function clearMessagingForm() {
    document.getElementById("subject").value = "";
    document.getElementById("message").value = "";
    document.getElementById("recipientSelect").value = "all";
}