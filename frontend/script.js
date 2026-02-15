// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Animations - Yalnız .hero-title varsa işləsin
    if (document.querySelector(".hero-title")) {
        const tl = gsap.timeline();
        tl.to(".hero-title", { opacity: 1, y: 0, duration: 1, ease: "power3.out" })
          .to(".hero-subtitle", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.6")
          .to(".cta-button", { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }, "-=0.6")
          .from(".hero-arch-window", { y: 50, opacity: 0, duration: 1.2, ease: "power2.out" }, "-=1")
          .from(".hero-basket", { x: 50, opacity: 0, duration: 1, ease: "back.out(1.5)" }, "-=0.8");
    }

    // 2. Product Cards Reveal - Yalnız .product-slider və .product-card varsa işləsin
    if (document.querySelector(".product-slider") && document.querySelector(".product-card")) {
        gsap.from(".product-card", {
            scrollTrigger: {
                trigger: ".product-slider",
                start: "top 85%",
            },
            y: 60,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out"
        });
    }
    const savedLang = localStorage.getItem('cozy_lang') || 'en';
    setTimeout(() => setLanguage(savedLang), 50); // Small delay to ensure deferred scripts
});

// Language Switching Logic
window.setLanguage = function (lang) {
    if (typeof translations === 'undefined') {
        console.error("Translations not loaded");
        return;
    }

    if (!translations[lang]) {
        console.warn(`Language ${lang} not found, defaulting to 'en'`);
        lang = 'en';
    };

    // Update Text Elements
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Save preference
    localStorage.setItem('cozy_lang', lang);
}

// Slider Navigation Logic
window.slideLeft = function (id) {
    const slider = document.getElementById(id);
    if (slider) {
        slider.scrollBy({ left: -300, behavior: 'smooth' });
    }
}

window.slideRight = function (id) {
    const slider = document.getElementById(id);
    if (slider) {
        slider.scrollBy({ left: 300, behavior: 'smooth' });
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userData={
        fullName: fullName,
        email: email,
        password: password
    }

    try {
        const response = await fetch('http://localhost:5245/api/Auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if(response.ok){
            alert('Registration successful!');
            window.location.href = 'login.html';
        }else{
            const result = await response.json();
            const errorMessage = result[0]?.description || "Registration failed. Please check your details.";
            alert('Error: ' + errorMessage);
        }
    } catch (error) {
        console.error("Connection error:", error);
        alert("Could not connect to the server. Please ensure the API is running.");
    }
}


async function handleLogin(event) {
    event.preventDefault(); 
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const loginData = { email, password };

    try {
        const response = await fetch('http://localhost:5245/api/Auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('userName', result.userName);

            alert('Login successful! Welcome, ' + result.userName);
            
            window.location.href = 'index.html'; 
        } else {
            alert(result.message || 'Login failed!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Could not connect to the server. Is the API running?');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    const loginLink = document.querySelector('a[href="login.html"]');

    if (token && userName && loginLink) {
        loginLink.parentElement.innerHTML = `
            <span class="user-greeting">Hi, ${userName}</span>
            <a href="#" onclick="logout()" class="logout-btn">Logout</a>
        `;
    }
}

window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    alert("You have been logged out.");
    window.location.href = 'index.html'; 
}