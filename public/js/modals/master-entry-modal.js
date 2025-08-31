function openMasterEntryModal() {
    document.getElementById('masterEntryModal').classList.remove('hidden');
    // Reset form
    document.getElementById('masterEntryFormElement').reset();
}

function closeMasterEntryModal() {
    document.getElementById('masterEntryModal').classList.add('hidden');
    document.getElementById('masterEntryFormElement').reset();
}

// Handle master entry form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('masterEntryFormElement');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const entryData = {
                description: formData.get('description'),
                people_count: parseInt(formData.get('people_count'))
            };
            
            try {
                const response = await fetch('/api/master-entries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(entryData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccess('Master entry recorded successfully!');
                    closeMasterEntryModal();
                    // Optionally refresh the page or update the entries table
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showError(result.message || 'Failed to record master entry');
                }
            } catch (error) {
                console.error('Error recording master entry:', error);
                showError('Error recording master entry');
            }
        });
    }
});
