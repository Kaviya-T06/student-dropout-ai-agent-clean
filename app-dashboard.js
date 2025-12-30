// Chart variable
let probChart;

// Motivational quotes
const motivationalQuotes = [
    "Small progress each day adds up to big results.",
    "Your future is created by what you do today.",
    "Believe in your ability to improve.",
    "Success comes from consistent effort.",
    "Every step forward counts."
];

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    setupEventListeners();
    initializeCharts();
    loadPredictionCount();
    showRandomMotivation();
    updateDidYouKnowFact();
});

// Check if user is logged in
function checkLogin() {
    const loggedIn = localStorage.getItem('logged_in') === 'true' || 
                   sessionStorage.getItem('logged_in') === 'true';
    
    if (!loggedIn) {
        window.location.href = '/login';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('logged_in');
    sessionStorage.removeItem('logged_in');
    window.location.href = '/login';
}

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

// Set up event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    const form = document.getElementById('predictor-form');
    if (form) {
        console.log('✅ Form found, adding submit listener');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Form submitted!');
            await makePrediction();
        });
    } else {
        console.error('❌ Form not found! ID: predictor-form');
    }
}

// Initialize charts with dark mode support
function initializeCharts() {
    const ctx = document.getElementById('probChart');
    if (!ctx) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#E0E0E0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    probChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Graduate', 'Enrolled', 'Dropout'],
            datasets: [{
                label: 'Probability',
                data: [0, 0, 0],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Lexend'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Rating controls
function incrementRating(hobby) {
    const input = document.getElementById(`h_${hobby}`);
    const display = document.getElementById(`${hobby}_val`);
    const bar = document.getElementById(`${hobby}_bar`);
    let value = parseInt(input.value);
    
    if (value < 5) {
        value++;
        input.value = value;
        display.textContent = value;
        bar.style.width = (value / 5 * 100) + '%';
        updateButtonStates(hobby);
    }
}

function decrementRating(hobby) {
    const input = document.getElementById(`h_${hobby}`);
    const display = document.getElementById(`${hobby}_val`);
    const bar = document.getElementById(`${hobby}_bar`);
    let value = parseInt(input.value);
    
    if (value > 0) {
        value--;
        input.value = value;
        display.textContent = value;
        bar.style.width = (value / 5 * 100) + '%';
        updateButtonStates(hobby);
    }
}

function updateButtonStates(hobby) {
    const input = document.getElementById(`h_${hobby}`);
    if (!input) return;
    
    const value = parseInt(input.value);
    
    // Find all buttons for this hobby
    const allButtons = document.querySelectorAll(`[onclick*="${hobby}"]`);
    if (allButtons.length >= 2) {
        allButtons[0].disabled = value === 0; // Decrement button
        allButtons[1].disabled = value === 5; // Increment button
    }
}

// Make prediction
async function makePrediction() {
    console.log('🚀 makePrediction() called');
    
    const form = document.getElementById('predictor-form');
    if (!form) {
        console.error('❌ Form not found!');
        alert('Form not found! Please refresh the page.');
        return;
    }
    
    const formData = new FormData(form);
    const rawInput = {};
    
    // Convert form data to object
    formData.forEach((value, key) => {
        rawInput[key] = parseFloat(value) || 0;
    });
    
    const payload = createApiPayload(rawInput);

    console.log('📊 Form Data (raw):', rawInput);
    console.log('🚀 Payload sent to API:', payload);

    const predictBtn = document.getElementById('predict-btn');
    if (!predictBtn) {
        console.error('❌ Predict button not found!');
        return;
    }
    
    const originalBtnText = predictBtn.innerHTML;
    
    try {
        // Add magical animation to the icon
        predictBtn.disabled = true;
        predictBtn.innerHTML = `
            <span class="material-symbols-outlined text-2xl magical-animation">analytics</span>
            <span>Analyzing...</span>
        `;
        
        console.log('🌐 Sending request to /predict...');

        console.log('🌐 Sending request to /predict...');

        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📨 Response status:', response.status);

        if (!response.ok) {
            throw new Error('Prediction failed with status: ' + response.status);
        }

        const result = await response.json();
        console.log('✅ Response data:', result);
        
        // Check if there's an error in the response
        if (result.error) {
            console.error('❌ Server error:', result.error);
            console.error('📋 Error details:', result);
            const errorMsg = result.traceback 
                ? `Server Error: ${result.error}\n\nType: ${result.type}\n\nCheck console for full traceback.`
                : `Server Error: ${result.error}`;
            throw new Error(errorMsg);
        }
        
        // Check if prediction result exists
        if (!result['predictions by model'] || !result['predictions by model'][0]) {
            throw new Error('Invalid response format from server');
        }
        
        // Extract probabilities from the API response format
        const prediction = result['predictions by model'][0];
        const probs = prediction.probabilities;
        
        console.log('🎯 Extracted probabilities:', probs);
        
        // Convert to the format our displayResults function expects
        const formattedResult = {
            dropout: probs.Dropout,
            enrolled: probs.Enrolled,
            graduate: probs.Graduate,
            predicted_status: prediction.predicted_status,
            confidence: prediction.confidence || 'N/A',
            confidence_level: prediction.confidence_level || 'Unknown',
            reliability: prediction.reliability || 'N/A',
            model_version: result.model_version || 'Unknown'
        };
        
        console.log('📈 Formatted result:', formattedResult);
        
        displayResults(formattedResult, rawInput);
        incrementPredictionCount();
        
        console.log('✨ Prediction complete!');

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error making prediction: ' + error.message + '\n\nCheck the console (F12) for details.');
    } finally {
        predictBtn.disabled = false;
        predictBtn.innerHTML = originalBtnText;
    }
}

// Display prediction results
function displayResults(data, inputData = {}) {
    console.log('Displaying results:', data);
    
    // Store prediction data for report generation
    latestPredictionData = { data, inputData };
    
    // Hide no-prediction placeholder
    const placeholder = document.getElementById('no-prediction');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Show results section with fade-in
    const resultSection = document.getElementById('result');
    if (!resultSection) {
        console.error('Result section not found!');
        return;
    }
    
    resultSection.style.display = 'flex';
    resultSection.style.opacity = '0';
    setTimeout(() => {
        resultSection.style.opacity = '1';
    }, 100);

    // Get probabilities
    const dropout = (data.dropout * 100).toFixed(1);
    const enrolled = (data.enrolled * 100).toFixed(1);
    const graduate = (data.graduate * 100).toFixed(1);

    console.log('Probabilities:', { dropout, enrolled, graduate });

    // Update main prediction
    const maxProb = Math.max(data.dropout, data.enrolled, data.graduate);
    let prediction, statusColor, icon, riskLevel;

    if (maxProb === data.graduate) {
        prediction = 'Likely to Graduate';
        statusColor = 'risk-low';
        icon = 'school';
        riskLevel = 'Low';
    } else if (maxProb === data.enrolled) {
        prediction = 'Currently Enrolled';
        statusColor = 'risk-medium';
        icon = 'person';
        riskLevel = 'Medium';
    } else {
        prediction = 'At Risk of Dropout';
        statusColor = 'risk-high';
        icon = 'warning';
        riskLevel = 'High';
    }

    // Update status badge with confidence info
    const statusBadge = document.getElementById('status-badge');
    const confidenceInfo = data.confidence_level ? ` (${data.confidence_level} Confidence)` : '';
    statusBadge.className = `flex items-center gap-3 text-${statusColor} bg-${statusColor}/10 rounded-full px-4 py-2`;
    statusBadge.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <p class="text-lg font-bold">${prediction}${confidenceInfo}</p>
    `;

    // Update main probability
    document.getElementById('main-probability').textContent = (maxProb * 100).toFixed(1) + '%';

    // Update confidence
    const confidence = (maxProb * 100).toFixed(0);
    document.getElementById('confidence-display').textContent = confidence + '%';

    // Update probability bars
    document.getElementById('graduate-bar').style.width = graduate + '%';
    document.getElementById('graduate-prob').textContent = graduate + '%';
    
    document.getElementById('enrolled-bar').style.width = enrolled + '%';
    document.getElementById('enrolled-prob').textContent = enrolled + '%';
    
    document.getElementById('dropout-bar').style.width = dropout + '%';
    document.getElementById('dropout-prob').textContent = dropout + '%';

    // Update success rate (graduate probability)
    const successRate = graduate;
    document.getElementById('success-rate').textContent = successRate + '%';

    // Update risk level
    const riskBadge = document.getElementById('risk-badge');
    let riskIcon;
    
    if (data.dropout > 0.5) {
        riskLevel = 'High';
        riskIcon = 'error';
        riskBadge.className = 'inline-flex items-center justify-center gap-2 rounded-full bg-risk-high/10 px-4 py-1.5 text-sm font-bold text-risk-high';
    } else if (data.dropout > 0.2) {
        riskLevel = 'Medium';
        riskIcon = 'warning';
        riskBadge.className = 'inline-flex items-center justify-center gap-2 rounded-full bg-risk-medium/10 px-4 py-1.5 text-sm font-bold text-risk-medium';
    } else {
        riskLevel = 'Low';
        riskIcon = 'check_circle';
        riskBadge.className = 'inline-flex items-center justify-center gap-2 rounded-full bg-risk-low/10 px-4 py-1.5 text-sm font-bold text-risk-low';
    }
    
    riskBadge.innerHTML = `
        <span class="material-symbols-outlined text-base">${riskIcon}</span>
        <span>${riskLevel}</span>
    `;

    const metrics = calculateStudentMetrics(inputData);
    updateKeyFactors(metrics, data);
    updateRecommendations(riskLevel, metrics, data);

    // Update chart
    if (probChart) {
        probChart.data.datasets[0].data = [graduate, enrolled, dropout];
        probChart.update();
    }

    // Update timestamp
    const now = new Date();
    document.getElementById('timestamp').textContent = now.toLocaleString();

    // Update quick stats
    updateQuickStats(inputData);

    // Show new motivational quote and update fact
    showRandomMotivation();
    updateDidYouKnowFact(inputData);

    // Update action items
    updateActionItems(inputData, data);

    // Smooth scroll to pie chart
    setTimeout(() => {
        const chartElement = document.getElementById('probChart');
        if (chartElement) {
            chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 300);
}

// Test function to bypass form and call API directly
async function testPrediction() {
    console.log('🧪 TEST: Calling API directly...');
    
    const testInput = {
        "curricular_units_2nd_sem_(enrolled)": 8,
        "curricular_units_2nd_sem_(approved)": 8,
        "curricular_units_2nd_sem_(grade)": 7.0,
        "curricular_units_1st_sem_(enrolled)": 8,
        "curricular_units_1st_sem_(approved)": 8,
        "curricular_units_1st_sem_(grade)": 7.0,
        "tuition_fees_up_to_date": 1,
        "scholarship_holder": 0,
        "age_at_enrollment": 19,
        "debtor": 0,
        "gender": 1,
        "application_mode": 1,
        "displaced": 1,
        "hobbies_sports": 3,
        "hobbies_arts": 3,
        "hobbies_reading": 3,
        "hobbies_social": 3,
        "hobbies_gaming": 3,
        "hobbies_volunteering": 3
    };
    const testPayload = createApiPayload(testInput);
    
    try {
        console.log('📤 Sending:', testPayload);
        
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });
        
        console.log('📨 Status:', response.status);
        const result = await response.json();
        console.log('📦 Result:', result);
        
        if (result['predictions by model']) {
            const pred = result['predictions by model'][0];
            const probs = pred.probabilities;
            
            const formattedResult = {
                dropout: probs.Dropout,
                enrolled: probs.Enrolled,
                graduate: probs.Graduate,
                predicted_status: pred.predicted_status
            };
            
            console.log('✅ Formatted:', formattedResult);
            displayResults(formattedResult, testInput);
            incrementPredictionCount();
            
            alert('✅ Test Successful! Prediction: ' + pred.predicted_status);
        }
    } catch (error) {
        console.error('❌ Test Error:', error);
        alert('❌ Test Failed: ' + error.message);
    }
}

function calculateStudentMetrics(inputData = {}) {
    const gradeValuesRaw = [
        Number(inputData['curricular_units_1st_sem_(grade)']),
        Number(inputData['curricular_units_2nd_sem_(grade)'])
    ].filter((val) => !isNaN(val) && val > 0);

    const avgGrade = gradeValuesRaw.length
        ? gradeValuesRaw.reduce((acc, val) => acc + val, 0) / gradeValuesRaw.length
        : 0;
    const gradeScore = clamp((avgGrade / 10) * 100, 0, 100);

    const enrolled1 = Number(inputData['curricular_units_1st_sem_(enrolled)']) || 0;
    const enrolled2 = Number(inputData['curricular_units_2nd_sem_(enrolled)']) || 0;
    const approved1 = Number(inputData['curricular_units_1st_sem_(approved)']) || 0;
    const approved2 = Number(inputData['curricular_units_2nd_sem_(approved)']) || 0;

    const totalEnrolled = enrolled1 + enrolled2;
    const totalApproved = approved1 + approved2;
    const approvalRate = totalEnrolled > 0 ? totalApproved / totalEnrolled : 0;
    const approvalScore = clamp(approvalRate * 100, 0, 100);

    const tuitionUpToDate = Number(inputData['tuition_fees_up_to_date']) === 1;
    const hasScholarship = Number(inputData['scholarship_holder']) === 1;
    const isDebtor = Number(inputData['debtor']) === 1;

    let financialScore = 50;
    financialScore += tuitionUpToDate ? 25 : -25;
    financialScore += hasScholarship ? 15 : 0;
    financialScore += isDebtor ? -20 : 0;
    financialScore = clamp(financialScore, 0, 100);

    const hobbyKeys = [
        'sports',
        'arts',
        'reading',
        'social',
        'gaming',
        'volunteering'
    ];

    const hobbyValues = hobbyKeys.map((key) => {
        const value = Number(inputData[`hobbies_${key}`]);
        return !isNaN(value) ? value : 0;
    });

    const engagementAverage = hobbyValues.length
        ? hobbyValues.reduce((acc, val) => acc + val, 0) / hobbyValues.length
        : 0;
    const engagementScore = clamp((engagementAverage / 5) * 100, 0, 100);

    return {
        avgGrade,
        gradeScore,
        totalEnrolled,
        totalApproved,
        approvalRate,
        approvalScore,
        tuitionUpToDate,
        hasScholarship,
        isDebtor,
        financialScore,
        engagementAverage,
        engagementScore
    };
}

function updateKeyFactors(metrics, predictionData = {}) {
    const container = document.getElementById('factor-list');
    if (!container) return;

    const factors = [
        {
            label: 'Semester Grades',
            icon: 'school',
            value: metrics.gradeScore,
            badge: metrics.avgGrade ? `${metrics.avgGrade.toFixed(1)}/10` : 'N/A',
            description: metrics.avgGrade
                ? `Average semester grade of ${metrics.avgGrade.toFixed(1)} out of 10.`
                : 'Add semester grades to calculate academic performance.'
        },
        {
            label: 'Units Approved',
            icon: 'assignment_turned_in',
            value: metrics.approvalScore,
            badge: metrics.totalEnrolled
                ? `${metrics.totalApproved}/${metrics.totalEnrolled}`
                : 'N/A',
            description: metrics.totalEnrolled
                ? `${metrics.totalApproved} of ${metrics.totalEnrolled} units approved across the last two semesters.`
                : 'Provide enrolled and approved units to evaluate progress.'
        },
        {
            label: 'Financial Stability',
            icon: 'payments',
            value: metrics.financialScore,
            badge: metrics.tuitionUpToDate && !metrics.isDebtor ? 'Good' : metrics.isDebtor ? 'At Risk' : 'Fair',
            description: buildFinancialDescription(metrics)
        },
        {
            label: 'Engagement & Hobbies',
            icon: 'diversity_3',
            value: metrics.engagementScore,
            badge: `${metrics.engagementAverage.toFixed(1)}/5`,
            description: metrics.engagementAverage
                ? 'Extracurricular involvement level based on self-reported hobbies.'
                : 'Adjust hobby sliders to capture engagement.'
        }
    ];

    container.innerHTML = factors
        .map((factor) => {
            return `
                <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">${factor.icon}</span>
                            <p class="text-sm font-semibold text-text-primary dark:text-text-primary-dark">${factor.label}</p>
                        </div>
                        <span class="value-badge">${factor.badge}</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-primary to-primary-dark transition-all" style="width: ${clamp(factor.value, 0, 100)}%"></div>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${factor.description}</p>
                </div>
            `;
        })
        .join('');
}

function updateRecommendations(riskLevel, metrics, predictionData = {}) {
    const list = document.getElementById('recommendation-list');
    if (!list) return;

    const recommendations = [];
    
    // Determine recommendations based on dropout probability and risk level
    const dropoutProb = predictionData.dropout || 0;
    const graduateProb = predictionData.graduate || 0;
    
    // HIGH RISK - Dropout probability > 50%
    if (dropoutProb > 0.5) {
        recommendations.push({
            icon: 'priority_high',
            text: 'URGENT: Schedule immediate intervention meeting with student and counselor'
        });
        recommendations.push({
            icon: 'support_agent',
            text: 'Assign academic mentor for weekly one-on-one support sessions'
        });
        recommendations.push({
            icon: 'psychology',
            text: 'Assess for personal challenges (financial, mental health, family issues)'
        });
        recommendations.push({
            icon: 'groups',
            text: 'Connect student with peer study groups and academic support resources'
        });
    }
    // MEDIUM RISK - Dropout probability 20-50%
    else if (dropoutProb > 0.2) {
        recommendations.push({
            icon: 'warning',
            text: 'Monitor student progress closely and schedule bi-weekly check-ins'
        });
        recommendations.push({
            icon: 'school',
            text: 'Provide additional tutoring or study resources for struggling subjects'
        });
        recommendations.push({
            icon: 'calendar_today',
            text: 'Help student develop structured study schedule and time management plan'
        });
        recommendations.push({
            icon: 'feedback',
            text: 'Increase frequency of assignment feedback to track improvement'
        });
    }
    // LOW RISK - High graduation probability
    else if (graduateProb > 0.5) {
        recommendations.push({
            icon: 'stars',
            text: 'Recognize and celebrate student achievements to maintain motivation'
        });
        recommendations.push({
            icon: 'trending_up',
            text: 'Encourage student to pursue advanced coursework or leadership opportunities'
        });
        recommendations.push({
            icon: 'diversity_3',
            text: 'Consider student as peer mentor to support struggling classmates'
        });
        recommendations.push({
            icon: 'check_circle',
            text: 'Continue monitoring to ensure sustained academic performance'
        });
    }
    // DEFAULT - Mixed predictions
    else {
        recommendations.push({
            icon: 'visibility',
            text: 'Monitor student attendance regularly and address absences promptly'
        });
        recommendations.push({
            icon: 'schedule',
            text: 'Encourage consistent study routines and time management strategies'
        });
        recommendations.push({
            icon: 'assignment',
            text: 'Provide timely feedback on assignments to improve academic performance'
        });
        recommendations.push({
            icon: 'chat',
            text: 'Schedule regular check-ins to identify and address potential challenges early'
        });
    }

    list.innerHTML = recommendations
        .map(
            (rec) => `
            <li class="flex items-start gap-3">
                <span class="material-symbols-outlined text-primary mt-0.5">${rec.icon}</span>
                <p class="text-sm text-text-primary dark:text-text-primary-dark">${rec.text}</p>
            </li>
        `
        )
        .join('');
}

function buildFinancialDescription(metrics) {
    if (!metrics) return 'Financial indicators unavailable.';

    const states = [];
    states.push(metrics.tuitionUpToDate ? 'Tuition fees are up to date' : 'Outstanding tuition detected');
    states.push(metrics.hasScholarship ? 'Scholarship support active' : 'No scholarship reported');
    if (metrics.isDebtor) {
        states.push('Debtor status requires attention');
    }

    return states.join(' · ');
}

function clamp(value, min, max) {
    if (isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
}

function createApiPayload(rawInput = {}) {
    const payload = { ...rawInput };
    const gradeFields = [
        'curricular_units_1st_sem_(grade)',
        'curricular_units_2nd_sem_(grade)'
    ];

    gradeFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
            const gradeValue = Number(payload[field]);
            if (!isNaN(gradeValue)) {
                payload[field] = clamp(gradeValue * 2, 0, 20);
            }
        }
    });

    return payload;
}

// Motivational Quote Functions
function showRandomMotivation() {
    const quoteElement = document.getElementById('motivation-quote');
    if (!quoteElement) return;
    
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    quoteElement.textContent = motivationalQuotes[randomIndex];
}

// Did You Know Fact Functions
function updateDidYouKnowFact(inputData = {}) {
    const factElement = document.getElementById('did-you-know-fact');
    if (!factElement) return;
    
    let fact = "Consistent study routines are linked with higher graduation rates."; // Default
    
    if (!inputData || Object.keys(inputData).length === 0) {
        // If no input data, use default
        factElement.textContent = fact;
        return;
    }
    
    // Check attendance
    const attendance = parseFloat(inputData.attendance_percentage) || 0;
    if (attendance < 60) {
        fact = "Did you know? Students with better than 70% attendance are 3x more likely to graduate.";
        factElement.textContent = fact;
        return;
    }
    
    // Check study hours
    const studyHours = parseFloat(inputData.study_hours_per_week) || 0;
    if (studyHours < 5) {
        fact = "Did you know? Studying just 30 minutes more per day significantly improves performance.";
        factElement.textContent = fact;
        return;
    }
    
    // Check previous failures
    const previousFailures = parseFloat(inputData.previous_failures) || 0;
    if (previousFailures > 1) {
        fact = "Did you know? Early intervention after repeated failures greatly increases success rates.";
        factElement.textContent = fact;
        return;
    }
    
    // Check grades (1st or 2nd semester)
    const grade1 = parseFloat(inputData['curricular_units_1st_sem_(grade)']) || 0;
    const grade2 = parseFloat(inputData['curricular_units_2nd_sem_(grade)']) || 0;
    
    // Convert grades to 0-10 scale if they're in 0-20 scale
    const normalizedGrade1 = grade1 > 10 ? grade1 / 2 : grade1;
    const normalizedGrade2 = grade2 > 10 ? grade2 / 2 : grade2;
    
    if (normalizedGrade1 < 7 || normalizedGrade2 < 7) {
        fact = "Did you know? Students who practice active revision improve grades by 15%.";
        factElement.textContent = fact;
        return;
    }
    
    // Default fact
    factElement.textContent = fact;
}

// Quick Stats Functions
function updateQuickStats(inputData = {}) {
    // Update attendance
    const attendanceEl = document.getElementById('quick-attendance');
    if (attendanceEl) {
        const attendance = parseFloat(inputData.attendance_percentage) || 0;
        attendanceEl.textContent = attendance > 0 ? `${attendance.toFixed(0)}%` : '--';
        attendanceEl.className = attendance < 60 
            ? 'text-lg font-bold text-risk-high' 
            : attendance < 80 
            ? 'text-lg font-bold text-risk-medium' 
            : 'text-lg font-bold text-risk-low';
    }

    // Update study hours
    const studyHoursEl = document.getElementById('quick-study-hours');
    if (studyHoursEl) {
        const studyHours = parseFloat(inputData.study_hours_per_week) || 0;
        studyHoursEl.textContent = studyHours > 0 ? `${studyHours}h` : '--';
        studyHoursEl.className = studyHours < 5 
            ? 'text-lg font-bold text-risk-high' 
            : studyHours < 10 
            ? 'text-lg font-bold text-risk-medium' 
            : 'text-lg font-bold text-risk-low';
    }

    // Update average grade
    const avgGradeEl = document.getElementById('quick-avg-grade');
    if (avgGradeEl) {
        const grade1 = parseFloat(inputData['curricular_units_1st_sem_(grade)']) || 0;
        const grade2 = parseFloat(inputData['curricular_units_2nd_sem_(grade)']) || 0;
        
        // Normalize grades to 0-10 scale
        const normalizedGrade1 = grade1 > 10 ? grade1 / 2 : grade1;
        const normalizedGrade2 = grade2 > 10 ? grade2 / 2 : grade2;
        
        let avgGrade = 0;
        let validGrades = [];
        if (normalizedGrade1 > 0) validGrades.push(normalizedGrade1);
        if (normalizedGrade2 > 0) validGrades.push(normalizedGrade2);
        
        if (validGrades.length > 0) {
            avgGrade = validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length;
        }
        
        avgGradeEl.textContent = avgGrade > 0 ? avgGrade.toFixed(1) : '--';
        avgGradeEl.className = avgGrade < 7 
            ? 'text-lg font-bold text-risk-high' 
            : avgGrade < 8 
            ? 'text-lg font-bold text-risk-medium' 
            : 'text-lg font-bold text-risk-low';
    }

    // Update failures
    const failuresEl = document.getElementById('quick-failures');
    if (failuresEl) {
        const failures = parseFloat(inputData.previous_failures) || 0;
        failuresEl.textContent = failures > 0 ? failures : '0';
        failuresEl.className = failures > 1 
            ? 'text-lg font-bold text-risk-high' 
            : failures === 1 
            ? 'text-lg font-bold text-risk-medium' 
            : 'text-lg font-bold text-risk-low';
    }
}

// Action Items Functions
function updateActionItems(inputData = {}, predictionData = {}) {
    const actionList = document.getElementById('action-items-list');
    if (!actionList) return;

    const items = [];

    // Check attendance
    const attendance = parseFloat(inputData.attendance_percentage) || 0;
    if (attendance < 60) {
        items.push({
            icon: 'event_busy',
            text: 'Increase attendance to above 70% for better outcomes'
        });
    }

    // Check study hours
    const studyHours = parseFloat(inputData.study_hours_per_week) || 0;
    if (studyHours < 5) {
        items.push({
            icon: 'schedule',
            text: 'Aim for at least 10-15 hours of study per week'
        });
    }

    // Check grades
    const grade1 = parseFloat(inputData['curricular_units_1st_sem_(grade)']) || 0;
    const grade2 = parseFloat(inputData['curricular_units_2nd_sem_(grade)']) || 0;
    const normalizedGrade1 = grade1 > 10 ? grade1 / 2 : grade1;
    const normalizedGrade2 = grade2 > 10 ? grade2 / 2 : grade2;
    
    if ((normalizedGrade1 > 0 && normalizedGrade1 < 7) || (normalizedGrade2 > 0 && normalizedGrade2 < 7)) {
        items.push({
            icon: 'school',
            text: 'Focus on improving semester grades through active revision'
        });
    }

    // Check failures
    const failures = parseFloat(inputData.previous_failures) || 0;
    if (failures > 1) {
        items.push({
            icon: 'warning',
            text: 'Consider seeking academic support for repeated failures'
        });
    }

    // Check dropout risk
    const dropoutProb = predictionData.dropout || 0;
    if (dropoutProb > 0.6) {
        items.push({
            icon: 'priority_high',
            text: 'Immediate intervention recommended - schedule counseling session'
        });
    }

    // Default items if no specific issues
    if (items.length === 0) {
        items.push(
            { icon: 'check_circle', text: 'Maintain current attendance levels' },
            { icon: 'trending_up', text: 'Continue consistent study routine' },
            { icon: 'assignment', text: 'Keep monitoring academic performance' }
        );
    } else {
        // Add general maintenance items
        if (attendance >= 70 && studyHours >= 10) {
            items.push({
                icon: 'check_circle',
                text: 'Maintain good attendance and study habits'
            });
        }
    }

    // Render items
    actionList.innerHTML = items.map(item => `
        <li class="flex items-start gap-2">
            <span class="material-symbols-outlined text-primary text-sm mt-0.5">${item.icon}</span>
            <span class="flex-1">${item.text}</span>
        </li>
    `).join('');
}


// Global variable to store latest prediction data for report
let latestPredictionData = null;

// Download Report Function
function downloadReport() {
    if (!latestPredictionData) {
        alert('No prediction data available. Please make a prediction first.');
        return;
    }

    const { data, inputData } = latestPredictionData;
    
    // Get current timestamp
    const now = new Date();
    const timestamp = now.toLocaleString();
    
    // Extract prediction details
    const dropout = (data.dropout * 100).toFixed(1);
    const enrolled = (data.enrolled * 100).toFixed(1);
    const graduate = (data.graduate * 100).toFixed(1);
    
    const maxProb = Math.max(data.dropout, data.enrolled, data.graduate);
    let prediction, riskLevel;
    
    if (maxProb === data.graduate) {
        prediction = 'Likely to Graduate';
        riskLevel = 'Low Risk';
    } else if (maxProb === data.enrolled) {
        prediction = 'Currently Enrolled';
        riskLevel = 'Medium Risk';
    } else {
        prediction = 'At Risk of Dropout';
        riskLevel = 'High Risk';
    }
    
    const confidence = (maxProb * 100).toFixed(1);
    
    // Calculate metrics
    const metrics = calculateStudentMetrics(inputData);
    
    // Get recommendations and format them properly
    const recommendationElements = document.querySelectorAll('#recommendation-list li');
    let recommendations = '';
    if (recommendationElements.length > 0) {
        recommendations = '<ul style="list-style-type: disc; margin: 10px 0; padding-left: 30px;">';
        recommendationElements.forEach((li, index) => {
            // Extract only the text from the <p> tag, not the icon
            const textElement = li.querySelector('p');
            const text = textElement ? textElement.textContent.trim() : '';
            if (text && !text.includes('Insights and guidance')) {
                recommendations += `<li style="margin: 10px 0; line-height: 1.8;">${text}</li>`;
            }
        });
        recommendations += '</ul>';
    } else {
        recommendations = '<p>No specific recommendations available at this time.</p>';
    }
    
    // Create HTML content for the report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Student Success Prediction Report</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #667eea;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin: 25px 0;
            page-break-inside: avoid;
        }
        .section-title {
            background: #667eea;
            color: white;
            padding: 10px 15px;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            border-radius: 5px;
        }
        .prediction-box {
            background: #f0f2f5;
            border-left: 5px solid #667eea;
            padding: 20px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .prediction-box .main-result {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        .prediction-box .confidence {
            font-size: 18px;
            color: #666;
        }
        .prob-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .prob-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        .prob-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
        }
        .prob-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        .risk-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
        .risk-low { background: #d1fae5; color: #065f46; }
        .risk-medium { background: #fef3c7; color: #92400e; }
        .risk-high { background: #fee2e2; color: #991b1b; }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 15px 0;
        }
        .metric-card {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .metric-card .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .metric-card .value {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
        }
        .recommendations {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin: 8px 0;
            line-height: 1.6;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .print-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
        }
        .print-btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Student Success Prediction Report</h1>
        <div class="subtitle">AI-Powered Academic Success Analysis</div>
        <div class="subtitle">Generated: ${timestamp}</div>
    </div>

    <div class="section">
        <div class="section-title">Primary Prediction</div>
        <div class="prediction-box">
            <div><strong>Status:</strong> ${prediction}</div>
            <div class="main-result">${confidence}% Confidence</div>
            <div class="confidence">Risk Level: <span class="risk-badge risk-${riskLevel.includes('High') ? 'high' : riskLevel.includes('Medium') ? 'medium' : 'low'}">${riskLevel}</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Probability Distribution</div>
        <table class="prob-table">
            <thead>
                <tr>
                    <th>Outcome</th>
                    <th>Probability</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Graduate</strong></td>
                    <td>${graduate}%</td>
                </tr>
                <tr>
                    <td><strong>Enrolled (Continuing)</strong></td>
                    <td>${enrolled}%</td>
                </tr>
                <tr>
                    <td><strong>Dropout</strong></td>
                    <td>${dropout}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Student Metrics</div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="label">Academic Performance</div>
                <div class="value">${Math.round(metrics.approvalScore)}/100</div>
            </div>
            <div class="metric-card">
                <div class="label">Financial Stability</div>
                <div class="value">${Math.round(metrics.financialScore)}/100</div>
            </div>
            <div class="metric-card">
                <div class="label">Student Engagement</div>
                <div class="value">${Math.round(metrics.engagementScore)}/100</div>
            </div>
            <div class="metric-card">
                <div class="label">Graduate Probability</div>
                <div class="value">${graduate}%</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Key Student Information</div>
        <table class="prob-table">
            <tbody>
                <tr>
                    <td><strong>Age at Enrollment</strong></td>
                    <td>${inputData.age_at_enrollment || 'N/A'} years</td>
                </tr>
                <tr>
                    <td><strong>Previous Failures</strong></td>
                    <td>${inputData.previous_failures || 0}</td>
                </tr>
                <tr>
                    <td><strong>1st Semester - Enrolled/Approved</strong></td>
                    <td>${inputData['curricular_units_1st_sem_(enrolled)'] || 0} / ${inputData['curricular_units_1st_sem_(approved)'] || 0}</td>
                </tr>
                <tr>
                    <td><strong>1st Semester - Average Grade</strong></td>
                    <td>${inputData['curricular_units_1st_sem_(grade)'] || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>2nd Semester - Enrolled/Approved</strong></td>
                    <td>${inputData['curricular_units_2nd_sem_(enrolled)'] || 0} / ${inputData['curricular_units_2nd_sem_(approved)'] || 0}</td>
                </tr>
                <tr>
                    <td><strong>2nd Semester - Average Grade</strong></td>
                    <td>${inputData['curricular_units_2nd_sem_(grade)'] || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Tuition Fees Status</strong></td>
                    <td>${inputData.tuition_fees_up_to_date == 1 ? 'Up to Date' : 'Not Current'}</td>
                </tr>
                <tr>
                    <td><strong>Scholarship Holder</strong></td>
                    <td>${inputData.scholarship_holder == 1 ? 'Yes' : 'No'}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Recommendations for Teachers</div>
        <div class="recommendations">
            <p style="margin-bottom: 15px; font-weight: 600; color: #92400e;">Based on the prediction analysis, the following actions are recommended:</p>
            ${recommendations}
        </div>
    </div>

    <div class="footer">
        <p><strong>Student Shield</strong> - AI-Powered Success Prediction System</p>
        <p>Generated on ${timestamp}</p>
    </div>

    <button class="print-btn no-print" onclick="window.print()">🖨️ Print Report</button>
</body>
</html>
    `;
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
}
