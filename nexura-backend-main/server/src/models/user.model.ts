import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  level: {
    type: String,
    default: "Lv1"
  },
  tier: {
    name: {
      type: String,
      default: "Enchanter"
    },
    level: {
      type: Number,
      default: 0
    }
  },
  xp: {
    type: Number,
    default: 0
  },
  referral: {
    code: {
      type: String,
      required: true
    },
    users: {
      type: Number,
      default: 0
    },
    xp: {
      type: Number,
      default: 0
    }
  },
  dailyTasks: {
    task1: {
      type: Boolean,
      default: false
    },
    task2: {
      type: Boolean,
      default: false
    },
    task3: {
      type: Boolean,
      default: false
    },
    task4: {
      type: Boolean,
      default: false
    },
    done: {
      type: Boolean,
      default: false
    }
  },
  questsCompleted: {
    type: Number,
    default: 0
  },
  campaignsCompleted: {
    type: Number,
    default: 0
  },
  tTrustEarned: {
    type: Number,
    default: 0
  },
  dateJoined: {
    type: String,
    required: true
  },
  campaigns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "campaign"
  }]
}, { timestamps: true });

export const user = mongoose.model("users", userSchema);