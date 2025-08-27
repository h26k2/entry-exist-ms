function openGuestRegistrationModal() {
    document.getElementById('guestRegistrationModal').classList.remove('hidden');
    // Reset form
    document.getElementById('guestRegistrationForm').reset();
}

function closeGuestRegistrationModal() {
    document.getElementById('guestRegistrationModal').classList.add('hidden');
    document.getElementById('guestRegistrationForm').reset();
}

// Handle guest registration form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('guestRegistrationForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const guestData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                cnic_number: formData.get('cnic_number')
            };
            
            try {
                const response = await fetch('/api/guests/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(guestData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showSuccess('Guest registered successfully!');
                    closeGuestRegistrationModal();
                } else {
                    showError(result.message || 'Failed to register guest');
                }
            } catch (error) {
                console.error('Error registering guest:', error);
                showError('Error registering guest');
            }
        });
    }
});

// Format CNIC input
document.addEventListener('DOMContentLoaded', function() {
    const cnicInput = document.getElementById('guestCnic');
    if (cnicInput) {
        cnicInput.addEventListener('input', function(e) {
            // Remove non-numeric characters
            let value = e.target.value.replace(/[^0-9]/g, '');
            
            // Limit to 13 digits
            if (value.length > 13) {
                value = value.slice(0, 13);
            }
            
            e.target.value = value;
        });
    }
});
