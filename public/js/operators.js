document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("add-operator-btn");
  const addModal = document.getElementById("add-operator-modal");
  const closeAdd = document.getElementById("close-add-modal");

  const editModal = document.getElementById("edit-operator-modal");
  const closeEdit = document.getElementById("close-edit-modal");

  // Open Add Modal
  if (addBtn && addModal) {
    addBtn.addEventListener("click", () => {
      addModal.classList.remove("hidden");
    });
  }

  if (closeAdd && addModal) {
    closeAdd.addEventListener("click", () => {
      addModal.classList.add("hidden");
    });
  }

  // Cancel button for Add Modal
  const closeAddBtn = document.getElementById("close-add-modal-btn");
  if (closeAddBtn && addModal) {
    closeAddBtn.addEventListener("click", () => {
      addModal.classList.add("hidden");
    });
  }

  // Cancel button for Edit Modal
  const closeEditBtn = document.getElementById("close-edit-modal-btn");
  if (closeEditBtn && editModal) {
    closeEditBtn.addEventListener("click", () => {
      editModal.classList.add("hidden");
    });
  }

  // Edit Buttons
  if (editModal) {
    document.querySelectorAll(".edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const name = button.dataset.name;
        const cnic = button.dataset.cnic;

        // Fill the edit form fields
        const form = editModal.querySelector("form");
        if (form) {
          const idInput = form.querySelector('input[name="id"]');
          const nameInput = form.querySelector('input[name="name"]');
          const cnicInput = form.querySelector('input[name="cnic"]');
          if (idInput) idInput.value = id;
          if (nameInput) nameInput.value = name;
          if (cnicInput) cnicInput.value = cnic;
          form.action = `/dashboard/operator/update/${id}`;
        }

        // Show the modal
        editModal.classList.remove("hidden");
      });
    });
  }

  if (closeEdit && editModal) {
    closeEdit.addEventListener("click", () => {
      editModal.classList.add("hidden");
    });
  }

  // Select All Checkbox
  const selectAll = document.getElementById("select-all");
  if (selectAll) {
    selectAll.addEventListener("change", (e) => {
      document.querySelectorAll(".row-checkbox").forEach((cb) => {
        cb.checked = e.target.checked;
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // ... existing code ...

  const deleteBtn = document.getElementById("delete-selected-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      const confirmed = await confirm(
        "Are you sure you want to delete the selected operators?"
      );
      if (!confirmed) return;

      const selected = Array.from(
        document.querySelectorAll(".row-checkbox:checked")
      ).map((cb) => cb.value);

      if (selected.length === 0) {
        Toast.show("Please select at least one operator.", "warning");
        return;
      }

      try {
        const res = await fetch("/dashboard/operator/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ selectedIds: selected }),
        });

        const data = await res.json();

        if (res.ok) {
          Toast.show("Selected operators deleted successfully.", "success");
          setTimeout(() => window.location.reload(), 1000); // reload to reflect changes
        } else {
          Toast.show(
            data.message || "An error occurred while deleting.",
            "error"
          );
        }
      } catch (err) {
        console.error(err);
        Toast.show("Request failed. Please try again.", "error");
      }
    });
  }
});
