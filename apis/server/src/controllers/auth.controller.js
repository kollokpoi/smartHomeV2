const { User } = require('../models')

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password)
                return res.status(400).json({
                    success: false,
                    message: "Почта и пароль обязательны"
                })

            const user = await User.scope('withPassword').findOne({
                where: { email }
            })
            if (!user || !user.is_active)
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials or user inactive'
                });

            const passwordValid = await user.validPassword(password);
            if (!passwordValid)
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });

            await user.updateLastLogin()

            const accessToken = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' }
            );

            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
            );

            res.json({
                success: true,
                data: {
                    user,
                    tokens: {
                        accessToken,
                        refreshToken,
                        expiresIn: 3600
                    }
                }
            });
        } catch (error) {
            next(error)
        }
    }

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET
            );
            const user = await User.findByPk(decoded.id);

            if (!user || !user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }

            const newAccessToken = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_ACCESS_EXPIRES || '1h' }
            );

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    expiresIn: 3600
                }
            });
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }
}
module.exports = new AuthController()