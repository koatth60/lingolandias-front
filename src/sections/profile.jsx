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
const ROLE_TINT = {
  teacher: "bg-ll-teal-tint text-ll-teal-ink",
  admin: "bg-ll-gold-tint text-ll-gold-ink",
  user: "bg-ll-violet-tint text-ll-violet-ink",
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
  "w-full mt-1 h-9 rounded-lg px-3 text-[13.5px] text-ll-ink bg-ll-panel border border-ll-line2 focus:outline-none focus:border-ll-violet/60 transition-colors";
const inputReadOnly =
  "w-full mt-1 h-9 rounded-lg px-3 text-[13.5px] text-ll-ink2 bg-ll-subtle border border-ll-line cursor-default focus:outline-none";
const labelCls = "text-[12.5px] font-medium text-ll-ink2";

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
    <div className="flex w-full relative min-h-screen bg-ll-canvas">
      <Dashboard />

      <div className="ll-shell w-full relative z-10 flex flex-col min-w-0">
        <Navbar header={header} />

        <div className="px-3 sm:px-7 pb-10 pt-3 sm:pt-5 flex-1 w-full max-w-6xl mx-auto">
          {/* ── Identity header: cover strip, avatar, name, edit ── */}
          <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden group border border-ll-line"
            style={coverUrl
              ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined}>
            {!coverUrl && <div className={`absolute inset-0 ${ROLE_TINT[user.role] || ROLE_TINT.user}`} />}
            <button
              onClick={handleOpenCoverModal}
              className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center bg-ll-panel/90 border border-ll-line text-ll-ink2 hover:text-ll-ink sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              title={t("profile.changeCover")}
            >
              <FiCamera size={14} />
            </button>
            <Modal isOpen={isCoverModalOpen} onClose={handleCloseCoverModal} onSave={handleSaveCover} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 px-1 sm:px-4 mt-3">
            <div className="relative w-[84px] h-[84px] flex-shrink-0 -mt-12 sm:-mt-14">
              <img
                src={!avatarUrl ? avatar : avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover rounded-full ring-4 ring-[rgb(var(--ll-panel))]"
              />
              <button
                onClick={handleOpenModal}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center bg-ll-violet text-ll-on-violet ring-2 ring-[rgb(var(--ll-panel))] hover:bg-ll-violet-hover transition-colors"
                title={t("profile.changeAvatar", { defaultValue: "Change photo" })}
              >
                <FiCamera size={13} />
              </button>
              <Modal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveAvatar} />
            </div>

            <div className="flex-1 min-w-0 sm:pb-1">
              <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-ll-ink truncate">
                {name} {lastName}
              </h2>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[12.5px]">
                <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11.5px] font-medium ${ROLE_TINT[user.role] || ROLE_TINT.user}`}>
                  {t(ROLE_LABEL_KEY[user.role] || "profileCard.roleStudent")}
                </span>
                {user.language && LANGUAGE_FLAG[user.language] && (
                  <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11.5px] font-medium bg-ll-hover text-ll-ink2">
                    {LANGUAGE_FLAG[user.language]} {user.language.charAt(0).toUpperCase() + user.language.slice(1)}
                  </span>
                )}
                {(city || country) && (
                  <span className="inline-flex items-center gap-1 text-ll-ink3">
                    <FiMapPin size={12} />
                    {[city, country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:pb-1">
              {!isEditMode ? (
                <button type="button" onClick={handleEditProfile} className="ll-btn ll-btn-secondary">
                  <FiEdit2 size={14} />
                  {t("profile.editProfile")}
                </button>
              ) : (
                <button type="button" onClick={handleSaveProfile} className="ll-btn ll-btn-primary">
                  <FiSave size={14} />
                  {t("profile.saveChanges")}
                </button>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12">

            {/* Left: account form */}
            <form className="min-w-0 divide-y divide-ll-line [&>section]:py-6 [&>section:first-child]:pt-0">
              <section>
                <h3 className="text-[13.5px] font-semibold text-ll-ink mb-3">{t("profile.aboutMe")}</h3>
                <textarea
                  id="biography"
                  name="biography"
                  value={biography || ""}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder={isEditMode ? t("profile.biographyPlaceholder") : ""}
                  className={`${isEditMode ? inputBase : inputReadOnly} !h-auto py-2 resize-none`}
                  rows="3"
                  readOnly={!isEditMode}
                />
              </section>

              <section>
                <h3 className="text-[13.5px] font-semibold text-ll-ink mb-3">{t("profile.userInformation")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className={labelCls}>{t("profile.name")}</label>
                    <input type="text" id="name" name="name" value={name || ""} onChange={(e) => setName(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelCls}>{t("profile.lastName")}</label>
                    <input type="text" id="lastName" name="lastName" value={lastName || ""} onChange={(e) => setLastName(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelCls}>{t("profile.phone")}</label>
                    <input type="number" id="phone" name="phone" value={phone || ""} onChange={(e) => setPhone(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelCls}>{t("profile.email")}</label>
                    <input type="email" id="email" name="email" value={email || ""} readOnly className={inputReadOnly} />
                  </div>
                </div>
              </section>

              {/* Location — just city/country, like a social profile. Address and
                  postal code were dropped: nobody looking at a classmate's profile
                  needs a mailing address. */}
              <section>
                <h3 className="text-[13.5px] font-semibold text-ll-ink mb-3">{t("profile.location")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className={labelCls}>{t("profile.city")}</label>
                    <input type="text" id="city" name="city" value={city || ""} onChange={(e) => setCity(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                  </div>
                  <div>
                    <label htmlFor="country" className={labelCls}>{t("profile.country")}</label>
                    <input type="text" id="country" name="country" value={country || ""} onChange={(e) => setCountry(e.target.value)} className={isEditMode ? inputBase : inputReadOnly} readOnly={!isEditMode} />
                  </div>
                </div>
              </section>
            </form>

            {/* Right: numbers + people */}
            <aside className="min-w-0">
              {/* Stats — only real, derivable numbers */}
              <div className="grid grid-cols-2 rounded-xl border border-ll-line divide-x divide-ll-line">
                <div className="px-4 py-3">
                  <p className="font-mono text-[18px] font-medium text-ll-ink">{classesCount}</p>
                  <p className="text-[12px] text-ll-ink3 mt-0.5">
                    {t(user.role === "teacher" ? "profile.classesTaught" : "profile.classesTaken")}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="font-mono text-[18px] font-medium text-ll-ink">{memberSince || "—"}</p>
                  <p className="text-[12px] text-ll-ink3 mt-0.5">{t("profile.memberSince")}</p>
                </div>
              </div>

              {/* Student — My Learning */}
              {user.role === "user" && (
                <div className="mt-7">
                  <h3 className="text-[13.5px] font-semibold text-ll-ink mb-3">{t("profile.myLearning")}</h3>
                  <div className="rounded-xl border border-ll-line divide-y divide-ll-line overflow-hidden">
                    {[
                      { icon: FiUser, label: t("profile.myTeacher"), value: teacherAssigned || t("profile.notAssigned"), tile: "bg-ll-violet-tint text-ll-violet-ink", onClick: teacherIdAssigned ? () => handleViewProfile(teacherIdAssigned) : null },
                      { icon: FiBookOpen, label: t("profile.language"), value: user.language ? user.language.charAt(0).toUpperCase() + user.language.slice(1) : "N/A", tile: "bg-ll-teal-tint text-ll-teal-ink" },
                      { icon: FiAward, label: t("profile.classesTaken"), value: classesCount, tile: "bg-ll-gold-tint text-ll-gold-ink" },
                    ].map(({ icon: Icon, label, value, tile, onClick }) => (
                      <div
                        key={label}
                        onClick={onClick || undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 ${onClick ? "cursor-pointer hover:bg-ll-subtle transition-colors" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tile}`}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-ll-ink3">{label}</p>
                          <p className="text-[13.5px] font-medium text-ll-ink truncate">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher — My Students */}
              {user.role === "teacher" && (
                <div className="mt-7">
                  <h3 className="text-[13.5px] font-semibold text-ll-ink mb-3 flex items-center gap-2">
                    {t("profile.myStudents")}
                    {user.students?.length > 0 && (
                      <span className="font-mono text-[11.5px] font-normal text-ll-ink3 px-1.5 py-px rounded-[5px] bg-ll-hover">{user.students.length}</span>
                    )}
                  </h3>
                  {user.students && user.students.length > 0 ? (
                    <div className="rounded-xl border border-ll-line divide-y divide-ll-line overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                      {user.students.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => handleViewProfile(student.id)}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-ll-subtle transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold bg-ll-violet-tint text-ll-violet-ink">
                            {`${student.name?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase() || <FiUser size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium text-ll-ink truncate">
                              {student.name} {student.lastName}
                            </p>
                            <p className="text-[12px] text-ll-ink3 truncate">{student.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-ll-ink3 py-4 text-center rounded-xl border border-dashed border-ll-line2 bg-ll-subtle">
                      {t("profile.noStudents")}
                    </p>
                  )}
                </div>
              )}
            </aside>
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
