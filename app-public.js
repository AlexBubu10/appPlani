// app-public.js (Firestore realtime, importes por CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import firebaseConfig from "./firebase-config.js?v=8"; // export default

marked.setOptions({ gfm: true, breaks: true });

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const days = [
  { key:"monday", label:"Lunes", dow:1 },
  { key:"tuesday", label:"Martes", dow:2 },
  { key:"wednesday", label:"Miércoles", dow:3 },
  { key:"thursday", label:"Jueves", dow:4 },
  { key:"friday", label:"Viernes", dow:5 },
  { key:"saturday", label:"Sábado", dow:6 }, // si querés sábado
];

let cache = {};

function setCurrentMonth(){
  const el=$("#currentMonth"); if(!el) return;
  const txt=new Intl.DateTimeFormat("es-AR",{month:"long",year:"numeric"}).format(new Date());
  el.textContent = txt.charAt(0).toUpperCase()+txt.slice(1);
}
function getTodayKey(){
  const g=new Date().getDay();
  const f=days.find(d=>d.dow===g);
  return f? f.key : "monday";
}
function resaltarPalabras(texto) {
  const palabras = [
    "Activación",
    "Activación Específica",
    "Bloque De Fuerza",
    "Gimnásticos",
    "Gimnástico",
    "Bloque De Levantamiento",
    "Accesorios",
    "WOD",
    "WOD 1",
    "WOD 2",
    "Acondicionamiento",
    "Nota:"
  ];
  palabras.forEach(palabra => {
    const regex = new RegExp(palabra, "gi");
    texto = texto.replace(regex, match =>
      `<b style="text-transform:uppercase; text-decoration:underline;">${match}</b>`
    );
  });
  return texto;
}
function renderDay(dayKey){
  $$("[data-day]").forEach(b=>b.classList.remove("tab-active"));
  document.querySelector(`[data-day="${dayKey}"]`)?.classList.add("tab-active");
  const md=(cache[dayKey]||"").trim();
  const html = md ? resaltarPalabras(marked.parse(md))
                  : `<p class="text-slate-500">Todavía no hay planificación cargada para <b>${days.find(d=>d.key===dayKey)?.label||dayKey}</b>.</p>`;
  $("#studentContent").innerHTML = html;
}

document.addEventListener("DOMContentLoaded", async ()=>{
  console.log("[public] projectId:", firebaseConfig.projectId);
  setCurrentMonth();

  // Tabs
  const tabs=$("#tabs"); tabs.innerHTML="";
  days.forEach((d,i)=>{
    const b=document.createElement("button");
    b.className=`tab${i===0?" tab-active":""}`; b.textContent=d.label; b.dataset.day=d.key;
    b.addEventListener("click",()=>renderDay(d.key));
    tabs.appendChild(b);
  });

  // Primera lectura + realtime
  const ref = doc(db,"plans","week");
  const snap0 = await getDoc(ref);
  cache = snap0.exists()? snap0.data() : {};
  console.log("[public] first getDoc:", cache);
  renderDay(getTodayKey());

  onSnapshot(ref, (snap)=>{
    cache = snap.exists()? snap.data() : {};
    console.log("[public] onSnapshot:", cache);
    const active = document.querySelector(".tab.tab-active")?.dataset.day || getTodayKey();
    renderDay(active);
  }, (err)=>{
    console.error("[public] onSnapshot error:", err);
  });
});
