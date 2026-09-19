// PUT /api/users/profile (protected)
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    // Email is intentionally NOT editable here -- changing email without a
    // verification flow would let a user silently take over another
    // account's identity, so it's out of scope for this project.
    if (name && name.trim()) req.user.name = name.trim();
    if (avatar) req.user.avatar = avatar;

    await req.user.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: req.user });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateProfile };
