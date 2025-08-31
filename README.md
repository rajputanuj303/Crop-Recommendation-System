# 🌾 Crop Recommendation System

A comprehensive MERN stack application with Python ML service for intelligent crop recommendations based on soil and climate conditions.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js API    │    │  Python ML     │
│   (Port 3000)   │◄──►│  (Port 5000)    │◄──►│  Service       │
│                 │    │                 │    │  (Port 5001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   (Port 27017)  │
                       └─────────────────┘
```

## ✨ Features

- **AI-Powered Recommendations**: Machine learning-based crop suggestions
- **Real-time Analysis**: Instant results based on current soil conditions
- **Comprehensive Input**: NPK levels, temperature, humidity, pH, rainfall
- **Admin Dashboard**: User management and recommendation history
- **Responsive Design**: Modern UI with Tailwind CSS
- **Secure API**: JWT authentication and rate limiting
- **Docker Support**: Easy deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB (v6.0 or higher)
- Docker & Docker Compose (optional)

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crop-recommendation-system
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - ML Service: http://localhost:5001
   - MongoDB: localhost:27017

### Option 2: Manual Setup

#### 1. Backend Setup

```bash
cd server
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

#### 2. ML Service Setup

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

#### 4. MongoDB Setup

```bash
# Start MongoDB service
mongod --dbpath /path/to/data/db
```

## 📁 Project Structure

```
crop-recommendation-system/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── api.js         # API service functions
│   │   └── App.jsx        # Main application component
│   ├── tailwind.config.js # Tailwind CSS configuration
│   └── package.json
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API route definitions
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Authentication middleware
│   │   ├── utils/         # Utility functions
│   │   ├── app.js         # Express application
│   │   └── server.js      # Server entry point
│   └── package.json
├── ml-service/             # Python ML Microservice
│   ├── model/             # ML model storage
│   ├── app.py             # Flask application
│   ├── utils.py           # ML utility functions
│   └── requirements.txt   # Python dependencies
├── docker-compose.yml      # Docker services configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://admin:password123@localhost:27017/crop-recommendation
JWT_SECRET=your-super-secret-jwt-key
ML_SERVICE_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
```

#### ML Service (.env)
```env
PORT=5001
DEBUG=False
MODEL_PATH=./model/crop_model.pkl
```

## 📊 API Endpoints

### Public Endpoints
- `POST /api/crops/recommend` - Get crop recommendation
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication

### Protected Endpoints
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/crops/history` - Get recommendation history
- `GET /api/crops/:id` - Get specific recommendation

### Admin Endpoints
- `GET /api/auth/users` - Get all users
- `DELETE /api/auth/users/:id` - Delete user
- `GET /api/crops/admin/all` - Get all recommendations

## 🤖 ML Model Integration

### Current Setup
- The system expects a trained ML model at `ml-service/model/crop_model.pkl`
- The model should accept 7 features: N, P, K, temperature, humidity, pH, rainfall
- Output should be a crop recommendation

### Adding Your Model
1. Place your trained model in `ml-service/model/crop_model.pkl`
2. Ensure it follows the expected input/output format
3. Restart the ML service

### Model Requirements
- **Input Features**: 7 numerical values (NPK, temperature, humidity, pH, rainfall)
- **Output**: Crop class prediction
- **Format**: scikit-learn compatible (pickle format)

## 🎨 Frontend Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Form Validation**: Client-side input validation
- **Real-time Updates**: Dynamic UI updates based on API responses
- **Admin Dashboard**: Comprehensive management interface
- **Error Handling**: User-friendly error messages

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Rate Limiting**: API request throttling
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Server-side data validation
- **Helmet Security**: HTTP security headers

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

### ML Service Testing
```bash
cd ml-service
python -m pytest tests/
```

## 📈 Performance

- **Response Time**: < 200ms for crop recommendations
- **Concurrent Users**: Supports 100+ concurrent requests
- **Database**: Optimized MongoDB queries with indexing
- **Caching**: Redis caching for frequently accessed data (optional)

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Enable HTTPS
4. Set up monitoring and logging
5. Configure backup strategies

### Cloud Deployment
- **AWS**: Use ECS/EKS with RDS for MongoDB
- **Azure**: Use Azure Container Instances
- **Google Cloud**: Use Cloud Run with Cloud SQL
- **Heroku**: Use Heroku containers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Documentation**: Check the wiki
- **Community**: Join our Discord server

## 🙏 Acknowledgments

- **Dataset**: Crop recommendation dataset from Kaggle
- **Icons**: Heroicons and Feather Icons
- **UI Framework**: Tailwind CSS
- **ML Framework**: scikit-learn

---

**Made with ❤️ for sustainable agriculture**
