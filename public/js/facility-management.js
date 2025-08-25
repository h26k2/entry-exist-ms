// Facility Management JavaScript

// Toast notification system
const Toast = {
  success: function (message) {
    this.show(message, "success");
  },
  error: function (message) {
    this.show(message, "error");
  },
  show: function (message, type = "success") {
    const toastDiv = document.createElement("div");
    toastDiv.className = `toast toast-${type}`;
    toastDiv.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${
          type === "success" ? "check-circle" : "exclamation-circle"
        }"></i>
        <span>${message}</span>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById("toast-styles")) {
      const styles = document.createElement("style");
      styles.id = "toast-styles";
      styles.textContent = `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 20px;
          border-radius: 5px;
          color: white;
          font-weight: 500;
          z-index: 10000;
          animation: slideIn 0.3s ease;
        }
        .toast-success { background: #28a745; }
        .toast-error { background: #dc3545; }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(toastDiv);

    setTimeout(() => {
      toastDiv.style.animation = "slideIn 0.3s ease reverse";
      setTimeout(() => {
        if (toastDiv.parentNode) {
          toastDiv.parentNode.removeChild(toastDiv);
        }
      }, 300);
    }, 3000);
  },
};

// Modal Management
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function openAddFacilityModal() {
  document.getElementById("facilityModalTitle").innerHTML =
    '<div class="p-2 bg-blue-500 rounded-lg text-white"><i class="fas fa-building"></i></div>Add Facility';
  document.getElementById("facilityForm").reset();
  document.getElementById("facilityId").value = "";
  document.getElementById("facilityActive").checked = true;
  document.getElementById("saveFacilityBtn").innerHTML =
    '<i class="fas fa-save"></i> Save Facility';
  showModal("addFacilityModal");
}

function editFacility(facilityId) {
  // Fetch facility details and populate form
  fetch(`/api/facility-details/${facilityId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        populateFacilityForm(data.facility);
        document.getElementById("facilityModalTitle").innerHTML =
          '<div class="p-2 bg-blue-500 rounded-lg text-white"><i class="fas fa-building"></i></div>Edit Facility';
        document.getElementById("saveFacilityBtn").innerHTML =
          '<i class="fas fa-save"></i> Update Facility';
        showModal("addFacilityModal");
      } else {
        Toast.error(data.message || "Failed to load facility details");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.error("Network error occurred");
    });
}

function populateFacilityForm(facility) {
  document.getElementById("facilityId").value = facility.id;
  document.getElementById("facilityName").value = facility.name;
  document.getElementById("facilityPrice").value = facility.price;
  document.getElementById("facilityDescription").value =
    facility.description || "";
  document.getElementById("facilityActive").checked = facility.is_active;
}

async function deleteFacility(facilityId) {
  console.log('deleteFacility called with ID:', facilityId);
  
  const confirmed = confirm(
    "Are you sure you want to delete this facility? This action cannot be undone."
  );

  if (confirmed) {
    console.log('User confirmed deletion');
    fetch(`/api/delete-facility/${facilityId}`, {
      method: "DELETE",
    })
      .then((response) => {
        console.log('Response status:', response.status);
        return response.json();
      })
      .then((data) => {
        console.log('Response data:', data);
        if (data.success) {
          Toast.success(data.message);
          setTimeout(() => location.reload(), 1000);
        } else {
          Toast.error(data.message || "Failed to delete facility");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Toast.error("Network error occurred");
      });
  } else {
    console.log('User cancelled deletion');
  }
}

function toggleFacilityStatus(facilityId) {
  fetch(`/api/toggle-facility-status/${facilityId}`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        Toast.success(data.message);
        setTimeout(() => location.reload(), 1000);
      } else {
        Toast.error(data.message || "Failed to toggle facility status");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.error("Network error occurred");
    });
}

// Form Submission
document
  .getElementById("facilityForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const facilityId = document.getElementById("facilityId").value;
    const isUpdate = facilityId !== "";

    const url = isUpdate
      ? `/api/update-facility/${facilityId}`
      : "/api/add-facility";

    // Collect form data as JSON
    const payload = {
      name: document.getElementById("facilityName").value,
      price: document.getElementById("facilityPrice").value,
      description: document.getElementById("facilityDescription").value,
      is_active: document.getElementById("facilityActive").checked ? "1" : "0"
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Response data:', data);
        if (data.success) {
          Toast.success(data.message);
          closeModal("addFacilityModal");
          setTimeout(() => location.reload(), 1000);
        } else {
          Toast.error(data.message || "Operation failed");
        }
      })
      .catch((error) => {
        console.error("Error details:", error);
        Toast.error(`Network error: ${error.message}`);
      });
  });

// Add search input event listener
document
  .getElementById("searchFilter")
  .addEventListener("input", filterFacilities);

// Filtering
function filterFacilities() {
  const statusFilter = document.getElementById("statusFilter").value;
  const searchFilter = document
    .getElementById("searchFilter")
    .value.toLowerCase();
  const facilityCards = document.querySelectorAll(".facility-card");

  facilityCards.forEach((card) => {
    const status = card.getAttribute("data-status");
    const name = card.querySelector(".facility-name").textContent.toLowerCase();
    const description =
      card.querySelector(".facility-description")?.textContent.toLowerCase() ||
      "";

    let showCard = true;

    // Status filter
    if (statusFilter && status !== statusFilter) {
      showCard = false;
    }

    // Search filter
    if (
      searchFilter &&
      !name.includes(searchFilter) &&
      !description.includes(searchFilter)
    ) {
      showCard = false;
    }

    card.style.display = showCard ? "block" : "none";
  });
}

// Usage Report
function showUsageReport() {
  // Set default dates (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  document.getElementById("reportStartDate").value = startDate
    .toISOString()
    .split("T")[0];
  document.getElementById("reportEndDate").value = endDate
    .toISOString()
    .split("T")[0];

  showModal("usageReportModal");
}

function generateUsageReport() {
  const startDate = document.getElementById("reportStartDate").value;
  const endDate = document.getElementById("reportEndDate").value;

  let url = "/api/facility-usage-report";
  const params = [];

  if (startDate) params.push(`start_date=${startDate}`);
  if (endDate) params.push(`end_date=${endDate}`);

  if (params.length > 0) {
    url += "?" + params.join("&");
  }

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayUsageReport(data);
      } else {
        Toast.error(data.message || "Failed to generate report");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.error("Network error occurred");
    });
}

function displayUsageReport(data) {
  const container = document.getElementById("usageReportContent");

  let html = `
        <div class="report-header">
            <h4>Usage Report (${data.period.start_date} to ${data.period.end_date})</h4>
        </div>
    `;

  if (data.report && data.report.length > 0) {
    html += `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Facility Name</th>
                        <th>Current Price</th>
                        <th>Usage Count</th>
                        <th>Total Quantity</th>
                        <th>Total Revenue</th>
                        <th>Avg Price</th>
                    </tr>
                </thead>
                <tbody>
        `;

    data.report.forEach((facility) => {
      html += `
                <tr>
                    <td>${facility.name}</td>
                    <td>$${facility.price.toFixed(2)}</td>
                    <td>${facility.usage_count || 0}</td>
                    <td>${facility.total_quantity || 0}</td>
                    <td>$${(facility.total_revenue || 0).toFixed(2)}</td>
                    <td>$${(facility.avg_price || 0).toFixed(2)}</td>
                </tr>
            `;
    });

    html += "</tbody></table>";
  } else {
    html +=
      '<div class="no-data">No usage data found for the selected period.</div>';
  }

  container.innerHTML = html;
}

// Utility Functions
function showModal(modalId) {
  document.getElementById(modalId).style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  document.body.style.overflow = "auto";
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Close modals when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      const modalId = event.target.id;
      closeModal(modalId);
    }
  });
});
