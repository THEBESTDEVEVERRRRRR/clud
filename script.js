
// Define updateSelectedSpecDisplay globally
function updateSelectedSpecDisplay(info) {
    const selectedSpecDisplay = document.getElementById('selected-spec');
    const noSelection = selectedSpecDisplay.querySelector('.no-selection');
    if (noSelection) noSelection.style.display = 'none';
    
    // Remove any existing spec content
    const existingContent = selectedSpecDisplay.querySelector('.selected-spec-content');
    if (existingContent) {
        existingContent.remove();
    }
    
    // Create new spec content
    const specContent = document.createElement('div');
    specContent.className = 'selected-spec-content active'; // Add active class here
    selectedSpecDisplay.appendChild(specContent);
    
    // Details
    const detailsList = info.details.map(detail => `<li>${detail}</li>`).join('');
    
    // Get the existing location div from the HTML
    const existingLocDiv = document.getElementById('spec-rundown-location');
    console.log('Location div found:', existingLocDiv);
    console.log('Card type:', info.type);
    console.log('Is preconfigured:', info.isPreconfigured);
    
    if (existingLocDiv) {
        // Show/hide the existing location selector based on card type
        if (info.isPreconfigured) {
            existingLocDiv.style.setProperty('display', 'block', 'important');
            console.log('Setting location div to display:block');
        } else {
            existingLocDiv.style.setProperty('display', 'none', 'important');
            console.log('Setting location div to display:none');
        }
    }
    
    specContent.innerHTML = `
        <div class="selected-spec-header">
            <div class="selected-spec-info">
                <h3 class="selected-spec-title">${info.name}</h3>
                <p class="selected-spec-type">${info.type}</p>
            </div>
            <div class="selected-spec-price">${info.price}</div>
        </div>
        <div class="selected-spec-details">
            <ul>${detailsList}</ul>
        </div>
        ${info.isPreconfigured ? `
        <div class="spec-rundown-location" style="display:block; margin-top: 1.5rem;">
            <label for="spec-location-select" class="location-label" style="font-weight:600;">Location:</label>
            <select class="location-dropdown" id="spec-location-select" style="margin-left:0.5rem;">
                <option value="">Select Location</option>
                <option value="random">Random Location (Free)</option>
                <optgroup label="North America (+$5/month)">
                    <option value="us-east">United States - East Coast</option>
                    <option value="us-west">United States - West Coast</option>
                </optgroup>
                <optgroup label="Europe (+$5/month)">
                    <option value="eu-central">Europe - Central</option>
                    <option value="eu-west">Europe - West</option>
                </optgroup>
                <optgroup label="Asia (+$5/month)">
                    <option value="asia-east">Asia - East</option>
                    <option value="asia-southeast">Asia - Southeast</option>
                </optgroup>
            </select>
        </div>
        ` : ''}`;
}

// --- SINGLE DOMContentLoaded: All UI and Payment Logic Unified ---
document.addEventListener('DOMContentLoaded', function() {
    // UI Initialization
    initMobileNavigation();
    initTestimonialCarousel();
    initSpecSelector();
    initCustomConfiguration();
    initSmoothScrolling();
    initScrollAnimations();


    // --- Server Card Selection (robust, unified) ---
    window.selectedServerCard = null;
    function clearSelections() {
        document.querySelectorAll('.featured-spec-card, .option-card').forEach(c => c.classList.remove('selected'));
    }
    function getCardInfo(card) {
        // Determine if it's a featured/preconfigured card
        const isFeatured = card.classList.contains('featured-spec-card');
        console.log('Is featured card:', isFeatured);

        if (isFeatured) {
            console.log('Featured card selected:', card);
            const info = {
                name: card.querySelector('.spec-title').textContent,
                price: card.querySelector('.spec-price-large').textContent,
                type: card.getAttribute('data-type'),
                details: Array.from(card.querySelectorAll('.highlight')).map(h => h.textContent),
                isPreconfigured: true // Always true for featured cards
            };
            console.log('Card info:', info);
            return info;
        } else {
            const info = {
                name: card.querySelector('.option-name').textContent,
                price: card.querySelector('.option-price').textContent,
                type: card.getAttribute('data-type'),
                details: [card.querySelector('.option-specs').textContent],
                isPreconfigured: false
            };
            console.log('Option card info:', info);
            return info;
        }
    }
    function handleCardSelection(card) {
        console.log('Handling card selection:', card);
        console.log('Card classList:', Array.from(card.classList));
        
        clearSelections();
        card.classList.add('selected');
        window.selectedServerCard = card;
        
        // Get and validate card info
        const info = getCardInfo(card);
        console.log('Processed card info:', info);
        
        // Update display with card info
        updateSelectedSpecDisplay(info);
    }
    // Handle featured card clicks
    document.querySelectorAll('.featured-spec-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't handle if clicking the select button
            if (e.target.closest('.select-spec-btn')) return;
            console.log('Featured card clicked:', this);
            handleCardSelection(this);
        });
    });

    // Handle option card clicks
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function(e) {
            console.log('Option card clicked:', this);
            handleCardSelection(this);
        });
    });

    // --- Featured Plan Payment (Select This Server) ---
    document.querySelectorAll('.featured-spec-card .select-spec-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const locationSelect = document.getElementById('spec-location-select');
            const card = this.closest('.featured-spec-card');
            
            // Check if location is selected for preconfigured servers
            if (!locationSelect.value) {
                alert('Please select a server location before proceeding.');
                locationSelect.focus();
                return;
            }

            document.querySelectorAll('.featured-spec-card, .option-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            window.selectedServerCard = card;
            // Get plan info
            const price = card.querySelector('.spec-price-large').textContent.replace(/[^\d]/g, '');
            const name = card.querySelector('.spec-title').textContent;
            const plan = { name, amount: parseInt(price), type: 'featured' };
            onAuthStateChanged(auth, (user) => {
                if (!user) {
                    window.location.href = 'sign-in.html';
                } else {
                    showPaymentModal(plan);
                }
            });
        });
    });

    // --- Deploy Selected Server Button ---
    const deploySelectedBtn = document.getElementById('deploy-selected-server');
    if (deploySelectedBtn) {
        deploySelectedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = window.selectedServerCard;
            if (!card) {
                showNotification('Please select a server configuration above first.', 'error');
                return;
            }
            // Featured card
            if (card.classList.contains('featured-spec-card')) {
                // Require location selection
                const locDiv = document.querySelector('.spec-rundown-location');
                const locSelect = locDiv ? locDiv.querySelector('select') : null;
                const locValue = locSelect ? locSelect.value : '';
                if (!locValue) {
                    showNotification('Please select a location for your server.', 'error');
                    if (locSelect) locSelect.focus();
                    return;
                }
                const price = card.querySelector('.spec-price-large').textContent.replace(/[^\d]/g, '');
                const name = card.querySelector('.spec-title').textContent;
                const plan = { name, amount: parseInt(price), type: 'featured', location: locValue };
                onAuthStateChanged(auth, (user) => {
                    if (!user) {
                        window.location.href = 'sign-in.html';
                    } else {
                        showPaymentModal(plan);
                    }
                });
            } else if (card.classList.contains('option-card')) {
                // Dropdown card
                const price = card.querySelector('.option-price').textContent.replace(/[^\d]/g, '');
                const name = card.querySelector('.option-name').textContent;
                const plan = { name, amount: parseInt(price), type: card.getAttribute('data-type') };
                onAuthStateChanged(auth, (user) => {
                    if (!user) {
                        window.location.href = 'sign-in.html';
                    } else {
                        showPaymentModal(plan);
                    }
                });
            }
        });
    }

    // --- Deploy Custom Server Button ---
    const deployCustomBtn = document.getElementById('deploy-custom-btn');
    if (deployCustomBtn) {
        deployCustomBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // No required options validation
            const pricing = calculateCustomPricing();
            const isYearly = document.getElementById('billing-toggle')?.checked;
            const amount = isYearly ? pricing.yearly : pricing.monthly;
            const plan = { name: 'Custom Server', amount, type: 'custom', config: getCustomConfiguration() };
            onAuthStateChanged(auth, (user) => {
                if (!user) {
                    window.location.href = 'sign-in.html';
                } else {
                    showPaymentModal(plan);
                }
            });
        });
    }
});

// Mobile Navigation
function initMobileNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target) || navToggle.contains(event.target);
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}


// --- Custom Configuration Pricing Functions (GLOBAL SCOPE) ---
function calculateCustomPricing() {
    const cpu = parseInt(document.getElementById('cpu-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0');
    const ram = parseInt(document.getElementById('ram-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0');
    const storage = parseInt(document.getElementById('storage-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0');
    const gpu = parseInt(document.getElementById('gpu-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0');
    const region = parseInt(document.getElementById('region-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0');
    const os = parseInt(document.getElementById('os-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0');
    const monthly = cpu + ram + storage + gpu + region + os;
    const yearly = monthly * 10; // 16% discount
    return {
        cpu,
        ram,
        storage,
        gpu,
        region,
        os,
        monthly,
        yearly
    };
}

function getCustomConfiguration() {
    return {
        cpu: {
            text: document.getElementById('cpu-config')?.querySelector('.select-selected')?.textContent || '',
            value: document.getElementById('cpu-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0'
        },
        ram: {
            text: document.getElementById('ram-config')?.querySelector('.select-selected')?.textContent || '',
            value: document.getElementById('ram-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0'
        },
        storage: {
            text: document.getElementById('storage-config')?.querySelector('.select-selected')?.textContent || '',
            value: document.getElementById('storage-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0'
        },
        gpu: {
            text: document.getElementById('gpu-config')?.querySelector('.select-selected')?.textContent || '',
            value: document.getElementById('gpu-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0'
        },
        region: {
            text: document.getElementById('region-config')?.querySelector('.select-selected')?.textContent || '',
            value: document.getElementById('region-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0'
        },
        os: {
            text: document.getElementById('os-config')?.querySelector('.select-selected')?.textContent || '',
            value: document.getElementById('os-config')?.querySelector('.select-selected')?.getAttribute('data-value') || '0'
        },
        pricing: calculateCustomPricing(),
        timestamp: new Date().toISOString()
    };
}

// Custom Configuration System
function initCustomConfiguration() {
    const toggleBtn = document.getElementById('custom-config-toggle');
    const configPanel = document.getElementById('custom-config-panel');
    const billingToggle = document.getElementById('billing-toggle');
    const monthlyLabel = document.getElementById('monthly-label');
    const yearlyLabel = document.getElementById('yearly-label');
    
    if (!toggleBtn || !configPanel) return;
    
    let isExpanded = false;
    
    // Toggle custom config panel
    toggleBtn.addEventListener('click', function() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            configPanel.classList.add('expanded');
            toggleBtn.classList.add('active');
            toggleBtn.querySelector('.toggle-text').textContent = 'Hide Custom Configuration';
            toggleBtn.querySelector('.toggle-icon').textContent = '🛠️';
        } else {
            configPanel.classList.remove('expanded');
            toggleBtn.classList.remove('active');
            toggleBtn.querySelector('.toggle-text').textContent = 'Show Custom Configuration';
            toggleBtn.querySelector('.toggle-icon').textContent = '⚙️';
        }
    });
    
    // Initialize custom select dropdowns
    const customSelects = document.querySelectorAll('.config-option .custom-select');
    customSelects.forEach(select => {
        const selected = select.querySelector('.select-selected');
        const items = select.querySelector('.select-items');
        const options = select.querySelectorAll('.select-items > div:not(.spec-category)');
        
        // Toggle dropdown
        selected.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close other dropdowns
            customSelects.forEach(otherSelect => {
                if (otherSelect !== select) {
                    otherSelect.classList.remove('active');
                }
            });
            
            select.classList.toggle('active');
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const value = this.getAttribute('data-value');
                const text = this.childNodes[0].textContent.trim(); // Get text without description
                
                selected.textContent = text;
                selected.setAttribute('data-value', value);
                
                select.classList.remove('active');
                updateCustomPricing();
            });
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        customSelects.forEach(select => {
            select.classList.remove('active');
        });
    });
    
    // Billing toggle functionality
    if (billingToggle && monthlyLabel && yearlyLabel) {
        billingToggle.addEventListener('change', function() {
            if (this.checked) {
                monthlyLabel.classList.remove('active');
                yearlyLabel.classList.add('active');
            } else {
                monthlyLabel.classList.add('active');
                yearlyLabel.classList.remove('active');
            }
            updateCustomPricing();
        });
    }
    
    // Deploy custom server button
    const deployBtn = document.getElementById('deploy-custom-btn');
    if (deployBtn) {
        deployBtn.addEventListener('click', function() {
            // Check if all required options are selected
            const requiredSelects = ['cpu-config', 'ram-config', 'storage-config', 'region-config', 'os-config'];
            let allSelected = true;
            
            requiredSelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                const selected = select.querySelector('.select-selected');
                const value = selected.getAttribute('data-value');
                
                if (!value || value === '0' || selected.textContent.includes('Select')) {
                    allSelected = false;
                }
            });
            
            if (!allSelected) {
                showNotification('Please select all required configuration options.', 'error');
                return;
            }
            
            // Get total pricing
            const pricing = calculateCustomPricing();
            const isYearly = billingToggle.checked;
            const amount = isYearly ? pricing.yearly : pricing.monthly;
            const billingPeriod = isYearly ? 'yearly' : 'monthly';
            
            showNotification(`Deploying custom server configuration... Total: ${amount}/${billingPeriod}`, 'success');
            
            // Here you would typically redirect to payment or deployment process
            // window.location.href = `payment.html?amount=${amount}&billing=${billingPeriod}&type=custom`;
        });
    }
    
    // Save configuration button
    const saveBtn = document.getElementById('save-config-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const config = getCustomConfiguration();
            localStorage.setItem('savedServerConfig', JSON.stringify(config));
            showNotification('Configuration saved successfully!', 'success');
        });
    }
    
    // Update pricing when any option changes
    function updateCustomPricing() {
        const pricing = calculateCustomPricing();
        const isYearly = billingToggle?.checked || false;
        
        // Update individual cost displays
        document.getElementById('cpu-cost').textContent = `${pricing.cpu}/month`;
        document.getElementById('ram-cost').textContent = `${pricing.ram}/month`;
        document.getElementById('storage-cost').textContent = `${pricing.storage}/month`;
        document.getElementById('gpu-cost').textContent = `${pricing.gpu}/month`;
        document.getElementById('region-cost').textContent = `${pricing.region}/month`;
        document.getElementById('os-cost').textContent = `${pricing.os}/month`;
        
        // Update total
        const totalElement = document.getElementById('total-cost');
        if (isYearly) {
            const yearlyTotal = pricing.monthly * 10; // 16% discount (10 months instead of 12)
            const savings = pricing.monthly * 2;
            totalElement.textContent = `${yearlyTotal}/year (Save ${savings})`;
        } else {
            totalElement.textContent = `${pricing.monthly}/month`;
        }
    }
}

// Testimonial Carousel
function initTestimonialCarousel() {
    const track = document.getElementById('testimonial-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const dots = document.querySelectorAll('.nav-dot');
    
    if (!track || cards.length === 0 || dots.length === 0) return;
    
    let currentSlide = 0;
    const totalSlides = cards.length;
    
    // Auto-advance testimonials
    let autoSlideInterval = setInterval(nextSlide, 5000);
    
    function updateSlide(index) {
        // Remove active class from all cards and dots
        cards.forEach(card => card.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current card and dot
        if (cards[index]) cards[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
        
        // Move track
        track.style.transform = `translateX(-${index * 100}%)`;
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlide(currentSlide);
    }
    
    function goToSlide(index) {
        currentSlide = index;
        updateSlide(currentSlide);
        // Reset auto-advance timer
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 5000);
    }
    
    // Add click handlers to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
    
    // Pause auto-advance on hover
    const testimonialsSection = document.querySelector('.testimonials-carousel');
    if (testimonialsSection) {
        testimonialsSection.addEventListener('mouseenter', () => {
            clearInterval(autoSlideInterval);
        });
        
        testimonialsSection.addEventListener('mouseleave', () => {
            autoSlideInterval = setInterval(nextSlide, 5000);
        });
    }
    
    // Initialize first slide
    updateSlide(0);
}

// Spec Selector
function initSpecSelector() {
    const featuredCards = document.querySelectorAll('.featured-spec-card');
    const showMoreToggle = document.getElementById('show-more-toggle');
    const additionalOptions = document.getElementById('additional-options');
    const optionCards = document.querySelectorAll('.option-card');
    const selectedSpecDisplay = document.getElementById('selected-spec');
    
    let isExpanded = false;
    
    // Server specifications data
    const serverSpecs = {
        1: { name: 'Micro CPU', price: '$1/month', type: 'CPU Server', details: ['4 CPU cores', '8GB RAM', '512GB HDD/SSD', 'AMD EPYC 9965'] },
        5: { name: 'Mini CPU', price: '$5/month', type: 'CPU Server', details: ['8 CPU cores', '16GB RAM', '1TB HDD/SSD', 'AMD EPYC 9965'] },
        10: { name: 'Basic CPU', price: '$10/month', type: 'CPU Server', details: ['16 CPU cores', '32GB RAM', '1TB HDD/SSD', 'AMD EPYC 9174F'] },
        20: { name: 'Standard CPU', price: '$20/month', type: 'CPU Server', details: ['24 CPU cores', '64GB RAM', '2TB HDD/SSD', 'AMD EPYC 9275F'] },
        40: { name: 'Premium CPU', price: '$40/month', type: 'CPU Server', details: ['64 CPU cores', '128GB RAM', '4TB HDD/SSD', 'AMD EPYC 9555P'] },
        15: { name: 'Basic GPU', price: '$15/month', type: 'GPU Server', details: ['Nvidia A100', '2 vCPU', '32GB RAM', '40GB VRAM', '1TB HDD/SSD'] },
        25: { name: 'Standard GPU', price: '$25/month', type: 'GPU Server', details: ['Nvidia L40', '4 vCPU', '64GB RAM', '48GB VRAM', '2TB HDD/SSD'] },
        50: { name: 'Pro GPU', price: '$50/month', type: 'GPU Server', details: ['Nvidia H100', '8 vCPU', '128GB RAM', '96GB VRAM', '4TB HDD/SSD'] },
        100: { name: 'Premium GPU', price: '$100/month', type: 'GPU Server', details: ['Nvidia H200', '16 vCPU', '256GB RAM', '141GB VRAM', '8TB HDD/SSD'] },
        150: { name: 'Ultra GPU', price: '$150/month', type: 'GPU Server', details: ['Nvidia B200', '32 vCPU', '256GB RAM', '180GB VRAM', '16TB HDD/SSD'] },
        30: { name: 'Basic RDP', price: '$30/month', type: 'RDP/VM Server', details: ['Nvidia RTX 3060', 'Intel Core 5 220H', '16GB DDR5 RAM', '12GB VRAM', '1TB SSD', 'Optimized low-latency network'] },
        175: { name: 'Ultra RDP', price: '$175/month', type: 'RDP/VM Server', details: ['Nvidia RTX 5090', 'Ryzen Threadripper PRO 7995WX', '128GB DDR5 RAM', '32GB VRAM', '4TB SSD', 'Optimized low-latency network'] },
        25: { name: 'Basic Storage', price: '$25/month', type: 'Storage Server', details: ['16TB SSD', '2 vCPU', '16GB RAM', 'Multi-database format support'] },
        75: { name: 'Premium Storage', price: '$75/month', type: 'Storage Server', details: ['64TB SSD', '8 vCPU', '64GB RAM', 'Multi-database format support'] }
    };
    
    // Remove legacy card selection logic here; handled by new system at top of file
    
    // Handle show more toggle
    if (showMoreToggle && additionalOptions) {
        showMoreToggle.addEventListener('click', function() {
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                additionalOptions.classList.add('expanded');
                this.classList.add('expanded');
                this.querySelector('.toggle-text').textContent = 'Show Less Options';
            } else {
                additionalOptions.classList.remove('expanded');
                this.classList.remove('expanded');
                this.querySelector('.toggle-text').textContent = 'Show All Server Options';
            }
        });
    }
    
    // Remove legacy option card selection logic here; handled by new system at top of file
    

    // Remove legacy option card selection logic here; handled by new system at top of file
}

// Smooth Scrolling
function initSmoothScrolling() {
    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Add fade-in class and observe elements
    const elementsToAnimate = document.querySelectorAll([
        '.feature-card',
        '.testimonial-card',
        '.pricing-card',
        '.hero-text',
        '.hero-visual',
        '.section-header'
    ].join(','));
    
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
});

// Form submission handler (for future contact forms)
function handleFormSubmission(form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic form validation
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        if (isValid) {
            // Here you would typically send the form data to a server
            showNotification('Thank you for your message! We will get back to you soon.', 'success');
            form.reset();
        } else {
            showNotification('Please fill in all required fields.', 'error');
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Performance optimization: Lazy load images
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Initialize lazy loading if needed
// initLazyLoading();

// Utility function to debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized scroll handler
const optimizedScrollHandler = debounce(function() {
    // Any additional scroll-based functionality can be added here
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (navToggle && navMenu && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

// Accessibility: Focus management for mobile menu
function manageFocus() {
    const navMenu = document.getElementById('nav-menu');
    const firstNavLink = navMenu?.querySelector('.nav-link');
    
    if (navMenu && firstNavLink) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (navMenu.classList.contains('active')) {
                        firstNavLink.focus();
                    }
                }
            });
        });
        
        observer.observe(navMenu, { attributes: true });
    }
}

// --- Payment Modal Logic ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getDatabase, ref, push, set, get, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-E-8tOgugt5gZkVDYT4XnQdzY9XhRKaw",
  authDomain: "clud-d5315.firebaseapp.com",
  projectId: "clud-d5315",
  storageBucket: "clud-d5315.appspot.com",
  messagingSenderId: "953090765245",
  appId: "1:953090765245:web:008cfc0572335df5f122d4",
  databaseURL: "https://clud-d5315-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Export the initialized instances
export { app, auth, db };

// Test database connection and write operation
const connectedRef = ref(db, '.info/connected');
onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        console.log('Connected to Firebase Realtime Database');
        
        // Test write operation
        const testRef = ref(db, 'test');
            set(testRef, {
                timestamp: serverTimestamp(),
                message: 'Test connection successful'
            }).then(() => {
                console.log('Test write successful');
            }).catch((error) => {
                console.error('Test write failed:', error);
            });
        } else {
            console.log('Not connected to Firebase Realtime Database');
        }
    });
    
    console.log('Firebase Realtime Database initialized successfully');

async function createOrder(orderData) {
    try {
        console.log('Starting order creation...');
        
        const user = auth.currentUser;
        if (!user) {
            console.error('No user is signed in');
            window.location.href = 'sign-in.html';
            return null;
        }

        const order = {
            ...orderData,
            userId: user.uid,
            userEmail: user.email,
            status: 'pending',
            createdAt: serverTimestamp(),
            createdAtLocal: new Date().toISOString(),
            testField: 'This is a test order' // Added for testing
        };

        console.log('Created order object:', order);
        
        // Create a direct reference to orders
        const ordersRef = ref(db, 'orders');
        console.log('Created database reference');
        
        // Generate a new key
        const newOrderRef = push(ordersRef);
        console.log('Generated new key:', newOrderRef.key);
        
        if (!newOrderRef.key) {
            throw new Error('Failed to generate order key');
        }
        
        // Set the data directly
        console.log('Attempting to save order data...');
        try {
            await set(newOrderRef, {
                ...order,
                orderId: newOrderRef.key
            });
            console.log('Order saved successfully with ID:', newOrderRef.key);
            
            // Verify the write by reading it back
            const snapshot = await get(newOrderRef);
            if (snapshot.exists()) {
                console.log('Order verified in database:', snapshot.val());
                return newOrderRef.key;
            } else {
                throw new Error('Order write failed - could not verify data');
            }
        } catch (writeError) {
            console.error('Error writing to database:', writeError);
            throw writeError;
        }
    } catch (error) {
        console.error('Error creating order:', error);
        if (error.code === 'PERMISSION_DENIED') {
            console.error('Permission denied. Please check Realtime Database rules.');
        } else if (error.code === 'NETWORK_ERROR') {
            console.error('Database is currently unavailable. Please check your connection.');
        } else {
            console.error('Database error:', error.code, error.message);
        }
        throw error;
    }
}

function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function showPaymentModal(plan) {
  const modal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('close-payment-modal');
  const payCreditBtn = document.getElementById('pay-credit-card');
  const payExternalBtn = document.getElementById('pay-external');
  const paymentOptions = document.getElementById('payment-options');
  const ccForm = document.getElementById('credit-card-form');
  const paymentError = document.getElementById('payment-error');
  
  // Get selected location if it's a preconfigured server
  const locationSelect = document.getElementById('spec-location-select');
  let selectedLocation = null;
  let locationCost = 0;
  
  if (locationSelect && locationSelect.value) {
      selectedLocation = locationSelect.value;
      
      // Calculate location cost based on selection
      if (selectedLocation === 'random' || selectedLocation === '') {
          locationCost = 0;
      } else if (['us-east', 'us-west', 'canada', 'w-europe', 'n-europe', 'c-europe'].includes(selectedLocation)) {
          locationCost = 5;
      } else {
          locationCost = 10; // Asia Pacific, Australia, South America, Africa
      }
  }
  
  // Add location info to the plan object
  if (selectedLocation) {
      plan.location = selectedLocation;
      plan.locationCost = locationCost;
      plan.originalAmount = plan.amount;
      plan.amount = plan.amount + locationCost; // Add location cost to total
  }

  modal.style.display = 'flex';
  paymentOptions.style.display = 'block';
  ccForm.style.display = 'none';
  paymentError.style.display = 'none';

  closeBtn.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  payCreditBtn.onclick = () => {
    paymentOptions.style.display = 'none';
    ccForm.style.display = 'flex';
  };
  
  payExternalBtn.onclick = async (e) => {
    e.preventDefault();
    paymentError.style.display = 'none';
    
    try {
        payExternalBtn.disabled = true;
        payExternalBtn.textContent = 'Processing...';
        
        const orderData = {
            ...plan,
            paymentMethod: 'external',
            paymentStatus: 'pending'
        };
        
        console.log('Creating order with data:', orderData);
        const orderId = await createOrder(orderData);
        console.log('Order created with ID:', orderId);
        
        if (!orderId) {
            throw new Error('Failed to create order - no order ID returned');
        }
        
        sessionStorage.setItem('currentOrderId', orderId);
        sessionStorage.setItem('purchasedPlan', JSON.stringify({...plan, orderId}));
        
        const amount = plan.amount;
        const encodedAmount = base64Encode(amount.toString());
        const url = 'aHR0cHM6Ly9jbG91ZC50dXNoLm15LmlkL3N1Y2Nlc2Z1bHBheW1lbnQ=';
        
        // Redirect to payment page
        console.log('Redirecting to payment page...');
        window.location.href = `https://bank.tush.my.id/pages/payment?code=NTY1NjU2&amount=${encodedAmount}&url=${url}`;
    } catch (error) {
        console.error('Error processing payment:', error);
        paymentError.textContent = 'An error occurred while processing your order. Please try again.';
        paymentError.style.display = 'block';
        
        // Reset button state
        payExternalBtn.disabled = false;
        payExternalBtn.textContent = 'Pay with External Payment';
    }
  };
  ccForm.onsubmit = async function(e) {
    e.preventDefault();
    
    // Validate credit card
    const number = document.getElementById('cc-number').value.replace(/\s+/g, '');
    const expiry = document.getElementById('cc-expiry').value;
    const cvc = document.getElementById('cc-cvc').value;
    
    if (!/^\d{16}$/.test(number)) {
      paymentError.textContent = 'Invalid card number.';
      paymentError.style.display = 'block';
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      paymentError.textContent = 'Invalid expiry format.';
      paymentError.style.display = 'block';
      return;
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      paymentError.textContent = 'Invalid CVC.';
      paymentError.style.display = 'block';
      return;
    }

    try {
        // Create order in Firebase
        const orderData = {
            ...plan,
            paymentMethod: 'credit_card',
            paymentStatus: 'processing',
            cardLast4: number.slice(-4)
        };
        
        const orderId = await createOrder(orderData);
        if (orderId) {
            // Store order details and redirect
            sessionStorage.setItem('currentOrderId', orderId);
            sessionStorage.setItem('purchasedPlan', JSON.stringify({...plan, orderId}));
            window.location.href = 'succesfulpayment.html';
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        paymentError.textContent = 'An error occurred while processing your payment. Please try again.';
        paymentError.style.display = 'block';
    }
  };
}


// Unified payment logic for both featured and custom config
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    // Featured plans payment
    document.querySelectorAll('.featured-spec-card .select-spec-btn').forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            // Select the card visually
            document.querySelectorAll('.featured-spec-card, .option-card').forEach(c => c.classList.remove('selected'));
            const card = btn.closest('.featured-spec-card');
            card.classList.add('selected');
            // Get plan info
            const price = card.querySelector('.spec-price-large').textContent.replace(/[^\d]/g, '');
            const name = card.querySelector('.spec-title').textContent;
            const plan = { name, amount: parseInt(price), type: 'featured' };
            // Check login
            onAuthStateChanged(auth, (user) => {
                if (!user) {
                    window.location.href = 'sign-in.html';
                } else {
                    showPaymentModal(plan);
                }
            });
        });
    });
    // Deploy custom server payment
    const deployBtn = document.getElementById('deploy-custom-btn');
    if (deployBtn) {
        deployBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Get total pricing
            const pricing = calculateCustomPricing();
            const isYearly = document.getElementById('billing-toggle')?.checked;
            const amount = isYearly ? pricing.yearly : pricing.monthly;
            const plan = { name: 'Custom Server', amount, type: 'custom', config: getCustomConfiguration() };
            onAuthStateChanged(auth, (user) => {
                if (!user) {
                    window.location.href = 'sign-in.html';
                } else {
                    showPaymentModal(plan);
                }
            });
        });
    }
    // Deploy Selected Server button (for featured cards)
    const deploySelectedBtn = document.getElementById('deploy-selected-server');
    if (deploySelectedBtn) {
        deploySelectedBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Find selected featured card
            const card = document.querySelector('.featured-spec-card.selected');
            if (!card) {
                showNotification('Please select a server configuration above first.', 'error');
                return;
            }
            const price = card.querySelector('.spec-price-large').textContent.replace(/[^\d]/g, '');
            const name = card.querySelector('.spec-title').textContent;
            const plan = { name, amount: parseInt(price), type: 'featured' };
            onAuthStateChanged(auth, (user) => {
                if (!user) {
                    window.location.href = 'sign-in.html';
                } else {
                    showPaymentModal(plan);
                }
            });
        });
    }
});
