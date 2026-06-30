/* ==========================================================================
   PARTICLES BACKGROUND CANVAS
   ========================================================================== */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const particleCount = 65;
const connectionDistance = 110;
const mouse = {
    x: null,
    y: null,
    radius: 120
};

// Set canvas dimensions
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
setCanvasSize();

// Track mouse position
window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
    
    // Position custom cursor glow if on desktop
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
        cursorGlow.style.opacity = '1';
    }
});

// Hide cursor glow when mouse leaves window
window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        cursorGlow.style.opacity = '0';
    }
});

// Particle constructor
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1.5;
    }

    draw() {
        // Get primary color from CSS variables (requires computing styles)
        const isDark = document.body.classList.contains('dark-theme');
        ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.45)' : 'rgba(37, 99, 235, 0.25)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        // Bounce off canvas boundaries
        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

        this.x += this.vx;
        this.y += this.vy;

        // Interactive mouse push effect
        if (mouse.x !== null && mouse.y !== null) {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * force * 1.5;
                this.y += Math.sin(angle) * force * 1.5;
            }
        }
    }
}

// Initialize particles array
function initParticles() {
    particlesArray = [];
    for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new Particle());
    }
}
initParticles();

// Draw connecting lines
function drawConnections() {
    const isDark = document.body.classList.contains('dark-theme');
    const strokeColor = isDark ? 'rgba(59, 130, 246, ' : 'rgba(37, 99, 235, ';
    
    for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i + 1; j < particlesArray.length; j++) {
            let dx = particlesArray[i].x - particlesArray[j].x;
            let dy = particlesArray[i].y - particlesArray[j].y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
                // Fade line opacity based on distance
                let alpha = (1 - (dist / connectionDistance)) * 0.15;
                ctx.strokeStyle = `${strokeColor}${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                ctx.stroke();
            }
        }
        
        // Connect to mouse
        if (mouse.x !== null && mouse.y !== null) {
            let dx = particlesArray[i].x - mouse.x;
            let dy = particlesArray[i].y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                let alpha = (1 - (dist / mouse.radius)) * 0.25;
                ctx.strokeStyle = isDark ? `rgba(139, 92, 246, ${alpha})` : `rgba(124, 58, 237, ${alpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }
}

// Animation loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particlesArray.forEach(p => {
        p.update();
        p.draw();
    });
    
    drawConnections();
    requestAnimationFrame(animateParticles);
}
animateParticles();

// Handle viewport resize
window.addEventListener('resize', () => {
    setCanvasSize();
    initParticles();
});


/* ==========================================================================
   TYPEWRITER EFFECT
   ========================================================================== */
const typewriterText = document.getElementById('typewriter-text');
const roles = [
    'Computer Science Student',
    'Full Stack Developer',
    'AI Agent Builder',
    'Data Analytics Enthusiast',
    'Problem Solver'
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function type() {
    const currentRole = roles[roleIndex];
    
    if (isDeleting) {
        // Erase character
        typewriterText.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 40;
    } else {
        // Type character
        typewriterText.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 120;
    }

    // Handle string completed or deleted state
    if (!isDeleting && charIndex === currentRole.length) {
        isDeleting = true;
        typeSpeed = 2200; // Pause at end of word
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 500; // Pause before typing new word
    }

    setTimeout(type, typeSpeed);
}

// Trigger typewriter after page loading
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(type, 800);
});


/* ==========================================================================
   STICKY NAV, ACTIVE LINKS & SCROLL PROGRESS
   ========================================================================== */
const header = document.getElementById('main-header');
const progressBar = document.getElementById('scroll-progress-bar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // 1. Scroll progress indicator
    if (docHeight > 0) {
        const scrollPct = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${scrollPct}%`;
    }

    // 2. Sticky navigation shrink
    if (scrollTop > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // 3. Back to top button show/hide
    if (scrollTop > 600) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }

    // 4. Highlight current navigation link on scroll
    let currentSectionId = '';
    sections.forEach(sec => {
        const secTop = sec.offsetTop - 120;
        const secHeight = sec.offsetHeight;
        if (scrollTop >= secTop && scrollTop < secTop + secHeight) {
            currentSectionId = sec.getAttribute('id');
        }
    });

    if (currentSectionId) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }
});

// Back to Top button click
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});


/* ==========================================================================
   MOBILE NAVIGATION MENU TOGGLE
   ========================================================================== */
const mobileNavToggle = document.getElementById('mobile-nav-toggle');
const navMenu = document.getElementById('nav-menu');

mobileNavToggle.addEventListener('click', () => {
    mobileNavToggle.classList.toggle('active');
    navMenu.classList.toggle('show');
});

// Close mobile navigation menu on clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileNavToggle.classList.remove('active');
        navMenu.classList.remove('show');
    });
});


/* ==========================================================================
   THEME TOGGLER (DARK / LIGHT MODE)
   ========================================================================== */
const themeToggleBtn = document.getElementById('theme-toggle');

// Load theme state from local storage or check system preferences
let savedTheme = localStorage.getItem('theme');
if (!savedTheme) {
    savedTheme = 'dark'; // default theme is dark
}

document.body.classList.remove('dark-theme', 'light-theme');
document.body.classList.add(`${savedTheme}-theme`);

themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.replace('dark-theme', 'light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.replace('light-theme', 'dark-theme');
        localStorage.setItem('theme', 'dark');
    }
});


/* ==========================================================================
   INTERSECTION OBSERVER - SCROLL REVEALS & ANIMS
   ========================================================================== */
// Common reveal observer
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.scroll-reveal').forEach(el => {
    revealObserver.observe(el);
});

// Skills Category fill animations observer
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const skillItems = entry.target.querySelectorAll('.skill-item');
            skillItems.forEach(item => {
                const targetPercent = item.getAttribute('data-percent');
                const fillBar = item.querySelector('.skill-bar-fill');
                if (fillBar) {
                    fillBar.style.width = `${targetPercent}%`;
                }
            });
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('.skills-category').forEach(el => {
    skillsObserver.observe(el);
});

// Statistics numbers counter animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-num');
            statNumbers.forEach(num => {
                const targetVal = parseInt(num.getAttribute('data-val'), 10);
                let currentVal = 0;
                // Determine increment speed
                const duration = 1800; // ms
                const steps = 60;
                const increment = Math.ceil(targetVal / steps);
                const stepTime = duration / steps;
                
                const timer = setInterval(() => {
                    currentVal += increment;
                    if (currentVal >= targetVal) {
                        num.textContent = `${targetVal}+`;
                        clearInterval(timer);
                    } else {
                        num.textContent = `${currentVal}`;
                    }
                }, stepTime);
            });
            // Stop observing this element once counter animations trigger
            statsObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2
});

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}


/* ==========================================================================
   PROJECTS FILTER & SEARCH SYSTEM
   ========================================================================== */
const projectSearch = document.getElementById('project-search');
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

let activeFilter = 'all';
let searchQuery = '';

function filterProjects() {
    projectCards.forEach(card => {
        const title = card.querySelector('.project-title').textContent.toLowerCase();
        const description = card.querySelector('.project-description').textContent.toLowerCase();
        const tags = Array.from(card.querySelectorAll('.project-tags span')).map(span => span.textContent.toLowerCase());
        const categories = card.getAttribute('data-categories').split(' ');

        const matchesSearch = title.includes(searchQuery) || description.includes(searchQuery) || tags.some(t => t.includes(searchQuery));
        const matchesFilter = activeFilter === 'all' || categories.includes(activeFilter);

        if (matchesSearch && matchesFilter) {
            card.style.display = 'flex';
            // Subtle entry animations
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 50);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 250); // Matches CSS transition scale
        }
    });
}

// Search keyup listener
projectSearch.addEventListener('keyup', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    filterProjects();
});

// Category filter click
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        filterProjects();
    });
});


/* ==========================================================================
   CONTACT FORM SUBMISSION HANDLER
   ========================================================================== */
const contactForm = document.getElementById('contact-form');
const submitBtn = contactForm.querySelector('.form-submit-btn');
const submitArrow = submitBtn.querySelector('.submit-arrow');
const submitSpinner = submitBtn.querySelector('.submit-spinner');
const toastContainer = document.getElementById('toast-container');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Visual loading state
    submitBtn.disabled = true;
    submitArrow.classList.add('hidden');
    submitSpinner.classList.remove('hidden');

    // Gather form values
    const nameVal = document.getElementById('form-name').value;
    const emailVal = document.getElementById('form-email').value;
    const subjectVal = document.getElementById('form-subject').value;
    const messageVal = document.getElementById('form-message').value;

    // Simulate backend communication delay
    setTimeout(() => {
        // Reset button states
        submitBtn.disabled = false;
        submitArrow.classList.remove('hidden');
        submitSpinner.classList.add('hidden');

        // Create success toast
        showToast(`Thank you, ${nameVal}! Your message has been sent successfully.`);

        // Reset form inputs
        contactForm.reset();
        
        // Remove focus labels
        document.querySelectorAll('.input-group input, .input-group textarea').forEach(el => {
            el.blur();
        });
    }, 1500);
});

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Slide in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Slide out and remove after 4.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4500);
}


/* ==========================================================================
   RESUME BUTTON PLACEHOLDER STATE
   ========================================================================== */
const resumeBtn = document.getElementById('resume-download-btn');
resumeBtn.addEventListener('click', () => {
    showToast("Opening Adhavan's professional resume...");
});
