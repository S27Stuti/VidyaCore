const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { emitToGroup, emitToUser, emitBroadcast } = require('../socket');

const defaultClassGroups = [
  {
    name: '📢 VidyaCore Official Notices',
    className: 'All',
    isGlobal: true,
    description: 'Central campus-wide bulletins, holiday announcements, and institutional circulars.',
    bannerColor: 'amber'
  },
  {
    name: '🌱 Class 1 Academic Cohort',
    className: '1',
    isGlobal: false,
    description: 'Daily homework, foundational numeracy, and primary class updates.',
    bannerColor: 'emerald'
  },
  {
    name: '🌿 Class 2 Learning Circle',
    className: '2',
    isGlobal: false,
    description: 'Primary reading club, foundational arithmetic & creative activities.',
    bannerColor: 'teal'
  },
  {
    name: '📘 Class 3 Academic Forum',
    className: '3',
    isGlobal: false,
    description: 'Curriculum updates, weekly spelling bee, math puzzles & project tasks.',
    bannerColor: 'cyan'
  },
  {
    name: '📙 Class 4 Explorers Hub',
    className: '4',
    isGlobal: false,
    description: 'Science experiments, social studies insights & general class circulars.',
    bannerColor: 'blue'
  },
  {
    name: '🌟 Class 5 Primary Scholars',
    className: '5',
    isGlobal: false,
    description: 'Primary graduation readiness, mathematics practice & language arts.',
    bannerColor: 'indigo'
  },
  {
    name: '🔬 Class 6 Junior Science & Math',
    className: '6',
    isGlobal: false,
    description: 'Integrated science worksheets, algebraic foundations & lab notices.',
    bannerColor: 'violet'
  },
  {
    name: '🎯 Class 7 Academic Circle',
    className: '7',
    isGlobal: false,
    description: 'Middle school curriculum, history projects & diagnostic test notices.',
    bannerColor: 'purple'
  },
  {
    name: '💡 Class 8 Foundation Forum',
    className: '8',
    isGlobal: false,
    description: 'Secondary prep, conceptual physics, algebra & board foundation exercises.',
    bannerColor: 'fuchsia'
  },
  {
    name: '📐 Class 9 Pre-Boards Hub',
    className: '9',
    isGlobal: false,
    description: 'Secondary stage syllabus, Olympiad notifications & subject tutorials.',
    bannerColor: 'rose'
  },
  {
    name: '🏆 Class 10 Board Exam Forum',
    className: '10',
    isGlobal: false,
    description: 'Secondary board examination circulars, sample papers & revision schedules.',
    bannerColor: 'red'
  },
  {
    name: '🚀 Class 11 Senior Secondary',
    className: '11',
    isGlobal: false,
    description: 'Senior secondary curriculum, stream orientation & weekly diagnostics.',
    bannerColor: 'orange'
  },
  {
    name: '🎓 Class 12 Advanced Graduation',
    className: '12',
    isGlobal: false,
    description: 'Graduating batch notices, competitive entrance advisories & board exam circulars.',
    bannerColor: 'sky'
  }
];

const ensureAllClassGroups = async (userId) => {
  try {
    for (const item of defaultClassGroups) {
      let existing = await Group.findOne({ className: item.className });
      if (!existing) {
        existing = new Group({
          name: item.name,
          className: item.className,
          isGlobal: item.isGlobal,
          description: item.description,
          bannerColor: item.bannerColor,
          createdBy: userId,
          admins: [userId],
          members: []
        });
      }

      // Auto-sync students of this class into group.members
      if (item.className === 'All') {
        const allStudents = await User.find({ role: 'student' }).select('_id');
        existing.members = allStudents.map((s) => s._id);
      } else {
        const classRegex = new RegExp(`^${item.className}$|^class\\s*${item.className}$|^${item.className}-?[a-z]?$`, 'i');
        const classStudents = await User.find({
          role: 'student',
          className: classRegex
        }).select('_id');
        existing.members = classStudents.map((s) => s._id);
      }

      await existing.save();
    }
  } catch (err) {
    console.error('Error ensuring class groups:', err);
  }
};

// Get all groups available to the user
router.get('/', authenticate, async (req, res) => {
  try {
    await ensureAllClassGroups(req.user._id);

    // If teacher or principal, they see ALL Class groups (1 to 12) + All
    if (req.user.role === 'principal' || req.user.role === 'teacher') {
      const allGroups = await Group.find()
        .populate('createdBy', 'name email role')
        .populate('admins', 'name email role')
        .populate('members', 'name rollNo email phone className');

      // Sort with 'All' first, then numeric classes 1 to 12
      allGroups.sort((a, b) => {
        if (a.isGlobal || a.className === 'All') return -1;
        if (b.isGlobal || b.className === 'All') return 1;
        const numA = parseInt(a.className, 10) || 99;
        const numB = parseInt(b.className, 10) || 99;
        return numA - numB;
      });

      return res.json({ success: true, count: allGroups.length, groups: allGroups });
    }

    // For Student: STRICTLY show ONLY:
    // 1) Their enrolled class channel
    // 2) The global / campus-wide announcement channel
    const studentClassRaw = (req.user.className || '').trim();
    const classNumMatch = studentClassRaw.match(/\d+/);
    const studentClassNum = classNumMatch ? classNumMatch[0] : studentClassRaw;

    const allGroups = await Group.find()
      .populate('createdBy', 'name email role')
      .populate('admins', 'name email role')
      .populate('members', 'name rollNo email phone className');

    const studentGroups = allGroups.filter((g) => {
      // 1. Always include whole-school / global channel
      if (g.isGlobal || g.className === 'All' || g.className === 'General') return true;

      // 2. Check if student is explicitly listed in members
      if (g.members?.some((m) => m._id.toString() === req.user._id.toString())) return true;

      // 3. Match group's class with student's class
      const groupClassRaw = (g.className || '').trim();
      const groupNumMatch = groupClassRaw.match(/\d+/);
      const groupClassNum = groupNumMatch ? groupNumMatch[0] : groupClassRaw;

      if (groupClassRaw.toLowerCase() === studentClassRaw.toLowerCase()) return true;
      if (studentClassNum && groupClassNum && studentClassNum === groupClassNum) return true;

      return false;
    });

    studentGroups.sort((a, b) => {
      if (a.isGlobal || a.className === 'All') return -1;
      return 1;
    });

    res.json({ success: true, count: studentGroups.length, groups: studentGroups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create announcement group (Teachers and Principal)
router.post('/', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { name, description, className, isGlobal, bannerColor } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const group = new Group({
      name,
      description: description || '',
      className: className || 'All',
      isGlobal: isGlobal || false,
      bannerColor: bannerColor || 'indigo',
      createdBy: req.user._id,
      admins: [req.user._id],
      members: []
    });

    // If it's a specific class group, automatically add students in that class
    if (className && className !== 'All') {
      const classStudents = await User.find({ role: 'student', className }).select('_id');
      group.members = classStudents.map((s) => s._id);
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate('createdBy', 'name email role')
      .populate('admins', 'name email role')
      .populate('members', 'name rollNo email phone className');

    emitBroadcast('group_created', populated);

    res.status(201).json({ success: true, group: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add student to group by Phone or Roll Number
router.post('/:id/add-student', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, rollNo, studentId } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    let student = null;
    if (studentId) {
      student = await User.findById(studentId);
    } else if (phone) {
      student = await User.findOne({ role: 'student', phone: phone.trim() });
    } else if (rollNo) {
      student = await User.findOne({ role: 'student', rollNo: rollNo.trim() });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student found matching the provided phone number or roll number'
      });
    }

    // Check if already member
    const alreadyMember = group.members.some((m) => m.toString() === student._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Student is already a member of this group' });
    }

    group.members.push(student._id);
    await group.save();

    // Create notification for student
    const notif = await Notification.create({
      recipient: student._id,
      title: 'Added to Broadcast Channel',
      message: `You were added to the announcement group "${group.name}".`,
      type: 'announcement',
      link: '/channels'
    });

    emitToUser(student._id, 'new_notification', { notification: notif });
    emitToGroup(group._id, 'member_joined', { group, student });

    const updatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'name email role')
      .populate('admins', 'name email role')
      .populate('members', 'name rollNo email phone className');

    res.json({
      success: true,
      message: `${student.name} added to ${group.name} successfully`,
      group: updatedGroup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages for a group
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await Message.find({ group: id })
      .populate('sender', 'name role email avatar')
      .populate('reactions.user', 'name role')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload media attachment (Audio, Video, Images, Documents, Files)
router.post('/upload', authenticate, async (req, res) => {
  try {
    const { fileName, fileData, fileType, mimeType, fileSize } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, message: 'No file data received' });
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Process base64 data string (e.g. data:image/png;base64,...)
    const matches = fileData.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
    let buffer;
    let safeExtension = path.extname(fileName || '') || '.bin';

    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    // Sanitize unique filename
    const safeBase = (fileName || 'attachment')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 40);
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeBase}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    res.json({
      success: true,
      file: {
        url: `/uploads/${uniqueName}`,
        name: fileName || uniqueName,
        type: fileType || 'file',
        size: fileSize || buffer.length,
        mimeType: mimeType || matches?.[1] || 'application/octet-stream'
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post message / announcement / doubt in group (Allows Principal, Teacher, and Student!)
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, priority, pinned, attachments } = req.body;

    const hasContent = content && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a message text or attach a file/media'
      });
    }

    const group = await Group.findById(id).populate('members', '_id');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isAuthorizedLeader = req.user.role === 'principal' || req.user.role === 'teacher';

    const message = new Message({
      group: id,
      sender: req.user._id,
      senderRole: req.user.role,
      content: hasContent ? content.trim() : '',
      attachments: hasAttachments ? attachments : [],
      priority: isAuthorizedLeader ? (priority || 'normal') : 'query',
      pinned: isAuthorizedLeader ? (pinned || false) : false,
      reactions: []
    });

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name role email avatar')
      .populate('reactions.user', 'name role');

    // Real-time broadcast to group room
    emitToGroup(id, 'new_message', populated);

    // If Teacher/Principal sends an announcement, notify students
    if (isAuthorizedLeader) {
      const targetStudentIds = new Set(group.members.map((m) => (m._id || m).toString()));

      if (group.isGlobal || group.className === 'All') {
        const allStudents = await User.find({ role: 'student' }).select('_id');
        allStudents.forEach((s) => targetStudentIds.add(s._id.toString()));
      } else {
        const classRegex = new RegExp(`^${group.className}$|^class\\s*${group.className}$|^${group.className}-?[a-z]?$`, 'i');
        const classStudents = await User.find({ role: 'student', className: classRegex }).select('_id');
        classStudents.forEach((s) => targetStudentIds.add(s._id.toString()));
      }

      for (const recipientId of targetStudentIds) {
        if (recipientId !== req.user._id.toString()) {
          const previewText = hasContent
            ? content.substring(0, 60)
            : `Shared ${attachments.length} attachment(s)`;

          const notif = await Notification.create({
            recipient: recipientId,
            title: `📢 New Notice in ${group.name}`,
            message: `${req.user.name}: "${previewText}${content && content.length > 60 ? '...' : ''}"`,
            type: 'announcement',
            link: '/channels'
          });

          emitToUser(recipientId, 'new_notification', {
            notification: notif,
            groupName: group.name,
            message: populated
          });

          emitToUser(recipientId, 'new_message', populated);
        }
      }
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle Pin Status on any Message (Teachers & Principals)
router.patch('/:groupId/messages/:messageId/pin', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const message = await Message.findOne({ _id: messageId, group: groupId });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found in this channel' });
    }

    message.pinned = !message.pinned;
    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name role email avatar')
      .populate('reactions.user', 'name role');

    // Live socket broadcast to room
    emitToGroup(groupId, 'message_pinned_updated', {
      groupId,
      messageId: message._id,
      pinned: message.pinned,
      message: populated
    });

    res.json({
      success: true,
      pinned: message.pinned,
      message: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// React to message with emoji (Available to all roles including Students!)
router.post('/messages/:messageId/react', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const allowedEmojis = ['👍', '❤️', '✅', '🙏', '🔥', '👏', '💡', '📌'];
    if (!allowedEmojis.includes(emoji)) {
      return res.status(400).json({
        success: false,
        message: `Invalid emoji. Allowed: ${allowedEmojis.join(' ')}`
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Toggle reaction: If user already reacted with the same emoji, remove it; if different emoji, switch it
    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions = message.reactions.filter((r) => r.user.toString() !== req.user._id.toString());
      message.reactions.push({
        emoji,
        user: req.user._id
      });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name role email avatar')
      .populate('reactions.user', 'name role');

    // Live update over socket
    emitToGroup(message.group.toString(), 'reaction_updated', {
      messageId: message._id,
      reactions: populated.reactions
    });

    res.json({
      success: true,
      messageId: message._id,
      reactions: populated.reactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

