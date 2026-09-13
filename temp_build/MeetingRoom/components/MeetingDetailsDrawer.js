import { useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { RiInformationLine } from "react-icons/ri";
import {
  TbLink,
  TbCopy,
  TbCheck,
  TbCalendarEvent,
  TbClock,
  TbUser,
  TbFolder,
  TbShieldCheck,
  TbId
} from "react-icons/tb";
import { toast } from "../../../Toast/ToastProvider";
import { getMeetingCode, getFullMeetingUrl } from "../utils/meetingCode";
export default function MeetingDetailsDrawer({
  isOpen,
  onClose,
  meetingDetails,
  meetingState,
  meetingId,
  projectData
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const code = getMeetingCode(meetingId);
  const fullUrl = getFullMeetingUrl(meetingId);
  const uid = meetingDetails?.uid || (meetingId ? `MTG-${meetingId}` : "");
  const title = meetingDetails?.title || meetingState?.title || "Yig'ilish";
  const projectName = meetingDetails?.project_info?.title || meetingDetails?.project_title || projectData?.title || "";
  const organizerName = meetingDetails?.organizer_info?.username || meetingDetails?.organizer_info?.first_name || meetingDetails?.organizer?.username || (typeof meetingDetails?.organizer === "string" ? meetingDetails.organizer : null) || meetingState?.organizer_name || "Tashkilotchi";
  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedLink(true);
        toast.success("Nusxa olindi", "Yig'ilish havolasi nusxalandi");
        setTimeout(() => setCopiedLink(false), 2e3);
      }).catch(() => {
        toast.error("Xatolik", "Havolani nusxalashda xatolik yuz berdi");
      });
    }
  };
  const handleCopyUid = () => {
    if (uid && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(uid).then(() => {
        setCopiedUid(true);
        toast.success("Nusxa olindi", `UID nusxalandi: ${uid}`);
        setTimeout(() => setCopiedUid(false), 2e3);
      }).catch(() => {
      });
    }
  };
  const formatStartTime = (iso) => {
    if (!iso) return "Rejalashtirilgan";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${mins}`;
    } catch {
      return iso;
    }
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onClose,
      className: `fixed inset-0 bg-black/60 backdrop-blur-xs z-30 sm:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`
    }
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `fixed sm:relative top-0 right-0 bottom-0 h-full flex flex-col bg-[#202124] shadow-2xl z-40 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${isOpen ? "w-full sm:w-[380px] translate-x-0 opacity-100 pointer-events-auto border-l border-[#3c4043]" : "w-0 translate-x-full sm:translate-x-0 sm:w-0 opacity-0 pointer-events-none border-l-0"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "w-full sm:w-[380px] h-full flex flex-col shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-5 py-4 border-b border-[#3c4043] bg-[#202124] shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-9 h-9 rounded-2xl bg-blue-500/10 text-[#8ab4f8] flex items-center justify-center border border-blue-500/20 shadow-sm" }, /* @__PURE__ */ React.createElement(RiInformationLine, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-white leading-tight" }, "Yig'ilish tafsilotlari"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400" }, "Havola va rasmiy ma'lumotlar"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onClose,
        className: "w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-all active:scale-90",
        title: "Yopish"
      },
      /* @__PURE__ */ React.createElement(FaXmark, { size: 14 })
    )), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex-1 overflow-y-auto p-4 space-y-4 bg-[#18191c]/50 text-xs",
        style: { scrollbarWidth: "thin", scrollbarColor: "#3c4043 transparent" }
      },
      /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl bg-[#282a2d] border border-white/10 shadow-lg space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider" }, "Qo'shilish ma'lumotlari"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-[#8ab4f8]/15 text-[#8ab4f8] text-[10px] font-bold border border-[#8ab4f8]/25" }, "Meet Havolasi")), /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-xl bg-[#1f2023] border border-white/5 space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-300 font-mono text-xs break-all" }, /* @__PURE__ */ React.createElement(TbLink, { size: 15, className: "text-[#8ab4f8] shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-[#8ab4f8] select-all font-semibold leading-relaxed" }, fullUrl)), /* @__PURE__ */ React.createElement("div", { className: "pt-2 border-t border-white/5 flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-mono text-slate-400" }, "Kod: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, code)), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleCopyLink,
          className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-600/30 text-xs"
        },
        copiedLink ? /* @__PURE__ */ React.createElement(TbCheck, { size: 13 }) : /* @__PURE__ */ React.createElement(TbCopy, { size: 13 }),
        /* @__PURE__ */ React.createElement("span", null, copiedLink ? "Nusxalandi" : "Nusxa olish")
      ))), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 leading-snug" }, "Ushbu havolani boshqa ishtirokchilarga yuborib, ularni yig'ilishga taklif qilishingiz mumkin.")),
      /* @__PURE__ */ React.createElement("div", { className: "p-4 rounded-2xl bg-[#282a2d] border border-white/10 shadow-lg space-y-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-slate-400 uppercase tracking-wider block" }, "Yig'ilish parametrlari"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between p-2.5 rounded-xl bg-[#1f2023] border border-white/5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-slate-300" }, /* @__PURE__ */ React.createElement(TbId, { size: 16, className: "text-amber-400 shrink-0" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-slate-400" }, "Rasmiy UID"), /* @__PURE__ */ React.createElement("div", { className: "font-mono font-bold text-white text-xs" }, uid))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: handleCopyUid,
          className: "p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-all",
          title: "UID dan nusxa olish"
        },
        copiedUid ? /* @__PURE__ */ React.createElement(TbCheck, { size: 13, className: "text-emerald-400" }) : /* @__PURE__ */ React.createElement(TbCopy, { size: 13 })
      )), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2.5 p-2.5 rounded-xl bg-[#1f2023] border border-white/5" }, /* @__PURE__ */ React.createElement(TbCalendarEvent, { size: 16, className: "text-emerald-400 shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-slate-400" }, "Yig'ilish mavzusi"), /* @__PURE__ */ React.createElement("div", { className: "font-bold text-white text-xs leading-snug" }, title))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1f2023] border border-white/5" }, /* @__PURE__ */ React.createElement(TbUser, { size: 16, className: "text-purple-400 shrink-0" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-slate-400" }, "Tashkilotchi"), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white text-xs" }, organizerName))), projectName && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1f2023] border border-white/5" }, /* @__PURE__ */ React.createElement(TbFolder, { size: 16, className: "text-blue-400 shrink-0" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-slate-400" }, "Tegishli loyiha"), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white text-xs truncate max-w-[240px]" }, projectName))), meetingDetails?.start_time && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1f2023] border border-white/5" }, /* @__PURE__ */ React.createElement(TbClock, { size: 16, className: "text-teal-400 shrink-0" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-slate-400" }, "Boshlanish vaqti"), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white text-xs" }, formatStartTime(meetingDetails.start_time), meetingDetails?.duration_minutes && /* @__PURE__ */ React.createElement("span", { className: "text-slate-400 ml-1.5 font-normal" }, "(", meetingDetails.duration_minutes, " daqiqa)")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1f2023] border border-white/5" }, /* @__PURE__ */ React.createElement(TbShieldCheck, { size: 16, className: "text-orange-400 shrink-0" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-slate-400" }, "Xavfsizlik & Kirish"), /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-white text-xs" }, meetingDetails?.requires_approval ? "Kutish xonasi (Tashkilotchi tasdiqlaydi)" : "To'g'ridan-to'g'ri ulanish")))), meetingDetails?.description && /* @__PURE__ */ React.createElement("div", { className: "p-3 rounded-xl bg-[#1f2023] border border-white/5 space-y-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 font-semibold uppercase tracking-wider block" }, "Kun tartibi / Tavsif"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-300 text-xs leading-relaxed whitespace-pre-wrap" }, meetingDetails.description)))
    ))
  ));
}
