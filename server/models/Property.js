const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the property'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['Apartment', 'House', 'Villa', 'Plot', 'Commercial', 'Farmhouse']
  },
  listingType: {
    type: String,
    required: true,
    enum: ['Sale', 'Rent']
  },
  price: {
    type: Number,
    required: [true, 'Please provide the price']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  area: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['sq ft', 'sq m', 'sq yd', 'acre'],
      default: 'sq ft'
    }
  },
  bedrooms: {
    type: Number,
    min: 0
  },
  bathrooms: {
    type: Number,
    min: 0
  },
  parking: {
    type: Number,
    min: 0
  },
  furnishing: {
    type: String,
    enum: ['Furnished', 'Semi-Furnished', 'Unfurnished']
  },
  floor: {
    type: Number
  },
  totalFloors: {
    type: Number
  },
  age: {
    type: Number
  },
  facing: {
    type: String,
    enum: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West']
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  amenities: [{
    type: String,
    enum: [
      'Parking',
      'Gym',
      'Swimming Pool',
      'Security',
      'Power Backup',
      'Lift',
      'Garden',
      'Club House',
      'Park',
      'School',
      'Hospital',
      'Shopping Mall',
      'Metro Station',
      'Bus Stop'
    ]
  }],
  images: [{
    url: String,
    public_id: String
  }],
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'sold', 'rented'],
    default: 'pending'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for location-based queries
propertySchema.index({ 'location.coordinates': '2dsphere' });

// Index for search functionality
propertySchema.index({
  title: 'text',
  description: 'text',
  'location.address': 'text',
  'location.city': 'text',
  'location.state': 'text'
});

module.exports = mongoose.model('Property', propertySchema); 