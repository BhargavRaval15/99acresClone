const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('profileImage').optional().trim()
];

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('properties', 'title price location images')
      .populate('favorites', 'title price location images');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', protect, updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Get user's properties
router.get('/properties', protect, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id })
      .sort('-createdAt')
      .populate('owner', 'name email phone');

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    });
  }
});

// Get user's favorites
router.get('/favorites', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favorites')
      .select('favorites');

    res.json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
});

// Add property to favorites
router.post('/favorites/:propertyId', protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const user = await User.findById(req.user.id);

    if (user.favorites.includes(req.params.propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Property already in favorites'
      });
    }

    user.favorites.push(req.params.propertyId);
    await user.save();

    res.json({
      success: true,
      message: 'Property added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
});

// Remove property from favorites
router.delete('/favorites/:propertyId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.favorites.includes(req.params.propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Property not in favorites'
      });
    }

    user.favorites = user.favorites.filter(
      id => id.toString() !== req.params.propertyId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Property removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
});

// Save search
router.post('/saved-searches', protect, async (req, res) => {
  try {
    const { query, filters } = req.body;

    const user = await User.findById(req.user.id);
    user.savedSearches.push({ query, filters });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Search saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving search',
      error: error.message
    });
  }
});

// Get saved searches
router.get('/saved-searches', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('savedSearches');

    res.json({
      success: true,
      data: user.savedSearches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching saved searches',
      error: error.message
    });
  }
});

// Delete saved search
router.delete('/saved-searches/:searchId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedSearches = user.savedSearches.filter(
      search => search._id.toString() !== req.params.searchId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Saved search deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting saved search',
      error: error.message
    });
  }
});

module.exports = router; 