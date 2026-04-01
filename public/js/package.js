let formMode = "search"; // Tracks the current mode of the form
let saleFormMode = "search";


// -- PACKAGE FORM FUNCTIONS -- 
// Fetch all class IDs and populate the dropdown
document.addEventListener("DOMContentLoaded", async () => {
    const user = await checkSession();
    if (!user) return;
    applyRoleRestrictions(user.role);
    setFormForSearch();
    setFormForSaleSearch();
    initPackageDropdown();
    initCustomerDropdown();
    initSalePackageDropdown();
    addPackageDropdownListener();
    addSaleDropdownListener();
    addSalePackageDropdownListener();
});

//SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
    clearPackageForm();
    setFormForSearch();
    initPackageDropdown();
});

//ADD
document.getElementById("addBtn").addEventListener("click", async () => {
    setFormForAdd();
});

//SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
    if (formMode === "add") {
        await savePackage();
    }
});

//DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
    await deletePackage();
});

//Populate package dropdown
async function initPackageDropdown() {
    const select = document.getElementById("packageIdSelect");
    select.innerHTML = "<option value=''>-- Select Package Id --</option>";
    try {
        const response = await fetch("/api/package/getPackageIds");
        const packageIds = await response.json();
        packageIds.forEach((p) => {
            const option = document.createElement("option");
            option.value = p.packageId;
            option.textContent = `${p.packageId}: ${p.packageName}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load package IDs:", err);
    }
}

async function savePackage() {
    try {
        // Validate form before proceeding
        const form = document.getElementById("packageForm");
        
        if (!form.packageName.value.trim() || !form.packageCategory.value || 
            !form.classNum.value || !form.classType.value.trim() ||
            !form.startDate.value || !form.endDate.value || !form.price.value) {
            throw new Error("All fields are required");
        }
        
        // Validate price is a positive number
        const price = parseFloat(form.price.value);
        if (isNaN(price) || price <= 0) {
            throw new Error("Price must be a positive number");
        }
        
        // Handle classNum - can be "Unlimited" or a positive number
        const classNum = form.classNum.value;
        if (classNum !== "Unlimited") {
            const classNumValue = parseInt(classNum);
            if (isNaN(classNumValue) || classNumValue <= 0) {
                throw new Error("Class number must be a positive number");
            }
        }
        
        // Validate date range
        const startDate = new Date(form.startDate.value);
        const endDate = new Date(form.endDate.value);
        if (endDate <= startDate) {
            throw new Error("End date must be after start date");
        }

        // Get next package ID with error handling
        const idRes = await fetch(`/api/package/getNextPackageId?packageCategory=${form.packageCategory.value}`);
        if (!idRes.ok) {
            throw new Error("Failed to get next package ID");
        }
        const { nextId } = await idRes.json();

        const packageData = {
            packageId: nextId,
            packageName: form.packageName.value.trim(),
            packageCategory: form.packageCategory.value,
            classNum: classNum,
            classType: form.classType.value,
            startDate: form.startDate.value,
            endDate: form.endDate.value,
            price: price
        };

        const res = await fetch("/api/package/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(packageData)
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.message || "Failed to add package");
        }

        alert(`✅ Package ${nextId} scheduled successfully!`);
        form.reset();
        await initPackageDropdown();

    } catch (err) {
        alert("❌ Error: " + err.message);
        console.error("Save error:", err);
    }
}

// Populate form when package is selected from dropdown
async function addPackageDropdownListener() {
    const form = document.getElementById("packageForm");
    const select = document.getElementById("packageIdSelect");
    select.addEventListener("change", async () => {
        const packageId = select.value;
        if (!packageId) return;
        try {
            const res = await fetch(`/api/package/getPackage?packageId=${packageId}`);
            if (!res.ok) throw new Error("Package search failed");

            const data = await res.json();
            if (!data || Object.keys(data).length === 0) {
                alert("No package found");
                return;
            }

            // Fill form with data
            form.packageName.value = data.packageName || "";
            form.packageCategory.value = data.packageCategory || "";
            form.classNum.value = data.classNum || "";
            form.classType.value = data.classType || "";
            form.startDate.value = data.startDate || "";
            form.endDate.value = data.endDate || "";
            form.price.value = data.price || "";
        

        } catch (err) {
            alert(`Error loading package: ${err.message}`);
        }
    });
}

async function deletePackage() {
    const select = document.getElementById("packageIdSelect");
    const packageId = select.value;

    if (!packageId) {
        alert("Please select a package to delete.");
        return;
    }

    const ok = confirm(`Delete package ${packageId}?`);
    if (!ok) return;

    const response = await fetch(`/api/package/deletePackage?packageId=${packageId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throw new Error("Package delete failed");
    } else {
        alert(`Package ${packageId} successfully deleted`);
        clearPackageForm();
        initPackageDropdown();
    }
}

function clearPackageForm() {
    document.getElementById("packageForm").reset();
    document.getElementById("packageIdSelect").innerHTML = "";
    
    
}

function setFormForSearch() {
    formMode = "search";
    document.getElementById("packageIdLabel").style.display = "block";
    document.getElementById("packageIdTextLabel").style.display = "none";
    document.getElementById("packageIdText").value = "";
    document.getElementById("packageIdText").style.display = "none";
    document.getElementById("packageForm").reset();
}

function setFormForAdd() {
    formMode = "add";
    document.getElementById("packageIdLabel").style.display = "none";
    document.getElementById("packageIdTextLabel").style.display = "block";
    document.getElementById("packageIdText").value = "";
    document.getElementById("packageForm").reset();
}


// -- SALE FORM FUNCTIONS -- 
// SALE SEARCH
document.getElementById("saleSearchBtn").addEventListener("click", async () => {
    clearSaleForm();
    setFormForSaleSearch();
    initSaleDropdown();
});

// SALE ADD
document.getElementById("saleAddBtn").addEventListener("click", async () => {
    setFormForSaleAdd();
    initCustomerDropdown();
    initSalePackageDropdown();
});

// SALE SAVE
document.getElementById("saleSaveBtn").addEventListener("click", async () => {
    if (saleFormMode === "add") {
        await saveSale();
    }
});

// SALE DELETE
document.getElementById("saleDeleteBtn").addEventListener("click", async () => {
    await deleteSale();
});

// Populate sale dropdown
async function initSaleDropdown() {
    const select = document.getElementById("saleIdSelect");
    select.innerHTML = "<option value=''>-- Select Sale Id --</option>";
    try {
        const response = await fetch("/api/package/getSaleIds");
        const saleIds = await response.json();
        saleIds.forEach((s) => {
            const option = document.createElement("option");
            option.value = s.saleId;
            option.textContent = `${s.saleId}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load sale IDs:", err);
    }
}

// Populate customer dropdown for sale form
async function initCustomerDropdown() {
    const select = document.getElementById("customerIdSelect");
    select.innerHTML = "<option value=''>-- Select Customer --</option>";
    try {
        const response = await fetch("/api/customer/getCustomerIds");
        const customerIds = await response.json();
        customerIds.forEach((c) => {
            const option = document.createElement("option");
            option.value = c.customerId;
            option.textContent = `${c.customerId}: ${c.firstName} ${c.lastName}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load customer IDs:", err);
    }
}

// Populate package dropdown for sale form
async function initSalePackageDropdown() {
    const select = document.getElementById("salePackageIdSelect");
    select.innerHTML = "<option value=''>-- Select Package --</option>";
    try {
        const response = await fetch("/api/package/getPackageIds");
        const packageIds = await response.json();
        packageIds.forEach((p) => {
            const option = document.createElement("option");
            option.value = p.packageId;
            option.textContent = `${p.packageId}: ${p.packageName}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load package IDs:", err);
    }
}

async function saveSale() {
    try {
        const form = document.getElementById("packageSaleForm");

        // Get next sale ID
        const idRes = await fetch("/api/package/getNextSaleId");
        const { nextId } = await idRes.json();

        const purchaseDate = form.purchaseDate.value;
        const purchaseTime = form.purchaseTime.value;
        const dateTime = `${purchaseDate} ${purchaseTime}`;

        const saleData = {
            saleId: nextId,
            customerId: form.customerId.value,
            Package: {
                packageId: document.getElementById("salePackageIdSelect").value,
                startDate: form.startDate.value,
                endDate: form.endDate.value,
                amountPaid: parseFloat(form.amountPaid.value)
            },
            paymentMode: form.modeOfPayment.value.trim(),
            dateTime: dateTime
        };

        const res = await fetch("/api/package/addSale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saleData)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to log sale");

        // Fetch updated customer balance
        const customerRes = await fetch(`/api/customer/getCustomer?customerId=${saleData.customerId}`);
        const customerData = await customerRes.json();

        alert(`✅ Sale ${nextId} logged successfully!\n\nCustomer ${saleData.customerId} class balance updated to: ${customerData.classBalance}`);
        form.reset();
        initSaleDropdown();
        initCustomerDropdown();

    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

async function deleteSale() {
    const select = document.getElementById("saleIdSelect");
    const saleId = select.value;

    if (!saleId) {
        alert("Please select a sale to delete.");
        return;
    }

    const ok = confirm(`Delete sale ${saleId}?`);
    if (!ok) return;

    const response = await fetch(`/api/package/deleteSale?saleId=${saleId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        alert("❌ Sale delete failed");
    } else {
        alert(`✅ Sale ${saleId} successfully deleted`);
        clearSaleForm();
        initSaleDropdown();
    }
}

async function addSaleDropdownListener() {
    const form = document.getElementById("packageSaleForm");
    const select = document.getElementById("saleIdSelect");
    select.addEventListener("change", async () => {
        const saleId = select.value;
        if (!saleId) return;
        try {
            const res = await fetch(`/api/package/getSale?saleId=${saleId}`);
            if (!res.ok) throw new Error("Sale search failed");

            const data = await res.json();
            if (!data || Object.keys(data).length === 0) {
                alert("No sale found");
                return;
            }

            // Fill form with data
            form.customerId.value = data.customerId || "";
            form.packageId.value = data.Package.packageId || "";
            form.startDate.value = data.Package.startDate || "";
            form.endDate.value = data.Package.endDate || "";
            form.amountPaid.value = data.Package.amountPaid || "";
            form.modeOfPayment.value = data.paymentMode || "";

            // Split dateTime back into date and time
            if (data.dateTime) {
                const [date, time] = data.dateTime.split(" ");
                form.purchaseDate.value = date || "";
                form.purchaseTime.value = time || "";
            }

        } catch (err) {
            alert(`Error loading sale: ${err.message}`);
        }
    });
}

async function addSalePackageDropdownListener() {
    const form = document.getElementById("packageSaleForm");
    const select = document.getElementById("salePackageIdSelect");
    select.addEventListener("change", async () => {
        const packageId = select.value;
        if (!packageId) return;
        try {
            const res = await fetch(`/api/package/getPackage?packageId=${packageId}`);
            if (!res.ok) throw new Error("Package fetch failed");

            const data = await res.json();

            // Auto populate fields from package
            form.startDate.value = data.startDate || "";
            form.endDate.value = data.endDate || "";
            form.amountPaid.value = data.price || "";

        } catch (err) {
            alert(`Error loading package details: ${err.message}`);
        }
    });
}

function clearSaleForm() {
    document.getElementById("packageSaleForm").reset();
    document.getElementById("saleIdSelect").innerHTML = "";
}

function setFormForSaleAdd() {
    saleFormMode = "add";
    document.getElementById("packageSaleForm").reset();
    document.getElementById("saleIdLabel").style.display = "none";
    document.getElementById("saleIdTextLabel").style.display = "block";
    document.getElementById("saleIdText").value = "";
    document.getElementById("salePackageIdLabel").style.display = "block";
    document.getElementById("salePackageIdTextLabel").style.display = "none";
}

function setFormForSaleSearch() {
    saleFormMode = "search";
    document.getElementById("saleIdLabel").style.display = "block";
    document.getElementById("saleIdTextLabel").style.display = "none";
    document.getElementById("saleIdText").value = "";
    document.getElementById("salePackageIdLabel").style.display = "block";
    document.getElementById("salePackageIdTextLabel").style.display = "none";
    document.getElementById("salePackageIdText").value = "";
    document.getElementById("packageSaleForm").reset();
}