const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateJWT, generateRefreshToken } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const token = generateJWT(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    await User.updateOne(
      { _id: user._id },
      {
        $push: { refreshTokens: refreshToken },
        $set: { lastLogin: new Date() },
        $inc: { loginCount: 1 },
      }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User ${user.username} logged in`);

    res.json({
      success: true,
      token,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key-change-me'
      );
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ error: 'Refresh token not recognized' });
    }

    // Generate new access token
    const newToken = generateJWT(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Rotate refresh token
    await User.updateOne(
      { _id: user._id },
      {
        $pull: { refreshTokens: refreshToken },
        $push: { refreshTokens: newRefreshToken },
      }
    );

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-me');
        await User.updateOne(
          { _id: decoded.id },
          { $pull: { refreshTokens: refreshToken } }
        );
      } catch (e) {}
    }

    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/setup
 * First-time admin setup — only works if no users exist
 */
exports.setup = async (req, res, next) => {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(403).json({ error: 'Setup already completed. Admin user exists.' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.create({
      username: username.toLowerCase().trim(),
      password,
      role: 'admin',
    });

    const token = generateJWT(user._id);

    logger.info(`Admin user created: ${user.username}`);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
exports.me = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/**
 * GET /api/auth/status
 * Check if setup is needed (no users exist)
 */
exports.checkSetup = async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    res.json({ needsSetup: count === 0 });
  } catch (err) {
    next(err);
  }
};
