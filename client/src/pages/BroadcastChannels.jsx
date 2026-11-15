import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import {
  Radio,
  Send,
  Sparkles,
  UserPlus,
  Pin,
  AlertCircle,
  CheckCircle2,
  Lock,
  Smile,
  Shield,
  BookOpen,
  Calendar,
  X,
  Search,
  Filter,
  ChevronLeft,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Volume2,
  Download,
  Trash2,
  FileText,
  HelpCircle,
  FileUp,
  Maximize2,
  MessageSquare,
  CornerDownRight
} from 'lucide-react';

export const BroadcastChannels = () => {
  const { user, role } = useAuth();
  const { socket, addToast } = useSocket();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Composer state
  const [draftContent, setDraftContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]); // Array of pending attachments

  // Image Lightbox Preview modal
  const [lightboxImage, setLightboxImage] = useState(null);

  // AI Polish modal state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTone, setAiTone] = useState('formal');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedPreview, setPolishedPreview] = useState('');

  // AI Chatbot Assistant Modal state
  const [showAiChatModal, setShowAiChatModal] = useState(false);
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [aiChatAnswer, setAiChatAnswer] = useState('');
  const [aiChatLoading, setAiChatLoading] = useState(false);

  // Add student modal state (Teacher/Principal)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  // Channel search & filter state
  const [channelSearch, setChannelSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'classes' | 'campus'
  const [mobileActiveView, setMobileActiveView] = useState('list'); // 'list' | 'chat'

  // Hidden File Inputs Refs
  const docInputRef = useRef(null);
  const imgInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  const isTeacherOrPrincipal = role === 'principal' || role === 'teacher';
  const isStudent = role === 'student';

  const allowedEmojis = ['👍', '❤️', '✅', '🙏', '🔥', '👏', '💡', '📌'];

  const quickTemplates = [
    { label: '📢 Exam Notice', text: 'Important Notice: Midterm Examination schedule and syllabus have been published. All students must report by 8:30 AM with their institutional ID cards.' },
    { label: '🏖️ Holiday Circular', text: 'Campus Announcement: School will remain closed tomorrow on account of public holiday. Online revision tasks have been assigned in student portfolios.' },
    { label: '📝 Homework Task', text: 'Daily Academic Assignment: Please complete Exercise 4.2 questions 1 through 10 before tomorrow morning lecture. Submit doubt queries here.' },
    { label: '🔬 Lab Practical', text: 'Science Laboratory Notice: Biology and Chemistry practical sessions will commence at 10:00 AM sharp in Central Science Block. Lab aprons are mandatory.' },
    { label: '👨‍👩‍👧 Parent Meeting', text: 'Institutional Notice: Parent-Teacher Interaction meeting is scheduled for this Saturday from 9:00 AM to 12:30 PM to discuss term evaluations.' }
  ];

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to resolve media URLs for production deployment
  const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const backendUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    return backendUrl ? `${backendUrl}${url}` : url;
  };

  // Fetch groups on mount
  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await api.get('/groups');
      const groupList = res.data.groups || [];
      setGroups(groupList);

      // Auto-select first group
      if (groupList.length > 0 && !selectedGroup) {
        setSelectedGroup(groupList[0]);
      }
    } catch (err) {
      console.error('Failed to load broadcast groups', err);
      addToast('Error', 'Could not load broadcast groups', 'warning');
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch messages when selectedGroup changes & setup socket listeners
  useEffect(() => {
    if (!selectedGroup?._id) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/groups/${selectedGroup._id}/messages`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    // Socket: Join group room
    if (socket) {
      socket.emit('join_group', selectedGroup._id);

      const handleNewMessage = (newMsg) => {
        if (newMsg.group === selectedGroup._id || newMsg.group?._id === selectedGroup._id) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
        }
      };

      const handleReactionUpdated = ({ messageId, reactions }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
        );
      };

      const handlePinnedUpdated = ({ messageId, pinned, message: updatedMsg }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? (updatedMsg || { ...m, pinned }) : m))
        );
      };

      socket.on('new_message', handleNewMessage);
      socket.on('reaction_updated', handleReactionUpdated);
      socket.on('message_pinned_updated', handlePinnedUpdated);

      return () => {
        socket.emit('leave_group', selectedGroup._id);
        socket.off('new_message', handleNewMessage);
        socket.off('reaction_updated', handleReactionUpdated);
        socket.off('message_pinned_updated', handlePinnedUpdated);
      };
    }
  }, [selectedGroup?._id, socket]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll to a specific message (e.g. from pinned banner)
  const scrollToMessage = (msgId) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-amber-500/50');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-500/50');
      }, 2000);
    }
  };

  // Handle local file selection and convert to preview
  const handleFileSelect = (e, fileType) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      // 25MB max per file limit
      if (file.size > 25 * 1024 * 1024) {
        addToast('File too large', `"${file.name}" exceeds the 25MB limit.`, 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target.result;
        setAttachments((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random().toString(),
            name: file.name,
            size: file.size,
            type: fileType,
            mimeType: file.type,
            fileData,
            rawFile: file
          }
        ]);
        addToast('Attached', `"${file.name}" ready to upload with message`, 'info');
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Send message (Teacher, Principal, or Student Query)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const hasText = draftContent.trim().length > 0;
    const hasAttachments = attachments.length > 0;

    if ((!hasText && !hasAttachments) || sending) return;

    setSending(true);
    try {
      // 1. Upload pending attachments if any
      const uploadedAttachments = [];
      for (const att of attachments) {
        const upRes = await api.post('/groups/upload', {
          fileName: att.name,
          fileData: att.fileData,
          fileType: att.type,
          mimeType: att.mimeType,
          fileSize: att.size
        });
        if (upRes.data?.file) {
          uploadedAttachments.push(upRes.data.file);
        }
      }

      // 2. Post message with uploaded media
      const res = await api.post(`/groups/${selectedGroup._id}/messages`, {
        content: draftContent.trim(),
        priority: isTeacherOrPrincipal ? priority : 'query',
        pinned: isTeacherOrPrincipal ? isPinned : false,
        attachments: uploadedAttachments
      });

      if (res.data?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === res.data.message._id)) return prev;
          return [...prev, res.data.message];
        });
        addToast(
          isTeacherOrPrincipal ? 'Broadcast Dispatched 🚀' : 'Query Submitted ✨',
          `${isTeacherOrPrincipal ? 'Official notice' : 'Your question'} has been posted to ${selectedGroup.name}`,
          'announcement'
        );
      }

      setDraftContent('');
      setPriority('normal');
      setIsPinned(false);
      setAttachments([]);
    } catch (err) {
      console.error('Failed to post message', err);
      addToast('Error', err.response?.data?.message || 'Failed to post message', 'warning');
    } finally {
      setSending(false);
    }
  };

  // Toggle Pin Status on a message (Teacher / Principal)
  const handleTogglePin = async (messageId) => {
    try {
      const res = await api.patch(`/groups/${selectedGroup._id}/messages/${messageId}/pin`);
      const updated = res.data.message;
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? (updated || { ...m, pinned: res.data.pinned }) : m))
      );
      addToast(
        res.data.pinned ? '📌 Announcement Pinned' : 'Notice Unpinned',
        res.data.pinned
          ? 'This message is now pinned to the top of the channel.'
          : 'Removed from pinned announcements banner.',
        'announcement'
      );
    } catch (err) {
      console.error('Failed to toggle pin', err);
      addToast('Pin Error', err.response?.data?.message || 'Could not update pin status', 'warning');
    }
  };

  // AI Polish Notice
  const handlePolishWithAi = async () => {
    if (!draftContent.trim()) {
      addToast('Draft required', 'Please type a draft message first to polish with AI.', 'warning');
      return;
    }
    setIsPolishing(true);
    try {
      const res = await api.post('/ai/polish-notice', {
        draftText: draftContent,
        tone: aiTone
      });
      setPolishedPreview(res.data.polishedText);
    } catch (err) {
      console.error('AI polish failed', err);
      addToast('AI Polish error', err.response?.data?.message || 'Could not polish text', 'warning');
    } finally {
      setIsPolishing(false);
    }
  };

  const applyPolishedText = () => {
    if (polishedPreview) {
      setDraftContent(polishedPreview);
      setShowAiModal(false);
      setPolishedPreview('');
      addToast('✨ AI Applied', 'Draft replaced with formal circular format.', 'announcement');
    }
  };

  // Ask AI Academic Assistant Bot
  const handleAskAiAssistant = async (e) => {
    e?.preventDefault();
    if (!aiChatQuery.trim() || aiChatLoading) return;
    setAiChatLoading(true);
    setAiChatAnswer('');
    try {
      const res = await api.post('/ai/academic-assistant', {
        question: aiChatQuery.trim(),
        channelName: selectedGroup?.name,
        className: selectedGroup?.className
      });
      setAiChatAnswer(res.data.answer);
    } catch (err) {
      console.error('AI assistant error', err);
      addToast('AI Assistant Error', 'Failed to generate answer. Please try again.', 'warning');
    } finally {
      setAiChatLoading(false);
    }
  };

  // React to message with emoji
  const handleReact = async (messageId, emoji) => {
    try {
      const res = await api.post(`/groups/messages/${messageId}/react`, { emoji });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions: res.data.reactions } : m))
      );
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  // Add student by phone or roll
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setAddingStudent(true);
    try {
      const isRoll = /^[0-9]+[A-Za-z]+[0-9]+$/i.test(searchQuery.trim());
      const payload = isRoll
        ? { rollNo: searchQuery.trim() }
        : { phone: searchQuery.trim() };

      const res = await api.post(`/groups/${selectedGroup._id}/add-student`, payload);

      addToast('Student Added', res.data.message, 'attendance');
      setSelectedGroup(res.data.group);
      setShowAddStudentModal(false);
      setSearchQuery('');
      fetchGroups();
    } catch (err) {
      console.error('Failed to add student', err);
      addToast('Error', err.response?.data?.message || 'Student not found with that phone/roll.', 'warning');
    } finally {
      setAddingStudent(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (filterTab === 'classes' && (g.isGlobal || g.className === 'All')) return false;
    if (filterTab === 'campus' && !g.isGlobal && g.className !== 'All') return false;

    if (!channelSearch.trim()) return true;
    const term = channelSearch.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      g.className.toLowerCase().includes(term) ||
      g.description?.toLowerCase().includes(term)
    );
  });

  // Calculate pinned messages in active channel
  const pinnedMessages = messages.filter((m) => m.pinned);

  return (
    <div className="h-[calc(100dvh-11rem)] md:h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-3 sm:gap-4">
      {/* Hidden File Upload Inputs */}
      <input
        type="file"
        ref={docInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        onChange={(e) => handleFileSelect(e, 'document')}
      />
      <input
        type="file"
        ref={imgInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        type="file"
        ref={audioInputRef}
        className="hidden"
        accept="audio/*"
        onChange={(e) => handleFileSelect(e, 'audio')}
      />
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, 'video')}
      />

      {/* CHANNELS SIDEBAR LIST */}
      <div
        className={`w-full md:w-80 lg:w-88 shrink-0 glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex flex-col overflow-hidden shadow-sm ${
          mobileActiveView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Announcement Groups</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isTeacherOrPrincipal ? 'Classes 1–12 & Whole Campus' : `Enrolled Cohort & Official Bulletins`}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-gradient-to-r from-blue-500/15 to-emerald-500/15 text-blue-700 dark:text-emerald-300 border border-blue-500/20">
            {filteredGroups.length} Channels
          </span>
        </div>

        {/* Search Bar */}
        <div className="p-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder="Search group or class..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filter Tabs for Staff */}
          {isTeacherOrPrincipal && (
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 mt-2 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({groups.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('classes')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                  filterTab === 'classes'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Classes 1–12
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('campus')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                  filterTab === 'campus'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-emerald-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Campus Wide
              </button>
            </div>
          )}
        </div>

        {/* Channel Items List */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {loadingGroups ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading Channels...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching channels found.
            </div>
          ) : (
            filteredGroups.map((g) => {
              const isSelected = selectedGroup?._id === g._id;
              const isGlobal = g.isGlobal || g.className === 'All';
              return (
                <button
                  key={g._id}
                  onClick={() => {
                    setSelectedGroup(g);
                    setMobileActiveView('chat');
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer relative card-hover ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600/15 via-emerald-500/10 to-transparent text-blue-700 dark:text-emerald-300 border border-blue-500/30 shadow-xs'
                      : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-blue-600 to-emerald-500 rounded-r-full" />
                  )}
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="font-bold text-xs truncate text-slate-900 dark:text-white">
                      {g.name}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                        isGlobal
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                      }`}
                    >
                      {isGlobal ? 'Campus' : `Class ${g.className}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                    {g.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                    <span>{g.members?.length || 0} Students</span>
                    <span>&bull;</span>
                    <span>Cohort: {g.className}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN CHANNEL FEED & COMPOSER */}
      <div
        className={`flex-1 glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 flex flex-col overflow-hidden shadow-sm ${
          mobileActiveView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedGroup ? (
          <>
            {/* Channel Top Header */}
            <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileActiveView('list')}
                  className="md:hidden flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                  title="Back to Announcement Groups"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Groups</span>
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {selectedGroup.name}
                    </h2>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      Cohort: {selectedGroup.className}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{selectedGroup.description}</p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Ask AI Bot in Header */}
                <button
                  type="button"
                  onClick={() => setShowAiChatModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xs hover:shadow-md transition-all cursor-pointer card-hover active:scale-95"
                  title="Ask VidyaCore AI Mentor / Chatbot"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask AI Bot</span>
                </button>

                {pinnedMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollToMessage(pinnedMessages[pinnedMessages.length - 1]._id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                    title="Jump to latest pinned notice"
                  >
                    <Pin className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Pinned ({pinnedMessages.length})</span>
                  </button>
                )}

                {/* Add Student Button (Teacher/Principal) */}
                {isTeacherOrPrincipal && (
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-emerald-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors shrink-0 card-hover cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Student</span>
                  </button>
                )}
              </div>
            </div>

            {/* PINNED ANNOUNCEMENTS TOP BAR */}
            {pinnedMessages.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs shrink-0 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <span>Pinned Official Circular</span>
                      <span className="text-[10px] text-amber-600/80 font-normal">({pinnedMessages.length} Pinned)</span>
                    </p>
                    <p className="truncate text-slate-800 dark:text-slate-200 text-xs font-medium">
                      {pinnedMessages[pinnedMessages.length - 1].content || '📎 Pinned Media Attachment'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToMessage(pinnedMessages[pinnedMessages.length - 1]._id)}
                  className="px-3 py-1 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 border border-amber-500/40 hover:bg-amber-500/20 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Jump to Notice &darr;
                </button>
              </div>
            )}

            {/* MESSAGES FEED */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {loadingMessages ? (
                <div className="py-16 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading broadcasts...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                    <Radio className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Welcome to {selectedGroup.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isTeacherOrPrincipal
                        ? 'No circulars broadcasted in this group yet. Use the rich composer below to post notices, voice memos, lecture videos, or documents.'
                        : 'No announcements in this channel yet. Faculty updates, audio/video lectures, and exam schedules will appear here in real-time.'}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSenderTeacher = msg.senderRole === 'teacher';
                  const isSenderPrincipal = msg.senderRole === 'principal';
                  const isSenderStudent = msg.senderRole === 'student';
                  const isMyMessage = msg.sender?._id === user?._id || msg.sender === user?._id;

                  // Group reactions by emoji
                  const reactionCounts = {};
                  allowedEmojis.forEach((e) => (reactionCounts[e] = 0));
                  const userReactedWith = {};
                  (msg.reactions || []).forEach((r) => {
                    if (reactionCounts[r.emoji] !== undefined) {
                      reactionCounts[r.emoji]++;
                    }
                    if (r.user?._id === user?._id || r.user === user?._id) {
                      userReactedWith[r.emoji] = true;
                    }
                  });

                  return (
                    <div
                      key={msg._id}
                      ref={(el) => (messageRefs.current[msg._id] = el)}
                      className={`p-4 rounded-2xl glass-card border transition-all duration-200 relative ${
                        msg.pinned
                          ? 'border-amber-500/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-md shadow-amber-500/5 ring-1 ring-amber-500/40'
                          : msg.priority === 'urgent'
                          ? 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20 shadow-xs'
                          : msg.priority === 'announcement'
                          ? 'border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 shadow-xs'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs'
                      }`}
                    >
                      {/* Pinned Left Accent Bar */}
                      {msg.pinned && (
                        <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-amber-500 rounded-r-full" />
                      )}

                      {/* Message Meta Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              msg.sender?.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender?.name || 'Staff'}`
                            }
                            alt={msg.sender?.name}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {msg.sender?.name || 'Academic Member'}
                              </span>
                              {isSenderPrincipal && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-amber-500" />
                                  <span>Super Admin (Principal)</span>
                                </span>
                              )}
                              {isSenderTeacher && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3 text-blue-500" />
                                  <span>Faculty / Admin</span>
                                </span>
                              )}
                              {isSenderStudent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <HelpCircle className="w-3 h-3 text-emerald-500" />
                                  <span>Student Query</span>
                                </span>
                              )}
                              {isMyMessage && (
                                <span className="text-[10px] text-slate-400 font-semibold">(You)</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                              {new Date(msg.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Top Right Badges & Pin Action */}
                        <div className="flex items-center gap-1.5">
                          {msg.pinned && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full shadow-2xs">
                              <Pin className="w-3 h-3 fill-current" /> PINNED
                            </span>
                          )}

                          {msg.priority === 'urgent' && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                              🚨 Urgent
                            </span>
                          )}

                          {/* Teacher / Principal Pin Toggle Button on ANY message */}
                          {isTeacherOrPrincipal && (
                            <button
                              type="button"
                              onClick={() => handleTogglePin(msg._id)}
                              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                msg.pinned
                                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/20 hover:bg-amber-500/30'
                                  : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10'
                              }`}
                              title={msg.pinned ? 'Unpin this announcement' : 'Pin message to top of channel'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${msg.pinned ? 'fill-current' : ''}`} />
                              <span className="text-[10px] font-bold">{msg.pinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Message Text Content */}
                      {msg.content && (
                        <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed py-1.5">
                          {msg.content}
                        </div>
                      )}

                      {/* MULTIMEDIA ATTACHMENTS (Images, Videos, Audios, Documents) */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2.5 space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          {msg.attachments.map((att, idx) => {
                            if (att.type === 'image') {
                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-md bg-slate-900/5 group relative"
                                >
                                  <img
                                    src={resolveMediaUrl(att.url)}
                                    alt={att.name}
                                    onClick={() => setLightboxImage(resolveMediaUrl(att.url))}
                                    className="w-full max-h-72 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  />
                                  <div className="p-2 bg-slate-900/80 backdrop-blur-xs flex items-center justify-between text-[11px] text-white">
                                    <span className="truncate max-w-[240px] font-medium">{att.name}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setLightboxImage(resolveMediaUrl(att.url))}
                                        className="p-1 text-slate-300 hover:text-white"
                                        title="View Fullscreen"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </button>
                                      <a
                                        href={resolveMediaUrl(att.url)}
                                        download={att.name}
                                        className="p-1 text-slate-300 hover:text-emerald-400"
                                        title="Download Image"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (att.type === 'video') {
                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-lg bg-black"
                                >
                                  <video controls src={resolveMediaUrl(att.url)} className="w-full max-h-80" />
                                  <div className="p-2 bg-slate-900/90 flex items-center justify-between text-[11px] text-white">
                                    <span className="flex items-center gap-1.5 truncate max-w-[240px] font-medium">
                                      <VideoIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                      <span className="truncate">{att.name}</span>
                                    </span>
                                    <a
                                      href={resolveMediaUrl(att.url)}
                                      download={att.name}
                                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[10px] font-bold transition-colors"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download Video</span>
                                    </a>
                                  </div>
                                </div>
                              );
                            }

                            if (att.type === 'audio') {
                              return (
                                <div
                                  key={idx}
                                  className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-transparent border border-blue-500/20 max-w-md shadow-2xs"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <Volume2 className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                                          {att.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                          Voice Memo / Audio Recording
                                        </p>
                                      </div>
                                    </div>
                                    <a
                                      href={resolveMediaUrl(att.url)}
                                      download={att.name}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors shrink-0"
                                      title="Download Audio"
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </div>
                                  <audio controls src={resolveMediaUrl(att.url)} className="w-full h-8" />
                                </div>
                              );
                            }

                            // Document / General File
                            return (
                              <a
                                key={idx}
                                href={resolveMediaUrl(att.url)}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-md hover:border-blue-500/40 hover:shadow-sm transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                                      {att.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      {formatFileSize(att.size)} &bull; Click to Open / Download
                                    </p>
                                  </div>
                                </div>
                                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                  <Download className="w-4 h-4" />
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Live Emoji Reactions Section (For Students & Staff) */}
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400">Reactions:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {allowedEmojis.map((emoji) => {
                            const count = reactionCounts[emoji] || 0;
                            const isMine = userReactedWith[emoji];
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg._id, emoji)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all active:scale-95 cursor-pointer ${
                                  isMine
                                    ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/40 scale-105 shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                                title={`React with ${emoji}`}
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span className="text-[11px] font-semibold">{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* COMPOSER SECTION (UPGRADED FOR MULTIMEDIA & PINNING) */}
            <div className="p-3 sm:p-4 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 space-y-2.5">
              {/* Quick Template Chips for Staff */}
              {isTeacherOrPrincipal && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Templates:
                  </span>
                  {quickTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDraftContent(tmpl.text)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs hover:scale-102"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Pending Attachments Preview Chips */}
              {attachments.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs shrink-0 shadow-2xs"
                    >
                      {att.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-blue-600" />}
                      {att.type === 'video' && <VideoIcon className="w-3.5 h-3.5 text-purple-600" />}
                      {att.type === 'audio' && <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {att.type === 'document' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
                      <div className="min-w-0 max-w-[160px]">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{att.name}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{formatFileSize(att.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="space-y-2.5">
                <div className="relative">
                  <textarea
                    rows={isStudent ? 2 : 3}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder={
                      isTeacherOrPrincipal
                        ? `Post official announcement or circular in ${selectedGroup.name}...`
                        : `Ask academic question or post student query in ${selectedGroup.name}...`
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-xs"
                  />
                </div>

                {/* Toolbar: Attachments + Options + Submit Button */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  {/* Left: Multimedia Attachment Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Attach Document */}
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-500/15 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="Attach Document (PDF, Word, Excel, TXT)"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">File</span>
                    </button>

                    {/* Attach Image */}
                    <button
                      type="button"
                      onClick={() => imgInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="Attach Photo / Image"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Photo</span>
                    </button>

                    {/* Attach Audio */}
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/15 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="Attach Voice Note / Audio Clip"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Audio</span>
                    </button>

                    {/* Attach Video */}
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-purple-500/15 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                      title="Attach Video Clip"
                    >
                      <VideoIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Video</span>
                    </button>

                    {/* Polish with AI Button (Teacher & Principal) */}
                    {isTeacherOrPrincipal && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!draftContent.trim()) {
                            addToast('Info', 'Type a quick draft first, then click Polish with AI!', 'info');
                            return;
                          }
                          setShowAiModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-emerald-300 bg-gradient-to-r from-blue-500/15 to-emerald-500/15 border border-blue-500/30 hover:border-emerald-500/60 transition-all shadow-2xs cursor-pointer"
                        title="Polish with Gemini AI"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span className="hidden sm:inline">Polish with AI</span>
                      </button>
                    )}

                    {/* Ask AI Bot Button (Available to Everyone: Students, Teachers, Principal!) */}
                    <button
                      type="button"
                      onClick={() => setShowAiChatModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all shadow-2xs cursor-pointer"
                      title="Ask VidyaCore AI Mentor / Chatbot"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="hidden sm:inline">Ask AI Bot</span>
                    </button>
                  </div>

                  {/* Right: Controls & Broadcast Button */}
                  <div className="flex items-center gap-2">
                    {/* Priority & Pinned (Teacher & Principal) */}
                    {isTeacherOrPrincipal && (
                      <>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                        >
                          <option value="normal">Standard Notice</option>
                          <option value="announcement">📢 Announcement</option>
                          <option value="urgent">🚨 Urgent Priority</option>
                        </select>

                        <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-[11px] font-semibold flex items-center gap-0.5">
                            <Pin className="w-3 h-3" /> Pin
                          </span>
                        </label>
                      </>
                    )}

                    {/* Send / Broadcast Button */}
                    <button
                      type="submit"
                      disabled={(!draftContent.trim() && attachments.length === 0) || sending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {sending
                          ? 'Sending...'
                          : isTeacherOrPrincipal
                          ? `Broadcast to ${selectedGroup.className === 'All' ? 'Campus' : 'Class ' + selectedGroup.className}`
                          : 'Post Question'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select an announcement group to view notices &amp; multimedia
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* AI NOTICE WRITER MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  ✨ AI Notice Writer &amp; Circular Polisher
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Desired Communication Tone:
              </label>
              <div className="flex gap-2">
                {['formal', 'urgent', 'encouraging'].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setAiTone(tone)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                      aiTone === tone
                        ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-xs font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Your Rough Draft:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto italic">
                "{draftContent}"
              </div>
            </div>

            {polishedPreview && (
              <div>
                <p className="text-[11px] font-semibold text-blue-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  AI Polished Circular Preview:
                </p>
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-900 dark:text-white max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {polishedPreview}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {!polishedPreview ? (
                <button
                  type="button"
                  onClick={handlePolishWithAi}
                  disabled={isPolishing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPolishing ? 'Generating Polish...' : 'Synthesize Formal Notice'}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePolishWithAi}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={applyPolishedText}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all cursor-pointer"
                  >
                    Apply to Composer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add Student to {selectedGroup.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Contact Number or Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. +91 98111 00001 or 10A01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  System verifies student enrollment and binds them to this channel with an instant alert.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {addingStudent ? 'Adding...' : 'Add Student Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASK AI ACADEMIC BOT MODAL */}
      {showAiChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[90dvh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    🤖 VidyaCore AI Academic Mentor &amp; Chatbot
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ask curriculum doubts, circular summaries, or homework step-by-step guidance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAiChatModal(false);
                  setAiChatAnswer('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggested Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {[
                "Newton's 2nd Law derivation",
                "Photosynthesis chemical equation",
                "Tips to prepare for Math Midterm",
                "Draft notice for Tomorrow's Holiday"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAiChatQuery(suggestion)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleAskAiAssistant} className="space-y-3 shrink-0">
              <div>
                <textarea
                  rows={3}
                  required
                  value={aiChatQuery}
                  onChange={(e) => setAiChatQuery(e.target.value)}
                  placeholder="Type your academic question, homework doubt, or notice query..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Context: {selectedGroup?.name}
                </span>
                <button
                  type="submit"
                  disabled={!aiChatQuery.trim() || aiChatLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiChatLoading ? 'Synthesizing Solution...' : 'Get Instant AI Answer'}</span>
                </button>
              </div>
            </form>

            {/* AI Response Display Area */}
            {aiChatAnswer && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-transparent border border-blue-500/25 overflow-y-auto flex-1 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Mentor Solution</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(aiChatAnswer);
                      addToast('Copied', 'Solution copied to clipboard!', 'info');
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 transition-all cursor-pointer"
                  >
                    Copy Answer
                  </button>
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {aiChatAnswer}
                </div>

                <div className="pt-2 border-t border-blue-500/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftContent((prev) => (prev ? `${prev}\n\n${aiChatAnswer}` : aiChatAnswer));
                      setShowAiChatModal(false);
                      setAiChatAnswer('');
                      addToast('Pasted', 'Inserted solution into message composer!', 'announcement');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all cursor-pointer"
                  >
                    Insert into Message Composer &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
