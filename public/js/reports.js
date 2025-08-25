// Reports JavaScript

let currentTab = "daily-summary";

// Tab Management
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remove active class from all buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");

  currentTab = tabName;

  // Initialize tab if needed
  if (tabName === "daily-summary") {
    initializeDailySummary();
  }
}

// Daily Summary Functions
function initializeDailySummary() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("summaryDate").value = today;
  loadDailySummary();
}

function loadDailySummary() {
  const date =
    document.getElementById("summaryDate").value ||
    new Date().toISOString().split("T")[0];

  showLoading("dailySummaryContent");

  fetch(`/api/daily-summary?date=${date}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayDailySummary(data);
      } else {
        showError("Failed to load daily summary", "dailySummaryContent");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showError("Network error occurred", "dailySummaryContent");
    });
}

function displayDailySummary(data) {
  const container = document.getElementById("dailySummaryContent");

  let html = `
    <div class="summary-cards">
      <div class="summary-card entries">
        <h4>Total Entries</h4>
        <div class="value">${data.summary.total_entries || 0}</div>
        <div class="description">People entered today</div>
      </div>
      <div class="summary-card">
        <h4>Total Exits</h4>
        <div class="value">${data.summary.total_exits || 0}</div>
        <div class="description">People exited today</div>
      </div>
      <div class="summary-card revenue">
        <h4>Total Revenue</h4>
        <div class="value">RS${(data.summary.total_revenue || 0).toFixed(
          2
        )}</div>
        <div class="description">Revenue generated today</div>
      </div>
      <div class="summary-card people">
        <h4>Currently Inside</h4>
        <div class="value">${data.currentOccupancy || 0}</div>
        <div class="description">People currently in facility</div>
      </div>
    </div>
  `;

  // Category Breakdown
  if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
    html += `
      <div class="charts-container">
        <div class="chart-card">
          <h4>Category-wise Breakdown</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Entries</th>
                <th>Total People</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
    `;

    data.categoryBreakdown.forEach((category) => {
      html += `
        <tr>
          <td>${category.category}</td>
          <td>${category.entries}</td>
          <td>${category.total_people}</td>
          <td>RS${(category.revenue || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
    `;

    // Facility Usage
    if (data.facilityUsage && data.facilityUsage.length > 0) {
      html += `
        <div class="chart-card">
          <h4>Facility Usage</h4>
          <div class="facility-usage">
      `;

      data.facilityUsage.forEach((facility) => {
        html += `
          <div class="facility-item">
            <div class="facility-name">${facility.facility}</div>
            <div class="facility-stats">
              <span>Used: ${facility.usage_count}</span>
              <span>Qty: ${facility.total_quantity}</span>
              <span class="facility-revenue">RS${(
                facility.total_revenue || 0
              ).toFixed(2)}</span>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      </div>
      `;
    } else {
      html += `
        <div class="chart-card">
          <h4>Facility Usage</h4>
          <div class="no-data">No facility usage recorded for this date</div>
        </div>
        </div>
      `;
    }
  } else {
    html += `
      <div class="no-data">
        <div class="no-data-icon">📊</div>
        <h3>No data available for ${data.reportDate}</h3>
        <p>No entries were recorded for this date.</p>
      </div>
    `;
  }

  container.innerHTML = html;
}

// Person History Functions
function searchPersonForHistory() {
  const query = document.getElementById("historyPersonSearch").value;
  if (query.length < 2) {
    document.getElementById("historyPersonResults").classList.remove("show");
    return;
  }

  fetch("/api/search-person", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayPersonSearchResults(data.people);
      }
    })
    .catch((error) => console.error("Search error:", error));
}

function displayPersonSearchResults(people) {
  const container = document.getElementById("historyPersonResults");

  if (people.length === 0) {
    container.innerHTML = '<div class="search-item">No results found</div>';
    container.classList.add("show");
    return;
  }

  let html = "";
  people.forEach((person) => {
    html += `
      <div class="search-item" onclick="selectPersonForHistory(${person.id}, '${person.name}', '${person.cnic}')">
        <h5>${person.name}</h5>
        <p><strong>CNIC:</strong> ${person.cnic}</p>
        <p><strong>Category:</strong> ${person.category_name}</p>
      </div>
    `;
  });

  container.innerHTML = html;
  container.classList.add("show");
}

function selectPersonForHistory(id, name, cnic) {
  document.getElementById("historyPersonId").value = id;
  document.getElementById("historyPersonSearch").value = name;
  document.getElementById("historyPersonResults").classList.remove("show");
  document.getElementById("loadHistoryBtn").disabled = false;
}

function loadPersonHistory() {
  const personId = document.getElementById("historyPersonId").value;
  const startDate = document.getElementById("historyStartDate").value;
  const endDate = document.getElementById("historyEndDate").value;

  if (!personId) {
    showMessage("Please select a person first", "error");
    return;
  }

  showLoading("personHistoryContent");

  let url = `/api/person-history?person_id=${personId}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayPersonHistory(data);
      } else {
        showError(
          data.message || "Failed to load person history",
          "personHistoryContent"
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showError("Network error occurred", "personHistoryContent");
    });
}

function displayPersonHistory(data) {
  const container = document.getElementById("personHistoryContent");

  let html = `
    <div class="person-history-header">
      <h4>${data.person.name}</h4>
      <p><strong>CNIC:</strong> ${data.person.cnic}</p>
      <p><strong>Category:</strong> ${data.person.category_name}</p>
    </div>
    
    <div class="person-history-stats">
      <div class="stat-item">
        <span class="stat-value">${data.stats.total_visits || 0}</span>
        <span class="stat-label">Total Visits</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">RS${(data.stats.total_spent || 0).toFixed(
          2
        )}</span>
        <span class="stat-label">Total Spent</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${Math.round(
          data.stats.avg_duration_minutes || 0
        )}m</span>
        <span class="stat-label">Avg Duration</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${
          data.stats.last_visit
            ? new Date(data.stats.last_visit).toLocaleDateString()
            : "Never"
        }</span>
        <span class="stat-label">Last Visit</span>
      </div>
    </div>
  `;

  if (data.history && data.history.length > 0) {
    html += `
      <table class="data-table">
        <thead>
          <tr>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Duration</th>
            <th>Amount</th>
            <th>Operator</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.history.forEach((entry) => {
      const duration = entry.duration_minutes
        ? `${Math.floor(entry.duration_minutes / 60)}h ${
            entry.duration_minutes % 60
          }m`
        : "Ongoing";

      html += `
        <tr>
          <td>${new Date(entry.entry_time).toLocaleString()}</td>
          <td>${
            entry.exit_time
              ? new Date(entry.exit_time).toLocaleString()
              : "Still inside"
          }</td>
          <td>${duration}</td>
          <td>RS${(entry.total_amount || 0).toFixed(2)}</td>
          <td>${entry.operator_name}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
  } else {
    html +=
      '<div class="no-data">No visit history found for this person.</div>';
  }

  container.innerHTML = html;
}

// Category Report Functions
function loadCategoryReport() {
  const categoryId = document.getElementById("reportCategory").value;
  const startDate = document.getElementById("categoryStartDate").value;
  const endDate = document.getElementById("categoryEndDate").value;

  if (!categoryId) {
    showMessage("Please select a category first", "error");
    return;
  }

  showLoading("categoryReportContent");

  let url = `/api/category-report?category_id=${categoryId}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayCategoryReport(data);
      } else {
        showError(
          data.message || "Failed to load category report",
          "categoryReportContent"
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showError("Network error occurred", "categoryReportContent");
    });
}

function displayCategoryReport(data) {
  const container = document.getElementById("categoryReportContent");

  let html = `
    <div class="person-history-header">
      <h4>Category: ${data.category.name}</h4>
      <p>${data.category.description || ""}</p>
    </div>
    
    <div class="person-history-stats">
      <div class="stat-item">
        <span class="stat-value">${data.summary.unique_people || 0}</span>
        <span class="stat-label">Unique People</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${data.summary.total_entries || 0}</span>
        <span class="stat-label">Total Entries</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">RS${(data.summary.total_revenue || 0).toFixed(
          2
        )}</span>
        <span class="stat-label">Total Revenue</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">RS${(data.summary.avg_per_visit || 0).toFixed(
          2
        )}</span>
        <span class="stat-label">Avg per Visit</span>
      </div>
    </div>
  `;

  if (data.report && data.report.length > 0) {
    html += `
      <table class="data-table">
        <thead>
          <tr>
            <th>Person Name</th>
            <th>CNIC</th>
            <th>Total Visits</th>
            <th>Total Spent</th>
            <th>First Visit</th>
            <th>Last Visit</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.report.forEach((person) => {
      html += `
        <tr>
          <td>${person.person_name}</td>
          <td>${person.cnic}</td>
          <td>${person.total_visits}</td>
          <td>RS${(person.total_spent || 0).toFixed(2)}</td>
          <td>${new Date(person.first_visit).toLocaleDateString()}</td>
          <td>${new Date(person.last_visit).toLocaleDateString()}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
  } else {
    html +=
      '<div class="no-data">No data found for this category in the selected period.</div>';
  }

  container.innerHTML = html;
}

// Revenue Report Functions
function loadRevenueReport() {
  const period = document.getElementById("revenuePeriod").value;
  const startDate = document.getElementById("revenueStartDate").value;
  const endDate = document.getElementById("revenueEndDate").value;

  showLoading("revenueReportContent");

  let url = `/api/revenue-report?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayRevenueReport(data);
      } else {
        showError(
          data.message || "Failed to load revenue report",
          "revenueReportContent"
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showError("Network error occurred", "revenueReportContent");
    });
}

function displayRevenueReport(data) {
  const container = document.getElementById("revenueReportContent");

  let html = `
    <div class="charts-container">
      <div class="chart-card">
        <h4>Revenue by Period</h4>
  `;

  if (data.revenueByPeriod && data.revenueByPeriod.length > 0) {
    html += `
      <table class="data-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Entries</th>
            <th>Revenue</th>
            <th>Avg per Entry</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.revenueByPeriod.forEach((period) => {
      html += `
        <tr>
          <td>${period.period}</td>
          <td>${period.entries}</td>
          <td>RS${(period.revenue || 0).toFixed(2)}</td>
          <td>RS${(period.avg_per_entry || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
  } else {
    html +=
      '<div class="no-data">No revenue data found for the selected period.</div>';
  }

  html += `
      </div>
      <div class="chart-card">
        <h4>Revenue by Category</h4>
  `;

  if (data.revenueByCategory && data.revenueByCategory.length > 0) {
    html += `
      <table class="data-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Entries</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.revenueByCategory.forEach((category) => {
      html += `
        <tr>
          <td>${category.category}</td>
          <td>${category.entries}</td>
          <td>RS${(category.revenue || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
  } else {
    html += '<div class="no-data">No category revenue data found.</div>';
  }

  html += `
      </div>
    </div>
  `;

  if (data.revenueByFacility && data.revenueByFacility.length > 0) {
    html += `
      <div class="chart-card">
        <h4>Revenue by Facility</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Usage Count</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.revenueByFacility.forEach((facility) => {
      html += `
        <tr>
          <td>${facility.facility}</td>
          <td>${facility.usage_count}</td>
          <td>RS${(facility.revenue || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = html;
}

// Export Functions
function exportData(type) {
  let url = `/api/export-data?type=${type}`;

  if (type === "entries") {
    const startDate = document.getElementById("exportEntriesStart").value;
    const endDate = document.getElementById("exportEntriesEnd").value;

    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
  }

  // Create a temporary link to download the file
  const link = document.createElement("a");
  link.href = url;
  link.click();
}

// Person History Search Function
function searchPersonHistory() {
  const searchQuery = document
    .getElementById("personHistorySearch")
    .value.trim();

  if (!searchQuery) {
    showMessage("Please enter a CNIC or name to search", "error");
    return;
  }

  // Show the results container
  document.getElementById("personHistoryResults").style.display = "block";
  showLoading("personHistoryResults");

  fetch(`/api/person-history?query=${encodeURIComponent(searchQuery)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayPersonHistory(data.data);
      } else {
        showError(
          data.message || "Failed to fetch person history",
          "personHistoryResults"
        );
      }
    })
    .catch((error) => {
      console.error("Error searching person history:", error);
      showError("Error searching person history", "personHistoryResults");
    });
}

function displayPersonHistory(historyData) {
  const container = document.getElementById("personHistoryResults");

  if (!historyData || historyData.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <div class="no-data-icon">📋</div>
        <h3>No History Found</h3>
        <p>No entry/exit history found for this person.</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="person-info mb-4">
      <h4 class="text-lg font-semibold">${historyData[0].person_name} (${historyData[0].cnic})</h4>
      <p class="text-gray-600">Category: ${historyData[0].category_name}</p>
    </div>
    <div class="history-table-container overflow-x-auto">
      <table class="min-w-full table-auto border-collapse">
        <thead>
          <tr class="bg-gray-50">
            <th class="border px-4 py-2 text-left">Date</th>
            <th class="border px-4 py-2 text-left">Entry Time</th>
            <th class="border px-4 py-2 text-left">Exit Time</th>
            <th class="border px-4 py-2 text-left">Duration</th>
            <th class="border px-4 py-2 text-left">Facilities Used</th>
            <th class="border px-4 py-2 text-left">Total Fee</th>
          </tr>
        </thead>
        <tbody>
  `;

  historyData.forEach((entry) => {
    const entryDate = new Date(entry.entry_time).toLocaleDateString();
    const entryTime = new Date(entry.entry_time).toLocaleTimeString();
    const exitTime = entry.exit_time
      ? new Date(entry.exit_time).toLocaleTimeString()
      : "Still Inside";

    let duration = "N/A";
    if (entry.exit_time) {
      const durationMs = new Date(entry.exit_time) - new Date(entry.entry_time);
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${hours}h ${minutes}m`;
    }

    html += `
      <tr class="hover:bg-gray-50">
        <td class="border px-4 py-2">${entryDate}</td>
        <td class="border px-4 py-2">${entryTime}</td>
        <td class="border px-4 py-2">${exitTime}</td>
        <td class="border px-4 py-2">${duration}</td>
        <td class="border px-4 py-2">${entry.facilities || "None"}</td>
  <td class="border px-4 py-2">RS${entry.total_fee || 0}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

// Utility Functions
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
  `;
}

function showError(message, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="no-data">
      <div class="no-data-icon">⚠️</div>
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `;
}

function showMessage(message, type = "success") {
  const messageDiv = document.createElement("div");
  messageDiv.className =
    type === "success" ? "success-message" : "error-message";
  messageDiv.textContent = message;

  const mainContent = document.querySelector(".dashboard-content");
  mainContent.insertBefore(messageDiv, mainContent.firstChild);

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  initializeDailySummary();

  // Add search input event listeners
  const personHistorySearchInput = document.getElementById(
    "personHistorySearch"
  );
  if (personHistorySearchInput) {
    personHistorySearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchPersonHistory();
      }
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".form-group")) {
      document.querySelectorAll(".search-dropdown").forEach((dropdown) => {
        dropdown.classList.remove("show");
      });
    }
  });
});
