document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const downloadBtn = document.getElementById('download-btn');
    const tiktokUrlInput = document.getElementById('tiktok-url');
    const resultSection = document.getElementById('result');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const resultState = document.getElementById('result-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    
    // API Configuration
    const API_ENDPOINTS = [
        'https://api.tiklydown.eu.org/api/download',
        'https://api.tiktokdownloader.xyz/api/download',
        'https://www.tikwm.com/api/'
    ];
    let currentApiIndex = 0;
    
    // Event Listeners
    downloadBtn.addEventListener('click', processDownload);
    retryBtn.addEventListener('click', processDownload);
    tiktokUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') processDownload();
    });

    const toggleSwitch = document.querySelector('#checkbox');
    const currentTheme = localStorage.getItem('theme');
    const themeLabel = document.getElementById('theme-label');

    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'dark-mode') {
            toggleSwitch.checked = true;
            themeLabel.textContent = 'Light Mode';
        }
    }

    function switchTheme(e) {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
            themeLabel.textContent = 'Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light-mode');
            themeLabel.textContent = 'Dark Mode';
        }
    }

    toggleSwitch.addEventListener('change', switchTheme);

    // Improved download function with better error handling
    async function downloadVideo(url) {
        try {
            // Try direct API first
            const apiUrl = `${API_ENDPOINTS[currentApiIndex]}?url=${encodeURIComponent(url)}`;
            const response = await fetchWithTimeout(apiUrl, {}, 10000); // 10 second timeout
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Check if response contains video URL
            if (!data.video) {
                throw new Error('No video URL found in response');
            }
            
            return data;
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    // Helper function with timeout
    function fetchWithTimeout(url, options = {}, timeout = 10000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    // Improved error handling in processDownload
    async function processDownload() {
        const tiktokUrl = tiktokUrlInput.value.trim();
        
        if (!tiktokUrl) {
            showError('Please enter a TikTok URL');
            return;
        }
        
        if (!isValidTikTokUrl(tiktokUrl)) {
            showError('Invalid TikTok URL. Please check and try again.');
            return;
        }
        
        showLoading();
        
        try {
            const data = await downloadVideo(tiktokUrl);
            
            // Additional validation
            if (!data.video) {
                throw new Error('No video URL in response');
            }
            
            showResult(data);
            
            // Reset API index for next download
            currentApiIndex = 0;
        } catch (error) {
            console.error('Download error:', error);
            
            if (currentApiIndex < API_ENDPOINTS.length - 1) {
                // Try next API
                currentApiIndex++;
                await processDownload();
            } else {
                // All APIs failed
                showError('Failed to download video. Possible reasons:<br>1. Video is private<br>2. URL is invalid<br>3. Server is busy');
                currentApiIndex = 0; // Reset for next try
            }
        }
    }

    // Improved showError function
    function showError(message) {
        loadingState.style.display = 'none';
        errorMessage.innerHTML = message;
        errorState.style.display = 'flex';
        
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span class="btn-text">Download</span> <i class="fas fa-arrow-down"></i>';
    }
    
    // Main Function
    function processDownload() {
        const tiktokUrl = tiktokUrlInput.value.trim();
        
        // Validate URL
        if (!tiktokUrl) {
            showError('Please enter a TikTok URL');
            return;
        }
        
        if (!isValidTikTokUrl(tiktokUrl)) {
            showError('Invalid TikTok URL. Please check and try again.');
            return;
        }
        
        // Show loading state
        showLoading();
        
        // Try to download using current API
        downloadVideo(tiktokUrl)
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                showResult(data);
            })
            .catch(error => {
                console.error('Download error:', error);
                
                // Try next API endpoint if available
                if (currentApiIndex < API_ENDPOINTS.length - 1) {
                    currentApiIndex++;
                    processDownload();
                } else {
                    showError('Failed to download video. Please try again later.');
                }
            });
    }
    
    // Helper Functions
    function isValidTikTokUrl(url) {
        const tiktokRegex = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/.+/;
        return tiktokRegex.test(url);
    }
    
    async function downloadVideo(url) {
        const apiUrl = `${API_ENDPOINTS[currentApiIndex]}?url=${encodeURIComponent(url)}`;
        
        // Use proxy to avoid CORS issues in development
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        
        const response = await fetch(proxyUrl + apiUrl, {
            headers: {
                'Origin': window.location.origin,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        return await response.json();
    }
    
    function showLoading() {
        emptyState.style.display = 'none';
        resultState.style.display = 'none';
        errorState.style.display = 'none';
        loadingState.style.display = 'flex';
        
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing';
    }
    
    function showResult(data) {
        loadingState.style.display = 'none';
        errorState.style.display = 'none';
        
        // Create result HTML
        let resultHTML = `
            <div class="video-result">
                <video controls class="video-preview">
                    <source src="${data.video}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <h3 class="video-title">${data.title || 'TikTok Video'}</h3>
                <div class="download-options">
                    <a href="${data.video}" download="tiktok-video.mp4" class="download-btn download-btn-video">
                        <i class="fas fa-video"></i> Download Video
                    </a>
        `;
        
        if (data.music) {
            resultHTML += `
                    <a href="${data.music}" download="tiktok-music.mp3" class="download-btn download-btn-audio">
                        <i class="fas fa-music"></i> Download Audio
                    </a>
            `;
        }
        
        resultHTML += `</div></div>`;
        
        resultState.innerHTML = resultHTML;
        resultState.style.display = 'block';
        document.querySelector('.video-result').style.display = 'flex';
        
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span class="btn-text">Download</span> <i class="fas fa-arrow-down"></i>';
    }
    
    function showError(message) {
        emptyState.style.display = 'none';
        loadingState.style.display = 'none';
        
        errorMessage.textContent = message;
        errorState.style.display = 'flex';
        
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span class="btn-text">Download</span> <i class="fas fa-arrow-down"></i>';
    }
    
    // Initialize
    function init() {
        emptyState.style.display = 'flex';
        loadingState.style.display = 'none';
        resultState.style.display = 'none';
        errorState.style.display = 'none';
    }
    
    init();
});