// app-admin.js (Firestore + PIN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js?v=6";

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const days = [
  { key:"monday", label:"Lunes" },
  { key:"tuesday", label:"Martes" },
  { key:"wednesday", label:"Miércoles" },
  { key:"thursday", label:"Jueves" },
  { key:"friday", label:"Viernes" },
  { key:"saturday", label:"Sábado" }, // si lo vas a usar
];

let cache = {};
let selectedDay = "";

function setCurrentMonth(){
  const el=$("#currentMonth"); if(!el) return;
  const txt=new Intl.DateTimeFormat("es-AR",{month:"long",year:"numeric"}).format(new Date());
  el.textContent = txt.charAt(0).toUpperCase()+txt.slice(1);
}
function setUIEnabled(on){
  $("#planTextarea").disabled = !on;
  $("#saveBtn").disabled      = !on;
}
function selectDay(dayKey){
  selectedDay = dayKey || "";
  $$("[data-day]").forEach(b=>b.classList.remove("tab-active"));
  if(dayKey) document.querySelector(`[data-day="${dayKey}"]`)?.classList.add("tab-active");
  $("#dayKey").value = dayKey || "";
  $("#dayLabel").textContent = dayKey ? (days.find(d=>d.key===dayKey)?.label||dayKey) : "—";
  if(!dayKey){ $("#planTextarea").value=""; setUIEnabled(false); return; }
  $("#planTextarea").value = (cache[dayKey]||"").trim();
  setUIEnabled(true);
}

async function loadPlans(){
  const ref = doc(db,"plans","week");
  const snap = await getDoc(ref);
  cache = snap.exists()? snap.data() : {};
}

async function savePlan(){
  if(!selectedDay){ toast("Elegí un día primero"); return; }
  const pin = localStorage.getItem("cf_pin") || prompt("Ingresá tu PIN para guardar:");
  if(!pin){ toast("Guardado cancelado"); return; }
  localStorage.setItem("cf_pin", pin);

  try{
    const content = $("#planTextarea").value;
    const ref = doc(db,"plans","week");
    await setDoc(ref, { [selectedDay]: content, updatedAt: Date.now(), _pin: pin }, { merge:true });
    cache[selectedDay] = content;
    toast(`Guardado (Firestore) — ${days.find(d=>d.key===selectedDay)?.label||selectedDay}`);
  }catch(e){
    console.error("Error Firestore:", e);
    toast("Error al guardar en Firestore (PIN/reglas/config)");
  }
}

function toast(msg){
  const t=document.createElement("div");
  t.className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-sky-600 text-white px-4 py-2 rounded-xl shadow-lg";
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),1800);
}

document.addEventListener("DOMContentLoaded", async ()=>{
  setCurrentMonth();

  // Tabs
  const tabs=$("#tabs");
  (days).forEach(d=>{
    const b=document.createElement("button");
    b.className="tab"; b.textContent=d.label; b.dataset.day=d.key;
    b.addEventListener("click",()=>selectDay(d.key));
    tabs.appendChild(b);
  });
  // Select
  $("#daySelect")?.addEventListener("change", e=> selectDay(e.target.value));

  selectDay("");               // inicia sin día
  await loadPlans();           // trae lo que haya en Firestore
  $("#saveBtn").addEventListener("click", savePlan);

  // Atajo Ctrl/Cmd+S
  document.addEventListener("keydown",(e)=>{
    const isSave=(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s";
    if(isSave){ e.preventDefault(); $("#saveBtn").click(); }
  });
});
