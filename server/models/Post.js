const mongoose = require('mongoose');

const CATEGORIES = ['Tech', 'Travel', 'Food', 'Lifestyle', 'Coding', 'General'];

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      unique: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: 200,
    },
    coverImage: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'General',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    views: {
      type: Number,
      default: 0,
    },


viewedBy: {
  type: [String],
  default: [],
},
  },
  { timestamps: true }
);

postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1,tags: {
  type: [String],
  default: [],
  set: (tags) => tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 8),
}, });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', excerpt: 'text' });

postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

postSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.viewedBy;
    return ret;
  },
});

module.exports = mongoose.model('Post', postSchema);
module.exports.CATEGORIES = CATEGORIES;
