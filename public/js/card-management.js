// Card Management JavaScript

class CardManagement {
  constructor() {
    this.currentPage = 1;
    this.currentLimit = 10;
    this.currentSearch = "";
    this.currentStatus = "";
    this.cards = [];
    this.stats = {};

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadStats();
    this.loadCards();
  }

  bindEvents() {
    // Search and filter events
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        this.debounce((e) => this.handleSearch(e.target.value), 300)
      );
    }

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", (e) =>
        this.handleStatusFilter(e.target.value)
      );
    }

    const limitSelect = document.getElementById("limitSelect");
    if (limitSelect) {
      limitSelect.addEventListener("change", (e) =>
        this.handleLimitChange(e.target.value)
      );
    }

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshData());
    }

    // Modal events
    const closeCardModal = document.getElementById("closeCardModal");
    if (closeCardModal) {
      closeCardModal.addEventListener("click", () =>
        this.closeCardDetailsModal()
      );
    }

    // Fix: Bind footer close button in card details modal
    const closeCardModalFooterBtn = document.getElementById(
      "closeCardModalFooter"
    );
    if (closeCardModalFooterBtn) {
      closeCardModalFooterBtn.addEventListener("click", () =>
        this.closeCardDetailsModal()
      );
    }

    const closeStatusModal = document.getElementById("closeStatusModal");
    if (closeStatusModal) {
      closeStatusModal.addEventListener("click", () => this.closeStatusModal());
    }

    const closeCreateCardModal = document.getElementById(
      "closeCreateCardModal"
    );
    if (closeCreateCardModal) {
      closeCreateCardModal.addEventListener("click", () =>
        this.closeCreateCardModal()
      );
    }

    const cancelStatusUpdate = document.getElementById("cancelStatusUpdate");
    if (cancelStatusUpdate) {
      cancelStatusUpdate.addEventListener("click", () =>
        this.closeStatusModal()
      );
    }

    const cancelCreateCard = document.getElementById("cancelCreateCard");
    if (cancelCreateCard) {
      cancelCreateCard.addEventListener("click", () =>
        this.closeCreateCardModal()
      );
    }

    // QR Viewer Modal events
    const closeQRViewer = document.getElementById("closeQRViewer");
    if (closeQRViewer) {
      closeQRViewer.addEventListener("click", () => this.closeQRViewer());
    }

    const downloadQRFromViewer = document.getElementById(
      "downloadQRFromViewer"
    );
    if (downloadQRFromViewer) {
      downloadQRFromViewer.addEventListener("click", () => {
        if (this.currentQRData) {
          this.downloadQR(
            this.currentQRData.imagePath,
            this.currentQRData.cardNumber
          );
        }
      });
    }

    const openQRInNewTab = document.getElementById("openQRInNewTab");
    if (openQRInNewTab) {
      openQRInNewTab.addEventListener("click", () => {
        if (this.currentQRData) {
          window.open(this.currentQRData.imagePath, "_blank");
        }
      });
    }

    // Form events
    const statusUpdateForm = document.getElementById("statusUpdateForm");
    if (statusUpdateForm) {
      statusUpdateForm.addEventListener("submit", (e) =>
        this.handleStatusUpdate(e)
      );
    }

    const createCardForm = document.getElementById("createCardForm");
    if (createCardForm) {
      createCardForm.addEventListener("submit", (e) =>
        this.handleCreateCard(e)
      );
    }

    // Person search
    const personSearch = document.getElementById("personSearch");
    if (personSearch) {
      personSearch.addEventListener(
        "input",
        this.debounce((e) => this.searchPeople(e.target.value), 300)
      );
    }

    // Click outside modal to close
    const cardDetailsModal = document.getElementById("cardDetailsModal");
    if (cardDetailsModal) {
      cardDetailsModal.addEventListener("click", (e) => {
        if (e.target.id === "cardDetailsModal") {
          this.closeCardDetailsModal();
        }
      });
    }

    const statusUpdateModal = document.getElementById("statusUpdateModal");
    if (statusUpdateModal) {
      statusUpdateModal.addEventListener("click", (e) => {
        if (e.target.id === "statusUpdateModal") {
          this.closeStatusModal();
        }
      });
    }

    const createCardModal = document.getElementById("createCardModal");
    if (createCardModal) {
      createCardModal.addEventListener("click", (e) => {
        if (e.target.id === "createCardModal") {
          this.closeCreateCardModal();
        }
      });
    }
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

  async loadStats() {
    try {
      console.log("Loading stats...");
      const response = await fetch("/cards/api/cards/stats");
      console.log("Stats response status:", response.status);

      const data = await response.json();
      console.log("Stats data:", data);

      if (data.success) {
        this.stats = data.stats;
        this.updateStatsDisplay();
      }
    } catch (error) {
      // console.error("Error loading stats:", error);
    }
  }

  updateStatsDisplay() {
    document.getElementById("totalCards").textContent =
      this.stats.total_cards || 0;
    document.getElementById("activeCards").textContent =
      this.stats.active_cards || 0;
    document.getElementById("uniquePeople").textContent =
      this.stats.unique_people || 0;
    // Show lost cards count directly from backend stats
    if (document.getElementById("lostCards")) {
      document.getElementById("lostCards").textContent =
        this.stats.lost_cards || 0;
    }
  }

  async loadCards() {
    try {
      this.showLoadingState();
      const params = new URLSearchParams({
        limit: this.currentLimit,
        search: this.currentSearch,
        status: this.currentStatus,
      });

      const response = await fetch(`/cards/api/cards?${params}`);
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        this.cards = data.cards;
        console.log("Cards loaded:", this.cards.length);
        this.renderCardsTable();
        this.updatePagination(data.pagination);
        this.hideLoadingState();

        if (this.cards.length === 0) {
          this.showEmptyState();
        } else {
          this.hideEmptyState();
        }
      } else {
        throw new Error(data.message || "Failed to load cards");
      }
    } catch (error) {
      // console.error("Error loading cards:", error);
      this.hideLoadingState();
      this.showToast("Error loading cards: " + error.message, "error");
    }
  }

  renderCardsTable() {
    const tbody = document.getElementById("cardsTableBody");

    if (this.cards.length === 0) {
      tbody.innerHTML = "";
      return;
    }

    tbody.innerHTML = this.cards
      .map(
        (card) => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${
                      card.card_number
                    }</div>
                    <div class="text-sm text-gray-500">Issued by: ${
                      card.issued_by_name || "Unknown"
                    }</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${
                      card.person_name
                    }</div>
                    <div class="text-sm text-gray-500">${card.cnic}</div>
                    ${
                      card.phone
                        ? `<div class="text-sm text-gray-500">${card.phone}</div>`
                        : ""
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">${
                      card.category_name || "No Category"
                    }</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="card-status-badge status-${card.status.toLowerCase()}">${
          card.status
        }</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${
                      card.qr_code_image_path
                        ? `<div class="relative group">
                            <img src="${card.qr_code_image_path}" alt="QR Code" class="qr-code-preview cursor-pointer" onclick="cardManagement.viewQRCode('${card.qr_code_image_path}', '${card.card_number}')">
                            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded">
                              <button onclick="cardManagement.downloadQR('${card.qr_code_image_path}', '${card.card_number}')" 
                                      class="text-white text-xs px-2 py-1 bg-purple-600 rounded hover:bg-purple-700" 
                                      title="Download QR Code">
                                <i class="fas fa-download mr-1"></i>Download
                              </button>
                            </div>
                          </div>`
                        : '<span class="text-gray-400 text-sm">No QR Code</span>'
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${new Date(card.issued_date).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="cardManagement.viewCardDetails(${
                          card.id
                        })" 
                                class="text-blue-600 hover:text-blue-900" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="cardManagement.openStatusModal(${
                          card.id
                        }, '${card.status}')" 
                                class="text-yellow-600 hover:text-yellow-900" title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                          card.qr_code_image_path
                            ? `<button onclick="cardManagement.downloadQR('${card.qr_code_image_path}', '${card.card_number}')" 
                                class="text-purple-600 hover:text-purple-900" title="Download QR Code">
                                <i class="fas fa-download"></i>
                              </button>`
                            : ""
                        }
                        <button onclick="cardManagement.regenerateQR(${
                          card.id
                        })" 
                                class="text-green-600 hover:text-green-900" title="Regenerate QR">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button onclick="cardManagement.deleteCard(${card.id})" 
                                class="text-red-600 hover:text-red-900" title="Delete Card">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
      )
      .join("");
  }

  updatePagination(pagination) {
    const { page, total, pages } = pagination;

    // Update results info
    const start = (page - 1) * this.currentLimit + 1;
    const end = Math.min(page * this.currentLimit, total);

    document.getElementById(
      "resultsInfo"
    ).textContent = `Showing ${start}-${end} of ${total} cards`;

    document.getElementById(
      "paginationInfo"
    ).textContent = `Page ${page} of ${pages}`;

    // Update pagination controls
    const controls = document.getElementById("paginationControls");
    controls.innerHTML = "";

    // Previous button
    if (page > 1) {
      const prevBtn = this.createPaginationButton("Previous", page - 1);
      controls.appendChild(prevBtn);
    }

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);

    if (startPage > 1) {
      controls.appendChild(this.createPaginationButton("1", 1));
      if (startPage > 2) {
        controls.appendChild(this.createPaginationSpan("..."));
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = this.createPaginationButton(i, i, i === page);
      controls.appendChild(btn);
    }

    if (endPage < pages) {
      if (endPage < pages - 1) {
        controls.appendChild(this.createPaginationSpan("..."));
      }
      controls.appendChild(this.createPaginationButton(pages, pages));
    }

    // Next button
    if (page < pages) {
      const nextBtn = this.createPaginationButton("Next", page + 1);
      controls.appendChild(nextBtn);
    }
  }

  createPaginationButton(text, pageNum, isActive = false) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = `px-3 py-2 text-sm font-medium rounded-md ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
    }`;
    button.onclick = () => this.goToPage(pageNum);
    return button;
  }

  createPaginationSpan(text) {
    const span = document.createElement("span");
    span.textContent = text;
    span.className = "px-3 py-2 text-sm font-medium text-gray-500";
    return span;
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadCards();
  }

  handleSearch(value) {
    this.currentPage = 1;
    this.currentSearch = value;
    this.loadCards();
  }

  handleStatusFilter(value) {
    this.currentStatus = value;
    this.currentPage = 1;
    this.loadCards();
  }

  handleLimitChange(value) {
    this.currentLimit = parseInt(value);
    this.loadCards();
  }

  refreshData() {
    this.loadStats();
    this.loadCards();
  }

  async viewCardDetails(cardId) {
    try {
      const response = await fetch(`/cards/api/cards/${cardId}`);
      const data = await response.json();

      if (data.success) {
        this.renderCardDetails(data.card);
        this.showCardDetailsModal();
      } else {
        throw new Error(data.message || "Failed to load card details");
      }
    } catch (error) {
      // console.error("Error loading card details:", error);
      this.showToast("Error loading card details: " + error.message, "error");
    }
  }

  renderCardDetails(card) {
    const content = document.getElementById("cardDetailsContent");
    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <i class="fas fa-id-card"></i> Card Info
          </h3>
          <ul class="space-y-2 text-sm text-gray-700">
            <li><span class="font-medium text-gray-900">Card Number:</span> ${
              card.card_number
            }</li>
            <li><span class="font-medium text-gray-900">Status:</span> <span class="card-status-badge status-${card.status.toLowerCase()}">${
      card.status
    }</span></li>
            <li><span class="font-medium text-gray-900">Issued Date:</span> ${new Date(
              card.issued_date
            ).toLocaleDateString()}</li>
            <li><span class="font-medium text-gray-900">Issued By:</span> ${
              card.issued_by_name || "Unknown"
            }</li>
            ${
              card.notes
                ? `<li><span class="font-medium text-gray-900">Notes:</span> ${card.notes}</li>`
                : ""
            }
            ${
              card.scan_count
                ? `<li><span class="font-medium text-gray-900">Scan Count:</span> ${card.scan_count}</li>`
                : ""
            }
            ${
              card.last_scanned_at
                ? `<li><span class="font-medium text-gray-900">Last Scanned:</span> ${new Date(
                    card.last_scanned_at
                  ).toLocaleString()}</li>`
                : ""
            }
          </ul>
        </div>
        <div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <i class="fas fa-user"></i> Person Info
          </h3>
          <ul class="space-y-2 text-sm text-gray-700">
            <li><span class="font-medium text-gray-900">Name:</span> ${
              card.person_name
            }</li>
            <li><span class="font-medium text-gray-900">CNIC:</span> ${
              card.cnic
            }</li>
            ${
              card.phone
                ? `<li><span class="font-medium text-gray-900">Phone:</span> ${card.phone}</li>`
                : ""
            }
            ${
              card.address
                ? `<li><span class="font-medium text-gray-900">Address:</span> ${card.address}</li>`
                : ""
            }
            ${
              card.emergency_contact
                ? `<li><span class="font-medium text-gray-900">Emergency Contact:</span> ${card.emergency_contact}</li>`
                : ""
            }
            <li><span class="font-medium text-gray-900">Category:</span> ${
              card.category_name || "No Category"
            }</li>
          </ul>
        </div>
      </div>
      ${
        card.qr_code_image_path
          ? `
        <div class="text-center mt-8">
          <img src="${card.qr_code_image_path}" alt="QR Code" class="mx-auto mb-4 max-w-[120px] rounded-lg border border-gray-200" />
          <button onclick="cardManagement.downloadQR('${card.qr_code_image_path}', '${card.card_number}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
            <i class="fas fa-download mr-2"></i>Download QR
          </button>
        </div>
      `
          : ""
      }
    `;
  }

  showCardDetailsModal() {
    document.getElementById("cardDetailsModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  closeCardDetailsModal() {
    document.getElementById("cardDetailsModal").classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  openStatusModal(cardId, currentStatus) {
    document.getElementById("updateCardId").value = cardId;
    document.getElementById("newStatus").value = currentStatus;
    document.getElementById("statusNotes").value = "";
    this.showStatusModal();
  }

  showStatusModal() {
    document.getElementById("statusUpdateModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  closeStatusModal() {
    document.getElementById("statusUpdateModal").classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  async handleStatusUpdate(e) {
    e.preventDefault();

    const cardId = document.getElementById("updateCardId").value;
    const status = document.getElementById("newStatus").value;
    const notes = document.getElementById("statusNotes").value;

    try {
      const response = await fetch(`/cards/api/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });

      const data = await response.json();

      if (data.success) {
        this.showToast("Card status updated successfully", "success");
        this.closeStatusModal();
        this.loadCards();
        this.loadStats();
      } else {
        throw new Error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      this.showToast("Error updating status: " + error.message, "error");
    }
  }

  async regenerateQR(cardId) {
    if (
      !confirm("Are you sure you want to regenerate the QR code for this card?")
    ) {
      return;
    }

    try {
      // Correct endpoint for QR regeneration
      const response = await fetch(`/cards/api/cards/regenerate/${cardId}`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        this.showToast("QR code regenerated successfully", "success");
        this.loadCards();
      } else {
        throw new Error(data.message || "Failed to regenerate QR code");
      }
    } catch (error) {
      console.error("Error regenerating QR code:", error);
      this.showToast("Error regenerating QR code: " + error.message, "error");
    }
  }

  async deleteCard(cardId) {
    if (
      !confirm(
        "Are you sure you want to delete this card? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/cards/api/cards/${cardId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        this.showToast("Card deleted successfully", "success");
        this.loadCards();
        this.loadStats();
      } else {
        throw new Error(data.message || "Failed to delete card");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      this.showToast("Error deleting card: " + error.message, "error");
    }
  }

  viewQRCode(imagePath, cardNumber = null) {
    // Find card details if cardNumber not provided
    if (!cardNumber) {
      const card = this.cards.find((c) => c.qr_code_image_path === imagePath);
      cardNumber = card ? card.card_number : "Unknown";
    }

    // Set modal content
    document.getElementById("qrViewerImage").src = imagePath;
    document.getElementById(
      "qrViewerCardNumber"
    ).textContent = `Card: ${cardNumber}`;

    // Store current QR data for download
    this.currentQRData = { imagePath, cardNumber };

    // Show modal
    document.getElementById("qrViewerModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  closeQRViewer() {
    document.getElementById("qrViewerModal").classList.add("hidden");
    document.body.style.overflow = "";
    this.currentQRData = null;
  }

  downloadQR(imagePath, cardNumber) {
    const link = document.createElement("a");
    link.href = imagePath;
    link.download = `QR_${cardNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast("QR Code downloaded successfully", "success");
  }

  // Download all QR codes as individual files
  async downloadAllQRCodes() {
    try {
      // Get all cards with QR codes
      const cardsWithQR = this.cards.filter((card) => card.qr_code_image_path);

      if (cardsWithQR.length === 0) {
        this.showToast("No QR codes available to download", "warning");
        return;
      }

      // Show loading toast
      this.showToast(`Downloading ${cardsWithQR.length} QR codes...`, "info");

      // Download each QR code individually with a small delay
      for (let i = 0; i < cardsWithQR.length; i++) {
        const card = cardsWithQR[i];
        setTimeout(() => {
          this.downloadQR(card.qr_code_image_path, card.card_number);
        }, i * 200); // 200ms delay between downloads
      }

      setTimeout(() => {
        this.showToast(
          `All ${cardsWithQR.length} QR codes downloaded successfully!`,
          "success"
        );
      }, cardsWithQR.length * 200 + 500);
    } catch (error) {
      console.error("Error downloading QR codes:", error);
      this.showToast("Error downloading QR codes: " + error.message, "error");
    }
  }

  // Enhanced download with progress for bulk operations
  async downloadQRCodesAsZip() {
    try {
      // Check if JSZip is available
      if (typeof JSZip === "undefined") {
        // Fallback to individual downloads
        this.downloadAllQRCodes();
        return;
      }

      const cardsWithQR = this.cards.filter((card) => card.qr_code_image_path);

      if (cardsWithQR.length === 0) {
        this.showToast("No QR codes available to download", "warning");
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder("QR_Codes");

      this.showToast("Preparing QR codes for download...", "info");

      // Create promises for all image downloads
      const imagePromises = cardsWithQR.map(async (card) => {
        try {
          const response = await fetch(card.qr_code_image_path);
          const blob = await response.blob();
          const fileName = `QR_${card.card_number}_${
            card.person_name?.replace(/[^a-zA-Z0-9]/g, "_") || "Unknown"
          }.png`;
          folder.file(fileName, blob);
          return { success: true, fileName };
        } catch (error) {
          console.error(
            `Error downloading QR for card ${card.card_number}:`,
            error
          );
          return {
            success: false,
            fileName: `QR_${card.card_number}.png`,
            error,
          };
        }
      });

      // Wait for all downloads to complete
      const results = await Promise.all(imagePromises);
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (successful === 0) {
        this.showToast("Failed to download any QR codes", "error");
        return;
      }

      // Generate ZIP file
      this.showToast("Creating ZIP file...", "info");
      const content = await zip.generateAsync({ type: "blob" });

      // Download ZIP file
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `QR_Codes_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      let message = `Downloaded ${successful} QR codes successfully!`;
      if (failed > 0) {
        message += ` (${failed} failed)`;
      }
      this.showToast(message, successful > 0 ? "success" : "warning");
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      this.showToast(
        "Error creating ZIP file. Downloading individually...",
        "warning"
      );
      // Fallback to individual downloads
      this.downloadAllQRCodes();
    }
  }

  // Create Card Modal Methods
  openCreateCardModal() {
    const modal = document.getElementById("createCardModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex", "items-center", "justify-center");
      document.body.style.overflow = "hidden";

      // Reset form
      document.getElementById("createCardForm").reset();
      document.getElementById("selectedPersonId").value = "";
      document.getElementById("selectedPersonInfo").classList.add("hidden");
      document.getElementById("personSearchResults").classList.add("hidden");
      document.getElementById("createCardBtn").disabled = true;
    }
  }

  closeCreateCardModal() {
    document.getElementById("createCardModal").classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  async searchPeople(query) {
    if (!query || query.length < 2) {
      document.getElementById("personSearchResults").classList.add("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/api/people/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.success && data.people) {
        this.renderPersonSearchResults(data.people);
      } else {
        this.renderPersonSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching people:", error);
      this.renderPersonSearchResults([]);
    }
  }

  renderPersonSearchResults(people) {
    const resultsContainer = document.getElementById("personSearchResults");

    if (people.length === 0) {
      resultsContainer.innerHTML =
        '<div class="text-sm text-gray-500 p-2">No people found</div>';
      resultsContainer.classList.remove("hidden");
      return;
    }

    resultsContainer.innerHTML = people
      .map(
        (person) => `
      <div class="cursor-pointer hover:bg-gray-50 p-2 border-b border-gray-200 last:border-b-0" 
           onclick="cardManagement.selectPerson(${person.id}, '${
          person.name
        }', '${person.cnic}', '${person.phone || ""}', '${
          person.category_name || "No Category"
        }')">
        <div class="font-medium text-gray-900">${person.name}</div>
        <div class="text-sm text-gray-600">${person.cnic} • ${
          person.category_name || "No Category"
        }</div>
        ${
          person.phone
            ? `<div class="text-sm text-gray-500">${person.phone}</div>`
            : ""
        }
        ${
          person.card_number
            ? `<div class="text-xs text-red-600 mt-1">⚠️ Already has card: ${person.card_number}</div>`
            : ""
        }
      </div>
    `
      )
      .join("");

    resultsContainer.classList.remove("hidden");
  }

  selectPerson(id, name, cnic, phone, category) {
    document.getElementById("selectedPersonId").value = id;
    document.getElementById("personDetails").innerHTML = `
      <div class="text-sm">
        <div><strong>Name:</strong> ${name}</div>
        <div><strong>CNIC:</strong> ${cnic}</div>
        ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ""}
        <div><strong>Category:</strong> ${category}</div>
      </div>
    `;

    document.getElementById("selectedPersonInfo").classList.remove("hidden");
    document.getElementById("personSearchResults").classList.add("hidden");
    document.getElementById("createCardBtn").disabled = false;
    document.getElementById("personSearch").value = `${name} (${cnic})`;
  }

  async handleCreateCard(e) {
    e.preventDefault();

    const personId = document.getElementById("selectedPersonId").value;
    const notes = document.getElementById("cardNotes").value;

    if (!personId) {
      this.showToast("Please select a person first", "error");
      return;
    }

    try {
      const response = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: personId,
          notes: notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.showToast("Card created successfully!", "success");
        this.closeCreateCardModal();
        this.loadCards();
        this.loadStats();
      } else {
        throw new Error(data.message || "Failed to create card");
      }
    } catch (error) {
      console.error("Error creating card:", error);
      this.showToast("Error creating card: " + error.message, "error");
    }
  }

  showLoadingState() {
    document.getElementById("loadingState").classList.remove("hidden");
    document.getElementById("cardsTableBody").innerHTML = "";
  }

  hideLoadingState() {
    document.getElementById("loadingState").classList.add("hidden");
  }

  showEmptyState() {
    document.getElementById("emptyState").classList.remove("hidden");
  }

  hideEmptyState() {
    document.getElementById("emptyState").classList.add("hidden");
  }

  showToast(message, type = "info") {
    // Use the existing toast functionality
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      // Fallback alert if toast is not available
      alert(message);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.cardManagement = new CardManagement();
});

// Global functions for HTML onclick handlers
function openCreateCardModal() {
  if (window.cardManagement) {
    window.cardManagement.openCreateCardModal();
  }
}
