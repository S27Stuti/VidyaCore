const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'vidyacore_super_secret_jwt_key_2026_modern_school_suite',
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, rollNo, className, section, subject, parentContact, address, designation } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role || 'teacher';

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      // Check if password matches existing user
      const isMatch = await existingUser.comparePassword(password);
      if (isMatch) {
        // Automatically sign them in and update profile details
        if (name) existingUser.name = name.trim();
        if (phone) existingUser.phone = phone.trim();
        if (className) existingUser.className = className.trim();
        if (subject) existingUser.subject = subject.trim();
        if (rollNo) existingUser.rollNo = rollNo.trim();
        if (parentContact) existingUser.parentContact = parentContact.trim();
        if (designation) existingUser.designation = designation.trim();
        existingUser.profileCompleted = true;
        await existingUser.save();

        const token = generateToken(existingUser);
        return res.json({
          success: true,
          message: 'Account already existed and password matched. Successfully signed in!',
          token,
          user: existingUser
        });
      } else {
        return res.status(400).json({
          success: false,
          alreadyRegistered: true,
          message: 'This email is already registered with another password. Please switch to the Sign In tab, or use Quick Reset below.'
        });
      }
    }

    const user = new User({
      name: name ? name.trim() : 'Faculty Member',
      email: cleanEmail,
      password,
      role: cleanRole,
      phone: phone ? phone.trim() : '',
      rollNo: rollNo ? rollNo.trim() : '',
      className: className ? className.trim() : '',
      section: section ? section.trim() : '',
      subject: subject ? subject.trim() : '',
      parentContact: parentContact ? parentContact.trim() : '',
      address: address ? address.trim() : '',
      designation: designation ? designation.trim() : '',
      profileCompleted: true,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || cleanEmail)}`
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: 'Account not found. Pehle "Register & Profile" tab se register karein, uske baad login karein (Please register first before signing in).'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        invalidPassword: true,
        message: 'Invalid password. Please check your credentials or reset password.'
      });
    }

    // Role verification: ensure user logs into their designated dashboard
    if (expectedRole && user.role !== expectedRole) {
      return res.status(400).json({
        success: false,
        roleMismatch: true,
        actualRole: user.role,
        message: `Account role mismatch! Yeh email "${user.role.toUpperCase()}" account ka hai, jabki aapne "${expectedRole.toUpperCase()}" portal select kiya hai. Kripya upar sahi role select karein.`
      });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Quick Password Reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email' });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Password successfully updated! You are now logged in.',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;
