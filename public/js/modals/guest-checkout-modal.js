function openGuestCheckoutModal() {
    document.getElementById('guestCheckoutModal').classList.remove('hidden');
    resetCheckoutModal();
    loadCheckedInGuests();
}

function closeGuestCheckoutModal() {
    document.getElementById('guestCheckoutModal').classList.add('hidden');
    resetCheckoutModal();
}

function resetCheckoutModal() {
    // Clear search input
    document.getElementById('checkoutSearchInput').value = '';
    
    // Show loading state
    document.getElementById('checkedInList').innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
            <p class="text-gray-500">Loading checked-in guests...</p>
        </div>
    `;
}

// Load all checked-in guests
async function loadCheckedInGuests() {
    try {
        const response = await fetch('/api/guests/checked-in');
        const result = await response.json();
        
        if (result.success) {
            displayCheckedInGuests(result.data);
        } else {
            console.error('Failed to load checked-in guests:', result.message);
            showError('Failed to load checked-in guests: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading checked-in guests:', error);
        showError('Error loading checked-in guests. Please try again.');
    }
}

function displayCheckedInGuests(guests) {
    const checkedInList = document.getElementById('checkedInList');
    
    if (guests.length === 0) {
        checkedInList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-user-slash text-2xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">No guests are currently checked in</p>
                <p class="text-sm text-gray-400 mt-2">Guests will appear here after they check in</p>
            </div>
        `;
        return;
    }
    
    checkedInList.innerHTML = guests.map(guest => {
        const checkInTime = new Date(guest.check_in_time).toLocaleString();
        return `
            <div class="guest-checkout-item p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-red-50 hover:border-red-300 transition-all"
                 onclick="performCheckout('${guest.transaction_id}', '${guest.guest_name}', '${guest.host_name}')"
                 data-search-text="${guest.guest_name.toLowerCase()} ${guest.host_name.toLowerCase()} ${guest.guest_cnic} ${guest.host_cnic}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                            <p class="font-semibold text-gray-900 text-lg">${guest.guest_name}</p>
                            <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Checked In</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-1">CNIC: ${guest.guest_cnic}</p>
                        <p class="text-sm text-blue-600 mb-1">
                            <i class="fas fa-user-friends mr-1"></i>Host: ${guest.host_name}
                        </p>
                        <p class="text-xs text-gray-500">
                            <i class="fas fa-clock mr-1"></i>Checked in: ${checkInTime}
                        </p>
                    </div>
                    <div class="ml-3 flex flex-col items-center">
                        <div class="p-2 bg-red-100 rounded-full mb-1">
                            <i class="fas fa-sign-out-alt text-red-600"></i>
                        </div>
                        <span class="text-xs text-red-600 font-medium">Checkout</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function searchCheckedInGuests(searchTerm) {
    const guestItems = document.querySelectorAll('.guest-checkout-item');
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    
    if (lowerSearchTerm === '') {
        guestItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    guestItems.forEach(item => {
        const searchText = item.getAttribute('data-search-text') || '';
        if (searchText.includes(lowerSearchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show "no results" message if no items are visible
    const visibleItems = Array.from(guestItems).filter(item => item.style.display !== 'none');
    const checkedInList = document.getElementById('checkedInList');
    
    // Remove any existing "no results" message
    const existingNoResults = checkedInList.querySelector('.no-results-message');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (visibleItems.length === 0 && lowerSearchTerm !== '') {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results-message text-gray-500 text-center py-4';
        noResultsDiv.innerHTML = '<i class="fas fa-search text-2xl mb-2"></i><p>No checked-in guests found matching your search</p>';
        checkedInList.appendChild(noResultsDiv);
    }
}

async function performCheckout(transactionId, guestName, hostName) {
    try {
        // Show confirmation
        const confirmResult = await showConfirmation(
            'Confirm Checkout',
            `Are you sure you want to check out ${guestName}?`
        );
        
        if (!confirmResult) {
            return;
        }
        
        const response = await fetch('/api/guests/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transaction_id: transactionId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`${guestName} checked out successfully!`);
            // Reload the checked-in guests list
            loadCheckedInGuests();
        } else {
            showError(result.message || 'Failed to check out guest');
        }
    } catch (error) {
        console.error('Error checking out guest:', error);
        showError('Error checking out guest');
    }
}

// Simple confirmation function (you can enhance this with a proper modal)
function showConfirmation(title, message) {
    return new Promise((resolve) => {
        const result = confirm(`${title}\n\n${message}`);
        resolve(result);
    });
}
