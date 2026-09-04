import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import Modal from "../components/admin/modal";
import ProfileCard from "../components/messages/ProfileCard";
import { useSelector, useDispatch } from "react-redux";
import { updateUser, uploadAvatar, uploadCover } from "../redux/userSlice";
import avatar from "../assets/logos/avatar.jpg";
import { v4 as uuidv4 } from "uuid";
import { FiUser, FiBookOpen, FiAward, FiCamera, FiEdit2, FiSave, FiMapPin } from "react-icons/fi";
import { useTranslation } from "react-i18next";

// Same language <-> flag mapping as ProfileCard/userModal/DisplayAllStudents,
// kept in sync deliberately so the same language always reads the same badge.
const LANGUAGE_FLAG = { english: "🇬🇧", spanish: "🇪🇸", polish: "🇵🇱" };
const ROLE_GRADIENT = {
  teacher: "linear-gradient(135deg, #26D9A1, #1fa07a)",
  admin: "linear-gradient(135deg, #F6B82E, #d49c1f)",
  user: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
};
// role is stored as "user" in the DB (an old naming choice) but should never
// be shown raw — reuses the same labels as the ProfileCard popup.
const ROLE_LABEL_KEY = {
  admin: "profileCard.roleAdmin",
  teacher: "profileCard.roleTeacher",
  user: "profileCard.roleStudent",
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const inputBase =
  "w-full mt-1 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]/20 focus:border-[#9E2FD0]/50 transition-colors border border-gray-200 dark:border-[#9E2FD0]/25 bg-white dark:bg-[#252545]";
const inputReadOnly =
  "w-full mt-1 rounded-xl py-2.5 px-3.5 text-sm text-gray-500 dark:text-gray-400 focus:outline-none border border-gray-200 dark:border-[#9E2FD0]/15 bg-gray-50 dark:bg-[#1c1c38] cursor-default";

const Profile = () => {
  const user = useSelector((state) => state.user.userInfo.user);
  const { t } = useTranslation();
  const header = t("profile.header");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [postal, setPostal] = useState("");
  const [biography, setBiography] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [teacherAssigned, setTeacherAssigned] = useState("");
  const [teacherIdAssigned, setTeacherIdAssigned] = useState("");
  const [viewedProfile, setViewedProfile] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setCountry(user.country || "");
      setPostal(user.postal || "");
      setBiography(user.biography || "");
      setAvatarUrl(user.avatarUrl || "");
      setCoverUrl(user.coverUrl || "");

      if (user.role === "user" && user.studentSchedules && user.studentSchedules.length > 0) {
        setTeacherAssigned(user.studentSchedules[0].teacherName);
        setTeacherIdAssigned(user.studentSchedules[0].teacherId || "");
      } else {
        setTeacherAssigned("");
        setTeacherIdAssigned("");
      }
    }
  }, [user]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Real, derivable stats only — never a fabricated "level" or streak.
  const classesCount = user.role === "teacher"
    ? (user.teacherSchedules?.length || 0)
    : (user.studentSchedules?.length || 0);
  // createdAt is null for accounts created before this field existed — in
  // that case we simply don't show a join date rather than guessing one.
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  const handleViewProfile = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/users/${userId}/public-profile`, { headers: authHeaders() });
      if (!res.ok) return;
      setViewedProfile(await res.json());
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleMessageFromProfile = (person) => {
    setViewedProfile(null);
    navigate("/messages", {
      state: {
        openDmWithUserId: person.id,
        openDmWithName: person.name,
        openDmWithLastName: person.lastName || "",
        // Needed so Messages' "offer to schedule a class" teacher->student
        // prompt (see promptScheduleForStudentDm) still fires when the DM
        // is opened from here instead of from inside Messages itself.
        openDmWithRole: person.role,
      },
    });
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenCoverModal = () => setIsCoverModalOpen(true);
  const handleCloseCoverModal = () => setIsCoverModalOpen(false);

  const handleSaveAvatar = (file) => {
    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const formData = new FormData();
    formData.append("file", file, uniqueFileName);
    formData.append("userId", user.id);

    dispatch(uploadAvatar(formData))
      .then((response) => {
        if (response.meta.requestStatus === "fulfilled") {
          setIsModalOpen(false);
        }
      })
      .catch((error) => console.error("Error:", error));
  };

  const handleSaveCover = (file) => {
    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const formData = new FormData();
    formData.append("file", file, uniqueFileName);
    formData.append("userId", user.id);

    dispatch(uploadCover(formData))
      .then((response) => {
        if (response.meta.requestStatus === "fulfilled") {
          setIsCoverModalOpen(false);
        }
      })
      .catch((error) => console.error("Error:", error));
  };

  const handleEditProfile = () => setIsEditMode(true);

  const handleSaveProfile = () => {
    const updatedUser = { name, lastName, phone, email, address, city, country, postal, biography };
    dispatch(updateUser(updatedUser))
      .then((response) => {
        if (response.meta.requestStatus === "fulfilled") {
          setIsEditMode(false);
        } else {
          console.error("Failed to update user:", response.error.message);
        }
      })
      .catch((error) => console.error("Error in updating user:", error));
  };

  return (
    <div className="flex w-full relative min-h-screen">
      {/* Page background */}
      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }}
      />
      {/* Ambient orbs — dark mode */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)",
            width: "600px", height: "600px", top: "-10%", right: "-5%",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-8"
          style={{
            background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)",
            width: "400px", height: "400px", bottom: "5%", left: "10%",
          }}
        />
      </div>
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.012] dark:opacity-[0.020]"
        style={{
          backgroundImage: `linear-gradient(rgba(158,47,208,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(158,47,208,0.8) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <Dashboard />

      <div className="w-full relative z-10 flex flex-col min-h-screen overflow-y-auto">
        {/* Navbar — no container wrapper */}
        <Navbar header={header} />

        <div className="px-4 pb-8 mt-4 flex-1">
          {/* ── Hero banner ── */}
          <div
            className="relative rounded-2xl overflow-hidden mb-6"
            style={{
              border: "1px solid rgba(158,47,208,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-80" />
            {/* Glass bg */}
            <div
              className="absolute inset-0 dark:hidden"
              style={{
                background: "linear-gradient(135deg, rgba(158,47,208,0.08) 0%, rgba(246,184,46,0.04) 100%)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              }}
            />
            <div
              className="absolute inset-0 hidden dark:block"
              style={{
                background: "linear-gradient(135deg, rgba(158,47,208,0.18) 0%, rgba(13,10,30,0.70) 100%)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              }}
            />
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-5 gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight login-gradient-text">
                  {t("profile.hello", { name })}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  {t("profile.subtitle")}
                </p>
              </div>
              {!isEditMode ? (
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85 flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                    boxShadow: "0 4px 15px rgba(158,47,208,0.35)",
                  }}
                >
                  <FiEdit2 size={15} />
                  {t("profile.editProfile")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85 flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #26D9A1, #1fa07a)",
                    boxShadow: "0 4px 15px rgba(38,217,161,0.35)",
                  }}
                >
                  <FiSave size={15} />
                  {t("profile.saveChanges")}
                </button>
              )}
            </div>
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Right: Avatar + Info card ── */}
            <div className="lg:col-span-1 lg:order-2">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(158,47,208,0.15)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
                }}
              >
                <div
                  className="absolute inset-0 dark:hidden"
                  style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                />
                <div
                  className="absolute inset-0 hidden dark:block"
                  style={{ background: "rgba(26,26,46,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                />

                {/* Cover banner — a custom photo if the user set one, otherwise a
                    role-colored gradient (same fallback treatment as the ProfileCard
                    popup) so the identity card never looks unfinished */}
                <div
                  className="relative h-20 overflow-hidden group"
                  style={
                    coverUrl
                      ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: ROLE_GRADIENT[user.role] || ROLE_GRADIENT.user }
                  }
                >
                  {!coverUrl && (
                    <>
                      <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), transparent 60%)" }} />
                      <div className="absolute w-28 h-28 rounded-full bg-white/10 blur-2xl -top-8 -right-4" />
                      <div className="absolute w-20 h-20 rounded-full bg-black/10 blur-2xl -bottom-8 -left-4" />
                    </>
                  )}
                  {coverUrl && <div className="absolute inset-0 bg-black/15" />}
                  <button
                    onClick={handleOpenCoverModal}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
                    title={t("profile.changeCover")}
                  >
                    <FiCamera size={13} />
                  </button>
                  <Modal isOpen={isCoverModalOpen} onClose={handleCloseCoverModal} onSave={handleSaveCover} />
                </div>

                <div className="relative z-10 px-6 pb-6 flex flex-col items-center -mt-10">
                  {/* Avatar with spinning conic ring */}
                  <div className="relative mb-3">
                    <div className="relative w-24 h-24">
                      {/* Spinning gradient ring */}
                      <div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          inset: "-4px",
                          background: "conic-gradient(from 0deg, #9E2FD0, #c084fc, #F6B82E, #26D9A1, #9E2FD0)",
                          animation: "spin 7s linear infinite",
                          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
                          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))",
                          opacity: 0.85,
                        }}
                      />
                      <img
                        src={!avatarUrl ? avatar : avatarUrl}
                        alt="avatar"
                        className="relative w-full h-full object-cover rounded-full ring-4 ring-white dark:ring-[#1a1a2e]"
                      />
                      {/* Camera button */}
                      <button
                        onClick={handleOpenModal}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-85"
                        style={{
                          background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                          boxShadow: "0 2px 8px rgba(158,47,208,0.45)",
                        }}
                      >
                        <FiCamera size={14} />
                      </button>
                      <Modal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveAvatar} />
                    </div>
                  </div>

                  {/* Name + role */}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight text-center">
                    {name} {lastName}
                  </h3>
                  <div className="mt-1.5 flex items-center justify-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-3 py-0.5 rounded-full text-white"
                      style={{ background: ROLE_GRADIENT[user.role] || ROLE_GRADIENT.user }}
                    >
                      {t(ROLE_LABEL_KEY[user.role] || "profileCard.roleStudent")}
                    </span>
                    {user.language && LANGUAGE_FLAG[user.language] && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                        {LANGUAGE_FLAG[user.language]} {user.language.charAt(0).toUpperCase() + user.language.slice(1)}
                      </span>
                    )}
                  </div>
                  {(city || country) && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <FiMapPin size={12} />
                      {[city, country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {biography && (
                    <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300 italic text-center">
                      “{biography}”
                    </p>
                  )}

                  {/* Stats strip — only real, derivable numbers */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-center">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{classesCount}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        {t(user.role === "teacher" ? "profile.classesTaught" : "profile.classesTaken")}
                      </p>
                    </div>
                    {memberSince && (
                      <>
                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{memberSince}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                            {t("profile.memberSince")}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="w-full mt-6">
                    {/* Gradient divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/20 to-transparent mb-5" />

                    {/* Student — My Learning */}
                    {user.role === "user" && (
                      <>
                        <h4 className="text-xs font-bold tracking-widest text-[#9E2FD0] dark:text-[#c084fc] uppercase mb-4">
                          {t("profile.myLearning")}
                        </h4>
                        <div className="space-y-3">
                          {[
                            { icon: FiUser, label: t("profile.myTeacher"), value: teacherAssigned || t("profile.notAssigned"), color: "#9E2FD0", onClick: teacherIdAssigned ? () => handleViewProfile(teacherIdAssigned) : null },
                            { icon: FiBookOpen, label: t("profile.language"), value: user.language ? user.language.charAt(0).toUpperCase() + user.language.slice(1) : "N/A", color: "#26D9A1" },
                            { icon: FiAward, label: t("profile.classesTaken"), value: classesCount, color: "#F6B82E" },
                          ].map(({ icon: Icon, label, value, color, onClick }) => (
                            <div
                              key={label}
                              onClick={onClick || undefined}
                              className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#9E2FD0]/20 bg-white/60 dark:bg-[#1e1e38] ${onClick ? "cursor-pointer hover:border-[#9E2FD0]/50 hover:bg-white dark:hover:bg-[#252545] transition-colors" : ""}`}
                            >
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                              >
                                <Icon size={16} style={{ color }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{label}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Teacher — My Students */}
                    {user.role === "teacher" && (
                      <>
                        <h4 className="text-xs font-bold tracking-widest text-[#9E2FD0] dark:text-[#c084fc] uppercase mb-4">
                          {t("profile.myStudents")}
                        </h4>
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                          {user.students && user.students.length > 0 ? (
                            user.students.map((student) => (
                              <div
                                key={student.id}
                                onClick={() => handleViewProfile(student.id)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#9E2FD0]/20 bg-white/60 dark:bg-[#1e1e38] cursor-pointer hover:border-[#9E2FD0]/50 hover:bg-white dark:hover:bg-[#252545] transition-colors"
                              >
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background: "rgba(158,47,208,0.10)", border: "1px solid rgba(158,47,208,0.20)" }}
                                >
                                  <FiUser size={16} style={{ color: "#9E2FD0" }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {student.name} {student.lastName}
                                  </p>
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{student.email}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">
                              {t("profile.noStudents")}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Left: Account form ── */}
            <div className="lg:col-span-2 lg:order-1">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(158,47,208,0.15)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
                }}
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-60" />
                <div
                  className="absolute inset-0 dark:hidden"
                  style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                />
                <div
                  className="absolute inset-0 hidden dark:block"
                  style={{ background: "rgba(26,26,46,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
                />

                {/* Card header */}
                <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/15 mt-[2px]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.35)" }}
                    >
                      <FiUser size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-extrabold login-gradient-text">{t("profile.myAccount")}</span>
                  </div>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-85"
                      style={{
                        background: "linear-gradient(135deg, #26D9A1, #1fa07a)",
                        boxShadow: "0 2px 8px rgba(38,217,161,0.35)",
                      }}
                    >
                      <FiSave size={13} /> {t("profile.save")}
                    </button>
                  )}
                </div>

                {/* Form */}
                <div className="relative z-10 p-6">
                  <form>
                    {/* Section: About Me — the "headline" of a social profile, so it
                        leads the form instead of being buried under logistics fields */}
                    <p className="text-[11px] font-bold tracking-widest text-[#9E2FD0] dark:text-[#c084fc] uppercase mb-4">
                      {t("profile.aboutMe")}
                    </p>
                    <div className="mb-6">
                      <textarea
                        id="biography"
                        name="biography"
                        value={biography || ""}
                        onChange={(e) => setBiography(e.target.value)}
                        placeholder={isEditMode ? t("profile.biographyPlaceholder") : ""}
                        className={`${isEditMode ? inputBase : inputReadOnly} resize-none`}
                        rows="3"
                        readOnly={!isEditMode}
                      />
                    </div>

                    {/* Gradient divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/15 to-transparent mb-6" />

                    {/* Section: User Information */}
                    <p className="text-[11px] font-bold tracking-widest text-[#9E2FD0] dark:text-[#c084fc] uppercase mb-4">
                      {t("profile.userInformation")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label htmlFor="name" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("profile.name")}</label>
                        <input type="text" id="name" name="name" value={name || ""} onChange={(e) => setName(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("profile.lastName")}</label>
                        <input type="text" id="lastName" name="lastName" value={lastName || ""} onChange={(e) => setLastName(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                      </div>
                      <div>
                        <label htmlFor="phone" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("profile.phone")}</label>
                        <input type="number" id="phone" name="phone" value={phone || ""} onChange={(e) => setPhone(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("profile.email")}</label>
                        <input type="email" id="email" name="email" value={email || ""} readOnly className={inputReadOnly} />
                      </div>
                    </div>

                    {/* Gradient divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/15 to-transparent mb-6" />

                    {/* Section: Location — just city/country, like a social profile.
                        Address and postal code were dropped: nobody looking at a
                        classmate's profile needs a mailing address. */}
                    <p className="text-[11px] font-bold tracking-widest text-[#9E2FD0] dark:text-[#c084fc] uppercase mb-4">
                      {t("profile.location")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("profile.city")}</label>
                        <input type="text" id="city" name="city" value={city || ""} onChange={(e) => setCity(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                      </div>
                      <div>
                        <label htmlFor="country" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("profile.country")}</label>
                        <input type="text" id="country" name="country" value={country || ""} onChange={(e) => setCountry(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {viewedProfile && (
        <ProfileCard
          user={viewedProfile}
          isSelf={viewedProfile.id === user.id}
          onClose={() => setViewedProfile(null)}
          onMessage={handleMessageFromProfile}
        />
      )}
    </div>
  );
};

export default Profile;
