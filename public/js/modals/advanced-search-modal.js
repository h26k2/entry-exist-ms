// Advanced Search Modal Management
class AdvancedSearchModal {
  constructor() {
    this.modalId = "advancedSearchModal";
    this.resultsId = "advancedSearchResults";
    this.setupEventListeners();
  }

  // Open the modal
  open() {
    this.clearResults();
    this.show();
  }

  // Show the modal
  show() {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document.body.style.overflow = "hidden";
    }
  }

  // Hide the modal
  hide() {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = "auto";
    }
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener("DOMContentLoaded", () => {
      // Set default values for date inputs to last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      const startInput = document.getElementById("advSearchRegistrationStart");
      const endInput = document.getElementById("advSearchRegistrationEnd");

      if (startInput) {
        startInput.value = startDate.toISOString().split("T")[0];
      }
      if (endInput) {
        endInput.value = endDate.toISOString().split("T")[0];
      }

      // Handle mutual exclusivity of card checkboxes
      const withCards = document.getElementById("advSearchWithCards");
      const withoutCards = document.getElementById("advSearchWithoutCards");

      if (withCards) {
        withCards.addEventListener("change", () => {
          if (withCards.checked && withoutCards) {
            withoutCards.checked = false;
          }
        });
      }

      if (withoutCards) {
        withoutCards.addEventListener("change", () => {
          if (withoutCards.checked && withCards) {
            withCards.checked = false;
          }
        });
      }
    });
  }

  // Perform advanced search
  async performSearch() {
    const searchData = {
      query: document.getElementById("advSearchQuery").value,
      category_id: document.getElementById("advSearchCategory").value,
      is_family_member: document.getElementById("advSearchFamilyMembers")
        .checked
        ? "1"
        : "",
      has_card: document.getElementById("advSearchWithCards").checked
        ? "1"
        : document.getElementById("advSearchWithoutCards").checked
        ? "0"
        : "",
      registration_start: document.getElementById("advSearchRegistrationStart")
        .value,
      registration_end: document.getElementById("advSearchRegistrationEnd")
        .value,
    };

    // Show loading state
    this.showLoading();

    try {
      const response = await fetch("/api/search-people-advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchData),
      });

      const data = await response.json();

      if (data.success) {
        this.displayResults(data.people);
        Toast.show(`Found ${data.people.length} results`, "success");
      } else {
        Toast.show(data.message || "Search failed", "error");
        this.showError("Search failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
      this.showError("Network error occurred. Please check your connection.");
    }
  }

  // Display search results
  displayResults(people) {
    const container = document.getElementById(this.resultsId);
    if (!container) return;

    if (people.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-search text-gray-400 text-2xl"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p class="text-gray-500">No people found matching your search criteria. Try adjusting your filters.</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="search-results">
        <div class="flex items-center justify-between mb-6">
          <h4 class="text-lg font-bold text-gray-900">Search Results</h4>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">${people.length} results found</span>
            <button onclick="advancedSearchModal.exportResults()" class="btn btn-sm btn-secondary">
              <i class="fas fa-download mr-2"></i>Export Results
            </button>
          </div>
        </div>
        
        <div class="overflow-hidden rounded-xl border border-gray-200">
          <table class="min-w-full bg-white">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Person</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Card Status</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
    `;

    people.forEach((person, index) => {
      html += `
        <tr class="hover:bg-gray-50 transition-colors animate-fade-in" style="animation-delay: ${
          index * 0.05
        }s">
          <td class="px-6 py-4">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ${person.name.charAt(0).toUpperCase()}
              </div>
              <div class="ml-3">
                <div class="text-sm font-medium text-gray-900">${
                  person.name
                }</div>
                <div class="text-sm text-gray-500 font-mono">${
                  person.cnic
                }</div>
                ${
                  person.is_family_member
                    ? `
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                    <i class="fas fa-home mr-1"></i>Family Member
                  </span>
                `
                    : ""
                }
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm text-gray-900">${person.phone || "N/A"}</div>
            ${
              person.emergency_contact
                ? `
              <div class="text-xs text-gray-500 mt-1">Emergency: ${person.emergency_contact}</div>
            `
                : ""
            }
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ${person.category_name || "N/A"}
            </span>
          </td>
          <td class="px-6 py-4">
            ${
              person.card_number
                ? `
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <i class="fas fa-id-card mr-1"></i>${person.card_number}
              </span>
            `
                : `
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <i class="fas fa-times mr-1"></i>No Card
              </span>
            `
            }
          </td>
          <td class="px-6 py-4 text-sm text-gray-900">
            ${new Date(person.created_at).toLocaleDateString()}
          </td>
          <td class="px-6 py-4 text-right">
            <div class="flex items-center justify-end space-x-2">
              <button onclick="viewPersonDetails(${
                person.id
              })" class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <button onclick="editPerson(${
                person.id
              }); advancedSearchModal.hide();" class="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              ${
                !person.card_number
                  ? `
                <button onclick="generateCard(${person.id})" class="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded-lg transition-colors" title="Generate Card">
                  <i class="fas fa-id-card"></i>
                </button>
              `
                  : ""
              }
              <button onclick="addFamilyMember(${
                person.id
              })" class="text-orange-600 hover:text-orange-800 p-2 hover:bg-orange-50 rounded-lg transition-colors" title="Add Family Member">
                <i class="fas fa-user-friends"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // Show loading state
  showLoading() {
    const container = document.getElementById(this.resultsId);
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <i class="fas fa-search text-blue-600 text-2xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Searching...</h3>
        <p class="text-gray-500">Please wait while we search for matching people.</p>
      </div>
    `;
  }

  // Show error state
  showError(message) {
    const container = document.getElementById(this.resultsId);
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
        <p class="text-gray-500">${message}</p>
      </div>
    `;
  }

  // Clear search form and results
  clearSearch() {
    document.getElementById("advSearchQuery").value = "";
    document.getElementById("advSearchCategory").value = "";
    document.getElementById("advSearchFamilyMembers").checked = false;
    document.getElementById("advSearchWithCards").checked = false;
    document.getElementById("advSearchWithoutCards").checked = false;
    document.getElementById("advSearchRegistrationStart").value = "";
    document.getElementById("advSearchRegistrationEnd").value = "";
    this.clearResults();
    Toast.show("Search filters cleared", "info");
  }

  // Clear results only
  clearResults() {
    const container = document.getElementById(this.resultsId);
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-search text-gray-400 text-2xl"></i>
          </div>
          <p class="text-lg font-medium">Use the filters above to search for people</p>
          <p class="text-sm">Enter search criteria and click "Search" to see results</p>
        </div>
      `;
    }
  }

  // Export search results
  exportResults() {
    Toast.show("Exporting search results...", "info");

    // Get current search parameters
    const searchData = {
      query: document.getElementById("advSearchQuery").value,
      category_id: document.getElementById("advSearchCategory").value,
      is_family_member: document.getElementById("advSearchFamilyMembers")
        .checked
        ? "1"
        : "",
      has_card: document.getElementById("advSearchWithCards").checked
        ? "1"
        : document.getElementById("advSearchWithoutCards").checked
        ? "0"
        : "",
      registration_start: document.getElementById("advSearchRegistrationStart")
        .value,
      registration_end: document.getElementById("advSearchRegistrationEnd")
        .value,
    };

    // Create export URL with search parameters
    const params = new URLSearchParams(searchData);
    const link = document.createElement("a");
    link.href = `/api/export-search-results?${params.toString()}`;
    link.download = `search_results_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      Toast.show("Export completed successfully!", "success");
    }, 1000);
  }
}

// Create global instance
const advancedSearchModal = new AdvancedSearchModal();

// Global functions for compatibility
function openAdvancedSearchModal() {
  advancedSearchModal.open();
}

function closeAdvancedSearchModal() {
  advancedSearchModal.hide();
}

function performAdvancedSearch() {
  advancedSearchModal.performSearch();
}

function clearAdvancedSearch() {
  advancedSearchModal.clearSearch();
}
