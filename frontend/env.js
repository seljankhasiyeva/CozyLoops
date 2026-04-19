// CozyLoops Environment Configuration
// This file should NOT be committed to version control
// Copy this file to env.local.js and add your actual values
// Add frontend/env.js and frontend/env.local.js to your .gitignore

const CONFIG = {
    // API Base URL
    BASE_URL: "http://localhost:5245",
    
    // API endpoints
    API_BASE_URL: "http://localhost:5245/api",
    
    // Luma API (local service)
    LUMA_API: "http://localhost:8000",
    
    // OpenAI API Key - ADD YOUR KEY HERE in env.local.js
    // Do not commit your actual API key to version control!
    OPENAI_API_KEY: "",
    
    // OpenAI API URL
    OPENAI_API_URL: "https://api.openai.com/v1/chat/completions"
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
