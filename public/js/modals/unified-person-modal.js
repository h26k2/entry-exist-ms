// Unified Person Modal Management
class UnifiedPersonModal {
  constructor() {
    this.modalId = "unifiedPersonModal";
    this.formId = "unifiedPersonForm";
    this.titleId = "unifiedPersonModalTitle";
    this.subtitleId = "unifiedPersonModalSubtitle";
    this.iconId = "unifiedPersonModalIcon";
    this.mode = "add"; // 'add' or 'edit'
    this.context = "entry"; // 'entry' or 'people'
    this.setupEventListeners();
  }

  // Open modal for adding new person (from entry page)
  openRegisterMode(context = "entry") {
    this.mode = "add";
    this.context = context;
    this.resetForm();
    this.updateModalForMode();
    this.show();
  }

  // Open modal for adding new person (from people page)
  openAddMode(context = "people") {
    this.mode = "add";
    this.context = context;
    this.resetForm();
    this.updateModalForMode();
    this.show();
  }

  // Open modal for editing existing person
  async openEditMode(personId, context = "people") {
    this.mode = "edit";
    this.context = context;
    try {
      const response = await fetch(`/api/person-details/${personId}`);
      const data = await response.json();

      if (data.success) {
        this.populateForm(data.person);
        this.updateModalForMode();
        this.show();
      } else {
        Toast.show(data.message || "Failed to load person details", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    }
  }

  // Update modal appearance based on mode and context
  updateModalForMode() {
    const title = document.getElementById(this.titleId);
    const subtitle = document.getElementById(this.subtitleId);
    const icon = document.getElementById(this.iconId);
    const submitBtn = document.getElementById("submitUnifiedPersonBtn");
    const modeField = document.getElementById("unifiedPersonMode");

    if (this.mode === "add") {
      if (this.context === "entry") {
        title.textContent = "Register New Person";
        subtitle.textContent = "Add a new person to the system";
        icon.className = "fas fa-user-plus text-white text-lg";
        submitBtn.innerHTML =
          '<i class="fas fa-user-plus mr-2"></i>Register Person';
      } else {
        title.textContent = "Add New Person";
        subtitle.textContent = "Create or edit person information";
        icon.className = "fas fa-user-plus text-white text-lg";
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Person';
      }
    } else {
      title.textContent = "Edit Person";
      subtitle.textContent = "Update person information";
      icon.className = "fas fa-user-edit text-white text-lg";
      submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Person';
    }

    modeField.value = this.mode;
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

  // Reset form to initial state
  resetForm() {
    const form = document.getElementById(this.formId);
    if (form) {
      form.reset();
      document.getElementById("unifiedPersonId").value = "";
      document.getElementById("unifiedPersonIsFamilyMember").checked = false;
      document.getElementById("unifiedPersonFamilyFields").style.display =
        "none";
      document.getElementById("unifiedPersonHostId").value = "";
      document.getElementById("unifiedPersonHostSearch").value = "";
      document.getElementById("unifiedPersonGenerateCard").checked = false;
      this.clearHostSearchResults();
    }
  }

  // Populate form with person data
  populateForm(person) {
    document.getElementById("unifiedPersonId").value = person.id;
    document.getElementById("unifiedPersonCnic").value = person.cnic;
    document.getElementById("unifiedPersonName").value = person.name;
    document.getElementById("unifiedPersonPhone").value = person.phone || "";
    document.getElementById("unifiedPersonCategory").value = person.category_id;
    document.getElementById("unifiedPersonAddress").value =
      person.address || "";
    document.getElementById("unifiedPersonEmergencyContact").value =
      person.emergency_contact || "";
    document.getElementById("unifiedPersonRemarks").value =
      person.remarks || "";
    document.getElementById("unifiedPersonIsFamilyMember").checked =
      person.is_family_member;
    document.getElementById("unifiedPersonGenerateCard").checked = false; // Reset this for edits

    if (person.is_family_member && person.host_person_id) {
      document.getElementById("unifiedPersonFamilyFields").style.display =
        "block";
      document.getElementById("unifiedPersonHostId").value =
        person.host_person_id;
      // Fetch and display host name
      this.loadHostName(person.host_person_id);
    }
  }

  // Load host person name for family member
  async loadHostName(hostPersonId) {
    try {
      const response = await fetch(`/api/person-details/${hostPersonId}`);
      const data = await response.json();

      if (data.success) {
        document.getElementById("unifiedPersonHostSearch").value =
          data.person.name;
      }
    } catch (error) {
      console.error("Error loading host name:", error);
    }
  }

  // Setup event listeners for the modal
  setupEventListeners() {
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById(this.formId);
      if (form) {
        form.addEventListener("submit", this.handleFormSubmit.bind(this));
      }

      // Family member toggle
      const familyToggle = document.getElementById(
        "unifiedPersonIsFamilyMember"
      );
      if (familyToggle) {
        familyToggle.addEventListener(
          "change",
          this.handleFamilyToggle.bind(this)
        );
      }

      // Host person search
      const hostSearch = document.getElementById("unifiedPersonHostSearch");
      if (hostSearch) {
        hostSearch.addEventListener(
          "input",
          this.debounce(this.searchHostPerson.bind(this), 300)
        );
      }

      // CNIC formatting
      const cnicInput = document.getElementById("unifiedPersonCnic");
      if (cnicInput) {
        cnicInput.addEventListener("input", this.formatCNIC);
      }

      // Phone formatting
      const phoneInputs = document.querySelectorAll(
        "#unifiedPersonPhone, #unifiedPersonEmergencyContact"
      );
      phoneInputs.forEach((input) => {
        if (input) {
          input.addEventListener("input", this.formatPhone);
        }
      });

      // Close modal when clicking outside
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            this.hide();
          }
        });
      }

      // ESC key to close modal
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          this.hide();
        }
      });
    });
  }

  // Handle form submission
  async handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const personId = document.getElementById("unifiedPersonId").value;
    const isUpdate = personId !== "";

    // Convert FormData to JSON
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Add checkbox values
    data.is_family_member = document.getElementById(
      "unifiedPersonIsFamilyMember"
    ).checked
      ? "1"
      : "0";
    data.generate_card = document.getElementById("unifiedPersonGenerateCard")
      .checked
      ? "1"
      : "0";

    if (data.is_family_member === "1") {
      data.host_person_id = document.getElementById(
        "unifiedPersonHostId"
      ).value;
    }

    const url = isUpdate ? `/api/update-person/${personId}` : "/api/add-person";

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
          : this.context === "entry"
          ? "Person registered successfully!"
          : "Person added successfully!";

        if (result.card_number) {
          message += ` Card Number: ${result.card_number}`;
        }

        Toast.show(message, "success");
        this.hide();

        // Refresh data based on context
        setTimeout(() => {
          if (this.context === "people") {
            if (typeof loadPeopleData === "function") loadPeopleData();
            if (typeof loadPeopleStats === "function") loadPeopleStats();
          } else if (this.context === "entry") {
            if (typeof refreshEntryData === "function") refreshEntryData();
            if (typeof loadEntryStats === "function") loadEntryStats();
          }
        }, 1000);
      } else {
        Toast.show(result.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    }
  }

  // Handle family member toggle
  handleFamilyToggle(e) {
    const familyFields = document.getElementById("unifiedPersonFamilyFields");
    if (familyFields) {
      familyFields.style.display = e.target.checked ? "block" : "none";
    }

    if (!e.target.checked) {
      document.getElementById("unifiedPersonHostId").value = "";
      document.getElementById("unifiedPersonHostSearch").value = "";
      this.clearHostSearchResults();
    }
  }

  // Search for host person
  async searchHostPerson(e) {
    const query = e.target.value;
    if (query.length < 2) {
      this.clearHostSearchResults();
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
        this.displayHostSearchResults(data.people);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  // Display host search results
  displayHostSearchResults(people) {
    const container = document.getElementById("unifiedPersonHostResults");
    if (!container) return;

    if (people.length === 0) {
      container.innerHTML =
        '<div class="search-item p-2 text-gray-500">No results found</div>';
      container.classList.add("show");
      return;
    }

    let html = "";
    people.forEach((person) => {
      html += `
        <div class="search-item p-3 cursor-pointer hover:bg-gray-100 border-b" onclick="unifiedPersonModal.selectHostPerson(${person.id}, '${person.name}')">
          <h5 class="font-medium">${person.name}</h5>
          <p class="text-sm text-gray-600"><strong>CNIC:</strong> ${person.cnic}</p>
          <p class="text-sm text-gray-600"><strong>Category:</strong> ${person.category_name}</p>
        </div>
      `;
    });

    container.innerHTML = html;
    container.classList.add("show");
  }

  // Select host person from search results
  selectHostPerson(id, name) {
    document.getElementById("unifiedPersonHostId").value = id;
    document.getElementById("unifiedPersonHostSearch").value = name;
    this.clearHostSearchResults();
  }

  // Clear host search results
  clearHostSearchResults() {
    const container = document.getElementById("unifiedPersonHostResults");
    if (container) {
      container.classList.remove("show");
      container.innerHTML = "";
    }
  }

  // Format CNIC input
  formatCNIC(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 13) {
      value = value.substring(0, 13);
    }
    e.target.value = value;
  }

  // Format phone input
  formatPhone(e) {
    let value = e.target.value.replace(/[^\d\s\-\(\)\+]/g, "");
    e.target.value = value;
  }

  // Debounce utility function
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
}

// Create global instance
const unifiedPersonModal = new UnifiedPersonModal();

// Global functions for compatibility with existing code

// For entry page (register modal)
function openRegisterModal() {
  unifiedPersonModal.openRegisterMode("entry");
}

function closeRegisterModal() {
  unifiedPersonModal.hide();
}

// For people page (person modal)
function openAddPersonModal() {
  unifiedPersonModal.openAddMode("people");
}

function editPerson(personId) {
  unifiedPersonModal.openEditMode(personId, "people");
}

function closePersonModal() {
  unifiedPersonModal.hide();
}

// Universal close function
function closeUnifiedPersonModal() {
  unifiedPersonModal.hide();
}
