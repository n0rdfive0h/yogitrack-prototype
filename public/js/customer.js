let formMode = "search"; // Tracks the current mode of the form

document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkSession();
  if (!user) return;
  applyRoleRestrictions(user.role);
  setFormForSearch();
  initCustomerDropdown();
  addCustomerDropdownListener();
});

// SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
  clearCustomerForm();
  setFormForSearch();
  initCustomerDropdown();
});

// ADD
document.getElementById("addBtn").addEventListener("click", async () => {
  setFormForAdd();
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
  if (formMode === "add") {
    await saveCustomer();
  }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
  await deleteCustomer();
});

// Upload CSV button triggers hidden file input
document.getElementById("uploadCSVBtn").addEventListener("click", () => {
    document.getElementById("csvFileInput").click();
});

// When a file is selected, send it to the server
document.getElementById("csvFileInput").addEventListener("change", async () => {
    const file = document.getElementById("csvFileInput").files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("csvFile", file);

    try {
        const res = await fetch("/api/customer/uploadCSV", {
            method: "POST",
            body: formData
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Upload failed");

        alert(`✅ ${result.message}`);
        initCustomerDropdown();
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
});

// Populate customer dropdown
async function initCustomerDropdown() {
  const select = document.getElementById("customerIdSelect");
  // always start clean so you don’t duplicate options
  select.innerHTML = `<option value=""> -- Select Customer Id --</option>`;
  try {
    const response = await fetch("/api/customer/getCustomerIds");
    const customerIds = await response.json();
    customerIds.forEach((cust) => {
      const option = document.createElement("option");
      option.value = cust.customerId;
      option.textContent = `${cust.customerId}:${cust.firstName} ${cust.lastName}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load customer IDs: ", err);
  }
}

async function addCustomerDropdownListener() {
  const form = document.getElementById("customerForm");
  const select = document.getElementById("customerIdSelect");
  select.addEventListener("change", async () => {
    const customerId = select.value;
    if (!customerId) return;
    try {
      const res = await fetch(
        `/api/customer/getCustomer?customerId=${encodeURIComponent(customerId)}`
      );
      if (!res.ok) throw new Error("Customer search failed");

      const data = await res.json();
      if (!data || Object.keys(data).length === 0) {
        alert("No customer found");
        return;
      }

      // Fill form with data
      form.firstName.value = data.firstName || "";
      form.lastName.value = data.lastName || "";
      form.address.value = data.address || "";
      form.phone.value = data.phone || "";
      form.email.value = data.email || "";

      if (data.preferredContact === "phone") {
        form.pref[0].checked = true;
      } else {
        form.pref[1].checked = true;
      }

      document.getElementById("classBalance").value = data.classBalance ?? 0;
    } catch (err) {
      alert(`Error searching customer: ${customerId} - ${err.message}`);
    }
  });
}

function clearCustomerForm() {
  document.getElementById("customerForm").reset();
  document.getElementById("customerIdSelect").innerHTML = "";
}

function setFormForSearch() {
    formMode = "search";
    document.getElementById("customerIdLabel").style.display = "block";
    document.getElementById("customerIdTextLabel").style.display = "none";
    document.getElementById("customerIdText").value = "";
    document.getElementById("customerIdText").style.display = "none";
    document.getElementById("customerForm").reset();
}

function setFormForAdd() {
    formMode = "add";
    document.getElementById("customerIdLabel").style.display = "none";
    document.getElementById("customerIdTextLabel").style.display = "block";
    document.getElementById("customerIdText").value = "";
    document.getElementById("customerForm").reset();
}

async function saveCustomer() {
    try {
        // Get next customer ID
        const idRes = await fetch("/api/customer/getNextId");
        const { nextId } = await idRes.json();

        const form = document.getElementById("customerForm");

        const customerData = {
            customerId: nextId,
            firstName: form.firstName.value.trim(),
            lastName: form.lastName.value.trim(),
            address: form.address.value.trim(),
            phone: form.phone.value.trim(),
            email: form.email.value.trim(),
            preferredContact: form.pref.value,
            senior: form.senior.checked,
            classBalance: parseInt(form.classBalance.value) || 0
        };

        const res = await fetch("/api/customer/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(customerData)
        });

        const result = await res.json();

        // Handle duplicate name response
        if (res.status === 409) {
            const proceed = confirm(`A customer named ${customerData.firstName} ${customerData.lastName} already exists. Continue anyway?`);
            if (!proceed) return;

            // Resend with confirmed flag
            const confirmedRes = await fetch("/api/customer/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...customerData, confirmed: true })
            });

            const confirmedResult = await confirmedRes.json();
            if (!confirmedRes.ok) throw new Error(confirmedResult.message || "Failed to add customer");

            alert(`✅ Customer ${nextId} added successfully!\n\nWelcome to Yoga'Hom! ... Your customer id is ${nextId}.`);
            form.reset();
            setFormForSearch();
            initCustomerDropdown();
            return;
        }

        if (!res.ok) throw new Error(result.message || "Failed to add customer");

        alert(`✅ Customer ${nextId} added successfully!\n\nWelcome to Yoga'Hom! ... Your customer id is ${nextId}.`);
        form.reset();
        setFormForSearch();
        initCustomerDropdown();

    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

async function deleteCustomer() {
    const select = document.getElementById("customerIdSelect");
    const customerId = select.value;

    if (!customerId) {
        alert("Please select a customer to delete.");
        return;
    }

    const ok = confirm(`Delete customer ${customerId}?`);
    if (!ok) return;

    const response = await fetch(`/api/customer/deleteCustomer?customerId=${customerId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("❌ Customer delete failed");
    } else {
        alert(`✅ Customer ${customerId} successfully deleted`);
        clearCustomerForm();
        initCustomerDropdown();
    }
}