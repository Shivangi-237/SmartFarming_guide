document.addEventListener('DOMContentLoaded', function() {
    // Language Toggle Functionality
    const langEnBtn = document.getElementById('lang-en');
    const langHiBtn = document.getElementById('lang-hi');
    
    langEnBtn.addEventListener('click', function() {
        toggleLanguage('en');
        langEnBtn.classList.add('active');
        langHiBtn.classList.remove('active');
    });
    
    langHiBtn.addEventListener('click', function() {
        toggleLanguage('hi');
        langHiBtn.classList.add('active');
        langEnBtn.classList.remove('active');
    });
    
    function toggleLanguage(lang) {
        // Hide all language elements
        document.querySelectorAll('.en, .hi').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show elements for selected language
        document.querySelectorAll('.' + lang).forEach(el => {
            el.style.display = 'block';
        });
    }
    
    // Modal Functionality
    const diseaseCard = document.getElementById('disease-detection');
    const seedCard = document.getElementById('seed-identification');
    const diseaseModal = document.getElementById('disease-modal');
    const seedModal = document.getElementById('seed-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    // Open modals when cards are clicked
    diseaseCard.addEventListener('click', function() {
        diseaseModal.classList.add('show-modal');
    });
    
    seedCard.addEventListener('click', function() {
        seedModal.classList.add('show-modal');
    });
    
    // Close modals when X is clicked
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            diseaseModal.classList.remove('show-modal');
            seedModal.classList.remove('show-modal');
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === diseaseModal) {
            diseaseModal.classList.remove('show-modal');
        }
        if (event.target === seedModal) {
            seedModal.classList.remove('show-modal');
        }
    });
    
    // File upload elements
    const diseaseUpload = document.getElementById('disease-upload-area');
    const seedUpload = document.getElementById('seed-upload-area');
    const diseaseInput = document.getElementById('disease-image');
    const seedInput = document.getElementById('seed-image');
    
    const analyzeDiseaseBtn = document.getElementById('analyze-disease-en');
    const analyzeDiseaseHiBtn = document.getElementById('analyze-disease-hi');
    const identifySeedBtn = document.getElementById('identify-seed-en');
    const identifySeedHiBtn = document.getElementById('identify-seed-hi');

    const diseaseResult = document.getElementById('disease-result');
    const seedResult = document.getElementById('seed-result');

    // ONLY the dashed box opens the file dialog - STOP PROPAGATION to prevent double triggers
    if (diseaseUpload) {
        diseaseUpload.addEventListener('click', function(e) {
            e.stopPropagation();
            diseaseInput.click();
        });
    }

    if (seedUpload) {
        seedUpload.addEventListener('click', function(e) {
            e.stopPropagation();
            seedInput.click();
        });
    }

    // Step 1: File selection shows instant clean preview without submitting
    diseaseInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const previewWrap = document.getElementById('disease-preview-wrap');
            const previewImg = document.getElementById('disease-preview-img');
            const selectedName = document.getElementById('disease-selected-name');

            if (previewImg && previewWrap) {
                previewImg.src = URL.createObjectURL(file);
                selectedName.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                previewWrap.style.display = 'flex';
            }

            // Reset previous result
            diseaseResult.style.display = 'none';
            document.getElementById('result-content').innerHTML = '';
        }
    });

    seedInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const previewWrap = document.getElementById('seed-preview-wrap');
            const previewImg = document.getElementById('seed-preview-img');
            const selectedName = document.getElementById('seed-selected-name');

            if (previewImg && previewWrap) {
                previewImg.src = URL.createObjectURL(file);
                selectedName.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                previewWrap.style.display = 'flex';
            }

            // Reset previous result
            seedResult.style.display = 'none';
            document.getElementById('seed-result-content').innerHTML = '';
        }
    });

    // Step 2: Dedicated Analyze Button click - DOES NOT open file picker
    async function handleDiseaseAnalysis(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const file = diseaseInput.files[0];
        if (!file) {
            alert("Please select a plant leaf image first by clicking the upload area.");
            return;
        }

        const resultBox = document.getElementById('result-content');
        diseaseResult.style.display = 'block';
        resultBox.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #4CAF50;"></i>
                <p style="margin-top: 10px; font-weight: 600; color: #2E7D32;">Analyzing leaf with CNN Model...</p>
            </div>
        `;

        const formData = new FormData();
        formData.append('image', file);

        const getMlUrl = (endpoint) => (window.getMlApiUrl ? window.getMlApiUrl(endpoint) : `http://localhost:5001${endpoint}`);

        try {
            const response = await fetch(getMlUrl('/predict'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const confidence = data.confidence !== undefined ? data.confidence : '95.00';
            const currentLang = window.appLanguage || 'en';

            resultBox.innerHTML = `
                <div class="result-item">
                    <h4 class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}">🧠 Disease Detected: <strong>${data.prediction}</strong></h4>
                    <h4 class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}">🧠 पहचाना गया रोग: <strong>${data.prediction}</strong></h4>
                    <p class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}"><strong>Model Confidence:</strong> ${confidence}%</p>
                    <p class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}"><strong>सटीकता / विश्वास:</strong> ${confidence}%</p>
                </div>
            `;
        } catch (err) {
            resultBox.innerHTML = `
                <div class="result-item" style="border-left-color: #d32f2f; background: #ffebee;">
                    <p style="color: #c62828; font-weight: 600;">❌ ${err.message || 'Error analyzing image. Make sure Flask server is running on port 5001.'}</p>
                </div>
            `;
        }
    }

    if (analyzeDiseaseBtn) analyzeDiseaseBtn.addEventListener('click', handleDiseaseAnalysis);
    if (analyzeDiseaseHiBtn) analyzeDiseaseHiBtn.addEventListener('click', handleDiseaseAnalysis);

    // Step 2 for Seed: Dedicated Identify Button click - DOES NOT open file picker
    async function handleSeedIdentification(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const file = seedInput.files[0];
        if (!file) {
            alert("Please select a seed image first by clicking the upload area.");
            return;
        }

        const resultBox = document.getElementById('seed-result-content');
        seedResult.style.display = 'block';
        resultBox.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #4CAF50;"></i>
                <p style="margin-top: 10px; font-weight: 600; color: #2E7D32;">Identifying seed with MobileNetV2 Model...</p>
            </div>
        `;

        const formData = new FormData();
        formData.append('image', file);

        const getMlUrl = (endpoint) => (window.getMlApiUrl ? window.getMlApiUrl(endpoint) : `http://localhost:5001${endpoint}`);

        try {
            const response = await fetch(getMlUrl('/predict-seed'), {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            const currentLang = window.appLanguage || 'en';
            const seedName = data.seed || 'Wheat';
            const scientificName = data.scientific || 'Triticum aestivum';
            const conf = data.confidence !== undefined ? data.confidence : '95.00';
            const plantingEn = data.planting_en || 'Best planted in well-drained soil with proper moisture.';
            const plantingHi = data.planting_hi || 'उचित नमी के साथ अच्छी जल निकासी वाली मिट्टी में लगाएं।';

            if (data.is_recognized === false || parseFloat(conf) < 25.0) {
                resultBox.innerHTML = `
                    <div class="result-item" style="border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px; border-radius: 8px;">
                        <h4 class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}; color: #b45309; margin-bottom: 6px;">⚠️ Unrecognized / Unsupported Seed</h4>
                        <h4 class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}; color: #b45309; margin-bottom: 6px;">⚠️ अज्ञात या असमर्थित बीज</h4>
                        <p class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}; color: #78350f; font-size: 0.9rem; line-height: 1.4;">
                            AI confidence is low (${conf}% match for ${seedName}). This seed does not strongly match any supported crops.<br><br>
                            🌱 <strong>Supported Crops:</strong> Apple, Pomegranate, Wheat, Rice, Corn, Soybean, Sunflower.
                        </p>
                        <p class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}; color: #78350f; font-size: 0.9rem; line-height: 1.4;">
                            एआई सटीकता कम है (${conf}% संभावना ${seedName} के लिए)। यह बीज समर्थित फसलों से मेल नहीं खाता है।<br><br>
                            🌱 <strong>समर्थित फसलें:</strong> सेब, अनार, गेहूं, चावल, मक्का, सोयाबीन, सूरजमुखी।
                        </p>
                    </div>
                `;
                return;
            }

            resultBox.innerHTML = `
                <div class="result-item">
                    <h4 class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}">🌱 Seed Identified: <strong>${seedName}</strong> (<em>${scientificName}</em>)</h4>
                    <h4 class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}">🌱 पहचाना गया बीज: <strong>${seedName}</strong> (<em>${scientificName}</em>)</h4>
                    <p class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}"><strong>Model Confidence:</strong> ${conf}%</p>
                    <p class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}"><strong>सटीकता / विश्वास:</strong> ${conf}%</p>
                </div>
                <div class="result-item" style="margin-top: 10px;">
                    <h4 class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}">🌾 Planting Recommendations:</h4>
                    <h4 class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}">🌾 रोपण संबंधी सिफारिशें:</h4>
                    <p class="en" style="${currentLang === 'en' ? 'display:block' : 'display:none'}">${plantingEn}</p>
                    <p class="hi" style="${currentLang === 'hi' ? 'display:block' : 'display:none'}">${plantingHi}</p>
                </div>
            `;
        } catch (err) {
            resultBox.innerHTML = `
                <div class="result-item" style="border-left-color: #d32f2f; background: #ffebee;">
                    <p style="color: #c62828; font-weight: 600;">❌ ${err.message || 'Error identifying seed. Make sure Flask server is running on port 5001.'}</p>
                </div>
            `;
        }
    }

    if (identifySeedBtn) identifySeedBtn.addEventListener('click', handleSeedIdentification);
    if (identifySeedHiBtn) identifySeedHiBtn.addEventListener('click', handleSeedIdentification);

    // Update Auth link in navbar based on login status
    function updateAuthNav() {
        const authNavItem = document.getElementById('auth-nav-item');
        if (!authNavItem) return;

        const savedUser = localStorage.getItem('smartfarm_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                const currentLang = window.appLanguage || 'en';
                authNavItem.innerHTML = `
                    <span class="en" style="color: #2E7D32; font-weight: 600; display: ${currentLang === 'en' ? 'inline' : 'none'};">👤 ${user.username}</span>
                    <span class="hi" style="color: #2E7D32; font-weight: 600; display: ${currentLang === 'hi' ? 'inline' : 'none'};">👤 ${user.username}</span>
                    <a href="#" id="logout-btn" style="margin-left: 8px; color: #d32f2f; text-decoration: underline; font-size: 13px;">Logout</a>
                `;

                document.getElementById('logout-btn')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('smartfarm_user');
                    updateAuthNav();
                });
            } catch (err) {
                localStorage.removeItem('smartfarm_user');
            }
        } else {
            const currentLang = window.appLanguage || 'en';
            authNavItem.innerHTML = `
                <a href="login.html" class="en" style="font-weight: 600; color: #4CAF50; display: ${currentLang === 'en' ? 'inline' : 'none'};">Sign In</a>
                <a href="login.html" class="hi" style="font-weight: 600; color: #4CAF50; display: ${currentLang === 'hi' ? 'inline' : 'none'};">साइन इन</a>
            `;
        }
    }

    updateAuthNav();
    window.addEventListener('languageChanged', updateAuthNav);
});