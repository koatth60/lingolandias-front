import { useState } from "react";
import { FiChevronDown, FiInfo, FiX, FiMail, FiHelpCircle, FiMessageCircle } from "react-icons/fi";
import Dashboard from "../../sections/dashboard";
import Navbar from "../navbar";

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
          <span className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white leading-snug">
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
  const [showBanner, setShowBanner] = useState(true);

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: (
        <div>
          <p>To reset your password, follow these steps:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Go to the login page and click on the "Forgot Password?" link.</li>
            <li>Enter the email address associated with your account.</li>
            <li>You will receive an email with a link to reset your password.</li>
            <li>Click the link and follow the instructions to create a new password.</li>
          </ol>
        </div>
      ),
    },
    {
      question: "How do I join a class?",
      answer: 'To join a class, go to your dashboard and click on the "Join Class" button for the upcoming session. You will be redirected to the virtual classroom.',
    },
    {
      question: "How do I contact support?",
      answer: "You can contact our support team by emailing us at support@lingolandias.com or by using the contact form on our website. We are available 24/7 to assist you.",
    },
  ];

  return (
    <div className="flex w-full relative min-h-screen">
      {/* Page backgrounds */}
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
      {/* Ambient orbs */}
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

          {/* ── Demo banner ── */}
          {showBanner && (
            <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(246,184,46,0.28)" }}>
              <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(246,184,46,0.07)" }} />
              <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(246,184,46,0.06)" }} />
              <div className="relative z-10 flex items-start sm:items-center justify-between gap-3 p-4">
                <div className="flex items-start sm:items-center gap-3">
                  <FiInfo size={15} style={{ color: "#F6B82E" }} className="flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    This page is for demonstration purposes only. Links and some content are placeholders.
                  </p>
                </div>
                <button onClick={() => setShowBanner(false)} className="flex-shrink-0 transition-opacity hover:opacity-60">
                  <FiX size={15} style={{ color: "#F6B82E" }} />
                </button>
              </div>
            </div>
          )}

          {/* ── Hero ── */}
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

          {/* ── FAQ card ── */}
          <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
            <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-70" />
            <div className="relative z-10 p-5 sm:p-7">
              <div className="flex items-center gap-2 mb-5">
                <FiMessageCircle size={16} style={{ color: "#9E2FD0" }} />
                <h2 className="text-base sm:text-lg font-extrabold text-gray-800 dark:text-white">
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

          {/* ── Contact card ── */}
          <div className="relative rounded-2xl overflow-hidden text-center" style={glassCard}>
            <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #26D9A1, #9E2FD0, transparent)" }} />
            <div className="relative z-10 p-6 sm:p-10">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(38,217,161,0.12)", border: "1px solid rgba(38,217,161,0.28)" }}
              >
                <FiMail size={20} style={{ color: "#26D9A1" }} />
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-800 dark:text-white mb-2">
                Still need help?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Our support team is always here to help. Reach out to us anytime.
              </p>
              <a
                href="mailto:support@lingolandias.com"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", boxShadow: "0 4px 20px rgba(38,217,161,0.35)" }}
              >
                <FiMail size={14} />
                Contact Support
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
