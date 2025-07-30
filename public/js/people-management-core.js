// People Management Core JavaScript

// Toast notification system
const Toast = {
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
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 10000;
          animation: slideIn 0.3s ease;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .toast-success { background: linear-gradient(135deg, #10b981, #059669); }
        .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .toast-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .toast-warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
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

// Global variables
let currentPeople = [];
let searchTimeout;

// Core Data Management Functions
async function loadPeopleStats() {
  try {
    const response = await fetch("/api/people/stats");
    const data = await response.json();

    if (data.success) {
      animateCounter("totalPeople", data.totalPeople || 0);
      animateCounter("activeMembers", data.activeMembers || 0);
      animateCounter("familyGroups", data.familyGroups || 0);
      animateCounter("recentAdditions", data.recentAdditions || 0);
    }
  } catch (error) {
    console.error("Error loading people stats:", error);
    Toast.show("Failed to load statistics", "error");
  }
}

async function loadPeopleData() {
  try {
    const response = await fetch("/api/people");
    const data = await response.json();

    if (data.success) {
      currentPeople = data.people;
      displayPeopleData(data.people);
      updateTotalCount(data.people.length);
    }
  } catch (error) {
    console.error("Error loading people data:", error);
    Toast.show("Error loading people data", "error");
  }
}

// Display Functions
function displayPeopleData(people) {
  const container = document.getElementById("peopleTableBody");
  if (!container) return;

  if (people.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i class="fas fa-users text-gray-400 text-2xl"></i>
            </div>
            <p class="text-lg font-medium text-gray-900 mb-2">No people found</p>
            <p class="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = people
    .map(
      (person, index) => `
    <tr class="hover:bg-gray-50 transition-all duration-200 animate-fade-in" style="animation-delay: ${
      index * 0.05
    }s">
      <td class="px-6 py-4">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            ${person.name.charAt(0).toUpperCase()}
          </div>
          <div class="ml-3">
            <div class="text-sm font-medium text-gray-900">${person.name}</div>
            <div class="text-sm text-gray-500 font-mono">${person.cnic}</div>
            ${
              person.is_family_member
                ? '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 mt-1"><i class="fas fa-home mr-1"></i>Family Member</span>'
                : ""
            }
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-900">${person.phone || "N/A"}</div>
        ${
          person.emergency_contact
            ? `<div class="text-xs text-gray-500 mt-1">Emergency: ${person.emergency_contact}</div>`
            : ""
        }
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          ${person.category_name || "N/A"}
        </span>
      </td>
      <td class="px-6 py-4">
        ${
          person.card_number
            ? `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <i class="fas fa-id-card mr-1"></i>Card: ${person.card_number}
          </span>
        `
            : `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <i class="fas fa-times mr-1"></i>No Card
          </span>
        `
        }
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-900">
          ${
            person.family_members_count > 0
              ? `
            <span class="inline-flex items-center text-green-600">
              <i class="fas fa-users mr-1"></i>${person.family_members_count} members
            </span>
          `
              : '<span class="text-gray-500">None</span>'
          }
        </div>
        <div class="text-xs text-gray-500 mt-1">
          Registered: ${new Date(person.created_at).toLocaleDateString()}
        </div>
      </td>
      <td class="px-6 py-4 text-right">
        <div class="flex items-center justify-end space-x-2">
          <button onclick="viewPersonDetails(${
            person.id
          })" class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editPerson(${
            person.id
          })" class="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors duration-200" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          ${
            !person.card_number
              ? `
            <button onclick="generateCard(${person.id})" class="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded-lg transition-colors duration-200" title="Generate Card">
              <i class="fas fa-id-card"></i>
            </button>
          `
              : ""
          }
          <button onclick="addFamilyMember(${
            person.id
          })" class="text-orange-600 hover:text-orange-800 p-2 hover:bg-orange-50 rounded-lg transition-colors duration-200" title="Add Family Member">
            <i class="fas fa-user-friends"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// Utility Functions
function animateCounter(elementId, finalValue) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const currentValue = parseInt(element.textContent.replace(/[^\d]/g, "")) || 0;
  const increment = Math.ceil((finalValue - currentValue) / 20);

  const timer = setInterval(() => {
    const current = parseInt(element.textContent.replace(/[^\d]/g, "")) || 0;
    if (current < finalValue) {
      const newValue = Math.min(current + increment, finalValue);
      element.textContent = newValue;
    } else {
      clearInterval(timer);
    }
  }, 50);
}

function updateTotalCount(count) {
  const totalCountElement = document.getElementById("totalCount");
  if (totalCountElement) {
    totalCountElement.textContent = count;
  }
}

function updateLastUpdateTime() {
  const lastUpdateElement = document.getElementById("lastUpdate");
  if (lastUpdateElement) {
    lastUpdateElement.textContent =
      "Updated " + new Date().toLocaleTimeString();
  }
}

// Search and Filter Functions
async function performQuickSearch() {
  const searchTerm = document.getElementById("quickSearch").value;

  if (searchTerm.length < 2) {
    loadPeopleData();
    return;
  }

  try {
    const response = await fetch(
      `/api/people/search?q=${encodeURIComponent(searchTerm)}`
    );
    const data = await response.json();

    if (data.success) {
      displayPeopleData(data.people);
      updateTotalCount(data.people.length);
    }
  } catch (error) {
    console.error("Error searching people:", error);
    Toast.show("Search failed", "error");
  }
}

async function filterPeople() {
  const category = document.getElementById("categoryFilter").value;
  const status = document.getElementById("statusFilter").value;
  const search = document.getElementById("quickSearch").value;

  try {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);
    if (search) params.append("search", search);

    const response = await fetch(`/api/people?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      displayPeopleData(data.people);
      updateTotalCount(data.people.length);
    }
  } catch (error) {
    console.error("Error filtering people:", error);
    Toast.show("Filter failed", "error");
  }
}

// Card Generation
async function generateCard(personId) {
  if (confirm("Generate a new ID card for this person?")) {
    try {
      const response = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: personId }),
      });

      const data = await response.json();

      if (data.success) {
        Toast.show(
          `Card generated successfully! Card Number: ${data.card_number}`,
          "success"
        );
        setTimeout(() => loadPeopleData(), 1000);
      } else {
        Toast.show(data.message || "Failed to generate card", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    }
  }
}

// Export functionality
function exportPeopleList() {
  Toast.show("Preparing export...", "info");

  setTimeout(() => {
    const link = document.createElement("a");
    link.href = "/api/export-data?type=people";
    link.download = `people_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Toast.show("Export completed successfully!", "success");
  }, 1000);
}

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Event Listeners Setup
function setupEventListeners() {
  // Search functionality
  const quickSearchInput = document.getElementById("quickSearch");
  if (quickSearchInput) {
    quickSearchInput.addEventListener(
      "input",
      debounce(performQuickSearch, 300)
    );
  }

  // Filter functionality
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterPeople);
  }

  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", filterPeople);
  }

  // Close modals when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal-overlay")) {
      const modalId = event.target.id;
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        document.body.style.overflow = "auto";
      }
    }
  });

  // Close search results when clicking outside
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".search-container")) {
      const searchResults = document.getElementById("personHostResults");
      if (searchResults) {
        searchResults.classList.remove("show");
      }
    }
  });
}

// Page Initialization
function initializePeoplePage() {
  loadPeopleStats();
  loadPeopleData();
  setupEventListeners();
  updateLastUpdateTime();
}

// Legacy compatibility functions
function refreshPeopleList() {
  loadPeopleData();
  loadPeopleStats();
}

function showMessage(message, type = "success") {
  Toast.show(message, type);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializePeoplePage();

  // Auto-refresh data every 2 minutes
  setInterval(() => {
    loadPeopleStats();
    updateLastUpdateTime();
  }, 120000);
});
