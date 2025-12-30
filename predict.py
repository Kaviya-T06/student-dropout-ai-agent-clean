#!/usr/bin/env python
# coding: utf-8

# Import required libraries
print("Importing required libraries...")
import pickle
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory, render_template, session, redirect, url_for
from flask_cors import CORS
import os
from functools import wraps

# Load model - Try optimized model first, fall back to original
print("Loading model...")
try:
    model_file = 'model_optimized.bin'
    with open(model_file, 'rb') as f_in:
        scaler, model_rf, model_name = pickle.load(f_in)
    print(f"✓ Loaded optimized model: {model_name}")
    use_optimized = True
except:
    model_file = 'model_rf.bin'
    with open(model_file, 'rb') as f_in:
        scaler, model_rf = pickle.load(f_in)
    print("✓ Loaded original model")
    use_optimized = False

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = 'your-secret-key-change-this-in-production'  # Change this in production!
CORS(app)  # Enable CORS for all routes

# Demo users (in production, use a database with hashed passwords)
USERS = {
    'admin': 'admin123',
    'student': 'student123',
    'teacher': 'teacher123'
}

@app.route("/", methods=["GET"])
def home():
    """Redirect to login page"""
    return redirect(url_for('login'))

@app.route("/index", methods=["GET"])
def index():
    """Serve the main HTML page"""
    return send_from_directory('static', 'index.html')

@app.route("/dashboard", methods=["GET"])
def dashboard():
    """Serve the modern dashboard HTML page"""
    return send_from_directory('static', 'dashboard.html')

@app.route("/login", methods=["GET", "POST"])
def login():
    """Handle login"""
    if request.method == "GET":
        return send_from_directory('static', 'login.html')
    
    # POST request - process login
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username in USERS and USERS[username] == password:
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route("/predict", methods=["POST"])
def predict():
    try:
        student_data = request.get_json()
        
        # Base columns that both models need
        base_columns = [
            'curricular_units_2nd_sem_(approved)',
            'curricular_units_2nd_sem_(grade)',
            'curricular_units_1st_sem_(approved)',
            'curricular_units_1st_sem_(grade)',
            'tuition_fees_up_to_date',
            'scholarship_holder',
            'age_at_enrollment',
            'debtor',
            'gender',
            'application_mode',
            'curricular_units_2nd_sem_(enrolled)',
            'curricular_units_1st_sem_(enrolled)',
            'displaced',
            'hobbies_sports',
            'hobbies_arts',
            'hobbies_reading',
            'hobbies_social',
            'hobbies_gaming',
            'hobbies_volunteering'
        ]
        
        # Create DataFrame with data
        student = pd.DataFrame([student_data])
        
        # Ensure all base columns exist, fill missing with sensible defaults
        for col in base_columns:
            if col not in student.columns:
                # Set default values based on column type
                if 'grade' in col:
                    student[col] = 7.0  # Default grade
                elif col in ['tuition_fees_up_to_date', 'scholarship_holder', 'debtor', 'gender', 'displaced']:
                    student[col] = 0  # Default binary/categorical
                elif 'hobbies' in col:
                    student[col] = 3  # Default hobby rating
                else:
                    student[col] = 0  # Default for other numeric columns
        
        # Convert all columns to numeric, handling any string values
        for col in base_columns:
            if col in student.columns:
                student[col] = pd.to_numeric(student[col], errors='coerce').fillna(0)
        
        # If using optimized model, add engineered features
        if use_optimized:
            # Add engineered features
            student['total_approved'] = student['curricular_units_1st_sem_(approved)'] + student['curricular_units_2nd_sem_(approved)']
            student['total_enrolled'] = student['curricular_units_1st_sem_(enrolled)'] + student['curricular_units_2nd_sem_(enrolled)']
            student['approval_rate'] = np.where(student['total_enrolled'] > 0, 
                                                student['total_approved'] / student['total_enrolled'], 0)
            student['avg_grade'] = (student['curricular_units_1st_sem_(grade)'] + student['curricular_units_2nd_sem_(grade)']) / 2
            student['grade_trend'] = student['curricular_units_2nd_sem_(grade)'] - student['curricular_units_1st_sem_(grade)']
            
            expected_columns = base_columns + ['total_approved', 'approval_rate', 'avg_grade', 'grade_trend']
        else:
            expected_columns = base_columns
        
        # Extract only the columns the model was trained on
        student = student[expected_columns]
        
        # Ensure data types are correct before scaling
        student = student.astype(float)
        
        # Validate data shape matches expected
        if student.shape[1] != len(expected_columns):
            raise ValueError(f"Data shape mismatch. Expected {len(expected_columns)} columns, got {student.shape[1]}")
        
        # Transform and predict
        X = scaler.transform(student)
        y_pred = model_rf.predict(X)
        y_pred_proba = model_rf.predict_proba(X)

        mapping = {0: 'Dropout', 1: 'Enrolled', 2: 'Graduate'}
        
        # Get confidence level
        max_proba = np.max(y_pred_proba[0])
        if max_proba >= 0.9:
            confidence_level = "High"
            reliability = "97.9% accurate"
        elif max_proba >= 0.5:
            confidence_level = "Medium"
            reliability = "81.6% accurate"
        else:
            confidence_level = "Low"
            reliability = "44.3% accurate - recommend manual review"

        result = {
            'model_version': 'Optimized (76.84% accuracy)' if use_optimized else 'Original (76.27% accuracy)',
            'predictions by model': [
                {
                    'student_id': i + 1,
                    'predicted_status': mapping[pred],
                    'confidence': f"{max_proba*100:.1f}%",
                    'confidence_level': confidence_level,
                    'reliability': reliability,
                    'probabilities': {
                        'Dropout': float(probs[0]),
                        'Enrolled': float(probs[1]),
                        'Graduate': float(probs[2])
                    }
                }
                for i, (pred, probs) in enumerate(zip(y_pred, y_pred_proba))
            ]
        }
        return jsonify(result)
    
    except Exception as e:
        # Return detailed error for debugging
        import traceback
        return jsonify({
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc(),
            'data_received': list(request.get_json().keys()) if request.get_json() else None
        }), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 9696))
    app.run(debug=False, host="0.0.0.0", port=port)
