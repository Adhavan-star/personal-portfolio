/* ==========================================================================
   FIREBASE INTEGRATION
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCibOZvdBc1Kx2ZV61MHLAqbj3BHbp4SkY",
    authDomain: "portfolio-88828.firebaseapp.com",
    projectId: "portfolio-88828",
    storageBucket: "portfolio-88828.firebasestorage.app",
    messagingSenderId: "619959117103",
    appId: "1:619959117103:web:25e4b1426c96a79e7eadda"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==========================================================================
   PASSCODE PROTECTION
   ========================================================================== */
// SHA-256 hash of the passcode "adhavan123"
const PASSCODE_HASH = "56ad1e8fa8608f6551b96a9c1e13b8602b9ee4a4087130a08e1a7b443a579624";

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const passcodeGate = document.getElementById("passcode-gate");
const passcodeForm = document.getElementById("passcode-form");
const passcodeInput = document.getElementById("passcode-input");
const gateErrorMsg = document.getElementById("gate-error-msg");
const dashboardWrapper = document.getElementById("dashboard-wrapper");
const logoutBtn = document.getElementById("logout-btn");

// Check existing session
if (sessionStorage.getItem("admin_authed") === "true") {
    unlockDashboard();
}

passcodeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredCode = passcodeInput.value;
    
    // Hash and compare
    const hashed = await sha256(enteredCode);
    if (hashed === PASSCODE_HASH) {
        sessionStorage.setItem("admin_authed", "true");
        unlockDashboard();
        showToast("Access granted. Welcome back, Adhavan!");
    } else {
        gateErrorMsg.classList.add("show");
        passcodeInput.value = "";
        passcodeInput.focus();
        setTimeout(() => {
            gateErrorMsg.classList.remove("show");
        }, 3000);
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("admin_authed");
    lockDashboard();
    showToast("Dashboard locked successfully.");
});

function unlockDashboard() {
    passcodeGate.style.opacity = "0";
    setTimeout(() => {
        passcodeGate.style.visibility = "hidden";
        dashboardWrapper.style.display = "flex";
        initializeDatabaseListener();
    }, 500);
}

function lockDashboard() {
    passcodeInput.value = "";
    passcodeGate.style.visibility = "visible";
    passcodeGate.style.opacity = "1";
    dashboardWrapper.style.display = "none";
}


/* ==========================================================================
   FIRESTORE DATABASE LISTENER
   ========================================================================== */
let allMessages = [];
let searchQuery = "";

function initializeDatabaseListener() {
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    
    // Realtime connection
    onSnapshot(q, (snapshot) => {
        allMessages = [];
        snapshot.forEach((doc) => {
            allMessages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        updateMetrics();
        renderMessages();
    }, (error) => {
        console.error("Firestore error: ", error);
        showToast("Error connecting to database. Please reload.");
    });
}

/* ==========================================================================
   METRICS & RENDERING
   ========================================================================== */
const metricTotal = document.getElementById("metric-total");
const metricToday = document.getElementById("metric-today");
const metricLatest = document.getElementById("metric-latest");
const tbody = document.getElementById("messages-tbody");
const searchInput = document.getElementById("dashboard-search");
const exportBtn = document.getElementById("export-btn");

function updateMetrics() {
    metricTotal.textContent = allMessages.length;
    
    // Count messages today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const countToday = allMessages.filter(m => {
        if (!m.timestamp) return false;
        const mTime = m.timestamp.seconds * 1000;
        return mTime >= todayStart;
    }).length;
    
    metricToday.textContent = countToday;
    
    // Latest sender name
    if (allMessages.length > 0) {
        metricLatest.textContent = allMessages[0].name || "Anonymous";
    } else {
        metricLatest.textContent = "--";
    }
}

function renderMessages() {
    tbody.innerHTML = "";
    
    // Filter messages
    const filtered = allMessages.filter(m => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            (m.subject && m.subject.toLowerCase().includes(q)) ||
            (m.message && m.message.toLowerCase().includes(q))
        );
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-icon">📂</div>
                    <p>${allMessages.length === 0 ? 'No messages received yet!' : 'No messages match your search criteria.'}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(m => {
        const tr = document.createElement("tr");
        
        // Date formatting
        let dateString = "No Date";
        if (m.timestamp) {
            const date = new Date(m.timestamp.seconds * 1000);
            dateString = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            }) + " " + date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit"
            });
        }
        
        tr.innerHTML = `
            <td class="date-col">${escapeHtml(dateString)}</td>
            <td>
                <div class="sender-info">
                    <span class="sender-name">${escapeHtml(m.name || "Anonymous")}</span>
                    <a href="mailto:${escapeHtml(m.email)}" class="sender-email">${escapeHtml(m.email || "")}</a>
                </div>
            </td>
            <td class="subject-col">${escapeHtml(m.subject || "(No Subject)")}</td>
            <td class="message-col">${escapeHtml(m.message || "")}</td>
            <td class="actions-col">
                <button class="delete-btn" data-id="${m.id}">Delete</button>
            </td>
        `;
        
        // Add delete event
        const deleteButton = tr.querySelector(".delete-btn");
        deleteButton.addEventListener("click", async () => {
            if (confirm(`Are you sure you want to delete the message from "${m.name}"?`)) {
                try {
                    await deleteDoc(doc(db, "messages", m.id));
                    showToast("Message deleted successfully.");
                } catch (err) {
                    console.error("Error deleting document: ", err);
                    showToast("Failed to delete message.");
                }
            }
        });
        
        tbody.appendChild(tr);
    });
}

// Search filter keyup
searchInput.addEventListener("keyup", (e) => {
    searchQuery = e.target.value;
    renderMessages();
});

// CSV Export
exportBtn.addEventListener("click", () => {
    if (allMessages.length === 0) {
        showToast("No messages available to export.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header row
    csvContent += "Date,Name,Email,Subject,Message\r\n";
    
    allMessages.forEach(m => {
        let dateString = "";
        if (m.timestamp) {
            dateString = new Date(m.timestamp.seconds * 1000).toISOString();
        }
        
        // Sanitize values for CSV
        const name = (m.name || "").replace(/"/g, '""');
        const email = (m.email || "").replace(/"/g, '""');
        const subject = (m.subject || "").replace(/"/g, '""');
        const msg = (m.message || "").replace(/"/g, '""');
        
        csvContent += `"${dateString}","${name}","${email}","${subject}","${msg}"\r\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `portfolio_messages_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Messages exported to CSV successfully.");
});

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   TOAST SYSTEM (Shared layout)
   ========================================================================== */
const toastContainer = document.getElementById('toast-container');

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
   PARTICLES BACKGROUND CANVAS (Shared with Portfolio)
   ========================================================================== */
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const particleCount = 45;
const connectionDistance = 120;
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
});

// Hide cursor glow when mouse leaves window
window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// Particle constructor
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
    }

    draw() {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

        this.x += this.vx;
        this.y += this.vy;

        if (mouse.x !== null && mouse.y !== null) {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * force * 1.2;
                this.y += Math.sin(angle) * force * 1.2;
            }
        }
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new Particle());
    }
}
initParticles();

function drawConnections() {
    const strokeColor = 'rgba(59, 130, 246, ';
    for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i + 1; j < particlesArray.length; j++) {
            let dx = particlesArray[i].x - particlesArray[j].x;
            let dy = particlesArray[i].y - particlesArray[j].y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
                let alpha = (1 - (dist / connectionDistance)) * 0.12;
                ctx.strokeStyle = `${strokeColor}${alpha})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                ctx.stroke();
            }
        }
        
        if (mouse.x !== null && mouse.y !== null) {
            let dx = particlesArray[i].x - mouse.x;
            let dy = particlesArray[i].y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                let alpha = (1 - (dist / mouse.radius)) * 0.18;
                ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
    }
}

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

window.addEventListener('resize', () => {
    setCanvasSize();
    initParticles();
});
