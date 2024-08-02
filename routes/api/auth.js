const express = require('express');
const router = express.Router();
const User = require('../../validate/userShema');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const {validateUser} = require('../../validate/userJoi');
const authMiddleware = require('../../middlewares/authMiddleware')

router.post('/register', async (req, res) => {
    const { email, password, subscription } = req.body;
    const { error } = validateUser({ email, password, subscription });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const user = await User.findOne({ email });
    if (user) {
        return res.status(409).json({
            status: "error",
            code: 409,
            message: "Email already in use",
            data: "Conflict",
        });
    }

    try {
        const newUser = new User({ email, password, subscription });
        await newUser.setPassword(password);
        await newUser.save();

        res.status(201).json({
            user: {
                email: newUser.email,
                subscription: newUser.subscription
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log("Login with email:", email);

        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found with email:", email);
            return res.status(401).json({ message: 'Email or password is wrong' });
        }

        const isPasswordValid = await user.isValidPassword(password);
        if (!isPasswordValid) {
            console.error("Invalid password for user:", email);
            return res.status(401).json({ message: 'Email or password is wrong' });
        }

        const payload = { id: user._id };
        console.log("Payload for JWT:", payload);

        const token = jwt.sign(payload, process.env.SECRET_KEY_JWT, { expiresIn: '1h' });

        user.token = token;
        await user.save();
        res.json({
            token,
            user: {
                email: user.email,
                subscription: user.subscription
            }
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.get('/logout', authMiddleware, async(req, res) => {
    try {
        const user = req.user;
        user.token = null;
        await user.save();
        // res.status(200).json({ message: 'Successfully logged out' });
        res.status(204).json({message: 'No Content'}).end();
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/current', authMiddleware, async (req, res) => {
    const { email, subscription } = req.user;
    res.json({ email, subscription });
});

module.exports = router;