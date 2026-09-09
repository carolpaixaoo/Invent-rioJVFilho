import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Search, Trash2, Pencil, X,
  ClipboardList, Boxes, History, Truck, FileText, Copy, Check, Printer, Building2, LogOut,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const COLORS = {
  bg: "#F1EDE6", surface: "#FFFFFF", surfaceAlt: "#FAF6EF",
  text: "#22201C", textMuted: "#736C60",
  accent: "#C63A2E", accentDark: "#A82E23",
  steel: "#22283F", steelLight: "#B9BECF",
  border: "#DBD3C4", danger: "#B23A2E", dangerBg: "#F6E4E1",
  success: "#4C7A51", successBg: "#E7EFE6",
  warning: "#B8791A", warningBg: "#F6ECD9",
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
const daysBetween = (fromISO, toISO) => Math.round((new Date(toISO) - new Date(fromISO)) / 86400000);
const equipStatus = (dataFim) => {
  if (!dataFim) return { label: "Sem prazo", tone: "warning" };
  const diff = daysBetween(todayISO(), dataFim);
  if (diff < 0) return { label: "Vencido", tone: "danger" };
  if (diff <= 7) return { label: "Vence essa semana", tone: "warning" };
  return { label: "Em vigência", tone: "success" };
};

const inputStyle = { border: `1px solid ${COLORS.border}` };

// ---------------------------------------------------------------------------
// AUTENTICAÇÃO
// ---------------------------------------------------------------------------
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("E-mail ou senha inválidos.");
    setLoading(false);
  }

  return (
    <div style={{ background: COLORS.steel, minHeight: "100vh" }} className="flex items-center justify-center p-4">
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, width: "100%" }} className="rounded-md p-5">
        <div style={{ maxWidth: 360, margin: "0 auto" }}>
          <img src="/logo.png" alt="JV Filho Engenharia" style={{ height: 48, margin: "0 auto 20px", display: "block" }} />
          <form onSubmit={handleLogin}>
            <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>E-mail</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ ...inputStyle, marginBottom: 12 }} className="w-full px-3 py-2 rounded-md text-sm"
            />
            <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Senha</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ ...inputStyle, marginBottom: 12 }} className="w-full px-3 py-2 rounded-md text-sm"
            />
            {error && <p className="text-sm" style={{ color: COLORS.danger, marginBottom: 12 }}>{error}</p>}
            <button
              type="submit" disabled={loading}
              style={{ background: COLORS.accent, color: "#fff", width: "100%" }}
              className="py-2 rounded-md text-sm font-medium"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="text-xs" style={{ color: COLORS.textMuted, marginTop: 16, textAlign: "center" }}>
            Acesso apenas para a equipe. Peça ao administrador para criar seu usuário no painel do Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP PRINCIPAL
// ---------------------------------------------------------------------------
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh" }} className="flex items-center justify-center">
        <p style={{ color: COLORS.textMuted }} className="text-sm">Carregando...</p>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return <MainApp session={session} />;
}

function MainApp({ session }) {
  const [loading, setLoading] = useState(true);
  const [obras, setObras] = useState([]);
  const [activeObraId, setActiveObraId] = useState(() => localStorage.getItem("activeObraId") || null);
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm());
  const [editingId, setEditingId] = useState(null);

  const [moveForm, setMoveForm] = useState(emptyMoveForm());
  const [moveError, setMoveError] = useState("");

  const [showEquipForm, setShowEquipForm] = useState(false);
  const [equipForm, setEquipForm] = useState(emptyEquipForm());
  const [editingEquipId, setEditingEquipId] = useState(null);

  const [showObraForm, setShowObraForm] = useState(false);
  const [obraForm, setObraForm] = useState(emptyObraForm());
  const [editingObraId, setEditingObraId] = useState(null);

  function emptyItemForm() { return { codigo: "", nome: "", categoria: "", unidade: "un", quantidade: "", pontoReposicao: "", local: "" }; }
  function emptyMoveForm() { return { itemId: "", tipo: "Entrada", quantidade: "", data: todayISO(), responsavel: "", observacao: "" }; }
  function emptyEquipForm() { return { nome: "", fornecedor: "", dataInicio: todayISO(), dataFim: "", local: "", valorDiaria: "", observacao: "" }; }
  function emptyObraForm() { return { nome: "", endereco: "", responsavel: "", dataInicio: todayISO() }; }

  async function loadAll() {
    setLoading(true);
    const [obrasRes, itensRes, equipRes, movRes] = await Promise.all([
      supabase.from("obras").select("*").order("created_at"),
      supabase.from("itens").select("*").order("nome"),
      supabase.from("equipamentos").select("*").order("data_fim"),
      supabase.from("movimentacoes").select("*").order("data", { ascending: false }),
    ]);
    const obrasData = obrasRes.data || [];
    setObras(obrasData);
    setItems((itensRes.data || []).map(mapItemFromDb));
    setEquipamentos((equipRes.data || []).map(mapEquipFromDb));
    setMovements((movRes.data || []).map(mapMovFromDb));

    let active = localStorage.getItem("activeObraId");
    if (!active || !obrasData.find((o) => o.id === active)) {
      active = obrasData[0]?.id || null;
    }
    setActiveObraId(active);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function changeActiveObra(id) {
    setActiveObraId(id);
    localStorage.setItem("activeObraId", id);
  }

  // ---------- mapeamento snake_case (banco) <-> camelCase (UI) ----------
  function mapItemFromDb(r) {
    return { id: r.id, obraId: r.obra_id, codigo: r.codigo || "", nome: r.nome, categoria: r.categoria || "", unidade: r.unidade || "un", quantidade: Number(r.quantidade) || 0, pontoReposicao: Number(r.ponto_reposicao) || 0, local: r.local || "" };
  }
  function mapEquipFromDb(r) {
    return { id: r.id, obraId: r.obra_id, nome: r.nome, fornecedor: r.fornecedor || "", dataInicio: r.data_inicio, dataFim: r.data_fim, local: r.local || "", valorDiaria: r.valor_diaria, observacao: r.observacao || "" };
  }
  function mapMovFromDb(r) {
    return { id: r.id, itemId: r.item_id, tipo: r.tipo, quantidade: Number(r.quantidade), data: r.data, responsavel: r.responsavel || "", observacao: r.observacao || "" };
  }

  // ---------- Obras ----------
  function openNewObra() { setObraForm(emptyObraForm()); setEditingObraId(null); setShowObraForm(true); }
  function openEditObra(o) { setObraForm({ nome: o.nome, endereco: o.endereco || "", responsavel: o.responsavel || "", dataInicio: o.data_inicio }); setEditingObraId(o.id); setShowObraForm(true); }

  async function saveObra(e) {
    e.preventDefault();
    if (!obraForm.nome.trim()) return;
    const payload = { nome: obraForm.nome.trim(), endereco: obraForm.endereco.trim(), responsavel: obraForm.responsavel.trim(), data_inicio: obraForm.dataInicio };
    if (editingObraId) {
      await supabase.from("obras").update(payload).eq("id", editingObraId);
    } else {
      const { data } = await supabase.from("obras").insert(payload).select().single();
      if (data && !activeObraId) changeActiveObra(data.id);
    }
    setShowObraForm(false);
    loadAll();
  }

  async function deleteObra(id) {
    await supabase.from("obras").delete().eq("id", id);
    if (activeObraId === id) localStorage.removeItem("activeObraId");
    loadAll();
  }

  // ---------- Itens ----------
  function openNewItem() { setItemForm(emptyItemForm()); setEditingId(null); setShowItemForm(true); }
  function openEditItem(it) { setItemForm({ codigo: it.codigo, nome: it.nome, categoria: it.categoria, unidade: it.unidade, quantidade: String(it.quantidade), pontoReposicao: String(it.pontoReposicao), local: it.local }); setEditingId(it.id); setShowItemForm(true); }

  async function saveItem(e) {
    e.preventDefault();
    if (!itemForm.nome.trim() || !activeObraId) return;
    const payload = {
      codigo: itemForm.codigo.trim(), nome: itemForm.nome.trim(), categoria: itemForm.categoria.trim() || "Geral",
      unidade: itemForm.unidade.trim() || "un", quantidade: Number(itemForm.quantidade) || 0,
      ponto_reposicao: Number(itemForm.pontoReposicao) || 0, local: itemForm.local.trim(),
    };
    if (editingId) {
      await supabase.from("itens").update(payload).eq("id", editingId);
    } else {
      await supabase.from("itens").insert({ ...payload, obra_id: activeObraId });
    }
    setShowItemForm(false);
    loadAll();
  }

  async function deleteItem(id) {
    await supabase.from("itens").delete().eq("id", id);
    loadAll();
  }

  // ---------- Movimentações ----------
  async function submitMovement(e) {
    e.preventDefault();
    setMoveError("");
    const item = items.find((it) => it.id === moveForm.itemId);
    const qty = Number(moveForm.quantidade);
    if (!item) { setMoveError("Escolha um item."); return; }
    if (!qty || qty <= 0) { setMoveError("Informe uma quantidade válida."); return; }
    if (moveForm.tipo === "Saída" && qty > item.quantidade) {
      setMoveError(`Estoque insuficiente. Disponível: ${item.quantidade} ${item.unidade}.`);
      return;
    }
    const delta = moveForm.tipo === "Entrada" ? qty : -qty;
    await supabase.from("movimentacoes").insert({
      item_id: item.id, tipo: moveForm.tipo, quantidade: qty, data: moveForm.data,
      responsavel: moveForm.responsavel.trim(), observacao: moveForm.observacao.trim(),
    });
    await supabase.from("itens").update({ quantidade: item.quantidade + delta }).eq("id", item.id);
    setMoveForm({ ...emptyMoveForm(), itemId: moveForm.itemId, data: todayISO() });
    loadAll();
  }

  // ---------- Equipamentos ----------
  function openNewEquip() { setEquipForm(emptyEquipForm()); setEditingEquipId(null); setShowEquipForm(true); }
  function openEditEquip(eq) { setEquipForm({ nome: eq.nome, fornecedor: eq.fornecedor, dataInicio: eq.dataInicio, dataFim: eq.dataFim, local: eq.local, valorDiaria: eq.valorDiaria != null ? String(eq.valorDiaria) : "", observacao: eq.observacao || "" }); setEditingEquipId(eq.id); setShowEquipForm(true); }

  async function saveEquip(e) {
    e.preventDefault();
    if (!equipForm.nome.trim() || !equipForm.dataFim || !activeObraId) return;
    const payload = {
      nome: equipForm.nome.trim(), fornecedor: equipForm.fornecedor.trim(), data_inicio: equipForm.dataInicio,
      data_fim: equipForm.dataFim, local: equipForm.local.trim(),
      valor_diaria: equipForm.valorDiaria ? Number(equipForm.valorDiaria) : null, observacao: equipForm.observacao.trim(),
    };
    if (editingEquipId) {
      await supabase.from("equipamentos").update(payload).eq("id", editingEquipId);
    } else {
      await supabase.from("equipamentos").insert({ ...payload, obra_id: activeObraId });
    }
    setShowEquipForm(false);
    loadAll();
  }

  async function deleteEquip(id) {
    await supabase.from("equipamentos").delete().eq("id", id);
    loadAll();
  }

  // ---------- Dados filtrados pela obra ativa ----------
  const itemsObra = useMemo(() => items.filter((it) => it.obraId === activeObraId), [items, activeObraId]);
  const equipamentosObra = useMemo(() => equipamentos.filter((eq) => eq.obraId === activeObraId), [equipamentos, activeObraId]);
  const itemIdsObra = useMemo(() => new Set(itemsObra.map((it) => it.id)), [itemsObra]);
  const movementsObra = useMemo(() => movements.filter((m) => itemIdsObra.has(m.itemId)), [movements, itemIdsObra]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return itemsObra;
    return itemsObra.filter((it) => it.nome.toLowerCase().includes(q) || it.codigo.toLowerCase().includes(q) || it.categoria.toLowerCase().includes(q));
  }, [itemsObra, search]);

  const belowReorder = useMemo(() => itemsObra.filter((it) => it.quantidade <= it.pontoReposicao), [itemsObra]);
  const movementsThisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return movementsObra.filter((m) => m.data && m.data.startsWith(ym));
  }, [movementsObra]);
  const equipVencendoOuVencido = useMemo(() => equipamentosObra.filter((eq) => { const s = equipStatus(eq.dataFim); return s.tone === "danger" || s.tone === "warning"; }), [equipamentosObra]);
  const itemsById = useMemo(() => Object.fromEntries(items.map((it) => [it.id, it])), [items]);
  const obraAtiva = useMemo(() => obras.find((o) => o.id === activeObraId) || null, [obras, activeObraId]);

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh" }} className="flex items-center justify-center">
        <p style={{ color: COLORS.textMuted }} className="text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh" }}>
      <div style={{ background: COLORS.steel, borderBottom: `4px solid ${COLORS.accent}` }} className="px-4 py-4 no-print">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="JV Filho Engenharia" style={{ height: 42 }} />
            <div style={{ borderLeft: `1px solid ${COLORS.steelLight}`, paddingLeft: 12 }}>
              <h1 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>{obraAtiva ? obraAtiva.nome : "Inventário"}</h1>
              <p className="text-xs" style={{ color: COLORS.steelLight }}>Cadastro, locações, entradas e saídas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {obras.length > 0 && (
              <select value={activeObraId || ""} onChange={(e) => changeActiveObra(e.target.value)} style={{ background: "#2E3550", color: "#fff", border: `1px solid ${COLORS.steelLight}` }} className="text-sm px-2_5 py-1_5 rounded-md">
                {obras.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            )}
            <span className="text-xs" style={{ color: COLORS.steelLight }}>{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()} title="Sair" className="p-1_5 rounded" style={{ color: COLORS.steelLight }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt }} className="px-4 flex gap-1 overflow-x-auto no-print">
        {[
          { id: "overview", label: "Visão geral", icon: ClipboardList },
          { id: "items", label: "Itens", icon: Boxes },
          { id: "equipamentos", label: "Equipamentos locados", icon: Truck },
          { id: "movements", label: "Movimentações", icon: History },
          { id: "report", label: "Relatório", icon: FileText },
          { id: "obras", label: "Obras", icon: Building2 },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1_5 px-3 py-2_5 text-sm font-medium whitespace-nowrap"
              style={{ color: active ? COLORS.accentDark : COLORS.textMuted, borderBottom: active ? `2px solid ${COLORS.accent}` : "2px solid transparent", background: "transparent", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: active ? COLORS.accent : "transparent" }}>
              <Icon size={15} />{t.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {tab !== "obras" && obras.length === 0 && (
          <EmptyState icon={Building2} title="Nenhuma obra cadastrada ainda" text="Cadastre a primeira obra para começar a lançar itens, locações e movimentações." actionLabel="Cadastrar obra" onAction={() => setTab("obras")} />
        )}

        {tab === "overview" && obras.length > 0 && (
          <Overview items={itemsObra} belowReorder={belowReorder} movementsThisMonth={movementsThisMonth} equipVencendoOuVencido={equipVencendoOuVencido} onGoItems={() => setTab("items")} onGoEquip={() => setTab("equipamentos")} />
        )}
        {tab === "items" && obras.length > 0 && (
          <ItemsTab items={filteredItems} allCount={itemsObra.length} search={search} setSearch={setSearch} onNew={openNewItem} onEdit={openEditItem} onDelete={deleteItem} />
        )}
        {tab === "equipamentos" && obras.length > 0 && (
          <EquipamentosTab equipamentos={equipamentosObra} onNew={openNewEquip} onEdit={openEditEquip} onDelete={deleteEquip} />
        )}
        {tab === "movements" && obras.length > 0 && (
          <MovementsTab items={itemsObra} movements={movementsObra} itemsById={itemsById} moveForm={moveForm} setMoveForm={setMoveForm} moveError={moveError} onSubmit={submitMovement} />
        )}
        {tab === "report" && obras.length > 0 && (
          <ReportTab obraNome={obraAtiva ? obraAtiva.nome : ""} items={itemsObra} movements={movementsObra} equipamentos={equipamentosObra} belowReorder={belowReorder} />
        )}
        {tab === "obras" && (
          <ObrasTab obras={obras} activeObraId={activeObraId} onNew={openNewObra} onEdit={openEditObra} onDelete={deleteObra} onSetActive={changeActiveObra} />
        )}
      </div>

      {showItemForm && <ItemFormModal form={itemForm} setForm={setItemForm} editing={!!editingId} onClose={() => setShowItemForm(false)} onSave={saveItem} />}
      {showEquipForm && <EquipFormModal form={equipForm} setForm={setEquipForm} editing={!!editingEquipId} onClose={() => setShowEquipForm(false)} onSave={saveEquip} />}
      {showObraForm && <ObraFormModal form={obraForm} setForm={setObraForm} editing={!!editingObraId} onClose={() => setShowObraForm(false)} onSave={saveObra} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTES DE APOIO
// ---------------------------------------------------------------------------
function EmptyState({ icon: Icon, title, text, actionLabel, onAction }) {
  return (
    <div style={{ border: `1px dashed ${COLORS.border}`, background: COLORS.surface }} className="rounded-md p-4 text-center">
      <Icon size={26} style={{ color: COLORS.accent, margin: "0 auto 12px" }} />
      <p className="font-medium mb-1">{title}</p>
      <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>{text}</p>
      {actionLabel && (
        <button onClick={onAction} style={{ background: COLORS.accent, color: "#fff" }} className="px-4 py-2 rounded-md text-sm font-medium">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Badge({ label, tone }) {
  const toneMap = { danger: { bg: COLORS.dangerBg, text: COLORS.danger }, warning: { bg: COLORS.warningBg, text: COLORS.warning }, success: { bg: COLORS.successBg, text: COLORS.success } };
  const c = toneMap[tone] || toneMap.warning;
  return <span className="text-xs font-medium" style={{ background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 4 }}>{label}</span>;
}

function StatCard({ label, value, tone = "default" }) {
  const toneMap = { default: { bg: COLORS.surface, text: COLORS.text }, danger: { bg: COLORS.dangerBg, text: COLORS.danger }, success: { bg: COLORS.successBg, text: COLORS.success }, accent: { bg: "#F6DEDB", text: COLORS.accentDark }, warning: { bg: COLORS.warningBg, text: COLORS.warning } };
  const c = toneMap[tone];
  return (
    <div style={{ background: c.bg, border: `1px solid ${COLORS.border}`, minWidth: 140 }} className="rounded-md p-4 flex-1">
      <p className="text-xs font-medium" style={{ color: COLORS.textMuted }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: c.text }}>{value}</p>
    </div>
  );
}

function Overview({ items, belowReorder, movementsThisMonth, equipVencendoOuVencido, onGoItems, onGoEquip }) {
  const entradas = movementsThisMonth.filter((m) => m.tipo === "Entrada").length;
  const saidas = movementsThisMonth.filter((m) => m.tipo === "Saída").length;
  if (items.length === 0) return <EmptyState icon={Boxes} title="Nenhum item cadastrado nessa obra ainda" text="Comece cadastrando os materiais e equipamentos do canteiro." actionLabel="Cadastrar primeiro item" onAction={onGoItems} />;

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Itens cadastrados" value={items.length} />
        <StatCard label="Abaixo do ponto de reposição" value={belowReorder.length} tone={belowReorder.length > 0 ? "danger" : "success"} />
        <StatCard label="Entradas este mês" value={entradas} tone="success" />
        <StatCard label="Saídas este mês" value={saidas} tone="accent" />
        <StatCard label="Equipamentos vencendo/vencidos" value={equipVencendoOuVencido.length} tone={equipVencendoOuVencido.length > 0 ? "warning" : "success"} />
      </div>

      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={18} style={{ color: COLORS.danger }} />Itens que precisam de reposição</h2>
      {belowReorder.length === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Nenhum item abaixo do ponto de reposição.</p> : (
        <Table headers={["Item", "Local", "Atual", "Ponto reposição"]} headerBg={COLORS.dangerBg} headerColor={COLORS.danger} rightAlignFrom={2}>
          {belowReorder.map((it) => (
            <tr key={it.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <td className="px-4 py-2_5">{it.nome}</td>
              <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{it.local || "-"}</td>
              <td className="px-4 py-2_5 text-right font-medium" style={{ color: COLORS.danger }}>{it.quantidade} {it.unidade}</td>
              <td className="px-4 py-2_5 text-right" style={{ color: COLORS.textMuted }}>{it.pontoReposicao} {it.unidade}</td>
            </tr>
          ))}
        </Table>
      )}

      <h2 className="text-lg font-semibold mb-3 mt-4 flex items-center gap-2"><Truck size={18} style={{ color: COLORS.warning }} />Equipamentos locados — atenção</h2>
      {equipVencendoOuVencido.length === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Nenhum equipamento vencendo ou vencido.</p> : (
        <Table headers={["Equipamento", "Fornecedor", "Prazo", "Situação"]} headerBg={COLORS.warningBg} headerColor={COLORS.warning}>
          {equipVencendoOuVencido.map((eq) => {
            const s = equipStatus(eq.dataFim);
            return (
              <tr key={eq.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td className="px-4 py-2_5">{eq.nome}</td>
                <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{eq.fornecedor || "-"}</td>
                <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{fmtDate(eq.dataFim)}</td>
                <td className="px-4 py-2_5"><Badge label={s.label} tone={s.tone} /></td>
              </tr>
            );
          })}
        </Table>
      )}
      <button onClick={onGoEquip} className="text-xs font-medium underline mt-2" style={{ color: COLORS.steel, background: "none", border: "none" }}>Ver todos os equipamentos locados</button>
    </div>
  );
}

function Table({ headers, headerBg, headerColor, rightAlignFrom, children }) {
  const cutoff = rightAlignFrom != null ? rightAlignFrom : headers.length; // por padrão, nada alinhado à direita
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface }} className="rounded-md overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr style={{ background: headerBg || COLORS.surfaceAlt }}>
          {headers.map((h, i) => <th key={i} className={i >= cutoff ? "text-right px-4 py-2_5 font-medium" : "text-left px-4 py-2_5 font-medium"} style={{ color: headerColor || COLORS.textMuted }}>{h}</th>)}
        </tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function ItemsTab({ items, allCount, search, setSearch, onNew, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1" style={{ position: "relative" }}>
          <Search size={15} style={{ color: COLORS.textMuted, position: "absolute", left: 10, top: 10 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, código ou categoria" style={{ ...inputStyle, paddingLeft: 32 }} className="w-full px-3 py-2 rounded-md text-sm" />
        </div>
        <button onClick={onNew} style={{ background: COLORS.accent, color: "#fff" }} className="flex items-center justify-center gap-1_5 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"><Plus size={15} /> Novo item</button>
      </div>
      {allCount === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Nenhum item cadastrado ainda.</p> :
        items.length === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Nenhum item encontrado.</p> : (
        <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface }} className="rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-640">
            <thead><tr style={{ background: COLORS.surfaceAlt, borderBottom: `1px solid ${COLORS.border}` }}>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Item</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Categoria</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Local</th>
              <th className="text-right px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Quantidade</th>
              <th className="text-right px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Ponto reposição</th>
              <th></th>
            </tr></thead>
            <tbody>
              {items.map((it) => {
                const low = it.quantidade <= it.pontoReposicao;
                return (
                  <tr key={it.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td className="px-4 py-2_5"><div className="font-medium">{it.nome}</div>{it.codigo && <div className="text-xs" style={{ color: COLORS.textMuted }}>{it.codigo}</div>}</td>
                    <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{it.categoria}</td>
                    <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{it.local || "-"}</td>
                    <td className="px-4 py-2_5 text-right font-medium" style={{ color: low ? COLORS.danger : COLORS.text }}>{it.quantidade} {it.unidade}</td>
                    <td className="px-4 py-2_5 text-right" style={{ color: COLORS.textMuted }}>{it.pontoReposicao} {it.unidade}</td>
                    <td className="px-4 py-2_5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(it)} className="p-1_5 rounded" style={{ background: "none", border: "none" }}><Pencil size={14} style={{ color: COLORS.steel }} /></button>
                        <button onClick={() => onDelete(it.id)} className="p-1_5 rounded" style={{ background: "none", border: "none" }}><Trash2 size={14} style={{ color: COLORS.danger }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EquipamentosTab({ equipamentos, onNew, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex justify-between gap-3 mb-4 flex-wrap">
        <div><h2 className="text-lg font-semibold">Equipamentos locados</h2><p className="text-xs" style={{ color: COLORS.textMuted }}>Betoneiras, andaimes, geradores e outros equipamentos de aluguel.</p></div>
        <button onClick={onNew} style={{ background: COLORS.accent, color: "#fff" }} className="flex items-center gap-1_5 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"><Plus size={15} /> Nova locação</button>
      </div>
      {equipamentos.length === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Nenhum equipamento locado cadastrado ainda.</p> : (
        <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface }} className="rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-720">
            <thead><tr style={{ background: COLORS.surfaceAlt, borderBottom: `1px solid ${COLORS.border}` }}>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Equipamento</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Fornecedor</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Início</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Prazo</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Situação</th>
              <th></th>
            </tr></thead>
            <tbody>
              {equipamentos.map((eq) => {
                const s = equipStatus(eq.dataFim);
                return (
                  <tr key={eq.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td className="px-4 py-2_5"><div className="font-medium">{eq.nome}</div>{eq.local && <div className="text-xs" style={{ color: COLORS.textMuted }}>{eq.local}</div>}</td>
                    <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{eq.fornecedor || "-"}</td>
                    <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{fmtDate(eq.dataInicio)}</td>
                    <td className="px-4 py-2_5 font-medium">{fmtDate(eq.dataFim)}</td>
                    <td className="px-4 py-2_5"><Badge label={s.label} tone={s.tone} /></td>
                    <td className="px-4 py-2_5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(eq)} className="p-1_5 rounded" style={{ background: "none", border: "none" }}><Pencil size={14} style={{ color: COLORS.steel }} /></button>
                        <button onClick={() => onDelete(eq.id)} className="p-1_5 rounded" style={{ background: "none", border: "none" }}><Trash2 size={14} style={{ color: COLORS.danger }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MovementsTab({ items, movements, itemsById, moveForm, setMoveForm, moveError, onSubmit }) {
  return (
    <div>
      <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface }} className="rounded-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">Registrar movimentação</h2>
        {items.length === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Cadastre um item antes de registrar movimentações.</p> : (
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
            <div style={{ gridColumn: "span 2" }}>
              <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Item</label>
              <select value={moveForm.itemId} onChange={(e) => setMoveForm({ ...moveForm, itemId: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm">
                <option value="">Selecione...</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.nome} ({it.quantidade} {it.unidade})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Tipo</label>
              <div className="flex rounded-md" style={{ border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
                <button type="button" onClick={() => setMoveForm({ ...moveForm, tipo: "Entrada" })} style={{ background: moveForm.tipo === "Entrada" ? COLORS.successBg : COLORS.surface, color: moveForm.tipo === "Entrada" ? COLORS.success : COLORS.textMuted, border: "none", flex: 1 }} className="py-2 text-xs font-medium"><ArrowDownCircle size={13} style={{ verticalAlign: "middle" }} /> Entrada</button>
                <button type="button" onClick={() => setMoveForm({ ...moveForm, tipo: "Saída" })} style={{ background: moveForm.tipo === "Saída" ? COLORS.dangerBg : COLORS.surface, color: moveForm.tipo === "Saída" ? COLORS.danger : COLORS.textMuted, border: "none", flex: 1 }} className="py-2 text-xs font-medium"><ArrowUpCircle size={13} style={{ verticalAlign: "middle" }} /> Saída</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Quantidade</label>
              <input type="number" min="0" value={moveForm.quantidade} onChange={(e) => setMoveForm({ ...moveForm, quantidade: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Data</label>
              <input type="date" value={moveForm.data} onChange={(e) => setMoveForm({ ...moveForm, data: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Responsável</label>
              <input value={moveForm.responsavel} onChange={(e) => setMoveForm({ ...moveForm, responsavel: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>Observação (opcional)</label>
              <input value={moveForm.observacao} onChange={(e) => setMoveForm({ ...moveForm, observacao: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <button type="submit" style={{ background: COLORS.accent, color: "#fff", width: "100%" }} className="py-2 rounded-md text-sm font-medium">Registrar</button>
            </div>
            {moveError && <div style={{ gridColumn: "span 2", color: COLORS.danger }} className="text-sm">{moveError}</div>}
          </form>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-3">Histórico</h2>
      {movements.length === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Nenhuma movimentação registrada ainda.</p> : (
        <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface }} className="rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-640">
            <thead><tr style={{ background: COLORS.surfaceAlt, borderBottom: `1px solid ${COLORS.border}` }}>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Data</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Item</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Tipo</th>
              <th className="text-right px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Quantidade</th>
              <th className="text-left px-4 py-2_5 font-medium" style={{ color: COLORS.textMuted }}>Responsável</th>
            </tr></thead>
            <tbody>
              {movements.map((m) => {
                const it = itemsById[m.itemId];
                const entrada = m.tipo === "Entrada";
                return (
                  <tr key={m.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{fmtDate(m.data)}</td>
                    <td className="px-4 py-2_5">{it ? it.nome : "(item removido)"}</td>
                    <td className="px-4 py-2_5"><span className="text-xs font-medium" style={{ background: entrada ? COLORS.successBg : COLORS.dangerBg, color: entrada ? COLORS.success : COLORS.danger, padding: "2px 8px", borderRadius: 4 }}>{m.tipo}</span></td>
                    <td className="px-4 py-2_5 text-right font-medium">{m.quantidade} {it ? it.unidade : ""}</td>
                    <td className="px-4 py-2_5" style={{ color: COLORS.textMuted }}>{m.responsavel || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function buildReportText({ obraNome, items, movements, equipamentos, belowReorder }) {
  const hoje = todayISO();
  const seteAtras = new Date(); seteAtras.setDate(seteAtras.getDate() - 6);
  const inicioSemanaISO = seteAtras.toISOString().slice(0, 10);
  const movsSemana = movements.filter((m) => m.data && m.data >= inicioSemanaISO && m.data <= hoje);
  const entradas = movsSemana.filter((m) => m.tipo === "Entrada");
  const saidas = movsSemana.filter((m) => m.tipo === "Saída");
  const itemsById = Object.fromEntries(items.map((it) => [it.id, it]));
  const vencidos = equipamentos.filter((eq) => equipStatus(eq.dataFim).tone === "danger");
  const vencendo = equipamentos.filter((eq) => equipStatus(eq.dataFim).tone === "warning");

  const linhas = [];
  linhas.push(`RELATÓRIO SEMANAL DE INVENTÁRIO E LOCAÇÕES`);
  linhas.push(`Obra: ${obraNome || "-"}`);
  linhas.push(`Período: ${fmtDate(inicioSemanaISO)} a ${fmtDate(hoje)}`);
  linhas.push(``);
  linhas.push(`1. INVENTÁRIO`);
  linhas.push(`- Itens cadastrados: ${items.length}`);
  linhas.push(`- Itens abaixo do ponto de reposição: ${belowReorder.length}`);
  belowReorder.forEach((it) => linhas.push(`   • ${it.nome}: ${it.quantidade} ${it.unidade} (ponto de reposição: ${it.pontoReposicao} ${it.unidade})`));
  linhas.push(``);
  linhas.push(`2. MOVIMENTAÇÕES DA SEMANA`);
  linhas.push(`- Entradas: ${entradas.length} | Saídas: ${saidas.length}`);
  if (movsSemana.length > 0) {
    movsSemana.forEach((m) => { const it = itemsById[m.itemId]; linhas.push(`   • ${fmtDate(m.data)} — ${m.tipo}: ${m.quantidade} ${it ? it.unidade : ""} de ${it ? it.nome : "(item removido)"}${m.responsavel ? ` (${m.responsavel})` : ""}`); });
  } else linhas.push(`   Nenhuma movimentação registrada nessa semana.`);
  linhas.push(``);
  linhas.push(`3. EQUIPAMENTOS LOCADOS`);
  linhas.push(`- Total locados: ${equipamentos.length} | Vencidos: ${vencidos.length} | Vencendo em até 7 dias: ${vencendo.length}`);
  if (vencidos.length > 0) { linhas.push(`  Vencidos:`); vencidos.forEach((eq) => linhas.push(`   • ${eq.nome} — venceu em ${fmtDate(eq.dataFim)} (${eq.fornecedor || "fornecedor não informado"})`)); }
  if (vencendo.length > 0) { linhas.push(`  Vencendo essa semana:`); vencendo.forEach((eq) => linhas.push(`   • ${eq.nome} — vence em ${fmtDate(eq.dataFim)} (${eq.fornecedor || "fornecedor não informado"})`)); }
  linhas.push(``);
  linhas.push(`Relatório gerado em ${fmtDate(hoje)}.`);
  return linhas.join("\n");
}

function ReportTab({ obraNome, items, movements, equipamentos, belowReorder }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => buildReportText({ obraNome, items, movements, equipamentos, belowReorder }), [obraNome, items, movements, equipamentos, belowReorder]);
  async function handleCopy() { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {} }
  return (
    <div>
      <div className="flex justify-between gap-3 mb-4 flex-wrap no-print">
        <div><h2 className="text-lg font-semibold">Relatório semanal</h2><p className="text-xs" style={{ color: COLORS.textMuted }}>Copie e envie toda sexta-feira, ou imprima/exporte em PDF.</p></div>
        <div className="flex gap-2">
          <button onClick={handleCopy} style={{ border: `1px solid ${COLORS.border}`, color: COLORS.steel, background: COLORS.surface }} className="flex items-center gap-1_5 px-3 py-2 rounded-md text-sm font-medium">{copied ? <Check size={14} style={{ color: COLORS.success }} /> : <Copy size={14} />}{copied ? "Copiado!" : "Copiar texto"}</button>
          <button onClick={() => window.print()} style={{ background: COLORS.accent, color: "#fff" }} className="flex items-center gap-1_5 px-3 py-2 rounded-md text-sm font-medium"><Printer size={14} /> Imprimir / PDF</button>
        </div>
      </div>
      <pre style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text, whiteSpace: "pre-wrap", fontFamily: "monospace" }} className="rounded-md p-4 text-sm">{text}</pre>
    </div>
  );
}

function ObrasTab({ obras, activeObraId, onNew, onEdit, onDelete, onSetActive }) {
  return (
    <div>
      <div className="flex justify-between gap-3 mb-4 flex-wrap">
        <div><h2 className="text-lg font-semibold">Obras cadastradas</h2><p className="text-xs" style={{ color: COLORS.textMuted }}>Cada obra tem seus próprios itens, locações, movimentações e relatório.</p></div>
        <button onClick={onNew} style={{ background: COLORS.accent, color: "#fff" }} className="flex items-center gap-1_5 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"><Plus size={15} /> Nova obra</button>
      </div>
      {obras.length === 0 ? <p className="text-sm" style={{ color: COLORS.textMuted }}>Nenhuma obra cadastrada ainda.</p> : (
        <div className="grid grid-cols-2 gap-3">
          {obras.map((o) => {
            const active = o.id === activeObraId;
            return (
              <div key={o.id} style={{ border: active ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`, background: COLORS.surface }} className="rounded-md p-4">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{o.nome}</h3>
                    {o.endereco && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{o.endereco}</p>}
                    {o.responsavel && <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Responsável: {o.responsavel}</p>}
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Início: {fmtDate(o.data_inicio)}</p>
                  </div>
                  {active && <Badge label="Ativa" tone="success" />}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {!active && <button onClick={() => onSetActive(o.id)} style={{ border: `1px solid ${COLORS.border}`, color: COLORS.steel, background: "none" }} className="text-xs font-medium px-2_5 py-1_5 rounded-md">Tornar ativa</button>}
                  <button onClick={() => onEdit(o)} className="p-1_5 rounded" style={{ background: "none", border: "none" }}><Pencil size={14} style={{ color: COLORS.steel }} /></button>
                  <button onClick={() => onDelete(o.id)} className="p-1_5 rounded" style={{ background: "none", border: "none" }}><Trash2 size={14} style={{ color: COLORS.danger }} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(34,32,28,0.45)" }} className="flex items-center justify-center p-4">
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, maxWidth: 480, width: "100%" }} className="rounded-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none" }}><X size={18} style={{ color: COLORS.textMuted }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "span 2" : undefined }}>
      <label className="text-xs font-medium" style={{ color: COLORS.textMuted, display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function ItemFormModal({ form, setForm, editing, onClose, onSave }) {
  return (
    <ModalShell title={editing ? "Editar item" : "Novo item"} onClose={onClose}>
      <form onSubmit={onSave} className="grid grid-cols-2 gap-3">
        <Field label="Nome do item" full><input autoFocus value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" required /></Field>
        <Field label="Código (opcional)"><input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Categoria"><input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Unidade"><input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="un, kg, m..." style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Local de armazenamento"><input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Quantidade atual"><input type="number" min="0" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Ponto de reposição"><input type="number" min="0" value={form.pontoReposicao} onChange={(e) => setForm({ ...form, pontoReposicao: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <div style={{ gridColumn: "span 2" }} className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, background: "none", flex: 1 }} className="py-2 rounded-md text-sm font-medium">Cancelar</button>
          <button type="submit" style={{ background: COLORS.accent, color: "#fff", flex: 1 }} className="py-2 rounded-md text-sm font-medium">{editing ? "Salvar" : "Cadastrar"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function EquipFormModal({ form, setForm, editing, onClose, onSave }) {
  return (
    <ModalShell title={editing ? "Editar locação" : "Nova locação"} onClose={onClose}>
      <form onSubmit={onSave} className="grid grid-cols-2 gap-3">
        <Field label="Equipamento" full><input autoFocus value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Betoneira 400L" style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" required /></Field>
        <Field label="Fornecedor / locadora" full><input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Início da locação"><input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Prazo (data fim)"><input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" required /></Field>
        <Field label="Valor da diária (opcional)"><input type="number" min="0" step="0.01" value={form.valorDiaria} onChange={(e) => setForm({ ...form, valorDiaria: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Local na obra"><input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Observação (opcional)" full><input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <div style={{ gridColumn: "span 2" }} className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, background: "none", flex: 1 }} className="py-2 rounded-md text-sm font-medium">Cancelar</button>
          <button type="submit" style={{ background: COLORS.accent, color: "#fff", flex: 1 }} className="py-2 rounded-md text-sm font-medium">{editing ? "Salvar" : "Cadastrar"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function ObraFormModal({ form, setForm, editing, onClose, onSave }) {
  return (
    <ModalShell title={editing ? "Editar obra" : "Nova obra"} onClose={onClose}>
      <form onSubmit={onSave} className="grid grid-cols-2 gap-3">
        <Field label="Nome da obra" full><input autoFocus value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Residencial Vista Verde" style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" required /></Field>
        <Field label="Endereço / local" full><input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Responsável"><input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <Field label="Data de início"><input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} style={inputStyle} className="w-full px-3 py-2 rounded-md text-sm" /></Field>
        <div style={{ gridColumn: "span 2" }} className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, background: "none", flex: 1 }} className="py-2 rounded-md text-sm font-medium">Cancelar</button>
          <button type="submit" style={{ background: COLORS.accent, color: "#fff", flex: 1 }} className="py-2 rounded-md text-sm font-medium">{editing ? "Salvar" : "Cadastrar"}</button>
        </div>
      </form>
    </ModalShell>
  );
}
