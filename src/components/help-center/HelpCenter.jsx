import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  FiChevronDown,
  FiSend, FiCheckCircle, FiAlertCircle,
} from "react-icons/fi";
import Dashboard from "../../sections/dashboard";
import Navbar from "../layout/navbar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-ll-line first:border-t-0">
      <button
        className="w-full flex justify-between items-center text-left py-3.5 gap-4 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-[14px] font-medium text-ll-ink leading-snug">{question}</span>
        <FiChevronDown
          size={16}
          className={`flex-shrink-0 text-ll-ink3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-[13.5px] text-ll-ink2 leading-relaxed max-w-[62ch]">
          {answer}
        </div>
      )}
    </div>
  );
};

const HelpCenter = () => {
  const { t } = useTranslation();
  const userInfo = useSelector((state) => state.user.userInfo);
  const user = userInfo?.user;

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const faqs = [
    {
      question: t("helpCenter.faqItems.q1"),
      answer: (
        <div>
          <p>{t("helpCenter.faqItems.a1_intro")}</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>{t("helpCenter.faqItems.a1_step1")}</li>
            <li>{t("helpCenter.faqItems.a1_step2")}</li>
            <li>{t("helpCenter.faqItems.a1_step3")}</li>
            <li>{t("helpCenter.faqItems.a1_step4")}</li>
          </ol>
          <p className="mt-2">{t("helpCenter.faqItems.a1_footer")}</p>
        </div>
      ),
    },
    {
      question: t("helpCenter.faqItems.q2"),
      answer: (
        <div>
          <p>{t("helpCenter.faqItems.a2_intro")}</p>
          <ol className="list-decimal list-inside mt-2 space-y-2">
            <li>{t("helpCenter.faqItems.a2_step1")}</li>
            <li>{t("helpCenter.faqItems.a2_step2")}</li>
          </ol>
          <p className="mt-2">{t("helpCenter.faqItems.a2_footer")}</p>
        </div>
      ),
    },
    {
      question: t("helpCenter.faqItems.q3"),
      answer: (
        <div>
          <p>{t("helpCenter.faqItems.a3_intro")}</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>{t("helpCenter.faqItems.a3_step1")}</li>
            <li>{t("helpCenter.faqItems.a3_step2")}</li>
            <li>{t("helpCenter.faqItems.a3_step3")}</li>
          </ol>
          <p className="mt-2">{t("helpCenter.faqItems.a3_footer")}</p>
        </div>
      ),
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!subject.trim() || !message.trim()) {
      setFormError(t("helpCenter.fillBoth"));
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
          language: user?.language || t("common.notSpecified"),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send");
      setSent(true);
      setSubject("");
      setMessage("");
    } catch {
      setFormError(t("helpCenter.error"));
    } finally {
      setSending(false);
    }
  };

  const field = "w-full h-9 mt-1 rounded-lg px-3 text-[13.5px] text-ll-ink bg-ll-panel border border-ll-line2 outline-none focus:border-ll-violet/60 transition-colors placeholder:text-ll-ink3";
  const fieldRO = "w-full h-9 mt-1 rounded-lg px-3 text-[13.5px] text-ll-ink2 bg-ll-subtle border border-ll-line cursor-default outline-none";
  const labelCls = "text-[12.5px] font-medium text-ll-ink2";

  return (
    <div className="flex w-full relative min-h-screen bg-ll-canvas">
      <Dashboard />

      <div className="ll-shell w-full min-w-0 relative z-10 flex flex-col">
        <Navbar header={t("nav.helpCenter")} />

        <div className="px-3 sm:px-7 py-5 sm:py-8 flex flex-col gap-9 max-w-3xl mx-auto w-full">

          <div>
            <h1 className="hw-gothic text-[22px] font-semibold tracking-[-0.02em] text-ll-ink">
              {t("helpCenter.title")}
            </h1>
            <p className="text-[13.5px] text-ll-ink3 mt-1">{t("helpCenter.subtitle")}</p>
          </div>

          {/* FAQ */}
          <section>
            <h2 className="text-[13.5px] font-semibold text-ll-ink mb-1">{t("helpCenter.faq")}</h2>
            <div className="border-y border-ll-line">
              {faqs.map((faq, index) => (
                <FaqItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-[13.5px] font-semibold text-ll-ink">{t("helpCenter.contactSupport")}</h2>
            <p className="text-[13px] text-ll-ink3 mt-0.5 mb-4">{t("helpCenter.teamReply")}</p>

            {sent ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-ll-line bg-ll-subtle">
                <FiCheckCircle size={26} className="text-ll-teal" />
                <p className="text-[14px] font-semibold text-ll-ink">{t("helpCenter.sent")}</p>
                <p className="text-[12.5px] text-ll-ink3">{t("helpCenter.sentSubtitle", { email: user?.email })}</p>
                <button onClick={() => setSent(false)} className="ll-btn ll-btn-secondary ll-btn-sm mt-2">
                  {t("helpCenter.sendAnother")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t("helpCenter.name")}</label>
                    <input type="text" readOnly value={`${user?.name || ""} ${user?.lastName || ""}`.trim()} className={fieldRO} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("helpCenter.email")}</label>
                    <input type="text" readOnly value={user?.email || ""} className={fieldRO} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("helpCenter.language")}</label>
                    <input type="text" readOnly value={user?.language || t("common.notSpecified")} className={fieldRO} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>{t("helpCenter.subject")}</label>
                  <input
                    type="text"
                    placeholder={t("helpCenter.subjectPlaceholder")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={field}
                  />
                </div>

                <div>
                  <label className={labelCls}>{t("helpCenter.message")}</label>
                  <textarea
                    rows={5}
                    placeholder={t("helpCenter.messagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${field} !h-auto py-2 resize-none`}
                  />
                </div>

                {formError && (
                  <div className="flex items-start gap-2 text-[12.5px] text-red-500 p-3 rounded-lg bg-red-500/[0.07] border border-red-500/20">
                    <FiAlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    {formError}
                  </div>
                )}

                <button type="submit" disabled={sending} className="ll-btn ll-btn-primary self-end disabled:opacity-60">
                  <FiSend size={14} />
                  {sending ? t("helpCenter.sending") : t("helpCenter.send")}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
