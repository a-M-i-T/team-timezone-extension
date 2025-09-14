// popup.js - Team Timezone Manager with Drag & Drop, Local Storage, Favorites, and Customizable Home Timezone
class TeamTimezoneManager {
    constructor() {
        this.colleagues = [];
        this.myTimezone = ""; // Will be set by user
        this.categories = [
            { id: 'favorites', name: 'Favorites', color: '#ffd700' }
        ];
        this.storageKey = "team_timezones";
        this.homeTimezoneKey = "home_timezone";
        this.categoryOrderKey = "category_order";
        this.draggedElement = null;
        this.dragOverElement = null;
        this.draggedCategory = null;
        this.init();
    }

    init() {
        this.loadCategories();
        this.loadFromStorage();
        this.loadHomeTimezone();
        
        // Ensure we have default categories
        if (!this.categories.find(cat => cat.id === 'general')) {
            this.categories.push({ id: 'general', name: 'General', color: '#6c757d' });
        }
        
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateDisplay(); // Use the new category-based display
        
        // Update times immediately and then every minute
        this.updateTimes();
        setInterval(() => {
            this.updateTimes();
        }, 60000); // 60000ms = 1 minute
    }

    // Storage management (using localStorage instead of cookies)
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.colleagues));
        } catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.colleagues = JSON.parse(saved);
                // Ensure all team members have the favorite property
                this.colleagues.forEach(colleague => {
                    if (colleague.favorite === undefined) {
                        colleague.favorite = false;
                    }
                    if (colleague.designation === undefined) {
                        colleague.designation = '';
                    }
                    if (colleague.phone === undefined) {
                        colleague.phone = '';
                    }
                    if (colleague.email === undefined) {
                        colleague.email = '';
                    }
                    if (colleague.category === undefined) {
                        // Default to general category
                        colleague.category = 'general';
                    }
                });
            } else {
                // Start with empty team - users will add their own members
                this.colleagues = [];
            }
        } catch (error) {
            console.error("Error loading from localStorage:", error);
            // Fallback to empty team
            this.colleagues = [];
        }
    }

    // Home timezone management
    saveHomeTimezone() {
        try {
            localStorage.setItem(this.homeTimezoneKey, this.myTimezone);
        } catch (error) {
            console.error("Error saving home timezone:", error);
        }
    }

    loadHomeTimezone() {
        try {
            const saved = localStorage.getItem(this.homeTimezoneKey);
            if (saved) {
                this.myTimezone = saved;
            }
        } catch (error) {
            console.error("Error loading home timezone:", error);
            this.myTimezone = ""; // Will be set by user
        }
        
        // Update the select dropdown to show current selection
        this.updateHomeTimezoneSelect();
    }

    updateHomeTimezoneSelect() {
        const select = document.getElementById('home-timezone');
        if (select) {
            select.value = this.myTimezone;
        }
    }

    setHomeTimezone(timezone) {
        if (!timezone || !timezone.trim()) {
            alert("Please select a valid timezone");
            return false;
        }

        // Validate timezone
        try {
            new Date().toLocaleString("en-US", { timeZone: timezone });
        } catch (error) {
            alert(`Invalid timezone: ${timezone}`);
            return false;
        }

        this.myTimezone = timezone.trim();
        this.saveHomeTimezone();
        this.updateTimes();
        return true;
    }

    // Timezone calculations
    getTimeDifference(targetTimezone, referenceTimezone) {
        try {
            const now = new Date();
            
            // Get current time in both timezones
            const targetTime = new Date(now.toLocaleString("en-US", { timeZone: targetTimezone }));
            const referenceTime = new Date(now.toLocaleString("en-US", { timeZone: referenceTimezone }));
            
            // Calculate difference in milliseconds
            const diffMs = targetTime.getTime() - referenceTime.getTime();
            
            // Convert to hours
            const diffHours = diffMs / (1000 * 60 * 60);
            
            return diffHours;
        } catch (error) {
            console.error(`Error calculating time difference for ${targetTimezone}:`, error);
            return 0;
        }
    }

    formatTimeDifference(hours) {
        const absHours = Math.abs(hours);
        const wholeHours = Math.floor(absHours);
        const minutes = Math.round((absHours - wholeHours) * 60);
        
        if (minutes === 0) {
            return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''} ${hours >= 0 ? "ahead" : "behind"}`;
        } else {
            return `${wholeHours}h ${minutes}m ${hours >= 0 ? "ahead" : "behind"}`;
        }
    }

    // Helper method to get friendly timezone name
    getFriendlyTimezoneName(timezone) {
        const timezoneNames = {
            'Asia/Kathmandu': 'Nepal',
            'Asia/Manila': 'Philippines',
            'Asia/Bangkok': 'Thailand',
            'Asia/Dhaka': 'Bangladesh',
            'Europe/Kyiv': 'Ukraine',
            'Europe/Lisbon': 'Portugal',
            'America/New_York': 'US Eastern',
            'America/Los_Angeles': 'US Pacific',
            'Europe/London': 'UK',
            'Europe/Berlin': 'Germany',
            'Asia/Tokyo': 'Japan',
            'Australia/Sydney': 'Australia',
            'Pacific/Auckland': 'New Zealand'
        };
        
        return timezoneNames[timezone] || timezone.split('/').pop() || timezone;
    }

    getCountryFlag(timezone) {
        // Map timezones to simple country codes
        const timezoneToCountry = {
            // Asia
            'Asia/Kolkata': 'IN',
            'Asia/Kathmandu': 'NP',
            'Asia/Dhaka': 'BD',
            'Asia/Karachi': 'PK',
            'Asia/Colombo': 'LK',
            'Asia/Manila': 'PH',
            'Asia/Bangkok': 'TH',
            'Asia/Ho_Chi_Minh': 'VN',
            'Asia/Jakarta': 'ID',
            'Asia/Singapore': 'SG',
            'Asia/Kuala_Lumpur': 'MY',
            'Asia/Seoul': 'KR',
            'Asia/Tokyo': 'JP',
            'Asia/Shanghai': 'CN',
            'Asia/Hong_Kong': 'HK',
            'Asia/Taipei': 'TW',
            'Asia/Dubai': 'AE',
            'Asia/Qatar': 'QA',
            'Asia/Kuwait': 'KW',
            'Asia/Riyadh': 'SA',
            'Asia/Tehran': 'IR',
            'Asia/Jerusalem': 'IL',
            
            // Europe
            'Europe/London': 'GB',
            'Europe/Paris': 'FR',
            'Europe/Berlin': 'DE',
            'Europe/Rome': 'IT',
            'Europe/Madrid': 'ES',
            'Europe/Amsterdam': 'NL',
            'Europe/Brussels': 'BE',
            'Europe/Vienna': 'AT',
            'Europe/Zurich': 'CH',
            'Europe/Stockholm': 'SE',
            'Europe/Oslo': 'NO',
            'Europe/Copenhagen': 'DK',
            'Europe/Helsinki': 'FI',
            'Europe/Warsaw': 'PL',
            'Europe/Prague': 'CZ',
            'Europe/Budapest': 'HU',
            'Europe/Bucharest': 'RO',
            'Europe/Sofia': 'BG',
            'Europe/Athens': 'GR',
            'Europe/Istanbul': 'TR',
            'Europe/Moscow': 'RU',
            'Europe/Kiev': 'UA',
            
            // Americas
            'America/New_York': 'US',
            'America/Chicago': 'US',
            'America/Denver': 'US',
            'America/Los_Angeles': 'US',
            'America/Toronto': 'CA',
            'America/Vancouver': 'CA',
            'America/Mexico_City': 'MX',
            'America/Sao_Paulo': 'BR',
            'America/Argentina/Buenos_Aires': 'AR',
            'America/Santiago': 'CL',
            'America/Lima': 'PE',
            'America/Bogota': 'CO',
            
            // Oceania
            'Australia/Sydney': 'AU',
            'Australia/Melbourne': 'AU',
            'Australia/Perth': 'AU',
            'Pacific/Auckland': 'NZ',
            'Pacific/Fiji': 'FJ',
            
            // Africa
            'Africa/Cairo': 'EG',
            'Africa/Johannesburg': 'ZA',
            'Africa/Lagos': 'NG',
            'Africa/Nairobi': 'KE',
            'Africa/Casablanca': 'MA',
            
            // UTC variations
            'UTC': 'GL',
            'GMT': 'GB'
        };
        
        // Try exact match first
        if (timezoneToCountry[timezone]) {
            return timezoneToCountry[timezone];
        }
        
        // Try partial matches for custom timezones
        if (timezone.startsWith('UTC+')) {
            return 'GL';
        }
        if (timezone.startsWith('UTC-')) {
            return 'GL';
        }
        
        // Try to extract country from timezone string
        const parts = timezone.split('/');
        if (parts.length >= 2) {
            const region = parts[1];
            
            // Additional region-based mappings
            const regionToCountry = {
                'Kolkata': 'IN',
                'Kathmandu': 'NP',
                'Dhaka': 'BD',
                'Karachi': 'PK',
                'Colombo': 'LK',
                'Manila': 'PH',
                'Bangkok': 'TH',
                'Jakarta': 'ID',
                'Singapore': 'SG',
                'Seoul': 'KR',
                'Tokyo': 'JP',
                'Shanghai': 'CN',
                'Hong_Kong': 'HK',
                'Taipei': 'TW',
                'Dubai': 'AE',
                'London': 'GB',
                'Paris': 'FR',
                'Berlin': 'DE',
                'Rome': 'IT',
                'Madrid': 'ES',
                'Amsterdam': 'NL',
                'Brussels': 'BE',
                'Vienna': 'AT',
                'Zurich': 'CH',
                'Stockholm': 'SE',
                'Oslo': 'NO',
                'Copenhagen': 'DK',
                'Helsinki': 'FI',
                'Warsaw': 'PL',
                'Prague': 'CZ',
                'Budapest': 'HU',
                'Bucharest': 'RO',
                'Sofia': 'BG',
                'Athens': 'GR',
                'Istanbul': 'TR',
                'Moscow': 'RU',
                'Kiev': 'UA',
                'New_York': 'US',
                'Chicago': 'US',
                'Denver': 'US',
                'Los_Angeles': 'US',
                'Toronto': 'CA',
                'Vancouver': 'CA',
                'Mexico_City': 'MX',
                'Sao_Paulo': 'BR',
                'Buenos_Aires': 'AR',
                'Santiago': 'CL',
                'Lima': 'PE',
                'Bogota': 'CO',
                'Sydney': 'AU',
                'Melbourne': 'AU',
                'Perth': 'AU',
                'Auckland': 'NZ',
                'Fiji': 'FJ',
                'Cairo': 'EG',
                'Johannesburg': 'ZA',
                'Lagos': 'NG',
                'Nairobi': 'KE',
                'Casablanca': 'MA'
            };
            
            if (regionToCountry[region]) {
                return regionToCountry[region];
            }
        }
        
        // Default fallback
        return 'GL';
    }

    // Team management
    addPerson(name, timezone, designation = '', phone = '', email = '') {
        if (!name.trim() || !timezone.trim()) {
            alert("Please enter both name and timezone");
            return false;
        }

        // Handle custom timezone
        let finalTimezone = timezone;
        if (timezone === 'custom') {
            if (this.customMemberTimezone) {
                finalTimezone = this.customMemberTimezone;
            } else {
                alert("Please enter a custom timezone");
                return false;
            }
        }

        // Validate timezone
        try {
            new Date().toLocaleString("en-US", { timeZone: finalTimezone });
        } catch (error) {
            alert(`Invalid timezone: ${finalTimezone}`);
            return false;
        }

        // Check if name already exists
        if (this.colleagues.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            alert("A person with this name already exists");
            return false;
        }

        this.colleagues.push({ 
            name: name.trim(), 
            timezone: finalTimezone, 
            favorite: false,
            designation: designation.trim(),
            phone: phone.trim(),
            email: email.trim()
        });
        this.saveToStorage();
        this.updateTimes();
        return true;
    }

    removePerson(name) {
        this.colleagues = this.colleagues.filter(c => c.name !== name);
        this.saveToStorage();
        this.updateTimes();
    }

    toggleFavorite(name) {
        console.log('toggleFavorite called for:', name);
        const colleague = this.colleagues.find(c => c.name === name);
        if (colleague) {
            console.log('Before toggle - favorite status:', colleague.favorite);
            colleague.favorite = !colleague.favorite;
            console.log('After toggle - favorite status:', colleague.favorite);
            this.saveToStorage();
            this.updateDisplay(); // Changed from updateTimes() to updateDisplay()
        } else {
            console.log('Colleague not found:', name);
        }
    }

    toggleExpanded(personCard, expandBtn) {
        const expandedContent = personCard.querySelector('.expanded-content');
        const isExpanded = personCard.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            personCard.classList.remove('expanded');
            expandBtn.classList.remove('expanded');
            expandBtn.innerHTML = '&darr;';
            expandedContent.classList.remove('show');
        } else {
            // Expand
            personCard.classList.add('expanded');
            expandBtn.classList.add('expanded');
            expandBtn.innerHTML = '&uarr;';
            expandedContent.classList.add('show');
        }
    }

    editPerson(name) {
        const colleague = this.colleagues.find(c => c.name === name);
        if (!colleague) return;

        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'edit-form-overlay';
        editForm.innerHTML = `
            <div class="edit-form">
                <h3>Edit ${colleague.name}</h3>
                <div class="form-row">
                    <input type="text" id="edit-name" value="${colleague.name}" placeholder="Name" maxlength="30">
                    <select id="edit-timezone">
                        <option value="Asia/Manila" ${colleague.timezone === 'Asia/Manila' ? 'selected' : ''}>Asia/Manila (Philippines)</option>
                        <option value="Asia/Bangkok" ${colleague.timezone === 'Asia/Bangkok' ? 'selected' : ''}>Asia/Bangkok (Thailand)</option>
                        <option value="Asia/Dhaka" ${colleague.timezone === 'Asia/Dhaka' ? 'selected' : ''}>Asia/Dhaka (Bangladesh)</option>
                        <option value="Asia/Kathmandu" ${colleague.timezone === 'Asia/Kathmandu' ? 'selected' : ''}>Asia/Kathmandu (Nepal)</option>
                        <option value="Europe/Kyiv" ${colleague.timezone === 'Europe/Kyiv' ? 'selected' : ''}>Europe/Kyiv (Ukraine)</option>
                        <option value="Europe/Lisbon" ${colleague.timezone === 'Europe/Lisbon' ? 'selected' : ''}>Europe/Lisbon (Portugal)</option>
                        <option value="America/New_York" ${colleague.timezone === 'America/New_York' ? 'selected' : ''}>America/New_York (US Eastern)</option>
                        <option value="America/Los_Angeles" ${colleague.timezone === 'America/Los_Angeles' ? 'selected' : ''}>America/Los_Angeles (US Pacific)</option>
                        <option value="Europe/London" ${colleague.timezone === 'Europe/London' ? 'selected' : ''}>Europe/London (UK)</option>
                        <option value="Europe/Berlin" ${colleague.timezone === 'Europe/Berlin' ? 'selected' : ''}>Europe/Berlin (Germany)</option>
                        <option value="Asia/Tokyo" ${colleague.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Asia/Tokyo (Japan)</option>
                        <option value="Australia/Sydney" ${colleague.timezone === 'Australia/Sydney' ? 'selected' : ''}>Australia/Sydney (Australia)</option>
                        <option value="Pacific/Auckland" ${colleague.timezone === 'Pacific/Auckland' ? 'selected' : ''}>Pacific/Auckland (New Zealand)</option>
                        <option value="custom" ${colleague.timezone === 'custom' ? 'selected' : ''}>Custom Timezone...</option>
                    </select>
                </div>
                <div class="form-row">
                    <input type="text" id="edit-designation" value="${colleague.designation || ''}" placeholder="Designation" maxlength="50">
                    <input type="tel" id="edit-phone" value="${colleague.phone || ''}" placeholder="Phone" maxlength="20">
                </div>
                <div class="form-row">
                    <input type="email" id="edit-email" value="${colleague.email || ''}" placeholder="Email" maxlength="100">
                </div>
                <div class="form-row button-row">
                    <button class="btn btn-primary save-edit-btn" data-old-name="${colleague.name}">Save Changes</button>
                    <button class="btn btn-secondary cancel-edit-btn">Cancel</button>
                </div>
            </div>
        `;

        // Handle custom timezone input
        const timezoneSelect = editForm.querySelector('#edit-timezone');
        const customInput = editForm.querySelector('#edit-custom-tz');
        
        timezoneSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                if (!customInput) {
                    const customField = document.createElement('input');
                    customField.type = 'text';
                    customField.id = 'edit-custom-tz';
                    customField.placeholder = 'Enter custom timezone (e.g., UTC+5:30)';
                    customField.className = 'custom-tz-input';
                    timezoneSelect.parentNode.appendChild(customField);
                }
            } else if (customInput) {
                customInput.remove();
            }
        });

        // Show custom input if needed
        if (colleague.timezone === 'custom') {
            timezoneSelect.value = 'custom';
            timezoneSelect.dispatchEvent(new Event('change'));
            const customField = editForm.querySelector('#edit-custom-tz');
            if (customField) {
                customField.value = colleague.customTimezone || '';
            }
        }

        document.body.appendChild(editForm);
    }

    saveEdit(oldName) {
        const editForm = document.querySelector('.edit-form-overlay');
        if (!editForm) return;

        const newName = document.getElementById('edit-name').value.trim();
        const newTimezone = document.getElementById('edit-timezone').value;
        const newDesignation = document.getElementById('edit-designation').value.trim();
        const newPhone = document.getElementById('edit-phone').value.trim();
        const newEmail = document.getElementById('edit-email').value.trim();

        // Validation
        if (!newName || !newTimezone) {
            alert("Name and timezone are required");
            return;
        }

        // Check if new name conflicts with existing names (excluding current person)
        if (newName !== oldName && this.colleagues.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
            alert("A person with this name already exists");
            return;
        }

        // Validate timezone
        let finalTimezone = newTimezone;
        if (newTimezone === 'custom') {
            const customTz = document.getElementById('edit-custom-tz')?.value.trim();
            if (!customTz) {
                alert("Please enter a custom timezone");
                return;
            }
            finalTimezone = customTz;
        } else {
            try {
                new Date().toLocaleString("en-US", { timeZone: newTimezone });
            } catch (error) {
                alert(`Invalid timezone: ${newTimezone}`);
                return;
            }
        }

        // Update the colleague
        const colleague = this.colleagues.find(c => c.name === oldName);
        if (colleague) {
            colleague.name = newName;
            colleague.timezone = finalTimezone;
            colleague.designation = newDesignation;
            colleague.phone = newPhone;
            colleague.email = newEmail;
            
            if (newTimezone === 'custom') {
                colleague.customTimezone = finalTimezone;
            }

            this.saveToStorage();
            this.updateTimes();
            editForm.remove();
        }
    }

    // Drag and drop functionality
    setupDragAndDrop() {
        // Enhanced drag and drop functionality
        let draggedElement = null;
        let placeholder = null;
        let isDragging = false;

        const createPlaceholder = () => {
            const div = document.createElement('div');
            div.className = 'drag-placeholder';
            // Use CSS class instead of inline styles for better control
            return div;
        };

        const getDropPosition = (e, target) => {
            if (!target) return { position: 'after', element: null };
            
            const rect = target.getBoundingClientRect();
            const mouseY = e.clientY;
            const targetTop = rect.top;
            const targetHeight = rect.height;
            
            // Calculate the middle point of the target
            const midPoint = targetTop + (targetHeight / 2);
            
            // If mouse is above the middle, drop above (before)
            // If mouse is below the middle, drop below (after)
            if (mouseY < midPoint) {
                return { position: 'before', element: target };
            } else {
                return { position: 'after', element: target };
            }
        };

        // Find the best drop target for any position
        const findDropTarget = (e) => {
            const mouseY = e.clientY;
            
            // Get all person elements except the one being dragged
            const allPeople = Array.from(document.querySelectorAll('.person')).filter(p => p !== draggedElement);
            
            if (allPeople.length === 0) {
                return null;
            }
            
            // Find the person element that the mouse is currently over
            let targetPerson = null;
            let position = 'after';
            
            for (let i = 0; i < allPeople.length; i++) {
                const person = allPeople[i];
                const rect = person.getBoundingClientRect();
                
                // Check if mouse is over this person
                if (mouseY >= rect.top && mouseY <= rect.bottom) {
                    targetPerson = person;
                    
                    // Determine if we're in the top or bottom half
                    const midPoint = rect.top + (rect.height / 2);
                    position = mouseY < midPoint ? 'before' : 'after';
                    break;
                }
            }
            
            // If no person is directly under the mouse, find the closest one
            if (!targetPerson) {
                let closestDistance = Infinity;
                
                for (let i = 0; i < allPeople.length; i++) {
                    const person = allPeople[i];
                    const rect = person.getBoundingClientRect();
                    
                    // Calculate distance to this person
                    let distance;
                    if (mouseY < rect.top) {
                        distance = rect.top - mouseY;
                    } else if (mouseY > rect.bottom) {
                        distance = mouseY - rect.bottom;
                    } else {
                        distance = 0; // Mouse is over this person
                    }
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        targetPerson = person;
                        
                        // Determine position relative to this person
                        if (mouseY < rect.top) {
                            position = 'before';
                        } else if (mouseY > rect.bottom) {
                            position = 'after';
                        } else {
                            // Mouse is over the person, determine by middle point
                            const midPoint = rect.top + (rect.height / 2);
                            position = mouseY < midPoint ? 'before' : 'after';
                        }
                    }
                }
            }
            
            if (targetPerson) {
                const category = targetPerson.closest('.category-members');
                return { 
                    target: targetPerson, 
                    category, 
                    type: 'person', 
                    position: position 
                };
            }
            
            return null;
        };

        // Store references to handler functions so they can be reused
        this.handleDragStart = (e) => {
            console.log('Drag start event triggered', e.target);
            console.log('Event details:', {
                type: e.type,
                target: e.target,
                currentTarget: e.currentTarget,
                draggable: e.target.draggable
            });
            
            // Prevent dragging if clicking on buttons
            if (e.target.closest('.remove-btn, .favorite-btn, .expand-btn, .edit-btn, .ping-btn')) {
                console.log('Preventing drag on button');
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            
            draggedElement = e.target.closest('.person');
            if (!draggedElement) {
                console.log('No person element found for drag');
                e.preventDefault();
                return false;
            }
            
            console.log('Starting drag for:', draggedElement.querySelector('.name')?.textContent);
            console.log('Dragged element:', draggedElement);
            
            isDragging = true;
            draggedElement.classList.add('dragging');
            
            // Create and show placeholder
            placeholder = createPlaceholder();
            draggedElement.parentNode.insertBefore(placeholder, draggedElement);
            
            // Set drag data - this is crucial for the drag to work
            try {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedElement.querySelector('.name')?.textContent || '');
                e.dataTransfer.setData('text/html', draggedElement.outerHTML);
                console.log('Drag data set successfully');
            } catch (error) {
                console.error('Error setting drag data:', error);
            }
            
            // Add some visual feedback
            draggedElement.style.opacity = '0.5';
            draggedElement.style.transform = 'rotate(2deg) scale(1.02)';
            
            console.log('Drag start completed successfully');
        };

        this.handleDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isDragging || !draggedElement) return;
            
            e.dataTransfer.dropEffect = 'move';
            
            // Remove existing indicators
            document.querySelectorAll('.person').forEach(p => {
                p.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Find the best drop target
            const dropInfo = findDropTarget(e);
            
            if (!dropInfo) return;
            
            if (dropInfo.type === 'person' || dropInfo.type === 'category-area') {
                // Dropping on a specific person or in a category area
                if (dropInfo.target) {
                    if (dropInfo.position === 'before') {
                        dropInfo.target.classList.add('drag-over-top');
                    } else {
                        dropInfo.target.classList.add('drag-over-bottom');
                    }
                }
            } else if (dropInfo.type === 'empty-category') {
                // Dropping in an empty category - no visual indicator needed
            }
        };

        this.handleDragLeave = (e) => {
            if (!isDragging) return;
            
            const target = e.target.closest('.person');
            if (target) {
                // Only remove indicators if we're actually leaving the target
                const rect = target.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX > rect.right || 
                    e.clientY < rect.top || e.clientY > rect.bottom) {
                    target.classList.remove('drag-over-top', 'drag-over-bottom');
                }
            }
        };

        this.handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isDragging || !draggedElement || !placeholder) return;
            
            // Remove all visual indicators
            document.querySelectorAll('.person').forEach(p => {
                p.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Remove placeholder
            if (placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            
            // Reset dragged element
            draggedElement.classList.remove('dragging');
            draggedElement.style.opacity = '';
            draggedElement.style.transform = '';
            
            // Find drop target and position
            const dropInfo = findDropTarget(e);
            
            if (dropInfo && dropInfo.category) {
                console.log('Dropping to category:', dropInfo.category.dataset.category);
                
                if (dropInfo.type === 'empty-category') {
                    // Drop at the beginning of empty category
                    dropInfo.category.appendChild(draggedElement);
                } else if (dropInfo.type === 'person' || dropInfo.type === 'category-area') {
                    // Drop relative to specific person
                    if (dropInfo.target) {
                        if (dropInfo.position === 'before') {
                            dropInfo.category.insertBefore(draggedElement, dropInfo.target);
                        } else {
                            dropInfo.category.insertBefore(draggedElement, dropInfo.target.nextSibling);
                        }
                    } else {
                        // Fallback to end of category
                        dropInfo.category.appendChild(draggedElement);
                    }
                }
                
                // Update favorite status if moving between categories
                const wasInFavorites = draggedElement.parentNode && draggedElement.parentNode.dataset.category === 'favorites';
                const isNowInFavorites = dropInfo.category.dataset.category === 'favorites';
                
                console.log('Favorite status change:', wasInFavorites, '->', isNowInFavorites);
                
                if (wasInFavorites !== isNowInFavorites) {
                    const name = draggedElement.querySelector('.name').textContent;
                    const colleague = this.colleagues.find(c => c.name === name);
                    if (colleague) {
                        colleague.favorite = isNowInFavorites;
                        console.log('Updated favorite status for', name, 'to:', colleague.favorite);
                        // Update favorite button appearance
                        const favoriteBtn = draggedElement.querySelector('.favorite-btn');
                        if (favoriteBtn) {
                            favoriteBtn.classList.toggle('favorited', isNowInFavorites);
                            favoriteBtn.innerHTML = isNowInFavorites ? '&starf;' : '&star;';
                            favoriteBtn.title = isNowInFavorites ? 'Remove from favorites' : 'Add to favorites';
                        }
                    }
                }
                
                // Update category if moving between different categories
                const newCategory = dropInfo.category.dataset.category;
                const name = draggedElement.querySelector('.name').textContent;
                const colleague = this.colleagues.find(c => c.name === name);
                if (colleague) {
                    console.log('Processing category change for', name, 'from', colleague.category, 'to', newCategory);
                    // Special handling for favorites - don't change the original category
                    if (newCategory === 'favorites') {
                        // Keep the original category, just mark as favorite
                        colleague.favorite = true;
                        console.log('Kept original category for favorites:', colleague.category);
                    } else if (colleague.category !== newCategory) {
                        // Moving to a different non-favorites category
                        colleague.category = newCategory;
                        // If moving away from favorites, unmark as favorite
                        if (colleague.favorite) {
                            colleague.favorite = false;
                        }
                        console.log('Updated category to:', colleague.category);
                    }
                }
                
                // Save new order (don't call updateDisplay as it re-renders everything)
                this.saveToStorage();
            }
            
            // Reset state
            draggedElement = null;
            placeholder = null;
            isDragging = false;
        };

        this.handleDragEnd = (e) => {
            if (!isDragging) return;
            
            // Remove all visual indicators
            document.querySelectorAll('.person').forEach(p => {
                p.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            
            // Remove placeholder if it exists
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            
            // Reset dragged element
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement.style.opacity = '';
                draggedElement.style.transform = '';
            }
            
            // Reset state
            draggedElement = null;
            placeholder = null;
            isDragging = false;
        };

        // Add drag and drop to all person elements
        const addDragAndDrop = (element) => {
            if (!element || element.draggable) return; // Prevent double attachment
            
            console.log('Setting up drag for element:', element);
            element.draggable = true;
            
            // Remove any existing listeners first
            element.removeEventListener('dragstart', this.handleDragStart, false);
            element.removeEventListener('dragover', this.handleDragOver, false);
            element.removeEventListener('dragleave', this.handleDragLeave, false);
            element.removeEventListener('drop', this.handleDrop, false);
            element.removeEventListener('dragend', this.handleDragEnd, false);
            
            // Add new listeners
            element.addEventListener('dragstart', this.handleDragStart, false);
            element.addEventListener('dragover', this.handleDragOver, false);
            element.addEventListener('dragleave', this.handleDragLeave, false);
            element.addEventListener('drop', this.handleDrop, false);
            element.addEventListener('dragend', this.handleDragEnd, false);
            
            // Add visual indicator that element is draggable
            element.style.cursor = 'grab';
            element.style.userSelect = 'none';
            
            // Debug: Log the element being made draggable
            console.log('Made draggable:', element.querySelector('.name')?.textContent, 'in category:', element.closest('.category-members')?.dataset.category);
            console.log('Element draggable attribute:', element.draggable);
        };

        // Add to existing elements
        document.querySelectorAll('.person').forEach(addDragAndDrop);
        
        // Debug: Log total draggable elements
        console.log('Total draggable elements:', document.querySelectorAll('.person[draggable="true"]').length);
        
        // Test drag and drop setup
        const testElement = document.querySelector('.person');
        if (testElement) {
            console.log('Test element draggable:', testElement.draggable);
            console.log('Test element has dragstart listener:', testElement.ondragstart !== null);
        }
        
        // Add to new elements when created
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('person')) {
                        addDragAndDrop(node);
                    }
                    if (node.nodeType === 1 && node.classList.contains('category-section')) {
                        this.addCategoryDragAndDrop(node);
                    }
                });
            });
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Add drag and drop to existing category sections
        this.addCategoryDragAndDropToExisting();
        
        // Debug: Log that drag and drop is set up
        console.log('Drag and drop setup complete. Found', document.querySelectorAll('.person').length, 'person elements');
        console.log('Drag and drop handlers attached:', {
            handleDragStart: !!this.handleDragStart,
            handleDragOver: !!this.handleDragOver,
            handleDragLeave: !!this.handleDragLeave,
            handleDrop: !!this.handleDrop,
            handleDragEnd: !!this.handleDragEnd
        });
    }

    addCategoryDragAndDropToExisting() {
        document.querySelectorAll('.category-section').forEach(section => {
            this.addCategoryDragAndDrop(section);
        });
    }

    addCategoryDragAndDrop(categorySection) {
        if (!categorySection || categorySection.draggable) return;

        categorySection.draggable = true;
        categorySection.style.cursor = 'grab';
        categorySection.style.userSelect = 'none';

        // Add drag event listeners
        categorySection.addEventListener('dragstart', (e) => this.handleCategoryDragStart(e));
        categorySection.addEventListener('dragover', (e) => this.handleCategoryDragOver(e));
        categorySection.addEventListener('dragleave', (e) => this.handleCategoryDragLeave(e));
        categorySection.addEventListener('drop', (e) => this.handleCategoryDrop(e));
        categorySection.addEventListener('dragend', (e) => this.handleCategoryDragEnd(e));
    }

    handleCategoryDragStart(e) {
        this.draggedCategory = e.target.closest('.category-section');
        if (!this.draggedCategory) return;

        this.draggedCategory.classList.add('category-dragging');
        this.draggedCategory.style.opacity = '0.5';
        this.draggedCategory.style.transform = 'rotate(2deg) scale(1.02)';

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedCategory.dataset.category);
    }

    handleCategoryDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const targetCategory = e.target.closest('.category-section');
        if (!targetCategory || targetCategory === this.draggedCategory) return;

        // Remove existing indicators
        document.querySelectorAll('.category-section').forEach(section => {
            section.classList.remove('category-drag-over-top', 'category-drag-over-bottom');
        });

        // Add visual indicator
        const rect = targetCategory.getBoundingClientRect();
        const mouseY = e.clientY;
        const midPoint = rect.top + (rect.height / 2);

        if (mouseY < midPoint) {
            targetCategory.classList.add('category-drag-over-top');
        } else {
            targetCategory.classList.add('category-drag-over-bottom');
        }
    }

    handleCategoryDragLeave(e) {
        const targetCategory = e.target.closest('.category-section');
        if (targetCategory) {
            const rect = targetCategory.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                targetCategory.classList.remove('category-drag-over-top', 'category-drag-over-bottom');
            }
        }
    }

    handleCategoryDrop(e) {
        e.preventDefault();

        const targetCategory = e.target.closest('.category-section');
        if (!targetCategory || !this.draggedCategory || targetCategory === this.draggedCategory) return;

        // Remove visual indicators
        document.querySelectorAll('.category-section').forEach(section => {
            section.classList.remove('category-drag-over-top', 'category-drag-over-bottom');
        });

        // Determine drop position
        const rect = targetCategory.getBoundingClientRect();
        const mouseY = e.clientY;
        const midPoint = rect.top + (rect.height / 2);
        const insertBefore = mouseY < midPoint;

        // Reorder categories
        const draggedCategoryId = this.draggedCategory.dataset.category;
        const targetCategoryId = targetCategory.dataset.category;

        const draggedIndex = this.categories.findIndex(cat => cat.id === draggedCategoryId);
        const targetIndex = this.categories.findIndex(cat => cat.id === targetCategoryId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged category
            const draggedCategory = this.categories.splice(draggedIndex, 1)[0];
            
            // Calculate new index
            let newIndex = targetIndex;
            if (draggedIndex < targetIndex) {
                newIndex = targetIndex - 1;
            }
            if (insertBefore) {
                newIndex = targetIndex;
            } else {
                newIndex = targetIndex + 1;
            }

            // Insert at new position
            this.categories.splice(newIndex, 0, draggedCategory);

            // Save new order
            this.saveCategoryOrder();
            this.updateDisplay();
        }
    }

    handleCategoryDragEnd(e) {
        if (this.draggedCategory) {
            this.draggedCategory.classList.remove('category-dragging');
            this.draggedCategory.style.opacity = '';
            this.draggedCategory.style.transform = '';
        }

        // Remove all visual indicators
        document.querySelectorAll('.category-section').forEach(section => {
            section.classList.remove('category-drag-over-top', 'category-drag-over-bottom');
        });

        this.draggedCategory = null;
    }

    addCategoryManagementDragAndDrop() {
        const categoryItems = document.querySelectorAll('.category-item');
        
        categoryItems.forEach(item => {
            // Remove existing listeners to prevent duplicates
            item.removeEventListener('dragstart', this.handleCategoryManagementDragStart);
            item.removeEventListener('dragover', this.handleCategoryManagementDragOver);
            item.removeEventListener('dragleave', this.handleCategoryManagementDragLeave);
            item.removeEventListener('drop', this.handleCategoryManagementDrop);
            item.removeEventListener('dragend', this.handleCategoryManagementDragEnd);

            // Add new listeners
            item.addEventListener('dragstart', (e) => this.handleCategoryManagementDragStart(e));
            item.addEventListener('dragover', (e) => this.handleCategoryManagementDragOver(e));
            item.addEventListener('dragleave', (e) => this.handleCategoryManagementDragLeave(e));
            item.addEventListener('drop', (e) => this.handleCategoryManagementDrop(e));
            item.addEventListener('dragend', (e) => this.handleCategoryManagementDragEnd(e));
        });
    }

    handleCategoryManagementDragStart(e) {
        // Prevent dragging if clicking on buttons
        if (e.target.closest('.edit-category-btn, .delete-category-btn')) {
            e.preventDefault();
            return false;
        }

        this.draggedCategoryItem = e.target.closest('.category-item');
        if (!this.draggedCategoryItem) return;

        this.draggedCategoryItem.classList.add('category-item-dragging');
        this.draggedCategoryItem.style.opacity = '0.5';
        this.draggedCategoryItem.style.transform = 'rotate(2deg) scale(1.02)';

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedCategoryItem.dataset.categoryId);
    }

    handleCategoryManagementDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const targetItem = e.target.closest('.category-item');
        if (!targetItem || targetItem === this.draggedCategoryItem) return;

        // Remove existing indicators
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('category-item-drag-over-top', 'category-item-drag-over-bottom');
        });

        // Add visual indicator
        const rect = targetItem.getBoundingClientRect();
        const mouseY = e.clientY;
        const midPoint = rect.top + (rect.height / 2);

        if (mouseY < midPoint) {
            targetItem.classList.add('category-item-drag-over-top');
        } else {
            targetItem.classList.add('category-item-drag-over-bottom');
        }
    }

    handleCategoryManagementDragLeave(e) {
        const targetItem = e.target.closest('.category-item');
        if (targetItem) {
            const rect = targetItem.getBoundingClientRect();
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                targetItem.classList.remove('category-item-drag-over-top', 'category-item-drag-over-bottom');
            }
        }
    }

    handleCategoryManagementDrop(e) {
        e.preventDefault();

        const targetItem = e.target.closest('.category-item');
        if (!targetItem || !this.draggedCategoryItem || targetItem === this.draggedCategoryItem) return;

        // Remove visual indicators
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('category-item-drag-over-top', 'category-item-drag-over-bottom');
        });

        // Determine drop position
        const rect = targetItem.getBoundingClientRect();
        const mouseY = e.clientY;
        const midPoint = rect.top + (rect.height / 2);
        const insertBefore = mouseY < midPoint;

        // Reorder categories
        const draggedCategoryId = this.draggedCategoryItem.dataset.categoryId;
        const targetCategoryId = targetItem.dataset.categoryId;

        const draggedIndex = this.categories.findIndex(cat => cat.id === draggedCategoryId);
        const targetIndex = this.categories.findIndex(cat => cat.id === targetCategoryId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged category
            const draggedCategory = this.categories.splice(draggedIndex, 1)[0];
            
            // Calculate new index
            let newIndex = targetIndex;
            if (draggedIndex < targetIndex) {
                newIndex = targetIndex - 1;
            }
            if (insertBefore) {
                newIndex = targetIndex;
            } else {
                newIndex = targetIndex + 1;
            }

            // Insert at new position
            this.categories.splice(newIndex, 0, draggedCategory);

            // Save new order and update both displays
            this.saveCategoryOrder();
            this.updateCategoriesList(); // Update management section
            this.updateDisplay(); // Update team list
        }
    }

    handleCategoryManagementDragEnd(e) {
        if (this.draggedCategoryItem) {
            this.draggedCategoryItem.classList.remove('category-item-dragging');
            this.draggedCategoryItem.style.opacity = '';
            this.draggedCategoryItem.style.transform = '';
        }

        // Remove all visual indicators
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('category-item-drag-over-top', 'category-item-drag-over-bottom');
        });

        this.draggedCategoryItem = null;
    }

    refreshDisplay() {
        this.updateDisplay(); // Use the new category-based display method
    }

    saveOrder() {
        // Get all team members in their current order from all categories
        const newOrder = [];
        
        // Get all category member lists
        const categoryLists = document.querySelectorAll('.category-members');
        
        categoryLists.forEach(categoryList => {
            const category = categoryList.dataset.category;
            const members = Array.from(categoryList.querySelectorAll('.person'));
            
            members.forEach(person => {
                const name = person.querySelector('.name').textContent;
                const colleague = this.colleagues.find(c => c.name === name);
                if (colleague) {
                    // Special handling for favorites - don't change the original category
                    if (category === 'favorites') {
                        // Just mark as favorite, keep original category
                        colleague.favorite = true;
                    } else {
                        // Update category if it changed (for non-favorites categories)
                        if (colleague.category !== category) {
                            colleague.category = category;
                        }
                        // If moving away from favorites, unmark as favorite
                        if (colleague.favorite) {
                            colleague.favorite = false;
                        }
                    }
                    
                    // Only add to newOrder if not already added (prevents duplicates)
                    if (!newOrder.find(c => c.name === colleague.name)) {
                        newOrder.push(colleague);
                    }
                }
            });
        });
        
        // Update the colleagues array with new order
        this.colleagues = newOrder;
        
        // Save to local storage
        this.saveToStorage();
    }

    createPersonElement(person, index, isFavorite) {
        const div = document.createElement('div');
        div.className = 'person';
        div.dataset.name = person.name;
        div.dataset.timezone = person.timezone;
        
        // Add category class and border color
        const category = person.category || 'general';
        const categoryInfo = this.categories.find(cat => cat.id === category);
        if (categoryInfo) {
            div.style.borderLeftColor = categoryInfo.color;
        }
        
        if (isFavorite) {
            div.classList.add('favorite');
        }
        
        const localDate = new Date();
        const personTime = new Date().toLocaleTimeString("en-US", { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: person.timezone 
        });
        const diffHours = this.getTimeDifference(person.timezone);
        
        div.innerHTML = `
            <div class="name">${person.name}</div>
            <div class="time">${personTime} <span class="timezone">(${this.getFriendlyTimezoneName(person.timezone)})</span></div>
            <div class="diff">${this.formatTimeDifference(diffHours)} ${this.getFriendlyTimezoneName(this.myTimezone)}</div>
            <div class="category-badge">${categoryInfo ? categoryInfo.name : 'General'}</div>
            <button class="ping-btn" data-name="${person.name}" title="Ping ${person.name} - Open chat">Ping</button>
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-name="${person.name}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">${isFavorite ? '&starf;' : '&star;'}</button>
            <button class="remove-btn" data-name="${person.name}" title="Remove ${person.name}">X</button>
            <button class="expand-btn" title="Show/Hide Details">&darr;</button>
            <div class="expanded-content">
                <div class="detail-row">
                    <span class="detail-label">Designation:</span>
                    <span class="detail-value">${person.designation || 'Not specified'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${person.phone ? `<a href="tel:${person.phone}">${person.phone}</a>` : 'Not specified'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${person.email ? `<a href="mailto:${person.email}">${person.email}</a>` : 'Not specified'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">
                        <select class="category-select" data-name="${person.name}">
                            ${this.categories.map(cat => 
                                `<option value="${cat.id}" ${cat.id === category ? 'selected' : ''}>${cat.name}</option>`
                            ).join('')}
                        </select>
                    </span>
                </div>
                <div class="edit-row">
                    <button class="edit-btn" data-name="${person.name}" title="Edit ${person.name}">Edit</button>
                </div>
            </div>
        `;
        
        return div;
    }

    addDragAndDropListeners() {
        const allPersons = document.querySelectorAll('.person');
        
        allPersons.forEach(person => {
            person.addEventListener('dragstart', (e) => this.handleDragStart(e));
            person.addEventListener('dragend', (e) => this.handleDragEnd(e));
            person.addEventListener('dragover', (e) => this.handleDragOver(e));
            person.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            person.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            person.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }

    // Event listeners
    setupEventListeners() {
        // Validate required DOM elements exist
        const requiredElements = [
            'add-person',
            'new-name',
            'new-timezone',
            'regular-section'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.error('Missing required DOM elements:', missingElements);
            return;
        }

        // Add person button
        document.getElementById('add-person').addEventListener('click', () => {
            const name = document.getElementById('new-name').value;
            const timezone = document.getElementById('new-timezone').value;
            const designation = document.getElementById('new-designation').value;
            const phone = document.getElementById('new-phone').value;
            const email = document.getElementById('new-email').value;
            
            if (this.addPerson(name, timezone, designation, phone, email)) {
                document.getElementById('new-name').value = '';
                document.getElementById('new-timezone').value = '';
                document.getElementById('new-designation').value = '';
                document.getElementById('new-phone').value = '';
                document.getElementById('new-email').value = '';
                
                // Clear custom timezone input if it exists
                const customMemberTzInput = document.getElementById('custom-member-tz-input');
                if (customMemberTzInput) {
                    customMemberTzInput.value = '';
                }
                
                // Hide custom timezone input
                const customMemberTzInputDiv = document.getElementById('custom-member-timezone-input');
                if (customMemberTzInputDiv) {
                    customMemberTzInputDiv.style.display = 'none';
                }
                
                // Reset custom timezone
                this.customMemberTimezone = '';
            }
        });



        // Home timezone select change
        document.getElementById('home-timezone').addEventListener('change', () => {
            const selectedTimezone = document.getElementById('home-timezone').value;
            if (selectedTimezone === 'custom') {
                document.getElementById('custom-home-timezone-input').style.display = 'block';
                document.getElementById('custom-home-tz-input').focus();
            } else {
                document.getElementById('custom-home-timezone-input').style.display = 'none';
                if (this.setHomeTimezone(selectedTimezone)) {
                    this.updateTimes();
                }
            }
        });

        // New timezone select change
        const newTimezoneSelect = document.getElementById('new-timezone');
        if (newTimezoneSelect) {
            newTimezoneSelect.addEventListener('change', function() {
                const customInput = document.getElementById('custom-member-timezone-input');
                if (customInput) {
                    if (this.value === 'custom') {
                        customInput.style.display = 'block';
                    } else {
                        customInput.style.display = 'none';
                    }
                }
            });
        }

        // Custom home timezone button
        const customHomeTzBtn = document.getElementById('custom-home-timezone');
        if (customHomeTzBtn) {
            customHomeTzBtn.addEventListener('click', () => {
                const customInput = document.getElementById('custom-home-timezone-input');
                if (customInput) {
                    customInput.style.display = customInput.style.display === 'none' ? 'block' : 'none';
                }
            });
        }

        // Custom home timezone input
        const customHomeTzInput = document.getElementById('custom-home-tz-input');
        if (customHomeTzInput) {
            customHomeTzInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const timezone = customHomeTzInput.value;
                    if (this.setHomeTimezone(timezone)) {
                        customHomeTzInput.value = '';
                        const customInput = document.getElementById('custom-home-timezone-input');
                        if (customInput) {
                            customInput.style.display = 'none';
                        }
                        const homeTzSelect = document.getElementById('home-timezone');
                        if (homeTzSelect) {
                            homeTzSelect.value = 'custom';
                        }
                    }
                }
            });
        }

        // Custom member timezone button
        const customMemberTzBtn = document.getElementById('custom-member-timezone');
        if (customMemberTzBtn) {
            customMemberTzBtn.addEventListener('click', () => {
                const customInput = document.getElementById('custom-member-timezone-input');
                if (customInput) {
                    customInput.style.display = customInput.style.display === 'none' ? 'block' : 'none';
                }
            });
        }

        // Custom member timezone input
        const customMemberTzInput = document.getElementById('custom-member-tz-input');
        if (customMemberTzInput) {
            customMemberTzInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const timezone = customMemberTzInput.value;
                    if (timezone.trim()) {
                        const newTzSelect = document.getElementById('new-timezone');
                        if (newTzSelect) {
                            newTzSelect.value = 'custom';
                        }
                        // Store custom timezone for later use
                        this.customMemberTimezone = timezone.trim();
                    }
                }
            });
        }

        // Event delegation for dynamically added elements
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Handle remove button clicks
            if (target.classList.contains('remove-btn')) {
                const name = target.dataset.name;
                if (confirm(`Are you sure you want to remove ${name} from the team?`)) {
                    this.removePerson(name);
                }
            }
            
            // Handle favorite button clicks
            if (target.classList.contains('favorite-btn')) {
                const name = target.dataset.name;
                this.toggleFavorite(name);
            }
            
            // Handle expand button clicks
            if (target.classList.contains('expand-btn')) {
                const personCard = target.closest('.person');
                if (personCard) {
                    this.toggleExpanded(personCard, target);
                }
            }
            
            // Handle edit button clicks
            if (target.classList.contains('edit-btn')) {
                const name = target.dataset.name;
                this.editPerson(name);
            }
            
            // Handle ping button clicks
            if (target.classList.contains('ping-btn')) {
                const name = target.dataset.name;
                this.pingPerson(name);
            }
            
            // Handle save edit button clicks
            if (target.classList.contains('save-edit-btn')) {
                const oldName = target.dataset.oldName;
                this.saveEdit(oldName);
            }
            
            // Handle cancel edit button clicks
            if (target.classList.contains('cancel-edit-btn')) {
                const editForm = document.querySelector('.edit-form-overlay');
                if (editForm) {
                    editForm.remove();
                }
            }
        });

        // Home timezone selector
        const homeTimezoneSelect = document.getElementById('home-timezone');
        if (homeTimezoneSelect) {
            homeTimezoneSelect.value = this.myTimezone;
            homeTimezoneSelect.addEventListener('change', (e) => {
                this.setHomeTimezone(e.target.value);
            });
        }

        // Toggle forms button
        const toggleBtn = document.getElementById('toggle-forms');
        const settingsSection = document.getElementById('settings-section');
        const toggleSection = document.querySelector('.toggle-section');
        
        if (toggleBtn && settingsSection) {
            const textEl = toggleBtn.querySelector('.toggle-text');
            toggleBtn.addEventListener('click', () => {
                const currentlyVisible = settingsSection.style.display !== 'none';
                settingsSection.style.display = currentlyVisible ? 'none' : 'block';
                if (textEl) textEl.textContent = currentlyVisible ? 'Show Settings' : 'Hide Settings';
                toggleBtn.classList.toggle('active', !currentlyVisible);
                
                // Add active class to toggle section for visual feedback
                if (toggleSection) {
                    toggleSection.classList.toggle('active', !currentlyVisible);
                }
            });
        }

        // Category management
        const addCategoryBtn = document.getElementById('add-category');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                const nameInput = document.getElementById('new-category-name');
                const colorInput = document.getElementById('new-category-color');
                
                if (nameInput && colorInput && nameInput.value.trim()) {
                    const name = nameInput.value.trim();
                    const color = colorInput.value;
                    
                    // Check if category already exists
                    if (this.categories.find(cat => cat.name.toLowerCase() === name.toLowerCase())) {
                        alert('Category already exists!');
                        return;
                    }
                    
                    this.addCategory(name, color);
                    nameInput.value = '';
                    colorInput.value = '#6c757d';
                    this.updateDisplay();
                }
            });
        }

        // Event delegation for category select changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('category-select')) {
                const name = e.target.dataset.name;
                const newCategory = e.target.value;
                
                const colleague = this.colleagues.find(c => c.name === name);
                if (colleague) {
                    colleague.category = newCategory;
                    // Update favorite status based on category
                    colleague.favorite = (newCategory === 'favorites');
                    this.saveToStorage();
                    this.updateDisplay();
                }
            }
        });

        // Event delegation for category management buttons
        document.addEventListener('click', (e) => {
            // Delete category button
            if (e.target.classList.contains('delete-category-btn')) {
                const categoryId = e.target.dataset.category;
                if (confirm(`Are you sure you want to delete this category? All members will be moved to General.`)) {
                    this.deleteCategory(categoryId);
                }
            }

            // Edit category button
            if (e.target.classList.contains('edit-category-btn')) {
                const categoryId = e.target.dataset.category;
                this.editCategory(categoryId);
            }
        });
    }

    // Validation
    validateTimezones() {
        const invalidTimezones = [];
        
        this.colleagues.forEach(c => {
            try {
                new Date().toLocaleString("en-US", { timeZone: c.timezone });
            } catch (error) {
                invalidTimezones.push({ name: c.name, timezone: c.timezone, error: error.message });
            }
        });
        
        if (invalidTimezones.length > 0) {
            console.error("Invalid timezones found:", invalidTimezones);
            return false;
        }
        
        return true;
    }

    pingPerson(name) {
        // Get the team member details
        const person = this.colleagues.find(c => c.name === name);
        if (!person) return;
        
        // Create a modal to choose the platform
        const modal = document.createElement('div');
        modal.className = 'ping-modal-overlay';
        modal.innerHTML = `
            <div class="ping-modal">
                <h3>Ping ${name}</h3>
                <p>Choose how you want to contact ${name}:</p>
                <div class="ping-options">
                    <button class="ping-option premium" data-platform="slack" data-name="${name}" disabled>
                        Slack
                        <span class="premium-badge">Premium</span>
                    </button>
                    <button class="ping-option ${!person.email ? 'teams-no-email' : ''}" data-platform="teams" data-name="${name}" ${!person.email ? 'title="Email address required for Teams integration"' : ''}>
                        Microsoft Teams
                        <span class="help-icon" data-platform="teams-help" title="Click for Teams integration help">?</span>
                        ${!person.email ? '<span class="warning-icon">⚠️</span>' : ''}
                    </button>
                    <button class="ping-option premium" data-platform="discord" data-name="${name}" disabled>
                        Discord
                        <span class="premium-badge">Premium</span>
                    </button>
                    <button class="ping-option" data-platform="email" data-name="${name}">
                        Email
                    </button>
                    <button class="ping-option" data-platform="phone" data-name="${name}">
                        Phone
                    </button>
                </div>
                <div class="beta-note">
                    <p><strong>Beta Version</strong> - More improvements coming soon!</p>
                    <p><strong>Premium Features</strong> - Slack & Discord integration available in premium version</p>
                </div>
                <div class="ping-actions">
                    <button class="cancel-ping-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle platform selection
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('ping-option')) {
                const platform = e.target.dataset.platform;
                const personName = e.target.dataset.name;
                
                // Check if it's a premium feature
                if (e.target.classList.contains('premium') && e.target.disabled) {
                    this.showPremiumMessage(platform);
                    return;
                }
                
                this.openChat(platform, personName, person);
                modal.remove();
            }
            
            // Handle help icon click
            if (e.target.classList.contains('help-icon')) {
                e.stopPropagation();
                this.showTeamsHelpModal();
            }
            
            if (e.target.classList.contains('cancel-ping-btn')) {
                modal.remove();
            }
        });
    }
    
    openChat(platform, personName, person) {
        let url = '';
        let message = `Hi ${personName}!`;
        
        switch (platform) {
            case 'slack':
                // Try to open Slack app with direct message using email, fallback to web
                if (person.email) {
                    this.tryOpenApp(`slack://user?team=YOUR_TEAM_ID&id=${person.email}`, 
                        `https://slack.com/app/A0F82E8CA-DM?team=YOUR_TEAM_ID&id=${person.email}`);
                } else {
                    // If no email, open general Slack
                    this.tryOpenApp(`slack://`, 
                        `https://slack.com/app/A0F82E8CA-DM`);
                }
                break;
                
            case 'teams':
                // Try to open Teams app with direct chat using email, fallback to web
                if (person.email) {
                    this.tryOpenApp(`msteams://teams.microsoft.com/l/chat/0/0?users=${person.email}`, 
                        `https://teams.microsoft.com/l/chat/0/0?users=${person.email}`);
                } else {
                    // If no email, show helpful message and open general Teams
                    alert(`${personName} doesn't have an email address set. Please add their email in the contact details for direct Teams integration. Opening general Teams instead.`);
                    this.tryOpenApp(`msteams://teams.microsoft.com`, 
                        `https://teams.microsoft.com`);
                }
                break;
                
            case 'discord':
                // Discord web version (no app protocol)
                url = `https://discord.com/channels/@me`;
                window.open(url, '_blank');
                break;
                
            case 'email':
                if (person.email) {
                    url = `mailto:${person.email}?subject=Hi ${personName}!&body=${message}`;
                    window.open(url, '_blank');
                } else {
                    alert(`${personName} doesn't have an email address set.`);
                }
                return;
                
            case 'phone':
                if (person.phone) {
                    url = `tel:${person.phone}`;
                    window.open(url, '_blank');
                } else {
                    alert(`${personName} doesn't have a phone number set.`);
                }
                return;
        }
        
        if (platform !== 'email' && platform !== 'phone') {
            // Show success message
            this.showPingSuccess(platform, personName);
        }
    }
    
    tryOpenApp(appUrl, webUrl) {
        // Create a hidden iframe to try opening the app
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = appUrl;
        
        // Add to DOM
        document.body.appendChild(iframe);
        
        // Set a timeout to check if app opened
        const timeout = setTimeout(() => {
            // If we're still here after 2 seconds, app probably didn't open
            // Remove iframe and open web version
            document.body.removeChild(iframe);
            window.open(webUrl, '_blank');
        }, 2000);
        
        // Listen for iframe load/error to detect if app opened
        iframe.onload = () => {
            clearTimeout(timeout);
            document.body.removeChild(iframe);
            // App opened successfully
        };
        
        iframe.onerror = () => {
            clearTimeout(timeout);
            document.body.removeChild(iframe);
            // App failed, open web version
            window.open(webUrl, '_blank');
        };
    }
    
    showPingSuccess(platform, personName) {
        const notification = document.createElement('div');
        notification.className = 'ping-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span>Opening ${platform} to ping ${personName}...</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showPremiumMessage(platform) {
        alert(`Premium feature for ${platform} is not yet available in this version. Please upgrade to the premium version for full functionality.`);
    }

    showTeamsHelpModal() {
        const helpModal = document.createElement('div');
        helpModal.className = 'ping-modal-overlay';
        helpModal.innerHTML = `
            <div class="ping-modal teams-help-modal">
                <h3>&#128161; Microsoft Teams Integration Help</h3>
                <div class="help-content">
                    <p><strong>For Teams integration to work properly:</strong></p>
                    <ul>
                        <li>Make sure the team member has a valid email address added in their contact details</li>
                        <li>The email should be associated with their Microsoft Teams account</li>
                        <li>If no email is set, Teams will open to the general interface instead</li>
                    </ul>
                    <div class="help-steps">
                        <p><strong>To add an email address:</strong></p>
                        <ol>
                            <li>Click the "Edit" button on the team member's card</li>
                            <li>Fill in the "Email" field with their work email</li>
                            <li>Save the changes</li>
                            <li>Now Teams integration will work directly!</li>
                        </ol>
                    </div>
                </div>
                <div class="ping-actions">
                    <button class="cancel-ping-btn">Got it!</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        // Handle close button
        helpModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-ping-btn') || e.target === helpModal) {
                helpModal.remove();
            }
        });
    }

    addCategory(name, color = '#6c757d') {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        const newCategory = { id, name, color };
        this.categories.push(newCategory);
        this.saveCategories();
        this.updateDisplay();
        return newCategory;
    }
    
    removeCategory(categoryId) {
        if (categoryId === 'favorites') return; // Can't remove favorites
        
        // Move all members from this category to 'general'
        this.colleagues.forEach(colleague => {
            if (colleague.category === categoryId) {
                colleague.category = 'general';
            }
        });
        
        this.categories = this.categories.filter(cat => cat.id !== categoryId);
        this.saveCategories();
        this.saveToStorage();
        this.updateDisplay();
    }
    
    renameCategory(categoryId, newName) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
            category.name = newName;
            this.saveCategories();
            this.updateDisplay();
        }
    }
    
    changeCategoryColor(categoryId, newColor) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
            category.color = newColor;
            this.saveCategories();
            this.updateDisplay();
        }
    }
    
    saveCategories() {
        localStorage.setItem('team_categories', JSON.stringify(this.categories));
        this.saveCategoryOrder();
    }
    
    loadCategories() {
        const saved = localStorage.getItem('team_categories');
        if (saved) {
            this.categories = JSON.parse(saved);
        }
        this.loadCategoryOrder();
    }

    loadCategoryOrder() {
        try {
            const saved = localStorage.getItem(this.categoryOrderKey);
            if (saved) {
                const categoryOrder = JSON.parse(saved);
                // Reorder categories based on saved order
                this.categories.sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a.id);
                    const indexB = categoryOrder.indexOf(b.id);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            }
        } catch (error) {
            console.error("Error loading category order:", error);
        }
    }

    saveCategoryOrder() {
        try {
            const categoryOrder = this.categories.map(cat => cat.id);
            localStorage.setItem(this.categoryOrderKey, JSON.stringify(categoryOrder));
        } catch (error) {
            console.error("Error saving category order:", error);
        }
    }

    updateTimes() {
        // Update all time displays without re-rendering the entire display
        const timeElements = document.querySelectorAll('.person .time');
        timeElements.forEach(timeElement => {
            const personCard = timeElement.closest('.person');
            const timezone = personCard.dataset.timezone;
            
            if (timezone) {
                const personTime = new Date().toLocaleTimeString("en-US", { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: timezone 
                });
                timeElement.innerHTML = `${personTime} <span class="timezone">(${this.getFriendlyTimezoneName(timezone)})</span>`;
                
                // Add animation class
                timeElement.classList.add('time-updating');
                setTimeout(() => {
                    timeElement.classList.remove('time-updating');
                }, 300);
            }
        });
    }

    updateDisplay() {
        const mainContainer = document.getElementById("regular-section");
        if (!mainContainer) return;

        // Clear existing content
        mainContainer.innerHTML = "";

        // Group team members by category
        const groupedMembers = {};
        this.categories.forEach(cat => {
            groupedMembers[cat.id] = [];
        });

        // Sort team members into categories
        this.colleagues.forEach((colleague, index) => {
            const category = colleague.category || 'general';
            
            // Add person to their original category
            if (groupedMembers[category]) {
                groupedMembers[category].push({ ...colleague, index });
            }
            
            // If person is marked as favorite, also add them to favorites category
            if (colleague.favorite && category !== 'favorites') {
                groupedMembers['favorites'].push({ ...colleague, index });
            }
        });

        // Create category sections
        this.categories.forEach(category => {
            const members = groupedMembers[category.id];
            
            // Skip empty categories except favorites and general
            if (members.length === 0 && category.id !== 'favorites' && category.id !== 'general') {
                return;
            }

            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            categorySection.dataset.category = category.id;

            const header = document.createElement('h4');
            header.className = 'category-header';
            header.style.borderLeftColor = category.color;
            header.innerHTML = `
                <span class="category-title">${category.name}</span>
                <span class="member-count">(${members.length})</span>
            `;

            const memberList = document.createElement('div');
            memberList.className = 'category-members';
            memberList.dataset.category = category.id;

            // Add team members to this category
            members.forEach(member => {
                const div = this.createPersonElement(member, member.index, category.id === 'favorites');
                memberList.appendChild(div);
            });

            categorySection.appendChild(header);
            categorySection.appendChild(memberList);
            mainContainer.appendChild(categorySection);
        });

        // Show empty state if no team members at all
        if (this.colleagues.length === 0) {
            mainContainer.innerHTML = `
                <div class="no-members">
                    <h4>Welcome to Team Timezones!</h4>
                    <p>Start by adding your team members to track their timezones and working hours. Click "Show Settings" above to get started!</p>
                </div>
            `;
        }

        // Re-add drag and drop to new elements
        document.querySelectorAll('.person').forEach(element => {
            if (!element.draggable) {
                element.draggable = true;
                element.addEventListener('dragstart', this.handleDragStart, false);
                element.addEventListener('dragover', this.handleDragOver, false);
                element.addEventListener('dragleave', this.handleDragLeave, false);
                element.addEventListener('drop', this.handleDrop, false);
                element.addEventListener('dragend', this.handleDragEnd, false);
                element.style.cursor = 'grab';
                console.log('Re-attached drag to:', element.querySelector('.name')?.textContent);
            }
        });

        // Add drag and drop to category sections
        document.querySelectorAll('.category-section').forEach(section => {
            this.addCategoryDragAndDrop(section);
        });

        // Update categories list in management section
        this.updateCategoriesList();
    }

    updateCategoriesList() {
        const categoriesList = document.getElementById('categories-list');
        if (!categoriesList) return;

        categoriesList.innerHTML = '';

        this.categories.forEach(category => {
            if (category.id === 'favorites') return; // Don't show favorites in management

            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.draggable = true;
            categoryItem.dataset.categoryId = category.id;
            categoryItem.innerHTML = `
                <div class="category-info">
                    <span class="category-color" style="background-color: ${category.color}"></span>
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">${this.colleagues.filter(c => c.category === category.id).length} members</span>
                </div>
                <div class="category-actions">
                    <button class="edit-category-btn" data-category="${category.id}" title="Edit ${category.name}">Edit</button>
                    <button class="delete-category-btn" data-category="${category.id}" title="Delete ${category.name}">Delete</button>
                </div>
            `;
            categoriesList.appendChild(categoryItem);
        });

        // Add drag and drop to category items
        this.addCategoryManagementDragAndDrop();
    }

    deleteCategory(categoryId) {
        // Don't allow deleting favorites or general categories
        if (categoryId === 'favorites' || categoryId === 'general') {
            alert('Cannot delete system categories!');
            return;
        }

        // Move all members from this category to general
        this.colleagues.forEach(colleague => {
            if (colleague.category === categoryId) {
                colleague.category = 'general';
            }
        });

        // Remove the category
        this.categories = this.categories.filter(cat => cat.id !== categoryId);
        
        // Save changes
        this.saveCategories();
        this.saveToStorage();
        
        // Update display
        this.updateDisplay();
    }

    editCategory(categoryId) {
        // Don't allow editing system categories
        if (categoryId === 'favorites' || categoryId === 'general') {
            alert('Cannot edit system categories!');
            return;
        }

        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        const editForm = document.createElement('div');
        editForm.className = 'edit-form-overlay';
        editForm.innerHTML = `
            <div class="edit-form">
                <h3>Edit Category: ${category.name}</h3>
                <div class="form-row">
                    <label for="edit-category-name">Name:</label>
                    <input type="text" id="edit-category-name" value="${category.name}" placeholder="Category Name" maxlength="50">
                </div>
                <div class="form-row">
                    <label for="edit-category-color">Color:</label>
                    <input type="color" id="edit-category-color" value="${category.color}" title="Choose a color for the category">
                </div>
                <div class="form-row button-row">
                    <button class="btn btn-primary save-category-btn" data-category-id="${categoryId}">Save Changes</button>
                    <button class="btn btn-secondary cancel-category-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(editForm);

        // Handle save category button
        editForm.querySelector('.save-category-btn').addEventListener('click', () => {
            const newName = editForm.querySelector('#edit-category-name').value.trim();
            const newColor = editForm.querySelector('#edit-category-color').value;

            if (!newName) {
                alert('Category name cannot be empty.');
                return;
            }

            if (newName.length < 2) {
                alert('Category name must be at least 2 characters long.');
                return;
            }

            if (this.categories.find(cat => cat.name.toLowerCase() === newName.toLowerCase() && cat.id !== categoryId)) {
                alert('A category with this name already exists.');
                return;
            }

            this.renameCategory(categoryId, newName);
            this.changeCategoryColor(categoryId, newColor);
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10001;
                animation: slideInRight 0.3s ease;
            `;
            successMessage.textContent = `Category "${newName}" updated successfully!`;
            document.body.appendChild(successMessage);
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.remove();
                }
            }, 3000);
            
            editForm.remove();
        });

        // Handle cancel category button
        editForm.querySelector('.cancel-category-btn').addEventListener('click', () => {
            editForm.remove();
        });
    }

    // UI updates
    updateTimes() {
        this.updateDisplay(); // Use the new category-based display
    }
}

// Initialize the manager
let teamManager;
document.addEventListener('DOMContentLoaded', () => {
    try {
        teamManager = new TeamTimezoneManager();
        console.log('Team Timezone Manager initialized successfully');
    } catch (error) {
        console.error('Error initializing Team Timezone Manager:', error);
        // Show user-friendly error message
        const teamSection = document.querySelector('.team-section');
        if (teamSection) {
            teamSection.innerHTML = `
                <div class="error-state">
                    <h3>⚠️ Error Loading Extension</h3>
                    <p>There was an error loading the team timezone manager. Please refresh the page or check the console for details.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
                </div>
            `;
        }
    }
});
  