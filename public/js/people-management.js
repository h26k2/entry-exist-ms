// People Management JavaScript

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

let searchTimeout;
let currentPeople = [];

// Load people statistics
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
  }
}

// Animate counter values
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

// Load people data
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

// Display people data in table
function displayPeopleData(people) {
  const container = document.getElementById("peopleTableBody");
  if (!container) return;

  if (people.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          <i class="fas fa-users text-4xl mb-4 opacity-50"></i>
          <p class="text-lg font-medium">No people found</p>
          <p class="text-sm">Try adjusting your search or filters</p>
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
            <div class="text-sm text-gray-500">${person.cnic}</div>
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

// Update total count
function updateTotalCount(count) {
  const totalCountElement = document.getElementById("totalCount");
  if (totalCountElement) {
    totalCountElement.textContent = count;
  }
}

// Modal Management
function openAddPersonModal() {
  document.getElementById("personModalTitle").textContent = "Add New Person";
  document.getElementById("personForm").reset();
  document.getElementById("personId").value = "";
  document.getElementById("personIsFamilyMember").checked = false;
  document.getElementById("personFamilyFields").style.display = "none";
  document.getElementById("savePersonBtn").textContent = "Save Person";
  showModal("personModal");
}

function editPerson(personId) {
  // Fetch person details and populate form
  fetch(`/api/person-details/${personId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        populatePersonForm(data.person);
        document.getElementById("personModalTitle").textContent = "Edit Person";
        document.getElementById("submitPersonBtn").innerHTML =
          '<i class="fas fa-save mr-2"></i>Update Person';
        showModal("personModal");
      } else {
        Toast.show(data.message || "Failed to load person details", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    });
}

function populatePersonForm(person) {
  document.getElementById("personId").value = person.id;
  document.getElementById("personCnic").value = person.cnic;
  document.getElementById("personName").value = person.name;
  document.getElementById("personPhone").value = person.phone || "";
  document.getElementById("personCategory").value = person.category_id;
  document.getElementById("personAddress").value = person.address || "";
  document.getElementById("personEmergencyContact").value =
    person.emergency_contact || "";
  document.getElementById("personRemarks").value = person.remarks || "";
  document.getElementById("personIsFamilyMember").checked =
    person.is_family_member;

  if (person.is_family_member && person.host_person_id) {
    document.getElementById("personFamilyFields").style.display = "block";
    document.getElementById("personHostId").value = person.host_person_id;
    // You might want to fetch and display host name here
  }
}

function viewPersonDetails(personId) {
  fetch(`/api/person-details/${personId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayPersonDetails(data);
        showModal("personDetailsModal");
      } else {
        Toast.show(data.message || "Failed to load person details", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    });
}

function displayPersonDetails(data) {
  const container = document.getElementById("personDetailsContent");
  const person = data.person;

  let html = `
    <div class="person-details">
      <div class="detail-section">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">Name:</span>
            <span class="detail-value text-gray-900">${person.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">CNIC:</span>
            <span class="detail-value text-gray-900">${person.cnic}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">Category:</span>
            <span class="detail-value text-gray-900">${
              person.category_name
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">Phone:</span>
            <span class="detail-value text-gray-900">${
              person.phone || "N/A"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">Address:</span>
            <span class="detail-value text-gray-900">${
              person.address || "N/A"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">Emergency Contact:</span>
            <span class="detail-value text-gray-900">${
              person.emergency_contact || "N/A"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">Card Number:</span>
            <span class="detail-value text-gray-900">${
              person.card_number || "No Card"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label font-medium text-gray-600">Registration Date:</span>
            <span class="detail-value text-gray-900">${new Date(
              person.created_at
            ).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
  `;

  // Available Balance
  if (data.available_balance > 0) {
    html += `
      <div class="balance-display bg-green-50 p-4 rounded-lg mt-6">
        <h4 class="text-lg font-semibold text-green-900 mb-2">Available Balance</h4>
        <div class="balance-amount text-2xl font-bold text-green-600">$${data.available_balance.toFixed(
          2
        )}</div>
      </div>
    `;
  }

  // Family Members
  if (data.familyMembers && data.familyMembers.length > 0) {
    html += `
      <div class="detail-section mt-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">Family Members (${data.familyMembers.length})</h4>
        <div class="family-members-list space-y-3">
    `;

    data.familyMembers.forEach((member) => {
      html += `
        <div class="family-member-item bg-gray-50 p-4 rounded-lg flex justify-between items-center">
          <div class="family-member-info">
            <h5 class="font-semibold text-gray-900">${member.name}</h5>
            <p class="text-sm text-gray-600">CNIC: ${member.cnic}</p>
            <p class="text-sm text-gray-600">Phone: ${member.phone || "N/A"}</p>
          </div>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editPerson(${
              member.id
            })">Edit</button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  html += "</div>";
  container.innerHTML = html;
}

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

function addFamilyMember(hostPersonId) {
  // First, get host person details
  fetch(`/api/person-details/${hostPersonId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("familyHostPersonId").value = hostPersonId;
        document.getElementById("familyHostName").textContent =
          data.person.name;
        document.getElementById("familyHostCnic").textContent =
          data.person.cnic;
        document.getElementById("familyMemberForm").reset();
        showModal("familyMemberModal");
      } else {
        Toast.show(data.message || "Failed to load host details", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    });
}

// Form submission handlers
function setupFormHandlers() {
  // Person form submission
  const personForm = document.getElementById("personForm");
  if (personForm) {
    personForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const personId = document.getElementById("personId").value;
      const isUpdate = personId !== "";

      // Convert FormData to JSON
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      // Add checkbox values
      data.is_family_member = document.getElementById("personIsFamilyMember")
        .checked
        ? "1"
        : "0";
      data.generate_card = document.getElementById("personGenerateCard").checked
        ? "1"
        : "0";

      if (data.is_family_member === "1") {
        data.host_person_id = document.getElementById("personHostId").value;
      }

      const url = isUpdate
        ? `/api/update-person/${personId}`
        : "/api/add-person";

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          let message = isUpdate
            ? "Person updated successfully!"
            : "Person added successfully!";
          if (result.card_number) {
            message += ` Card Number: ${result.card_number}`;
          }
          Toast.show(message, "success");
          closePersonModal();
          setTimeout(() => {
            loadPeopleData();
            loadPeopleStats();
          }, 1000);
        } else {
          Toast.show(result.message || "Operation failed", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        Toast.show("Network error occurred", "error");
      }
    });
  }

  // Family member form submission
  const familyMemberForm = document.getElementById("familyMemberForm");
  if (familyMemberForm) {
    familyMemberForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      formData.append(
        "host_person_id",
        document.getElementById("familyHostPersonId").value
      );

      // Convert FormData to JSON
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      try {
        const response = await fetch("/api/add-family-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          Toast.show("Family member added successfully!", "success");
          closeFamilyMemberModal();
          setTimeout(() => {
            loadPeopleData();
            loadPeopleStats();
          }, 1000);
        } else {
          Toast.show(result.message || "Failed to add family member", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        Toast.show("Network error occurred", "error");
      }
    });
  }
}

// Advanced search functions
async function performAdvancedSearch() {
  const searchData = {
    query: document.getElementById("advSearchQuery").value,
    category_id: document.getElementById("advSearchCategory").value,
    is_family_member: document.getElementById("advSearchFamilyMembers").checked
      ? "1"
      : "",
    has_card: document.getElementById("advSearchWithCards").checked
      ? "1"
      : document.getElementById("advSearchWithoutCards").checked
      ? "0"
      : "",
    registration_start: document.getElementById("advSearchRegistrationStart")
      .value,
    registration_end: document.getElementById("advSearchRegistrationEnd").value,
  };

  try {
    const response = await fetch("/api/search-people-advanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchData),
    });

    const data = await response.json();

    if (data.success) {
      displayAdvancedSearchResults(data.people);
    } else {
      Toast.show(data.message || "Search failed", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    Toast.show("Network error occurred", "error");
  }
}

function displayAdvancedSearchResults(people) {
  const container = document.getElementById("advancedSearchResults");

  if (people.length === 0) {
    container.innerHTML =
      '<div class="text-center py-8 text-gray-500">No people found matching your criteria.</div>';
    return;
  }

  let html = `
    <h4 class="text-lg font-semibold mb-4">Search Results (${people.length} found)</h4>
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CNIC</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Card</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
  `;

  people.forEach((person) => {
    html += `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-2">
          ${person.name}
          ${
            person.is_family_member
              ? '<span class="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Family</span>'
              : ""
          }
        </td>
        <td class="px-4 py-2 font-mono text-sm">${person.cnic}</td>
        <td class="px-4 py-2">${person.category_name || "N/A"}</td>
        <td class="px-4 py-2">${person.phone || "N/A"}</td>
        <td class="px-4 py-2">
          ${
            person.card_number
              ? `<span class="text-green-600">${person.card_number}</span>`
              : '<span class="text-gray-400">No Card</span>'
          }
        </td>
        <td class="px-4 py-2">
          <div class="flex space-x-2">
            <button class="text-blue-600 hover:text-blue-800" onclick="viewPersonDetails(${
              person.id
            })" title="View">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-green-600 hover:text-green-800" onclick="editPerson(${
              person.id
            })" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

function clearAdvancedSearch() {
  document.getElementById("advSearchQuery").value = "";
  document.getElementById("advSearchCategory").value = "";
  document.getElementById("advSearchFamilyMembers").checked = false;
  document.getElementById("advSearchWithCards").checked = false;
  document.getElementById("advSearchWithoutCards").checked = false;
  document.getElementById("advSearchRegistrationStart").value = "";
  document.getElementById("advSearchRegistrationEnd").value = "";
  document.getElementById("advancedSearchResults").innerHTML = "";
  Toast.show("Search filters cleared", "info");
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

// Debounce function for search
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

// Modal Management
function openAddPersonModal() {
  document.getElementById("personModalTitle").textContent = "Add New Person";
  document.getElementById("personForm").reset();
  document.getElementById("personId").value = "";
  document.getElementById("personIsFamilyMember").checked = false;
  document.getElementById("personFamilyFields").style.display = "none";
  document.getElementById("submitPersonBtn").innerHTML =
    '<i class="fas fa-save mr-2"></i>Save Person';
  showModal("personModal");
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "auto";
  }
}

// Specific modal close functions
function closePersonModal() {
  closeModal("personModal");
}

function closePersonDetailsModal() {
  closeModal("personDetailsModal");
}

function closeFamilyMemberModal() {
  closeModal("familyMemberModal");
}

function closeAdvancedSearchModal() {
  closeModal("advancedSearchModal");
}

function closeBulkImportModal() {
  closeModal("bulkImportModal");
}

// Initialize page
function initializePeoplePage() {
  loadPeopleStats();
  loadPeopleData();
  setupEventListeners();
  setupFormHandlers();
  updateLastUpdateTime();
}

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

  // CNIC formatting
  const cnicInputs = document.querySelectorAll("#personCnic, #familyCnic");
  cnicInputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", function (e) {
        // Remove any non-digit characters
        let value = e.target.value.replace(/\D/g, "");
        // Limit to 13 digits
        if (value.length > 13) {
          value = value.substring(0, 13);
        }
        e.target.value = value;
      });
    }
  });

  // Phone number formatting
  const phoneInputs = document.querySelectorAll(
    "#personPhone, #familyPhone, #personEmergencyContact, #familyEmergencyContact"
  );
  phoneInputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", function (e) {
        // Allow digits, spaces, hyphens, parentheses, and plus sign
        let value = e.target.value.replace(/[^\d\s\-\(\)\+]/g, "");
        e.target.value = value;
      });
    }
  });

  // Family member toggle
  const familyMemberToggle = document.getElementById("personIsFamilyMember");
  if (familyMemberToggle) {
    familyMemberToggle.addEventListener("change", function () {
      const familyFields = document.getElementById("personFamilyFields");
      if (familyFields) {
        familyFields.style.display = this.checked ? "block" : "none";
      }

      if (!this.checked) {
        const hostId = document.getElementById("personHostId");
        const hostSearch = document.getElementById("personHostSearch");
        if (hostId) hostId.value = "";
        if (hostSearch) hostSearch.value = "";
      }
    });
  }

  // Host person search
  const hostSearchInput = document.getElementById("personHostSearch");
  if (hostSearchInput) {
    hostSearchInput.addEventListener("input", debounce(searchPersonHost, 300));
  }

  // Close modals when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal-overlay")) {
      const modalId = event.target.id;
      closeModal(modalId);
    }
  });

  // Close search results when clicking outside
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".form-group")) {
      const searchResults = document.getElementById("personHostResults");
      if (searchResults) {
        searchResults.classList.remove("show");
      }
    }
  });
}

// Search for host person
async function searchPersonHost() {
  const query = document.getElementById("personHostSearch").value;
  if (query.length < 2) {
    document.getElementById("personHostResults").classList.remove("show");
    return;
  }

  try {
    const response = await fetch("/api/search-person", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.success) {
      displayHostSearchResults(data.people);
    }
  } catch (error) {
    console.error("Search error:", error);
  }
}

function displayHostSearchResults(people) {
  const container = document.getElementById("personHostResults");

  if (people.length === 0) {
    container.innerHTML =
      '<div class="search-item p-2 text-gray-500">No results found</div>';
    container.classList.add("show");
    return;
  }

  let html = "";
  people.forEach((person) => {
    html += `
      <div class="search-item p-3 cursor-pointer hover:bg-gray-100 border-b" onclick="selectHostPerson(${person.id}, '${person.name}')">
        <h5 class="font-medium">${person.name}</h5>
        <p class="text-sm text-gray-600"><strong>CNIC:</strong> ${person.cnic}</p>
        <p class="text-sm text-gray-600"><strong>Category:</strong> ${person.category_name}</p>
      </div>
    `;
  });

  container.innerHTML = html;
  container.classList.add("show");
}

function selectHostPerson(id, name) {
  document.getElementById("personHostId").value = id;
  document.getElementById("personHostSearch").value = name;
  document.getElementById("personHostResults").classList.remove("show");
}

// Update last update time
function updateLastUpdateTime() {
  const lastUpdateElement = document.getElementById("lastUpdate");
  if (lastUpdateElement) {
    lastUpdateElement.textContent =
      "Updated " + new Date().toLocaleTimeString();
  }
}

// Modal functions for advanced features
function openBulkImportModal() {
  showModal("bulkImportModal");
}

function openAdvancedSearchModal() {
  showModal("advancedSearchModal");
}

// Legacy functions for compatibility
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
