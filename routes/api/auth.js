const express = require('express');
const router = express.Router();
const User = require('../../validate/userShema');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const {validateUser} = require('../../validate/userJoi');
const authMiddleware = require('../../middlewares/authMiddleware');
const gravatar = require('gravatar');
const jimp = require('jimp');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const upload = require('../../helpers/configMulter');
const path = require('path');
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
        const avatarURL = gravatar.url(email, { s: '250', r: 'pg', d: 'monsterid' }, true);
        console.log(avatarURL);
        const verificationToken = uuidv4();
        const newUser = new User({ email, password, subscription, avatarURL, verificationToken });
        const verificationLink =`http://localhost:3000/api/auth/users/verify/${verificationToken}`;

        const msg = {
            to: email,
            from: 'badeadaniella@gmail.com',
            subject: 'Verify your email address',
            text: `Please verify your email address by clicking on the following link: ${verificationLink}`,
            html: `<strong>Please verify your email address by clicking on the following link: <a href="${verificationLink}">Verify Email</a></strong>`,
        }
            sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            });
        
        await newUser.setPassword(password);
        await newUser.save();

        res.status(201).json({
            user: {
                email: newUser.email,
                subscription: newUser.subscription,
                avatarURL: newUser.avatarURL,
                verificationToken: newUser.verificationToken
            },
            message: "Verification email sent"
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

router.patch('/users', authMiddleware, async (req, res) => {
    try {
      const { subscription } = req.body;
    //   const { error } = joi.object({
    //     subscription: joi.string().valid('starter', 'pro', 'business').required()
    //   }).validate({ subscription });
  
    //   if (error) {
    //     console.error('Validation Error:', error.details[0].message);
    //     return res.status(400).json({ message: error.details[0].message });
    //   }

    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
  
      const user = req.user;
      user.subscription = subscription;
      await user.save();
  
      res.json({
        email: user.email,
        subscription: user.subscription
      });
    } catch (error) {
      console.error('Internal Server Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

const avatarDir = path.join(process.cwd(), 'public', 'avatars');

router.patch('/users/avatars', authMiddleware, upload.single('avatar'), async (req, res, next) => {
    const { _id } = req.user;
    const file = req.file;
    const { path: temporaryName, originalname } = file;
    try {
        if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
        };
        // await jimp.read(temporaryName).then((img) =>
        //     img.resize(250, 250).quality(60).write(temporaryName)
        // );
        const img = await jimp.read(temporaryName);
        await img.resize(250, 250).quality(60).writeAsync(temporaryName);

        const uniqueName = uuidv4() + path.extname(originalname);
        const storeFile = path.join(avatarDir, uniqueName);
        await fs.rename(temporaryName, storeFile);

        //   Actualizez userul cu noul avatar
        const avatarURL = `/avatars/${uniqueName}`;
        await User.findByIdAndUpdate(_id, { avatarURL });
        res.status(200).json({
            message: 'File uploaded successfully',
            avatarURL,
        });
    } catch (err) {
        // Șterge fișierul temporar în caz de eroare
        try {
            await fs.unlink(temporaryName);
        } catch (unlinkErr) {
            console.error('Error while deleting the temporary file:', unlinkErr);
        }
        return next(err);
    }
});

router.get("/users/verify/:verificationToken", async (req, res, next) => {
    const { verificationToken } = req.params;
    console.log('Received verification token:', verificationToken);

    try {
        const user = await User.findOne({ verificationToken });
        if (!user) {
            console.error('User not found with token:', verificationToken);
            return res.status(404).json({ message: 'User not found' });
        } else {
            user.verify = true;
            user.verificationToken = null;
            await user.save();
            console.log('User verified successfully:', user.email);
            const email = user.email;
            res.status(200).json({ message: 'Verification successful', email});
        }
    } catch (err) {
        console.error('Error during verification:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.post('/users/verify', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'missing required field email' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.verify) {
            return res.status(400).json({ message: 'Verification has already been passed' });
        }

        const verificationLink = `http://localhost:3000/api/auth/users/verify/${user.verificationToken}`;

        const msg = {
            to: email,
            from: 'badeadaniella@gmail.com',
            subject: 'Verify your email address',
            text: `Please verify your email address by clicking on the following link: ${verificationLink}`,
            html: `<strong>Please verify your email address by clicking on the following link: <a href="${verificationLink}">Verify Email</a></strong>`,
        }
        await sgMail.send(msg);

        res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error during resending verification email:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;