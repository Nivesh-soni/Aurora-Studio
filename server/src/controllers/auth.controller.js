import User from '../models/user.model.js';

export const syncUser = async (req, res) => {
  try {
    const { email, name, imageUrl } = req.body;
    const clerkId = req.clerkUserId;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { email, name, imageUrl },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
