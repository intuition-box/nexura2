import mongoose, { Schema } from "mongoose";

const ecosystemTaskSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timer: {
    type: Number,
    required: true
  },
  logo: {
    type: String,
    required: true
  },
  rewards: {
    xp: {
      type: Number,
      default: 0
    },
    tTrust: {
      type: Number,
      default: 0
    }
  },
  link: {
    type: String,
    required: true
  },
  tags: {
    type: String,
    required: true,
    enum: ["defi", "lending-protocols", "prediction-markets", "nft", "social", "gaming", "portal", "domain-name", 'launchpads']
  },
}, { timestamps: true });

export const ecosystemTask = mongoose.model("ecosystem-tasks", ecosystemTaskSchema);


const campaignTaskSchema = new Schema({
  task: {
    type: String,
    required: true
  },
  xp: {
    type: Number,
    required: true
  },
  link: {
    type: String
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "campaign"
  }
}, { timestamps: true });

export const campaignTask = mongoose.model("campaign-tasks", campaignTaskSchema);

const questSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reward: {
    xp: {
      type: Number,
      required: true
    },
    tTrust: {
      type: Number,
      required: true
    }
  },
  category: {
    type: String,
    enum: ["one-time", "daily"] 
  },
  expires: {
    type: Date,
    expires: "1d",
    required: false
  }
}, { timestamps: true });

export const quest = mongoose.model("quests", questSchema);
