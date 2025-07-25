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
