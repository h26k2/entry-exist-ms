// Family Member Modal Management
class FamilyMemberModal {
  constructor() {
    this.modalId = "familyMemberModal";
    this.formId = "familyMemberForm";
    this.hostPersonId = null;
    this.setupEventListeners();
  }

  // Open modal for adding family member
  async open(hostPersonId) {
    this.hostPersonId = hostPersonId;

    try {
      const response = await fetch(`/api/person-details/${hostPersonId}`);
      const data = await response.json();

      if (data.success) {
        this.populateHostInfo(data.person);
        this.resetForm();
        this.show();
      } else {
        Toast.show(data.message || "Failed to load host details", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
    }
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
    }
  }

  // Populate host information
  populateHostInfo(hostPerson) {
    document.getElementById("familyHostPersonId").value = this.hostPersonId;
    document.getElementById("familyHostName").textContent = hostPerson.name;
    document.getElementById("familyHostCnic").textContent = hostPerson.cnic;
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById(this.formId);
      if (form) {
        form.addEventListener("submit", this.handleFormSubmit.bind(this));
      }

      // CNIC formatting
      const cnicInput = document.getElementById("familyCnic");
      if (cnicInput) {
        cnicInput.addEventListener("input", this.formatCNIC);
      }

      // Phone formatting
      const phoneInputs = document.querySelectorAll(
        "#familyPhone, #familyEmergencyContact"
      );
      phoneInputs.forEach((input) => {
        if (input) {
          input.addEventListener("input", this.formatPhone);
        }
      });
    });
  }

  // Handle form submission
  async handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    formData.append("host_person_id", this.hostPersonId);

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
        this.hide();
        setTimeout(() => {
          if (typeof loadPeopleData === "function") loadPeopleData();
          if (typeof loadPeopleStats === "function") loadPeopleStats();
        }, 1000);
      } else {
        Toast.show(result.message || "Failed to add family member", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show("Network error occurred", "error");
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
}

// Create global instance
const familyMemberModal = new FamilyMemberModal();

// Global functions for compatibility
function addFamilyMember(hostPersonId) {
  familyMemberModal.open(hostPersonId);
}

function closeFamilyMemberModal() {
  familyMemberModal.hide();
}
