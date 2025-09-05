from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import xgboost as xgb
import json
import uuid
from datetime import datetime

app = FastAPI(title="IntelliInspect ML Service", version="1.0.0")

# Global storage for models and data
models_storage = {}
data_storage = {}

class TrainingRequest(BaseModel):
    dataset_id: str
    training_data: List[Dict[str, Any]]
    testing_data: List[Dict[str, Any]]

class PredictionRequest(BaseModel):
    model_id: str
    data: Dict[str, Any]

class TrainingResponse(BaseModel):
    model_id: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]

class PredictionResponse(BaseModel):
    prediction: int
    confidence: float

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest):
    try:
        # Convert to DataFrame
        train_df = pd.DataFrame(request.training_data)
        test_df = pd.DataFrame(request.testing_data)
        
        # Combine data for better training with small datasets
        all_data = pd.concat([train_df, test_df], ignore_index=True)
        
        # Handle missing values in sparse datasets
        print(f"DEBUG: Missing values before cleanup: {all_data.isnull().sum().sum()}")
        all_data = all_data.fillna(0)  # Fill missing values with 0 for numerical data
        print(f"DEBUG: Dataset cleaned, shape: {all_data.shape}")
        
        # Smart target column detection - look for common target names or last column
        target_column = None
        for col in all_data.columns:
            if col.lower() in ['quality', 'pass', 'fail', 'status', 'result', 'target', 'label', 'response', 'output', 'class', 'y']:
                target_column = col
                break
        
        if target_column is None:
            target_column = all_data.columns[-1]
        
        # Remove timestamp columns and ID columns if they exist
        feature_columns = [col for col in all_data.columns 
                          if col != target_column and 
                          'timestamp' not in col.lower() and 
                          'time' not in col.lower() and
                          'date' not in col.lower() and
                          col.lower() != 'id']
        
        # Handle very wide datasets (limit features for memory management)
        if len(feature_columns) > 500:
            print(f"DEBUG: Wide dataset detected ({len(feature_columns)} features), selecting top 300 features")
            # Keep only columns with non-zero values to reduce sparsity
            feature_importance = all_data[feature_columns].apply(lambda x: (x != 0).sum(), axis=0)
            top_features = feature_importance.nlargest(300).index.tolist()
            feature_columns = top_features
        
        print(f"DEBUG: Dataset shape: {all_data.shape}")
        print(f"DEBUG: Target column: {target_column}")
        print(f"DEBUG: Feature columns count: {len(feature_columns)}")
        print(f"DEBUG: Target values: {all_data[target_column].value_counts().to_dict()}")
        
        # Prepare features and target
        X = all_data[feature_columns].copy()
        y = all_data[target_column].copy()
        
        # Split into train/test (use larger test set for better metrics)
        from sklearn.model_selection import train_test_split
        test_size = max(0.3, 8/len(all_data)) if len(all_data) < 50 else 0.2
        
        # Safely handle stratification
        try:
            if len(y.unique()) > 1 and len(y) >= 4:  # Need at least 2 samples per class
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42, stratify=y)
            else:
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        except Exception as split_error:
            print(f"DEBUG: Stratified split failed: {split_error}, using regular split")
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        
        # Handle categorical variables with unseen value handling
        label_encoders = {}
        for col in X_train.columns:
            if X_train[col].dtype == 'object':
                le = LabelEncoder()
                
                # Fit on training data
                X_train[col] = le.fit_transform(X_train[col].astype(str))
                
                # Handle unseen values in test data
                test_values = X_test[col].astype(str)
                seen_values = set(le.classes_)
                
                # Replace unseen values with the most common training value
                most_common_value = le.classes_[0]  # First class (most common after sorting)
                test_values_handled = test_values.apply(lambda x: x if x in seen_values else most_common_value)
                
                X_test[col] = le.transform(test_values_handled)
                label_encoders[col] = le
                
                print(f"DEBUG: Column {col} - Training classes: {len(le.classes_)}, Handled unseen values in test")
        
        # Encode target variable if necessary with unseen value handling
        target_encoder = None
        if y_train.dtype == 'object':
            target_encoder = LabelEncoder()
            
            # Fit on training targets
            y_train = target_encoder.fit_transform(y_train.astype(str))
            
            # Handle unseen values in test targets
            test_targets = y_test.astype(str)
            seen_targets = set(target_encoder.classes_)
            most_common_target = target_encoder.classes_[0]
            
            test_targets_handled = test_targets.apply(lambda x: x if x in seen_targets else most_common_target)
            y_test = target_encoder.transform(test_targets_handled)
            
            print(f"DEBUG: Target variable - Training classes: {target_encoder.classes_}, Test handled")
        
        print(f"DEBUG: Training set shape: {X_train.shape}, Test set shape: {X_test.shape}")
        print(f"DEBUG: Training target distribution: {pd.Series(y_train).value_counts().to_dict()}")
        print(f"DEBUG: Test target distribution: {pd.Series(y_test).value_counts().to_dict()}")
        
        # Train XGBoost model with better parameters for small datasets
        model = xgb.XGBClassifier(
            random_state=42, 
            eval_metric='logloss',
            max_depth=3,  # Prevent overfitting on small data
            n_estimators=50,  # Fewer trees for small data
            learning_rate=0.1
        )
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        print(f"DEBUG: Predictions: {y_pred.tolist()}")
        print(f"DEBUG: Actual: {y_test.tolist()}")
        print(f"DEBUG: Unique predictions: {np.unique(y_pred)}")
        print(f"DEBUG: Unique actual: {np.unique(y_test)}")
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        
        # Handle edge cases for precision/recall when classes are missing
        try:
            precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        except:
            precision = accuracy
            recall = accuracy  
            f1 = accuracy
        
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        print(f"DEBUG: Final metrics - Accuracy: {accuracy:.3f}, Precision: {precision:.3f}, Recall: {recall:.3f}, F1: {f1:.3f}")
        
        # Clean up old models to prevent memory buildup (keep only last 3)
        if len(models_storage) >= 3:
            oldest_models = sorted(models_storage.items(), 
                                 key=lambda x: x[1]['created_at'])
            for old_id, _ in oldest_models[:-2]:  # Keep only 2 most recent
                print(f"DEBUG: Cleaning up old model: {old_id}")
                del models_storage[old_id]
        
        # Store model and metadata
        model_id = str(uuid.uuid4())
        models_storage[model_id] = {
            'model': model,
            'label_encoders': label_encoders,
            'target_encoder': target_encoder,
            'feature_columns': list(feature_columns),
            'created_at': datetime.now().isoformat()
        }
        
        print(f"DEBUG: Stored model {model_id}, total models in memory: {len(models_storage)}")
        
        return TrainingResponse(
            model_id=model_id,
            accuracy=float(accuracy),
            precision=float(precision),
            recall=float(recall),
            f1_score=float(f1),
            confusion_matrix=cm
        )
        
    except Exception as e:
        import traceback
        error_msg = f"Training failed: {str(e)}"
        full_traceback = traceback.format_exc()
        print(f"DEBUG: Full error details:")
        print(full_traceback)
        raise HTTPException(status_code=400, detail=error_msg)

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        if request.model_id not in models_storage:
            raise HTTPException(status_code=404, detail="Model not found")
        
        model_info = models_storage[request.model_id]
        model = model_info['model']
        label_encoders = model_info['label_encoders']
        target_encoder = model_info['target_encoder']
        feature_columns = model_info['feature_columns']
        
        # Prepare input data
        input_df = pd.DataFrame([request.data])
        
        # Select only the feature columns used during training
        input_df = input_df[feature_columns]
        
        # Apply label encoders with unseen value handling
        for col, le in label_encoders.items():
            if col in input_df.columns:
                # Handle unseen values in prediction data
                input_values = input_df[col].astype(str)
                seen_values = set(le.classes_)
                most_common_value = le.classes_[0]
                
                # Replace unseen values 
                input_values_handled = input_values.apply(lambda x: x if x in seen_values else most_common_value)
                input_df[col] = le.transform(input_values_handled)
        
        # Make prediction
        prediction = model.predict(input_df)[0]
        prediction_proba = model.predict_proba(input_df)[0]
        
        # Get confidence (max probability)
        confidence = float(max(prediction_proba))
        
        # Decode prediction if necessary
        if target_encoder:
            prediction = target_encoder.inverse_transform([prediction])[0]
        
        # Convert prediction to binary (0/1) for pass/fail
        prediction_binary = 1 if str(prediction).lower() in ['pass', '1', 'true'] else 0
        
        return PredictionResponse(
            prediction=int(prediction_binary),
            confidence=confidence
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")

@app.get("/models")
async def list_models():
    return {
        "models": [
            {
                "model_id": model_id,
                "created_at": info["created_at"],
                "feature_count": len(info["feature_columns"])
            }
            for model_id, info in models_storage.items()
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
