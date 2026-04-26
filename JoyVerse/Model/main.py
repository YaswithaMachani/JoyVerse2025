from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io, torch, cv2
import torchvision.transforms as transforms
import numpy as np
from datetime import datetime
from pymongo import MongoClient
import mediapipe as mp

from vit_model import ViTEmotionModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = ViTEmotionModel().to(device)
model.load_state_dict(torch.load("models/best_model_5class.pth", map_location=device))
model.eval()

CLASS_NAMES = ['anger', 'happiness', 'neutral', 'sadness', 'surprise']
IMG_SIZE = 128
LANDMARK_FEATURES = 468 * 2

# DB setup with timeouts
client = MongoClient(
    "mongodb+srv://joyadmin:joy123@joyverse.wh2ssu9.mongodb.net/joyverse?retryWrites=true&w=majority&appName=JoyVerse",
    serverSelectionTimeoutMS=5000,  # 5 second timeout for server selection
    socketTimeoutMS=10000,          # 10 second timeout for socket operations
    connectTimeoutMS=5000,          # 5 second timeout for connection
    maxPoolSize=10                  # Limit connection pool to prevent resource exhaustion
)
db = client["emotion_db"]
collection = db["emotion_predictions"]

# Test connection at startup
try:
    # Ping the database to check connection
    db.command("ping")
    print("✅ MongoDB connection successful")
except Exception as e:
    print(f"⚠️ MongoDB connection issue: {str(e)}")
    # Continue running even if DB is unavailable

# Face mesh
mp_face_mesh = mp.solutions.face_mesh
# Use even more robust settings for face mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,  # Change to False for more performance
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.3,  # Lower threshold to increase detection rate
    min_tracking_confidence=0.3    # Lower threshold for better tracking
)

# Initialize model and face mesh status
last_prediction_time = datetime.now()
prediction_count = 0

# Preprocessing
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

def reinitialize_face_mesh():
    """Reinitialize the face mesh detector if needed"""
    global face_mesh
    try:
        # Close previous instance
        if face_mesh:
            face_mesh.close()
        
        # Create a new instance with optimized settings
        face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,  # False for more performance
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.3,  # Lower threshold to increase detection rate
            min_tracking_confidence=0.3    # Lower threshold for better tracking
        )
        print("🔄 Face mesh reinitialized")
        return True
    except Exception as e:
        print(f"❌ Failed to reinitialize face mesh: {str(e)}")
        return False

def extract_landmarks(image_tensor):
    global face_mesh
    
    # Convert tensor to numpy image
    image_np = image_tensor.permute(1, 2, 0).cpu().numpy()
    image_np = ((image_np * 0.5 + 0.5) * 255).astype(np.uint8)
    
    # Process with face mesh with more robust handling
    try:
        # Try to get better face detection by enhancing the image
        enhanced_image = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        
        # Apply mild contrast enhancement
        enhanced_image = cv2.convertScaleAbs(enhanced_image, alpha=1.1, beta=10)
        
        # Apply mild Gaussian blur to reduce noise
        enhanced_image = cv2.GaussianBlur(enhanced_image, (3, 3), 0)
        
        # Now process with face mesh
        results = face_mesh.process(enhanced_image)
    except Exception as e:
        print(f"❌ Face mesh processing error: {str(e)}")
        print("🔄 Attempting to reinitialize face mesh")
        reinitialize_face_mesh()
        # Try one more time with original image
        try:
            results = face_mesh.process(cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR))
        except Exception as retry_error:
            print(f"❌ Face mesh failed even after reinitialization: {str(retry_error)}")
            results = None

    # Extract landmarks if face was detected
    landmarks = []
    if results and results.multi_face_landmarks:
        for lm in results.multi_face_landmarks[0].landmark:
            landmarks.extend([round(lm.x, 6), round(lm.y, 6)])
        print("✅ Face landmarks detected successfully")
    else:
        print("⚠️ No face detected in image")
        # Return zero landmarks with a small random jitter to prevent model from
        # seeing the exact same feature vector repeatedly which could confuse it
        landmarks = [np.random.uniform(-0.001, 0.001) for _ in range(LANDMARK_FEATURES)]
        
    return torch.tensor(landmarks, dtype=torch.float32), landmarks

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    # Set timeout for this request
    import asyncio
    request_timeout = 10.0  # 10 seconds timeout
    try:
        # Track start time for performance monitoring
        start_time = datetime.now()
        
        # Read image file with retry logic
        try:
            contents = await file.read()
            # Check if we have valid content
            if not contents or len(contents) < 100:  # Arbitrary small size check
                print("⚠️ Received empty or very small image data")
                return {"error": "Empty or incomplete image data received", "size": len(contents) if contents else 0}
            
            try:
                image = Image.open(io.BytesIO(contents)).convert("RGB")
                
                # Verify image dimensions are reasonable
                if image.width < 10 or image.height < 10:
                    print(f"⚠️ Image too small: {image.width}x{image.height}")
                    return {"error": f"Image dimensions too small: {image.width}x{image.height}"}
            except Exception as img_error:
                print(f"❌ Error processing image data: {str(img_error)}")
                return {"error": "Invalid image format", "details": str(img_error)}
        except Exception as e:
            print(f"❌ Error reading image: {str(e)}")
            return {"error": "Failed to read image", "details": str(e)}
        
        # Convert to tensor
        try:
            image_tensor = transform(image).unsqueeze(0).to(device)
        except Exception as e:
            print(f"❌ Error transforming image: {str(e)}")
            return {"error": "Failed to transform image", "details": str(e)}
        
        # Extract landmarks
        try:
            landmarks_tensor, landmarks_list = extract_landmarks(image_tensor.squeeze(0))
            landmarks_tensor = landmarks_tensor.unsqueeze(0).to(device)
        except Exception as e:
            print(f"❌ Error extracting landmarks: {str(e)}")
            landmarks_tensor = torch.zeros((1, LANDMARK_FEATURES), device=device)
            landmarks_list = [0.0] * LANDMARK_FEATURES
            print("⚠️ Using zero landmarks as fallback")
        
        # Run prediction with timeout
        try:
            async def run_model_prediction():
                try:
                    with torch.no_grad():
                        outputs = model(image_tensor, landmarks_tensor)
                        probs = torch.softmax(outputs, dim=1)[0]
                        predicted_class = torch.argmax(probs).item()
                        
                    pred_label = CLASS_NAMES[predicted_class]
                    confidence = round(probs[predicted_class].item() * 100, 2)
                    prob_dict = {CLASS_NAMES[i]: round(p.item() * 100, 2) for i, p in enumerate(probs)}
                    return pred_label, confidence, prob_dict
                except Exception as inner_e:
                    print(f"❌ Error in model prediction: {str(inner_e)}")
                    return None, 0, {}
            
            # Try with timeout
            try:
                pred_label, confidence, prob_dict = await asyncio.wait_for(
                    run_model_prediction(), 
                    timeout=request_timeout
                )
                
                if not pred_label:
                    raise Exception("Model prediction failed or returned empty result")
                    
            except asyncio.TimeoutError:
                print(f"⏰ Prediction timed out after {request_timeout}s")
                return {"error": f"Prediction timed out after {request_timeout} seconds", "timeout": True}
                
        except Exception as e:
            print(f"❌ Error during prediction: {str(e)}")
            return {"error": "Failed during prediction", "details": str(e)}
        
        # Performance tracking
        process_time = (datetime.now() - start_time).total_seconds()
        
        # Save to MongoDB with timeout and retry
        timestamp = datetime.now().isoformat()
        try:
            record = {
                "timestamp": timestamp,
                "emotion": pred_label,
                "confidence": confidence,
                "landmarks": landmarks_list,  # Consider truncating this to save space
                "probs": prob_dict,
                "process_time_sec": process_time
            }
            
            # Use asyncio to handle DB operations with timeout
            async def save_to_db():
                try:
                    # Set write concern to 0 for fire-and-forget behavior
                    # This prioritizes API responsiveness over DB consistency
                    result = collection.insert_one(record, write_concern={"w": 0})
                    return True
                except Exception as db_error:
                    print(f"❌ MongoDB write error: {str(db_error)}")
                    return False
            
            # Try with timeout - if it takes too long, continue without waiting
            try:
                db_result = await asyncio.wait_for(save_to_db(), timeout=1.0)
                if not db_result:
                    print("⚠️ MongoDB write may have failed but continuing")
            except asyncio.TimeoutError:
                print("⚠️ MongoDB write timed out but continuing")
        except Exception as e:
            print(f"❌ Error preparing MongoDB record: {str(e)}")
        
        # Update tracking variables
        global last_prediction_time, prediction_count
        last_prediction_time = datetime.now()
        prediction_count += 1
        
        # Print emotion prediction to console for monitoring
        print(f"🔮 Emotion Predicted: {pred_label} ({confidence}%) at {timestamp} [#{prediction_count}]")
        print(f"🧠 Probabilities: {', '.join([f'{emotion}: {prob}%' for emotion, prob in prob_dict.items()])}")
        print(f"⏱️ Process time: {process_time:.3f} seconds")
        
        # Clear PyTorch cache periodically to prevent memory leaks
        if process_time > 0.5:  # If processing is slow, might indicate memory pressure
            print("🧹 Clearing PyTorch cache")
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
            
        # Reinitialize face_mesh periodically to prevent degradation
        if prediction_count % 100 == 0:
            print(f"🔄 Reinitializing face_mesh after {prediction_count} predictions")
            reinitialize_face_mesh()
            
        return {
            "prediction": pred_label,
            "confidence": confidence,
            "probabilities": prob_dict,
            "landmarks": len(landmarks_list),  # Just return count to reduce payload size
            "process_time_sec": process_time
        }
    except Exception as e:
        print(f"❌ Unexpected error in prediction endpoint: {str(e)}")
        return {"error": "Unexpected error occurred", "details": str(e)}

@app.get("/recent_emotions/")
async def get_recent_emotions(limit: int = 10):
    """Get the most recent emotion predictions"""
    cursor = collection.find({}, {"landmarks": 0}).sort("timestamp", -1).limit(limit)
    recent_emotions = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
        recent_emotions.append(doc)
    return {"recent_emotions": recent_emotions}

@app.get("/health/")
async def health_check():
    """Health check endpoint that also reinitializes resources if needed"""
    global last_prediction_time, prediction_count, model, face_mesh
    
    # Check if system is responsive
    status = {
        "status": "healthy",
        "device": str(device),
        "model_loaded": True,
        "face_mesh_initialized": face_mesh is not None,
        "last_prediction": last_prediction_time.isoformat(),
        "total_predictions": prediction_count,
        "time_since_last_prediction_sec": (datetime.now() - last_prediction_time).total_seconds(),
        "mongodb_connected": True,
        "version": "1.0.1"
    }
    
    # Check if prediction hasn't happened in a while
    if (datetime.now() - last_prediction_time).total_seconds() > 300:  # 5 minutes
        print("⚠️ No predictions in 5 minutes, reinitializing resources")
        status["status"] = "reinitialized"
        
        # Reinitialize face mesh
        status["face_mesh_reinitialized"] = reinitialize_face_mesh()
        
        # Clear PyTorch cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            status["torch_cache_cleared"] = True
    
    # Check MongoDB connection
    try:
        db.command("ping")
    except Exception as e:
        status["mongodb_connected"] = False
        status["mongodb_error"] = str(e)
        status["status"] = "degraded"
    
    return status

# Background task to periodically reinitialize resources
@app.on_event("startup")
async def startup_event():
    import asyncio
    
    async def periodic_reinit():
        while True:
            await asyncio.sleep(1800)  # Every 30 minutes
            print("🔄 Performing scheduled resource reinitialization")
            reinitialize_face_mesh()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
    
    # Start the background task
    asyncio.create_task(periodic_reinit())

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Emotion Detection API Server")
    print(f"💻 Using device: {device}")
    print(f"📊 Model loaded: {'models/best_model_5class.pth'}")
    print(f"🔍 Available emotions: {', '.join(CLASS_NAMES)}")
    uvicorn.run(app, host="0.0.0.0", port=8001)
