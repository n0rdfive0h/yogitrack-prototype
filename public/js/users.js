let formMode = "search";
let currentUserRole = null;

document.addEventListener("DOMContentLoaded", async () => {
    const user = await checkSession();
    if (!user) return;

    // Redirect instructors away from this page
    if (user.role !== "manager") {
        window.location.href = "dashboard.html";
        return;
    }

    currentUserRole = user.role;
    setFormForSearch();
    initUserDropdown();
    addUserDropdownListener();
});

// SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
    clearUserForm();
    setFormForSearch();
    initUserDropdown();
});

// ADD
document.getElementById("addBtn").addEventListener("click", () => {
    setFormForAdd();
});

// EDIT
document.getElementById("editBtn").addEventListener("click", () => {
    const userId = document.getElementById("userIdSelect").value;
    if (!userId) {
        alert("Please select a user to edit.");
        return;
    }
    setFormForEdit();
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
    if (formMode === "add") {
        await saveUser();
    } else if (formMode === "edit") {
        await updateUser();
    }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
    await deleteUser();
});

async function initUserDropdown() {
    const select = document.getElementById("userIdSelect");
    select.innerHTML = "<option value=''>-- Select User --</option>";
    try {
        const response = await fetch("/api/auth/getUserIds");
        const userIds = await response.json();
        userIds.forEach((u) => {
            const option = document.createElement("option");
            option.value = u.userId;
            const label = u.deactivated ? " (DEACTIVATED)" : "";
            option.textContent = `${u.userId}: ${u.firstName} ${u.lastName}${label}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load user IDs:", err);
    }
}

async function addUserDropdownListener() {
    const form = document.getElementById("userForm");
    const select = document.getElementById("userIdSelect");
    select.addEventListener("change", async () => {
        const userId = select.value;
        if (!userId) return;
        try {
            const res = await fetch(`/api/auth/getUser?userId=${userId}`);
            if (!res.ok) throw new Error("User search failed");

            const data = await res.json();
            if (!data || Object.keys(data).length === 0) {
                alert("No user found");
                return;
            }

            form.firstName.value = data.firstName || "";
            form.lastName.value = data.lastName || "";
            form.email.value = data.email || "";
            form.role.value = data.role || "";
            document.getElementById("deactivated").checked = data.deactivated || false;
            // Password is intentionally not populated for security

        } catch (err) {
            alert(`Error loading user: ${err.message}`);
        }
    });
}

async function saveUser() {
    try {
        const form = document.getElementById("userForm");

        const userData = {
            firstName: form.firstName.value.trim(),
            lastName: form.lastName.value.trim(),
            email: form.email.value.trim(),
            password: form.password.value.trim(),
            role: form.role.value
        };

        if (!userData.firstName || !userData.lastName || !userData.email || !userData.password || !userData.role) {
            alert("❌ Please fill out all required fields.");
            return;
        }

        const res = await fetch("/api/auth/createCredentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const result = await res.json();

        if (res.status === 409) {
            alert("❌ An account with this email already exists.");
            return;
        }

        if (!res.ok) throw new Error(result.message || "Failed to create user");

        alert(`✅ User ${result.userId} created successfully!`);
        clearUserForm();
        setFormForSearch();
        initUserDropdown();

    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

async function deleteUser() {
    const select = document.getElementById("userIdSelect");
    const userId = select.value;

    if (!userId) {
        alert("Please select a user to delete.");
        return;
    }

    const ok = confirm(`Delete user ${userId}?`);
    if (!ok) return;

    const response = await fetch(`/api/auth/deleteCredentials?userId=${userId}`, {
        method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
        alert(`❌ ${result.message || "Failed to delete user"}`);
    } else {
        alert(`✅ User ${userId} successfully deleted`);
        clearUserForm();
        initUserDropdown();
    }
}

function clearUserForm() {
    document.getElementById("userForm").reset();
    document.getElementById("userIdSelect").innerHTML = "";
}

function setFormForSearch() {
    formMode = "search";
    document.getElementById("userIdLabel").style.display = "block";
    document.getElementById("userIdTextLabel").style.display = "none";
    document.getElementById("userIdText").value = "";
    document.getElementById("userIdText").style.display = "none";
    document.getElementById("userForm").reset();
}

function setFormForAdd() {
    formMode = "add";
    document.getElementById("userIdLabel").style.display = "none";
    document.getElementById("userIdTextLabel").style.display = "block";
    document.getElementById("userIdText").value = "";
    document.getElementById("userForm").reset();
}

function setFormForEdit() {
    formMode = "edit";
    document.getElementById("userIdLabel").style.display = "none";
    document.getElementById("userIdTextLabel").style.display = "block";
    document.getElementById("userIdText").value = document.getElementById("userIdSelect").value;
    document.getElementById("userIdText").readOnly = true;
}

async function updateUser() {
    try {
        const form = document.getElementById("userForm");
        const userId = document.getElementById("userIdText").value;

        const userData = {
            userId,
            firstName: form.firstName.value.trim(),
            lastName: form.lastName.value.trim(),
            email: form.email.value.trim(),
            role: form.role.value,
            deactivated: document.getElementById("deactivated").checked
        };

        if (!userData.firstName || !userData.lastName || !userData.email || !userData.role) {
            alert("❌ Please fill out all required fields.");
            return;
        }

        const res = await fetch("/api/auth/updateCredentials", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        });

        const result = await res.json();

        if (res.status === 409) {
            alert("❌ " + result.message);
            return;
        }

        if (!res.ok) throw new Error(result.message || "Failed to update user");

        alert(`✅ User ${userId} updated successfully!`);
        clearUserForm();
        setFormForSearch();
        initUserDropdown();

    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}