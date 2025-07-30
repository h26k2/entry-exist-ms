// Bulk Import Modal Management
class BulkImportModal {
  constructor() {
    this.modalId = "bulkImportModal";
    this.formId = "bulkImportForm";
    this.setupEventListeners();
  }

  // Open the modal
  open() {
    this.resetForm();
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

  // Reset form to initial state
  resetForm() {
    const form = document.getElementById(this.formId);
    if (form) {
      form.reset();
    }

    // Reset any custom validation messages
    this.clearFileValidation();
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById(this.formId);
      if (form) {
        form.addEventListener("submit", this.handleFormSubmit.bind(this));
      }

      // File input validation
      const fileInput = document.getElementById("csvFile");
      if (fileInput) {
        fileInput.addEventListener("change", this.validateFile.bind(this));
      }
    });
  }

  // Validate selected file
  validateFile(e) {
    const file = e.target.files[0];
    const messageContainer = this.getOrCreateFileMessage();

    if (!file) {
      this.clearFileValidation();
      return;
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      this.showFileError("Please select a CSV file (.csv extension required)");
      e.target.value = "";
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.showFileError("File size must be less than 5MB");
      e.target.value = "";
      return;
    }

    // Show file info
    this.showFileSuccess(
      `Selected: ${file.name} (${this.formatFileSize(file.size)})`
    );

    // Preview file contents
    this.previewFile(file);
  }

  // Preview CSV file contents
  previewFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split("\n").slice(0, 3); // First 3 lines

      if (lines.length > 0) {
        const preview = lines.join("\n");
        this.showFilePreview(preview);
      }
    };
    reader.readAsText(file);
  }

  // Show file preview
  showFilePreview(preview) {
    const container = document.querySelector("#bulkImportModal .modal-body");
    let previewDiv = container.querySelector(".file-preview");

    if (!previewDiv) {
      previewDiv = document.createElement("div");
      previewDiv.className =
        "file-preview mt-4 p-4 bg-gray-50 rounded-lg border";
      container.appendChild(previewDiv);
    }

    previewDiv.innerHTML = `
      <h5 class="font-semibold text-gray-900 mb-2">File Preview:</h5>
      <pre class="text-sm text-gray-700 font-mono whitespace-pre-wrap overflow-x-auto">${preview}</pre>
      <p class="text-xs text-gray-500 mt-2">Showing first 3 lines of the file</p>
    `;
  }

  // Handle form submission
  async handleFormSubmit(e) {
    e.preventDefault();

    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];

    if (!file) {
      Toast.show("Please select a CSV file", "error");
      return;
    }

    const formData = new FormData();
    formData.append("csvFile", file);
    formData.append(
      "generateCards",
      document.getElementById("generateCardsForAll").checked ? "1" : "0"
    );

    // Show loading state
    this.showLoading();

    try {
      const response = await fetch("/api/bulk-import-people", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        this.showSuccess(result);
        setTimeout(() => {
          this.hide();
          if (typeof loadPeopleData === "function") loadPeopleData();
          if (typeof loadPeopleStats === "function") loadPeopleStats();
        }, 3000);
      } else {
        this.showError(result.message || "Import failed", result.errors);
      }
    } catch (error) {
      console.error("Error:", error);
      this.showError("Network error occurred. Please try again.");
    }
  }

  // Show loading state
  showLoading() {
    const submitButton = document.querySelector(
      '#bulkImportForm button[type="submit"]'
    );
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Importing...';
    }

    this.showImportStatus("Uploading and processing file...", "info");
  }

  // Show success message
  showSuccess(result) {
    const submitButton = document.querySelector(
      '#bulkImportForm button[type="submit"]'
    );
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        '<i class="fas fa-upload mr-2"></i>Import People';
    }

    let message = `Successfully imported ${result.imported || 0} people`;
    if (result.cards_generated > 0) {
      message += ` and generated ${result.cards_generated} ID cards`;
    }
    if (result.skipped > 0) {
      message += `. ${result.skipped} records were skipped due to duplicates or errors`;
    }

    this.showImportStatus(message, "success");
    Toast.show(message, "success");
  }

  // Show error message
  showError(message, errors = null) {
    const submitButton = document.querySelector(
      '#bulkImportForm button[type="submit"]'
    );
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        '<i class="fas fa-upload mr-2"></i>Import People';
    }

    let fullMessage = message;
    if (errors && errors.length > 0) {
      fullMessage += "\n\nErrors:\n" + errors.join("\n");
    }

    this.showImportStatus(fullMessage, "error");
    Toast.show(message, "error");
  }

  // Show import status
  showImportStatus(message, type) {
    const container = document.querySelector("#bulkImportModal .modal-body");
    let statusDiv = container.querySelector(".import-status");

    if (!statusDiv) {
      statusDiv = document.createElement("div");
      statusDiv.className = "import-status mt-4";
      container.appendChild(statusDiv);
    }

    const bgColor =
      {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
      }[type] || "bg-gray-50 border-gray-200 text-gray-800";

    const icon =
      {
        info: "fa-info-circle",
        success: "fa-check-circle",
        error: "fa-exclamation-triangle",
      }[type] || "fa-info-circle";

    statusDiv.innerHTML = `
      <div class="p-4 rounded-lg border ${bgColor}">
        <div class="flex items-start">
          <i class="fas ${icon} mr-3 mt-1"></i>
          <div class="flex-1">
            <pre class="whitespace-pre-wrap text-sm font-medium">${message}</pre>
          </div>
        </div>
      </div>
    `;
  }

  // File validation helpers
  getOrCreateFileMessage() {
    const fileInput = document.getElementById("csvFile");
    let messageDiv = fileInput.parentNode.querySelector(".file-message");

    if (!messageDiv) {
      messageDiv = document.createElement("div");
      messageDiv.className = "file-message mt-2";
      fileInput.parentNode.appendChild(messageDiv);
    }

    return messageDiv;
  }

  showFileError(message) {
    const messageDiv = this.getOrCreateFileMessage();
    messageDiv.innerHTML = `
      <p class="text-sm text-red-600 flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
      </p>
    `;
  }

  showFileSuccess(message) {
    const messageDiv = this.getOrCreateFileMessage();
    messageDiv.innerHTML = `
      <p class="text-sm text-green-600 flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        ${message}
      </p>
    `;
  }

  clearFileValidation() {
    const messageDiv = document
      .querySelector("#csvFile")
      .parentNode.querySelector(".file-message");
    if (messageDiv) {
      messageDiv.innerHTML = "";
    }

    // Clear preview
    const previewDiv = document.querySelector("#bulkImportModal .file-preview");
    if (previewDiv) {
      previewDiv.remove();
    }

    // Clear status
    const statusDiv = document.querySelector("#bulkImportModal .import-status");
    if (statusDiv) {
      statusDiv.remove();
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Download sample CSV template
  downloadTemplate() {
    const csvContent = `CNIC,Name,Phone,Address,Category,Emergency Contact
1234567890123,John Doe,03001234567,123 Main Street,Paid,03009876543
9876543210987,Jane Smith,03119876543,456 Oak Avenue,Civilian,03001234567
5555666677778,Bob Johnson,03212345678,789 Pine Road,Staff,03456789012`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "people_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Toast.show("Template downloaded successfully!", "success");
  }
}

// Create global instance
const bulkImportModal = new BulkImportModal();

// Global functions for compatibility
function openBulkImportModal() {
  bulkImportModal.open();
}

function closeBulkImportModal() {
  bulkImportModal.hide();
}

function downloadImportTemplate() {
  bulkImportModal.downloadTemplate();
}
