import mongoose from 'mongoose';

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    console.log('MongoDB connection successful!');
    
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    
    return { success: true };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return { success: false, error: error.message };
  }
}

export default testConnection; 