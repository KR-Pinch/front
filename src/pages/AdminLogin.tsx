import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import PageTransition from "@/components/PageTransition";
import Seo from "@/components/Seo";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminLogin = () => {
  const { isAdmin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAdmin) navigate(from, { replace: true });
  }, [isAdmin, from, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast({ title: "아이디와 비밀번호를 입력해주세요" });
      return;
    }
    setSubmitting(true);
    // Simulate brief async for UX
    setTimeout(() => {
      const ok = login(username, password);
      setSubmitting(false);
      if (ok) {
        toast({ title: "관리자 로그인 성공" });
        navigate(from, { replace: true });
      } else {
        toast({
          title: "로그인 실패",
          description: "아이디 또는 비밀번호가 올바르지 않습니다.",
          variant: "destructive",
        });
      }
    }, 250);
  };

  return (
    <PageTransition>
      <Seo title="관리자 로그인 — PINCH" description="PINCH 내부 운영자 로그인 페이지입니다." path="/admin/login" noindex />
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="glass noise rounded-3xl p-7">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">관리자 로그인</h1>
              <p className="text-xs text-muted-foreground">
                내부 운영자 전용 페이지입니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-username" className="text-xs">
                  아이디
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="pl-9"
                    maxLength={64}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-xs">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <p className="mt-4 text-center text-[10px] text-muted-foreground">
              데모용 계정: <span className="font-mono">admin / admin1234</span>
            </p>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AdminLogin;
