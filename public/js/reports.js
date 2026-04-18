document.addEventListener("DOMContentLoaded", async () => {
    const user = await checkSession();
    if (!user) return;
    applyRoleRestrictions(user.role);
});

// Helper: get date range params from the inputs
function getDateParams() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (startDate && endDate) {
        return `?startDate=${startDate}&endDate=${endDate}`;
    }
    return "";
}

// PACKAGE SALES REPORT
document.getElementById("packageSalesBtn").addEventListener("click", async () => {
    await generatePackageSalesReport();
});

// INSTRUCTOR REPORT
document.getElementById("instructorReportBtn").addEventListener("click", async () => {
    await generateInstructorReport();
});

// CUSTOMER REPORT
document.getElementById("customerReportBtn").addEventListener("click", async () => {
    await generateCustomerReport();
});

// REVENUE REPORT
document.getElementById("revenueReportBtn").addEventListener("click", async () => {
    await generateRevenueReport();
});

// AVERAGE ATTENDANCE REPORT
document.getElementById("avgAttendanceBtn").addEventListener("click", async () => {
    await generateAvgAttendanceReport();
});

// UNUSED PASSES REPORT
document.getElementById("unusedPassesBtn").addEventListener("click", async () => {
    await generateUnusedPassesReport();
});

// CLEAR
document.getElementById("clearReportBtn").addEventListener("click", () => {
    clearReport();
});

function clearReport() {
    const results = document.getElementById("reportResults");
    results.innerHTML = `
        <p style="color: gray; text-align: center; margin-top: 100px;">
            Select a report to view
        </p>
    `;
}

async function generatePackageSalesReport() {
    const results = document.getElementById("reportResults");
    results.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`/api/reports/packageSales${getDateParams()}`);
        const data = await res.json();

        if (data.length === 0) {
            results.innerHTML = "<p style='text-align: center; color: gray;'>No sales found.</p>";
            return;
        }

        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const rangeLabel = startDate && endDate ? `${startDate} to ${endDate}` : "All time";

        let html = `
            <h3>Package Sales Report</h3>
            <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #5f5e5e;">
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Sale ID</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Customer</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Package</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Amount Paid</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((sale) => {
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${sale.saleId}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${sale.customerName}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${sale.packageName}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949;">$${sale.amountPaid}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${sale.dateTime}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        results.innerHTML = html;

    } catch (err) {
        results.innerHTML = `<p style="color: red;">Error loading report: ${err.message}</p>`;
    }
}

function calculatePay(attendees) {
    if (attendees < 5) return 20;
    const pay = 20 + ((attendees - 4) * 5);
    return Math.min(pay, 60);
}

async function generateInstructorReport() {
    const results = document.getElementById("reportResults");
    results.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`/api/reports/instructorReport${getDateParams()}`);
        const data = await res.json();

        if (data.length === 0) {
            results.innerHTML = "<p style='text-align: center; color: gray;'>No instructors found.</p>";
            return;
        }

        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const rangeLabel = startDate && endDate ? `${startDate} to ${endDate}` : "All time";

        let html = `
            <h3>Instructor Report</h3>
            <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
        `;

        data.forEach((instructor) => {
            let instructorTotalPay = 0;

            html += `
                <div style="margin-bottom: 20px;">
                    <h4>${instructor.instructorId}: ${instructor.instructorName}</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #5f5e5e;">
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Class</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Date</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Attendees</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Pay</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (instructor.classes.length === 0) {
                html += `
                    <tr>
                        <td colspan="4" style="padding: 8px; border: 1px solid #4a4949; text-align: center; color: gray;">
                            No classes assigned
                        </td>
                    </tr>
                `;
            } else {
                instructor.classes.forEach((cls) => {
                    if (cls.sessions.length === 0) {
                        html += `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #4a4949;">${cls.className}</td>
                                <td colspan="3" style="padding: 8px; border: 1px solid #4a4949; color: gray;">
                                    No sessions recorded
                                </td>
                            </tr>
                        `;
                    } else {
                        cls.sessions.forEach((session) => {
                            const pay = calculatePay(session.attendees);
                            instructorTotalPay += pay;
                            html += `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #4a4949;">${cls.className}</td>
                                    <td style="padding: 8px; border: 1px solid #4a4949;">${session.dateTime}</td>
                                    <td style="padding: 8px; border: 1px solid #4a4949;">${session.attendees}</td>
                                    <td style="padding: 8px; border: 1px solid #4a4949;">$${pay}</td>
                                </tr>
                            `;
                        });
                    }
                });
            }

            html += `
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #5f5e5e; font-weight: bold;">
                                <td colspan="3" style="padding: 8px; border: 1px solid #4a4949;">Total Pay</td>
                                <td style="padding: 8px; border: 1px solid #4a4949;">$${instructorTotalPay}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        });

        results.innerHTML = html;

    } catch (err) {
        results.innerHTML = `<p style="color: red;">Error loading report: ${err.message}</p>`;
    }
}

async function generateCustomerReport() {
    const results = document.getElementById("reportResults");
    results.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`/api/reports/customerReport${getDateParams()}`);
        const data = await res.json();

        if (data.length === 0) {
            results.innerHTML = "<p style='text-align: center; color: gray;'>No customers found.</p>";
            return;
        }

        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;
        const rangeLabel = startDate && endDate ? `${startDate} to ${endDate}` : "All time";

        let html = `
            <h3>Customer Report</h3>
            <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
        `;

        data.forEach((customer) => {
            html += `
                <div style="margin-bottom: 20px;">
                    <h4>${customer.customerId}: ${customer.customerName} — Balance: ${customer.classBalance}</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #5f5e5e;">
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Date of Purchase</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Number of Passes</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Remaining</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            if (customer.packages.length === 0) {
                html += `
                    <tr>
                        <td colspan="4" style="padding: 8px; border: 1px solid #4a4949; text-align: center; color: gray;">
                            No packages purchased
                        </td>
                    </tr>
                `;
            } else {
                customer.packages.forEach((pkg) => {
                    const statusColor = pkg.status === "Active" ? "green" :
                                       pkg.status === "Future" ? "blue" : "red";
                    const remaining = pkg.remainingClasses !== undefined ? pkg.remainingClasses : "—";
                    html += `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #4a4949;">${pkg.dateOfPurchase}</td>
                            <td style="padding: 8px; border: 1px solid #4a4949;">${pkg.numberOfPasses}</td>
                            <td style="padding: 8px; border: 1px solid #4a4949;">${remaining}</td>
                            <td style="padding: 8px; border: 1px solid #4a4949; color: ${statusColor};">
                                ${pkg.status}
                            </td>
                        </tr>
                    `;
                });
            }

            html += `</tbody></table></div>`;
        });

        results.innerHTML = html;

    } catch (err) {
        results.innerHTML = `<p style="color: red;">Error loading report: ${err.message}</p>`;
    }
}

async function generateRevenueReport() {
    const results = document.getElementById("reportResults");
    results.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`/api/reports/revenueReport${getDateParams()}`);
        const data = await res.json();

        const rangeLabel = data.startDate && data.endDate
            ? `${data.startDate} to ${data.endDate}`
            : "All time";

        results.innerHTML = `
            <h3>Revenue Report</h3>
            <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #5f5e5e;">
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Metric</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #4a4949;">Total Revenue</td>
                        <td style="padding: 8px; border: 1px solid #4a4949; font-weight: bold;">$${data.totalRevenue}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #4a4949;">Number of Sales</td>
                        <td style="padding: 8px; border: 1px solid #4a4949;">${data.saleCount}</td>
                    </tr>
                </tbody>
            </table>
        `;

    } catch (err) {
        results.innerHTML = `<p style="color: red;">Error loading report: ${err.message}</p>`;
    }
}

async function generateUnusedPassesReport() {
    const results = document.getElementById("reportResults");
    results.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`/api/reports/unusedPassesReport${getDateParams()}`);
        const data = await res.json();

        const rangeLabel = data.startDate && data.endDate
            ? `${data.startDate} to ${data.endDate}`
            : "All time (expired as of today)";

        if (data.report.length === 0) {
            results.innerHTML = `
                <h3>Unused Passes Report</h3>
                <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
                <p style="text-align: center; color: gray;">No unused expired passes found.</p>
            `;
            return;
        }

        let html = `
            <h3>Unused Passes Report</h3>
            <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
        `;

        data.report.forEach((customer) => {
            const totalWasted = customer.unusedPasses.reduce((sum, p) => sum + p.remainingClasses, 0);
            html += `
                <div style="margin-bottom: 20px;">
                    <h4>${customer.customerId}: ${customer.customerName} — ${totalWasted} wasted pass(es)</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #5f5e5e;">
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Sale ID</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Package</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Expired On</th>
                                <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Unused Passes</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            customer.unusedPasses.forEach((pass) => {
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #4a4949;">${pass.saleId}</td>
                        <td style="padding: 8px; border: 1px solid #4a4949;">${pass.packageName}</td>
                        <td style="padding: 8px; border: 1px solid #4a4949;">${pass.endDate}</td>
                        <td style="padding: 8px; border: 1px solid #4a4949; color: red; font-weight: bold;">${pass.remainingClasses}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
        });

        results.innerHTML = html;

    } catch (err) {
        results.innerHTML = `<p style="color: red;">Error loading report: ${err.message}</p>`;
    }
}

async function generateAvgAttendanceReport() {
    const results = document.getElementById("reportResults");
    results.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`/api/reports/avgAttendanceReport${getDateParams()}`);
        const data = await res.json();

        const rangeLabel = data.startDate && data.endDate
            ? `${data.startDate} to ${data.endDate}`
            : "All time";

        if (data.byClass.length === 0) {
            results.innerHTML = `
                <h3>Average Attendance Report</h3>
                <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
                <p style="text-align: center; color: gray;">No attendance records found for this period.</p>
            `;
            return;
        }

        let html = `
            <h3>Average Attendance Report</h3>
            <p style="color: gray; margin-bottom: 16px;">Period: ${rangeLabel}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #5f5e5e;">
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Class ID</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Class Name</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Sessions</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Total Attendees</th>
                        <th style="padding: 8px; border: 1px solid #4a4949; text-align: left;">Avg per Session</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.byClass.forEach((cls) => {
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${cls.classId}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${cls.className}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${cls.totalSessions}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949;">${cls.totalAttendees}</td>
                    <td style="padding: 8px; border: 1px solid #4a4949; font-weight: bold;">${cls.avgAttendance}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        results.innerHTML = html;

    } catch (err) {
        results.innerHTML = `<p style="color: red;">Error loading report: ${err.message}</p>`;
    }
}
