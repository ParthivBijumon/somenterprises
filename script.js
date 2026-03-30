// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return; // Skip if href is just "#"
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active navigation link
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Form submission
document.querySelector('.contact-form')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const message = document.getElementById('form-message').value;
    const submitBtn = this.querySelector('.submit-btn');

    if (name && email && message) {
        submitBtn.classList.add('loading');

        fetch('/api/send-inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        })
            .then(response => response.json())
            .then(data => {
                submitBtn.classList.remove('loading');
                if (data.success) {
                    showCustomToast('Thank you for your message! We will get back to you soon.', 'success');
                    this.reset();
                } else {
                    showCustomToast('Error sending message. Please try again.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                submitBtn.classList.remove('loading');
                showCustomToast('Error sending message. Please try again.', 'error');
            });
    } else {
        showCustomToast('Please fill in all fields.', 'error');
    }
});

// Advanced Scroll Animations
const advancedObserverOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const advancedObserver = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
                entry.target.classList.add('is-visible');
                if (entry.target.dataset.targetCounter) {
                    animateCounter(entry.target, parseInt(entry.target.dataset.targetCounter));
                }
            }, delay);
            advancedObserver.unobserve(entry.target); // Run once!
        }
    });
}, advancedObserverOptions);

// 1. Grid Staggering
const grids = ['.offerings-grid', '.sustainable-grid', '.infrastructure-grid', '.market-grid', '.vision-grid', '.takeaways-grid', '.roadmap-grid', '.competitive-grid'];
grids.forEach(gridSelector => {
    const grid = document.querySelector(gridSelector);
    if (grid) {
        Array.from(grid.children).forEach((child, index) => {
            child.classList.add('animate-on-scroll', 'fade-up');
            child.dataset.delay = index * 150; // 150ms stagger
            advancedObserver.observe(child);
        });
    }
});

// 2. Overview Section (Left/Right slide)
document.querySelectorAll('.overview-image').forEach(el => { el.classList.add('animate-on-scroll', 'fade-right'); advancedObserver.observe(el); });
document.querySelectorAll('.overview-text').forEach(el => { el.classList.add('animate-on-scroll', 'fade-left'); advancedObserver.observe(el); });

// 3. Section Titles
document.querySelectorAll('section h2').forEach(el => { el.classList.add('animate-on-scroll', 'zoom-in'); advancedObserver.observe(el); });

// 4. Counters
document.querySelectorAll('.workforce-card h3').forEach(el => {
    el.dataset.targetCounter = el.textContent;
    el.textContent = '0';
    advancedObserver.observe(el);
});

// Mobile menu toggle (if navbar becomes smaller on mobile)
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Solar Panel Interactivity
document.querySelectorAll('.solar-panel').forEach((panel, index) => {
    panel.addEventListener('mouseenter', function () {
        this.style.filter = 'brightness(1.3)';
        showEnergyBoost(index);
    });

    panel.addEventListener('mouseleave', function () {
        this.style.filter = 'brightness(1)';
    });

    // Click to toggle panel activity
    panel.addEventListener('click', function () {
        this.classList.toggle('active');
        if (this.classList.contains('active')) {
            this.style.background = 'linear-gradient(135deg, #7dd25f 0%, #9ee573 100%)';
        } else {
            this.style.background = 'linear-gradient(135deg, #1a3a52 0%, #0f5a6f 100%)';
        }
    });
});

// Energy boost animation when hovering over panels
function showEnergyBoost(index) {
    const boost = document.createElement('div');
    boost.style.position = 'fixed';
    boost.style.pointer = 'none';
    boost.textContent = '⚡';
    boost.style.fontSize = '1.5rem';
    boost.style.animation = 'float 1s ease-out forwards';
    boost.style.zIndex = '100';

    const panel = document.querySelectorAll('.solar-panel')[index];
    const rect = panel.getBoundingClientRect();
    boost.style.left = (rect.left + rect.width / 2) + 'px';
    boost.style.top = (rect.top - 20) + 'px';

    document.body.appendChild(boost);
    setTimeout(() => boost.remove(), 1000);
}

// Offering Cards - Interactive click effects
document.querySelectorAll('.offering-card').forEach(card => {
    card.addEventListener('click', function () {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);
    });
});

// Sustainable Cards - Ripple effect on click
document.querySelectorAll('.sustainable-card').forEach(card => {
    card.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Energy flow animation trigger
// (interaction removed to keep flow stable)
// no hover transform applied for sun/source/distribution elements


// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = '#7dd25f';
    notification.style.color = 'white';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 5px 20px rgba(125, 210, 95, 0.4)';
    notification.style.zIndex = '1001';
    notification.style.animation = 'slideInRight 0.3s ease';
    notification.style.fontSize = '0.95rem';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// Counter animation for stats (if added)
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Parallax effect on hero section
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrollY = window.scrollY;
        hero.style.backgroundPosition = '0 ' + (scrollY * 0.5) + 'px';
    }
});

// Cursor glow effect (optional - remove if not needed)
document.addEventListener('mousemove', (e) => {
    const sections = document.querySelectorAll('.sustainable-card');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
            section.style.setProperty('--mouse-x', x + 'px');
            section.style.setProperty('--mouse-y', y + 'px');
        }
    });
});

console.log('SOM Enterprises website loaded successfully! ✨');
console.log('Interactive features enabled: Solar panels, Energy flow, Sustainable cards');

// India project map interactive pins
function initIndiaProjectMap() {
    const mapWrapper = document.getElementById('indiaMapWrapper');
    const tooltip = document.getElementById('mapTooltip');
    const mapImage = document.getElementById('indiaMapImage');
    if (!mapWrapper || !tooltip || !mapImage) return;

    mapImage.addEventListener('error', () => {
        console.warn('India map image failed to load, using fallback background.');
        mapImage.style.display = 'none';
        mapWrapper.style.background = 'url(https://via.placeholder.com/900x600?text=India+map+fallback) center/contain no-repeat';
    });

    const places = [
        { name: 'Gajendragad, Karnataka', left: 227, top: 555, detail: 'Enfinity Gajendragad 28MWp(electrical contract) karnataka.' },
        { name: 'Mahajnko, Maharashtra ', left: 195, top: 488, detail: 'Mahajnko - Maharashtra state govt (20Mwp) done commisioning - 2025.' },
        { name: 'Sunsure energy, Maharashtra ', left: 172, top: 475, detail: 'Sunsure energy - Masharastra (85Mwp) -2025.' },
        { name: 'Kalpa power, Maharashtra ', left: 154, top: 491, detail: 'Kalpa power - 50MWp - Maharashtra - 2025.' },
        { name: 'Prozeel, Maharashtra', left: 195, top: 470, detail: 'Prozeel - Maharashtra - 80Mwp( AC,DC, Pileing,MMS,Civil,MCR - 2023.' },
        { name: 'Noida, Uttar Pradesh', left: 261, top: 230, detail: 'Sukheer agro - noeida metro -28 stations (10Mwp - rooftop) - 2022.' },
        { name: 'AMPLUS, Karnataka', left: 257, top: 641, detail: 'AMPLUS solar - 2MWp- chennai (rooftop) - 2021.' },
        { name: 'AMPLUS, Chennai ', left: 297, top: 635, detail: 'AMPLUS - Chennai - 10MWp - rooftop - 2020.' },
        { name: 'Raipur, Chhattisgarh', left: 333, top: 427, detail: 'Rel - raipur -50MWp - 2019.' }

    ];

    function updateTooltipPosition(event) {
        const wrapperRect = mapWrapper.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let left = event.clientX - wrapperRect.left + 12;
        let top = event.clientY - wrapperRect.top - tooltipRect.height - 12;

        if (left + tooltipRect.width > wrapperRect.width - 12) {
            left = wrapperRect.width - tooltipRect.width - 12;
        }

        if (top < 0) {
            top = event.clientY - wrapperRect.top + 12;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    function showTooltip(event, place) {
        tooltip.innerHTML = `<strong>${place.name}</strong><br>${place.detail}`;
        tooltip.style.display = 'block';
        tooltip.setAttribute('aria-hidden', 'false');
        updateTooltipPosition(event);
    }

    function hideTooltip() {
        tooltip.style.display = 'none';
        tooltip.setAttribute('aria-hidden', 'true');
    }

    const mapImg = document.getElementById('indiaMapImage');

    function renderPins() {
        // Fallback to 800x600 if image lacks dimensions, assuming base map is somewhere around that ratio
        const nWidth = mapImg.naturalWidth || 800;
        const nHeight = mapImg.naturalHeight || 600;

        function resolveCoordinate(value, max) {
            if (typeof value === 'number') {
                return `${(value / max) * 100}%`;
            }
            if (typeof value === 'string' && value.trim().endsWith('%')) {
                return value;
            }
            return value;
        }

        // Clear any existing pins first (useful on resize/reload)
        mapWrapper.querySelectorAll('.map-pin').forEach(p => p.remove());

        places.forEach(place => {
            const pin = document.createElement('div');
            pin.className = 'map-pin';
            pin.style.left = resolveCoordinate(place.left, nWidth);
            pin.style.top = resolveCoordinate(place.top, nHeight);

            pin.addEventListener('mouseenter', (event) => showTooltip(event, place));
            pin.addEventListener('mousemove', updateTooltipPosition);
            pin.addEventListener('mouseleave', hideTooltip);
            pin.addEventListener('click', () => {
                document.querySelectorAll('.map-pin').forEach(el => el.classList.remove('active'));
                pin.classList.add('active');
            });

            mapWrapper.appendChild(pin);
        });
    }

    if (mapImg && mapImg.complete && mapImg.naturalWidth !== 0) {
        renderPins();
    } else if (mapImg) {
        mapImg.addEventListener('load', renderPins);
    }
}

window.addEventListener('DOMContentLoaded', initIndiaProjectMap);

// Scroll background change like video at 120 FPS with smooth transition
let currentImageNum = 1;
let targetImageNum = 1;
let displayedImageNum = 1;
const bgCurrent = document.getElementById('bg-current');
const bgNext = document.getElementById('bg-next');

// Only initialize background if elements exist (not on admin/login pages)
if (bgCurrent) {
    bgCurrent.style.backgroundImage = `url('background/1.jpg')`;
}

if (bgNext) {
    bgNext.style.backgroundImage = `url('background/1.jpg')`;
}

const fps = 120;
const interval = 1000 / fps;

setInterval(() => {
    if (currentImageNum < targetImageNum) {
        currentImageNum++;
        transitionToImage(currentImageNum);
    } else if (currentImageNum > targetImageNum) {
        currentImageNum--;
        transitionToImage(currentImageNum);
    }
}, interval);

function transitionToImage(imageNum) {
    if (imageNum === displayedImageNum) return;
    if (!bgNext || !bgCurrent) return; // Exit if background elements don't exist
    bgNext.style.backgroundImage = `url('background/${imageNum}.jpg')`;
    bgNext.style.opacity = '1';
    setTimeout(() => {
        if (bgCurrent && bgNext) {
            bgCurrent.style.backgroundImage = `url('background/${imageNum}.jpg')`;
            bgNext.style.opacity = '0';
            displayedImageNum = imageNum;
        }
    }, 500); // Match transition duration
}

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = scrollTop / docHeight;
    targetImageNum = Math.floor(scrollPercent * 719) + 1;
});

// Hero Section Particles Generation
const particlesContainer = document.getElementById('particles-container');
if (particlesContainer) {
    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = (Math.random() * 5) + 's';
        particle.style.animationDuration = (8 + Math.random() * 12) + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        particlesContainer.appendChild(particle);
    }
}

// Step 4: 3D Tilt Effect on Cards
const tiltCards = document.querySelectorAll('.vision-card, .offering-card, .market-card, .infrastructure-card, .sustainable-card');
tiltCards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'none';
        card.style.zIndex = '10';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.5s ease';
        card.style.zIndex = '1';
    });
});

// Step 4: Button Ripple Effect
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        let ripple = document.createElement('span');
        ripple.classList.add('ripple');

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

        this.appendChild(ripple);

        setTimeout(() => { ripple.remove(); }, 600);
    });
});

// Step 6: Custom Toast Notification System
function showCustomToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;

    const icon = type === 'success'
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7dd25f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5252" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
