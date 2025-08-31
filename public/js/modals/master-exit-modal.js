function openMasterExitModal() {
    document.getElementById('masterExitModal').classList.remove('hidden');
    loadCheckedInUsers();
}

function closeMasterExitModal() {
    document.getElementById('masterExitModal').classList.add('hidden');
    // Clear the users list and search
    document.getElementById('checkedInUsersList').innerHTML = '';
    document.getElementById('masterExitSearch').value = '';
    document.getElementById('noSearchResults').classList.add('hidden');
    // Hide all states
    document.getElementById('masterExitLoading').classList.add('hidden');
    document.getElementById('masterExitNoUsers').classList.add('hidden');
    document.getElementById('masterExitUsersList').classList.add('hidden');
}

// Store all entries for filtering
let allCheckedInEntries = [];

async function loadCheckedInUsers() {
    // Show loading state
    document.getElementById('masterExitLoading').classList.remove('hidden');
    document.getElementById('masterExitNoUsers').classList.add('hidden');
    document.getElementById('masterExitUsersList').classList.add('hidden');

    try {
        const response = await fetch('/api/master-entries/checked-in');
        const result = await response.json();

        // Hide loading state
        document.getElementById('masterExitLoading').classList.add('hidden');

        if (result.success && result.entries && result.entries.length > 0) {
            // Store entries for search functionality
            allCheckedInEntries = result.entries;
            
            // Show users list
            document.getElementById('masterExitUsersList').classList.remove('hidden');
            displayCheckedInUsers(result.entries);
            
            // Setup search functionality
            setupSearchFunctionality();
        } else {
            // Show no users state
            document.getElementById('masterExitNoUsers').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading checked-in users:', error);
        document.getElementById('masterExitLoading').classList.add('hidden');
        document.getElementById('masterExitNoUsers').classList.remove('hidden');
        showError('Failed to load checked-in users');
    }
}

function setupSearchFunctionality() {
    const searchInput = document.getElementById('masterExitSearch');
    
    // Remove any existing event listeners
    searchInput.removeEventListener('input', handleSearch);
    
    // Add search functionality
    searchInput.addEventListener('input', handleSearch);
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Show all entries
        displayCheckedInUsers(allCheckedInEntries);
        document.getElementById('noSearchResults').classList.add('hidden');
    } else {
        // Filter entries by description
        const filteredEntries = allCheckedInEntries.filter(entry => 
            entry.description.toLowerCase().includes(searchTerm)
        );
        
        if (filteredEntries.length > 0) {
            displayCheckedInUsers(filteredEntries);
            document.getElementById('noSearchResults').classList.add('hidden');
        } else {
            // Show no results message
            document.getElementById('checkedInUsersList').innerHTML = '';
            document.getElementById('noSearchResults').classList.remove('hidden');
        }
    }
}

function displayCheckedInUsers(entries) {
    const container = document.getElementById('checkedInUsersList');
    container.innerHTML = '';

    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors';
        
        const checkInTime = new Date(entry.check_in_time).toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        entryElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h5 class="font-semibold text-gray-900 mb-2">Entry #${entry.id}</h5>
                    <p class="text-gray-700 mb-2">${entry.description}</p>
                    <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span><i class="fas fa-users mr-1"></i>${entry.people_count} people</span>
                        <span><i class="fas fa-clock mr-1"></i>Checked in: ${checkInTime}</span>
                    </div>
                </div>
                <button
                    onclick="checkOutMasterEntry(${entry.id})"
                    class="ml-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <i class="fas fa-sign-out-alt mr-1"></i>Check Out
                </button>
            </div>
        `;

        container.appendChild(entryElement);
    });
}

async function checkOutMasterEntry(entryId) {
    try {
        const response = await fetch(`/api/master-entries/${entryId}/checkout`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('Master entry checked out successfully!');
            // Reload the checked-in users list
            loadCheckedInUsers();
            // Optionally refresh the page after a delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showError(result.message || 'Failed to check out master entry');
        }
    } catch (error) {
        console.error('Error checking out master entry:', error);
        showError('Error checking out master entry');
    }
}
