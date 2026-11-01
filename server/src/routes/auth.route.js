import express from 'express';
import User from '../models/user.model.js';

const router = express.Router();

router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, name, imageUrl } = req.body;

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = new User({ clerkId, email, name, imageUrl });
      await user.save();
    } else {
      console.log("User already exists in MongoDB");
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
