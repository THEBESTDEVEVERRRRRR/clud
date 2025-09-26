// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initMobileNavigation();
    initTestimonialCarousel();
    initSpecSelector();
    initCustomConfiguration();
    initSmoothScrolling();
    initScrollAnimations();
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
    
    // Handle featured card selections
    featuredCards.forEach(card => {
        const selectBtn = card.querySelector('.select-spec-btn');
        
        selectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove selected class from all cards
            document.querySelectorAll('.featured-spec-card, .option-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Add selected class to clicked card
            card.classList.add('selected');
            
            // Get server data
            const value = card.getAttribute('data-value');
            const spec = serverSpecs[value];
            
            if (spec) {
                updateSelectedSpecDisplay(spec.name, spec.price, spec.type, spec.details);
            }
        });
        
        // Also handle card click
        card.addEventListener('click', function() {
            if (!this.classList.contains('selected')) {
                selectBtn.click();
            }
        });
    });
    
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
    
    // Handle option card selections in dropdown
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            document.querySelectorAll('.featured-spec-card, .option-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Get server data
            const value = this.getAttribute('data-value');
            const spec = serverSpecs[value];
            
            if (spec) {
                updateSelectedSpecDisplay(spec.name, spec.price, spec.type, spec.details);
            }
            
            // Close dropdown after selection
            if (isExpanded) {
                showMoreToggle.click();
            }
        });
    });
    
    function updateSelectedSpecDisplay(name, price, type, details) {
        const noSelection = selectedSpecDisplay.querySelector('.no-selection');
        
        // Remove no-selection content
        if (noSelection) {
            noSelection.style.display = 'none';
        }
        
        // Create or update selected spec content
        let specContent = selectedSpecDisplay.querySelector('.selected-spec-content');
        if (!specContent) {
            specContent = document.createElement('div');
            specContent.className = 'selected-spec-content';
            selectedSpecDisplay.appendChild(specContent);
        }
        
        // Create details list
        const detailsList = details.map(detail => `<li>${detail}</li>`).join('');
        
        specContent.innerHTML = `
            <div class="selected-spec-header">
                <div class="selected-spec-info">
                    <h3 class="selected-spec-title">${name}</h3>
                    <p class="selected-spec-type">${type}</p>
                </div>
                <div class="selected-spec-price">${price}</div>
            </div>
            <div class="selected-spec-details">
                <ul>${detailsList}</ul>
            </div>
        `;
        
        specContent.classList.add('active');
        specContent.style.display = 'block';
        
        // Smooth scroll to selection
        selectedSpecDisplay.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
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
            showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
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
