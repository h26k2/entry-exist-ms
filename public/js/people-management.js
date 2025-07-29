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
        document.getElementById("savePersonBtn").textContent = "Update Person";
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
        <h4>Personal Information</h4>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${person.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CNIC:</span>
          <span class="detail-value">${person.cnic}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category:</span>
          <span class="detail-value">${person.category_name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${person.phone || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Address:</span>
          <span class="detail-value">${person.address || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Emergency Contact:</span>
          <span class="detail-value">${person.emergency_contact || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Card Number:</span>
          <span class="detail-value">${person.card_number || "No Card"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registration Date:</span>
          <span class="detail-value">${new Date(
            person.created_at
          ).toLocaleDateString()}</span>
        </div>
      </div>
  `;

  // Available Balance
  if (data.available_balance > 0) {
    html += `
      <div class="balance-display">
        <h4>Available Balance</h4>
        <div class="balance-amount">$${data.available_balance.toFixed(2)}</div>
      </div>
    `;
  }

  // Family Members
  if (data.familyMembers && data.familyMembers.length > 0) {
    html += `
      <div class="detail-section">
        <h4>Family Members (${data.familyMembers.length})</h4>
        <div class="family-members-list">
    `;

    data.familyMembers.forEach((member) => {
      html += `
        <div class="family-member-item">
          <div class="family-member-info">
            <h5>${member.name}</h5>
            <p>CNIC: ${member.cnic}</p>
            <p>Phone: ${member.phone || "N/A"}</p>
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

  // Recent Entries
  if (data.recentEntries && data.recentEntries.length > 0) {
    html += `
      <div class="detail-section">
        <h4>Recent Entry History</h4>
        <table class="entry-history-table">
          <thead>
            <tr>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Amount</th>
              <th>Operator</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.recentEntries.forEach((entry) => {
      html += `
        <tr>
          <td>${new Date(entry.entry_time).toLocaleString()}</td>
          <td>${
            entry.exit_time
              ? new Date(entry.exit_time).toLocaleString()
              : "Still inside"
          }</td>
          <td>$${(entry.total_amount || 0).toFixed(2)}</td>
          <td>${entry.operator_name}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  // Fee Deposits
  if (data.deposits && data.deposits.length > 0) {
    html += `
      <div class="detail-section">
        <h4>Fee Deposits</h4>
        <div class="deposits-list">
    `;

    data.deposits.forEach((deposit) => {
      html += `
        <div class="deposit-item">
          <div class="deposit-info">
            <h5>$${deposit.amount}</h5>
            <p>${deposit.description || "Fee deposit"}</p>
            <p>By: ${deposit.deposited_by_name} on ${new Date(
        deposit.deposit_date
      ).toLocaleDateString()}</p>
            <p>Receipt: ${deposit.receipt_number || "N/A"}</p>
          </div>
          <div class="deposit-amount">
            <span class="status-badge status-${deposit.status.toLowerCase()}">${
        deposit.status
      }</span>
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

async function generateCard(personId) {
  const confirmed = await confirm("Generate a new ID card for this person?");
  if (confirmed) {
    fetch("/api/generate-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_id: personId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Toast.show(
            `Card generated successfully! Card Number: ${data.card_number}`,
            "success"
          );
          setTimeout(() => refreshPeopleList(), 1000);
        } else {
          Toast.show(data.message || "Failed to generate card", "error");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Toast.show("Network error occurred", "error");
      });
  }
}

function openBulkImportModal() {
  showModal("bulkImportModal");
}

function openAdvancedSearchModal() {
  showModal("advancedSearchModal");
}

// Search and Filter Functions
function quickSearchPeople() {
  const query = document.getElementById("quickSearch").value;

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (query.length >= 2 || query.length === 0) {
      filterPeopleList();
    }
  }, 300);
}

function filterByCategory() {
  filterPeopleList();
}

function filterByStatus() {
  filterPeopleList();
}

function filterPeopleList() {
  const query = document.getElementById("quickSearch").value.toLowerCase();
  const categoryId = document.getElementById("filterCategory").value;
  const status = document.getElementById("filterStatus").value;

  const rows = document.querySelectorAll(".people-table tbody tr");
  let visibleCount = 0;

  rows.forEach((row) => {
    const name = row.cells[0].textContent.toLowerCase();
    const cnic = row.cells[1].textContent.toLowerCase();
    const category = row.cells[2].textContent;
    const phone = row.cells[3].textContent.toLowerCase();
    const cardNumber = row.cells[4].textContent;
    const isFamilyMember = row.cells[0].querySelector(".family-badge") !== null;

    let showRow = true;

    // Text search
    if (
      query &&
      !name.includes(query) &&
      !cnic.includes(query) &&
      !phone.includes(query)
    ) {
      showRow = false;
    }

    // Category filter
    if (categoryId && !category.includes(categoryId)) {
      showRow = false;
    }

    // Status filter
    if (status) {
      switch (status) {
        case "family":
          if (!isFamilyMember) showRow = false;
          break;
        case "with_cards":
          if (cardNumber.includes("No Card")) showRow = false;
          break;
        case "without_cards":
          if (!cardNumber.includes("No Card")) showRow = false;
          break;
      }
    }

    row.style.display = showRow ? "" : "none";
    if (showRow) visibleCount++;
  });

  document.getElementById("peopleCount").textContent = visibleCount;
}

function performAdvancedSearch() {
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

  fetch("/api/search-people-advanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(searchData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayAdvancedSearchResults(data.people);
      } else {
        Toast.show(data.message || "Search failed", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    });
}

function displayAdvancedSearchResults(people) {
  const container = document.getElementById("advancedSearchResults");

  if (people.length === 0) {
    container.innerHTML =
      '<div class="no-data">No people found matching your criteria.</div>';
    return;
  }

  let html = `
    <h4>Search Results (${people.length} found)</h4>
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>CNIC</th>
          <th>Category</th>
          <th>Phone</th>
          <th>Card Number</th>
          <th>Registration Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  people.forEach((person) => {
    html += `
      <tr>
        <td>
          ${person.name}
          ${
            person.is_family_member
              ? '<span class="family-badge">Family</span>'
              : ""
          }
        </td>
        <td>${person.cnic}</td>
        <td>${person.category_name || "N/A"}</td>
        <td>${person.phone || "N/A"}</td>
        <td>${person.card_number || '<span class="no-card">No Card</span>'}</td>
        <td>${new Date(person.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="viewPersonDetails(${
            person.id
          })">View</button>
          <button class="btn btn-sm btn-primary" onclick="editPerson(${
            person.id
          })">Edit</button>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
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
}

// Form Submissions
document.getElementById("personForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const personId = document.getElementById("personId").value;
  const isUpdate = personId !== "";

  const url = isUpdate ? `/api/update-person/${personId}` : "/api/add-person";
  const method = "POST";

  fetch(url, {
    method: method,
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        let message = isUpdate
          ? "Person updated successfully!"
          : "Person added successfully!";
        if (data.card_number) {
          message += ` Card Number: ${data.card_number}`;
        }
        Toast.show(message, "success");
        closeModal("personModal");
        setTimeout(() => refreshPeopleList(), 1000);
      } else {
        Toast.show(data.message || "Operation failed", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    });
});

document
  .getElementById("familyMemberForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append(
      "host_person_id",
      document.getElementById("familyHostPersonId").value
    );

    fetch("/api/add-family-member", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Toast.show("Family member added successfully!", "success");
          closeModal("familyMemberModal");
          setTimeout(() => refreshPeopleList(), 1000);
        } else {
          Toast.show(data.message || "Failed to add family member", "error");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Toast.show("Network error occurred", "error");
      });
  });

document
  .getElementById("bulkImportForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("/api/bulk-import-people", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Toast.show(
            `Successfully imported ${data.imported_count} people!`,
            "success"
          );
          closeModal("bulkImportModal");
          setTimeout(() => refreshPeopleList(), 1000);
        } else {
          Toast.show(data.message || "Import failed", "error");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Toast.show("Network error occurred", "error");
      });
  });

// Toggle Functions
function togglePersonFamilyFields() {
  const isFamilyMember = document.getElementById(
    "personIsFamilyMember"
  ).checked;
  const familyFields = document.getElementById("personFamilyFields");
  familyFields.style.display = isFamilyMember ? "block" : "none";

  if (!isFamilyMember) {
    document.getElementById("personHostId").value = "";
    document.getElementById("personHostSearch").value = "";
  }
}

// Search for host person
function searchPersonHost() {
  const query = document.getElementById("personHostSearch").value;
  if (query.length < 2) {
    document.getElementById("personHostResults").classList.remove("show");
    return;
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetch("/api/search-person", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayHostSearchResults(data.people);
        }
      })
      .catch((error) => console.error("Search error:", error));
  }, 300);
}

function displayHostSearchResults(people) {
  const container = document.getElementById("personHostResults");

  if (people.length === 0) {
    container.innerHTML = '<div class="search-item">No results found</div>';
    container.classList.add("show");
    return;
  }

  let html = "";
  people.forEach((person) => {
    html += `
      <div class="search-item" onclick="selectHostPerson(${person.id}, '${person.name}')">
        <h5>${person.name}</h5>
        <p><strong>CNIC:</strong> ${person.cnic}</p>
        <p><strong>Category:</strong> ${person.category_name}</p>
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

// Utility Functions
function refreshPeopleList() {
  location.reload();
}

function exportPeopleList() {
  window.open("/api/export-data?type=people", "_blank");
}

function showModal(modalId) {
  document.getElementById(modalId).style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  document.body.style.overflow = "auto";
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

function showMessage(message, type = "success") {
  // Legacy function - now uses Toast system
  Toast.show(message, type);
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Add search input event listeners
  const quickSearchInput = document.getElementById("quickSearch");
  if (quickSearchInput) {
    quickSearchInput.addEventListener("input", quickSearchPeople);
    quickSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        quickSearchPeople();
      }
    });
  }

  const personHostSearchInput = document.getElementById("personHostSearch");
  if (personHostSearchInput) {
    personHostSearchInput.addEventListener("input", searchPersonHost);
    personHostSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchPersonHost();
      }
    });
  }

  // Close modals when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      const modalId = event.target.id;
      closeModal(modalId);
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".form-group")) {
      document.querySelectorAll(".search-dropdown").forEach((dropdown) => {
        dropdown.classList.remove("show");
      });
    }
  });
});
