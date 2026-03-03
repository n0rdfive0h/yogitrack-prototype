let formMode = "search"; // Tracks the current mode of the form

document.addEventListener("DOMContentLoaded", () => {
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
  if (formMode !== "add") return;

  const form = document.getElementById("customerForm");

  const firstname = form.firstname.value.trim();
  const lastname = form.lastname.value.trim();
  const address = form.address.value.trim();
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();

  // Basic required-field check (matches your use case)
  if (!firstname || !lastname || !address || !phone || !email || !form.pref.value) {
    alert("❌ Please fill out all required fields (including Preferred Contact).");
    return;
  }

  // Check if name already exists (use case requirement)
  try {
    const existsRes = await fetch(
      `/api/customer/checkNameExists?firstname=${encodeURIComponent(firstname)}&lastname=${encodeURIComponent(lastname)}`
    );

    if (existsRes.ok) {
      const { exists, matches } = await existsRes.json();
      if (exists) {
        const msg =
          `A customer named "${firstname} ${lastname}" already exists.\n\n` +
          (Array.isArray(matches) && matches.length
            ? `Matches:\n${matches.map(m => `${m.customerId}: ${m.firstname} ${m.lastname}`).join("\n")}\n\n`
            : "\n") +
          "Continue anyway?";

        const proceed = confirm(msg);
        if (!proceed) return;
      }
    }
  } catch (err) {
    // If this endpoint doesn't exist yet, don't block save—just continue
    console.warn("Name check skipped:", err.message);
  }

  // Get next customer ID
  let nextId = "";
  try {
    const res = await fetch("/api/customer/getNextId");
    const json = await res.json();
    nextId = json.nextId;
    if (!nextId) throw new Error("No nextId returned from server.");
  } catch (err) {
    alert("❌ Error generating customer ID: " + err.message);
    return;
  }

  // Set ID + class balance
  if (document.getElementById("customerIdText")) {
    document.getElementById("customerIdText").value = nextId; // only if your HTML still has it
  }
  if (document.getElementById("customerIdHidden")) {
    document.getElementById("customerIdHidden").value = nextId;
  }
  if (document.getElementById("classBalance")) {
    document.getElementById("classBalance").value = 0;
  }

  const customerData = {
    customerId: nextId,
    firstname,
    lastname,
    address,
    phone,
    email,
    preferredContact: form.pref.value, // "phone" or "email"
    classBalance: 0,
  };

  // Save customer
  try {
    const res = await fetch("/api/customer/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to add customer");

    alert(`✅ Customer ${customerData.customerId} added successfully!`);

    // Send welcome message (use case requirement)
    // Assumes your backend sends via preferred contact method.
    try {
      await fetch("/api/customer/sendWelcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerData.customerId,
          preferredContact: customerData.preferredContact,
          phone: customerData.phone,
          email: customerData.email,
          message: `Welcome to Yoga'Hom! ... Your customer id is ${customerData.customerId}.`,
        }),
      });
    } catch (err) {
      console.warn("Welcome message not sent:", err.message);
    }

    form.reset();
    // Keep class balance at 0 after reset if it exists
    if (document.getElementById("classBalance")) {
      document.getElementById("classBalance").value = 0;
    }

    // Return to search mode + refresh dropdown list
    setFormForSearch();
    clearCustomerForm();
    initCustomerDropdown();
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const select = document.getElementById("customerIdSelect");
  const customerId = (select.value || "").split(":")[0];

  if (!customerId) {
    alert("❌ Please select a customer to delete.");
    return;
  }

  const ok = confirm(`Delete customer ${customerId}?`);
  if (!ok) return;

  const response = await fetch(
    `/api/customer/deleteCustomer?customerId=${encodeURIComponent(customerId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    alert("❌ Customer delete failed");
  } else {
    alert(`✅ Customer with id ${customerId} successfully deleted`);
    clearCustomerForm();
    initCustomerDropdown();
    setFormForSearch();
  }
});

async function initCustomerDropdown() {
  const select = document.getElementById("customerIdSelect");
  if (!select) return;

  // always start clean so you don’t duplicate options
  select.innerHTML = `<option value=""> -- Select Customer Id --</option>`;

  try {
    const response = await fetch("/api/customer/getCustomerIds");
    const customerIds = await response.json();

    customerIds.forEach((cust) => {
      const option = document.createElement("option");
      option.value = cust.customerId;
      option.textContent = `${cust.customerId}:${cust.firstname} ${cust.lastname}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load customer IDs: ", err);
  }
}

async function addCustomerDropdownListener() {
  const form = document.getElementById("customerForm");
  const select = document.getElementById("customerIdSelect");
  if (!form || !select) return;

  select.addEventListener("change", async () => {
    const customerId = (select.value || "").split(":")[0];
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
      form.firstname.value = data.firstname || "";
      form.lastname.value = data.lastname || "";
      form.address.value = data.address || "";
      form.phone.value = data.phone || "";
      form.email.value = data.email || "";

      if (data.preferredContact === "phone") {
        form.pref[0].checked = true;
      } else {
        form.pref[1].checked = true;
      }

      if (document.getElementById("classBalance")) {
        document.getElementById("classBalance").value =
          data.classBalance ?? 0;
      }
    } catch (err) {
      alert(`Error searching customer: ${customerId} - ${err.message}`);
    }
  });
}

function clearCustomerForm() {
  document.getElementById("customerForm").reset();
  const select = document.getElementById("customerIdSelect");
  if (select) select.innerHTML = "";
  if (document.getElementById("classBalance")) {
    document.getElementById("classBalance").value = 0;
  }
}

function setFormForSearch() {
  formMode = "search";
  // Customer page: keep it simple—just show dropdown
  const label = document.getElementById("customerIdLabel");
  if (label) label.style.display = "block";
  if (document.getElementById("customerForm")) {
    document.getElementById("customerForm").reset();
  }
  if (document.getElementById("classBalance")) {
    document.getElementById("classBalance").value = 0;
  }
}

function setFormForAdd() {
  formMode = "add";
  // For add mode, you can hide dropdown so they can’t accidentally select existing
  const label = document.getElementById("customerIdLabel");
  if (label) label.style.display = "none";

  document.getElementById("customerForm").reset();
  if (document.getElementById("classBalance")) {
    document.getElementById("classBalance").value = 0;
  }
}