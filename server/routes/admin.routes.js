const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/auth');

// Apply protection and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort('-createdAt');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: page * 1,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Update user role
router.put('/users/:userId/role', [
  body('role').isIn(['user', 'agent', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.body.role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
});

// Get all properties with pending status
router.get('/properties/pending', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const properties = await Property.find({ status: 'pending' })
      .populate('owner', 'name email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort('-createdAt');

    const total = await Property.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: page * 1,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending properties',
      error: error.message
    });
  }
});

// Update property status
router.put('/properties/:propertyId/status', [
  body('status').isIn(['active', 'pending', 'sold', 'rented']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.propertyId,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating property status',
      error: error.message
    });
  }
});

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProperties,
      pendingProperties,
      activeProperties,
      totalAgents,
      totalInquiries
    ] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Property.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'agent' }),
      Property.aggregate([
        { $unwind: '$inquiries' },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        pendingProperties,
        activeProperties,
        totalAgents,
        totalInquiries: totalInquiries[0]?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const recentProperties = await Property.find()
      .sort('-createdAt')
      .limit(5)
      .populate('owner', 'name email');

    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email role createdAt');

    const recentInquiries = await Property.aggregate([
      { $unwind: '$inquiries' },
      { $sort: { 'inquiries.createdAt': -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'inquiries.user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          title: 1,
          'inquiries.message': 1,
          'inquiries.createdAt': 1,
          'user.name': 1,
          'user.email': 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        recentProperties,
        recentUsers,
        recentInquiries
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
});

module.exports = router; 