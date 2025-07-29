// Entry Modal Enhanced Functionality
class EntryModalManager {
  constructor() {
    this.selectedPerson = null;
    this.selectedHost = null;
    this.facilities = [];
    this.totalAmount = 0;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateSubmitButton();
  }

  bindEvents() {
    // Person search functionality
    const entryPersonSearch = document.getElementById("entryPersonSearch");
    if (entryPersonSearch) {
      entryPersonSearch.addEventListener(
        "input",
        this.debounce((e) => {
          this.searchPerson(e.target.value, "entry");
        }, 300)
      );
    }

    // Host search functionality
    const hostPersonSearch = document.getElementById("hostPersonSearch");
    if (hostPersonSearch) {
      hostPersonSearch.addEventListener(
        "input",
        this.debounce((e) => {
          this.searchPerson(e.target.value, "host");
        }, 300)
      );
    }

    // Guest checkbox functionality
    const isGuestCheckbox = document.getElementById("isGuest");
    if (isGuestCheckbox) {
      isGuestCheckbox.addEventListener("change", (e) => {
        this.toggleHostSection(e.target.checked);
      });
    }

    // Facility checkboxes
    document.querySelectorAll(".facility-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        this.toggleFacilityQuantity(e.target);
        this.updateTotalAmount();
      });
    });

    // Facility quantities
    document.querySelectorAll(".facility-quantity").forEach((input) => {
      input.addEventListener("input", () => {
        this.updateTotalAmount();
      });
    });

    // Form validation
    document.getElementById("entryForm").addEventListener("input", () => {
      this.updateSubmitButton();
    });

    // Form submission
    document.getElementById("entryForm").addEventListener("submit", (e) => {
      this.handleFormSubmission(e);
    });
  }

  debounce(func, wait) {
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

  async searchPerson(query, type) {
    if (query.length < 2) {
      this.clearSearchResults(type);
      return;
    }

    this.showSearchSpinner(type, true);
    this.clearSearchError(type);

    try {
      const response = await fetch("/api/search-person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      this.displaySearchResults(data.people || [], type);
    } catch (error) {
      this.showSearchError(type, "Search failed. Please try again.");
      console.error("Search error:", error);
    } finally {
      this.showSearchSpinner(type, false);
    }
  }

  displaySearchResults(people, type) {
    const resultsContainer = document.getElementById(`${type}PersonResults`);
    if (!resultsContainer) return;

    if (people.length === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center py-4 text-gray-500">
          <i class="fas fa-search text-2xl mb-2"></i>
          <p>No people found</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = people
      .map(
        (person) => `
      <div class="person-result p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
           onclick="entryModalManager.selectPerson(${JSON.stringify(
             person
           ).replace(/"/g, "&quot;")}, '${type}')">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold text-gray-900">${person.name}</div>
            <div class="text-sm text-gray-600 font-mono">${person.cnic}</div>
            <div class="text-xs text-purple-600">${
              person.category || "N/A"
            }</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-green-600 font-medium">Balance: Rs. ${
              person.balance || "0.00"
            }</div>
            <div class="text-xs text-gray-500">${
              person.phone || "No phone"
            }</div>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  selectPerson(person, type) {
    if (type === "entry") {
      this.selectedPerson = person;
      this.showSelectedPerson(person);
      document.getElementById("entryPersonId").value = person.id;
      document.getElementById("entryPersonSearch").value = "";
      this.clearSearchResults("entry");
    } else if (type === "host") {
      this.selectedHost = person;
      this.showSelectedHost(person);
      document.getElementById("hostPersonId").value = person.id;
      document.getElementById("hostPersonSearch").value = "";
      this.clearSearchResults("host");
    }

    this.updateSubmitButton();
    this.updateTotalAmount();
  }

  showSelectedPerson(person) {
    const detailsContainer = document.getElementById("entryPersonDetails");
    const nameElement = document.getElementById("entryPersonName");
    const cnicElement = document.getElementById("entryPersonCnic");
    const categoryElement = document.getElementById("entryPersonCategory");
    const balanceElement = document.getElementById("entryPersonBalance");

    if (nameElement) nameElement.textContent = person.name;
    if (cnicElement) cnicElement.textContent = person.cnic;
    if (categoryElement) categoryElement.textContent = person.category || "N/A";
    if (balanceElement)
      balanceElement.textContent = `Balance: Rs. ${person.balance || "0.00"}`;

    if (detailsContainer) {
      detailsContainer.classList.remove("hidden");
    }
  }

  showSelectedHost(person) {
    const detailsContainer = document.getElementById("selectedHostDetails");
    const nameElement = document.getElementById("hostPersonName");
    const cnicElement = document.getElementById("hostPersonCnic");

    if (nameElement) nameElement.textContent = person.name;
    if (cnicElement) cnicElement.textContent = person.cnic;

    if (detailsContainer) {
      detailsContainer.classList.remove("hidden");
    }
  }

  clearSelectedPerson(type) {
    if (type === "entry") {
      this.selectedPerson = null;
      document.getElementById("entryPersonId").value = "";
      document.getElementById("entryPersonDetails").classList.add("hidden");
    }
    this.updateSubmitButton();
  }

  clearSelectedHost() {
    this.selectedHost = null;
    document.getElementById("hostPersonId").value = "";
    document.getElementById("selectedHostDetails").classList.add("hidden");
    this.updateSubmitButton();
  }

  toggleHostSection(isGuest) {
    const hostSection = document.getElementById("hostPersonSection");
    if (hostSection) {
      if (isGuest) {
        hostSection.classList.remove("hidden");
      } else {
        hostSection.classList.add("hidden");
        this.clearSelectedHost();
      }
    }
    this.updateSubmitButton();
  }

  toggleFacilityQuantity(checkbox) {
    const quantityInput = checkbox
      .closest(".facility-item")
      .querySelector(".facility-quantity");
    if (quantityInput) {
      quantityInput.disabled = !checkbox.checked;
      if (!checkbox.checked) {
        quantityInput.value = 1;
      }
    }
  }

  updateTotalAmount() {
    const facilityCheckboxes = document.querySelectorAll(
      ".facility-checkbox:checked"
    );
    let total = 0;
    const breakdown = [];

    facilityCheckboxes.forEach((checkbox) => {
      const price = parseFloat(checkbox.dataset.price) || 0;
      const name = checkbox.dataset.name;
      const quantityInput = checkbox
        .closest(".facility-item")
        .querySelector(".facility-quantity");
      const quantity = parseInt(quantityInput.value) || 1;
      const subtotal = price * quantity;

      total += subtotal;
      breakdown.push({ name, quantity, price, subtotal });
    });

    this.totalAmount = total;

    // Update display
    const totalElement = document.getElementById("totalAmount");
    if (totalElement) {
      totalElement.textContent = total.toFixed(2);
    }

    // Update breakdown
    const breakdownElement = document.getElementById("facilityBreakdown");
    if (breakdownElement) {
      if (breakdown.length === 0) {
        breakdownElement.innerHTML =
          '<div class="text-gray-500 text-sm">No facilities selected</div>';
      } else {
        breakdownElement.innerHTML = breakdown
          .map(
            (item) => `
          <div class="flex justify-between text-sm">
            <span>${item.name} × ${item.quantity}</span>
            <span>Rs. ${item.subtotal.toFixed(2)}</span>
          </div>
        `
          )
          .join("");
      }
    }

    this.updatePaymentNote();
  }

  updatePaymentNote() {
    const isGuest = document.getElementById("isGuest")?.checked;
    const category = this.selectedPerson?.category;
    const noteElement = document.getElementById("paymentNote");

    if (!noteElement) return;

    let note = "";
    if (category === "Military Serving") {
      note = "💰 Payment waived for military personnel";
    } else if (isGuest && this.selectedHost) {
      note = `💳 Amount will be charged to host: ${this.selectedHost.name}`;
    } else if (isGuest && !this.selectedHost) {
      note = "⚠️ Please select a host person";
    } else {
      note = "💵 Amount to be paid by person";
    }

    noteElement.textContent = note;
  }

  updateSubmitButton() {
    const submitBtn = document.getElementById("processEntryBtn");
    const isGuest = document.getElementById("isGuest")?.checked;

    let isValid = this.selectedPerson !== null;

    if (isGuest) {
      isValid = isValid && this.selectedHost !== null;
    }

    if (submitBtn) {
      submitBtn.disabled = !isValid;
      submitBtn.classList.toggle("opacity-50", !isValid);
    }
  }

  async handleFormSubmission(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    this.setLoading(true);

    try {
      const formData = this.collectFormData();

      const response = await fetch("/api/process-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to process entry");
      }

      const result = await response.json();

      if (typeof Toast !== "undefined") {
        Toast.success("Entry processed successfully!");
      }

      this.resetForm();
      if (typeof closeEntryModal === "function") {
        closeEntryModal();
      }

      // Refresh occupancy display
      if (typeof refreshOccupancy === "function") {
        refreshOccupancy();
      }
    } catch (error) {
      console.error("Entry submission error:", error);
      if (typeof Toast !== "undefined") {
        Toast.error("Failed to process entry. Please try again.");
      }
    } finally {
      this.setLoading(false);
    }
  }

  validateForm() {
    if (!this.selectedPerson) {
      this.showSearchError("entry", "Please select a person");
      return false;
    }

    const isGuest = document.getElementById("isGuest")?.checked;
    if (isGuest && !this.selectedHost) {
      this.showSearchError("host", "Please select a host person");
      return false;
    }

    return true;
  }

  collectFormData() {
    const form = document.getElementById("entryForm");
    const formData = new FormData(form);

    const data = {
      person_id: this.selectedPerson.id,
      vehicle_number: formData.get("vehicle_number") || null,
      guest_count: parseInt(formData.get("guest_count")) || 1,
      has_stroller: formData.get("has_stroller") === "1",
      is_guest: formData.get("is_guest") === "1",
      host_person_id: this.selectedHost?.id || null,
      entry_remarks: formData.get("entry_remarks") || null,
      facilities: [],
      total_amount: this.totalAmount,
    };

    // Collect selected facilities
    document
      .querySelectorAll(".facility-checkbox:checked")
      .forEach((checkbox) => {
        const quantityInput = checkbox
          .closest(".facility-item")
          .querySelector(".facility-quantity");
        data.facilities.push({
          facility_id: parseInt(checkbox.value),
          quantity: parseInt(quantityInput.value) || 1,
        });
      });

    return data;
  }

  setLoading(loading) {
    const submitBtn = document.getElementById("processEntryBtn");
    const btnText = document.getElementById("entryBtnText");
    const btnLoading = document.getElementById("entryBtnLoading");
    const cancelBtn = document.getElementById("entryModalCancelBtn");

    if (submitBtn) submitBtn.disabled = loading;
    if (cancelBtn) cancelBtn.disabled = loading;

    if (btnText) btnText.classList.toggle("hidden", loading);
    if (btnLoading) btnLoading.classList.toggle("hidden", !loading);
  }

  resetForm() {
    this.selectedPerson = null;
    this.selectedHost = null;
    document.getElementById("entryForm").reset();
    document.getElementById("entryPersonDetails").classList.add("hidden");
    document.getElementById("selectedHostDetails").classList.add("hidden");
    document.getElementById("hostPersonSection").classList.add("hidden");
    this.clearSearchResults("entry");
    this.clearSearchResults("host");

    // Reset facility quantities
    document.querySelectorAll(".facility-quantity").forEach((input) => {
      input.disabled = true;
      input.value = 1;
    });

    this.updateTotalAmount();
    this.updateSubmitButton();
  }

  // Utility methods
  showSearchSpinner(type, show) {
    const spinner = document.getElementById(`${type}PersonSearchSpinner`);
    if (spinner) {
      spinner.classList.toggle("hidden", !show);
    }
  }

  clearSearchResults(type) {
    const resultsContainer = document.getElementById(`${type}PersonResults`);
    if (resultsContainer) {
      resultsContainer.innerHTML = "";
    }
  }

  showSearchError(type, message) {
    const errorElement = document.getElementById(`${type}PersonError`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove("hidden");
    }
  }

  clearSearchError(type) {
    const errorElement = document.getElementById(`${type}PersonError`);
    if (errorElement) {
      errorElement.classList.add("hidden");
    }
  }
}

// Global functions for template compatibility
window.clearSelectedPerson = function (type) {
  if (window.entryModalManager) {
    window.entryModalManager.clearSelectedPerson(type);
  }
};

window.clearSelectedHost = function () {
  if (window.entryModalManager) {
    window.entryModalManager.clearSelectedHost();
  }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  window.entryModalManager = new EntryModalManager();
});

// Reset form when modal opens
const originalOpenEntryModal = window.openEntryModal;
window.openEntryModal = function () {
  if (originalOpenEntryModal) {
    originalOpenEntryModal();
  }
  setTimeout(() => {
    if (window.entryModalManager) {
      window.entryModalManager.resetForm();
    }
  }, 100);
};
