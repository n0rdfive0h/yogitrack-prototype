let formMode = "search";
let currentUserRole = null;

const DAY_NAMES = {
    Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
    Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday"
};

document.addEventListener("DOMContentLoaded", async () => {
    const user = await checkSession();
    if (!user) return;
    currentUserRole = user.role;
    applyRoleRestrictions(user.role);
    setFormForSearch();
    initClassDropdown();
    addClassDropdownListener();
    initInstructorDropdown();
    addDaytimePreviewListeners();
});

// SEARCH
document.getElementById("searchBtn").addEventListener("click", async () => {
    clearClassForm();
    setFormForSearch();
    initClassDropdown();
});

// ADD
document.getElementById("addBtn").addEventListener("click", async () => {
    setFormForAdd();
});

// EDIT
document.getElementById("editBtn").addEventListener("click", () => {
    const classId = document.getElementById("classIdSelect").value;
    if (!classId) {
        alert("Please select a class to edit.");
        return;
    }
    setFormForEdit();
});

// SAVE
document.getElementById("saveBtn").addEventListener("click", async () => {
    if (formMode === "add") {
        await saveClass();
    } else if (formMode === "edit") {
        await updateClass();
    }
});

// DELETE
document.getElementById("deleteBtn").addEventListener("click", async () => {
    await deleteClass();
});

// Populate class dropdown (shows DEACTIVATED label)
async function initClassDropdown() {
    const select = document.getElementById("classIdSelect");
    select.innerHTML = "<option value=''>-- Select Class Id --</option>";
    try {
        const response = await fetch("/api/class/getClassIds");
        const classIds = await response.json();
        classIds.forEach((c) => {
            const option = document.createElement("option");
            option.value = c.classId;
            const label = c.deactivated ? " (DEACTIVATED)" : "";
            option.textContent = `${c.classId}: ${c.className}${label}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load class IDs:", err);
    }
}

// Populate instructor dropdown
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
        console.error("Failed to load instructor IDs:", err);
    }
}

// Live-preview the auto-generated class name as day/time/duration change
function addDaytimePreviewListeners() {
    ["daySelect", "timeInput", "durationInput"].forEach((id) => {
        document.getElementById(id).addEventListener("change", updateClassNamePreview);
        document.getElementById(id).addEventListener("input", updateClassNamePreview);
    });
}

function updateClassNamePreview() {
    const day = document.getElementById("daySelect").value;
    const time = document.getElementById("timeInput").value;
    const duration = parseInt(document.getElementById("durationInput").value);
    if (day && time && duration) {
        document.getElementById("classNameDisplay").value = generateClassName(day, time, duration);
    } else {
        document.getElementById("classNameDisplay").value = "";
    }
}

function generateClassName(day, time, duration) {
    const [hours, mins] = time.split(':').map(Number);
    const totalEndMins = hours * 60 + mins + duration;
    const endHours = Math.floor(totalEndMins / 60) % 24;
    const endMins = totalEndMins % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    return `${DAY_NAMES[day] || day} ${time} - ${endTime}`;
}

async function saveClass() {
    try {
        const idRes = await fetch("/api/class/getNextId");
        const { nextId } = await idRes.json();

        const form = document.getElementById("classForm");
        const day = form.day.value;
        const time = form.time.value;
        const duration = parseInt(form.duration.value);

        if (!day || !time || !duration) {
            alert("Please fill in day, time, and duration.");
            return;
        }

        const classData = {
            classId: nextId,
            instructorId: form.instructorId.value,
            classType: form.classType.value,
            description: form.description.value.trim(),
            day,
            time,
            duration
        };

        const res = await fetch("/api/class/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(classData)
        });

        const result = await res.json();

        if (res.status === 409) {
            const c = result.conflict;
            alert(`Scheduling conflict detected:\n- ${c.day} at ${c.time} conflicts with "${c.confWith}" (${c.existingTime}, ${c.existingDuration} mins)`);
            return;
        }

        if (!res.ok) throw new Error(result.message || "Failed to add class");

        alert(`Class ${nextId} scheduled successfully!`);
        form.reset();
        document.getElementById("classNameDisplay").value = "";
        initClassDropdown();

    } catch (err) {
        alert("Error: " + err.message);
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
        alert("Class delete failed");
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

            if (data.deactivated && currentUserRole !== "manager") {
                alert("This class is deactivated and cannot be accessed.");
                select.value = "";
                form.reset();
                document.getElementById("classNameDisplay").value = "";
                return;
            }

            form.instructorId.value = data.instructorId || "";
            form.classType.value = data.classType || "";
            form.description.value = data.description || "";
            document.getElementById("daySelect").value = data.day || "Mon";
            document.getElementById("timeInput").value = data.time || "";
            document.getElementById("durationInput").value = data.duration || "";
            document.getElementById("classNameDisplay").value = data.className || "";
            document.getElementById("deactivated").checked = data.deactivated || false;

        } catch (err) {
            alert(`Error loading class: ${err.message}`);
        }
    });
}

function clearClassForm() {
    document.getElementById("classForm").reset();
    document.getElementById("classIdSelect").innerHTML = "";
    document.getElementById("classNameDisplay").value = "";
}

function setFormForSearch() {
    formMode = "search";
    document.getElementById("classIdLabel").style.display = "block";
    document.getElementById("classIdTextLabel").style.display = "none";
    document.getElementById("classIdText").value = "";
    document.getElementById("classIdText").style.display = "none";
    document.getElementById("classForm").reset();
    document.getElementById("classNameDisplay").value = "";
}

function setFormForAdd() {
    formMode = "add";
    document.getElementById("classIdLabel").style.display = "none";
    document.getElementById("classIdTextLabel").style.display = "block";
    document.getElementById("classIdText").value = "";
    document.getElementById("classForm").reset();
    document.getElementById("classNameDisplay").value = "";
}

function setFormForEdit() {
    formMode = "edit";
    document.getElementById("classIdLabel").style.display = "none";
    document.getElementById("classIdTextLabel").style.display = "block";
    document.getElementById("classIdText").value = document.getElementById("classIdSelect").value;
    document.getElementById("classIdText").readOnly = true;
}

async function updateClass() {
    try {
        const classId = document.getElementById("classIdText").value;
        const form = document.getElementById("classForm");

        const day = form.day.value;
        const time = form.time.value;
        const duration = parseInt(form.duration.value);

        if (!day || !time || !duration) {
            alert("Please fill in day, time, and duration.");
            return;
        }

        const classData = {
            classId,
            instructorId: form.instructorId.value,
            classType: form.classType.value,
            description: form.description.value.trim(),
            day,
            time,
            duration,
            deactivated: form.deactivated.checked
        };

        const res = await fetch("/api/class/updateClass", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(classData)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to update class");

        alert(`Class ${classId} updated successfully!`);
        clearClassForm();
        setFormForSearch();
        initClassDropdown();

    } catch (err) {
        alert("Error: " + err.message);
    }
}
