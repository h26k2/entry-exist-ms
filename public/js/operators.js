document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('add-operator-btn');
  const addModal = document.getElementById('add-operator-modal');
  const closeAdd = document.getElementById('close-add-modal');

  const editModal = document.getElementById('edit-operator-modal');
  const closeEdit = document.getElementById('close-edit-modal');

  // Open Add Modal
  addBtn.addEventListener('click', () => {
    addModal.classList.remove('hidden');
  });

  closeAdd.addEventListener('click', () => {
    addModal.classList.add('hidden');
  });

  // Edit Buttons
document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const name = button.dataset.name;
      const cnic = button.dataset.cnic;

      // Fill the edit form fields
      const form = editModal.querySelector('form');
      form.querySelector('input[name="id"]').value = id;
      form.querySelector('input[name="name"]').value = name;
      form.querySelector('input[name="cnic"]').value = cnic;

      // Dynamically set form action with ID
      form.action = `/dashboard/operator/update/${id}`;

      // Show the modal
      editModal.classList.remove('hidden');
    });
  });

  closeEdit.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  closeEdit.addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  // Select All Checkbox
  document.getElementById('select-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
    });
  });
});


document.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...

  const deleteBtn = document.getElementById('delete-selected-btn');

  deleteBtn?.addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to delete the selected operators?');
    if (!confirmed) return;

    const selected = Array.from(document.querySelectorAll('.row-checkbox:checked'))
      .map(cb => cb.value);

    if (selected.length === 0) {
      alert('Please select at least one operator.');
      return;
    }

    try {
      const res = await fetch('/dashboard/operator/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedIds: selected }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Selected operators deleted successfully.');
        window.location.reload(); // reload to reflect changes
      } else {
        alert(data.message || 'An error occurred while deleting.');
      }

    } catch (err) {
      console.error(err);
      alert('Request failed. Please try again.');
    }
  });
});
