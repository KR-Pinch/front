import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Bell,
  Palette,
  Trash2,
  Save,
  Moon,
  Sun,
  Monitor,
  FileText,
  ChevronRight,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import Seo from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

type ThemeMode = "light" | "dark" | "system";

const SectionCard = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <motion.section
    variants={item}
    className="glass rounded-3xl border border-border/50 p-6"
  >
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </motion.section>
);

const Settings = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [nickname, setNickname] = useState(user?.username ?? "");
  const [notifyPinchReactions, setNotifyPinchReactions] = useState(true);
  const [notifyRanking, setNotifyRanking] = useState(true);
  const [notifyDaily, setNotifyDaily] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme-mode") as ThemeMode) || "system";
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true, state: { from: "/settings" } });
    }
  }, [user, navigate]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
      localStorage.removeItem("theme");
    } else {
      root.classList.toggle("dark", themeMode === "dark");
      localStorage.setItem("theme", themeMode);
    }
    localStorage.setItem("theme-mode", themeMode);
  }, [themeMode]);

  if (!user) return null;

  const handleSaveNickname = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      toast({
        title: "닉네임이 너무 짧습니다",
        description: "2자 이상 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    login({ ...user, username: trimmed });
    toast({
      title: "닉네임이 변경되었습니다",
      description: `이제 ${trimmed}님으로 활동하세요.`,
    });
  };

  const handleDeleteAccount = () => {
    logout();
    toast({
      title: "계정이 삭제되었습니다",
      description: "그동안 이용해주셔서 감사합니다.",
    });
    navigate("/", { replace: true });
  };

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "라이트", icon: Sun },
    { value: "dark", label: "다크", icon: Moon },
    { value: "system", label: "시스템", icon: Monitor },
  ];

  return (
    <PageTransition>
      <Seo title="설정 — PINCH" description="알림, 테마, 계정 설정을 관리하세요." path="/settings" noindex />
      <div className="min-h-screen bg-background pb-24 noise">
        {/* Header */}
        <header className="page-sticky-header">
          <div className="mx-auto flex max-w-lg md:max-w-2xl items-center justify-between px-4 py-3">
            <Link
              to="/mypage"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-sm font-semibold tracking-tight">설정</h1>
            <div className="w-9" />
          </div>
        </header>

        <motion.main
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-lg md:max-w-2xl space-y-4 px-4 pt-6"
        >
          {/* Nickname */}
          <SectionCard
            icon={User}
            title="프로필"
            description="다른 사용자에게 표시되는 닉네임을 변경합니다"
          >
            <div className="space-y-3">
              <div>
                <Label htmlFor="nickname" className="text-xs text-muted-foreground">
                  닉네임
                </Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임 입력"
                    maxLength={16}
                    className="bg-background/50"
                  />
                  <Button
                    onClick={handleSaveNickname}
                    disabled={nickname.trim() === user.username}
                    className="shrink-0 gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    저장
                  </Button>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  2~16자 이내, 한 번 변경 시 30일 동안 변경 불가
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard
            icon={Bell}
            title="알림"
            description="활동 관련 알림 수신 여부를 설정합니다"
          >
            <div className="space-y-1">
              {[
                {
                  key: "pinch-reactions",
                  label: "내 PINCH 반응",
                  desc: "내 PINCH에 좋아요가 눌렸을 때",
                  value: notifyPinchReactions,
                  set: setNotifyPinchReactions,
                },
                {
                  key: "ranking",
                  label: "랭킹 업데이트",
                  desc: "주간 랭킹이 갱신될 때",
                  value: notifyRanking,
                  set: setNotifyRanking,
                },
                {
                  key: "daily",
                  label: "오늘의 토픽",
                  desc: "매일 새로운 토픽이 열릴 때",
                  value: notifyDaily,
                  set: setNotifyDaily,
                },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-[11px] text-muted-foreground">{row.desc}</p>
                  </div>
                  <Switch checked={row.value} onCheckedChange={row.set} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Theme */}
          <SectionCard
            icon={Palette}
            title="테마"
            description="화면 모드를 선택합니다"
          >
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => {
                const active = themeMode === value;
                return (
                  <button
                    key={value}
                    onClick={() => setThemeMode(value)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition-all ${
                      active
                        ? "border-accent bg-accent/10 text-accent shadow-[0_0_20px_-8px_hsl(45_100%_58%/0.5)]"
                        : "border-border/50 bg-background/30 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Legal */}
          <SectionCard
            icon={FileText}
            title="약관 및 정책"
            description="서비스 이용약관과 개인정보 처리방침을 확인합니다"
          >
            <div className="space-y-1">
              {[
                { label: "서비스 이용약관", desc: "PINCH 서비스 이용 규칙", to: "/terms", version: "v1.2 · 2026.03.01" },
                { label: "개인정보 처리방침", desc: "수집·이용·보관 정책", to: "/privacy", version: "v1.1 · 2026.02.15" },
                { label: "운영 정책", desc: "PINCH·신고·제재 기준", to: "/legal/community", version: "v1.0 · 2026.01.10" },
              ].map((row) => (
                <Link
                  key={row.label}
                  to={row.to}
                  className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {row.desc}
                      <span className="ml-1.5 opacity-70">· {row.version}</span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Danger zone */}
          <SectionCard
            icon={Trash2}
            title="계정 삭제"
            description="계정과 모든 활동 기록이 영구적으로 삭제됩니다"
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  계정 삭제하기
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass border-border/50">
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    삭제된 계정은 복구할 수 없으며, 작성한 모든 PINCH과 활동 기록이
                    함께 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SectionCard>

          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            PINCH · v0.1.0
          </p>
        </motion.main>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default Settings;
