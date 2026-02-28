import { useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AnimatedLogo from "./LoginLogo";
import { loginUser } from "../../redux/userSlice";
import LoginForm from "./LoginForm";
import Footer from "./Footer";

// Pre-defined floating language characters (static to avoid re-render flicker)
const FLOATING_CHARS = [
  { char: '文', left: '4%',  delay: '0s',    duration: '16s', size: '1.5rem', color: '#9E2FD0', opacity: 0.18 },
  { char: 'A',  left: '11%', delay: '3s',    duration: '13s', size: '1.1rem', color: '#F6B82E', opacity: 0.14 },
  { char: 'の', left: '19%', delay: '7s',    duration: '17s', size: '1.7rem', color: '#26D9A1', opacity: 0.16 },
  { char: 'α',  left: '27%', delay: '1s',    duration: '14s', size: '1.2rem', color: '#c084fc', opacity: 0.15 },
  { char: 'Ñ',  left: '34%', delay: '5s',    duration: '15s', size: '1.3rem', color: '#F6B82E', opacity: 0.13 },
  { char: '한', left: '41%', delay: '9s',    duration: '12s', size: '1.6rem', color: '#9E2FD0', opacity: 0.17 },
  { char: 'Ü',  left: '49%', delay: '2s',    duration: '19s', size: '1.0rem', color: '#26D9A1', opacity: 0.12 },
  { char: '語', left: '57%', delay: '6s',    duration: '15s', size: '1.5rem', color: '#F6B82E', opacity: 0.16 },
  { char: 'β',  left: '64%', delay: '0.5s',  duration: '13s', size: '1.2rem', color: '#9E2FD0', opacity: 0.14 },
  { char: 'Ã',  left: '71%', delay: '4s',    duration: '18s', size: '1.1rem', color: '#26D9A1', opacity: 0.13 },
  { char: 'あ', left: '78%', delay: '8s',    duration: '14s', size: '1.6rem', color: '#c084fc', opacity: 0.17 },
  { char: 'π',  left: '85%', delay: '2.5s',  duration: '16s', size: '1.1rem', color: '#F6B82E', opacity: 0.12 },
  { char: '字', left: '92%', delay: '10s',   duration: '12s', size: '1.4rem', color: '#9E2FD0', opacity: 0.15 },
  { char: 'λ',  left: '16%', delay: '11s',   duration: '20s', size: '1.3rem', color: '#26D9A1', opacity: 0.13 },
  { char: '学', left: '52%', delay: '13s',   duration: '15s', size: '1.5rem', color: '#c084fc', opacity: 0.16 },
  { char: 'é',  left: '88%', delay: '1.5s',  duration: '11s', size: '1.0rem', color: '#F6B82E', opacity: 0.12 },
  { char: 'ん', left: '7%',  delay: '12s',   duration: '16s', size: '1.4rem', color: '#9E2FD0', opacity: 0.14 },
  { char: 'Ö',  left: '32%', delay: '15s',   duration: '14s', size: '1.2rem', color: '#26D9A1', opacity: 0.13 },
  { char: '¿',  left: '62%', delay: '3.5s',  duration: '17s', size: '1.3rem', color: '#F6B82E', opacity: 0.15 },
  { char: 'ü',  left: '96%', delay: '6.5s',  duration: '13s', size: '1.0rem', color: '#c084fc', opacity: 0.12 },
];

const FloatingChars = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {FLOATING_CHARS.map((item, i) => (
      <span
        key={i}
        className="login-char"
        style={{
          left: item.left,
          bottom: '-2rem',
          animationDelay: item.delay,
          animationDuration: item.duration,
          fontSize: item.size,
          color: item.color,
          opacity: item.opacity,
        }}
      >
        {item.char}
      </span>
    ))}
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userStatus = useSelector((state) => state.user.status);
  const userError = useSelector((state) => state.user.error);

  const handleLogin = (event) => {
    event.preventDefault();
    const formattedEmail = email.trim().toLowerCase();
    const data = { email: formattedEmail, password };

    dispatch(loginUser(data)).then((action) => {
      if (action.payload?.token) {
        navigate("/home");
        window.location.reload();
      } else if (action.payload?.networkError) {
        Swal.fire({
          title: t("login.connectionError"),
          text: t("login.connectionErrorText"),
          icon: "error",
          confirmButtonText: t("login.ok"),
          background: '#1a1a2e',
          color: '#fff',
        });
      } else {
        Swal.fire({
          title: t("login.loginFailed"),
          text: t("login.loginFailedText"),
          icon: "error",
          confirmButtonText: t("login.ok"),
          background: '#1a1a2e',
          color: '#fff',
        });
      }
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)' }}
    >
      {/* Ambient glow orbs — sized down on mobile to prevent horizontal overflow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="login-orb w-48 h-48 sm:w-80 sm:h-80 md:w-[520px] md:h-[520px] top-[-8%] left-[-8%]"
          style={{ background: 'radial-gradient(circle, rgba(158,47,208,0.35), transparent 70%)', animationDuration: '8s', animationDelay: '0s' }}
        />
        <div
          className="login-orb w-40 h-40 sm:w-64 sm:h-64 md:w-[420px] md:h-[420px] bottom-[-8%] right-[-6%]"
          style={{ background: 'radial-gradient(circle, rgba(246,184,46,0.22), transparent 70%)', animationDuration: '10s', animationDelay: '2s' }}
        />
        <div
          className="login-orb w-32 h-32 sm:w-52 sm:h-52 md:w-[320px] md:h-[320px] top-[38%] right-[22%]"
          style={{ background: 'radial-gradient(circle, rgba(38,217,161,0.14), transparent 70%)', animationDuration: '13s', animationDelay: '5s' }}
        />
      </div>

      {/* Floating language characters */}
      <FloatingChars />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col md:flex-row justify-center items-center px-4 py-6 md:py-10 md:px-8 gap-4 sm:gap-6 md:gap-16 relative z-10">
        <AnimatedLogo />
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleLogin={handleLogin}
          userStatus={userStatus}
          userError={userError}
        />
      </div>

      <Footer />
    </div>
  );
};

export default Login;
