let attendanceCustomers = [];

// Load page data
document.addEventListener("DOMContentLoaded", () => {
  initInstructorDropdown();
  initCustomerDropdown();
  addInstructorDropdownListener();
});

// ADD CUSTOMER TO LIST
document.getElementById("addCustomerBtn").addEventListener("click", async () => {
  const customerSelect = document.getElementById("customerSelect");
  const selectedValue = customerSelect.value;

  if (!selectedValue) {
    alert("Please select a customer.");
    return;
  }

  const customerId = selectedValue;

  const alreadyAdded = attendanceCustomers.find(
    (cust) => cust.customerId === customerId
  );

  if (alreadyAdded) {
    alert("That customer is already in the attendance list.");
    return;
  }

  try {
    const res = await fetch(`/api/checkIn/checkCustomerBalance?customerId=${customerId}`);
    const data = await res.json();

    attendanceCustomers.push({
      customerId: data.customerId,
      customerName: `${data.firstName} ${data.lastName}`,
      hasBalance: data.hasBalance
    });

    renderAttendanceList();
  } catch (err) {
    alert("Error checking customer balance: " + err.message);
  }
});

// SUBMIT
document.getElementById("submitAttendanceBtn").addEventListener("click", async () => {
  const form = document.getElementById("checkInForm");
  const instructorId = form.instructorId.value;
  const classId = form.classId.value;
  const checkInDate = form.checkInDate.value;
  const checkInTime = form.checkInTime.value;

  if (!instructorId || !classId || !checkInDate || !checkInTime) {
    alert("Please complete instructor, class, date, and time.");
    return;
  }

  if (attendanceCustomers.length === 0) {
    alert("Please add at least one customer to the attendance list.");
    return;
  }

  const idRes = await fetch("/api/checkIn/getNextAttendanceId");
  const { nextId } = await idRes.json();

  const dateTime = `${checkInDate} ${checkInTime}`;

  const attendanceData = {
    attendanceId: nextId,
    instructorId: instructorId,
    classId: classId,
    dateTime: dateTime,
    customers: attendanceCustomers.map((cust) => cust.customerId)
  };

  try {
    console.log(JSON.stringify(attendanceData));

    const res = await fetch("/api/checkIn/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(attendanceData)
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Failed to save attendance");
    }

    if (result.scheduleWarning) {
      alert(`⚠️ ${result.scheduleWarning}`);
    }
    if (result.balanceWarnings && result.balanceWarnings.length > 0) {
      alert(`⚠️ The following customers had insufficient balance:\n${result.balanceWarnings.join("\n")}`);
    }

    alert(`✅ Attendance ${nextId} saved successfully! ${result.totalPresent} customer(s) checked in.`);
    clearCheckInForm();

  } catch (err) {
    alert("Error: " + err.message);
  }
});

// CLEAR
document.getElementById("clearBtn").addEventListener("click", () => {
  clearCheckInForm();
});

// LOAD INSTRUCTORS
async function initInstructorDropdown() {
  const select = document.getElementById("instructorSelect");

  select.innerHTML = `<option value=""> -- Select Instructor --</option>`;

  try {
    const response = await fetch("/api/instructor/getInstructorIds");
    const instructors = await response.json();

    instructors.forEach((instr) => {
      const option = document.createElement("option");
      option.value = instr.instructorId;
      option.textContent = `${instr.instructorId}: ${instr.firstName} ${instr.lastName}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load instructors:", err);
  }
}

// LOAD CUSTOMERS
async function initCustomerDropdown() {
  const select = document.getElementById("customerSelect");

  select.innerHTML = `<option value=""> -- Select Customer --</option>`;

  try {
    const response = await fetch("/api/customer/getCustomerIds");
    const customers = await response.json();

    customers.forEach((cust) => {
      const option = document.createElement("option");
      option.value = cust.customerId;
      option.textContent = `${cust.customerId}: ${cust.firstName} ${cust.lastName}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load customers:", err);
  }
}

// WHEN INSTRUCTOR CHANGES, LOAD ONLY THEIR CLASSES
function addInstructorDropdownListener() {
  const instructorSelect = document.getElementById("instructorSelect");

  instructorSelect.addEventListener("change", async () => {
    const instructorId = instructorSelect.value;
    const classSelect = document.getElementById("classSelect");

    classSelect.innerHTML = `<option value=""> -- Select Class --</option>`;

    if (!instructorId) return;

    try {
      const response = await fetch(
        `/api/checkIn/getClassesByInstructor?instructorId=${encodeURIComponent(instructorId)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load instructor classes");
      }

      const classes = await response.json();

      classes.forEach((cls) => {
        const option = document.createElement("option");
        option.value = cls.classId;
        option.textContent = `${cls.classId}:${cls.className}`;
        classSelect.appendChild(option);
      });
    } catch (err) {
      alert("Error loading classes: " + err.message);
    }
  });
}

// SHOW ATTENDANCE LIST
function renderAttendanceList() {
    const attendanceList = document.getElementById("attendanceList");

    attendanceList.innerHTML = "";

    if (attendanceCustomers.length === 0) {
        attendanceList.innerHTML = `
            <p id="attendancePlaceholder" style="color: gray; text-align: center; margin-top: 30px;">
                No customers added yet
            </p>
        `;
        return;
    }

    attendanceCustomers.forEach((cust) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "6px 4px";
        row.style.borderBottom = "1px solid #eee";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = `${cust.hasBalance ? "✅" : "⚠️"} ${cust.customerName}`;
        nameSpan.style.color = cust.hasBalance ? "black" : "orange";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "✕";
        removeBtn.style.border = "none";
        removeBtn.style.background = "transparent";
        removeBtn.style.color = "red";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.fontWeight = "bold";

        removeBtn.addEventListener("click", () => {
            removeCustomerFromAttendance(cust.customerId);
        });

        row.appendChild(nameSpan);
        row.appendChild(removeBtn);
        attendanceList.appendChild(row);
    });
}

// REMOVE CUSTOMER
function removeCustomerFromAttendance(customerId) {
  attendanceCustomers = attendanceCustomers.filter(
    (cust) => cust.customerId !== customerId
  );
  renderAttendanceList();
}

// CLEAR FORM
function clearCheckInForm() {
  document.getElementById("checkInForm").reset();
  document.getElementById("classSelect").innerHTML =
    `<option value=""> -- Select Class --</option>`;
  attendanceCustomers = [];
  renderAttendanceList();
}