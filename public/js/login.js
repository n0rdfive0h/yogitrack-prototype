document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        document.getElementById("loginError").style.display = "block";
        document.getElementById("loginError").textContent = "Please enter both email and password.";
        return;
    }

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await res.json();

        if (!res.ok) {
            document.getElementById("loginError").style.display = "block";
            document.getElementById("loginError").textContent = result.message || "Invalid email or password.";
            return;
        }

        // Redirect to dashboard on successful login
        window.location.href = "htmls/dashboard.html";

    } catch (err) {
        document.getElementById("loginError").style.display = "block";
        document.getElementById("loginError").textContent = "Error: " + err.message;
    }
});