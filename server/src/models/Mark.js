const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    className: {
      type: String,
      required: true
    },
    examType: {
      type: String,
      enum: ['Unit Test 1', 'Midterm', 'Final Exam', 'Quarterly'],
      default: 'Midterm',
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 1
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
      default: 'B'
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Helper function to calculate grade and percentage before save
markSchema.pre('save', function () {
  if (this.maxMarks > 0) {
    this.percentage = Math.round((this.marksObtained / this.maxMarks) * 100 * 10) / 10;
    
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C';
    else if (this.percentage >= 40) this.grade = 'D';
    else this.grade = 'F';
  }
});

markSchema.index({ student: 1, examType: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
