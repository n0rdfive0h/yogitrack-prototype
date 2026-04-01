// Check if user is logged in and return their role
async function checkSession() {
    try {
        const res = await fetch("/api/auth/getSession");
        
        if (!res.ok) {
            // Not logged in, redirect to login page
            window.location.href = "../index.html";
            return null;
        }

        const data = await res.json();
        return data.user;

    } catch (err) {
        window.location.href = "../index.html";
        return null;
    }
}

function applyRoleRestrictions(role) {
    if (role === "instructor") {
        // Hide add, save, delete buttons
        const restrictedButtons = ["addBtn", "saveBtn", "deleteBtn", "uploadCSVBtn"];
        restrictedButtons.forEach((btnId) => {
            const btn = document.getElementById(btnId);
            if (btn) btn.style.display = "none";
        });

        // Hide Users and Reports links from sidebar
        const restrictedLinks = document.querySelectorAll("a[href='users.html'], a[href='reports.html']");
        restrictedLinks.forEach((link) => {
            link.style.display = "none";
        });
    }
}

// Handle logout
async function logout() {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "../index.html";
    } catch (err) {
        console.error("Logout failed:", err);
    }
}