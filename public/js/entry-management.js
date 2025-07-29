// Entry Management JavaScript

let searchTimeouts = {};

// Utility Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.style.display = "flex"; // Explicitly set display style
    document.body.style.overflow = "hidden";
  }
}

// Modal Opening Functions
function openEntryModal() {
  closeAllModals();
  if (window.EnhancedModal) {
    window.EnhancedModal.show("entryModal", { size: "lg" });
  } else {
    openModal("entryModal");
  }
  if (typeof Toast !== "undefined") {
    Toast.info("Ready to process entry");
  }
}

// Individual modal close functions (for EJS compatibility)
function closeEntryModal() {
  if (window.EnhancedModal) {
    window.EnhancedModal.hide("entryModal");
  } else {
    closeModal("entryModal");
  }
}

function closeExitModal() {
  if (window.EnhancedModal) {
    window.EnhancedModal.hide("exitModal");
  } else {
    closeModal("exitModal");
  }
}

function closeRegisterModal() {
  if (window.EnhancedModal) {
    window.EnhancedModal.hide("registerModal");
  } else {
    closeModal("registerModal");
  }
}

function closeSearchModal() {
  if (window.EnhancedModal) {
    window.EnhancedModal.hide("searchModal");
  } else {
    closeModal("searchModal");
  }
}

// Close all modals function
function closeAllModals() {
  const modals = ["entryModal", "exitModal", "registerModal", "searchModal"];
  modals.forEach((modalId) => {
    if (typeof hideModal === "function") {
      hideModal(modalId);
    } else {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        modal.style.display = "none";
      }
    }
  });
  document.body.style.overflow = "auto";
}

function openExitModal() {
  closeAllModals();
  if (window.EnhancedModal) {
    window.EnhancedModal.show("exitModal", { size: "md" });
  } else {
    openModal("exitModal");
  }
  if (typeof Toast !== "undefined") {
    Toast.info("Ready to process exit");
  }
}

function openRegisterModal() {
  closeAllModals();
  if (window.EnhancedModal) {
    window.EnhancedModal.show("registerModal", { size: "md" });
  } else {
    openModal("registerModal");
  }
  if (typeof Toast !== "undefined") {
    Toast.info("Ready to register new person");
  }
  loadCategories();
}
function openSearchModal() {
  closeAllModals();
  if (window.EnhancedModal) {
    window.EnhancedModal.show("searchModal", { size: "md" });
  } else {
    openModal("searchModal");
  }
  if (typeof Toast !== "undefined") {
    Toast.info("Search people in the system");
  }
}
// Search Functions
function searchPersonForEntry() {
  const query = document.getElementById("entryPersonSearch").value;
  if (query.length < 2) {
    document.getElementById("entryPersonResults").classList.remove("show");
    return;
  }

  clearTimeout(searchTimeouts.entryPerson);
  searchTimeouts.entryPerson = setTimeout(() => {
    fetch("/api/search-person", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayPersonSearchResults(
            data.people,
            "entryPersonResults",
            selectPersonForEntry
          );
        }
      })
      .catch((error) => console.error("Search error:", error));
  }, 300);
}

function searchPersonForExit() {
  const query = document.getElementById("exitPersonSearch").value;
  if (query.length < 2) {
    document.getElementById("exitPersonResults").classList.remove("show");
    return;
  }

  clearTimeout(searchTimeouts.exitPerson);
  searchTimeouts.exitPerson = setTimeout(() => {
    fetch("/api/search-person-inside", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayPersonSearchResults(
            data.people,
            "exitPersonResults",
            selectPersonForExit
          );
        }
      })
      .catch((error) => console.error("Search error:", error));
  }, 300);
}

function searchHostPerson() {
  const query = document.getElementById("hostPersonSearch").value;
  if (query.length < 2) {
    document.getElementById("hostPersonResults").classList.remove("show");
    return;
  }

  clearTimeout(searchTimeouts.hostPerson);
  searchTimeouts.hostPerson = setTimeout(() => {
    fetch("/api/search-person", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayPersonSearchResults(
            data.people,
            "hostPersonResults",
            selectHostPerson
          );
        }
      })
      .catch((error) => console.error("Search error:", error));
  }, 300);
}

function searchMainPerson() {
  const query = document.getElementById("hostPersonMainSearch").value;
  if (query.length < 2) {
    document.getElementById("hostPersonMainResults").classList.remove("show");
    return;
  }

  clearTimeout(searchTimeouts.mainPerson);
  searchTimeouts.mainPerson = setTimeout(() => {
    fetch("/api/search-person", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayPersonSearchResults(
            data.people,
            "hostPersonMainResults",
            selectMainPerson
          );
        }
      })
      .catch((error) => console.error("Search error:", error));
  }, 300);
}

function displayPersonSearchResults(people, containerId, selectCallback) {
  const container = document.getElementById(containerId);

  if (people.length === 0) {
    container.innerHTML = '<div class="search-item">No results found</div>';
    container.classList.add("show");
    return;
  }

  let html = '<div class="grid grid-cols-1 gap-4">';
  people.forEach((person) => {
    html += `
        <div class="rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-200 shadow-sm hover:shadow-lg transition-all p-5 flex items-center gap-4">
          <div class="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            <i class="fas fa-user"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="font-bold text-lg text-gray-900 truncate">${
                person.name
              }</span>
              ${
                person.is_family_member
                  ? `<span class="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">Family</span>`
                  : ""
              }
              ${
                person.card_number
                  ? `<span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full"><i class='fas fa-credit-card mr-1'></i>Card</span>`
                  : ""
              }
            </div>
            <div class="flex flex-wrap gap-4 text-sm text-gray-700 mb-1">
              <span><i class="fas fa-id-card mr-1 text-blue-600"></i><b>CNIC:</b> ${
                person.cnic
              }</span>
              <span><i class="fas fa-phone mr-1 text-green-600"></i><b>Phone:</b> ${
                person.phone || "N/A"
              }</span>
              <span><i class="fas fa-tag mr-1 text-purple-600"></i><b>Category:</b> ${
                person.category_name || "N/A"
              }</span>
            </div>
            <div class="flex flex-wrap gap-4 text-xs text-gray-500">
              ${
                person.host_name
                  ? `<span><i class='fas fa-users mr-1'></i>Host: ${person.host_name}</span>`
                  : ""
              }
              <span><i class="fas fa-wallet mr-1 text-blue-500"></i>Balance: $${
                person.available_balance || "0.00"
              }</span>
            </div>
          </div>
          <div class="flex flex-col gap-2 ml-4">
            <button onclick="quickEntry(${
              person.id
            })" class="btn btn-sm btn-primary rounded-lg px-3 py-2 flex items-center gap-1">
              <i class="fas fa-sign-in-alt"></i> Entry
            </button>
            <button onclick="viewPersonDetails(${
              person.id
            })" class="btn btn-sm btn-secondary rounded-lg px-3 py-2 flex items-center gap-1">
              <i class="fas fa-eye"></i> Details
            </button>
          </div>
        </div>
      `;
  });
  html += "</div>";
  container.innerHTML = html;
  container.classList.add("show");
}

// Person Selection Functions
function selectPersonForEntry(id, name, cnic, category, balance) {
  document.getElementById("entryPersonId").value = id;
  document.getElementById("entryPersonName").textContent = name;
  document.getElementById("entryPersonCnic").textContent = cnic;
  document.getElementById("entryPersonCategory").textContent = category;
  document.getElementById("entryPersonBalance").textContent = balance;

  document.getElementById("entryPersonSearch").value = name;
  document.getElementById("entryPersonResults").classList.remove("show");
  document.getElementById("entryPersonDetails").style.display = "block";
  document.getElementById("processEntryBtn").disabled = false;

  updateTotalAmount();
}

function selectPersonForExit(id, name, cnic, category, entryTime, amount) {
  document.getElementById("exitPersonId").value = id;
  document.getElementById("exitPersonName").textContent = name;
  document.getElementById("exitPersonCnic").textContent = cnic;
  document.getElementById("exitEntryTime").textContent = new Date(
    entryTime
  ).toLocaleString();
  document.getElementById("exitAmountPaid").textContent = amount || "0.00";

  // Calculate duration
  const duration = Math.floor((new Date() - new Date(entryTime)) / (1000 * 60));
  document.getElementById("exitDuration").textContent = `${Math.floor(
    duration / 60
  )}h ${duration % 60}m`;

  document.getElementById("exitPersonSearch").value = name;
  document.getElementById("exitPersonResults").classList.remove("show");
  document.getElementById("exitPersonDetails").style.display = "block";
  document.getElementById("processExitBtn").disabled = false;
}

function selectHostPerson(id, name, cnic, category, balance) {
  document.getElementById("hostPersonId").value = id;
  document.getElementById("hostPersonSearch").value = name;
  document.getElementById("hostPersonResults").classList.remove("show");
}

function selectMainPerson(id, name, cnic, category, balance) {
  document.getElementById("hostPersonMainId").value = id;
  document.getElementById("hostPersonMainSearch").value = name;
  document.getElementById("hostPersonMainResults").classList.remove("show");
}

// Toggle Functions
function toggleGuestFields() {
  const isGuest = document.getElementById("isGuest").checked;
  const guestFields = document.getElementById("guestFields");
  guestFields.style.display = isGuest ? "block" : "none";

  if (!isGuest) {
    document.getElementById("hostPersonId").value = "";
    document.getElementById("hostPersonSearch").value = "";
    document.getElementById("guestCount").value = "1";
  }

  updateTotalAmount();
}

function toggleCricketFields() {
  const isCricketTeam = document.getElementById("isCricketTeam").checked;
  const cricketFields = document.getElementById("cricketFields");
  cricketFields.style.display = isCricketTeam ? "block" : "none";

  if (!isCricketTeam) {
    document.getElementById("teamName").value = "";
    document.getElementById("teamMembersCount").value = "";
  }
}

function toggleFamilyFields() {
  const isFamilyMember = document.getElementById("isFamilyMember").checked;
  const familyFields = document.getElementById("familyFields");
  familyFields.style.display = isFamilyMember ? "block" : "none";

  if (!isFamilyMember) {
    document.getElementById("hostPersonMainId").value = "";
    document.getElementById("hostPersonMainSearch").value = "";
  }
}

// Facility Management
function updateTotalAmount() {
  const facilityCheckboxes = document.querySelectorAll(
    'input[name="facility"]:checked'
  );
  let total = 0;

  facilityCheckboxes.forEach((checkbox) => {
    const price = parseFloat(checkbox.dataset.price);
    const quantityInput =
      checkbox.parentElement.parentElement.querySelector(".facility-quantity");
    const quantity = parseInt(quantityInput.value) || 1;
    total += price * quantity;
  });

  document.getElementById("totalAmount").textContent = total.toFixed(2);

  // Update payment note
  const isGuest = document.getElementById("isGuest").checked;
  const category = document.getElementById("entryPersonCategory").textContent;

  let paymentNote = "";
  if (category === "Military Serving") {
    paymentNote = "Payment waived for military personnel";
  } else if (isGuest) {
    paymentNote = "Amount will be charged to host";
  } else {
    paymentNote = "Amount to be paid by person";
  }

  document.getElementById("paymentNote").textContent = paymentNote;
}

// Enable/disable quantity inputs based on facility selection
document.addEventListener("change", function (e) {
  if (e.target.name === "facility") {
    const quantityInput =
      e.target.parentElement.parentElement.querySelector(".facility-quantity");
    quantityInput.disabled = !e.target.checked;
    if (e.target.checked) {
      quantityInput.value = 1;
    }
    updateTotalAmount();
  }
});

// Form Submissions
// Entry form is handled by EntryModalManager in the main template

// Exit form is handled by ExitModalManager in the main template

// Register form is handled by handleRegisterSubmit in the main template

const feeDepositForm = document.getElementById("feeDepositForm");
if (feeDepositForm) {
  feeDepositForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append(
      "person_id",
      document.getElementById("depositPersonId").value
    );

    fetch("/api/add-fee-deposit", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showMessage("Fee deposit added successfully!");
          closeModal("feeDepositModal");
        } else {
          showMessage(data.message || "Failed to add deposit", "error");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showMessage("Network error occurred", "error");
      });
  });
}

// Advanced Search
function performAdvancedSearch() {
  const query = document.getElementById("searchQuery").value;
  const categoryId = document.getElementById("searchCategory").value;
  const isFamilyMember = document.getElementById("searchFamilyMembers").checked
    ? "1"
    : "0";
  const hasCard = document.getElementById("searchWithCards").checked
    ? "1"
    : "0";

  fetch("/api/search-people-advanced", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      category_id: categoryId,
      is_family_member: isFamilyMember,
      has_card: hasCard,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayAdvancedSearchResults(data.people);
      } else {
        showMessage(data.message || "Search failed", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showMessage("Network error occurred", "error");
    });
}

function displayAdvancedSearchResults(people) {
  const container = document.getElementById("advancedSearchResults");

  if (people.length === 0) {
    container.innerHTML = "<p>No people found matching your criteria.</p>";
    return;
  }

  let html = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>CNIC</th>
          <th>Category</th>
          <th>Phone</th>
          <th>Card Number</th>
          <th>Balance</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  people.forEach((person) => {
    html += `
      <tr>
        <td>${person.name}</td>
        <td>${person.cnic}</td>
        <td>${person.category_name || "N/A"}</td>
        <td>${person.phone || "N/A"}</td>
        <td>${person.card_number || "No Card"}</td>
        <td>$${person.available_balance || "0.00"}</td>
        <td>
          <button class="btn btn-primary action-btn" onclick="quickEntry(${
            person.id
          })">Entry</button>
          <button class="btn btn-info action-btn" onclick="addDeposit(${
            person.id
          }, '${person.name}', ${
      person.available_balance || 0
    })">Deposit</button>
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

// Current Occupancy
function viewCurrentOccupancy() {
  // Open modal first
  openOccupancyModal();

  // Show loading state in modal
  const container = document.getElementById("occupancyModalContent");
  if (container) {
    container.innerHTML = `
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-gray-500">Loading current occupancy...</p>
      </div>
    `;
  }

  fetch("/api/current-occupancy")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        displayCurrentOccupancyInModal(data.occupancy, data.totalCount);
      } else {
        if (container) {
          container.innerHTML = `
            <div class="text-center py-8">
              <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
              <p class="text-red-500 text-lg">${
                data.message || "Failed to get occupancy data"
              }</p>
              <button onclick="viewCurrentOccupancy()" class="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                Try Again
              </button>
            </div>
          `;
        }
        showMessage(data.message || "Failed to get occupancy data", "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      if (container) {
        container.innerHTML = `
          <div class="text-center py-8">
            <i class="fas fa-wifi text-red-400 text-4xl mb-4"></i>
            <p class="text-red-500 text-lg">Network error occurred</p>
            <p class="text-gray-500 text-sm mb-4">Please check your connection and try again</p>
            <button onclick="viewCurrentOccupancy()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
              Try Again
            </button>
          </div>
        `;
      }
      showMessage("Network error occurred", "error");
    });
}

function displayCurrentOccupancyInModal(occupancy, totalCount) {
  const container = document.getElementById("occupancyModalContent");

  if (!container) {
    console.error("occupancyModalContent element not found");
    return;
  }

  if (occupancy.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-users text-gray-400 text-4xl mb-4"></i>
        <p class="text-gray-500 text-lg">No one is currently inside the facility.</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
      <h4 class="text-lg font-bold text-green-900 flex items-center">
        <i class="fas fa-users mr-2"></i>
        Total People Inside: <span class="ml-2 px-3 py-1 bg-green-500 text-white rounded-full">${totalCount}</span>
      </h4>
    </div>
    <div class="space-y-3">
  `;

  occupancy.forEach((person) => {
    const details = [];
    if (person.has_stroller) details.push("🚼 Stroller");
    if (person.is_guest) details.push(`👥 Guest (${person.guest_count})`);
    if (person.is_cricket_team)
      details.push(
        `🏏 Team: ${person.team_name} (${person.team_members_count})`
      );
    if (person.vehicle_number)
      details.push(`🚗 Vehicle: ${person.vehicle_number}`);

    const entryTime = new Date(person.entry_time);
    const now = new Date();
    const hoursDiff = Math.floor((now - entryTime) / (1000 * 60 * 60));
    const minutesDiff = Math.floor(
      ((now - entryTime) % (1000 * 60 * 60)) / (1000 * 60)
    );
    const durationText =
      hoursDiff > 0 ? `${hoursDiff}h ${minutesDiff}m` : `${minutesDiff}m`;

    html += `
      <div class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-user text-white text-sm"></i>
              </div>
              <div>
                <h5 class="font-semibold text-gray-900">${person.name}</h5>
                <p class="text-sm text-gray-600 font-mono">${person.cnic}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div class="flex items-center space-x-2">
                <i class="fas fa-tag text-blue-500"></i>
                <span><strong>Category:</strong> ${person.category}</span>
              </div>
              <div class="flex items-center space-x-2">
                <i class="fas fa-clock text-purple-500"></i>
                <span><strong>Entry:</strong> ${entryTime.toLocaleTimeString()}</span>
              </div>
              <div class="flex items-center space-x-2">
                <i class="fas fa-hourglass-half text-orange-500"></i>
                <span><strong>Duration:</strong> ${durationText}</span>
              </div>
            </div>
            
            ${
              details.length > 0
                ? `
              <div class="mt-3 p-2 bg-gray-50 rounded-lg">
                <div class="text-sm text-gray-700">
                  <strong>Details:</strong> ${details.join(" • ")}
                </div>
              </div>
            `
                : ""
            }
          </div>
          
          <div class="ml-4">
            <button 
              class="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              onclick="quickExitFromModal('${person.name}', '${person.cnic}')"
              title="Process Exit"
            >
              <i class="fas fa-sign-out-alt"></i>
              <span class="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

// Modal control functions
function openOccupancyModal() {
  const modal = document.getElementById("occupancyModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }
}

function closeOccupancyModal() {
  const modal = document.getElementById("occupancyModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
  }
}

function refreshOccupancyModal() {
  viewCurrentOccupancy();
}

function quickExitFromModal(name, cnic) {
  closeOccupancyModal();
  openExitModal();
  document.getElementById("exitPersonSearch").value = name;
  searchPersonForExit();
}

function refreshOccupancy() {
  fetch("/api/current-occupancy")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("currentCount").textContent = data.totalCount;
      }
    })
    .catch((error) => console.error("Error refreshing occupancy:", error));
}

// Quick Actions
function quickEntry(personId) {
  // Pre-fill entry modal with selected person
  openEntryModal();
  // You would need to fetch person details and populate the form
}

function addDeposit(personId, name, currentBalance) {
  document.getElementById("depositPersonId").value = personId;
  document.getElementById("depositPersonName").textContent = name;
  document.getElementById("depositCurrentBalance").textContent =
    currentBalance.toFixed(2);
  openModal("feeDepositModal");
}

// Close modals when clicking outside
window.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal-overlay")) {
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

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  refreshOccupancy();

  // Entry form is handled by EntryModalManager in the main template

  // Exit form is handled by ExitModalManager in the main template

  // Register form is handled by handleRegisterSubmit in the main template

  const feeDepositForm = document.getElementById("feeDepositForm");
  if (feeDepositForm) {
    feeDepositForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      formData.append(
        "person_id",
        document.getElementById("depositPersonId").value
      );

      fetch("/api/add-fee-deposit", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showMessage("Fee deposit added successfully!");
            closeModal("feeDepositModal");
          } else {
            showMessage(data.message || "Failed to add deposit", "error");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showMessage("Network error occurred", "error");
        });
    });
  }

  // Add search input event listeners
  const entrySearchInput = document.getElementById("entryPersonSearch");
  const exitSearchInput = document.getElementById("exitPersonSearch");
  const generalSearchInput = document.getElementById("generalSearch");

  if (entrySearchInput) {
    entrySearchInput.addEventListener("input", searchPersonForEntry);
    entrySearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchPersonForEntry();
      }
    });
  }

  if (exitSearchInput) {
    exitSearchInput.addEventListener("input", searchPersonForExit);
    exitSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchPersonForExit();
      }
    });
  }

  if (generalSearchInput) {
    generalSearchInput.addEventListener("input", function () {
      clearTimeout(searchTimeouts.general);
      searchTimeouts.general = setTimeout(performGeneralSearch, 300);
    });
    generalSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        performGeneralSearch();
      }
    });
  }

  // Add family member checkbox listener
  const familyMemberCheckbox = document.getElementById(
    "registerIsFamilyMember"
  );
  if (familyMemberCheckbox) {
    familyMemberCheckbox.addEventListener("change", toggleFamilyMemberDetails);
  }
});

// Load categories for register modal
async function loadCategories() {
  try {
    const response = await fetch("/api/categories");
    const categories = await response.json();
    const select = document.getElementById("registerCategory");
    if (select) {
      select.innerHTML = '<option value="">Select category</option>';
      categories.forEach((category) => {
        select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
      });
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Family member toggle functionality
function toggleFamilyMemberDetails() {
  const isFamilyMember = document.getElementById(
    "registerIsFamilyMember"
  ).checked;
  const familyDetails = document.getElementById("familyMemberDetails");

  if (familyDetails) {
    familyDetails.style.display = isFamilyMember ? "block" : "none";

    if (isFamilyMember) {
      loadHostPersons();
    } else {
      const hostSelect = document.getElementById("registerHostPerson");
      if (hostSelect) {
        hostSelect.innerHTML = '<option value="">Select host person</option>';
      }
    }
  }
}

// Load host persons for family members
async function loadHostPersons() {
  try {
    const response = await fetch("/api/search-people-advanced", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "",
        is_family_member: "0", // Only get non-family members as potential hosts
      }),
    });

    const data = await response.json();
    const select = document.getElementById("registerHostPerson");

    if (select && data.success) {
      select.innerHTML = '<option value="">Select host person</option>';
      data.people.forEach((person) => {
        select.innerHTML += `<option value="${person.id}">${person.name} (${person.cnic})</option>`;
      });
    }
  } catch (error) {
    console.error("Error loading host persons:", error);
  }
}

// Search functionality
function performGeneralSearch() {
  const query = document.getElementById("generalSearch").value.trim();

  if (query.length < 2) {
    document.getElementById("generalSearchResults").innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-search text-4xl mb-4 opacity-50"></i>
        <p class="text-lg font-medium">Enter at least 2 characters to search</p>
      </div>
    `;
    return;
  }

  // Get search filters
  const searchByCnic = document.getElementById("searchByCnic").checked;
  const searchByName = document.getElementById("searchByName").checked;
  const searchByPhone = document.getElementById("searchByPhone").checked;

  // Show loading
  document.getElementById("generalSearchResults").innerHTML = `
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Searching...</p>
    </div>
  `;

  fetch("/api/search-people-advanced", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query,
      search_by_cnic: searchByCnic,
      search_by_name: searchByName,
      search_by_phone: searchByPhone,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      displaySearchResults(data.people || []);
    })
    .catch((error) => {
      console.error("Search error:", error);
      document.getElementById("generalSearchResults").innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p class="text-lg font-medium">Search failed</p>
        <p class="text-sm">Please try again</p>
      </div>
    `;
    });
}

// Display search results
function displaySearchResults(people) {
  const container = document.getElementById("generalSearchResults");

  if (people.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-search text-4xl mb-4 opacity-50"></i>
        <p class="text-lg font-medium">No results found</p>
        <p class="text-sm">Try different search terms</p>
      </div>
    `;
    return;
  }

  let html = '<div class="space-y-4">';

  people.forEach((person) => {
    html += `
      <div class="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 transition-all">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h4 class="font-bold text-gray-900">${person.name}</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
              <div><i class="fas fa-id-card mr-1 text-blue-600"></i><strong>CNIC:</strong> ${
                person.cnic
              }</div>
              <div><i class="fas fa-phone mr-1 text-green-600"></i><strong>Phone:</strong> ${
                person.phone || "N/A"
              }</div>
              <div><i class="fas fa-tag mr-1 text-purple-600"></i><strong>Category:</strong> ${
                person.category_name || "N/A"
              }</div>
            </div>
            ${
              person.is_family_member
                ? `
              <div class="mt-2 text-sm text-orange-600">
                <i class="fas fa-users mr-1"></i>Family member of: ${
                  person.host_name || "Unknown"
                }
              </div>
            `
                : ""
            }
            ${
              person.card_number
                ? `
              <div class="mt-2 text-sm text-green-600">
                <i class="fas fa-credit-card mr-1"></i>Card: ${person.card_number}
              </div>
            `
                : ""
            }
            <div class="mt-2 text-sm text-blue-600">
              <i class="fas fa-wallet mr-1"></i>Balance: $${
                person.available_balance || "0.00"
              }
            </div>
          </div>
          <div class="flex flex-col space-y-2 ml-4">
            <button onclick="quickEntry(${
              person.id
            })" class="btn btn-sm btn-primary">
              <i class="fas fa-sign-in-alt mr-1"></i>Entry
            </button>
            <button onclick="viewPersonDetails(${
              person.id
            })" class="btn btn-sm btn-secondary">
              <i class="fas fa-eye mr-1"></i>Details
            </button>
          </div>
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

// Quick entry function
function quickEntry(personId) {
  closeModal("searchModal");
  openEntryModal();

  // Pre-fill the entry form with selected person
  fetch(`/api/person/${personId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const person = data.person;
        document.getElementById("entryPersonId").value = person.id;
        document.getElementById("entryPersonName").textContent = person.name;
        document.getElementById("entryPersonCnic").textContent = person.cnic;
        document.getElementById("entryPersonCategory").textContent =
          person.category_name;
        document.getElementById("entryPersonBalance").textContent =
          person.available_balance || "0.00";
        document.getElementById("entryPersonDetails").style.display = "block";
        document.getElementById("processEntryBtn").disabled = false;
        updateTotalAmount();
      }
    })
    .catch((error) => {
      console.error("Error loading person details:", error);
    });
}

// View person details (placeholder)
function viewPersonDetails(personId) {
  showMessage(
    `Person details for ID: ${personId} (functionality to be implemented)`,
    "info"
  );
}

// Enhanced showMessage function using Toast system
function showMessage(message, type = "success") {
  if (typeof Toast !== "undefined") {
    if (type === "error") {
      Toast.error(message);
    } else if (type === "warning") {
      Toast.warning(message);
    } else if (type === "info") {
      Toast.info(message);
    } else {
      Toast.success(message);
    }
  } else {
    // Fallback to console log if Toast is not available
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// Show/hide functions for UI elements
function hideSearchResults() {
  const searchResults = document.getElementById("searchResults");
  if (searchResults) {
    searchResults.style.display = "none";
  }
}

// Close modal utility function
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.style.display = "none";
  }
  document.body.style.overflow = "auto";
}

// Add event listeners for occupancy modal
document.addEventListener("DOMContentLoaded", function () {
  // Close modal when clicking outside
  const occupancyModal = document.getElementById("occupancyModal");
  if (occupancyModal) {
    occupancyModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeOccupancyModal();
      }
    });
  }

  // ESC key to close modal
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("occupancyModal");
      if (modal && !modal.classList.contains("hidden")) {
        closeOccupancyModal();
      }
    }
  });
});
