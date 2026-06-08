import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ShoppingCart, Send, Trash2, Plus, Search, BarChart3, Package,
  ClipboardCopy, CheckCircle2, Building2, History, Save, Settings, X
} from "lucide-react";
import "./style.css";

const initialProducts = [
  { id: 1, name: "Arroz Branco 5kg", category: "Mercearia", image: "🍚" },
  { id: 2, name: "Feijão Preto 1kg", category: "Mercearia", image: "🫘" },
  { id: 3, name: "Óleo de Soja 900ml", category: "Mercearia", image: "🛢️" },
  { id: 4, name: "Açúcar Refinado 5kg", category: "Mercearia", image: "🧂" },
  { id: 5, name: "Café Tradicional 500g", category: "Bebidas", image: "☕" },
  { id: 6, name: "Leite Integral 1L", category: "Laticínios", image: "🥛" },
  { id: 7, name: "Farinha de Trigo 5kg", category: "Mercearia", image: "🌾" },
  { id: 8, name: "Macarrão Espaguete 500g", category: "Massas", image: "🍝" }
];

const initialSuppliers = ["Empresa A", "Empresa B", "Empresa C"];

function money(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function App() {
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem("cbg_products") || "null") || initialProducts);
  const [suppliers, setSuppliers] = useState(() => JSON.parse(localStorage.getItem("cbg_suppliers") || "null") || initialSuppliers);
  const [selected, setSelected] = useState(() => JSON.parse(localStorage.getItem("cbg_selected") || "[]"));
  const [prices, setPrices] = useState(() => JSON.parse(localStorage.getItem("cbg_prices") || "{}"));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("cbg_history") || "[]"));
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");
  const [copied, setCopied] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", category: "", image: "📦" });
  const [newSupplier, setNewSupplier] = useState("");

  useEffect(() => localStorage.setItem("cbg_products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("cbg_suppliers", JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem("cbg_selected", JSON.stringify(selected)), [selected]);
  useEffect(() => localStorage.setItem("cbg_prices", JSON.stringify(prices)), [prices]);
  useEffect(() => localStorage.setItem("cbg_history", JSON.stringify(history)), [history]);

  const filteredProducts = products.filter((product) => {
    const term = search.toLowerCase();
    return product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term);
  });

  const addProduct = (product) => {
    if (!selected.find((item) => item.id === product.id)) setSelected([...selected, product]);
  };

  const removeProduct = (id) => setSelected(selected.filter((item) => item.id !== id));

  const addNewProduct = () => {
    if (!newProduct.name.trim()) return;
    setProducts([...products, { ...newProduct, id: Date.now(), category: newProduct.category || "Geral" }]);
    setNewProduct({ name: "", category: "", image: "📦" });
  };

  const addNewSupplier = () => {
    if (!newSupplier.trim()) return;
    setSuppliers([...suppliers, newSupplier.trim()]);
    setNewSupplier("");
  };

  const exportText = selected.map((item) => item.name).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const updatePrice = (productId, supplier, value) => {
    setPrices({ ...prices, [`${productId}-${supplier}`]: value });
  };

  const comparison = useMemo(() => {
    const totals = Object.fromEntries(suppliers.map((name) => [name, 0]));
    const winners = {};

    selected.forEach((product) => {
      const values = suppliers
        .map((supplier) => ({ supplier, value: Number(String(prices[`${product.id}-${supplier}`] || "").replace(",", ".")) }))
        .filter((entry) => !Number.isNaN(entry.value) && entry.value > 0);

      values.forEach((entry) => (totals[entry.supplier] += entry.value));
      if (values.length > 0) winners[product.id] = values.reduce((best, current) => (current.value < best.value ? current : best), values[0]).supplier;
    });

    const bestTotal = Object.entries(totals)
      .filter(([, value]) => value > 0)
      .sort((a, b) => a[1] - b[1])[0];

    return { totals, winners, bestTotal };
  }, [prices, selected, suppliers]);

  const saveQuotation = () => {
    if (selected.length === 0) return;
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString("pt-BR"),
      items: selected,
      prices,
      totals: comparison.totals,
      bestTotal: comparison.bestTotal,
    };
    setHistory([record, ...history]);
  };

  const clearQuotation = () => {
    setSelected([]);
    setPrices({});
  };

  const tabs = [
    ["catalog", "Produtos", Package],
    ["cart", "Cotação", ShoppingCart],
    ["export", "Enviar", Send],
    ["compare", "Comparar", BarChart3],
    ["suppliers", "Fornecedores", Building2],
    ["history", "Histórico", History],
    ["settings", "Ajustes", Settings],
  ];

  return (
    <div className="app">
      <header>
        <div>
          <p className="eyebrow">Supermercado Bom Gosto</p>
          <h1>Cota Bom Gosto</h1>
          <p>Gestão de compras, fornecedores e cotações</p>
        </div>
        <div className="headerCards">
          <div><small>Produtos na cotação</small><strong>{selected.length} itens</strong></div>
          <div><small>Fornecedores</small><strong>{suppliers.length}</strong></div>
        </div>
      </header>

      <main>
        <nav>
          {tabs.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={activeTab === key ? "active" : ""}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        {activeTab === "catalog" && (
          <section className="gridMain">
            <div>
              <div className="search"><Search size={20}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar produto ou categoria..." /></div>
              <div className="products">
                {filteredProducts.map((product) => {
                  const isSelected = selected.some((item) => item.id === product.id);
                  return (
                    <article className="card" key={product.id}>
                      <div className="emoji">{product.image}</div>
                      <small>{product.category}</small>
                      <h2>{product.name}</h2>
                      <button className={isSelected ? "ok" : "red"} onClick={() => addProduct(product)} disabled={isSelected}>
                        {isSelected ? <CheckCircle2 size={16}/> : <Plus size={16}/>} {isSelected ? "Adicionado" : "Adicionar"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
            <aside className="panel">
              <h2>Cadastrar produto</h2>
              <input value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name:e.target.value})} placeholder="Nome do produto" />
              <input value={newProduct.category} onChange={(e)=>setNewProduct({...newProduct, category:e.target.value})} placeholder="Categoria" />
              <input value={newProduct.image} onChange={(e)=>setNewProduct({...newProduct, image:e.target.value})} placeholder="Emoji ou símbolo" />
              <button onClick={addNewProduct}>Salvar produto</button>
            </aside>
          </section>
        )}

        {activeTab === "cart" && (
          <section className="panel">
            <div className="sectionTop"><div><h2>Nova cotação</h2><p>Produtos que o mercado precisa cotar.</p></div><div><button onClick={saveQuotation}><Save size={16}/>Salvar</button><button className="light" onClick={clearQuotation}><Trash2 size={16}/>Limpar</button></div></div>
            {selected.length === 0 ? <p className="empty">Nenhum produto selecionado ainda.</p> : selected.map(item => (
              <div className="listItem" key={item.id}><span className="mini">{item.image}</span><div><b>{item.name}</b><p>{item.category}</p></div><button className="iconBtn" onClick={()=>removeProduct(item.id)}><X size={20}/></button></div>
            ))}
          </section>
        )}

        {activeTab === "export" && (
          <section className="twoCols">
            <div className="panel">
              <h2>Lista para fornecedor</h2>
              <textarea readOnly value={exportText || "Selecione produtos no catálogo para gerar a lista."} />
              <button onClick={handleCopy} disabled={!exportText}><ClipboardCopy size={16}/>{copied ? "Lista copiada" : "Copiar lista"}</button>
            </div>
            <div className="panel dark">
              <h2>Mensagem sugerida</h2>
              <p>Olá, poderia cotar esses produtos para o Supermercado Bom Gosto?</p>
              <pre>{exportText || "Lista aparecerá aqui."}</pre>
            </div>
          </section>
        )}

        {activeTab === "compare" && (
          <section className="panel tableWrap">
            <div className="sectionTop"><div><h2>Comparador inteligente</h2><p>Digite os preços enviados pelos fornecedores.</p></div>{comparison.bestTotal && <strong className="best">Melhor total: {comparison.bestTotal[0]} — {money(comparison.bestTotal[1])}</strong>}</div>
            {selected.length === 0 ? <p className="empty">Adicione produtos ao carrinho para iniciar a cotação.</p> : (
              <table><thead><tr><th>Produto</th>{suppliers.map(s => <th key={s}>{s}</th>)}<th>Menor preço</th></tr></thead>
              <tbody>{selected.map(product => <tr key={product.id}><td><b>{product.name}</b></td>{suppliers.map(supplier => { const isWinner = comparison.winners[product.id] === supplier; return <td key={supplier}><input className={isWinner ? "winner" : ""} value={prices[`${product.id}-${supplier}`] || ""} onChange={(e)=>updatePrice(product.id, supplier, e.target.value)} placeholder="R$ 0,00" /></td>})}<td className="green">{comparison.winners[product.id] || "—"}</td></tr>)}</tbody>
              <tfoot><tr><td>Total</td>{suppliers.map(s => <td key={s}>{money(comparison.totals[s])}</td>)}<td></td></tr></tfoot></table>
            )}
          </section>
        )}

        {activeTab === "suppliers" && (
          <section className="twoCols">
            <div className="panel"><h2>Fornecedores cadastrados</h2>{suppliers.map(s=><div className="listItem" key={s}><b>{s}</b><button className="iconBtn" onClick={()=>setSuppliers(suppliers.filter(i=>i!==s))}><Trash2 size={16}/></button></div>)}</div>
            <div className="panel"><h2>Novo fornecedor</h2><input value={newSupplier} onChange={(e)=>setNewSupplier(e.target.value)} placeholder="Nome da empresa" /><button onClick={addNewSupplier}>Adicionar fornecedor</button></div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="panel"><h2>Histórico de cotações</h2>{history.length === 0 ? <p className="empty">Nenhuma cotação salva ainda.</p> : history.map(item=><div className="history" key={item.id}><b>Cotação salva</b><p>{item.date} • {item.items.length} itens</p><strong>{item.bestTotal ? `${item.bestTotal[0]} — ${money(item.bestTotal[1])}` : "Sem preços"}</strong></div>)}</section>
        )}

        {activeTab === "settings" && (
          <section className="panel"><h2>Próximas funções reais</h2><div className="settings"><div><b>Login:</b> acesso por usuário e senha.</div><div><b>Banco online:</b> Supabase.</div><div><b>PDF:</b> gerar arquivo de cotação.</div><div><b>PWA:</b> instalar no celular.</div></div></section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
