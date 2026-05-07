import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Ban,
  CheckCircle2,
  FileText,
  Flag,
  Heart,
  LogOut,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  adminStore,
  formatBanLabel,
  getActiveBan,
  useAdminStore,
  type AdminMockUser,
  type BanDuration,
} from "@/data/adminData";
import { categories } from "@/data/mockData";

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="glass noise rounded-2xl p-4" title={hint}>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Icon className="h-4 w-4 text-accent" />
    </div>
    <p className="text-2xl font-black tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{hint}</p>}
  </div>
);

// =============================================================================
// Users tab
// =============================================================================

const UsersTab = () => {
  const users = useAdminStore(() => adminStore.getUsers());
  const bans = useAdminStore(() => adminStore.getBans());
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<AdminMockUser | null>(null);
  const [duration, setDuration] = useState<BanDuration>("week");
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.phone.replace(/-/g, "").includes(q.replace(/-/g, "")) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  const banByUser = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getActiveBan>>();
    users.forEach((u) => map.set(u.id, getActiveBan(u.id)));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, bans]);

  const openBan = (u: AdminMockUser) => {
    setTarget(u);
    setDuration("week");
    setReason("");
  };

  const confirmBan = () => {
    if (!target) return;
    adminStore.banUser(target.id, duration, reason);
    toast({
      title: "정지 처리 완료",
      description: `${target.username} → ${
        duration === "week" ? "1주" : duration === "month" ? "1달" : "영구"
      } 정지`,
    });
    setTarget(null);
  };

  const handleUnban = (u: AdminMockUser) => {
    const { phoneUnblocked } = adminStore.unbanUser(u.id);
    toast({
      title: "정지 해제 완료",
      description: phoneUnblocked
        ? `${u.username} · 전화번호 차단 해제됨`
        : u.username,
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="닉네임, 전화번호, 이메일로 검색"
          className="pl-9"
          maxLength={64}
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="glass noise rounded-2xl p-6 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다.
          </div>
        )}
        {filtered.map((u) => {
          const ban = banByUser.get(u.id);
          return (
            <div
              key={u.id}
              className="glass noise rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {u.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="truncate text-sm font-bold">{u.username}</p>
                  {ban && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {formatBanLabel(ban)}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {u.phone} · {u.email}
                </p>
                <p
                  className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground"
                  title={`누적 PINCH ${u.totalPinches}개 (참여일 수와 동일) · 받은 좋아요 ${u.totalLikes.toLocaleString()}개 · 가입일 ${u.joinedAt}`}
                >
                  <span>PINCH {u.totalPinches}</span>
                  <span aria-hidden="true">·</span>
                  <Heart className="h-3 w-3 text-rose-400" aria-hidden="true" />
                  <span>{u.totalLikes.toLocaleString()}</span>
                  <span aria-hidden="true">·</span>
                  <span>가입 {u.joinedAt}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {ban ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnban(u)}
                    className="text-xs h-8"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    해제
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openBan(u)}
                    className="text-xs h-8"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    정지
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>유저 정지</DialogTitle>
            <DialogDescription>
              {target?.username} ({target?.phone}) 계정을 정지합니다.
              {duration === "permanent" && (
                <span className="mt-2 flex items-start gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>영구 정지 시 해당 전화번호({target?.phone})는 차단 목록에 등록되어 재가입이 불가능해집니다.</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">정지 기간</Label>
              <Select value={duration} onValueChange={(v) => setDuration(v as BanDuration)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">1주일 정지</SelectItem>
                  <SelectItem value="month">1달 정지</SelectItem>
                  <SelectItem value="permanent">영구 정지 (전화번호 차단)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">사유</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="정지 사유를 입력하세요"
                maxLength={200}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={confirmBan}>
              정지 적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// =============================================================================
// Banned phones tab
// =============================================================================

const BannedPhonesTab = () => {
  const phones = useAdminStore(() => adminStore.getBannedPhones());
  const [check, setCheck] = useState("");

  const result = useMemo(() => {
    const v = check.trim();
    if (!v) return null;
    return adminStore.isPhoneBanned(v);
  }, [check, phones]);

  return (
    <div className="space-y-4">
      <div className="glass noise rounded-2xl p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold">전화번호 차단 검사</h3>
          <p className="text-[11px] text-muted-foreground">
            영구 정지된 전화번호는 신규 가입 시 인증 단계에서 차단됩니다.
          </p>
        </div>
        <Input
          value={check}
          onChange={(e) => setCheck(e.target.value)}
          placeholder="010-1234-5678"
          maxLength={20}
        />
        {check.trim() && (
          <div
            className={`flex items-start gap-1.5 rounded-lg border p-2.5 text-xs ${
              result
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
            }`}
          >
            {result ? (
              <>
                <Ban className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>차단된 번호입니다 — {result.username} ({result.reason})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>차단되지 않은 번호입니다.</span>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          차단 목록 ({phones.length})
        </h3>
        <div className="space-y-2">
          {phones.length === 0 && (
            <div className="glass noise rounded-2xl p-6 text-center text-sm text-muted-foreground">
              영구 정지된 전화번호가 없습니다.
            </div>
          )}
          {phones.map((p) => (
            <div
              key={p.phone}
              className="glass noise rounded-2xl p-3 flex items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <Ban className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{p.phone}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.username} · {p.reason}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(p.bannedAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Topics tab
// =============================================================================

const TopicsTab = () => {
  const topics = useAdminStore(() => adminStore.getTopics());
  const activeTopicId = useAdminStore(() => adminStore.getActiveTopicId());
  const categoryOverrides = useAdminStore(() =>
    adminStore.getActiveTopicByCategoryMap()
  );
  const activeTopic = topics.find((t) => t.id === activeTopicId) ?? null;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Per-row "scope" picker state for the "apply as today" action.
  const [scopePinch, setScopePinch] = useState<Record<string, string>>({});
  const getScope = (topicId: string) => scopePinch[topicId] ?? "global";
  const [form, setForm] = useState<{
    category: string;
    title: string;
    description: string;
    newsUrl: string;
    newsSource: string;
    date: string;
  }>({
    category: categories[0].id,
    title: "",
    description: "",
    newsUrl: "",
    newsSource: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // 토픽 수정 강도: "minor" = 오타·문구 다듬기 / "replace" = 토픽 자체 교체(기존 PINCH 영향)
  const [editMode, setEditMode] = useState<"minor" | "replace">("minor");
  const [editReason, setEditReason] = useState("");
  const [confirmReplace, setConfirmReplace] = useState<{ applyAsToday: boolean } | null>(null);

  // editingId가 가리키는 토픽에 달린 PINCH 수 / 좋아요 합 — 백엔드 연결 전까지는 mock
  const editingImpact = useMemo(() => {
    if (!editingId) return { pinchCount: 0, likeCount: 0 };
    // 결정론적 mock: id 해시 기반
    const seed = editingId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return {
      pinchCount: 40 + (seed % 180),
      likeCount: 200 + (seed * 17) % 4200,
    };
  }, [editingId]);

  const resetForm = () => {
    setForm({
      category: categories[0].id,
      title: "",
      description: "",
      newsUrl: "",
      newsSource: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
    setEditMode("minor");
    setEditReason("");
  };

  const handleSubmit = (applyAsToday = false) => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "제목과 설명을 입력해주세요", variant: "destructive" });
      return;
    }
    // 토픽 교체 모드는 더블 컨펌 + 사유 필수
    if (editingId && editMode === "replace" && !confirmReplace) {
      if (!editReason.trim()) {
        toast({
          title: "토픽 교체 사유를 입력해주세요",
          description: "기존 PINCH가 영향을 받기 때문에 사유 기록이 필요합니다.",
          variant: "destructive",
        });
        return;
      }
      setConfirmReplace({ applyAsToday });
      return;
    }
    if (editingId) {
      adminStore.updateTopic(editingId, form);
      if (applyAsToday) adminStore.setActiveTopicId(editingId);
      const replaced = editMode === "replace";
      toast({
        title: replaced
          ? "토픽 교체 완료 — 기존 PINCH 무효화"
          : applyAsToday
          ? "토픽 수정 + 오늘 적용"
          : "토픽 수정 완료",
        description: replaced
          ? `${editingImpact.pinchCount}개 PINCH가 보존되되 새 토픽 맥락에서 숨김 처리됩니다.`
          : undefined,
      });
    } else {
      // addTopic uses unshift internally; the new id will be at index 0.
      adminStore.addTopic(form);
      if (applyAsToday) {
        const newest = adminStore.getTopics()[0];
        if (newest) adminStore.setActiveTopicId(newest.id);
      }
      toast({
        title: applyAsToday ? "토픽 등록 + 오늘 적용" : "토픽 등록 완료",
      });
    }
    setOpen(false);
    setConfirmReplace(null);
    resetForm();
  };

  const startEdit = (id: string) => {
    const t = topics.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setForm({
      category: t.category,
      title: t.title,
      description: t.description,
      newsUrl: t.newsUrl,
      newsSource: t.newsSource,
      date: t.date,
    });
    setEditMode("minor");
    setEditReason("");
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Currently-forced "today" topic — global + per-category overrides. */}
      <div
        className={`glass noise rounded-2xl p-4 border ${
          activeTopic || Object.keys(categoryOverrides).length > 0
            ? "border-accent/50"
            : "border-border"
        }`}
      >
        <div className="mb-2 flex items-center gap-2">
          <Pin
            className={`h-3.5 w-3.5 ${
              activeTopic ? "text-accent" : "text-muted-foreground"
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            현재 적용 중인 오늘 토픽
          </span>
        </div>

        {/* Global override row */}
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            전체
          </p>
          {activeTopic ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{activeTopic.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {categories.find((c) => c.id === activeTopic.category)?.label} · {activeTopic.date}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs shrink-0"
                onClick={() => {
                  adminStore.setActiveTopicId(null);
                  toast({ title: "전체 적용 해제" });
                }}
              >
                <PinOff className="h-3.5 w-3.5" />
                해제
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              아직 오늘 토픽이 지정되지 않았습니다. 등록된 토픽 중 가장 인기 있는 항목이 자동으로 노출됩니다.
            </p>
          )}
        </div>

        {/* Per-category overrides */}
        {Object.keys(categoryOverrides).length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              카테고리별
            </p>
            {Object.entries(categoryOverrides).map(([catId, topicId]) => {
              const cat = categories.find((c) => c.id === catId);
              const t = topics.find((x) => x.id === topicId);
              if (!cat || !t) return null;
              return (
                <div
                  key={catId}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${cat.accent}`}>
                      <cat.icon className="h-3 w-3" aria-hidden="true" /> {cat.label}
                    </span>
                    <p className="truncate text-xs font-semibold">{t.title}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px] shrink-0"
                    onClick={() => {
                      adminStore.setActiveTopicForCategory(catId, null);
                      toast({ title: `${cat.label} 카테고리 적용 해제` });
                    }}
                  >
                    <PinOff className="h-3 w-3" />
                    해제
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className="w-full"
      >
        <Plus className="h-4 w-4" />
        새 토픽 등록
      </Button>

      <div className="space-y-2">
        {topics.length === 0 && (
          <div className="glass noise rounded-2xl p-6 text-center text-sm text-muted-foreground">
            등록된 토픽이 없습니다.
          </div>
        )}
        {topics.map((t) => {
          const cat = categories.find((c) => c.id === t.category);
          const isActive = t.id === activeTopicId;
          // List every category this topic is currently forced into.
          const pinnedCats = Object.entries(categoryOverrides)
            .filter(([, tid]) => tid === t.id)
            .map(([cid]) => cid);
          const scope = getScope(t.id);
          const applyLabel =
            scope === "global"
              ? "전체에 적용"
              : `${categories.find((c) => c.id === scope)?.label ?? scope} 카테고리에 적용`;
          return (
            <div
              key={t.id}
              className={`glass noise rounded-2xl p-4 space-y-2 ${
                isActive || pinnedCats.length > 0 ? "ring-1 ring-accent/60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 flex-wrap">
                    {cat && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${cat.accent}`}>
                        <cat.icon className="h-3 w-3" aria-hidden="true" /> {cat.label}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{t.date}</span>
                    {isActive && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-accent text-accent-foreground">
                        전체 적용 중
                      </Badge>
                    )}
                    {pinnedCats.map((cid) => {
                      const cc = categories.find((c) => c.id === cid);
                      if (!cc) return null;
                      return (
                        <Badge
                          key={cid}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-accent/50 inline-flex items-center gap-1"
                        >
                          <cc.icon className="h-3 w-3" aria-hidden="true" /> {cc.label}만
                        </Badge>
                      );
                    })}
                  </div>
                  <p className="text-sm font-bold leading-tight">{t.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {t.description}
                  </p>
                </div>
              </div>

              {/* Scope picker + apply */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Select
                  value={scope}
                  onValueChange={(v) => setScopePinch((s) => ({ ...s, [t.id]: v }))}
                >
                  <SelectTrigger className="h-8 text-xs w-auto min-w-[140px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">전체 (모든 카테고리)</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="inline-flex items-center gap-1.5">
                          <c.icon className="h-3.5 w-3.5" aria-hidden="true" /> {c.label} 카테고리만
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    if (scope === "global") {
                      adminStore.setActiveTopicId(t.id);
                    } else {
                      adminStore.setActiveTopicForCategory(scope, t.id);
                    }
                    toast({
                      title: applyLabel,
                      description: "홈 화면에 즉시 반영됩니다.",
                    });
                  }}
                >
                  <Pin className="h-3.5 w-3.5" />
                  적용
                </Button>
              </div>

              <div className="flex gap-2">
                {(isActive || pinnedCats.length > 0) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs flex-1"
                    onClick={() => {
                      if (isActive) adminStore.setActiveTopicId(null);
                      pinnedCats.forEach((cid) =>
                        adminStore.setActiveTopicForCategory(cid, null)
                      );
                      toast({ title: "이 토픽의 모든 적용 해제" });
                    }}
                  >
                    <PinOff className="h-3.5 w-3.5" />
                    모두 해제
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex-1"
                  onClick={() => startEdit(t.id)}
                >
                  수정
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs"
                  onClick={() => setConfirmDelete(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="glass max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "토픽 수정" : "새 토픽 등록"}</DialogTitle>
            {editingId ? (
              <DialogDescription className="text-xs">
                기존 PINCH의 맥락에 영향을 줄 수 있으므로 변경 강도를 먼저 선택해주세요.
              </DialogDescription>
            ) : null}
          </DialogHeader>

          {editingId ? (
            <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3">
              <Label className="text-xs font-semibold">변경 강도</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode("minor")}
                  className={`text-left rounded-lg border p-3 transition ${
                    editMode === "minor"
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="text-xs font-bold mb-1">단순 수정</div>
                  <div className="text-[10px] leading-snug text-muted-foreground">
                    오타·문구 다듬기.<br />기존 PINCH 그대로 유지.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("replace")}
                  className={`text-left rounded-lg border p-3 transition ${
                    editMode === "replace"
                      ? "border-destructive bg-destructive/10"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="text-xs font-bold mb-1 inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> 토픽 교체
                  </div>
                  <div className="text-[10px] leading-snug text-muted-foreground">
                    논점 자체 변경.<br />기존 PINCH는 보존되되 숨김 처리.
                  </div>
                </button>
              </div>

              {editMode === "replace" ? (
                <>
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-2.5 text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      영향 미리보기
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      이 토픽에는 현재{" "}
                      <span className="font-bold text-foreground">
                        PINCH {editingImpact.pinchCount}개
                      </span>
                      ,{" "}
                      <span className="font-bold text-foreground">
                        좋아요 {editingImpact.likeCount.toLocaleString()}개
                      </span>
                      가 달려 있습니다. 교체 시 새 토픽 맥락에서 숨김 처리되며,
                      참여자에게 재작성 알림이 발송됩니다.
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">교체 사유 (필수)</Label>
                    <Textarea
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      maxLength={200}
                      rows={2}
                      placeholder="예) 잘못된 출처로 발행되어 논점 자체를 교체"
                      className="text-xs"
                    />
                    <div className="text-[10px] text-muted-foreground text-right">
                      audit log + 사용자 공지에 노출됩니다 · {editReason.length}/200
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-1.5">
                        <c.icon className="h-3.5 w-3.5" aria-hidden="true" /> {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
                placeholder="오늘의 토론 주제"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
                rows={4}
                placeholder="토픽 배경 설명"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">뉴스 출처</Label>
                <Input
                  value={form.newsSource}
                  onChange={(e) => setForm({ ...form, newsSource: e.target.value })}
                  maxLength={50}
                  placeholder="한겨레"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">날짜</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">뉴스 URL</Label>
              <Input
                value={form.newsUrl}
                onChange={(e) => setForm({ ...form, newsUrl: e.target.value })}
                maxLength={500}
                placeholder="https://news.example.com/..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              취소
            </Button>
            <Button
              variant={editingId && editMode === "replace" ? "destructive" : "secondary"}
              onClick={() => handleSubmit(false)}
            >
              {editingId
                ? editMode === "replace"
                  ? "토픽 교체"
                  : "저장"
                : "등록만"}
            </Button>
            <Button
              variant={editingId && editMode === "replace" ? "destructive" : "default"}
              onClick={() => handleSubmit(true)}
            >
              <Pin className="h-3.5 w-3.5" />
              {editingId
                ? editMode === "replace"
                  ? "교체 + 오늘 적용"
                  : "저장 + 오늘 적용"
                : "등록 + 오늘 적용"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 토픽 교체 더블 컨펌 — 사용자 PINCH가 영향받는 작업이므로 한 번 더 확인 */}
      <AlertDialog
        open={!!confirmReplace}
        onOpenChange={(o) => !o && setConfirmReplace(null)}
      >
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              정말 토픽을 교체하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-xs">
                <div>
                  현재 이 토픽에 달린{" "}
                  <span className="font-bold text-foreground">
                    PINCH {editingImpact.pinchCount}개
                  </span>
                  와{" "}
                  <span className="font-bold text-foreground">
                    좋아요 {editingImpact.likeCount.toLocaleString()}개
                  </span>
                  가 새 토픽 맥락에서 숨김 처리됩니다.
                </div>
                <div className="rounded-md border border-border bg-muted/30 p-2">
                  <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                    교체 사유
                  </div>
                  <div className="text-foreground">{editReason}</div>
                </div>
                <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-0.5">
                  <li>기존 PINCH는 물리 삭제되지 않으며 마이페이지에서 조회 가능합니다.</li>
                  <li>참여자에게 재작성 알림이 발송됩니다(1일 1 PINCH 카운터 리셋).</li>
                  <li>변경 이력은 audit log 에 영구 보존됩니다.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmReplace(null)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const apply = confirmReplace?.applyAsToday ?? false;
                setConfirmReplace(null);
                // confirmReplace 가 null 이 된 상태에서 다시 호출 → 정상 흐름
                handleSubmit(apply);
              }}
            >
              교체 진행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>토픽을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  adminStore.deleteTopic(confirmDelete);
                  toast({ title: "토픽 삭제 완료" });
                }
                setConfirmDelete(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// =============================================================================
// Reports tab
// =============================================================================

const ReportsTab = () => {
  const reports = useAdminStore(() => adminStore.getReports());

  const handleAction = (id: string, action: "delete" | "dismiss") => {
    adminStore.resolveReport(id, action);
    toast({
      title: action === "delete" ? "댓글(신고 대상) 강제 삭제" : "신고 무시 처리",
    });
  };

  return (
    <div className="space-y-2">
      <p className="px-1 text-[10px] text-muted-foreground">
        ※ 여기서 말하는 <strong className="text-foreground">댓글(신고 대상)</strong>은 일반 PINCH과 별개로,
        신고 접수되어 모더레이션이 필요한 게시물입니다.
      </p>
      {reports.length === 0 && (
        <div className="glass noise rounded-2xl p-6 text-center text-sm text-muted-foreground">
          신고된 댓글(신고 대상)이 없습니다.
        </div>
      )}
      {reports.map((r) => (
        <div key={r.id} className="glass noise rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                댓글(신고 대상)
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Flag className="h-3 w-3" /> {r.reportCount}건
              </Badge>
              {r.status === "pending" ? (
                <Badge variant="destructive" className="text-[10px]">대기</Badge>
              ) : r.status === "resolved" ? (
                <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">삭제됨</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">무시됨</Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {new Date(r.reportedAt).toLocaleString("ko-KR")}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            토픽: {r.topicTitle}
          </p>
          <p className="text-[11px] text-muted-foreground">
            작성자: <span className="font-bold text-foreground">{r.username}</span>
          </p>
          <div className="rounded-lg bg-secondary/40 p-2.5 text-sm">{r.text}</div>
          <div className="flex flex-wrap gap-1">
            {r.reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive"
              >
                {reason}
              </span>
            ))}
          </div>
          {r.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1"
                onClick={() => handleAction(r.id, "dismiss")}
              >
                무시
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-xs flex-1"
                onClick={() => handleAction(r.id, "delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
                강제 삭제
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// Page shell
// =============================================================================

const Admin = () => {
  const { session, logout } = useAdminAuth();
  const navigate = useNavigate();

  const users = useAdminStore(() => adminStore.getUsers());
  const bans = useAdminStore(() => adminStore.getBans());
  const reports = useAdminStore(() => adminStore.getReports());
  const topics = useAdminStore(() => adminStore.getTopics());

  const activeBans = useMemo(
    () => bans.filter((b) => !b.expiresAt || new Date(b.expiresAt).getTime() > Date.now()).length,
    [bans]
  );
  const pendingReports = reports.filter((r) => r.status === "pending").length;
  // Mock DAU & today's PINCHes derived from users.
  const dau = Math.round(users.length * 7.4);
  const todayPinches = users.reduce((acc, u) => acc + Math.min(u.totalPinches, 1), 0) + 12;

  const handleLogout = () => {
    logout();
    toast({ title: "로그아웃 되었습니다" });
    navigate("/admin/login", { replace: true });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-12">
        {/* Top bar */}
        <div className="sticky top-0 z-20 glass border-b border-border/40">
          <div className="container flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">관리자</p>
                <p className="text-[10px] text-muted-foreground">@{session?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="text-xs h-8"
              >
                <LogOut className="h-3.5 w-3.5" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        <motion.div
          className="container pt-5 space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={BarChart3}
              label="DAU"
              value={dau}
              hint="오늘 1회 이상 접속한 활성 유저 수"
            />
            <StatCard
              icon={MessageSquare}
              label="오늘 PINCH"
              value={todayPinches}
              hint={`오늘 작성된 PINCH 수 · 1인 1일 1 PINCH (예: ${todayPinches}개 = ${todayPinches}명 참여)`}
            />
            <StatCard
              icon={Ban}
              label="활성 정지"
              value={activeBans}
              hint={`현재 정지 중 / 누적 ${bans.length}건`}
            />
            <StatCard
              icon={AlertTriangle}
              label="신고 대기"
              value={pendingReports}
              hint={`처리 대기 중인 댓글(신고 대상) · 누적 ${reports.length}건`}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="text-xs">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1">유저</span>
              </TabsTrigger>
              <TabsTrigger value="phones" className="text-xs">
                <Ban className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1">차단</span>
              </TabsTrigger>
              <TabsTrigger value="topics" className="text-xs">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1">토픽 ({topics.length})</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs" title="댓글(신고 대상) 모더레이션">
                <Flag className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1">신고 ({pendingReports})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <UsersTab />
            </TabsContent>
            <TabsContent value="phones" className="mt-4">
              <BannedPhonesTab />
            </TabsContent>
            <TabsContent value="topics" className="mt-4">
              <TopicsTab />
            </TabsContent>
            <TabsContent value="reports" className="mt-4">
              <ReportsTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Admin;
