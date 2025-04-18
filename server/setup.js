const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connection successful');
    console.log('Connection URL:', process.env.MONGODB_URI);
    
    // Test creating a collection
    const testCollection = mongoose.connection.collection('test');
    await testCollection.insertOne({ test: 'test' });
    console.log('✅ Database write test successful');
    
    await testCollection.deleteOne({ test: 'test' });
    console.log('✅ Database cleanup successful');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\nPossible solutions:');
      console.log('1. Make sure MongoDB is installed');
      console.log('2. Ensure MongoDB service is running');
      console.log('3. Check if the MongoDB URI in .env is correct');
    }
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testConnection(); 