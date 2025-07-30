// Entry Management JavaScript - Main Controller

// Core entry management functionality
class EntryManagementController {
  constructor() {
    this.searchTimeouts = {};
    this.init();
  }

  init() {
    this.bindEvents();
    this.refreshOccupancy();
  }

  bindEvents() {
    // Add event listeners for search inputs
    const entrySearchInput = document.getElementById("entryPersonSearch");
    const exitSearchInput = document.getElementById("exitPersonSearch");

    if (entrySearchInput) {
      entrySearchInput.addEventListener("input", () =>
        this.searchPersonForEntry()
      );
      entrySearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.searchPersonForEntry();
        }
      });
    }

    if (exitSearchInput) {
      exitSearchInput.addEventListener("input", () =>
        this.searchPersonForExit()
      );
      exitSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.searchPersonForExit();
        }
      });
    }

    // Facility management
    document.addEventListener("change", (e) => {
      if (e.target.name === "facility") {
        const quantityInput =
          e.target.parentElement.parentElement.querySelector(
            ".facility-quantity"
          );
        quantityInput.disabled = !e.target.checked;
        if (e.target.checked) {
          quantityInput.value = 1;
        }
        this.updateTotalAmount();
      }
    });

    // Close modals when clicking outside
    window.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-overlay")) {
        const modalId = event.target.id;
        this.closeModal(modalId);
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".form-group")) {
        document.querySelectorAll(".search-dropdown").forEach((dropdown) => {
          dropdown.classList.remove("show");
        });
      }
    });

    // Add event listeners for occupancy modal
    const occupancyModal = document.getElementById("occupancyModal");
    if (occupancyModal) {
      occupancyModal.addEventListener("click", (e) => {
        if (e.target === occupancyModal) {
          this.closeOccupancyModal();
        }
      });
    }

    // ESC key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const occupancyModal = document.getElementById("occupancyModal");
        if (occupancyModal && !occupancyModal.classList.contains("hidden")) {
          this.closeOccupancyModal();
        }
      }
    });
  }

  // Utility Functions
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      // Clear inline display style to avoid conflicts
      modal.style.removeProperty("display");
    }
    document.body.style.overflow = "auto";
  }

  closeAllModals() {
    const modals = ["entryModal", "exitModal", "registerModal", "searchModal"];
    modals.forEach((modalId) => {
      this.closeModal(modalId);
    });
  }

  // Modal Opening Functions
  openEntryModal() {
    this.closeAllModals();
    if (window.EnhancedModal) {
      window.EnhancedModal.show("entryModal", { size: "lg" });
    } else {
      this.openModal("entryModal");
    }
    if (typeof Toast !== "undefined") {
      Toast.info("Ready to process entry");
    }
  }

  openExitModal() {
    this.closeAllModals();
    if (window.EnhancedModal) {
      window.EnhancedModal.show("exitModal", { size: "md" });
    } else {
      this.openModal("exitModal");
    }
    if (typeof Toast !== "undefined") {
      Toast.info("Ready to process exit");
    }
  }

  openRegisterModal() {
    this.closeAllModals();
    if (window.EnhancedModal) {
      window.EnhancedModal.show("registerModal", { size: "md" });
    } else {
      this.openModal("registerModal");
    }
    if (typeof Toast !== "undefined") {
      Toast.info("Ready to register new person");
    }
    this.loadCategories();
  }

  openSearchModal() {
    this.closeAllModals();
    if (window.EnhancedModal) {
      window.EnhancedModal.show("searchModal", { size: "md" });
    } else {
      this.openModal("searchModal");
    }
    if (typeof Toast !== "undefined") {
      Toast.info("Search people in the system");
    }
  }

  // Individual modal close functions (for EJS compatibility)
  closeEntryModal() {
    if (window.EnhancedModal) {
      window.EnhancedModal.hide("entryModal");
    } else {
      this.closeModal("entryModal");
    }
  }

  closeExitModal() {
    if (window.EnhancedModal) {
      window.EnhancedModal.hide("exitModal");
    } else {
      this.closeModal("exitModal");
    }
  }

  closeRegisterModal() {
    if (window.EnhancedModal) {
      window.EnhancedModal.hide("registerModal");
    } else {
      this.closeModal("registerModal");
    }
  }

  closeSearchModal() {
    if (window.EnhancedModal) {
      window.EnhancedModal.hide("searchModal");
    } else {
      this.closeModal("searchModal");
    }
  }

  // Search Functions
  searchPersonForEntry() {
    const query = document.getElementById("entryPersonSearch")?.value;
    if (!query || query.length < 2) {
      const resultsEl = document.getElementById("entryPersonResults");
      if (resultsEl) resultsEl.classList.remove("show");
      return;
    }

    clearTimeout(this.searchTimeouts.entryPerson);
    this.searchTimeouts.entryPerson = setTimeout(() => {
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
            this.displayPersonSearchResults(
              data.people,
              "entryPersonResults",
              this.selectPersonForEntry.bind(this)
            );
          }
        })
        .catch((error) => console.error("Search error:", error));
    }, 300);
  }

  searchPersonForExit() {
    const query = document.getElementById("exitPersonSearch")?.value;
    if (!query || query.length < 2) {
      const resultsEl = document.getElementById("exitPersonResults");
      if (resultsEl) resultsEl.classList.remove("show");
      return;
    }

    clearTimeout(this.searchTimeouts.exitPerson);
    this.searchTimeouts.exitPerson = setTimeout(() => {
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
            this.displayPersonSearchResults(
              data.people,
              "exitPersonResults",
              this.selectPersonForExit.bind(this)
            );
          }
        })
        .catch((error) => console.error("Search error:", error));
    }, 300);
  }

  displayPersonSearchResults(people, containerId, selectCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

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

  // Person Selection Functions (placeholders for backward compatibility)
  selectPersonForEntry(id, name, cnic, category, balance) {
    // This will be handled by EntryModalManager
  }

  selectPersonForExit(id, name, cnic, category, entryTime, amount) {
    // This will be handled by ExitModalManager
  }

  // Current Occupancy Functions
  viewCurrentOccupancy() {
    this.openOccupancyModal();

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
          this.displayCurrentOccupancyInModal(data.occupancy, data.totalCount);
        } else {
          if (container) {
            container.innerHTML = `
              <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
                <p class="text-red-500 text-lg">${
                  data.message || "Failed to get occupancy data"
                }</p>
                <button onclick="entryController.viewCurrentOccupancy()" class="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                  Try Again
                </button>
              </div>
            `;
          }
          this.showMessage(
            data.message || "Failed to get occupancy data",
            "error"
          );
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
              <button onclick="entryController.viewCurrentOccupancy()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                Try Again
              </button>
            </div>
          `;
        }
        this.showMessage("Network error occurred", "error");
      });
  }

  displayCurrentOccupancyInModal(occupancy, totalCount) {
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
                onclick="entryController.quickExitFromModal('${
                  person.name
                }', '${person.cnic}')"
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
  openOccupancyModal() {
    const modal = document.getElementById("occupancyModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document.body.style.overflow = "hidden";
    }
  }

  closeOccupancyModal() {
    const modal = document.getElementById("occupancyModal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = "";
    }
  }

  refreshOccupancyModal() {
    this.viewCurrentOccupancy();
  }

  quickExitFromModal(name, cnic) {
    this.closeOccupancyModal();
    this.openExitModal();
    const searchInput = document.getElementById("exitPersonSearch");
    if (searchInput) {
      searchInput.value = name;
      this.searchPersonForExit();
    }
  }

  refreshOccupancy() {
    fetch("/api/current-occupancy")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const countElement = document.getElementById("currentCount");
          if (countElement) {
            countElement.textContent = data.totalCount;
          }
        }
      })
      .catch((error) => console.error("Error refreshing occupancy:", error));
  }

  // Quick Actions
  quickEntry(personId) {
    this.openEntryModal();
    // Pre-fill functionality will be handled by EntryModalManager
  }

  addDeposit(personId, name, currentBalance) {
    const depositPersonId = document.getElementById("depositPersonId");
    const depositPersonName = document.getElementById("depositPersonName");
    const depositCurrentBalance = document.getElementById(
      "depositCurrentBalance"
    );

    if (depositPersonId) depositPersonId.value = personId;
    if (depositPersonName) depositPersonName.textContent = name;
    if (depositCurrentBalance)
      depositCurrentBalance.textContent = currentBalance.toFixed(2);

    this.openModal("feeDepositModal");
  }

  // Load categories for register modal
  async loadCategories() {
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

  // Facility Management
  updateTotalAmount() {
    const facilityCheckboxes = document.querySelectorAll(
      'input[name="facility"]:checked'
    );
    let total = 0;

    facilityCheckboxes.forEach((checkbox) => {
      const price = parseFloat(checkbox.dataset.price);
      const quantityInput =
        checkbox.parentElement.parentElement.querySelector(
          ".facility-quantity"
        );
      const quantity = parseInt(quantityInput.value) || 1;
      total += price * quantity;
    });

    const totalElement = document.getElementById("totalAmount");
    if (totalElement) {
      totalElement.textContent = total.toFixed(2);
    }

    // Update payment note
    const isGuest = document.getElementById("isGuest")?.checked;
    const categoryElement = document.getElementById("entryPersonCategory");
    const category = categoryElement ? categoryElement.textContent : "";

    let paymentNote = "";
    if (category === "Military Serving") {
      paymentNote = "Payment waived for military personnel";
    } else if (isGuest) {
      paymentNote = "Amount will be charged to host";
    } else {
      paymentNote = "Amount to be paid by person";
    }

    const noteElement = document.getElementById("paymentNote");
    if (noteElement) {
      noteElement.textContent = paymentNote;
    }
  }

  // Utility functions
  showMessage(message, type = "success") {
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
    }
  }

  hideSearchResults() {
    const searchResults = document.getElementById("searchResults");
    if (searchResults) {
      searchResults.style.display = "none";
    }
  }

  viewPersonDetails(personId) {
    this.showMessage(
      `Person details for ID: ${personId} (functionality to be implemented)`,
      "info"
    );
  }
}

// Global variables and functions for backward compatibility
let entryController;

// Export to global scope immediately
window.entryController = null;

// Global functions
window.openEntryModal = function () {
  if (entryController) entryController.openEntryModal();
};

window.closeEntryModal = function () {
  if (entryController) entryController.closeEntryModal();
};

window.openExitModal = function () {
  if (entryController) entryController.openExitModal();
};

window.closeExitModal = function () {
  if (entryController) entryController.closeExitModal();
};

window.openRegisterModal = function () {
  if (entryController) entryController.openRegisterModal();
};

window.closeRegisterModal = function () {
  if (entryController) entryController.closeRegisterModal();
};

window.openSearchModal = function () {
  if (entryController) entryController.openSearchModal();
};

window.closeSearchModal = function () {
  if (entryController) entryController.closeSearchModal();
};

window.viewCurrentOccupancy = function () {
  if (entryController) entryController.viewCurrentOccupancy();
};

window.closeOccupancyModal = function () {
  if (entryController) entryController.closeOccupancyModal();
};

window.refreshOccupancyModal = function () {
  if (entryController) entryController.refreshOccupancyModal();
};

window.refreshOccupancy = function () {
  if (entryController) entryController.refreshOccupancy();
};

window.quickEntry = function (personId) {
  if (entryController) entryController.quickEntry(personId);
};

window.addDeposit = function (personId, name, currentBalance) {
  if (entryController)
    entryController.addDeposit(personId, name, currentBalance);
};

window.updateTotalAmount = function () {
  if (entryController) entryController.updateTotalAmount();
};

window.hideSearchResults = function () {
  if (entryController) entryController.hideSearchResults();
};

window.viewPersonDetails = function (personId) {
  if (entryController) entryController.viewPersonDetails(personId);
};

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  entryController = new EntryManagementController();
  window.entryController = entryController; // Export to global scope

  // Handle fee deposit form if it exists
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
            entryController.showMessage("Fee deposit added successfully!");
            entryController.closeModal("feeDepositModal");
          } else {
            entryController.showMessage(
              data.message || "Failed to add deposit",
              "error"
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          entryController.showMessage("Network error occurred", "error");
        });
    });
  }
});

// QR Code Scanner functionality
let qrStream = null;
let qrVideo = null;
let qrCanvas = null;
let qrContext = null;
let qrScanInterval = null;

function openQRScanner() {
  document.getElementById("qrScannerModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Initialize video elements
  qrVideo = document.getElementById("qr-video");
  qrCanvas = document.getElementById("qr-canvas");
  qrContext = qrCanvas.getContext("2d");

  // Reset UI state
  document.getElementById("qrScanResult").classList.add("hidden");
  document.getElementById("qrScanError").classList.add("hidden");
  document.getElementById("startScanBtn").style.display = "inline-block";
  document.getElementById("stopScanBtn").style.display = "none";
}

function closeQRScanner() {
  document.getElementById("qrScannerModal").classList.add("hidden");
  document.body.style.overflow = "auto";
  stopQRScan();
}

function startQRScan() {
  // Request camera access
  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 400 },
        height: { ideal: 400 },
      },
    })
    .then((stream) => {
      qrStream = stream;
      qrVideo.srcObject = stream;
      qrVideo.play();

      // Update UI
      document.getElementById("startScanBtn").style.display = "none";
      document.getElementById("stopScanBtn").style.display = "inline-block";

      // Start scanning
      qrScanInterval = setInterval(scanQRCode, 300);
    })
    .catch((err) => {
      console.error("Error accessing camera:", err);
      showQRError("Unable to access camera. Please check permissions.");
    });
}

function stopQRScan() {
  if (qrStream) {
    qrStream.getTracks().forEach((track) => track.stop());
    qrStream = null;
  }

  if (qrScanInterval) {
    clearInterval(qrScanInterval);
    qrScanInterval = null;
  }

  if (qrVideo) {
    qrVideo.srcObject = null;
  }

  // Update UI
  document.getElementById("startScanBtn").style.display = "inline-block";
  document.getElementById("stopScanBtn").style.display = "none";
}

function scanQRCode() {
  if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
    qrCanvas.width = qrVideo.videoWidth;
    qrCanvas.height = qrVideo.videoHeight;
    qrContext.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);

    const imageData = qrContext.getImageData(
      0,
      0,
      qrCanvas.width,
      qrCanvas.height
    );
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // QR code detected
      stopQRScan();
      processQRCode(code.data);
    }
  }
}

function processQRCode(qrData) {
  // Clear previous results
  document.getElementById("qrScanResult").classList.add("hidden");
  document.getElementById("qrScanError").classList.add("hidden");

  // Send QR data to server for processing
  fetch("/cards/api/scan-qr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ qr_data: qrData }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show success and person info
        showQRSuccess(
          `Person found: ${data.person.name} (${data.person.cnic})`
        );

        // Auto-process entry for this person
        setTimeout(() => {
          closeQRScanner();
          autoProcessEntryFromQR(data.person);
        }, 2000);
      } else {
        showQRError(data.message || "Invalid QR code or person not found");
      }
    })
    .catch((error) => {
      console.error("Error processing QR code:", error);
      showQRError("Error processing QR code. Please try again.");
    });
}

function autoProcessEntryFromQR(person) {
  // Open entry modal and pre-fill with person data
  openEntryModal();

  // Wait for modal to open then populate
  setTimeout(() => {
    const personSearchInput = document.getElementById("entryPersonSearch");
    if (personSearchInput) {
      personSearchInput.value = person.cnic;
      // Trigger search to populate person data
      entryController.searchPersonForEntry();
    }
  }, 500);
}

function showQRSuccess(message) {
  document.getElementById("qrResultText").textContent = message;
  document.getElementById("qrScanResult").classList.remove("hidden");
  document.getElementById("qrScanError").classList.add("hidden");
}

function showQRError(message) {
  document.getElementById("qrErrorText").textContent = message;
  document.getElementById("qrScanError").classList.remove("hidden");
  document.getElementById("qrScanResult").classList.add("hidden");
}

// Close QR scanner on escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const modal = document.getElementById("qrScannerModal");
    if (!modal.classList.contains("hidden")) {
      closeQRScanner();
    }
  }
});

// Click outside modal to close
document
  .getElementById("qrScannerModal")
  ?.addEventListener("click", function (e) {
    if (e.target.id === "qrScannerModal") {
      closeQRScanner();
    }
  });
