import { useState, useEffect, useRef, useCallback } from "react";
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck, FaPlus, FaCopy, FaVideo } from "react-icons/fa6";
import { usePageAction } from "../../../context/PageActionContext";
import { useAuth } from "../../../context/AuthContext";
import EmptyState from "../../../components/EmptyState";
import { axiosAPI } from "../../../service/axiosAPI";
import { toast } from "../../../Toast/ToastProvider";
import { parseApiError } from "../../../service/parseApiError";
import { DateTimeBox } from "../Components/DateTimeBox";
import { MeetingAttendanceModal } from "../../../components/MeetingModals";
import { PiCopyBold } from "react-icons/pi";
import DiscardModal from "../../../components/DiscardModal";
import ResizableTextarea, { ResizableBox } from "../../../components/ResizableTextarea";
import { getMeetingCode } from "../../MeetingRoom/utils/meetingCode";
const labelCls = "block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5";
const DURATION_UNITS = ["daqiqa"];
const fmtDt = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU") + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};
const toIso = (date, time) => {
  if (!date) return null;
  const t = time || "00:00";
  const now = /* @__PURE__ */ new Date();
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const absMin = Math.abs(offsetMin);
  const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const mm = String(absMin % 60).padStart(2, "0");
  return `${date}T${t}:00${sign}${hh}:${mm}`;
};
const toIsoWithOffset = (date, time) => toIso(date, time);
const fromIso = (iso) => {
  if (!iso) return { date: "", time: "" };
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: "", time: "" };
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
  } catch {
    return { date: "", time: "" };
  }
};
const durationToMinutes = (val) => {
  const n = parseInt(val, 10);
  if (!n || isNaN(n)) return null;
  return n;
};
const minutesToDisplay = (mins) => {
  if (!mins) return { val: "", unit: "daqiqa" };
  return { val: String(mins), unit: "daqiqa" };
};
const normalizePercentInput = (val) => {
  const cleaned = String(val || "").replace(/,/g, ".").replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const firstDot = cleaned.indexOf(".");
  const normalized = firstDot === -1 ? cleaned : `${cleaned.slice(0, firstDot)}.${cleaned.slice(firstDot + 1).replace(/\./g, "")}`;
  const [intPartRaw = "", decRaw = ""] = normalized.split(".");
  const intPart = intPartRaw.replace(/^0+(?=\d)/, "") || "0";
  if (firstDot === -1) {
    return Number(intPart) > 100 ? "100" : intPart;
  } else {
    const limitedDec = decRaw.slice(0, 2);
    const resultStr = `${intPart}.${limitedDec}`;
    return Number(resultStr) > 100 ? "100" : resultStr;
  }
};
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return { open, setOpen, ref };
}
function ProjectDropdown({ value, onChange, error, projects = [], disabled = false }) {
  const { open, setOpen, ref } = useDropdown();
  const selected = projects.find((p) => p.id === value);
  return /* @__PURE__ */ React.createElement("div", { ref }, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Loyiha"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => !disabled && setOpen((o) => !o),
      disabled,
      className: `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
            ${disabled ? "cursor-default bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]" : "cursor-pointer bg-[var(--bg-base)]"}
            ${error ? "border-red-400" : "border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]"}
            ${selected ? "text-[var(--text-strong)] dark:text-[var(--text-strong)]" : "text-[var(--text-soft)] dark:text-[var(--text-sub)]"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-left truncate" }, selected?.title || "Loyiha tanlang"),
    !disabled && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 shrink-0 ml-1" }, selected ? /* @__PURE__ */ React.createElement("span", { onMouseDown: (e) => {
      e.stopPropagation();
      onChange(null);
    }, className: "text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 11 })) : /* @__PURE__ */ React.createElement(FaChevronDown, { size: 11, className: `text-[var(--text-soft)] transition-transform ${open ? "rotate-180" : ""}` }))
  ), error && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 mt-1" }, "*Bu maydon majburiy"), open && !disabled && /* @__PURE__ */ React.createElement("div", { className: "absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52\r\n            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]" }, projects.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "px-4 py-3 text-sm text-[var(--text-soft)]" }, "Loyihalar topilmadi"), projects.map((p, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      type: "button",
      onClick: () => {
        onChange(p.id);
        setOpen(false);
      },
      className: `w-full flex items-center justify-between px-4 py-3 text-left  cursor-pointer
                  ${i < projects.length - 1 ? "border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" : ""}
                  ${value === p.id ? "bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]" : "hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]"}`
    },
    /* @__PURE__ */ React.createElement("p", { className: `text-sm font-medium truncate ${value === p.id ? "text-[var(--accent-strong)] dark:text-[var(--accent-soft)]" : "text-[var(--text-strong)] dark:text-[var(--text-strong)]"}` }, p.title)
  )))));
}
function ParticipantsModal({ selected, onClose, onApply, users = [] }) {
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(new Set(selected.map((u) => u.id ?? u)));
  const filtered = users.filter(
    (u) => (u.username ?? "").toLowerCase().includes(search.toLowerCase()) || (u.position_info?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const allSelected = filtered.length > 0 && filtered.every((u) => sel.has(u.id));
  const toggle = (id) => setSel((prev) => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });
  const toggleAll = () => {
    if (allSelected) setSel((prev) => {
      const s = new Set(prev);
      filtered.forEach((u) => s.delete(u.id));
      return s;
    });
    else setSel((prev) => {
      const s = new Set(prev);
      filtered.forEach((u) => s.add(u.id));
      return s;
    });
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[60] flex items-center justify-center px-4" }, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/10" }), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)] flex flex-col overflow-hidden", style: { height: 700, maxHeight: "90vh" } }, /* @__PURE__ */ React.createElement("div", { className: "px-6 pt-6 pb-4 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-4" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer" }, /* @__PURE__ */ React.createElement(FaArrowLeft, { size: 16 })), /* @__PURE__ */ React.createElement("h2", { className: "text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, "Yig'ilishga qatnashishlar")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: toggleAll,
      className: "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]\r\n                text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)] cursor-pointer  shrink-0"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M3 6h18M3 12h18M3 18h18" })),
    "Barchasini tanlash"
  ), /* @__PURE__ */ React.createElement("div", { className: "relative flex-1" }, /* @__PURE__ */ React.createElement("svg", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]", width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.35-4.35" })), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: search,
      onChange: (e) => setSearch(e.target.value),
      placeholder: "Ism bo'yicha izlash",
      className: "w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]\r\n                  bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]"
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto px-6 pb-2 flex flex-col gap-2" }, filtered.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--text-soft)] text-center py-8" }, "Foydalanuvchi topilmadi"), filtered.map((u) => {
    const checked = sel.has(u.id);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: u.id,
        type: "button",
        onClick: () => toggle(u.id),
        className: `w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left
                  ${checked ? "border-[var(--accent-sub)] bg-[#EEF1FB] dark:bg-[#1E2340] dark:border-[var(--accent-sub)]" : "border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)]"}`
      },
      /* @__PURE__ */ React.createElement("div", { className: `w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 
                  ${checked ? "bg-[var(--accent-strong)] border-[var(--accent-strong)]" : "border-[var(--stroke-strong)] dark:border-[var(--stroke-sub)]"}` }, checked && /* @__PURE__ */ React.createElement(FaCheck, { size: 9, className: "text-white" })),
      /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-sub)] shrink-0" }, (u.username ?? "?").slice(0, 2).toUpperCase()),
      /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: `text-sm font-semibold truncate ${checked ? "text-[var(--accent-strong)] dark:text-[var(--accent-soft)]" : "text-[var(--text-strong)] dark:text-[var(--text-strong)]"}` }, u.username), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-[var(--text-soft)] truncate" }, u.position_info?.name || u.position || "\u2014"))
    );
  })), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 flex items-center justify-between gap-3 shrink-0 border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm text-[var(--text-soft)]" }, sel.size, " ta tanlangan"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSel(/* @__PURE__ */ new Set()),
      className: "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]\r\n                hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)] cursor-pointer "
    },
    /* @__PURE__ */ React.createElement(FaXmark, { size: 12 }),
    " Tozalash"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onApply(users.filter((u) => sel.has(u.id))),
      className: "flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] cursor-pointer "
    },
    /* @__PURE__ */ React.createElement(FaCheck, { size: 12 }),
    " Qo'shish"
  )))));
}
function AddMeetingModal({ onClose, loadMeetings, initialData }) {
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const loadProjectMembers = (projectId) => {
    setMembersLoading(true);
    if (projectId) {
      axiosAPI.get(`/projects/${projectId}/`).then((res) => {
        const proj = res.data?.data ?? res.data;
        const emps = proj?.employees_info ?? [];
        const testers = proj?.testers_info ?? [];
        const manager = proj?.manager_info ? [proj.manager_info] : [];
        const all = [...emps, ...testers, ...manager];
        const seen = /* @__PURE__ */ new Set();
        setProjectMembers(all.filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        }));
      }).catch(() => setProjectMembers([])).finally(() => setMembersLoading(false));
    } else {
      axiosAPI.get("/users/all/", { params: { page_size: 200 } }).then((res) => {
        const list = res.data?.results ?? res.data?.data?.results ?? res.data?.data ?? res.data ?? [];
        const seen = /* @__PURE__ */ new Set();
        setProjectMembers(Array.isArray(list) ? list.filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        }) : []);
      }).catch(() => setProjectMembers([])).finally(() => setMembersLoading(false));
    }
  };
  useEffect(() => {
    axiosAPI.get("/projects/", { params: { page_size: 100 } }).then((res) => {
      const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {
    });
    loadProjectMembers(initialData?.project || null);
  }, []);
  const [form, setForm] = useState(() => {
    if (initialData) {
      const { date, time } = fromIso(initialData.start_time);
      const { val } = minutesToDisplay(initialData.duration_minutes);
      return {
        project: initialData.project ?? null,
        title: initialData.title ?? "",
        fine: initialData.penalty_percentage ? String(Math.abs(parseFloat(initialData.penalty_percentage))) : "",
        description: initialData.description ?? "",
        date,
        time,
        durationVal: val,
        participants: initialData.participants_info ?? [],
        is_completed: false,
        requires_approval: initialData.requires_approval ?? false
      };
    }
    return {
      project: null,
      title: "",
      fine: "",
      description: "",
      date: "",
      time: "",
      durationVal: "",
      participants: [],
      is_completed: false,
      requires_approval: false
    };
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const handleClose = () => {
    if (isDirty) setShowDiscard(true);
    else onClose();
  };
  const set = (k, v) => {
    setIsDirty(true);
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };
  const handleFine = (val) => {
    set("fine", normalizePercentInput(val));
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !showParticipants) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, showParticipants]);
  const handleProjectChange = (v) => {
    setForm((p) => ({ ...p, project: v, participants: [] }));
    setErrors((p) => ({ ...p, project: "" }));
    setProjectMembers([]);
    loadProjectMembers(v);
  };
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = true;
    if (!form.date) e.date = true;
    if (!form.time) e.time = true;
    if (!form.durationVal || isNaN(parseInt(form.durationVal, 10))) e.durationVal = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const inputCls = (err) => `w-full px-3 py-2.5 rounded-xl text-sm outline-none border  bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:placeholder-[var(--text-sub)] ${err ? "border-red-400" : "border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] focus:border-[var(--accent-sub)]"}`;
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const body = {
        title: form.title.trim(),
        is_completed: form.is_completed,
        participants: form.participants.map((u) => u.id),
        requires_approval: Boolean(form.requires_approval)
      };
      if (form.project) body.project = form.project;
      if (form.description?.trim()) body.description = form.description.trim();
      const fineNum = parseFloat(form.fine);
      if (fineNum > 0) body.penalty_percentage = String(fineNum);
      const startIso = toIso(form.date, form.time);
      if (startIso) body.start_time = startIso;
      const mins = parseInt(form.durationVal, 10);
      if (mins && !isNaN(mins)) body.duration_minutes = mins;
      const res = await axiosAPI.post("/meetings/", body);
      toast.success("Yig'ilish yaratildi", `${form.uid?.trim() ? form.uid.trim() + " \u2014 " : ""}Yangi yig'ilish muvaffaqiyatli qo'shildi`);
      loadMeetings();
      onClose();
    } catch (err) {
      const errData = err?.response?.data;
      const details = errData?.error?.details;
      if (details && typeof details === "object") {
        const msgs = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join("\n");
        toast.error("Xatolik", msgs);
      } else {
        const msg = errData?.error?.errorMsg || errData?.detail || "Yig'ilish yaratishda xatolik";
        toast.error("Xatolik", msg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center px-4" }, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/60" }), /* @__PURE__ */ React.createElement("button", { onClick: handleClose, className: "fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden", style: { height: 700, maxHeight: "90vh" } }, /* @__PURE__ */ React.createElement("div", { className: "px-7 pt-7 pb-3 shrink-0 " }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-1" }, /* @__PURE__ */ React.createElement("button", { onClick: handleClose, className: "text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0" }, /* @__PURE__ */ React.createElement(FaArrowLeft, { size: 17 })), /* @__PURE__ */ React.createElement("h2", { className: "text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, "Yig'ilish qo'shish")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--text-soft)] " }, "Yangi yig'ilish yaratish uchun ma'lumotlarni kiriting")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto px-7 py-4 flex flex-col gap-3", style: { scrollbarWidth: "thin", scrollbarColor: "#C2C8E0 transparent" } }, /* @__PURE__ */ React.createElement(ProjectDropdown, { value: form.project, onChange: handleProjectChange, error: errors.project, projects }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Nomi"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: form.title,
      onChange: (e) => set("title", e.target.value),
      placeholder: "Nomi yozing",
      className: inputCls(errors.title)
    }
  ), errors.title && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 mt-1" }, "*Bu maydon majburiy")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Jarima foizi (%)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      inputMode: "decimal",
      value: form.fine,
      onChange: (e) => handleFine(e.target.value),
      placeholder: "Jarima foizini kiriting",
      className: inputCls(false)
    }
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Tavsifi"), /* @__PURE__ */ React.createElement(
    ResizableTextarea,
    {
      value: form.description,
      onChange: (e) => set("description", e.target.value),
      placeholder: "Tavsifni yozing",
      rows: 3,
      className: inputCls(false) + " pr-8"
    },
    form.description && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => set("description", ""),
        className: "absolute top-2.5 right-2.5 text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"
      },
      /* @__PURE__ */ React.createElement(FaXmark, { size: 12 })
    )
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "col-span-2" }, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Boshlanish sanasi"), /* @__PURE__ */ React.createElement(
    DateTimeBox,
    {
      type: "date",
      placeholder: "kk.oo.yyyy",
      value: form.date,
      onChange: (v) => {
        set("date", v);
        if (v && (!form.time || form.time === "00:00")) {
          set("time", "23:59");
        }
      },
      error: errors.date,
      dropUp: true
    }
  ), errors.date && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 mt-1" }, "*Bu maydon majburiy")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Vaqti"), /* @__PURE__ */ React.createElement(
    DateTimeBox,
    {
      type: "time",
      placeholder: "SS:DD",
      value: form.time,
      onChange: (v) => set("time", v),
      error: errors.time,
      dropUp: true
    }
  ), errors.time && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 mt-1" }, "*Bu maydon majburiy")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Davomiyligi"), /* @__PURE__ */ React.createElement("div", { className: `flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-[var(--bg-base)] focus-within:border-[var(--accent-sub)] ${errors.durationVal ? "border-red-400" : "border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]"}` }, /* @__PURE__ */ React.createElement(
    "input",
    {
      min: "1",
      value: form.durationVal,
      onChange: (e) => set("durationVal", e.target.value.replace(/\D/g, "")),
      placeholder: "0",
      className: "flex-1 min-w-0 w-8 text-sm outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "shrink-0 text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] whitespace-nowrap" }, "daqiqa")), errors.durationVal && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 mt-1" }, "*Kiriting"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Yig'ilish qatnashchilari"), /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => !membersLoading ? setShowParticipants(true) : null,
      className: `w-full min-h-[100px] rounded-[24px] border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] p-3 flex flex-col transition-all
                  ${membersLoading ? "cursor-default" : "cursor-pointer hover:border-[var(--accent-sub)]"}
                  ${form.participants.length === 0 ? "items-center justify-center" : "items-start justify-start"}`
    },
    form.participants.length === 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--text-sub)] dark:text-[var(--text-soft)] mb-4 text-center" }, membersLoading ? "Yuklanmoqda..." : "Quyidagi tugma orqali qidiring va tanlang"), /* @__PURE__ */ React.createElement("div", { className: `inline-flex items-center gap-1 p-2 rounded-xl text-sm font-medium
                      ${membersLoading ? "bg-[#F1F3F9] text-[#C2C8E0] dark:bg-[var(--bg-elevation-1)] dark:text-[#474848]" : "bg-[#dadff0] dark:bg-[#3a3b3b] text-black dark:text-[var(--accent-soft)] cursor-pointer"}` }, membersLoading ? /* @__PURE__ */ React.createElement("svg", { className: "animate-spin w-4 h-4", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), /* @__PURE__ */ React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" })) : /* @__PURE__ */ React.createElement(FaPlus, { size: 15 }), membersLoading ? "Yuklanmoqda..." : "Qatnashchilarni qo'shing")) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, form.participants.map((u) => /* @__PURE__ */ React.createElement("div", { key: u.id, className: "inline-flex items-center gap-1 px-1 py-0.5 rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] text-[var(--text-strong)] dark:text-[var(--text-strong)] text-xs border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium text-[13px]" }, u.username, u.position_info?.name || u.position ? ` | ${u.position_info?.name || u.position}` : ""), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: (ev) => {
          ev.stopPropagation();
          set("participants", form.participants.filter((p) => p.id !== u.id));
        },
        className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1 cursor-pointer"
      },
      /* @__PURE__ */ React.createElement(FaXmark, { size: 12, className: "text-[var(--text-soft)]" })
    ))))
  ))), /* @__PURE__ */ React.createElement("div", { className: "px-7 py-5 flex items-center justify-between gap-3 shrink-0 bg-[var(--bg-base)]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium text-[var(--text-strong)] dark:text-[var(--text-sub)]" }, "Tasdiqlash talabi"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => set("requires_approval", !form.requires_approval),
      className: `relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ${form.requires_approval ? "bg-[var(--accent-strong)] dark:bg-[#526ED3]" : "bg-[#D0D5E2] dark:bg-[#30363D]"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: `absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${form.requires_approval ? "translate-x-5" : "translate-x-0.5"}` })
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClose,
      className: "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]"
    },
    /* @__PURE__ */ React.createElement(FaXmark, { size: 13 }),
    " Yopish"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSubmit,
      disabled: loading,
      className: "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] disabled:opacity-60"
    },
    loading ? /* @__PURE__ */ React.createElement("svg", { className: "animate-spin w-4 h-4", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), /* @__PURE__ */ React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" })) : /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 12 12", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M2 6l3 3 5-5", stroke: "white", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })),
    "Qo'shish"
  ))))), showDiscard && /* @__PURE__ */ React.createElement(
    DiscardModal,
    {
      onCancel: () => setShowDiscard(false),
      onConfirm: () => {
        setShowDiscard(false);
        onClose();
      }
    }
  ), showParticipants && /* @__PURE__ */ React.createElement(
    ParticipantsModal,
    {
      selected: form.participants,
      users: projectMembers,
      onClose: () => setShowParticipants(false),
      onApply: (vals) => {
        set("participants", vals);
        setShowParticipants(false);
      }
    }
  ));
}
function AttendanceItem({ attendance }) {
  const [expanded, setExpanded] = useState(false);
  const participant = attendance?.user_info;
  const username = participant?.username || "Noma'lum";
  const position = participant?.position || "Xodim";
  const initials = username.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 py-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, participant?.avatar ? /* @__PURE__ */ React.createElement("img", { src: participant?.avatar, alt: "avatar", className: "w-6 h-6 rounded-full object-cover shrink-0" }) : /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-[#9CA3AF] flex items-center justify-center text-white text-[13px] font-semibold shrink-0" }, initials), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col" }, /* @__PURE__ */ React.createElement("span", { className: "text-[13px] font-medium text-[var(--text-strong)] leading-tight" }, username), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-[var(--text-soft)]" }, position))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, attendance.is_attended ? /* @__PURE__ */ React.createElement("div", { className: "px-4 py-1.5 rounded-full bg-[#7A8CEB] text-white text-[11px] font-medium" }, "Qatnashdi") : /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setExpanded(!expanded),
      className: `flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-[11px] font-medium transition-colors cursor-pointer ${attendance.is_excused ? "bg-[#22C55E] hover:bg-[#16a34a]" : "bg-[#EF4444] hover:bg-[#dc2626]"}`
    },
    attendance.is_excused ? "Qatnashmadi | Sababli" : "Qatnashmadi | Sababsiz",
    /* @__PURE__ */ React.createElement(FaChevronDown, { size: 10, className: `transition-transform duration-200 ${expanded ? "rotate-180" : ""}` })
  ))), !attendance.is_attended && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `grid transition-all duration-300 ease-in-out ${expanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "textarea",
      {
        readOnly: true,
        value: attendance.absence_reason || "",
        placeholder: "Sabab ko'rsatilmagan",
        className: `w-full p-3 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] text-[13px] text-[var(--text-strong)] outline-none min-h-[75px] ${!attendance.absence_reason && attendance?.absence_reason?.length !== 0 ? "resize-none!" : "resize-y!"}`
      }
    ))
  ));
}
function EditMeetingModal({ meeting, onClose, canEdit = true, onFinish, onSaved }) {
  const { user } = useAuth();
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copyLink, setCopyLink] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const loadProjectMembers = (projectId) => {
    setMembersLoading(true);
    if (projectId) {
      axiosAPI.get(`/projects/${projectId}/`).then((res) => {
        const proj = res.data?.data ?? res.data;
        const emps = proj?.employees_info ?? [];
        const testers = proj?.testers_info ?? [];
        const manager = proj?.manager_info ? [proj.manager_info] : [];
        const all = [...emps, ...testers, ...manager];
        const seen = /* @__PURE__ */ new Set();
        setProjectMembers(all.filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        }));
      }).catch(() => setProjectMembers([])).finally(() => setMembersLoading(false));
    } else {
      axiosAPI.get("/users/all/", { params: { page_size: 200 } }).then((res) => {
        const list = res.data?.results ?? res.data?.data?.results ?? res.data?.data ?? res.data ?? [];
        const seen = /* @__PURE__ */ new Set();
        setProjectMembers(Array.isArray(list) ? list.filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        }) : []);
      }).catch(() => setProjectMembers([])).finally(() => setMembersLoading(false));
    }
  };
  useEffect(() => {
    axiosAPI.get("/projects/", { params: { page_size: 100 } }).then((res) => {
      const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {
    });
    loadProjectMembers(meeting.project);
  }, []);
  const { date: initDate, time: initTime } = fromIso(meeting.start_time);
  const { val: initDurVal, unit: initDurUnit } = minutesToDisplay(meeting.duration_minutes);
  const [form, setForm] = useState({
    project: meeting.project ?? null,
    title: meeting.title ?? "",
    fine: meeting.penalty_percentage ? String(Math.abs(parseFloat(meeting.penalty_percentage))) : "",
    description: meeting.description ?? "",
    date: initDate,
    time: initTime,
    durationVal: initDurVal,
    participants: meeting.participants_info ?? [],
    is_completed: meeting.is_completed ?? false,
    attendances: meeting.attendances ?? [],
    requires_approval: meeting.requires_approval ?? false
  });
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const handleClose = () => {
    if (isDirty) setShowDiscard(true);
    else onClose();
  };
  const set = (k, v) => {
    setIsDirty(true);
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };
  const handleProjectChange = (v) => {
    if (!canEdit) return;
    setIsDirty(true);
    setForm((p) => ({ ...p, project: v, participants: [] }));
    setErrors((p) => ({ ...p, project: "" }));
    setProjectMembers([]);
    loadProjectMembers(v);
  };
  const handleFine = (val) => {
    set("fine", normalizePercentInput(val));
  };
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const inputCls = (err, ro = !canEdit) => `w-full px-3 py-2.5 rounded-xl text-sm outline-none border text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:placeholder-[var(--text-sub)] ${ro ? "bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] cursor-default" : "bg-[var(--bg-base)]"} ${err ? "border-red-400" : "border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]"} ${!ro ? "focus:border-[var(--accent-sub)]" : ""}`;
  const handleSubmit = async () => {
    if (!canEdit) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const body = {
        title: form.title.trim(),
        participants: form.participants.map((u) => u.id),
        requires_approval: Boolean(form.requires_approval)
      };
      if (form.project) body.project = form.project;
      if (form.description.trim()) body.description = form.description.trim();
      const fineNum = parseFloat(form.fine);
      if (fineNum > 0) body.penalty_percentage = String(fineNum);
      const startIso = toIso(form.date, form.time);
      if (startIso) body.start_time = startIso;
      const mins = durationToMinutes(form.durationVal);
      if (mins) body.duration_minutes = mins;
      const res = await axiosAPI.put(`/meetings/${meeting?.id}/`, body);
      toast.success("Yig'ilish yangilandi", `${meeting?.uid ? meeting.uid + " \u2014 " : ""}O'zgarishlar muvaffaqiyatli saqlandi`);
      onSaved?.();
      onClose();
    } catch (error) {
      console.error(error);
      const errData = error?.response?.data?.error;
      let errMsg = "Xatolik yuz berdi";
      if (errData?.details && typeof errData.details === "object") {
        const detailMsgs = Object.values(errData.details).flat().join(" ");
        if (detailMsgs) errMsg = detailMsgs;
      } else if (errData?.errorMsg) {
        errMsg = errData.errorMsg;
      } else if (typeof error?.response?.data === "string") {
        errMsg = error.response.data;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !showParticipants) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, showParticipants]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center px-4" }, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/60" }), /* @__PURE__ */ React.createElement("button", { onClick: handleClose, className: "fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden", style: { height: 700, maxHeight: "90vh" } }, /* @__PURE__ */ React.createElement("div", { className: "px-7 pt-7 pb-3 shrink-0 " }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-1" }, /* @__PURE__ */ React.createElement("button", { onClick: handleClose, className: "text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0" }, /* @__PURE__ */ React.createElement(FaArrowLeft, { size: 17 })), /* @__PURE__ */ React.createElement("h2", { className: "text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, canEdit ? "Yig'ilishni tahrirlash" : "Yig'ilish ma'lumotlari")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--text-soft)] " }, canEdit ? "Yig'ilish ma'lumotlarini yangilang" : "Yig'ilish haqida to'liq ma'lumot")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto px-7 py-4 flex flex-col gap-3", style: { scrollbarWidth: "thin", scrollbarColor: "#C2C8E0 transparent" } }, /* @__PURE__ */ React.createElement(ProjectDropdown, { value: form.project, onChange: handleProjectChange, error: errors.project, projects, disabled: !canEdit }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Nomi"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: form.title,
      onChange: (e) => canEdit && set("title", e.target.value),
      readOnly: !canEdit,
      placeholder: "Nomi yozing",
      className: inputCls(errors.title)
    }
  ), errors.title && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-500 mt-1" }, "*Bu maydon majburiy")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Jarima foizi (%)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      inputMode: "decimal",
      value: form.fine,
      onChange: (e) => canEdit && handleFine(e.target.value),
      readOnly: !canEdit,
      placeholder: "Jarima foizini kiriting",
      className: inputCls(false)
    }
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Tavsifi"), /* @__PURE__ */ React.createElement(
    ResizableTextarea,
    {
      value: form.description,
      onChange: (e) => canEdit && set("description", e.target.value),
      readOnly: !canEdit,
      placeholder: "Tavsifni yozing",
      rows: 3,
      className: inputCls(false) + (canEdit ? " pr-8" : "")
    },
    form.description && canEdit && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => set("description", ""),
        className: "absolute top-2.5 right-2.5 text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"
      },
      /* @__PURE__ */ React.createElement(FaXmark, { size: 12 })
    )
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-span-2" }, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Boshlanish sanasi"), /* @__PURE__ */ React.createElement(
    DateTimeBox,
    {
      type: "date",
      placeholder: "kk.oo.yyyy",
      value: form.date,
      onChange: (v) => {
        if (!canEdit) return;
        set("date", v);
        if (v && (!form.time || form.time === "00:00")) set("time", "23:59");
      },
      disabled: !canEdit,
      dropUp: true
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Vaqti"), /* @__PURE__ */ React.createElement(
    DateTimeBox,
    {
      type: "time",
      placeholder: "SS:DD",
      value: form.time,
      onChange: (v) => canEdit && set("time", v),
      disabled: !canEdit,
      dropUp: true
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Davomiyligi"), /* @__PURE__ */ React.createElement("div", { className: `flex rounded-xl border overflow-hidden ${!canEdit ? "bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]" : "bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] focus-within:border-[var(--accent-sub)]"}` }, /* @__PURE__ */ React.createElement(
    "input",
    {
      min: "1",
      value: form.durationVal,
      onChange: (e) => canEdit && set("durationVal", e.target.value.replace(/\D/g, "")),
      readOnly: !canEdit,
      placeholder: "40",
      className: "w-12 px-2 py-2.5 text-sm outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "flex items-center px-2 text-xs text-[var(--text-sub)] dark:text-[var(--text-sub)] border-l border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] whitespace-nowrap" }, "daqiqa")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Yig'ilish qatnashchilari"), /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => canEdit && !membersLoading ? setShowParticipants(true) : null,
      className: `w-full min-h-[100px] rounded-[24px] border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] p-3 flex flex-col transition-all
                  ${canEdit && !membersLoading ? "bg-[var(--bg-base)] cursor-pointer hover:border-[var(--accent-sub)]" : "bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] cursor-default"}
                  ${form.participants.length === 0 ? "items-center justify-center" : "items-start justify-start"}`
    },
    form.participants.length === 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--text-sub)] dark:text-[var(--text-soft)] mb-4 text-center" }, !canEdit ? "Qatnashchilar yo'q" : membersLoading ? "Yuklanmoqda..." : "Quyidagi tugma orqali qidiring va tanlang"), canEdit && /* @__PURE__ */ React.createElement("div", { className: `inline-flex items-center gap-1 p-2 rounded-xl text-sm font-medium
                        ${membersLoading ? "bg-[#F1F3F9] text-[#C2C8E0] dark:bg-[var(--bg-elevation-1)] dark:text-[#474848]" : "bg-[#dadff0] dark:bg-[#3a3b3b] text-black dark:text-[var(--accent-soft)] cursor-pointer"}` }, membersLoading ? /* @__PURE__ */ React.createElement("svg", { className: "animate-spin w-4 h-4", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), /* @__PURE__ */ React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" })) : /* @__PURE__ */ React.createElement(FaPlus, { size: 15 }), membersLoading ? "Yuklanmoqda..." : "Qatnashchilarni qo'shing")) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, form.participants.map((u) => /* @__PURE__ */ React.createElement("div", { key: u.id, className: "inline-flex items-center gap-1 px-1 py-0.5 rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] text-[var(--text-strong)] dark:text-[var(--text-strong)] text-xs border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]" }, /* @__PURE__ */ React.createElement("span", { className: "font-medium text-[13px]" }, u.username, u.position_info?.name || u.position ? ` | ${u.position_info?.name || u.position}` : ""), canEdit && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: (ev) => {
          ev.stopPropagation();
          set("participants", form.participants.filter((p) => p.id !== u.id));
        },
        className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1 cursor-pointer"
      },
      /* @__PURE__ */ React.createElement(FaXmark, { size: 12, className: "text-[var(--text-soft)]" })
    ))))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Yig'ilishga qatnashishlar"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, form.attendances?.map((u) => /* @__PURE__ */ React.createElement(AttendanceItem, { key: u.id, attendance: u }))))), /* @__PURE__ */ React.createElement("div", { className: "px-7 py-5 flex items-center justify-between gap-3 shrink-0 bg-[var(--bg-base)]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium text-[var(--text-strong)] dark:text-[var(--text-sub)]" }, "Tasdiqlash talabi"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => canEdit && set("requires_approval", !form.requires_approval),
      disabled: !canEdit,
      className: `relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 ${form.requires_approval ? "bg-[var(--accent-strong)] dark:bg-[#526ED3]" : "bg-[#D0D5E2] dark:bg-[#30363D]"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: `absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${form.requires_approval ? "translate-x-5" : "translate-x-0.5"}` })
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, !meeting.is_completed && (() => {
    const isParticipant = Boolean(
      user?.id && (String(meeting.organizer) === String(user.id) || Array.isArray(meeting.participants) && meeting.participants.map(String).includes(String(user.id)) || Array.isArray(meeting.participants_info) && meeting.participants_info.some((p) => String(p.id) === String(user.id)))
    );
    return isParticipant ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => window.open(`/meetings/${getMeetingCode(meeting.id)}`, "_blank"),
        className: "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] shadow-sm transition-all"
      },
      /* @__PURE__ */ React.createElement(FaVideo, { size: 13 }),
      " Yig'ilishga kirish"
    ) : null;
  })(), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClose,
      className: "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]"
    },
    /* @__PURE__ */ React.createElement(FaXmark, { size: 13 }),
    " Yopish"
  ), canEdit && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSubmit,
      disabled: loading,
      className: "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] disabled:opacity-60"
    },
    loading ? /* @__PURE__ */ React.createElement("svg", { className: "animate-spin w-4 h-4", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), /* @__PURE__ */ React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" })) : /* @__PURE__ */ React.createElement(FaCheck, { size: 13 }),
    "Saqlash"
  ))))), showDiscard && /* @__PURE__ */ React.createElement(
    DiscardModal,
    {
      onCancel: () => setShowDiscard(false),
      onConfirm: () => {
        setShowDiscard(false);
        onClose();
      }
    }
  ), showParticipants && canEdit && /* @__PURE__ */ React.createElement(
    ParticipantsModal,
    {
      selected: form.participants,
      users: projectMembers,
      onClose: () => setShowParticipants(false),
      onApply: (vals) => {
        set("participants", vals);
        setShowParticipants(false);
      }
    }
  ));
}
function MeetingDetailModal({ meeting, onClose }) {
  const [project, setProject] = useState(null);
  const { user } = useAuth();
  const { val: durVal, unit: durUnit } = minutesToDisplay(meeting.duration_minutes);
  const { date: startDate, time: startTime } = fromIso(meeting.start_time);
  const isParticipant = Boolean(
    user?.id && (String(meeting.organizer) === String(user.id) || Array.isArray(meeting.participants) && meeting.participants.map(String).includes(String(user.id)) || Array.isArray(meeting.participants_info) && meeting.participants_info.some((p) => String(p.id) === String(user.id)))
  );
  useEffect(() => {
    if (meeting.project) {
      axiosAPI.get(`/projects/${meeting.project}/`).then((res) => setProject(res.data?.data ?? res.data)).catch(() => {
      });
    }
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const fieldCls = "px-3 py-2.5 rounded-xl text-sm border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)]";
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center px-4" }, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/60" }), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden", style: { height: 700, maxHeight: "90vh" } }, /* @__PURE__ */ React.createElement("div", { className: "px-7 pt-7 pb-4 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-1" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0" }, /* @__PURE__ */ React.createElement(FaArrowLeft, { size: 17 })), /* @__PURE__ */ React.createElement("h2", { className: "text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, "Yig'ilish ma'lumotlari")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--text-soft)] " }, "Yig'ilish haqida to'liq ma'lumot")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto px-7 py-4 flex flex-col gap-4", style: { scrollbarWidth: "thin", scrollbarColor: "#C2C8E0 transparent" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Loyiha"), /* @__PURE__ */ React.createElement("div", { className: fieldCls }, project?.title || /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)]" }, "\u2014"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Nomi"), /* @__PURE__ */ React.createElement("div", { className: fieldCls }, meeting.title || /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)]" }, "\u2014"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Jarima foizi (%)"), /* @__PURE__ */ React.createElement("div", { className: fieldCls }, meeting.penalty_percentage ? `${Math.abs(parseFloat(meeting.penalty_percentage))} %` : /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)]" }, "\u2014")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Tavsifi"), /* @__PURE__ */ React.createElement(ResizableBox, { className: fieldCls + " min-h-[80px] whitespace-pre-wrap" }, meeting.description || /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)]" }, "\u2014"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "col-span-2" }, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Boshlanish sanasi"), /* @__PURE__ */ React.createElement("div", { className: `${fieldCls} flex items-center justify-between` }, /* @__PURE__ */ React.createElement("span", null, startDate ? startDate.split("-").reverse().join(".") : /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)]" }, "\u2014")), /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "shrink-0 text-[var(--text-soft)] ml-1" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M16 2v4M8 2v4M3 10h18" })))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Vaqti"), /* @__PURE__ */ React.createElement("div", { className: `${fieldCls} flex items-center justify-between` }, /* @__PURE__ */ React.createElement("span", null, startTime || /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)]" }, "\u2014")), /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "shrink-0 text-[var(--text-soft)] ml-1" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6v6l4 2" })))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Davomiyligi"), /* @__PURE__ */ React.createElement("div", { className: `${fieldCls} flex items-center gap-1.5` }, /* @__PURE__ */ React.createElement("span", null, durVal || /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)]" }, "\u2014")), durVal && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-[var(--text-soft)]" }, durUnit)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Qatnashchilar"), /* @__PURE__ */ React.createElement("div", { className: "px-3 py-2.5 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] flex flex-wrap gap-1.5 min-h-[44px] items-start" }, meeting.participants_info?.length > 0 ? meeting.participants_info.map((u) => /* @__PURE__ */ React.createElement("span", { key: u.id, className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[#1E2340] dark:text-[var(--accent-soft)]" }, u.username, u.position ? ` | ${u.position}` : "")) : /* @__PURE__ */ React.createElement("span", { className: "text-sm text-[var(--text-soft)]" }, "Qatnashchilar yo'q"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Tasdiqlash talabi"), /* @__PURE__ */ React.createElement("div", { className: fieldCls }, meeting.requires_approval ? "Ha (kirish uchun tashkilotchi tasdig'i talab qilinadi)" : "Yo'q (avtomatik kirish)")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Yig'ilishga qatnashishlar"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, meeting?.attendances?.map((u) => /* @__PURE__ */ React.createElement(AttendanceItem, { key: u.id, attendance: u }))))), /* @__PURE__ */ React.createElement("div", { className: "px-7 py-4 flex items-center justify-between shrink-0 bg-[var(--bg-base)] " }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-medium text-[var(--text-sub)] dark:text-[var(--text-soft)]" }, "Tugatildimi?"), /* @__PURE__ */ React.createElement("div", { className: `relative w-10 h-5 rounded-full ${meeting.is_completed ? "bg-[var(--accent-strong)]" : "bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)]"}` }, /* @__PURE__ */ React.createElement("span", { className: `absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${meeting.is_completed ? "translate-x-5 left-0.5" : "translate-x-0.5 left-0"}` })), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, meeting.is_completed ? "Ha" : "Yo'q")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, !meeting.is_completed && isParticipant && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => window.open(`/meetings/${getMeetingCode(meeting.id)}`, "_blank"),
      className: "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] shadow-sm transition-all"
    },
    /* @__PURE__ */ React.createElement(FaVideo, { size: 13 }),
    " Yig'ilishga kirish"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onClose,
      className: "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]"
    },
    /* @__PURE__ */ React.createElement(FaXmark, { size: 13 }),
    " Yopish"
  )))));
}
function FilterModal({ onClose, onApply, initial }) {
  const [organizer, setOrganizer] = useState(initial.organizer ?? "");
  const [project, setProject] = useState(initial.project ?? "");
  const [status, setStatus] = useState(initial.status ?? "");
  const [dateFrom, setDateFrom] = useState(initial.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initial.dateTo ?? "");
  const [orgSearch, setOrgSearch] = useState("");
  const [prjSearch, setPrjSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    axiosAPI.get("/projects/", { params: { page_size: 100 } }).then((res) => {
      const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? [];
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => {
    });
    axiosAPI.get("/users/all/", { params: { page_size: 200 } }).then((res) => {
      const list = res.data?.results ?? res.data?.data?.results ?? res.data ?? [];
      setUsers(Array.isArray(list) ? list : []);
    }).catch(() => {
    });
  }, []);
  const orgDd = useDropdown();
  const prjDd = useDropdown();
  const stsDd = useDropdown();
  const reset = () => {
    setOrganizer("");
    setProject("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };
  const managers = users.filter((u) => {
    const allRoles = [u.active_role, ...u.roles ?? []].filter(Boolean);
    return allRoles.includes("admin") || allRoles.includes("manager");
  });
  const filteredManagers = orgSearch.trim() ? managers.filter((u) => u.username?.toLowerCase().includes(orgSearch.toLowerCase())) : managers;
  const filteredProjects = prjSearch.trim() ? projects.filter((p) => p.title?.toLowerCase().includes(prjSearch.toLowerCase())) : projects;
  const selectedOrg = managers.find((u) => u.id === organizer);
  const selectedPrj = projects.find((p) => p.id === project);
  const STATUS_OPTIONS = [
    { label: "Tugallangan", value: "true" },
    { label: "Tugallanmagan", value: "false" }
  ];
  const fmtDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    } catch {
      return "";
    }
  };
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  const Avatar = ({ user, size = 8 }) => {
    const [err, setErr] = useState(false);
    const initials = (user?.username ?? "?").slice(0, 2).toUpperCase();
    if (user?.avatar && !err) {
      return /* @__PURE__ */ React.createElement(
        "img",
        {
          src: user.avatar,
          alt: user.username,
          onError: () => setErr(true),
          className: `w-${size} h-${size} rounded-full object-cover shrink-0`
        }
      );
    }
    return /* @__PURE__ */ React.createElement("div", { className: `w-${size} h-${size} rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-sub)] shrink-0` }, initials);
  };
  const ddBase = "absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] overflow-hidden";
  const triggerCls = (val) => `w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border cursor-pointer bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] ${val ? "text-[var(--text-strong)] dark:text-[var(--text-strong)]" : "text-[var(--text-soft)] dark:text-[var(--text-sub)]"}`;
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center px-4" }, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/60" }), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 14 })), /* @__PURE__ */ React.createElement("div", { className: "relative flex flex-col w-full max-w-[600px] h-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)]" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 pt-6 pb-5 " }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-1" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0" }, /* @__PURE__ */ React.createElement(FaArrowLeft, { size: 16 })), /* @__PURE__ */ React.createElement("h2", { className: "text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, "Filtrlash")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-[var(--text-sub)]" }, "Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi")), /* @__PURE__ */ React.createElement("div", { className: "px-6 pb-4 flex flex-1 flex-col gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-3" }, /* @__PURE__ */ React.createElement("div", { ref: orgDd.ref, className: "col-span-1 " }, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Tashkilotchi"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
    orgDd.setOpen((o) => !o);
    setOrgSearch("");
  }, className: triggerCls(organizer) }, selectedOrg ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-left truncate text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, selectedOrg.username), /* @__PURE__ */ React.createElement("span", { onMouseDown: (e) => {
    e.stopPropagation();
    setOrganizer("");
  }, className: "text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer ml-auto shrink-0" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 11 }))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-left" }, "Tanlang"), /* @__PURE__ */ React.createElement(FaChevronDown, { size: 11, className: `text-[var(--text-soft)] transition-transform shrink-0 ${orgDd.open ? "rotate-180" : ""}` }))), orgDd.open && /* @__PURE__ */ React.createElement("div", { className: ddBase, style: { maxHeight: 260, width: 250 } }, /* @__PURE__ */ React.createElement("div", { className: "overflow-y-auto", style: { maxHeight: 200 } }, filteredManagers.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "px-4 py-3 text-sm text-[var(--text-soft)] text-center" }, "Topilmadi") : filteredManagers.map((u, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: u.id,
      type: "button",
      onClick: () => {
        setOrganizer(u.id);
        orgDd.setOpen(false);
        setOrgSearch("");
      },
      className: `w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors
                              ${i < filteredManagers.length - 1 ? "border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" : ""}
                              ${organizer === u.id ? "bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]" : "hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]"}`
    },
    /* @__PURE__ */ React.createElement(Avatar, { user: u, size: 8 }),
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: `text-sm font-semibold truncate ${organizer === u.id ? "text-[var(--accent-strong)] dark:text-[var(--accent-soft)]" : "text-[var(--text-strong)] dark:text-[var(--text-strong)]"}` }, u.username), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-[var(--text-soft)] truncate capitalize" }, (() => {
      const allRoles = [u.active_role, ...u.roles ?? []].filter(Boolean);
      if (allRoles.includes("admin")) return "Administrator";
      if (allRoles.includes("manager")) return "Menejer";
      return u.position || "";
    })())),
    organizer === u.id && /* @__PURE__ */ React.createElement(FaCheck, { size: 11, className: "text-[var(--accent-strong)] shrink-0" })
  )))))), /* @__PURE__ */ React.createElement("div", { ref: prjDd.ref, className: "col-span-1" }, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Loyiha"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => {
    prjDd.setOpen((o) => !o);
    setPrjSearch("");
  }, className: triggerCls(project) }, /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-left truncate" }, selectedPrj?.title || "Tanlang"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 shrink-0 ml-1" }, project ? /* @__PURE__ */ React.createElement("span", { onMouseDown: (e) => {
    e.stopPropagation();
    setProject("");
  }, className: "text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 11 })) : /* @__PURE__ */ React.createElement(FaChevronDown, { size: 11, className: `text-[var(--text-soft)] transition-transform ${prjDd.open ? "rotate-180" : ""}` }))), prjDd.open && /* @__PURE__ */ React.createElement("div", { className: ddBase, style: { maxHeight: 260, width: 250 } }, /* @__PURE__ */ React.createElement("div", { className: "overflow-y-auto", style: { maxHeight: 200 } }, filteredProjects.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "px-4 py-3 text-sm text-[var(--text-soft)] text-center" }, "Topilmadi") : filteredProjects.map((p, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      type: "button",
      onClick: () => {
        setProject(p.id);
        prjDd.setOpen(false);
        setPrjSearch("");
      },
      className: `w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors
                              ${i < filteredProjects.length - 1 ? "border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" : ""}
                              ${project === p.id ? "bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]" : "hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: `text-sm font-semibold truncate ${project === p.id ? "text-[var(--accent-strong)] dark:text-[var(--accent-soft)]" : "text-[var(--text-strong)] dark:text-[var(--text-strong)]"}` }, p.title), p.description && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-[var(--text-soft)] truncate mt-0.5" }, p.description)),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, (p.deadline || p.end_date) && /* @__PURE__ */ React.createElement("span", { className: "text-[11px] text-[var(--text-soft)] whitespace-nowrap" }, fmtDate(p.deadline || p.end_date)), project === p.id && /* @__PURE__ */ React.createElement(FaCheck, { size: 11, className: "text-[var(--accent-strong)]" }))
  )))))), /* @__PURE__ */ React.createElement("div", { ref: stsDd.ref, className: "col-span-1" }, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Holati"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => stsDd.setOpen((o) => !o), className: triggerCls(status) }, /* @__PURE__ */ React.createElement("span", { className: "flex-1 text-left truncate" }, STATUS_OPTIONS.find((s) => s.value === status)?.label || "Tanlang"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 shrink-0 ml-1" }, status ? /* @__PURE__ */ React.createElement("span", { onMouseDown: (e) => {
    e.stopPropagation();
    setStatus("");
  }, className: "text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer" }, /* @__PURE__ */ React.createElement(FaXmark, { size: 11 })) : /* @__PURE__ */ React.createElement(FaChevronDown, { size: 11, className: `text-[var(--text-soft)] transition-transform ${stsDd.open ? "rotate-180" : ""}` }))), stsDd.open && /* @__PURE__ */ React.createElement("div", { className: ddBase }, STATUS_OPTIONS.map((s, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.value,
      type: "button",
      onClick: () => {
        setStatus(s.value);
        stsDd.setOpen(false);
      },
      className: `w-full px-4 py-2.5 text-left text-sm cursor-pointer
                          ${i < STATUS_OPTIONS.length - 1 ? "border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" : ""}
                          ${status === s.value ? "bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]" : "text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]"}`
    },
    s.label
  )))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: labelCls }, "Boshlanish sanasi oralig'i"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(DateTimeBox, { type: "date", placeholder: "dan", value: dateFrom, onChange: setDateFrom }), /* @__PURE__ */ React.createElement(DateTimeBox, { type: "date", placeholder: "gacha", value: dateTo, onChange: setDateTo })))), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-5 flex items-center justify-end gap-3 border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: reset,
      className: "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]"
    },
    /* @__PURE__ */ React.createElement(FaXmark, { size: 13 }),
    " Tozalash"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onApply({ organizer, project, status, dateFrom, dateTo }),
      className: "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.35-4.35" })),
    "Qidirish"
  ))));
}
function RowMenu({ onDetail, onEdit, onDelete, onFinish, onDuplicate, isCompleted, project }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const edit = project.organizer === user?.id && !project.is_completed;
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return /* @__PURE__ */ React.createElement("div", { ref, className: "relative flex justify-end" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: (e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      },
      className: "w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-soft)] cursor-pointer "
    },
    /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "5", r: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "19", r: "1.5" }))
  ), open && /* @__PURE__ */ React.createElement("div", { className: "absolute top-full right-0 mt-1 z-50 w-48 rounded-2xl shadow-xl border overflow-hidden bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        onDetail();
        setOpen(false);
      },
      className: "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" })),
    "Ko'rish"
  ), edit && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        onEdit();
        setOpen(false);
      },
      className: "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }), /* @__PURE__ */ React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })),
    "Tahrirlash"
  ), onDuplicate && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        onDuplicate();
        setOpen(false);
      },
      className: "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })),
    "Takrorlash"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        onDelete();
        setOpen(false);
      },
      className: "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1A1A] cursor-pointer"
    },
    /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("polyline", { points: "3 6 5 6 21 6" }), /* @__PURE__ */ React.createElement("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }), /* @__PURE__ */ React.createElement("path", { d: "M10 11v6M14 11v6" }), /* @__PURE__ */ React.createElement("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })),
    "O'chirish"
  )));
}
export default function MeetingsPage() {
  const { registerAction, clearAction } = usePageAction();
  const { user } = useAuth();
  const isAuditor = user?.active_role === "auditor";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [duplicateMeeting, setDuplicateMeeting] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [copiedUid, setCopiedUid] = useState(null);
  const [attendanceMeetingId, setAttendanceMeetingId] = useState(null);
  const scrollRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    const p = { page: pg, page_size: 20 };
    if (q) p.search = q;
    if (f.organizer) p.organizer = f.organizer;
    if (f.project) p.project = f.project;
    if (f.status !== void 0 && f.status !== "") p.is_completed = f.status;
    if (f.dateFrom) p.start_date_gte = f.dateFrom;
    if (f.dateTo) p.start_date_lte = f.dateTo;
    return p;
  }, [filters, search]);
  const getProjects = async () => {
    try {
      const { data: data2 } = await axiosAPI.get("/project-shorts/");
      setProjects(data2?.data.results);
    } catch (error) {
      console.error(error);
      toast.error(error.results.data.error.errMsg || "Xatolik yuz berdi");
    }
  };
  const loadMeetings = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await axiosAPI.get("/meetings/", { params: buildParams(f, q, pg) });
      const payload = res.data?.data ?? res.data;
      const results = Array.isArray(payload) ? payload : payload.results ?? [];
      const next = Array.isArray(payload) ? null : payload.next ?? null;
      setData((prev) => pg === 1 ? results : [...prev, ...results]);
      setHasMore(!!next);
      setPage(pg);
    } catch (err) {
      toast.error("Xatolik", err?.response?.data?.detail || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams]);
  useEffect(() => {
    loadMeetings();
    getProjects();
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadMeetings(filters, search, page + 1);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, page, filters, search]);
  const runSearch = (val) => {
    const q = val.trim();
    setSearch(q);
    loadMeetings(filters, q, 1);
  };
  const handleApplyFilter = (f) => {
    setFilters(f);
    setShowFilter(false);
    loadMeetings(f, search, 1);
  };
  const handleClose = async (id) => {
    try {
      const meeting = data.find((m) => m.id === id);
      const res = await axiosAPI.post(`/meetings/${id}/close/`);
      const updated = res.data?.data ?? res.data;
      setData((prev) => prev.map((m) => m.id === id ? { ...m, is_completed: true, ...updated } : m));
      toast.success("Yig'ilish yakunlandi", `${meeting?.uid ? meeting.uid + " \u2014 " : ""}Yig'ilish muvaffaqiyatli yakunlandi`);
      loadMeetings(filters, search, 1);
    } catch (err) {
      toast.error("Xatolik", parseApiError(err, "Yakunlashda xatolik"));
    }
  };
  const handleDelete = async (id) => {
    try {
      const meeting = data.find((m) => m.id === id);
      await axiosAPI.delete(`/meetings/${id}/`);
      setData((prev) => prev.filter((m) => m.id !== id));
      toast.delete("Yig'ilish o'chirildi", `${meeting?.uid ? meeting.uid + " \u2014 " : ""}Yig'ilish chiqindi qutisiga yuborildi`);
      loadMeetings(filters, search, 1);
    } catch (err) {
      toast.error("Xatolik", parseApiError(err, "O'chirishda xatolik"));
    }
  };
  const loadMeetingDetail = async (id, mode = "detail") => {
    setMeetingLoading(true);
    try {
      const res = await axiosAPI.get(`/meetings/${id}/`);
      let meeting = res.data?.data ?? res.data;
      if (meeting.id) {
        const { data: data2 } = await axiosAPI.get(`meeting-attendance/?meeting=${meeting?.id}`);
        const attendances = data2?.data?.results ?? data2?.data;
        meeting.attendances = attendances;
      }
      if (mode === "edit" && meeting.organizer === user.id && !meeting?.is_completed) setEditItem(meeting);
      else setDetail(meeting);
    } catch (err) {
      toast.error("Xatolik", "Yig'ilish ma'lumotlarini yuklashda xatolik");
    } finally {
      setMeetingLoading(false);
    }
  };
  const handleDuplicate = async (id) => {
    setMeetingLoading(true);
    try {
      const res = await axiosAPI.get(`/meetings/${id}/`);
      const meeting = res.data?.data ?? res.data;
      setDuplicateMeeting(meeting);
      setShowAdd(true);
    } catch (err) {
      toast.error("Xatolik", parseApiError(err, "Yig'ilish ma'lumotlarini yuklashda xatolik"));
    } finally {
      setMeetingLoading(false);
    }
  };
  const hasFilter = Object.values(filters).some((v) => v !== "" && v !== void 0 && v !== null);
  useEffect(() => {
    if (isAuditor) return;
    registerAction({
      label: "Yig'ilish qo'shish",
      icon: /* @__PURE__ */ React.createElement("img", { src: "/imgs/addmeetingIcon.svg", alt: "", className: "w-4 h-4 brightness-0 invert" }),
      onClick: () => setShowAdd(true)
    });
    return () => clearAction();
  }, []);
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col h-full gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "svg",
    {
      className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-sub)]",
      width: "15",
      height: "15",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2"
    },
    /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }),
    /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.35-4.35" })
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Nomi bo'yicha izlash",
      value: searchInput,
      onChange: (e) => setSearchInput(e.target.value),
      onKeyDown: (e) => {
        if (e.key === "Enter") runSearch(searchInput);
      },
      className: "pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[220px]\r\n              bg-[#F1F3F9] border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] focus:border-[var(--accent-sub)]\r\n              dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)] dark:placeholder-[var(--text-sub)]"
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowFilter(true),
      className: "relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-bold border  cursor-pointer\r\n            bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]"
    },
    /* @__PURE__ */ React.createElement("img", { src: "/imgs/filterIcon.svg", alt: "", className: "w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]" }),
    " Filtrlash",
    hasFilter && /* @__PURE__ */ React.createElement("span", { className: "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-strong)]" })
  )), /* @__PURE__ */ React.createElement("div", { ref: scrollRef, className: "overflow-auto h-[calc(100vh-155px)]" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-sm whitespace-nowrap" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-10 bg-slate-50 dark:bg-[var(--bg-elevation-1)]" }, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]" }, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] w-10" }, "\u2116"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]" }, "UID"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]" }, "Nomi"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-green-500 inline-block" }), "Tashkilotchi")), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]" }, "Loyiha"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]" }, "Boshlanish vaqti"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]" }, "Davomiyligi"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-center font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]" }, "Tugatildimi?"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 w-10" }))), /* @__PURE__ */ React.createElement("tbody", null, loading ? Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ React.createElement("tr", { key: i, className: "border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => /* @__PURE__ */ React.createElement("td", { key: j, className: "px-4 py-3" }, /* @__PURE__ */ React.createElement("div", { className: "h-4 rounded-lg bg-[#EEF1F7] dark:bg-[var(--bg-elevation-2)] animate-pulse", style: { width: j === 1 ? 32 : "80%" } }))))) : data.map((m, idx) => {
    const project = projects.find((p) => p.id === m.project);
    const organizer = m.participants_info?.find((u) => u.id === m.organizer) ?? m.participants_info?.[0];
    const { val: durVal, unit: durUnit } = minutesToDisplay(m.duration_minutes);
    return /* @__PURE__ */ React.createElement(
      "tr",
      {
        key: m.id,
        className: "border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]  cursor-pointer",
        onClick: () => loadMeetingDetail(m.id, isAuditor && m?.is_completed ? "detail" : "edit")
      },
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)]  font-medium" }, idx + 1),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-medium", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 group" }, /* @__PURE__ */ React.createElement("span", { className: "text-[var(--text-soft)] dark:text-[var(--text-sub)]" }, m.uid || ""), m.uid && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            navigator.clipboard.writeText(m.uid).then(() => {
              setCopiedUid(m.id);
              setTimeout(() => setCopiedUid(null), 2e3);
            }).catch(() => {
            });
          },
          className: "opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer text-[var(--text-soft)] dark:text-[var(--text-sub)]"
        },
        copiedUid === m.id ? /* @__PURE__ */ React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }, /* @__PURE__ */ React.createElement("path", { d: "M20 6L9 17l-5-5", strokeLinecap: "round", strokeLinejoin: "round" })) : /* @__PURE__ */ React.createElement("svg", { stroke: "currentColor", fill: "currentColor", strokeWidth: "0", viewBox: "0 0 256 256", height: "16", width: "16", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "M216,28H88A12,12,0,0,0,76,40V76H40A12,12,0,0,0,28,88V216a12,12,0,0,0,12,12H168a12,12,0,0,0,12-12V180h36a12,12,0,0,0,12-12V40A12,12,0,0,0,216,28ZM156,204H52V100H156Zm48-48H180V88a12,12,0,0,0-12-12H100V52H204Z" }))
      ))),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, m.title),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, organizer?.username || ""),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, project?.title || ""),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, fmtDt(m.start_time)),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]" }, durVal ? `${durVal} ${durUnit}` : ""),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 text-center" }, /* @__PURE__ */ React.createElement("span", { className: `inline-flex items-center justify-center w-7 h-7 rounded-lg ${m.is_completed ? "bg-[#22c55e]" : "bg-[#EF4444]"}` }, m.is_completed ? /* @__PURE__ */ React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 12 12", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M2 6l3 3 5-5", stroke: "white", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })) : /* @__PURE__ */ React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 12 12", fill: "none" }, /* @__PURE__ */ React.createElement("path", { d: "M2 2l8 8M10 2l-8 8", stroke: "white", strokeWidth: "1.8", strokeLinecap: "round" })))),
      /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3", onClick: (e) => e.stopPropagation() }, !isAuditor && /* @__PURE__ */ React.createElement(
        RowMenu,
        {
          onDetail: () => loadMeetingDetail(m.id, "detail"),
          onEdit: () => loadMeetingDetail(m.id, "edit"),
          onFinish: () => setAttendanceMeetingId(m.id),
          onDuplicate: () => handleDuplicate(m.id),
          isCompleted: !!m.is_completed,
          onDelete: () => handleDelete(m.id),
          project: m
        }
      ))
    );
  }))), !loading && data.length === 0 && /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "/imgs/yigilishlarIcon.svg",
      title: "Yig'ilishlar topilmadi",
      description: "Yangi yig'ilish yarating yoki filtrlarni tekshiring"
    }
  ), loadingMore && /* @__PURE__ */ React.createElement("div", { className: "py-4 text-center text-sm text-[var(--text-disabled)] dark:text-[var(--text-soft)]" }, /* @__PURE__ */ React.createElement("svg", { className: "animate-spin inline w-4 h-4 mr-2", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), /* @__PURE__ */ React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" })), "Yuklanmoqda...")), detail && /* @__PURE__ */ React.createElement(MeetingDetailModal, { meeting: detail, onClose: () => setDetail(null) }), showFilter && /* @__PURE__ */ React.createElement(
    FilterModal,
    {
      initial: filters,
      onClose: () => setShowFilter(false),
      onApply: handleApplyFilter
    }
  ), showAdd && /* @__PURE__ */ React.createElement(
    AddMeetingModal,
    {
      onClose: () => {
        setShowAdd(false);
        setDuplicateMeeting(null);
      },
      loadMeetings: () => loadMeetings(filters, search, 1),
      initialData: duplicateMeeting
    }
  ), editItem && /* @__PURE__ */ React.createElement(
    EditMeetingModal,
    {
      meeting: editItem,
      onClose: () => setEditItem(null),
      onSaved: () => loadMeetings(filters, search, 1),
      onFinish: (id) => {
        setEditItem(null);
        setAttendanceMeetingId(id);
      },
      canEdit: (() => {
        const isAdminOrManager = user?.active_role === "admin" || user?.active_role === "manager";
        const isOwner = editItem.organizer === user?.id || editItem.created_by === user?.id;
        return isAdminOrManager || isOwner;
      })()
    }
  ), meetingLoading && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9998] flex items-center justify-center bg-black/30" }, /* @__PURE__ */ React.createElement("svg", { className: "animate-spin w-8 h-8 text-white", viewBox: "0 0 24 24", fill: "none" }, /* @__PURE__ */ React.createElement("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), /* @__PURE__ */ React.createElement("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" }))), attendanceMeetingId && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[9999] bg-black/30", onClick: () => setAttendanceMeetingId(null) }), /* @__PURE__ */ React.createElement(
    MeetingAttendanceModal,
    {
      meetingId: attendanceMeetingId,
      closeMeetingOnSave: true,
      onClose: () => {
        setAttendanceMeetingId(null);
        loadMeetings(filters, search, 1);
      }
    }
  )));
}
