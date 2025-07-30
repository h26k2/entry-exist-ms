// Search Modal Functions
class SearchModalManager {
  constructor() {
    this.searchTimeouts = {};
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // General search input
    const generalSearchInput = document.getElementById("generalSearch");
    if (generalSearchInput) {
      generalSearchInput.addEventListener("input", () => {
        clearTimeout(this.searchTimeouts.general);
        this.searchTimeouts.general = setTimeout(() => {
          this.performGeneralSearch();
        }, 300);
      });
      generalSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.performGeneralSearch();
        }
      });
    }

    // Close modal when clicking outside
    const searchModal = document.getElementById("searchModal");
    if (searchModal) {
      searchModal.addEventListener("click", function (e) {
        if (e.target === this) {
          if (typeof closeSearchModal === "function") {
            closeSearchModal();
          }
        }
      });
    }

    // ESC key to close modal
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        const modal = document.getElementById("searchModal");
        if (modal && !modal.classList.contains("hidden")) {
          if (typeof closeSearchModal === "function") {
            closeSearchModal();
          }
        }
      }
    });
  }

  // Search functionality
  performGeneralSearch() {
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
        this.displaySearchResults(data.people || []);
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
  displaySearchResults(people) {
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

  // Advanced search
  performAdvancedSearch() {
    const query = document.getElementById("searchQuery").value;
    const categoryId = document.getElementById("searchCategory").value;
    const isFamilyMember = document.getElementById("searchFamilyMembers")
      .checked
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
          this.displayAdvancedSearchResults(data.people);
        } else {
          this.showMessage(data.message || "Search failed", "error");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        this.showMessage("Network error occurred", "error");
      });
  }

  displayAdvancedSearchResults(people) {
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
}

// Global functions
window.openSearchModal = function () {
  const modal = document.getElementById("searchModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }
  if (typeof Toast !== "undefined") {
    Toast.info("Search people in the system");
  }
};

window.closeSearchModal = function () {
  const modal = document.getElementById("searchModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
  }
};

// Quick entry function
window.quickEntry = function (personId) {
  if (typeof closeSearchModal === "function") {
    closeSearchModal();
  }
  if (typeof openEntryModal === "function") {
    openEntryModal();
  }

  // Pre-fill the entry form with selected person
  fetch(`/api/person-details/${personId}`)
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
        if (typeof updateTotalAmount === "function") {
          updateTotalAmount();
        }
      }
    })
    .catch((error) => {
      console.error("Error loading person details:", error);
    });
};

// View person details (placeholder)
window.viewPersonDetails = function (personId) {
  if (window.searchModalManager) {
    window.searchModalManager.showMessage(
      `Person details for ID: ${personId} (functionality to be implemented)`,
      "info"
    );
  }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  window.searchModalManager = new SearchModalManager();
});
