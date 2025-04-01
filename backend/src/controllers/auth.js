const db = require('../config/db');

const login = async (req, res) => {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: 'User ID and password are required'
            });
        }

        // Validate if user ID is a number
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Get user from database
        const [users] = await db.query(
            'SELECT user_id, username, email FROM USERS WHERE user_id = ? AND password = ?',
            [userId, password]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid user credentials'
            });
        }

        const user = users[0];

        // Return user data
        res.json({
            success: true,
            data: {
                user_id: user.user_id,
                username: user.username,
                email: user.email
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    login
}; 