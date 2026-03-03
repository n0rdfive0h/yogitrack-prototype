let formMode = "search"; // Tracks the current mode of the form

// Fetch all class IDs and populate the dropdown
document.addEventListener("DOMContentLoaded", () => {
    setFormForSearch();
    initPackageDropdown();
    addPackageDropdownListener();
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
    select.innerHTML = "<option value=''>-- Select Class Id --</option>";
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
        
        if (!form.package.value.trim() || !form.packageType.value || 
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
        const idRes = await fetch("/api/package/getNextId");
        if (!idRes.ok) {
            throw new Error("Failed to get next package ID");
        }
        const { nextId } = await idRes.json();

        const packageData = {
            packageId: nextId,
            package: form.package.value.trim(),
            packageType: form.packageType.value,
            classNum: classNum,  // Keep as-is (either "Unlimited" or numeric string)
            classType: form.classType.value.trim(),
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
            form.package.value = data.package || "";
            form.packageType.value = data.packageType || "";
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

