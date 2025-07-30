// Person Details Modal Management
class PersonDetailsModal {
  constructor() {
    this.modalId = "personDetailsModal";
    this.contentId = "personDetailsContent";
  }

  // View person details
  async view(personId) {
    try {
      const response = await fetch(`/api/person-details/${personId}`);
      const data = await response.json();

      if (data.success) {
        this.displayDetails(data);
        this.show();
      } else {
        Toast.show(data.message || "Failed to load person details", "error");
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

  // Display person details
  displayDetails(data) {
    const container = document.getElementById(this.contentId);
    if (!container) return;

    const person = data.person;

    let html = `
      <div class="person-details space-y-6">
        <!-- Personal Information -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <i class="fas fa-user text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-blue-900">Personal Information</h3>
              <p class="text-sm text-blue-700">Basic details and contact information</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="detail-row">
              <span class="detail-label font-semibold text-gray-700 block mb-2">Full Name</span>
              <span class="detail-value text-gray-900 bg-white px-4 py-3 rounded-lg border">${
                person.name
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label font-semibold text-gray-700 block mb-2">CNIC Number</span>
              <span class="detail-value text-gray-900 bg-white px-4 py-3 rounded-lg border font-mono">${
                person.cnic
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label font-semibold text-gray-700 block mb-2">Category</span>
              <span class="detail-value text-gray-900 bg-white px-4 py-3 rounded-lg border">${
                person.category_name || "N/A"
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label font-semibold text-gray-700 block mb-2">Phone Number</span>
              <span class="detail-value text-gray-900 bg-white px-4 py-3 rounded-lg border">${
                person.phone || "N/A"
              }</span>
            </div>
            <div class="detail-row md:col-span-2">
              <span class="detail-label font-semibold text-gray-700 block mb-2">Address</span>
              <span class="detail-value text-gray-900 bg-white px-4 py-3 rounded-lg border">${
                person.address || "N/A"
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label font-semibold text-gray-700 block mb-2">Emergency Contact</span>
              <span class="detail-value text-gray-900 bg-white px-4 py-3 rounded-lg border">${
                person.emergency_contact || "N/A"
              }</span>
            </div>
            <div class="detail-row">
              <span class="detail-label font-semibold text-gray-700 block mb-2">Registration Date</span>
              <span class="detail-value text-gray-900 bg-white px-4 py-3 rounded-lg border">${new Date(
                person.created_at
              ).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <!-- Card Information -->
        <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <i class="fas fa-id-card text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-green-900">ID Card Status</h3>
              <p class="text-sm text-green-700">Card number and generation status</p>
            </div>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <span class="detail-label font-semibold text-gray-700 block mb-2">Card Number</span>
              ${
                person.card_number
                  ? `
                <span class="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                  <i class="fas fa-id-card mr-2"></i>${person.card_number}
                </span>
              `
                  : `
                <span class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full">
                  <i class="fas fa-times mr-2"></i>No Card Generated
                </span>
              `
              }
            </div>
            ${
              !person.card_number
                ? `
              <button onclick="generateCard(${person.id})" class="btn btn-primary">
                <i class="fas fa-id-card mr-2"></i>Generate Card
              </button>
            `
                : ""
            }
          </div>
        </div>
    `;

    // Family Information
    if (
      person.is_family_member ||
      (data.familyMembers && data.familyMembers.length > 0)
    ) {
      html += `
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <i class="fas fa-users text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-purple-900">Family Information</h3>
              <p class="text-sm text-purple-700">Family relationships and members</p>
            </div>
          </div>
          
          ${
            person.is_family_member
              ? `
            <div class="mb-4 p-4 bg-purple-100 rounded-lg">
              <p class="text-purple-800 font-medium">
                <i class="fas fa-info-circle mr-2"></i>
                This person is a family member of another registered person.
              </p>
            </div>
          `
              : ""
          }

          ${
            data.familyMembers && data.familyMembers.length > 0
              ? `
            <div class="family-members-section">
              <h4 class="text-lg font-semibold text-purple-900 mb-4">
                Family Members (${data.familyMembers.length})
              </h4>
              <div class="space-y-3">
                ${data.familyMembers
                  .map(
                    (member) => `
                  <div class="family-member-item bg-white p-4 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h5 class="font-semibold text-gray-900 mb-2">${
                          member.name
                        }</h5>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span class="font-medium">CNIC:</span> ${
                              member.cnic
                            }
                          </div>
                          <div>
                            <span class="font-medium">Phone:</span> ${
                              member.phone || "N/A"
                            }
                          </div>
                          <div>
                            <span class="font-medium">Card:</span> 
                            ${
                              member.card_number
                                ? `
                              <span class="text-green-600">${member.card_number}</span>
                            `
                                : `
                              <span class="text-gray-400">No Card</span>
                            `
                            }
                          </div>
                        </div>
                      </div>
                      <div class="ml-4 space-x-2">
                        <button onclick="viewPersonDetails(${
                          member.id
                        })" class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editPerson(${
                          member.id
                        })" class="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                          <i class="fas fa-edit"></i>
                        </button>
                        ${
                          !member.card_number
                            ? `
                          <button onclick="generateCard(${member.id})" class="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded-lg transition-colors" title="Generate Card">
                            <i class="fas fa-id-card"></i>
                          </button>
                        `
                            : ""
                        }
                      </div>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          ${
            !person.is_family_member
              ? `
            <div class="mt-4">
              <button onclick="addFamilyMember(${person.id})" class="btn btn-secondary">
                <i class="fas fa-user-plus mr-2"></i>Add Family Member
              </button>
            </div>
          `
              : ""
          }
        </div>
      `;
    }

    // Entry History (if available)
    if (data.recentEntries && data.recentEntries.length > 0) {
      html += `
        <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
          <div class="flex items-center space-x-3 mb-6">
            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <i class="fas fa-history text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-orange-900">Recent Entry History</h3>
              <p class="text-sm text-orange-700">Last 5 entry/exit records</p>
            </div>
          </div>
          
          <div class="space-y-3">
            ${data.recentEntries
              .slice(0, 5)
              .map(
                (entry) => `
              <div class="entry-item bg-white p-4 rounded-lg border border-orange-200">
                <div class="flex justify-between items-center">
                  <div class="flex items-center space-x-4">
                    <div class="w-8 h-8 ${
                      entry.entry_type === "ENTRY"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    } rounded-full flex items-center justify-center">
                      <i class="fas fa-${
                        entry.entry_type === "ENTRY"
                          ? "sign-in-alt"
                          : "sign-out-alt"
                      } text-sm"></i>
                    </div>
                    <div>
                      <span class="font-medium ${
                        entry.entry_type === "ENTRY"
                          ? "text-green-800"
                          : "text-red-800"
                      }">${
                  typeof entry.entry_type === "string"
                    ? entry.entry_type
                    : "UNKNOWN"
                }</span>
                      <div class="text-sm text-gray-600">${
                        entry.facility_name || "Unknown Facility"
                      }</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900">${new Date(
                      entry.entry_time
                    ).toLocaleDateString()}</div>
                    <div class="text-xs text-gray-500">${new Date(
                      entry.entry_time
                    ).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    // Additional Information
    if (person.remarks) {
      html += `
        <div class="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
              <i class="fas fa-comment text-white"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Additional Notes</h3>
          </div>
          <div class="bg-white p-4 rounded-lg border text-gray-900">
            ${person.remarks}
          </div>
        </div>
      `;
    }

    html += "</div>";
    container.innerHTML = html;
  }
}

// Create global instance
const personDetailsModal = new PersonDetailsModal();

// Global functions for compatibility
function viewPersonDetails(personId) {
  personDetailsModal.view(personId);
}

function closePersonDetailsModal() {
  personDetailsModal.hide();
}
