document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    initializeCharts();
    setupEventListeners();
    removeHobbyAnalysis();
    improveLayout();
    initializeRatingButtons();
    loadPredictionCount();
});

// Load prediction count from localStorage
function loadPredictionCount() {
    const count = localStorage.getItem('predictionCount') || 0;
    const countElement = document.getElementById('prediction-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Increment prediction count
function incrementPredictionCount() {
    let count = parseInt(localStorage.getItem('predictionCount') || 0);
    count++;
    localStorage.setItem('predictionCount', count);
    const countElement = document.getElementById('prediction-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Initialize rating buttons
function initializeRatingButtons() {
    // Update button states for all hobbies
    const hobbies = ['sports', 'arts', 'reading', 'social', 'gaming', 'vol'];
    hobbies.forEach(hobby => {
        updateButtonStates(hobby);
    });
}

// Increment rating
function incrementRating(hobby) {
    const input = document.getElementById(`h_${hobby}`);
    const display = document.getElementById(`${hobby}_val`);
    let value = parseInt(input.value);
    
    if (value < 5) {
        value++;
        input.value = value;
        display.textContent = value;
        updateButtonStates(hobby);
    }
}

// Decrement rating
function decrementRating(hobby) {
    const input = document.getElementById(`h_${hobby}`);
    const display = document.getElementById(`${hobby}_val`);
    let value = parseInt(input.value);
    
    if (value > 0) {
        value--;
        input.value = value;
        display.textContent = value;
        updateButtonStates(hobby);
    }
}

// Update button states (enable/disable)
function updateButtonStates(hobby) {
    const input = document.getElementById(`h_${hobby}`);
    const value = parseInt(input.value);
    const card = input.closest('.slider-card');
    const buttons = card.querySelectorAll('.rating-btn');
    
    // Disable minus button if value is 0
    buttons[0].disabled = value === 0;
    // Disable plus button if value is 5
    buttons[1].disabled = value === 5;
}

// Make functions globally available
window.incrementRating = incrementRating;
window.decrementRating = decrementRating;
function removeHobbyAnalysis() {
    // Remove the analyze button and hobby select elements
    const analyzeBtn = document.getElementById('analyze-btn');
    const analyzeHobby = document.getElementById('analyze-hobby');
    const impactChart = document.getElementById('impactChart');
    const impactSummary = document.getElementById('impact-summary');
    
    if (analyzeBtn) analyzeBtn.remove();
    if (analyzeHobby && analyzeHobby.parentElement) analyzeHobby.parentElement.remove();
    if (impactChart && impactChart.parentElement) impactChart.parentElement.remove();
    if (impactSummary) impactSummary.remove();
    
    // Remove the entire hobby analysis card
    const cards = document.querySelectorAll('.card h3');
    cards.forEach(h3 => {
        if (h3.textContent.includes('Hobby Impact Analysis')) {
            h3.parentElement.remove();
        }
    });
}

// Improve layout
function improveLayout() {
    // Adjust dashboard for single card
    const resultSection = document.getElementById('result');
    if (resultSection) {
        const dashboard = resultSection.querySelector('.dashboard');
        if (dashboard) {
            dashboard.style.display = 'flex';
            dashboard.style.justifyContent = 'center';
            const card = dashboard.querySelector('.card');
            if (card) {
                card.style.maxWidth = '800px';
                card.style.margin = '0 auto';
            }
        }
    }
    
    // Improve form grid spacing
    const formGrids = document.querySelectorAll('.form-grid');
    formGrids.forEach(grid => {
        grid.style.gap = '1.2rem';
    });
}

// Chart Initialization
let probChart;

function initializeCharts() {
    // Probability Chart
    const probCtx = document.getElementById('probChart').getContext('2d');
    probChart = new Chart(probCtx, {
        type: 'bar',
        data: {
            labels: ['Dropout', 'Graduate', 'Enrolled'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(59, 130, 246, 0.7)'
                ],
                borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        format: {
                            style: 'percent',
                            minimumFractionDigits: 1
                        }
                    }
                }
            }
        }
    });
}

// Event Listeners Setup
function setupEventListeners() {
    const form = document.getElementById('predictor-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await predict();
    });
}

// Prediction Function
async function predict() {
    const form = document.getElementById('predictor-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Convert numerical fields
    const numericFields = [
        'curricular_units_2nd_sem_(approved)',
        'curricular_units_2nd_sem_(grade)',
        'curricular_units_1st_sem_(approved)',
        'curricular_units_1st_sem_(grade)',
        'age_at_enrollment',
        'application_mode'
    ];

    numericFields.forEach(field => {
        data[field] = parseFloat(data[field]);
    });

    // Show loading indicator
    const predictBtn = document.getElementById('predict-btn');
    const originalText = predictBtn.textContent;
    predictBtn.textContent = '⏳ Analyzing...';
    predictBtn.disabled = true;
    predictBtn.style.opacity = '0.7';

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server error: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        if (!result || !result['predictions by model'] || !result['predictions by model'][0]) {
            throw new Error('Invalid response format from server');
        }

        const prediction = result['predictions by model'][0];
        const probabilities = prediction.probabilities;

        // Convert prediction result to match frontend format
        const statusMap = {
            'Dropout': 0,
            'Enrolled': 1,
            'Graduate': 2
        };

        const formattedResult = {
            prediction: statusMap[prediction.predicted_status],
            probabilities: [
                probabilities.Dropout,
                probabilities.Enrolled,
                probabilities.Graduate
            ]
        };

        updateUI(formattedResult);
        incrementPredictionCount();
        
        // Success feedback
        predictBtn.textContent = '✅ Analysis Complete!';
        setTimeout(() => {
            predictBtn.textContent = originalText;
            predictBtn.disabled = false;
            predictBtn.style.opacity = '1';
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        predictBtn.textContent = '❌ Error - Try Again';
        predictBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        // Show user-friendly error message
        alert(`Prediction failed: ${error.message}\n\nPlease check your input values and try again.`);
        
        setTimeout(() => {
            predictBtn.textContent = originalText;
            predictBtn.disabled = false;
            predictBtn.style.opacity = '1';
            predictBtn.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)';
        }, 3000);
    }
}

// UI Update Functions
function updateUI(result) {
    const resultSection = document.getElementById('result');
    const predictionText = document.getElementById('prediction-text');
    const timestamp = document.getElementById('timestamp');
    
    // Update prediction text
    const prediction = result.prediction;
    const probabilities = result.probabilities;
    const probability = Math.max(...probabilities) * 100;
    
    const statusMap = {
        0: { name: 'Dropout Risk', class: 'status-dropout', emoji: '⚠️' },
        1: { name: 'Continuing Studies', class: 'status-enrolled', emoji: '📚' },
        2: { name: 'Likely to Graduate', class: 'status-graduate', emoji: '🎓' }
    };
    
    const status = statusMap[prediction];
    
    predictionText.innerHTML = `
        <div style="text-align: center;">
            <div class="status-badge ${status.class}">
                ${status.emoji} ${status.name}
            </div>
            <div class="prob-bar">
                <div class="prob-fill" style="width: ${probability}%">${probability.toFixed(1)}%</div>
            </div>
        </div>
    `;
    
    // Update individual probability cards
    document.getElementById('dropout-prob').textContent = (probabilities[0] * 100).toFixed(1) + '%';
    document.getElementById('enrolled-prob').textContent = (probabilities[1] * 100).toFixed(1) + '%';
    document.getElementById('graduate-prob').textContent = (probabilities[2] * 100).toFixed(1) + '%';
    
    // Update stats overview cards
    const maxProb = Math.max(...probabilities);
    const confidenceScore = (maxProb * 100).toFixed(0) + '%';
    const successRate = ((probabilities[1] + probabilities[2]) * 100).toFixed(0) + '%';
    const riskLevel = probabilities[0] > 0.6 ? 'High' : probabilities[0] > 0.3 ? 'Medium' : 'Low';
    
    document.getElementById('confidence-score').textContent = confidenceScore;
    document.getElementById('success-rate').textContent = successRate;
    document.getElementById('risk-level').textContent = riskLevel;
    document.getElementById('risk-level').style.color = 
        probabilities[0] > 0.6 ? 'var(--danger)' : 
        probabilities[0] > 0.3 ? 'var(--warning)' : 'var(--success)';
    
    // Highlight the predicted status card
    document.querySelectorAll('.prob-card').forEach((card, index) => {
        card.classList.remove('active');
        if (index === prediction) {
            card.classList.add('active');
        }
    });
    
    // Update probability chart with better colors
    probChart.data.datasets[0].data = probabilities;
    probChart.data.datasets[0].backgroundColor = [
        probabilities[0] > 0.5 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.4)',
        probabilities[1] > 0.5 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.4)',
        probabilities[2] > 0.5 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.4)'
    ];
    probChart.data.datasets[0].borderColor = [
        'rgb(239, 68, 68)',
        'rgb(245, 158, 11)',
        'rgb(16, 185, 129)'
    ];
    probChart.update();
    
    // Update timestamp
    timestamp.textContent = new Date().toLocaleString();
    
    // Show results section with animation
    resultSection.classList.add('visible');
}