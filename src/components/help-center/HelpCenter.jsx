import { useState } from "react";
import { useSelector } from "react-redux";
import {
  FiChevronDown, FiMail, FiHelpCircle, FiMessageCircle,
  FiSend, FiCheckCircle, FiAlertCircle,
} from "react-icons/fi";
import Dashboard from "../../sections/dashboard";
import Navbar from "../navbar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const glassCard = {
  border: "1px solid rgba(158,47,208,0.15)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
};

const FaqItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = ["#9E2FD0", "#26D9A1", "#F6B82E"];
  const accentColor = colors[index % colors.length];

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-200"
      style={{
        border: `1px solid ${isOpen ? accentColor + "35" : "rgba(158,47,208,0.10)"}`,
        background: isOpen ? `${accentColor}06` : "transparent",
      }}
    >
      <button
        className="w-full flex justify-between items-center text-left p-4 sm:p-5 gap-4 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isOpen && (
            <div
              className="w-1 h-5 rounded-full flex-shrink-0"
              style={{ background: `linear-gradient(to bottom, ${accentColor}, transparent)` }}
            />
          )}
          <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-white leading-snug">
            {question}
          </span>
        </div>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: isOpen ? accentColor : "rgba(158,47,208,0.08)",
            border: `1px solid ${isOpen ? accentColor : "rgba(158,47,208,0.18)"}`,
          }}
        >
          <FiChevronDown
            size={14}
            style={{ color: isOpen ? "#fff" : accentColor, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <div className="h-px mb-4 opacity-20" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

const HelpCenter = () => {
  const userInfo = useSelector((state) => state.user.userInfo);
  const user = userInfo?.user;

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: (
        <div>
          <p>To reset your password, follow these steps:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Go to the login page and click on the <strong>"Forgot Password?"</strong> link.</li>
            <li>Enter the email address associated with your account.</li>
            <li>You will receive an email with a link to reset your password.</li>
            <li>Click the link and follow the instructions to create a new password.</li>
          </ol>
          <p className="mt-2">You can also change your password at any time from <strong>Settings → Account → Change Password</strong>.</p>
        </div>
      ),
    },
    {
      question: "How do I join a class?",
      answer: (
        <div>
          <p>There are two ways to join your class:</p>
          <ol className="list-decimal list-inside mt-2 space-y-2">
            <li>
              <strong>From the Home screen:</strong> When your class is about to start, a <strong>"Join Class"</strong> button will appear on your dashboard. Click it to enter the virtual classroom instantly.
            </li>
            <li>
              <strong>From your Schedule:</strong> Go to the <strong>Schedule</strong> page, find your upcoming class, and click on your <strong>teacher's name</strong>. This will take you directly into the class session.
            </li>
          </ol>
          <p className="mt-2">Make sure your camera and microphone are allowed in your browser before joining.</p>
        </div>
      ),
    },
    {
      question: "How do I activate class reminders?",
      answer: (
        <div>
          <p>Class reminders send you a push notification <strong>10 minutes before</strong> each scheduled class. To activate them:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Go to <strong>Settings → Notifications</strong>.</li>
            <li>Toggle on <strong>Class Reminders</strong>.</li>
            <li>When your browser asks for permission to send notifications, click <strong>Allow</strong>.</li>
          </ol>
          <p className="mt-2">If you previously blocked notifications, you will need to allow them in your browser settings first, then toggle the reminder off and back on to re-register.</p>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!subject.trim() || !message.trim()) {
      setFormError("Please fill in both the subject and message.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${BACKEND_URL}/mail/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: user?.name || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          language: user?.language || "Not specified",
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send");
      setSent(true);
      setSubject("");
      setMessage("");
    } catch {
      setFormError("Something went wrong. Please try again or email us directly at agata@lingolandias.net");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    background: "rgba(158,47,208,0.04)",
    border: "1px solid rgba(158,47,208,0.18)",
    borderRadius: "10px",
    color: "inherit",
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div className="flex w-full relative min-h-screen">
      {/* Backgrounds */}
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)", width: "500px", height: "500px", top: "-5%", right: "0%" }} />
        <div className="absolute rounded-full blur-3xl opacity-8"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "350px", height: "350px", bottom: "10%", left: "5%" }} />
      </div>

      <Dashboard />

      <div className="w-full min-w-0 relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar header="Help Center" />

        <div className="px-3 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-6 sm:gap-10 max-w-4xl mx-auto w-full">

          {/* Hero */}
          <div className="text-center py-2 sm:py-6">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
              style={{ background: "rgba(158,47,208,0.10)", border: "1px solid rgba(158,47,208,0.25)", color: "#9E2FD0" }}
            >
              <FiHelpCircle size={11} />
              Support
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold login-gradient-text mb-3">
              Lingolandias Help Center
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Your success is our priority. Find the help you need below.
            </p>
            <div className="h-px mt-5 mx-auto max-w-xs opacity-40"
              style={{ background: "linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, #26D9A1, transparent)" }} />
          </div>

          {/* FAQ card */}
          <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
            <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.80)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-70" />
            <div className="relative z-10 p-5 sm:p-7">
              <div className="flex items-center gap-2 mb-5">
                <FiMessageCircle size={16} style={{ color: "#9E2FD0" }} />
                <h2 className="text-base sm:text-lg font-extrabold text-gray-700 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <FaqItem key={index} question={faq.question} answer={faq.answer} index={index} />
                ))}
              </div>
            </div>
          </div>

          {/* Contact form card */}
          <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
            <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.80)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #26D9A1, #9E2FD0, transparent)" }} />
            <div className="relative z-10 p-5 sm:p-7">

              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(38,217,161,0.12)", border: "1px solid rgba(38,217,161,0.28)" }}
                >
                  <FiMail size={15} style={{ color: "#26D9A1" }} />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-700 dark:text-white">
                  Contact Support
                </h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 ml-10">
                Our team will get back to you as soon as possible.
              </p>

              {sent ? (
                <div
                  className="flex flex-col items-center gap-3 py-8 text-center rounded-xl"
                  style={{ background: "rgba(38,217,161,0.06)", border: "1px solid rgba(38,217,161,0.20)" }}
                >
                  <FiCheckCircle size={32} style={{ color: "#26D9A1" }} />
                  <p className="text-sm font-semibold text-gray-700 dark:text-white">Message sent!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">We'll get back to you at <strong>{user?.email}</strong>.</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "rgba(38,217,161,0.12)", color: "#26D9A1", border: "1px solid rgba(38,217,161,0.25)" }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Read-only user info row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Name</label>
                      <input
                        type="text"
                        readOnly
                        value={`${user?.name || ""} ${user?.lastName || ""}`.trim()}
                        className="dark:text-white text-gray-500"
                        style={{ ...inputStyle, opacity: 0.8, cursor: "default" }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
                      <input
                        type="text"
                        readOnly
                        value={user?.email || ""}
                        className="dark:text-white text-gray-500"
                        style={{ ...inputStyle, opacity: 0.8, cursor: "default" }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Language</label>
                      <input
                        type="text"
                        readOnly
                        value={user?.language || "Not specified"}
                        className="dark:text-white text-gray-500"
                        style={{ ...inputStyle, opacity: 0.8, cursor: "default" }}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Subject</label>
                    <input
                      type="text"
                      placeholder="What do you need help with?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="dark:text-white text-gray-700 placeholder-gray-400 focus:border-[#9E2FD0]"
                      style={inputStyle}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Describe your issue in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="dark:text-white text-gray-800 placeholder-gray-400 focus:border-[#9E2FD0] resize-none"
                      style={inputStyle}
                    />
                  </div>

                  {formError && (
                    <div className="flex items-start gap-2 text-xs text-red-400 p-3 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.20)" }}>
                      <FiAlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="self-end flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #9E2FD0, #7a20a8)", boxShadow: "0 4px 20px rgba(158,47,208,0.35)" }}
                  >
                    <FiSend size={14} />
                    {sending ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
