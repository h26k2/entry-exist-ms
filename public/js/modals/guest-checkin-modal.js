let selectedGuest = null;
let selectedHost = null;

function openGuestCheckInModal() {
    document.getElementById('guestCheckInModal').classList.remove('hidden');
    resetCheckInModal();
    loadGuests();
}

function closeGuestCheckInModal() {
    document.getElementById('guestCheckInModal').classList.add('hidden');
    resetCheckInModal();
}

function resetCheckInModal() {
    // Reset to first step
    document.getElementById('guestSelectionStep').classList.remove('hidden');
    document.getElementById('hostSelectionStep').classList.add('hidden');
    
    // Clear search inputs
    document.getElementById('guestSearchInput').value = '';
    document.getElementById('hostSearchInput').value = '';
    
    // Reset selected values
    selectedGuest = null;
    selectedHost = null;
    
    // Show loading states
    document.getElementById('guestList').innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
            <p class="text-gray-500">Loading guests...</p>
        </div>
    `;
}

function openGuestRegistrationFromCheckIn() {
    closeGuestCheckInModal();
    openGuestRegistrationModal();
}

function goBackToGuestSelection() {
    document.getElementById('guestSelectionStep').classList.remove('hidden');
    document.getElementById('hostSelectionStep').classList.add('hidden');
    selectedHost = null;
}

// Load all guests
async function loadGuests() {
    try {
        const response = await fetch('/api/guests/list');
        const result = await response.json();
        
        if (result.success) {
            displayGuests(result.data);
        } else {
            console.error('Failed to load guests:', result.message);
            showError('Failed to load guests: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading guests:', error);
        showError('Error loading guests. Please try again.');
    }
}

function displayGuests(guests) {
    const guestList = document.getElementById('guestList');
    
    if (guests.length === 0) {
        guestList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-user-slash text-2xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">No guests found</p>
                <button onclick="openGuestRegistrationFromCheckIn()" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Register First Guest
                </button>
            </div>
        `;
        return;
    }
    
    guestList.innerHTML = guests.map(guest => {
        const fullName = `${guest.first_name} ${guest.last_name}`;
        return `
            <div class="guest-item p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all"
                 onclick="selectGuest('${guest.id}', '${fullName}', '${guest.cnic_number}')"
                 data-search-text="${fullName.toLowerCase()} ${guest.cnic_number}">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900 text-lg">${fullName}</p>
                        <p class="text-sm text-gray-600 mt-1">CNIC: ${guest.cnic_number}</p>
                    </div>
                    <div class="ml-3">
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function searchGuests(searchTerm) {
    const guestItems = document.querySelectorAll('.guest-item');
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
    const guestList = document.getElementById('guestList');
    
    // Remove any existing "no results" message
    const existingNoResults = guestList.querySelector('.no-results-message');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (visibleItems.length === 0 && lowerSearchTerm !== '') {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results-message text-gray-500 text-center py-4';
        noResultsDiv.innerHTML = '<i class="fas fa-search text-2xl mb-2"></i><p>No guests found matching your search</p>';
        guestList.appendChild(noResultsDiv);
    }
}

function selectGuest(guestId, guestName, guestCnic) {
    selectedGuest = { id: guestId, name: guestName, cnic: guestCnic };
    
    // Update selected guest display
    document.getElementById('selectedGuestName').textContent = guestName;
    document.getElementById('selectedGuestCnic').textContent = `CNIC: ${guestCnic}`;
    
    // Switch to host selection step
    document.getElementById('guestSelectionStep').classList.add('hidden');
    document.getElementById('hostSelectionStep').classList.remove('hidden');
    
    // Load hosts
    loadHosts();
}

// Load all hosts
async function loadHosts() {
    try {
        const response = await fetch('/api/app-users/hosts');
        const result = await response.json();
        
        if (result.success) {
            displayHosts(result.data);
        } else {
            console.error('Failed to load hosts:', result.message);
            showError('Failed to load hosts: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading hosts:', error);
        showError('Error loading hosts. Please try again.');
    }
}

function displayHosts(hosts) {
    const hostList = document.getElementById('hostList');
    
    if (hosts.length === 0) {
        hostList.innerHTML = '<p class="text-gray-500 text-center py-4">No hosts found</p>';
        return;
    }
    
    hostList.innerHTML = hosts.map(host => {
        const fullName = `${host.first_name} ${host.last_name}`;
        return `
            <div class="host-item p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all"
                 onclick="selectHost('${host.id}', '${fullName}', '${host.cnic_number}')"
                 data-search-text="${fullName.toLowerCase()} ${host.cnic_number}">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-900 text-lg">${fullName}</p>
                        <p class="text-sm text-gray-600 mt-1">CNIC: ${host.cnic_number}</p>
                    </div>
                    <div class="ml-3">
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function searchHosts(searchTerm) {
    const hostItems = document.querySelectorAll('.host-item');
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    
    if (lowerSearchTerm === '') {
        hostItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    hostItems.forEach(item => {
        const searchText = item.getAttribute('data-search-text') || '';
        if (searchText.includes(lowerSearchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show "no results" message if no items are visible
    const visibleItems = Array.from(hostItems).filter(item => item.style.display !== 'none');
    const hostList = document.getElementById('hostList');
    
    // Remove any existing "no results" message
    const existingNoResults = hostList.querySelector('.no-results-message');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (visibleItems.length === 0 && lowerSearchTerm !== '') {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results-message text-gray-500 text-center py-4';
        noResultsDiv.innerHTML = '<i class="fas fa-search text-2xl mb-2"></i><p>No hosts found matching your search</p>';
        hostList.appendChild(noResultsDiv);
    }
}

async function selectHost(hostId, hostName, hostCnic) {
    selectedHost = { id: hostId, name: hostName, cnic: hostCnic };
    
    // Perform check-in
    await performCheckIn();
}

async function performCheckIn() {
    if (!selectedGuest || !selectedHost) {
        showError('Please select both guest and host');
        return;
    }
    
    try {
        const response = await fetch('/api/guests/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guest_id: selectedGuest.id,
                guest_of: selectedHost.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`${selectedGuest.name} checked in successfully with host ${selectedHost.name}!`);
            closeGuestCheckInModal();
        } else {
            showError(result.message || 'Failed to check in guest');
        }
    } catch (error) {
        console.error('Error checking in guest:', error);
        showError('Error checking in guest');
    }
}
