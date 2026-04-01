let formMode = "search"; // Tracks the current mode of the form
let isDrawing = false;
let signatureData = null;
let hasDrawn = false;

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
  if (formMode !== "add") return;

  const form = document.getElementById("customerForm");

  // Basic validation first
  if (!form.firstName.value.trim() || !form.lastName.value.trim() || 
      !form.address.value.trim() || !form.phone.value.trim() || 
      !form.email.value.trim()) {
      alert("❌ Please fill out all required fields.");
      return;
  }

  // Show waiver modal
  showWaiverModal();
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
      option.textContent = `${cust.customerId}: ${cust.firstName} ${cust.lastName}`;
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

async function saveCustomer(signature) {
  try {
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
          optIn: form.optIn.checked,
          classBalance: parseInt(form.classBalance.value) || 0,
          signature: signature
      };

      const res = await fetch("/api/customer/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerData)
      });

      const result = await res.json();

      if (res.status === 409) {
          const proceed = confirm(`A customer named ${customerData.firstName} ${customerData.lastName} already exists. Continue anyway?`);
          if (!proceed) return;

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

function initSignatureCanvas() {
  const canvas = document.getElementById("signatureCanvas");
  const ctx = canvas.getContext("2d");

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // Mouse events
  canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    hasDrawn = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  });

  canvas.addEventListener("mousemove", (e) => {
      if (!isDrawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
  });

  canvas.addEventListener("mouseup", () => isDrawing = false);
  canvas.addEventListener("mouseleave", () => isDrawing = false);

  // Touch events for tablet/mobile
  canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  isDrawing = true;
  hasDrawn = true;
  ctx.beginPath();
  ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
});

  canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      ctx.stroke();
  });

  canvas.addEventListener("touchend", () => isDrawing = false);
}

function isCanvasBlank() {
  const canvas = document.getElementById("signatureCanvas");
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  return pixels.every(pixel => pixel === 0);
}

document.getElementById("clearSignatureBtn").addEventListener("click", () => {
  const canvas = document.getElementById("signatureCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasDrawn = false;
});

function showWaiverModal() {
    const modal = document.getElementById("waiverModal");
    modal.style.display = "flex";
    initSignatureCanvas();
}

function hideWaiverModal() {
    const modal = document.getElementById("waiverModal");
    modal.style.display = "none";
    // Clear signature when closing
    const canvas = document.getElementById("signatureCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Cancel button
document.getElementById("cancelWaiverBtn").addEventListener("click", () => {
    hideWaiverModal();
});

document.getElementById("confirmSaveBtn").addEventListener("click", async () => {
    // Check if signature is blank
    if (!hasDrawn) {
        alert("❌ Please sign the waiver before confirming.");
        return;
    }

    // Convert signature to base64
    const canvas = document.getElementById("signatureCanvas");
    signatureData = canvas.toDataURL("image/png");

    hideWaiverModal();
    await saveCustomer(signatureData);
});

