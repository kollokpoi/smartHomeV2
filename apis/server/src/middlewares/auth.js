const jwt = require('jsonwebtoken');
const { User } = require('../models')
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expired',
                        code: 'TOKEN_EXPIRED'
                    });
                } else if (err.name === 'JsonWebTokenError') {
                    return res.status(403).json({
                        success: false,
                        message: 'Invalid token',
                        code: 'INVALID_TOKEN'
                    });
                } else {
                    return res.status(403).json({
                        success: false,
                        message: 'Token verification failed'
                    });
                }
            }

            try {
                // Если токен валиден, ищем пользователя
                const user = await User.findByPk(decoded.id);

                if (!user || !user.is_active) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found or inactive'
                    });
                }

                req.user = user;
                next();
            } catch (dbError) {
                console.error('Database error in auth middleware:', dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

module.exports = { authenticateToken, authorize };