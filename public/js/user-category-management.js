// User Category Management JS - Robust Controller Pattern
console.log("[UserCategoryController] JS loaded and running");
class UserCategoryController {
  constructor() {
    this.init();
  }

  init() {
    this.fetchCategories();
    // Remove all previous listeners for robustness
    const addForm = document.getElementById("addCategoryForm");
    if (addForm) {
      addForm.onsubmit = null;
      addForm.addEventListener("submit", this.handleAddCategory.bind(this));
    }

    const editForm = document.getElementById("editCategoryForm");
    if (editForm) {
      editForm.onsubmit = null;
      editForm.addEventListener("submit", this.handleEditCategory.bind(this));
    }
  }

  handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById("categoryName").value.trim();
    const description = document
      .getElementById("categoryDescription")
      .value.trim();
    if (!name) return false;
    // Debug log
    console.log("Submitting Add Category", { name, description });
    fetch("/api/user-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
      .then((res) => res.json())
      .then(() => {
        EnhancedModal.hide("add-user-category-modal");
        this.fetchCategories();
        document.getElementById("addCategoryForm").reset();
      });
    return false;
  }

  handleEditCategory(e) {
    e.preventDefault();
    const id = document.getElementById("editCategoryId").value;
    const name = document.getElementById("editCategoryName").value.trim();
    const description = document
      .getElementById("editCategoryDescription")
      .value.trim();
    if (!id || !name) return false;
    // Debug log
    console.log("Submitting Edit Category", { id, name, description });
    fetch(`/api/user-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
      .then((res) => res.json())
      .then(() => {
        EnhancedModal.hide("edit-user-category-modal");
        this.fetchCategories();
        document.getElementById("editCategoryForm").reset();
      });
    return false;
  }

  fetchCategories() {
    fetch("/api/user-categories")
      .then((res) => res.json())
      .then((result) => {
        // Accept either array or {data: array}
        const categories = Array.isArray(result) ? result : result.data || [];
        const tbody = document.getElementById("userCategoriesTableBody");
        tbody.innerHTML = "";
        categories.forEach((cat) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${cat.name}</td>
            <td>${cat.description || ""}</td>
            <td>
              <button class="btn btn-sm btn-info mr-2" data-id="${
                cat.id
              }" data-name="${cat.name}" data-description="${
            cat.description || ""
          }"><i class="fas fa-edit"></i> Edit</button>
              <button class="btn btn-sm btn-danger" data-id="${
                cat.id
              }"><i class="fas fa-trash"></i> Delete</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
        // Attach edit event listeners
        tbody.querySelectorAll(".btn-info").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = btn.getAttribute("data-id");
            const name = btn.getAttribute("data-name");
            const description = btn.getAttribute("data-description");
            this.openEditCategoryModal(id, name, description);
          });
        });
        // Attach delete event listeners
        tbody.querySelectorAll(".btn-danger").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = btn.getAttribute("data-id");
            this.deleteCategory(id);
          });
        });
      });
  }

  openEditCategoryModal(id, name, description) {
    document.getElementById("editCategoryId").value = id;
    document.getElementById("editCategoryName").value = name;
    document.getElementById("editCategoryDescription").value = description;
    EnhancedModal.show("edit-user-category-modal");
  }

  deleteCategory(id) {
    if (confirm("Are you sure you want to delete this category?")) {
      fetch(`/api/user-categories/${id}`, { method: "DELETE" })
        .then((res) => res.json())
        .then(() => {
          this.fetchCategories();
        });
    }
  }
}

window.UserCategoryControllerInstance = new UserCategoryController();
window.openAddCategoryModal = function () {
  window.UserCategoryControllerInstance.openAddCategoryModal();
};
window.closeAddCategoryModal = function () {
  window.UserCategoryControllerInstance.closeAddCategoryModal();
};
window.openEditCategoryModal = function () {
  window.UserCategoryControllerInstance.openEditCategoryModal();
};
window.closeEditCategoryModal = function () {
  window.UserCategoryControllerInstance.closeEditCategoryModal();
};
