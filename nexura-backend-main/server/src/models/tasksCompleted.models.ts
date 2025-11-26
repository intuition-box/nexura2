import mongoose, { Schema } from "mongoose";

const questCompletedSchema = new Schema({
  done: {
    type: Boolean,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ["daily", "one-time"]
  },
  quest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "quests"
  },
  expiresAt: {
    type: Date,
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
}, { timestamps: true });

export const questCompleted = mongoose.model("quest-completed", questCompletedSchema);


const campaignTaskCompletedSchema = new Schema({
  done: {
    type: Boolean,
    required: true
  },
  campaignTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "campaignTask"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
}, { timestamps: true });

export const campaignTaskCompleted = mongoose.model("campaignTask-completed", campaignTaskCompletedSchema);

const ecosystemTaskCompletedSchema = new Schema({
  done: {
    type: Boolean,
    required: true
  },
  timer: {
    type: Date,
    required: true
  },
  ecosystemTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ecosystemTask"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
}, { timestamps: true });

export const ecosystemTaskCompleted = mongoose.model("ecosystemTask-completed", ecosystemTaskCompletedSchema);
