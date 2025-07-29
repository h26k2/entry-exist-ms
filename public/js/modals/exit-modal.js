// Exit Modal Enhanced Functionality
class ExitModalManager {
  constructor() {
    this.selectedExitPerson = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateSubmitButton();
  }

  bindEvents() {
    // Person search functionality
    const exitPersonSearch = document.getElementById("exitPersonSearch");
    if (exitPersonSearch) {
      exitPersonSearch.addEventListener(
        "input",
        this.debounce((e) => {
          this.searchPersonInside(e.target.value);
        }, 300)
      );
    }

    // Form submission
    document.getElementById("exitForm").addEventListener("submit", (e) => {
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

  async searchPersonInside(query) {
    if (query.length < 2) {
      this.clearSearchResults();
      return;
    }

    this.showSearchSpinner(true);
    this.clearSearchError();

    try {
      const response = await fetch("/api/search-person-inside", {
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
      this.displaySearchResults(data.people || []);
    } catch (error) {
      this.showSearchError("Search failed. Please try again.");
      console.error("Search error:", error);
    } finally {
      this.showSearchSpinner(false);
    }
  }

  displaySearchResults(people) {
    const resultsContainer = document.getElementById("exitPersonResults");
    if (!resultsContainer) return;

    if (people.length === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center py-4 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <i class="fas fa-search text-2xl mb-2"></i>
          <p class="font-medium">No people found inside the facility</p>
          <p class="text-sm">Try a different search term</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = people
      .map(
        (person) => `
        <div class="person-result bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 cursor-pointer transition-all duration-200 p-3" 
             onclick="exitModalManager.selectExitPerson(${JSON.stringify(
               person
             ).replace(/"/g, "&quot;")})">
          
          <div class="flex items-center justify-between">
            <!-- Person Info -->
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-white text-sm"></i>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="font-semibold text-gray-900 text-sm truncate">${
                  person.name
                }</h4>
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-xs text-gray-500 font-mono">${
                    person.cnic
                  }</span>
                  <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    ${person.category || "N/A"}
                  </span>
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  <i class="fas fa-clock mr-1"></i>
                  Inside for ${this.calculateDuration(person.entry_time)}
                </div>
              </div>
            </div>
            
            <!-- Select Button -->
            <div class="flex-shrink-0 ml-3">
              <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <i class="fas fa-sign-out-alt text-white text-xs"></i>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  calculateDuration(entryTime) {
    const duration = Math.floor(
      (new Date() - new Date(entryTime)) / (1000 * 60)
    );
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  }

  selectExitPerson(person) {
    this.selectedExitPerson = person;
    this.showSelectedPerson(person);
    document.getElementById("exitPersonId").value = person.id;
    document.getElementById("exitPersonSearch").value = "";
    this.clearSearchResults();
    this.updateSubmitButton();
  }

  showSelectedPerson(person) {
    const detailsContainer = document.getElementById("exitPersonDetails");
    const nameElement = document.getElementById("exitPersonName");
    const cnicElement = document.getElementById("exitPersonCnic");
    const categoryElement = document.getElementById("exitPersonCategory");
    const entryTimeElement = document.getElementById("exitEntryTime");
    const durationElement = document.getElementById("exitDuration");
    const amountElement = document.getElementById("exitAmountPaid");

    if (nameElement) nameElement.textContent = person.name;
    if (cnicElement) cnicElement.textContent = person.cnic;
    if (categoryElement) categoryElement.textContent = person.category || "N/A";
    if (entryTimeElement)
      entryTimeElement.textContent = new Date(
        person.entry_time
      ).toLocaleString();
    if (durationElement)
      durationElement.textContent = this.calculateDuration(person.entry_time);
    if (amountElement)
      amountElement.textContent = `Rs. ${person.amount_paid || "0.00"}`;

    // Show entry extras if available
    const extrasContainer = document.getElementById("exitEntryExtras");
    const extrasListContainer = document.getElementById("exitEntryExtrasList");

    const extras = [];
    if (person.is_guest) extras.push(`Guest (${person.guest_count || 1})`);
    if (person.has_stroller) extras.push("Stroller");
    if (person.vehicle_number) extras.push(`Vehicle: ${person.vehicle_number}`);
    if (person.host_name) extras.push(`Host: ${person.host_name}`);
    if (person.entry_remarks) extras.push(`Remarks: ${person.entry_remarks}`);

    if (extras.length > 0 && extrasContainer && extrasListContainer) {
      extrasListContainer.innerHTML = extras
        .map(
          (extra) => `
          <span class="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-medium">
            ${extra}
          </span>
        `
        )
        .join("");
      extrasContainer.classList.remove("hidden");
    } else if (extrasContainer) {
      extrasContainer.classList.add("hidden");
    }

    if (detailsContainer) {
      detailsContainer.classList.remove("hidden");
    }

    // Show exit options
    const exitOptions = document.getElementById("exitOptions");
    if (exitOptions) {
      exitOptions.classList.remove("hidden");
    }
  }

  clearSelectedPerson() {
    this.selectedExitPerson = null;
    document.getElementById("exitPersonId").value = "";
    document.getElementById("exitPersonDetails").classList.add("hidden");
    document.getElementById("exitOptions").classList.add("hidden");
    this.updateSubmitButton();
  }

  setExitReason(reason, buttonElement) {
    const remarksTextarea = document.getElementById("exitRemarks");
    if (remarksTextarea) {
      remarksTextarea.value = reason;
    }

    // Update button states
    document.querySelectorAll(".exit-reason-btn").forEach((btn) => {
      btn.classList.remove(
        "border-green-500",
        "bg-green-50",
        "border-red-500",
        "bg-red-50",
        "border-yellow-500",
        "bg-yellow-50",
        "border-blue-500",
        "bg-blue-50"
      );
      btn.classList.add("border-gray-200");
    });

    // Highlight selected button
    if (buttonElement) {
      buttonElement.classList.remove("border-gray-200");
      if (reason.includes("Emergency")) {
        buttonElement.classList.add("border-red-500", "bg-red-50");
      } else if (reason.includes("Early")) {
        buttonElement.classList.add("border-yellow-500", "bg-yellow-50");
      } else if (reason.includes("End")) {
        buttonElement.classList.add("border-blue-500", "bg-blue-50");
      } else {
        buttonElement.classList.add("border-green-500", "bg-green-50");
      }
    }
  }

  updateSubmitButton() {
    const submitBtn = document.getElementById("processExitBtn");
    const isValid = this.selectedExitPerson !== null;

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

      const response = await fetch("/api/process-exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to process exit");
      }

      const result = await response.json();

      if (typeof Toast !== "undefined") {
        Toast.success("Exit processed successfully!");
      }
      this.resetForm();
      if (typeof closeExitModal === "function") {
        closeExitModal();
      }

      // Refresh occupancy display
      if (typeof refreshOccupancy === "function") {
        refreshOccupancy();
      }
    } catch (error) {
      console.error("Exit submission error:", error);
      if (typeof Toast !== "undefined") {
        Toast.error("Failed to process exit. Please try again.");
      }
    } finally {
      this.setLoading(false);
    }
  }

  validateForm() {
    if (!this.selectedExitPerson) {
      this.showSearchError("Please select a person to exit");
      return false;
    }
    return true;
  }

  collectFormData() {
    const form = document.getElementById("exitForm");
    const formData = new FormData(form);

    return {
      person_id: this.selectedExitPerson.id,
      exit_remarks: formData.get("exit_remarks") || null,
    };
  }

  setLoading(loading) {
    const submitBtn = document.getElementById("processExitBtn");
    const btnText = document.getElementById("exitBtnText");
    const btnLoading = document.getElementById("exitBtnLoading");
    const cancelBtn = document.getElementById("exitModalCancelBtn");

    if (submitBtn) submitBtn.disabled = loading;
    if (cancelBtn) cancelBtn.disabled = loading;

    if (btnText) btnText.classList.toggle("hidden", loading);
    if (btnLoading) btnLoading.classList.toggle("hidden", !loading);
  }

  resetForm() {
    this.selectedExitPerson = null;
    document.getElementById("exitForm").reset();
    document.getElementById("exitPersonDetails").classList.add("hidden");
    document.getElementById("exitOptions").classList.add("hidden");
    this.clearSearchResults();

    // Reset exit reason buttons
    document.querySelectorAll(".exit-reason-btn").forEach((btn) => {
      btn.classList.remove(
        "border-green-500",
        "bg-green-50",
        "border-red-500",
        "bg-red-50",
        "border-yellow-500",
        "bg-yellow-50",
        "border-blue-500",
        "bg-blue-50"
      );
      btn.classList.add("border-gray-200");
    });

    this.updateSubmitButton();
  }

  // Utility methods
  showSearchSpinner(show) {
    const spinner = document.getElementById("exitPersonSearchSpinner");
    if (spinner) {
      spinner.classList.toggle("hidden", !show);
    }
  }

  clearSearchResults() {
    const resultsContainer = document.getElementById("exitPersonResults");
    if (resultsContainer) {
      resultsContainer.innerHTML = "";
    }
  }

  showSearchError(message) {
    const errorElement = document.getElementById("exitPersonError");
    if (errorElement) {
      errorElement.querySelector("span").textContent = message;
      errorElement.classList.remove("hidden");
    }
  }

  clearSearchError() {
    const errorElement = document.getElementById("exitPersonError");
    if (errorElement) {
      errorElement.classList.add("hidden");
    }
  }
}

// Global functions for template compatibility
window.clearSelectedExitPerson = function () {
  if (window.exitModalManager) {
    window.exitModalManager.clearSelectedPerson();
  }
};

window.setExitReason = function (reason, buttonElement) {
  if (window.exitModalManager) {
    window.exitModalManager.setExitReason(reason, buttonElement);
  }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  window.exitModalManager = new ExitModalManager();
});

// Reset form when modal opens
const originalOpenExitModal = window.openExitModal;
window.openExitModal = function () {
  if (originalOpenExitModal) {
    originalOpenExitModal();
  }
  setTimeout(() => {
    if (window.exitModalManager) {
      window.exitModalManager.resetForm();
    }
  }, 100);
};
