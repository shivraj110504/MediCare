from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, PyMongoError, DuplicateKeyError
from bson import json_util
import json
import sys
import logging
import colorama
from colorama import Fore, Back, Style
import os
import time

# Initialize colorama for Windows
colorama.init()

class ColoredLogger:
    @staticmethod
    def success(message):
        print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")

    @staticmethod
    def error(message):
        print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")

    @staticmethod
    def info(message):
        print(f"{Fore.CYAN}ℹ️ {message}{Style.RESET_ALL}")

    @staticmethod
    def warning(message):
        print(f"{Fore.YELLOW}⚠️ {message}{Style.RESET_ALL}")

    @staticmethod
    def notification(message):
        print(f"{Fore.MAGENTA}🔔 {message}{Style.RESET_ALL}")

logger = ColoredLogger()

app = Flask(__name__)
CORS(app)

# MongoDB connection configuration
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'medicare'  # Changed to lowercase 'medicare'
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

def wait_for_mongodb():
    """Wait for MongoDB to become available"""
    for attempt in range(MAX_RETRIES):
        try:
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            client.server_info()
            return client
        except ServerSelectionTimeoutError:
            if attempt < MAX_RETRIES - 1:
                logger.warning(f"MongoDB not available, retrying in {RETRY_DELAY} seconds... (Attempt {attempt + 1}/{MAX_RETRIES})")
                time.sleep(RETRY_DELAY)
            else:
                logger.error("Failed to connect to MongoDB after multiple attempts")
                raise
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            raise

def get_db():
    """Get database connection with retry logic"""
    try:
        client = wait_for_mongodb()
        db = client[DB_NAME]
        logger.success(f"Connected to MongoDB database: {DB_NAME}")
        return db
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

# Print startup banner
print("\n" + "=" * 46)
logger.info("🚀 Starting MediCare Backend Server")
logger.info(f"🔌 MongoDB URI: {MONGO_URI}")
logger.info(f"📁 Database: {DB_NAME}")
print("=" * 46 + "\n")

# Initialize database connection
try:
    db = get_db()
    users_collection = db['users']
    medicine_orders_collection = db['medicine_orders']
    hospital_bookings_collection = db['hospital_bookings']
    appointments_collection = db['appointments']
    
    # Ensure indexes for better performance
    users_collection.create_index("email", unique=True)
    
    logger.info("📑 Collections initialized:")
    logger.info("   • users (with email index)")
    logger.info("   • medicine_orders")
    logger.info("   • hospital_bookings")
    logger.info("   • appointments")
except Exception as e:
    logger.error(f"Failed to initialize collections: {e}")
    sys.exit(1)

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'firstName', 'lastName', 'phone']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: ' + ', '.join([field for field in required_fields if field not in data])
            }), 400
        
        # Validate field types
        if not isinstance(data['username'], str) or not isinstance(data['email'], str) or not isinstance(data['password'], str) or not isinstance(data['firstName'], str) or not isinstance(data['lastName'], str) or not isinstance(data['phone'], str):
            return jsonify({
                'success': False,
                'message': 'Invalid field types'
            }), 400
        
        # Add timestamp
        data['created_at'] = time.time()
        
        # Store in MongoDB
        try:
            users_collection.insert_one(data)
            logger.notification(f"New user registered: {data['username']}")
            return jsonify({
                'success': True,
                'message': 'User registered successfully'
            }), 201
            
        except DuplicateKeyError:
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 409
            
        except PyMongoError as e:
            logger.error(f"Database error during signup: {e}")
            return jsonify({
                'success': False,
                'message': 'Database error occurred'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in signup route: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error occurred'
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
            
        # Find user by email
        user = users_collection.find_one({'email': data['email']})
        
        if user and user['password'] == data['password']:  # In production, use proper password hashing
            # Convert ObjectId to string for JSON serialization
            user['_id'] = str(user['_id'])
            logger.notification(f"User logged in: {user['username']}")
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': user
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
            
    except Exception as e:
        logger.error(f"Error in login route: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error occurred'
        }), 500

@app.route('/api/appointments', methods=['POST'])
def book_appointment():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['patientName', 'email', 'phone', 'date', 'time', 'department', 'doctor']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: ' + ', '.join([field for field in required_fields if field not in data])
            }), 400
        
        # Add timestamp
        data['created_at'] = time.time()
        data['status'] = 'pending'  # pending, confirmed, cancelled
        
        # Store in MongoDB
        try:
            result = appointments_collection.insert_one(data)
            logger.notification(f"New appointment booked for: {data['patientName']}")
            return jsonify({
                'success': True,
                'message': 'Appointment booked successfully',
                'appointmentId': str(result.inserted_id)
            }), 201
            
        except PyMongoError as e:
            logger.error(f"Database error during appointment booking: {e}")
            return jsonify({
                'success': False,
                'message': 'Database error occurred'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in appointment route: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error occurred'
        }), 500

@app.route('/api/hospital-beds', methods=['POST'])
def book_hospital_bed():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['patientName', 'email', 'phone', 'admissionDate', 'roomType', 'emergencyContact']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: ' + ', '.join([field for field in required_fields if field not in data])
            }), 400
        
        # Add timestamp and status
        data['created_at'] = time.time()
        data['status'] = 'pending'  # pending, confirmed, cancelled
        
        # Store in MongoDB
        try:
            result = hospital_bookings_collection.insert_one(data)
            logger.notification(f"New hospital bed booked for: {data['patientName']}")
            return jsonify({
                'success': True,
                'message': 'Hospital bed booked successfully',
                'bookingId': str(result.inserted_id)
            }), 201
            
        except PyMongoError as e:
            logger.error(f"Database error during hospital bed booking: {e}")
            return jsonify({
                'success': False,
                'message': 'Database error occurred'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in hospital bed booking route: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error occurred'
        }), 500

@app.route('/api/medicine-orders', methods=['POST'])
def order_medicine():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['customerName', 'email', 'phone', 'medicines', 'deliveryAddress']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: ' + ', '.join([field for field in required_fields if field not in data])
            }), 400
        
        # Validate medicines list
        if not isinstance(data['medicines'], list) or not data['medicines']:
            return jsonify({
                'success': False,
                'message': 'Please add at least one medicine to your order'
            }), 400
        
        # Add timestamp and status
        data['created_at'] = time.time()
        data['status'] = 'pending'  # pending, confirmed, delivered, cancelled
        
        # Store in MongoDB
        try:
            result = medicine_orders_collection.insert_one(data)
            logger.notification(f"New medicine order from: {data['customerName']}")
            return jsonify({
                'success': True,
                'message': 'Medicine order placed successfully',
                'orderId': str(result.inserted_id)
            }), 201
            
        except PyMongoError as e:
            logger.error(f"Database error during medicine order: {e}")
            return jsonify({
                'success': False,
                'message': 'Database error occurred'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in medicine order route: {e}")
        return jsonify({
            'success': False,
            'message': 'Server error occurred'
        }), 500

@app.route('/api/test-db', methods=['GET'])
def test_db():
    """Test database connection"""
    try:
        # Ping the database
        db.command('ping')
        return jsonify({
            'success': True,
            'message': 'Database connection successful'
        })
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return jsonify({
            'success': False,
            'message': 'Database connection failed'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
