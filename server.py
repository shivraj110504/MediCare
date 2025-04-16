from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from flask_mail import Mail, Message
import os
from dotenv import load_dotenv
import pymongo
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt
from werkzeug.utils import secure_filename
import datetime
from flask_bcrypt import Bcrypt, generate_password_hash, check_password_hash

# Load environment variables first (before any imports that might use them)
load_dotenv()

# Set API key explicitly
os.environ["TEAM_API_KEY"] = "78e21e24e1cd3e163f4e12450efedbb2e53e7e9dc1c9009be2d42ce0744d07a6"

# Now import from aixplain - using direct imports that should be compatible with v0.2.27
from aixplain.factories.agent_factory import AgentFactory
from aixplain.modules.agent.tool.model_tool import ModelTool
from aixplain.modules.agent.tool.pipeline_tool import PipelineTool
from aixplain.enums import Function, Supplier

app = Flask(__name__, static_folder='.')
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5000", "http://localhost:5000"], "supports_credentials": True}})
app.secret_key = 'super secret key'

# Configure mail settings
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'medicare162733@gmail.com'
app.config['MAIL_PASSWORD'] = 'ownfrflomzynmsnl'
app.config['MAIL_DEFAULT_SENDER'] = 'medicare162733@gmail.com'
app.config['MAIL_DEBUG'] = True

# Print mail configuration for debugging
print("Mail Configuration:")
print(f"MAIL_SERVER: {app.config['MAIL_SERVER']}")
print(f"MAIL_PORT: {app.config['MAIL_PORT']}")
print(f"MAIL_USERNAME: {app.config['MAIL_USERNAME']}")
print(f"MAIL_PASSWORD: {'*' * len(app.config['MAIL_PASSWORD'])}")  # Don't print actual password
print(f"MAIL_USE_SSL: {app.config['MAIL_USE_SSL']}")
print(f"MAIL_USE_TLS: {app.config['MAIL_USE_TLS']}")

# Initialize mail
mail = Mail(app)

# Connect to MongoDB Atlas
try:
    # Use the connection string from your request
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://tawareshivraj:Shivraj%4099902@medicare.kjcrhku.mongodb.net/')
    client = MongoClient(MONGODB_URI)
    
    # Specify the database name explicitly
    db = client.Medicare
    
    # Create collections if they don't exist
    collections_to_create = ['users', 'medicine_orders', 'bed_bookings', 'appointments', 'hospitals']
    existing_collections = db.list_collection_names()
    
    for collection_name in collections_to_create:
        if collection_name not in existing_collections:
            db.create_collection(collection_name)
            print(f"✅ Created collection: {collection_name}")
    
    # Initialize collections
    users_collection = db.users
    medicine_orders_collection = db.medicine_orders
    bed_bookings_collection = db.bed_bookings
    appointments_collection = db.appointments
    hospitals_collection = db.hospitals
    
    # Add sample data if collections are empty
    if hospitals_collection.count_documents({}) == 0:
        sample_hospitals = [
            {
                'name': 'City Hospital',
                'location': 'Downtown',
                'beds_available': 50,
                'specialties': ['Emergency Care', 'Surgery', 'ICU'],
                'contact': '+91 1234567890',
                'description': 'Leading emergency care facility with state-of-the-art surgical units'
            },
            {
                'name': 'Metro Medical Center',
                'location': 'Uptown',
                'beds_available': 75,
                'specialties': ['Cardiology', 'Neurology', 'Pediatrics'],
                'contact': '+91 2345678901',
                'description': 'Advanced medical care center with specialized treatment units'
            },
            {
                'name': 'Apollo Hospital',
                'location': 'North City',
                'beds_available': 100,
                'specialties': ['Oncology', 'Orthopedics', 'General Medicine'],
                'contact': '+91 3456789012',
                'description': 'Multi-specialty healthcare provider'
            },
            {
                'name': 'Care Plus Hospital',
                'location': 'East City',
                'beds_available': 60,
                'specialties': ['Cardiac Care', 'Critical Care', 'Diagnostics'],
                'contact': '+91 4567890123',
                'description': 'Premier cardiac and critical care institution'
            }
        ]
        hospitals_collection.insert_many(sample_hospitals)
        print("✅ Added sample hospitals data")
    
    # Test the connection
    client.admin.command('ping')
    print("✅ MongoDB Atlas Connected Successfully")
    
    # Print collection statistics
    for collection_name in collections_to_create:
        count = db[collection_name].count_documents({})
        print(f"📊 {collection_name}: {count} documents")
    
except Exception as e:
    print("❌ MongoDB Atlas Connection Error:", str(e))
    print("⚠️ Connection Details:")
    print(f"URI: {MONGODB_URI[:25]}...")
    raise e  # Re-raise the error to stop the server if DB connection fails

bcrypt = Bcrypt(app)

# User signup endpoint
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Check if user already exists
        if users_collection.find_one({"email": email}):
            return jsonify({"success": False, "message": "Email already registered"}), 409

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Create new user document
        new_user = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.datetime.utcnow()
        }

        # Insert into database
        result = users_collection.insert_one(new_user)

        if result.inserted_id:
            # Send welcome email
            send_welcome_email(name, email)
            
            # Set session
            session['user_id'] = str(result.inserted_id)
            session['email'] = email
            session['name'] = name

            return jsonify({
                "success": True,
                "message": "User registered successfully",
                "user": {
                    "id": str(result.inserted_id),
                    "name": name,
                    "email": email
                }
            })
        else:
            return jsonify({"success": False, "message": "Failed to create user"}), 500

    except Exception as e:
        print(f"❌ Signup Error: {str(e)}")
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500

# User login endpoint
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"success": False, "message": "Missing email or password"}), 400

        # Find user by email
        user = users_collection.find_one({"email": email})

        if user and bcrypt.check_password_hash(user['password'], password):
            # Set session
            session['user_id'] = str(user['_id'])
            session['email'] = user['email']
            session['name'] = user['name']

            return jsonify({
                "success": True,
                "message": "Login successful",
                "user": {
                    "id": str(user['_id']),
                    "name": user['name'],
                    "email": user['email']
                }
            })
        else:
            return jsonify({"success": False, "message": "Invalid email or password"}), 401

    except Exception as e:
        print(f"❌ Login Error: {str(e)}")
        return jsonify({"success": False, "message": f"Login failed: {str(e)}"}), 500

# Logout endpoint
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})

# Medicine delivery form submission endpoint
@app.route('/api/submit-medicine-order', methods=['POST'])
def submit_medicine_order():
    try:
        data = request.json
        required_fields = ['name', 'email', 'phone', 'medicines', 'address']
        
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Create order document
        order = {
            "name": data['name'],
            "email": data['email'],
            "phone": data['phone'],
            "medicines": data['medicines'],
            "address": data['address'],
            "prescription": data.get('prescription', None),
            "status": "pending",
            "created_at": datetime.datetime.utcnow()
        }

        # Insert into database
        result = medicine_orders_collection.insert_one(order)

        if result.inserted_id:
            # Send confirmation email
            send_order_confirmation()
            return jsonify({
                "success": True,
                "message": "Medicine order submitted successfully",
                "order_id": str(result.inserted_id)
            })
        else:
            return jsonify({"success": False, "message": "Failed to submit order"}), 500

    except Exception as e:
        print(f"❌ Medicine Order Error: {str(e)}")
        return jsonify({"success": False, "message": f"Order submission failed: {str(e)}"}), 500

# Hospital bed booking form submission endpoint
@app.route('/api/submit-bed-booking', methods=['POST'])
def submit_bed_booking():
    try:
        data = request.json
        required_fields = ['name', 'email', 'phone', 'hospital', 'admission_date', 'medical_condition']
        
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Create booking document
        booking = {
            "name": data['name'],
            "email": data['email'],
            "phone": data['phone'],
            "hospital": data['hospital'],
            "admission_date": data['admission_date'],
            "medical_condition": data['medical_condition'],
            "special_requirements": data.get('special_requirements', ''),
            "status": "pending",
            "created_at": datetime.datetime.utcnow()
        }

        # Insert into database
        result = bed_bookings_collection.insert_one(booking)

        if result.inserted_id:
            # Send confirmation email
            send_bed_confirmation()
            return jsonify({
                "success": True,
                "message": "Hospital bed booking submitted successfully",
                "booking_id": str(result.inserted_id)
            })
        else:
            return jsonify({"success": False, "message": "Failed to submit booking"}), 500

    except Exception as e:
        print(f"❌ Bed Booking Error: {str(e)}")
        return jsonify({"success": False, "message": f"Booking submission failed: {str(e)}"}), 500

# Doctor appointment booking form submission endpoint
@app.route('/api/submit-appointment', methods=['POST'])
def submit_appointment():
    try:
        data = request.json
        required_fields = ['name', 'email', 'phone', 'doctor', 'appointment_date', 'symptoms']
        
        if not all(field in data for field in required_fields):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Create appointment document
        appointment = {
            "name": data['name'],
            "email": data['email'],
            "phone": data['phone'],
            "doctor": data['doctor'],
            "appointment_date": data['appointment_date'],
            "symptoms": data['symptoms'],
            "additional_notes": data.get('additional_notes', ''),
            "status": "pending",
            "created_at": datetime.datetime.utcnow()
        }

        # Insert into database
        result = appointments_collection.insert_one(appointment)

        if result.inserted_id:
            # Send confirmation email
            send_appointment_confirmation()
            return jsonify({
                "success": True,
                "message": "Appointment booked successfully",
                "appointment_id": str(result.inserted_id)
            })
        else:
            return jsonify({"success": False, "message": "Failed to book appointment"}), 500

    except Exception as e:
        print(f"❌ Appointment Booking Error: {str(e)}")
        return jsonify({"success": False, "message": f"Appointment booking failed: {str(e)}"}), 500

# Configure upload folder for prescriptions
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Email sending function with error handling
def send_email(to, subject, body):
    try:
        print(f"📧 Attempting to send email to: {to}")
        print(f"📧 Using email credentials: {app.config['MAIL_USERNAME']}")
        
        msg = Message(
            subject=subject,
            recipients=[to],
            body=body,
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        
        mail.send(msg)
        print("📧 Email sent successfully")
        return {"success": True, "message": "Email sent successfully"}
    
    except Exception as error:
        print("❌ Email Error:", str(error))
        print(f"❌ Error type: {type(error).__name__}")
        print(f"❌ Error details: {str(error)}")
        
        # Log the email content for debugging
        print("\n==== EMAIL CONTENT (NOT SENT DUE TO ERROR) ====")
        print(f"To: {to}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print("===============================================\n")
        
        # Continue with the application flow even if email fails
        return {"success": False, "message": f"Email failed to send: {str(error)}"}

# Verify email configuration
with app.app_context():
    try:
        mail.connect()
        print("✅ Email Server is ready to send messages")
    except Exception as e:
        print("❌ Email Configuration Error:", e)
        print("✅ Application will continue to function without sending emails")

# Initialize the aiXplain chatbot agent
try:
    print(f"✅ Using aixplain with API key: {os.environ.get('TEAM_API_KEY')[:10]}...")
    
    # Create the same tools as in medicare_chatbot.py
    speech_synthesis_tool = ModelTool(
        function=Function.SPEECH_SYNTHESIS,
        supplier=Supplier.GOOGLE
    )

    ner_tool = ModelTool(
        function=Function.NAMED_ENTITY_RECOGNITION,
        supplier=Supplier.MICROSOFT
    )

    pipeline_tool = PipelineTool(
        description="MediCare",
        pipeline="67e937673a6b31775d71e2ff"
    )
    
    # Instead of creating a new agent, get the existing one from medicare_chatbot.py
    # This is safer if the specific version has API differences
    agent = AgentFactory.get("67e938b78fe46af271adf2fc")
    
    print("✅ aiXplain Medicare Chatbot Connected Successfully")
    print(f"✅ Agent ID: {agent.id}")
    
    # Store user sessions
    user_chat_sessions = {}
    
except Exception as e:
    print("❌ aiXplain Medicare Chatbot Error:", e)
    print("⚠️ Application will continue but AI Doctor functionality may be limited")
    agent = None

# Serve static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# API Routes for sending emails
@app.route('/api/send-email', methods=['POST'])
def api_send_email():
    data = request.json
    to = data.get('to')
    subject = data.get('subject')
    body = data.get('body')
    
    if not all([to, subject, body]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    result = send_email(to, subject, body)
    return jsonify(result)

# Example: Send appointment confirmation email
@app.route('/api/send-appointment-confirmation', methods=['POST'])
def send_appointment_confirmation():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    doctor = data.get('doctor')
    date = data.get('date')
    time = data.get('time')
    
    if not all([email, name, doctor, date, time]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    subject = "Appointment Confirmation - MediCare"
    body = f"""
Dear {name},

Your appointment with Dr. {doctor} has been confirmed for {date} at {time}.

Please arrive 15 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Appointment Details:
- Doctor: Dr. {doctor}
- Date: {date}
- Time: {time}
- Patient: {name}

Thank you for choosing MediCare!

Best regards,
The MediCare Team
medicare162733@gmail.com
    """
    
    result = send_email(email, subject, body)
    return jsonify(result)

# Example: Send medicine order confirmation
@app.route('/api/send-order-confirmation', methods=['POST'])
def send_order_confirmation():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    order_id = data.get('orderId')
    
    if not all([email, name, order_id]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    subject = "Order Confirmation - MediCare"
    body = f"""
Dear {name},

Thank you for your order with MediCare!

Your medicine order (Order ID: {order_id}) has been received and is being processed. You will receive another email when your order has been shipped.

Order Details:
- Order ID: {order_id}
- Customer: {name}
- Order Date: {datetime.datetime.now().strftime('%Y-%m-%d')}
- Status: Processing

If you have any questions about your order, please contact our customer service team.

Thank you for choosing MediCare!

Best regards,
The MediCare Team
medicare162733@gmail.com
    """
    
    result = send_email(email, subject, body)
    return jsonify(result)

# Example: Send bed booking confirmation
@app.route('/api/send-bed-confirmation', methods=['POST'])
def send_bed_confirmation():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    hospital = data.get('hospital')
    date = data.get('date')
    
    if not all([email, name, hospital, date]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    subject = "Hospital Bed Booking Confirmation - MediCare"
    body = f"""
Dear {name},

Your hospital bed booking has been confirmed.

Booking Details:
- Hospital: {hospital}
- Admission Date: {date}
- Patient: {name}

Please arrive at the hospital reception desk on the scheduled date with your ID proof and any relevant medical records.

If you need to reschedule or cancel your booking, please contact us at least 48 hours in advance.

Thank you for choosing MediCare!

Best regards,
The MediCare Team
medicare162733@gmail.com
    """
    
    result = send_email(email, subject, body)
    return jsonify(result)

# API endpoint for booking appointments
@app.route('/book-appointment', methods=['POST'])
def book_appointment():
    try:
        data = request.json
        
        # Extract data from request
        name = data.get('name')
        email = data.get('email')
        contact = data.get('contact')
        doctor = data.get('doctor')
        date = data.get('date')
        time = data.get('time')
        
        # Validate required fields
        if not all([name, email, contact, doctor, date, time]):
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        # Generate appointment ID
        appointment_id = str(ObjectId())
        
        # Create appointment document
        appointment = {
            "_id": appointment_id,
            "name": name,
            "email": email,
            "contact": contact,
            "doctor": doctor,
            "date": date,
            "time": time,
            "status": "confirmed",
            "created_at": datetime.datetime.now()
        }
        
        # Save to database
        try:
            result = appointments_collection.insert_one(appointment)
            print(f"✅ Appointment saved with ID: {result.inserted_id}")
        except Exception as db_error:
            print(f"❌ Database Error: {str(db_error)}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
        
        # Send confirmation email
        email_result = send_email_for_appointment(appointment)
        
        return jsonify({
            "success": True,
            "message": "Appointment booked successfully",
            "appointment_id": str(appointment_id),
            "email_status": email_result
        })
        
    except Exception as e:
        print(f"❌ Error booking appointment: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

# API endpoint for booking hospital beds
@app.route('/api/bed-bookings', methods=['POST'])
def book_bed():
    try:
        data = request.json
        
        # Extract data from request
        patient_name = data.get('patientName')
        patient_email = data.get('patientEmail')
        patient_contact = data.get('patientContact')
        hospital_name = data.get('hospitalName')
        ward_type = data.get('wardType')
        admission_date = data.get('admissionDate')
        fees_per_day = data.get('feesPerDay')
        
        # Validate required fields
        if not all([patient_name, patient_email, patient_contact, hospital_name, ward_type, admission_date]):
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        # Generate booking ID
        booking_id = data.get('id') or f"BED{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create bed booking document
        bed_booking = {
            "_id": booking_id,
            "patientName": patient_name,
            "patientEmail": patient_email,
            "patientContact": patient_contact,
            "hospitalName": hospital_name,
            "wardType": ward_type,
            "admissionDate": admission_date,
            "feesPerDay": fees_per_day,
            "status": "confirmed",
            "bookingDate": datetime.datetime.now()
        }
        
        # Save to database
        try:
            result = bed_bookings_collection.insert_one(bed_booking)
            print(f"✅ Bed booking saved with ID: {result.inserted_id}")
        except Exception as db_error:
            print(f"❌ Database Error: {str(db_error)}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
        
        # Send confirmation email
        email_result = send_email_for_bed_booking(bed_booking)
        
        return jsonify({
            "success": True,
            "message": "Bed booked successfully",
            "id": booking_id,
            "email_status": email_result
        })
        
    except Exception as e:
        print(f"❌ Error booking bed: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

# API endpoint for ordering medicines
@app.route('/order-medicine', methods=['POST'])
def order_medicine():
    try:
        data = request.json
        
        # Extract data from request
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        address = data.get('address')
        medicines = data.get('medicines', [])
        payment_method = data.get('paymentMethod')
        
        # Validate required fields
        if not all([name, email, phone, address, medicines, payment_method]):
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        # Generate order ID
        order_id = f"ORD{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create order document
        order = {
            "_id": order_id,
            "name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "medicines": medicines,
            "paymentMethod": payment_method,
            "status": "processing",
            "orderDate": datetime.datetime.now()
        }
        
        # Save to database
        try:
            result = medicine_orders_collection.insert_one(order)
            print(f"✅ Medicine order saved with ID: {result.inserted_id}")
        except Exception as db_error:
            print(f"❌ Database Error: {str(db_error)}")
            return jsonify({"success": False, "message": f"Database error: {str(db_error)}"}), 500
        
        # Send confirmation email
        email_result = send_email_for_medicine_order(order)
        
        return jsonify({
            "success": True,
            "message": "Order placed successfully",
            "order_id": order_id,
            "email_status": email_result
        })
        
    except Exception as e:
        print(f"❌ Error placing order: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

# Helper functions to send emails for different services
def send_email_for_appointment(appointment):
    """Send appointment confirmation email using appointment data from database"""
    try:
        name = appointment.get('name')
        email = appointment.get('email')
        doctor = appointment.get('doctor')
        date = appointment.get('date')
        time = appointment.get('time')
        
        subject = "Appointment Confirmation - MediCare"
        body = f"""
Dear {name},

Your appointment with Dr. {doctor} has been confirmed for {date} at {time}.

Please arrive 15 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Appointment Details:
- Doctor: Dr. {doctor}
- Date: {date}
- Time: {time}
- Patient: {name}

Thank you for choosing MediCare!

Best regards,
The MediCare Team
medicare162733@gmail.com
        """
        
        return send_email(email, subject, body)
    except Exception as e:
        print(f"❌ Error sending appointment email: {str(e)}")
        return {"success": False, "message": f"Failed to send email: {str(e)}"}

def send_email_for_bed_booking(booking):
    """Send bed booking confirmation email using booking data from database"""
    try:
        name = booking.get('patientName')
        email = booking.get('patientEmail')
        hospital = booking.get('hospitalName')
        date = booking.get('admissionDate')
        ward_type = booking.get('wardType')
        
        subject = "Hospital Bed Booking Confirmation - MediCare"
        body = f"""
Dear {name},

Your hospital bed booking has been confirmed.

Booking Details:
- Hospital: {hospital}
- Admission Date: {date}
- Ward Type: {ward_type}
- Patient: {name}

Please arrive at the hospital reception desk on the scheduled date with your ID proof and any relevant medical records.

If you need to reschedule or cancel your booking, please contact us at least 48 hours in advance.

Thank you for choosing MediCare!

Best regards,
The MediCare Team
medicare162733@gmail.com
        """
        
        return send_email(email, subject, body)
    except Exception as e:
        print(f"❌ Error sending bed booking email: {str(e)}")
        return {"success": False, "message": f"Failed to send email: {str(e)}"}

def send_email_for_medicine_order(order):
    """Send medicine order confirmation email using order data from database"""
    try:
        name = order.get('name')
        email = order.get('email')
        order_id = order.get('_id')
        medicines = order.get('medicines', [])
        
        # Format medicines list for email
        medicine_list = "\n".join([f"- {med.get('name')} (Qty: {med.get('quantity')})" for med in medicines])
        
        subject = "Order Confirmation - MediCare"
        body = f"""
Dear {name},

Thank you for your order with MediCare!

Your medicine order (Order ID: {order_id}) has been received and is being processed. You will receive another email when your order has been shipped.

Order Details:
- Order ID: {order_id}
- Customer: {name}
- Order Date: {datetime.datetime.now().strftime('%Y-%m-%d')}
- Status: Processing

Items Ordered:
{medicine_list}

If you have any questions about your order, please contact our customer service team.

Thank you for choosing MediCare!

Best regards,
The MediCare Team
medicare162733@gmail.com
        """
        
        return send_email(email, subject, body)
    except Exception as e:
        print(f"❌ Error sending order email: {str(e)}")
        return {"success": False, "message": f"Failed to send email: {str(e)}"}

# AI Doctor endpoint using aiXplain
@app.route('/api/ai-doctor', methods=['POST'])
def ai_doctor():
    try:
        data = request.json
        user_input = data.get('message')
        user_id = data.get('userId')
        
        if not user_input or not user_id:
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        # Check if agent is available
        if agent is None:
            print("⚠️ AI Doctor request received but agent is unavailable")
            return jsonify({
                "success": False, 
                "message": "AI Doctor service is currently unavailable. Please try again later."
            }), 503
        
        print(f"🤖 Processing AI Doctor request for user {user_id}")
        
        # Get or create session ID for this user
        session_id = user_chat_sessions.get(user_id)
        
        if session_id:
            # Continue existing conversation
            print(f"🔄 Continuing conversation with session {session_id}")
            response = agent.run(user_input, session_id=session_id)
        else:
            # Start new conversation
            print(f"🆕 Starting new conversation for user {user_id}")
            response = agent.run(user_input)
            # Store the session ID for future messages
            if "data" in response and "session_id" in response["data"]:
                user_chat_sessions[user_id] = response["data"]["session_id"]
                print(f"✅ Created new session {response['data']['session_id']} for user {user_id}")
            else:
                print("⚠️ No session ID returned from agent")
        
        # Extract the output text from the response
        if "data" in response and "output" in response["data"]:
            output_text = response["data"]["output"]
        else:
            print("⚠️ Unexpected response format from agent:", response)
            output_text = "I'm sorry, I couldn't process your request properly. Please try again."
        
        # Log the interaction
        print(f"User {user_id} asked: {user_input}")
        print(f"AI response: {output_text[:100]}...")  # Log first 100 chars of response
        
        return jsonify({
            "success": True,
            "message": output_text
        })
        
    except Exception as e:
        print(f"❌ AI Doctor Error: {str(e)}")
        return jsonify({
            "success": False, 
            "message": "I'm sorry, I encountered an error while processing your request. Please try again later."
        }), 500

# Helper function to send welcome email
def send_welcome_email(name, email):
    """Send welcome email to newly registered users"""
    try:
        subject = "Welcome to MediCare!"
        body = f"""
Dear {name},

Welcome to MediCare! We're thrilled to have you join our healthcare platform.

With your new account, you can:
- Book appointments with top doctors
- Order medicines online
- Book hospital beds
- Access our AI doctor for quick consultations

If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you for choosing MediCare!

Best regards,
The MediCare Team
medicare162733@gmail.com
        """
        
        return send_email(email, subject, body)
    except Exception as e:
        print(f"❌ Error sending welcome email: {str(e)}")
        return {"success": False, "message": f"Failed to send welcome email: {str(e)}"}

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)