let formMode = "search"; // Tracks the current mode of the form

// Fetch all class IDs and populate the dropdown
document.addEventListener("DOMContentLoaded", async () => {
    const user = await checkSession();
    if (!user) return;
    applyRoleRestrictions(user.role);
    setFormForSearch();
    initClassDropdown();
    addClassDropdownListener();
    initInstructorDropdown();
});

//SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
    clearClassForm();
    setFormForSearch();
    initClassDropdown();
});

//ADD
document.getElementById("addBtn").addEventListener("click", async () => {
    setFormForAdd();
});

//ADD ANOTHER DAY 
document.getElementById("addDaytimeBtn").addEventListener("click", async () => {
    addDaytimeEntry();
});

//SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
    if (formMode === "add") {
        await saveClass();
    }
});

//DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
    await deleteClass();
});

//Populate class dropdown
async function initClassDropdown() {
    const select = document.getElementById("classIdSelect");
    select.innerHTML = "<option value=''>-- Select Class Id --</option>";
    try {
        const response = await fetch("/api/class/getClassIds");
        const classIds = await response.json();
        classIds.forEach((c) => {
            const option = document.createElement("option");
            option.value = c.classId;
            option.textContent = `${c.classId}: ${c.className}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load class IDs:", err);
    }
}

//Populate instructor dropdown
async function initInstructorDropdown() {
    const select = document.getElementById("instructorSelect");
    select.innerHTML = "<option value=''>-- Select Instructor --</option>";
    try {
        const response = await fetch("/api/instructor/getInstructorIds");
        const instructorIds = await response.json();
        instructorIds.forEach((instr) => {
            const option = document.createElement("option");
            option.value = instr.instructorId;
            option.textContent = `${instr.instructorId}: ${instr.firstName} ${instr.lastName}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load instructor IDs: ", err);
    }
}

// Add a new daytime entry row
function addDaytimeEntry() {
    const container = document.getElementById("daytimeContainer");
    const entry = document.createElement("div");
    entry.className = "daytime-entry";
    entry.style = "display: flex; gap: 10px; align-items: center;";
    entry.innerHTML = `
        <label>Day
            <select name="day" class="form-input" style="width: 150px;">
                <option value="Mon">Monday</option>
                <option value="Tue">Tuesday</option>
                <option value="Wed">Wednesday</option>
                <option value="Thu">Thursday</option>
                <option value="Fri">Friday</option>
                <option value="Sat">Saturday</option>
                <option value="Sun">Sunday</option>
            </select>
        </label>
        <label>Time
            <input type="time" name="time" class="form-input" style="width: 120px;"/>
        </label>
        <label>Duration (mins)
            <input type="number" name="duration" class="form-input" style="width: 60px;"/>
        </label>
        <button type="button" onclick="this.parentElement.remove()">Remove</button>
    `;
    container.appendChild(entry);
}

// Collect all daytime entries from the form
function collectDaytimeEntries() {
    const entries = [];
    const daytimeEntries = document.querySelectorAll(".daytime-entry");
    daytimeEntries.forEach((entry) => {
        const day = entry.querySelector("[name='day']").value;
        const time = entry.querySelector("[name='time']").value;
        const duration = parseInt(entry.querySelector("[name='duration']").value);
        if (day && time && duration) {
            entries.push({ day, time, duration });
        }
    });
    return entries;
}

async function saveClass() {
    try {
        // Get next class ID
        const idRes = await fetch("/api/class/getNextId");
        const { nextId } = await idRes.json();

        const form = document.getElementById("classForm");

        // Collect daytime entries
        const daytime = collectDaytimeEntries();
        if (daytime.length === 0) {
            alert("❌ Please add at least one day and time.");
            return;
        }

        const classData = {
            classId: nextId,
            className: form.className.value.trim(),
            instructorId: form.instructorId.value,
            classType: form.classType.value,
            description: form.description.value.trim(),
            daytime: daytime
        };

        const res = await fetch("/api/class/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(classData)
        });

        const result = await res.json();

        // Handle conflict response
        if (res.status === 409) {
            let conflictMessage = "❌ Scheduling conflict detected:\n";
            result.conflicts.forEach((c) => {
                conflictMessage += `\n- ${c.day} at ${c.time} conflicts with "${c.conflictsWith}" (${c.existingTime}, ${c.existingDuration} mins)`;
            });
            alert(conflictMessage);
            return;
        }

        if (!res.ok) throw new Error(result.message || "Failed to add class");

        alert(`✅ Class ${nextId} scheduled successfully!`);
        form.reset();
        initClassDropdown();

    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

async function deleteClass() {
    const select = document.getElementById("classIdSelect");
    const classId = select.value;

    if (!classId) {
        alert("Please select a class to delete.");
        return;
    }

    const response = await fetch(`/api/class/deleteClass?classId=${classId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throw new Error("Class delete failed");
    } else {
        alert(`Class ${classId} successfully deleted`);
        clearClassForm();
        initClassDropdown();
    }
}

// Populate form when class is selected from dropdown
async function addClassDropdownListener() {
    const form = document.getElementById("classForm");
    const select = document.getElementById("classIdSelect");
    select.addEventListener("change", async () => {
        const classId = select.value;
        if (!classId) return;
        try {
            const res = await fetch(`/api/class/getClass?classId=${classId}`);
            if (!res.ok) throw new Error("Class search failed");

            const data = await res.json();
            if (!data || Object.keys(data).length === 0) {
                alert("No class found");
                return;
            }

            // Fill form with data
            form.className.value = data.className || "";
            form.instructorId.value = data.instructorId || "";
            form.classType.value = data.classType || "";
            form.description.value = data.description || "";

            // Clear and repopulate daytime entries
            const container = document.getElementById("daytimeContainer");
            container.innerHTML = "";
            data.daytime.forEach((slot) => {
                addDaytimeEntry();
                const entries = container.querySelectorAll(".daytime-entry");
                const lastEntry = entries[entries.length - 1];
                lastEntry.querySelector("[name='day']").value = slot.day;
                lastEntry.querySelector("[name='time']").value = slot.time;
                lastEntry.querySelector("[name='duration']").value = slot.duration;
            });

        } catch (err) {
            alert(`Error loading class: ${err.message}`);
        }
    });
}

function clearClassForm() {
    document.getElementById("classForm").reset();
    document.getElementById("classIdSelect").innerHTML = "";
    const container = document.getElementById("daytimeContainer");
    container.innerHTML = "";
    addDaytimeEntry(); // Add one blank entry back
}

function setFormForSearch() {
    formMode = "search";
    document.getElementById("classIdLabel").style.display = "block";
    document.getElementById("classIdTextLabel").style.display = "none";
    document.getElementById("classIdText").value = "";
    document.getElementById("classIdText").style.display = "none";
    document.getElementById("classForm").reset();
}

function setFormForAdd() {
    formMode = "add";
    document.getElementById("classIdLabel").style.display = "none";
    document.getElementById("classIdTextLabel").style.display = "block";
    document.getElementById("classIdText").value = "";
    document.getElementById("classForm").reset();
    // Reset daytime container to one blank entry
    const container = document.getElementById("daytimeContainer");
    container.innerHTML = "";
    addDaytimeEntry();
}