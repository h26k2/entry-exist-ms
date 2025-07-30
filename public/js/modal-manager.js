/**
 * Enhanced Modal Management System
 * Provides consistent modal behavior across the application
 */

class ModalManager {
  constructor() {
    this.activeModals = new Set();
    this.init();
  }

  init() {
    // Close modals when clicking outside
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        this.closeTopModal();
      }
    });

    // Close modals with escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeTopModal();
      }
    });

    // Prevent body scroll when modal is open
    this.initScrollLock();
  }

  /**
   * Show a modal
   * @param {string} modalId - The ID of the modal to show
   * @param {Object} options - Optional configuration
   */
  show(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with ID '${modalId}' not found`);
      return;
    }

    // Add modal to active set
    this.activeModals.add(modalId);

    // Show modal
    modal.classList.remove("hidden");
    modal.classList.add("flex");

    // Add animation class if specified
    if (options.animate !== false) {
      const container = modal.querySelector(".modal-container");
      if (container) {
        container.classList.add("modal-enter");
        setTimeout(() => {
          container.classList.remove("modal-enter");
        }, 300);
      }
    }

    // Lock body scroll
    this.lockBodyScroll();

    // Focus first input or button
    setTimeout(() => {
      const firstFocusable = modal.querySelector(
        "input, select, textarea, button"
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);

    // Trigger custom event
    modal.dispatchEvent(
      new CustomEvent("modal:shown", { detail: { modalId, options } })
    );
  }

  /**
   * Hide a modal
   * @param {string} modalId - The ID of the modal to hide
   * @param {Object} options - Optional configuration
   */
  hide(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Modal with ID '${modalId}' not found`);
      return;
    }

    // Remove from active set
    this.activeModals.delete(modalId);

    // Add exit animation if specified
    if (options.animate !== false) {
      const container = modal.querySelector(".modal-container");
      if (container) {
        container.classList.add("modal-exit");
        setTimeout(() => {
          modal.classList.add("hidden");
          modal.classList.remove("flex");
          container.classList.remove("modal-exit");
        }, 300);
      } else {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    } else {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }

    // Unlock body scroll if no more modals
    if (this.activeModals.size === 0) {
      this.unlockBodyScroll();
    }

    // Clear form if specified
    if (options.clearForm !== false) {
      const form = modal.querySelector("form");
      if (form) {
        form.reset();
      }
    }

    // Trigger custom event
    modal.dispatchEvent(
      new CustomEvent("modal:hidden", { detail: { modalId, options } })
    );
  }

  /**
   * Close the topmost modal
   */
  closeTopModal() {
    if (this.activeModals.size > 0) {
      const lastModal = Array.from(this.activeModals).pop();
      this.hide(lastModal);
    }
  }

  /**
   * Close all modals
   */
  closeAll() {
    Array.from(this.activeModals).forEach((modalId) => {
      this.hide(modalId, { animate: false });
    });
  }

  /**
   * Check if a modal is currently visible
   * @param {string} modalId - The ID of the modal to check
   */
  isVisible(modalId) {
    return this.activeModals.has(modalId);
  }

  /**
   * Get the count of active modals
   */
  getActiveCount() {
    return this.activeModals.size;
  }

  /**
   * Lock body scroll
   */
  lockBodyScroll() {
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
  }

  /**
   * Unlock body scroll
   */
  unlockBodyScroll() {
    document.body.style.overflow = "";
    document.body.classList.remove("modal-open");
  }

  /**
   * Initialize scroll lock behavior
   */
  initScrollLock() {
    // Add CSS for modal-open class
    const style = document.createElement("style");
    style.textContent = `
      .modal-open {
        padding-right: var(--scrollbar-width, 0px);
      }
    `;
    document.head.appendChild(style);

    // Calculate scrollbar width
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty(
      "--scrollbar-width",
      `${scrollbarWidth}px`
    );
  }

  /**
   * Utility method to populate modal with data
   * @param {string} modalId - The ID of the modal
   * @param {Object} data - Data to populate the modal with
   */
  populateModal(modalId, data) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    Object.keys(data).forEach((key) => {
      const element = modal.querySelector(
        `[name="${key}"], #${key}, [data-field="${key}"]`
      );
      if (element) {
        if (element.type === "checkbox" || element.type === "radio") {
          element.checked = data[key];
        } else if (element.tagName === "SELECT") {
          element.value = data[key];
        } else if (element.tagName === "IMG") {
          element.src = data[key];
        } else {
          element.textContent = data[key];
          if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.value = data[key];
          }
        }
      }
    });
  }

  /**
   * Show a confirmation modal
   * @param {Object} options - Configuration options
   */
  confirm(options = {}) {
    const {
      title = "Confirm Action",
      message = "Are you sure you want to continue?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      onConfirm = () => {},
      onCancel = () => {},
      type = "warning", // warning, danger, info
    } = options;

    // Create or get confirmation modal
    let confirmModal = document.getElementById("confirm-modal");
    if (!confirmModal) {
      confirmModal = this.createConfirmModal();
    }

    // Populate modal
    confirmModal.querySelector('[data-field="title"]').textContent = title;
    confirmModal.querySelector('[data-field="message"]').textContent = message;
    confirmModal.querySelector('[data-field="confirm-btn"]').textContent =
      confirmText;
    confirmModal.querySelector('[data-field="cancel-btn"]').textContent =
      cancelText;

    // Set up event listeners
    const confirmBtn = confirmModal.querySelector('[data-field="confirm-btn"]');
    const cancelBtn = confirmModal.querySelector('[data-field="cancel-btn"]');

    // Remove old listeners
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));

    // Add new listeners
    confirmModal
      .querySelector('[data-field="confirm-btn"]')
      .addEventListener("click", () => {
        this.hide("confirm-modal");
        onConfirm();
      });

    confirmModal
      .querySelector('[data-field="cancel-btn"]')
      .addEventListener("click", () => {
        this.hide("confirm-modal");
        onCancel();
      });

    // Apply type styling
    const iconEl = confirmModal.querySelector('[data-field="icon"]');
    const icons = {
      warning: "fas fa-exclamation-triangle text-yellow-500",
      danger: "fas fa-exclamation-circle text-red-500",
      info: "fas fa-info-circle text-blue-500",
    };
    iconEl.className = icons[type] || icons.warning;

    this.show("confirm-modal");
  }

  /**
   * Create a confirmation modal dynamically
   */
  createConfirmModal() {
    const modalHTML = `
      <div id="confirm-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50 modal-overlay">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full modal-container">
            <div class="p-6">
              <div class="flex items-center mb-4">
                <i data-field="icon" class="fas fa-exclamation-triangle text-yellow-500 text-2xl mr-3"></i>
                <h3 data-field="title" class="text-lg font-semibold text-gray-900">Confirm Action</h3>
              </div>
              <p data-field="message" class="text-gray-600 mb-6">Are you sure you want to continue?</p>
              <div class="flex justify-end space-x-3">
                <button data-field="cancel-btn" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                  Cancel
                </button>
                <button data-field="confirm-btn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    return document.getElementById("confirm-modal");
  }
}

// Create global instance
const modalManager = new ModalManager();

// Global convenience functions for backward compatibility
window.showModal = (modalId, options) => modalManager.show(modalId, options);
window.hideModal = (modalId, options) => modalManager.hide(modalId, options);
window.closeAllModals = () => modalManager.closeAll();
window.confirmAction = (options) => modalManager.confirm(options);

// Export for ES6 modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ModalManager;
}

// Also expose on window for global access
window.ModalManager = ModalManager;
window.modalManager = modalManager;
