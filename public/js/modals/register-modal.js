// Register Modal Functions
class RegisterModalManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Family member checkbox
    const familyCheckbox = document.getElementById("registerIsFamilyMember");
    if (familyCheckbox) {
      familyCheckbox.addEventListener("change", (e) => {
        this.toggleFamilyMemberFields(e.target.checked);
      });
    }

    // CNIC formatting for register form
    const registerCnic = document.getElementById("registerCnic");
    if (registerCnic) {
      registerCnic.addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 13) {
          value = value.substring(0, 13);
        }
        e.target.value = value;
      });
    }

    // Form submission
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", this.handleRegisterSubmit);
    }

    // Close modal when clicking outside
    const registerModal = document.getElementById("registerModal");
    if (registerModal) {
      registerModal.addEventListener("click", function (e) {
        if (e.target === this) {
          if (typeof closeRegisterModal === "function") {
            closeRegisterModal();
          }
        }
      });
    }

    // ESC key to close modal
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        const modal = document.getElementById("registerModal");
        if (modal && !modal.classList.contains("hidden")) {
          if (typeof closeRegisterModal === "function") {
            closeRegisterModal();
          }
        }
      }
    });
  }

  // Toggle family member fields
  toggleFamilyMemberFields(show) {
    const familyFields = document.getElementById("familyMemberDetails");
    if (familyFields) {
      familyFields.style.display = show ? "block" : "none";
    }

    if (show) {
      this.loadHostPersons();
    } else {
      const hostSelect = document.getElementById("registerHostPerson");
      if (hostSelect) {
        hostSelect.innerHTML = '<option value="">Select host person</option>';
      }
    }
  }

  // Load categories for register modal
  async loadCategoriesForRegister() {
    try {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        console.error(
          "Categories API response not OK:",
          response.status,
          response.statusText
        );
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Categories API response is not JSON:", contentType);
        return;
      }

      const data = await response.json();

      if (data.success && data.categories) {
        const categorySelect = document.getElementById("registerCategory");
        if (categorySelect) {
          categorySelect.innerHTML =
            '<option value="">Select category</option>';
          data.categories.forEach((category) => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
          });
        }
      } else {
        console.error("Categories API returned error:", data.message);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  // Load host persons for family members
  async loadHostPersons() {
    try {
      const response = await fetch("/api/people");

      if (!response.ok) {
        console.error(
          "API response not OK:",
          response.status,
          response.statusText
        );
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("API response is not JSON:", contentType);
        return;
      }

      const data = await response.json();

      if (data.success && data.people) {
        const hostSelect = document.getElementById("registerHostPerson");
        if (hostSelect) {
          hostSelect.innerHTML = '<option value="">Select host person</option>';
          data.people.forEach((person) => {
            const option = document.createElement("option");
            option.value = person.id;
            option.textContent = `${person.name} (${person.cnic})`;
            hostSelect.appendChild(option);
          });
        }
      } else {
        console.error("API returned error:", data.message);
      }
    } catch (error) {
      console.error("Failed to load host persons:", error);
    }
  }

  // Register form submission
  async handleRegisterSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = document.getElementById("submitRegisterBtn");

    // Validation
    if (!registerModalManager.validateRegisterForm(formData)) {
      return;
    }

    // Show loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Registering...';
    submitBtn.disabled = true;

    try {
      const response = await fetch("/api/register-person", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      const data = await response.json();

      if (data.success) {
        if (typeof Toast !== "undefined") {
          Toast.success(
            `Person registered successfully! Card Number: ${data.card_number}`
          );
        }
        if (typeof closeRegisterModal === "function") {
          closeRegisterModal();
        }

        // Refresh the page or update UI as needed
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        if (typeof Toast !== "undefined") {
          Toast.error(data.message || "Registration failed");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (typeof Toast !== "undefined") {
        Toast.error("Failed to register person. Please try again.");
      }
    } finally {
      // Reset button
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  }

  // Validate register form
  validateRegisterForm(formData) {
    const cnic = formData.get("cnic");
    const name = formData.get("name");
    const categoryId = formData.get("category_id");

    if (!cnic || cnic.length !== 13) {
      if (typeof Toast !== "undefined") {
        Toast.error("Please enter a valid 13-digit CNIC number");
      }
      return false;
    }

    if (!name || name.trim().length < 2) {
      if (typeof Toast !== "undefined") {
        Toast.error("Please enter a valid name");
      }
      return false;
    }

    if (!categoryId) {
      if (typeof Toast !== "undefined") {
        Toast.error("Please select a category");
      }
      return false;
    }

    return true;
  }
}

// Global functions
window.openRegisterModal = function () {
  const modal = document.getElementById("registerModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";

    // Load categories and host persons
    if (window.registerModalManager) {
      window.registerModalManager.loadCategoriesForRegister();
      window.registerModalManager.loadHostPersons();
    }

    // Clear form
    document.getElementById("registerForm").reset();
    if (window.registerModalManager) {
      window.registerModalManager.toggleFamilyMemberFields(false);
    }
  }
};

window.closeRegisterModal = function () {
  const modal = document.getElementById("registerModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";

    // Clear form
    document.getElementById("registerForm").reset();
    if (window.registerModalManager) {
      window.registerModalManager.toggleFamilyMemberFields(false);
    }
  }
};

// Initialize register modal functionality
document.addEventListener("DOMContentLoaded", function () {
  window.registerModalManager = new RegisterModalManager();
});
