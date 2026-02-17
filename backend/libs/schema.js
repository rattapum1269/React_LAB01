const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: String,
  userName: String,
  fullName: String,
  email: String,
  userLevel: String,
  userState: String,
  password: String,
  dateCreate: Date,
  dateExpire: Date,
})

// --- [เพิ่มส่วนนี้] Schema ของ Device ---
const deviceSchema = new Schema({
  _id: String,
  name: String,
  type: String,
  status: String,
  script: String, // เก็บโค้ด JavaScript
})
// ------------------------------------

module.exports = {
  mongoose: mongoose,
  userSchema: userSchema,
  deviceSchema: deviceSchema, // <-- อย่าลืม export ออกไป
}