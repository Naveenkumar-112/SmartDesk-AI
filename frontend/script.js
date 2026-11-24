// ==========================================
// SMARTDESK AI - COMPLETE FRONTEND JAVASCRIPT
// ==========================================

// ==========================================
// CURRENT AUTHENTICATED USER
// ==========================================

let currentUser = null;

function isAdmin() {
    return currentUser?.role?.toLowerCase() === "admin";
}

// ==========================================
// 1. DOM ELEMENTS
// ==========================================

const incidentForm = document.getElementById("incidentForm");
const result = document.getElementById("result");
const incidentList = document.getElementById("incidentList");

const refreshButton = document.getElementById("refreshIncidents");

const incidentSearch = document.getElementById("incidentSearch");
const statusFilter = document.getElementById("statusFilter");

const knowledgeIssue = document.getElementById("knowledgeIssue");
const searchKnowledgeButton = document.getElementById("searchKnowledge");
const knowledgeResult = document.getElementById("knowledgeResult");


// ==========================================
// 2. COMMON HELPER FUNCTIONS
// ==========================================

function createElement(tag, text = "", className = "") {

    const element = document.createElement(tag);

    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}


function formatDate(date) {

    if (!date) {
        return "Not available";
    }

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


async function fetchJSON(url, options = {}) {

    const response = await fetch(url, options);

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.message || "Something went wrong."
        );

    }

    return data;

}


// ==========================================
// 3. SUBMIT NEW INCIDENT
// ==========================================

if (incidentForm) {

    incidentForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const employeeName =
            document.getElementById("employeeName").value.trim();

        const issue =
            document.getElementById("issue").value.trim();

        if (!employeeName || !issue) {
            alert("Please enter employee name and issue.");
            return;
        }

        result.textContent = "Submitting your incident. Please wait...";

        try {

            const data = await fetchJSON("/api/incidents", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    employeeName,
                    issue
                })

            });

            const incident = data.incident;

            displayIncidentResult(incident);

            incidentForm.reset();

            await loadIncidents();

            // Monitor background AI analysis

            if (incident.aiAnalysisStatus === "Processing") {

                let attempts = 0;

                const maxAttempts = 100;

                const refreshInterval = setInterval(async () => {

                    attempts++;

                    try {

                        const statusData =
                            await fetchJSON("/api/incidents");

                        const currentIncident =
                            statusData.incidents.find(
                                item => item._id === incident._id
                            );

                        if (
                            currentIncident &&
                            currentIncident.aiAnalysisStatus !== "Processing"
                        ) {

                            clearInterval(refreshInterval);

                            await loadIncidents();

                            displayIncidentResult(currentIncident);

                            await loadActivityHistory();

                        }

                        if (attempts >= maxAttempts) {

                            clearInterval(refreshInterval);

                            console.log(
                                "AI status monitoring stopped after timeout."
                            );

                        }

                    } catch (error) {

                        console.error(
                            "AI Status Refresh Error:",
                            error
                        );

                    }

                }, 3000);

            }

            await loadActivityHistory();

        } catch (error) {

            result.textContent =
                "Incident submission failed: " + error.message;

            console.error("Incident Submission Error:", error);

        }

    });

}


// ==========================================
// 4. DISPLAY INCIDENT AND AI RESULT
// ==========================================

// ==========================================
// DISPLAY INCIDENT RESULT WITH AI SOURCE
// ==========================================

function displayIncidentResult(incident) {

    if (!result) return;

    result.innerHTML = "";

    // Main heading
    result.appendChild(
        createElement(
            "h2",
            "Incident Submitted Successfully!"
        )
    );

    // Incident details
    const details = [
        ["Incident ID", incident._id],
        ["Employee", incident.employeeName],
        ["Issue", incident.issue],
        ["Status", incident.status]
    ];

    details.forEach(([label, value]) => {

        result.appendChild(
            createElement(
                "p",
                `${label}: ${value || "Not available"}`
            )
        );

    });

    // ======================================
    // AI STATUS BADGE
    // ======================================

    result.appendChild(
        createElement("h2", "AI Analysis")
    );

    const statusBadge = createElement(
        "div",
        ""
    );

    statusBadge.style.padding = "12px 16px";
    statusBadge.style.margin = "12px 0";
    statusBadge.style.borderRadius = "8px";
    statusBadge.style.fontWeight = "600";
    statusBadge.style.display = "inline-block";

    if (incident.aiAnalysisStatus === "Processing") {

        statusBadge.textContent =
            "🔵 Processing - AI is analysing your incident";

        statusBadge.style.background = "#eff6ff";
        statusBadge.style.color = "#2563eb";

    }

    else if (incident.aiAnalysisStatus === "Failed") {

        statusBadge.textContent =
            "🔴 Analysis Failed";

        statusBadge.style.background = "#fef2f2";
        statusBadge.style.color = "#dc2626";

    }

    else if (
        incident.analysisSource === "Gemini AI"
    ) {

        statusBadge.textContent =
            "🟢 Gemini AI - Successfully Analysed";

        statusBadge.style.background = "#ecfdf5";
        statusBadge.style.color = "#047857";

    }

    else if (
        incident.analysisSource === "Local Fallback Engine"
    ) {

        statusBadge.textContent =
            "🟠 Local Fallback Engine - Analysed";

        statusBadge.style.background = "#fff7ed";
        statusBadge.style.color = "#c2410c";

    }

    else {

        statusBadge.textContent =
            "⚪ Analysis Source Not Available";

        statusBadge.style.background = "#f1f5f9";
        statusBadge.style.color = "#475569";

    }

    result.appendChild(statusBadge);

    // ======================================
    // AI ANALYSIS DETAILS
    // ======================================

    if (incident.aiAnalysisStatus === "Completed") {

        const aiDetails = [
            ["Analysis Source", incident.analysisSource],
            ["Category", incident.category],
            ["Priority", incident.priority],
            ["Summary", incident.summary]
        ];

        aiDetails.forEach(([label, value]) => {

            result.appendChild(
                createElement(
                    "p",
                    `${label}: ${value || "Not available"}`
                )
            );

        });

        // Troubleshooting steps

        result.appendChild(
            createElement(
                "h3",
                "Troubleshooting Steps"
            )
        );

        const stepsList = document.createElement("ol");

        (incident.troubleshootingSteps || []).forEach(step => {

            stepsList.appendChild(
                createElement("li", step)
            );

        });

        result.appendChild(stepsList);

    }

    else if (incident.aiAnalysisStatus === "Processing") {

        result.appendChild(
            createElement(
                "p",
                "Your incident has been saved. AI analysis is currently in progress."
            )
        );

    }

    else {

        result.appendChild(
            createElement(
                "p",
                "Your incident was saved successfully, but AI analysis could not be completed."
            )
        );

    }

}


// ==========================================
// 5. LOAD ALL INCIDENTS
// ==========================================

async function loadIncidents() {

    if (!incidentList) return;

    incidentList.innerHTML = "";

    const loadingRow = document.createElement("tr");

    const loadingCell = createElement(
        "td",
        "Loading incidents..."
    );

    loadingCell.colSpan = 9;

    loadingRow.appendChild(loadingCell);

    incidentList.appendChild(loadingRow);

    try {

        const data = await fetchJSON("/api/incidents");

        const incidents = data.incidents || [];

        // UPDATE DASHBOARD STATISTICS

        // UPDATE DASHBOARD STATISTICS

const totalElement =
    document.getElementById("totalIncidents");

const openElement =
    document.getElementById("openIncidents");

const resolvedElement =
    document.getElementById("resolvedIncidents");

const geminiElement =
    document.getElementById("geminiAnalyses");

const fallbackElement =
    document.getElementById("fallbackAnalyses");

const pendingFailedElement =
    document.getElementById("pendingFailedAnalyses");

// Total incidents

if (totalElement) {
    totalElement.textContent = incidents.length;
}

// Open incidents

if (openElement) {
    openElement.textContent =
        incidents.filter(item => item.status === "Open").length;
}

// Resolved incidents

if (resolvedElement) {
    resolvedElement.textContent =
        incidents.filter(item => item.status === "Resolved").length;
}

// Gemini AI analyses

if (geminiElement) {
    geminiElement.textContent =
        incidents.filter(
            item => item.analysisSource === "Gemini AI"
        ).length;
}

// Local fallback analyses

if (fallbackElement) {
    fallbackElement.textContent =
        incidents.filter(
            item => item.analysisSource === "Local Fallback Engine"
        ).length;
}

// Pending or failed analyses

if (pendingFailedElement) {
    pendingFailedElement.textContent =
        incidents.filter(
            item => ["Pending", "Processing", "Failed"]
                .includes(item.aiAnalysisStatus)
        ).length;
}
// AI PERFORMANCE ANALYTICS

const completedIncidents = incidents.filter(
    item => item.aiAnalysisStatus === "Completed"
);

const failedIncidents = incidents.filter(
    item => item.aiAnalysisStatus === "Failed"
);

const totalCount = incidents.length;

const completedCount = completedIncidents.length;
const failedCount = failedIncidents.length;

// Gemini and fallback counts

const geminiCount = completedIncidents.filter(
    item => item.analysisSource === "Gemini AI"
).length;

const fallbackCount = completedIncidents.filter(
    item => item.analysisSource === "Local Fallback Engine"
).length;

// Calculate percentages

const geminiPercent = completedCount > 0
    ? Math.round((geminiCount / completedCount) * 100)
    : 0;

const fallbackPercent = completedCount > 0
    ? Math.round((fallbackCount / completedCount) * 100)
    : 0;

const completionPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

const failurePercent = totalCount > 0
    ? Math.round((failedCount / totalCount) * 100)
    : 0;

// Update percentage labels

document.getElementById("geminiPercentage").textContent =
    geminiPercent + "%";

document.getElementById("fallbackPercentage").textContent =
    fallbackPercent + "%";

document.getElementById("completionPercentage").textContent =
    completionPercent + "%";

document.getElementById("failurePercentage").textContent =
    failurePercent + "%";

// Update progress bars

document.getElementById("geminiProgress").style.width =
    geminiPercent + "%";

document.getElementById("fallbackProgress").style.width =
    fallbackPercent + "%";

document.getElementById("completionProgress").style.width =
    completionPercent + "%";

document.getElementById("failureProgress").style.width =
    failurePercent + "%";

    // INCIDENT PRIORITY ANALYTICS

const criticalCount = incidents.filter(
    item => item.priority === "Critical"
).length;

const highCount = incidents.filter(
    item => item.priority === "High"
).length;

const mediumCount = incidents.filter(
    item => item.priority === "Medium"
).length;

const lowCount = incidents.filter(
    item => item.priority === "Low"
).length;

// UPDATE PRIORITY COUNTERS

document.getElementById("criticalCount").textContent =
    criticalCount;

document.getElementById("highCount").textContent =
    highCount;

document.getElementById("mediumCount").textContent =
    mediumCount;

document.getElementById("lowCount").textContent =
    lowCount;

// CALCULATE PRIORITY BAR WIDTHS

const totalPriorityIncidents =
    criticalCount + highCount + mediumCount + lowCount;

const criticalPercent = totalPriorityIncidents > 0
    ? (criticalCount / totalPriorityIncidents) * 100
    : 0;

const highPercent = totalPriorityIncidents > 0
    ? (highCount / totalPriorityIncidents) * 100
    : 0;

const mediumPercent = totalPriorityIncidents > 0
    ? (mediumCount / totalPriorityIncidents) * 100
    : 0;

const lowPercent = totalPriorityIncidents > 0
    ? (lowCount / totalPriorityIncidents) * 100
    : 0;

// UPDATE PROGRESS BARS

document.getElementById("criticalProgress").style.width =
    criticalPercent + "%";

document.getElementById("highProgress").style.width =
    highPercent + "%";

document.getElementById("mediumProgress").style.width =
    mediumPercent + "%";

document.getElementById("lowProgress").style.width =
    lowPercent + "%";
    // INCIDENT CATEGORY ANALYTICS

const networkCount = incidents.filter(
    item => item.category === "Network"
).length;

const hardwareCount = incidents.filter(
    item => item.category === "Hardware"
).length;

const softwareCount = incidents.filter(
    item => item.category === "Software"
).length;

const securityCount = incidents.filter(
    item => item.category === "Security"
).length;

// UPDATE CATEGORY COUNTERS

document.getElementById("networkCount").textContent = networkCount;
document.getElementById("hardwareCount").textContent = hardwareCount;
document.getElementById("softwareCount").textContent = softwareCount;
document.getElementById("securityCount").textContent = securityCount;

// CALCULATE CATEGORY PERCENTAGES

const totalCategoryIncidents =
    networkCount + hardwareCount + softwareCount + securityCount;

const networkPercent = totalCategoryIncidents > 0
    ? (networkCount / totalCategoryIncidents) * 100 : 0;

const hardwarePercent = totalCategoryIncidents > 0
    ? (hardwareCount / totalCategoryIncidents) * 100 : 0;

const softwarePercent = totalCategoryIncidents > 0
    ? (softwareCount / totalCategoryIncidents) * 100 : 0;

const securityPercent = totalCategoryIncidents > 0
    ? (securityCount / totalCategoryIncidents) * 100 : 0;

// UPDATE CATEGORY PROGRESS BARS

document.getElementById("networkProgress").style.width =
    networkPercent + "%";

document.getElementById("hardwareProgress").style.width =
    hardwarePercent + "%";

document.getElementById("softwareProgress").style.width =
    softwarePercent + "%";

document.getElementById("securityProgress").style.width =
    securityPercent + "%";
    // INCIDENT STATUS ANALYTICS

const statusOpenCount = incidents.filter(
    item => item.status === "Open"
).length;

const statusProgressCount = incidents.filter(
    item => item.status === "In Progress"
).length;

const statusResolvedCount = incidents.filter(
    item => item.status === "Resolved"
).length;

const statusClosedCount = incidents.filter(
    item => item.status === "Closed"
).length;

// UPDATE STATUS COUNTERS

document.getElementById("statusOpenCount").textContent =
    statusOpenCount;

document.getElementById("statusProgressCount").textContent =
    statusProgressCount;

document.getElementById("statusResolvedCount").textContent =
    statusResolvedCount;

document.getElementById("statusClosedCount").textContent =
    statusClosedCount;

// CALCULATE STATUS PERCENTAGES

const totalStatusIncidents =
    statusOpenCount +
    statusProgressCount +
    statusResolvedCount +
    statusClosedCount;

const statusOpenPercent = totalStatusIncidents > 0
    ? (statusOpenCount / totalStatusIncidents) * 100 : 0;

const statusProgressPercent = totalStatusIncidents > 0
    ? (statusProgressCount / totalStatusIncidents) * 100 : 0;

const statusResolvedPercent = totalStatusIncidents > 0
    ? (statusResolvedCount / totalStatusIncidents) * 100 : 0;

const statusClosedPercent = totalStatusIncidents > 0
    ? (statusClosedCount / totalStatusIncidents) * 100 : 0;

// UPDATE STATUS PROGRESS BARS

document.getElementById("statusOpenProgress").style.width =
    statusOpenPercent + "%";

document.getElementById("statusProgressBar").style.width =
    statusProgressPercent + "%";

document.getElementById("statusResolvedProgress").style.width =
    statusResolvedPercent + "%";

document.getElementById("statusClosedProgress").style.width =
    statusClosedPercent + "%";

        // SEARCH AND FILTER

        const searchText =
            incidentSearch
                ? incidentSearch.value.toLowerCase().trim()
                : "";

        const selectedStatus =
            statusFilter
                ? statusFilter.value
                : "All";

        const filteredIncidents = incidents.filter(incident => {

            const employeeName =
                (incident.employeeName || "").toLowerCase();

            const issue =
                (incident.issue || "").toLowerCase();

            const category =
                (incident.category || "").toLowerCase();

            const matchesSearch =
                employeeName.includes(searchText) ||
                issue.includes(searchText) ||
                category.includes(searchText);

            const matchesStatus =
                selectedStatus === "All" ||
                incident.status === selectedStatus;

            return matchesSearch && matchesStatus;

        });

        incidentList.innerHTML = "";

        // NO INCIDENTS

        if (filteredIncidents.length === 0) {

            const row = document.createElement("tr");

            const cell = createElement(
                "td",
                incidents.length === 0
                    ? "No incidents found."
                    : "No matching incidents found."
            );

            cell.colSpan = 9;

            row.appendChild(cell);

            incidentList.appendChild(row);

            return;

        }

        // DISPLAY INCIDENTS

        filteredIncidents.forEach(incident => {

            const row = document.createElement("tr");

            const values = [

                String(incident._id).substring(0, 8),

                incident.employeeName,

                incident.issue,

                incident.category,

                incident.priority,

                incident.status,

                incident.aiAnalysisStatus

            ];

            // CREATE EXISTING TABLE CELLS

            values.forEach(value => {

                const cell = createElement(
                    "td",
                    value || "Pending"
                );

                row.appendChild(cell);

            });

            // ANALYSIS SOURCE BADGE

            const sourceCell = document.createElement("td");

            const sourceBadge = createElement(
                "span",
                incident.analysisSource || "Not Available"
            );

            sourceBadge.style.display = "inline-block";
            sourceBadge.style.padding = "6px 10px";
            sourceBadge.style.borderRadius = "6px";
            sourceBadge.style.fontSize = "12px";
            sourceBadge.style.fontWeight = "600";

            if (incident.analysisSource === "Gemini AI") {

                sourceBadge.style.background = "#dcfce7";
                sourceBadge.style.color = "#15803d";

            } else if (
                incident.analysisSource === "Local Fallback Engine"
            ) {

                sourceBadge.textContent = "Local Fallback";

                sourceBadge.style.background = "#ffedd5";
                sourceBadge.style.color = "#c2410c";

            } else {

                sourceBadge.style.background = "#f1f5f9";
                sourceBadge.style.color = "#475569";

            }
        
            sourceCell.appendChild(sourceBadge);

            row.appendChild(sourceCell);

// ==========================================
// ACTIONS COLUMN
// ==========================================

const actionCell = document.createElement("td");
actionCell.classList.add("action-cell");

if (isAdmin()) {

    // STATUS DROPDOWN

    const statusSelect = document.createElement("select");
    statusSelect.classList.add("status-select");

    ["Open", "In Progress", "Resolved"].forEach(status => {

        const option = createElement("option", status);
        option.value = status;

        if (incident.status === status) {
            option.selected = true;
        }

        statusSelect.appendChild(option);
    });

    // BUTTON CONTAINER

    const actionButtons = document.createElement("div");
    actionButtons.classList.add("action-buttons");

    // UPDATE BUTTON

    const updateButton = createElement("button", "Update");
    updateButton.type = "button";
    updateButton.classList.add("update-incident-btn");

    updateButton.addEventListener("click", () => {

        updateIncidentStatus(
            incident._id,
            statusSelect.value,
            updateButton
        );

    });

    // DELETE BUTTON

    const deleteButton = createElement(
        "button",
        "Delete",
        "delete-incident-btn"
    );

    deleteButton.type = "button";

    deleteButton.addEventListener("click", () => {

        deleteIncident(
            incident._id,
            incident.issue,
            deleteButton
        );

    });

    actionButtons.appendChild(updateButton);
    actionButtons.appendChild(deleteButton);

    actionCell.appendChild(statusSelect);
    actionCell.appendChild(actionButtons);

} else {

    // EMPLOYEE VIEW-ONLY ACCESS

    actionCell.textContent = "View only";

}

row.appendChild(actionCell);

// ADD COMPLETED ROW TO TABLE

incidentList.appendChild(row);
        }); // CLOSE filteredIncidents.forEach()

    } catch (error) {

        console.error("Incident Loading Error:", error);

        incidentList.innerHTML = "";

        const row = document.createElement("tr");

        const cell = createElement(
            "td",
            "Failed to load incidents."
        );

        cell.colSpan = 9;

        row.appendChild(cell);

        incidentList.appendChild(row);

    }

}
// ==========================================
// 6. DELETE INCIDENT
// ==========================================

async function deleteIncident(incidentId, issue, button) {

    const confirmation = confirm(
        "Are you sure you want to delete this incident?\n\n" +
        "Issue: " + issue +
        "\n\nThis action cannot be undone."
    );

    if (!confirmation) {
        return;
    }

    button.disabled = true;

    button.textContent = "Deleting...";

    try {

        const data = await fetchJSON(
            `/api/incidents/${incidentId}`,
            {
                method: "DELETE"
            }
        );

        alert(data.message || "Incident deleted successfully.");

        // Refresh dashboard

        await loadIncidents();

        // Refresh history

        await loadActivityHistory();

    } catch (error) {

        alert("Unable to delete incident: " + error.message);

        console.error("Delete Incident Error:", error);

        button.disabled = false;

        button.textContent = "Delete";

    }

}


// ==========================================
// 7. UPDATE INCIDENT STATUS
// ==========================================

async function updateIncidentStatus(
    incidentId,
    status,
    button
) {

    button.disabled = true;

    button.textContent = "Updating...";

    try {

        await fetchJSON(
            `/api/incidents/${incidentId}/status`,
            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status
                })

            }
        );

        alert("Incident status updated successfully!");

        await loadIncidents();

        await loadActivityHistory();

    } catch (error) {

        alert(error.message);

        console.error("Status Update Error:", error);

        button.disabled = false;

        button.textContent = "Update";

    }

}


// ==========================================
// 8. REFRESH AND FILTER DASHBOARD
// ==========================================

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadIncidents
    );

}

if (incidentSearch) {

    incidentSearch.addEventListener(
        "input",
        loadIncidents
    );

}

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        loadIncidents
    );

}


// ==========================================
// 9. KNOWLEDGE BASE SEARCH
// ==========================================

if (searchKnowledgeButton) {

    searchKnowledgeButton.addEventListener(
        "click",
        async function () {

            const issue = knowledgeIssue.value.trim();

            if (!issue) {

                alert("Please describe your IT problem.");

                return;

            }

            searchKnowledgeButton.disabled = true;

            searchKnowledgeButton.textContent = "Searching...";

            knowledgeResult.textContent =
                "Searching Knowledge Base...";

            try {

                const data = await fetchJSON(
                    "/api/knowledge-search",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            issue
                        })

                    }
                );

                knowledgeResult.innerHTML = "";

                const heading = createElement("h3");

                knowledgeResult.appendChild(heading);


                if (data.knowledgeBaseResult.found) {

                    const article = data.knowledgeBaseResult;

                    heading.textContent = article.title;

                    const category = createElement(
                        "p",
                        "Category: " + article.category
                    );

                    knowledgeResult.appendChild(category);

                    const solutionHeading = createElement(
                        "h4",
                        "Recommended Solutions"
                    );

                    knowledgeResult.appendChild(solutionHeading);

                    const list = document.createElement("ol");

                    article.solution.forEach(step => {

                        const item = createElement("li", step);

                        list.appendChild(item);

                    });

                    knowledgeResult.appendChild(list);

                }

                else {

                    heading.textContent =
                        "No Matching Solution Found";

                    const message = createElement(
                        "p",
                        data.knowledgeBaseResult.message
                    );

                    knowledgeResult.appendChild(message);

                }

                // Refresh history after search

                await loadActivityHistory();

            } catch (error) {

                knowledgeResult.textContent =
                    "Error: " + error.message;

                console.error("Knowledge Base Error:", error);

            } finally {

                searchKnowledgeButton.disabled = false;

                searchKnowledgeButton.textContent =
                    "Search Solutions";

            }

        }
    );

}


// ==========================================
// 10. CREATE ACTIVITY HISTORY INTERFACE
// ==========================================

// ==========================================
// CREATE ACTIVITY HISTORY INTERFACE
// ==========================================

function createHistoryInterface() {

    let historySection =
        document.getElementById("activityHistorySection");

    if (historySection) {
        return;
    }

    const mainContent =
        document.querySelector(".main-content");

    if (!mainContent) {
        console.warn("Main content section not found.");
        return;
    }

    // ==========================================
    // CREATE HISTORY SECTION
    // ==========================================

    historySection = document.createElement("section");

    historySection.id = "activityHistorySection";
    historySection.className = "content-card";
    historySection.style.marginTop = "30px";

    historySection.innerHTML = `
        <div class="history-header">

            <div>
                <h2>
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Activity History
                </h2>

                <p>
                    Track your previous incidents, AI analyses and searches.
                </p>
            </div>

            <button type="button" id="refreshHistory">
                <i class="fa-solid fa-rotate"></i>
                Refresh History
            </button>

        </div>

        <div class="history-controls">

            <input
                type="text"
                id="historySearch"
                placeholder="Search activities..."
            >

            <select id="historyFilter">

                <option value="All">All Activities</option>

                <option value="Incident Submitted">
                    Incident Submitted
                </option>

                <option value="Gemini AI Analysis">
                    Gemini AI Analysis
                </option>

                <option value="Fallback Analysis">
                    Fallback Analysis
                </option>

                <option value="Knowledge Base Search">
                    Knowledge Base Search
                </option>

                <option value="Incident Deleted">
                    Incident Deleted
                </option>

                <option value="Status Updated">
                    Status Updated
                </option>

            </select>

        </div>

        <div class="history-table-container">

            <table class="history-table">

                <thead>
                    <tr>
                        <th>Activity</th>
                        <th>Description</th>
                        <th>Issue</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Source</th>
                        <th>Date & Time</th>
                    </tr>
                </thead>

                <tbody id="historyList">

                    <tr>
                        <td colspan="7">Loading history...</td>
                    </tr>

                </tbody>

            </table>

        </div>

        <p id="historyCount">Total activities: 0</p>
    `;

    mainContent.appendChild(historySection);


    // ==========================================
    // CREATE SIDEBAR HISTORY NAVIGATION
    // ==========================================

    const sidebarMenu =
        document.querySelector(".sidebar-menu");

    if (
        sidebarMenu &&
        !document.getElementById("historyNavigation")
    ) {

        const historyLink = document.createElement("a");

        historyLink.id = "historyNavigation";

        historyLink.href = "#activityHistorySection";

        // Reuse existing sidebar navigation styling
        historyLink.className = "nav-item";

        // Add history icon and label
        historyLink.innerHTML = `
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Activity History</span>
        `;

        sidebarMenu.appendChild(historyLink);


        // Navigation active state
        historyLink.addEventListener("click", () => {

            document.querySelectorAll(".nav-item").forEach(item => {
                item.classList.remove("active");
            });

            historyLink.classList.add("active");

        });

    }


    // ==========================================
    // HISTORY EVENT LISTENERS
    // ==========================================

    document.getElementById("refreshHistory")
        .addEventListener("click", loadActivityHistory);

    document.getElementById("historySearch")
        .addEventListener("input", loadActivityHistory);

    document.getElementById("historyFilter")
        .addEventListener("change", loadActivityHistory);

}


// ==========================================
// 11. LOAD ACTIVITY HISTORY
// ==========================================

async function loadActivityHistory() {

    const historyList =
        document.getElementById("historyList");

    if (!historyList) {
        return;
    }

    historyList.innerHTML = "";

    const loadingRow = document.createElement("tr");

    const loadingCell = createElement(
        "td",
        "Loading activity history..."
    );

    loadingCell.colSpan = 7;

    loadingRow.appendChild(loadingCell);

    historyList.appendChild(loadingRow);

    try {

        const data = await fetchJSON(
            "/api/activities"
        );

        const activities = data.activities || [];

        const searchText =
            document.getElementById("historySearch")
                .value.toLowerCase().trim();

        const selectedFilter =
            document.getElementById("historyFilter").value;


        // SEARCH AND FILTER HISTORY

        const filteredActivities = activities.filter(activity => {

            const searchableText = [

                activity.activityType,
                activity.description,
                activity.issue,
                activity.employeeName,
                activity.category,
                activity.priority,
                activity.analysisSource

            ].join(" ").toLowerCase();

            const matchesSearch =
                searchableText.includes(searchText);

            const matchesFilter =
                selectedFilter === "All" ||
                activity.activityType === selectedFilter;

            return matchesSearch && matchesFilter;

        });


        historyList.innerHTML = "";


        // UPDATE TOTAL COUNT

        const historyCount =
            document.getElementById("historyCount");

        if (historyCount) {

            historyCount.textContent =
                `Showing ${filteredActivities.length} of ${activities.length} activities`;

        }


        // NO HISTORY

        if (filteredActivities.length === 0) {

            const row = document.createElement("tr");

            const cell = createElement(
                "td",
                "No activity records found."
            );

            cell.colSpan = 7;

            row.appendChild(cell);

            historyList.appendChild(row);

            return;

        }


        // DISPLAY HISTORY

        filteredActivities.forEach(activity => {

            const row = document.createElement("tr");

            const values = [

                activity.activityType,

                activity.description,

                activity.issue,

                activity.category,

                activity.priority,

                activity.analysisSource,

                formatDate(activity.createdAt)

            ];

            values.forEach(value => {

                const cell = createElement(
                    "td",
                    value || "-"
                );

                row.appendChild(cell);

            });

            historyList.appendChild(row);

        });

    } catch (error) {

        console.error("Activity History Error:", error);

        historyList.innerHTML = "";

        const row = document.createElement("tr");

        const cell = createElement(
            "td",
            "Unable to load activity history."
        );

        cell.colSpan = 7;

        row.appendChild(cell);

        historyList.appendChild(row);

    }

}


// ==========================================
// 12. INITIALIZE APPLICATION AFTER LOGIN
// ==========================================

async function initializeApplication(event) {
    console.log("Initializing SmartDesk AI...");

    // Get authenticated user details
    currentUser = event.detail.user;

    console.log("Logged-in user:", currentUser.name);
    console.log("User role:", currentUser.role);

    createHistoryInterface();

    await loadIncidents();
    await loadActivityHistory();

    console.log("SmartDesk AI Frontend Initialized Successfully!");
}

// Wait until authentication succeeds
window.addEventListener(
    "smartdesk:authenticated",
    initializeApplication,
    { once: true }
);
// ==========================================
// SIDEBAR HELP PANEL
// ==========================================

const sidebarHelpButton = document.getElementById("sidebarHelpButton");
const helpPanel = document.getElementById("helpPanel");
const closeHelpPanel = document.getElementById("closeHelpPanel");

if (sidebarHelpButton && helpPanel && closeHelpPanel) {

    sidebarHelpButton.addEventListener("click", () => {
        helpPanel.classList.toggle("active");
    });

    closeHelpPanel.addEventListener("click", () => {
        helpPanel.classList.remove("active");
    });

    helpPanel.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            helpPanel.classList.remove("active");
        });
    });

}