import React, { useMemo, useState, useEffect } from 'react'
import { ShoppingCart, Send, Trash2, Plus, Search, BarChart3, Package, ClipboardCopy, CheckCircle2, Building2, History, Save, Settings, X } from 'lucide-react'

const initialProducts = [
  { id: 1, name: 'Arroz Branco 5kg', category: 'Mercearia', image: '🍚' },
  { id: 2, name: 'Feijão Preto 1kg', category: 'Mercearia', image: '🫘' },
  { id: 3, name: 'Óleo de Soja 900ml', category: 'Mercearia', image: '🛢️' },
  { id: 4, name: 'Açúcar Refinado 5kg', category: 'Mercearia', image: '🧂' },
  { id: 5, name: 'Café Tradicional 500g', category: 'Bebidas', image: '☕' },
  { id: 6, name: 'Leite Integral 1L', category: 'Laticínios', image: '🥛' },
  { id: 7, name: 'Farinha de Trigo 5kg', category: 'Mercearia', image: '🌾' },
  { id: 8, name: 'Macarrão Espaguete 500g', category: 'Massas', image: '🍝' },
]

const initialSuppliers = ['Empresa A', 'Empresa B', 'Empresa C']

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function App() {
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('cbg_products') || 'null') || initialProducts)
  const [suppliers, setSuppliers] = useState(() => JSON.parse(localStorage.getItem('cbg_suppliers') || 'null') || initialSuppliers)
  const [selected, setSelected] = useState(() => JSON.parse(localStorage.getItem('cbg_selected') || '[]'))
  const [prices, setPrices] = useState(() => JSON.parse(localStorage.getItem('cbg_prices') || '{}'))
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('cbg_history') || '[]'))
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('catalog')
  const [copied, setCopied] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: '', image: '📦' })
  const [newSupplier, setNewSupplier] = useState('')

  useEffect(() => localStorage.setItem('cbg_products', JSON.stringify(products)), [products])
  useEffect(() => localStorage.setItem('cbg_suppliers', JSON.stringify(suppliers)), [suppliers])
  useEffect(() => localStorage.setItem('cbg_selected', JSON.stringify(selected)), [selected])
  useEffect(() => localStorage.setItem('cbg_prices', JSON.stringify(prices)), [prices])
  useEffect(() => localStorage.setItem('cbg_history', JSON.stringify(history)), [history])

  const filteredProducts = products.filter((product) => {
    const term = search.toLowerCase()
    return product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term)
  })

  const addProduct = (product) => {
    if (!selected.find((item) => item.id === product.id)) setSelected([...selected, product])
  }

  const removeProduct = (id) => setSelected(selected.filter((item) => item.id !== id))

  const addNewProduct = () => {
    if (!newProduct.name.trim()) return
    setProducts([...products, { ...newProduct, id: Date.now(), category: newProduct.category || 'Geral' }])
    setNewProduct({ name: '', category: '', image: '📦' })
  }

  const addNewSupplier = () => {
    if (!newSupplier.trim()) return
    setSuppliers([...suppliers, newSupplier.trim()])
    setNewSupplier('')
  }

  const exportText = selected.map((item) => item.name).join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const updatePrice = (productId, supplier, value) => {
    setPrices({ ...prices, [`${productId}-${supplier}`]: value })
  }

  const comparison = useMemo(() => {
    const totals = Object.fromEntries(suppliers.map((name) => [name, 0]))
    const winners = {}

    selected.forEach((product) => {
      const values = suppliers
        .map((supplier) => ({ supplier, value: Number(String(prices[`${product.id}-${supplier}`] || '').replace(',', '.')) }))
        .filter((entry) => !Number.isNaN(entry.value) && entry.value > 0)

      values.forEach((entry) => (totals[entry.supplier] += entry.value))
      if (values.length > 0) winners[product.id] = values.reduce((best, current) => (current.value < best.value ? current : best), values[0]).supplier
    })

    const bestTotal = Object.entries(totals).filter(([, value]) => value > 0).sort((a, b) => a[1] - b[1])[0]
    return { totals, winners, bestTotal }
  }, [prices, selected, suppliers])

  const saveQuotation = () => {
    if (selected.length === 0) return
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString('pt-BR'),
      items: selected,
      prices,
      totals: comparison.totals,
      bestTotal: comparison.bestTotal,
    }
    setHistory([record, ...history])
  }

  const clearQuotation = () => {
    setSelected([])
    setPrices({})
  }

  const tabs = [
    ['catalog', 'Produtos', Package],
    ['cart', 'Cotação', ShoppingCart],
    ['export', 'Enviar', Send],
    ['compare', 'Comparar', BarChart3],
    ['suppliers', 'Fornecedores', Building2],
    ['history', 'Histórico', History],
    ['settings', 'Ajustes', Settings],
  ]

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Supermercado Bom Gosto</p>
          <h1>Cota Bom Gosto</h1>
          <p className="subtitle">Gestão de compras, fornecedores e cotações</p>
        </div>
        <div className="headerCards">
          <div className="metric"><span>Produtos na cotação</span><b>{selected.length} itens</b></div>
          <div className="metric"><span>Fornecedores</span><b>{suppliers.length}</b></div>
        </div>
      </header>

      <main className="container">
        <nav className="tabs">
          {tabs.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={activeTab === key ? 'tab active' : 'tab'}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        {activeTab === 'catalog' && (
          <section className="gridTwo">
            <div>
              <div className="searchBox"><Search size={20} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou categoria..." /></div>
              <div className="productGrid">
                {filteredProducts.map((product) => {
                  const isSelected = selected.some((item) => item.id === product.id)
                  return (
                    <article key={product.id} className="productCard">
                      <div className="productImage">{product.image}</div>
                      <p className="category">{product.category}</p>
                      <h2>{product.name}</h2>
                      <button onClick={() => addProduct(product)} disabled={isSelected} className={isSelected ? 'btn success' : 'btn red'}>
                        {isSelected ? <CheckCircle2 size={17} /> : <Plus size={17} />} {isSelected ? 'Adicionado' : 'Adicionar'}
                      </button>
                    </article>
                  )
                })}
              </div>
            </div>
            <aside className="panel">
              <h2>Cadastrar produto</h2>
              <p>Adicione novos itens ao catálogo.</p>
              <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nome do produto" />
              <input value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="Categoria" />
              <input value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="Emoji ou símbolo" />
              <button onClick={addNewProduct} className="btn blue full">Salvar produto</button>
            </aside>
          </section>
        )}

        {activeTab === 'cart' && (
          <section className="panel wide">
            <div className="panelHeader"><div><h2>Nova cotação</h2><p>Produtos que o mercado precisa cotar.</p></div><div className="actions"><button onClick={saveQuotation} className="btn green"><Save size={17}/>Salvar</button><button onClick={clearQuotation} className="btn light"><Trash2 size={17}/>Limpar</button></div></div>
            {selected.length === 0 ? <div className="empty">Nenhum produto selecionado ainda.</div> : selected.map((item) => <div key={item.id} className="listItem"><div><span className="miniImg">{item.image}</span><div><b>{item.name}</b><small>{item.category}</small></div></div><button onClick={() => removeProduct(item.id)} className="iconBtn"><X size={20}/></button></div>)}
          </section>
        )}

        {activeTab === 'export' && (
          <section className="gridTwo equal">
            <div className="panel"><h2>Lista para fornecedor</h2><p>Lista simples, sem preços e sem imagens.</p><textarea readOnly value={exportText || 'Selecione produtos no catálogo para gerar a lista.'}/><button onClick={handleCopy} disabled={!exportText} className="btn blue full"><ClipboardCopy size={17}/>{copied ? 'Lista copiada' : 'Copiar lista'}</button></div>
            <div className="panel dark"><h2>Mensagem sugerida</h2><p>Copie e envie pelo WhatsApp para os representantes.</p><div className="message">Olá, poderia cotar esses produtos para o Supermercado Bom Gosto?<pre>{exportText || 'Lista aparecerá aqui.'}</pre></div></div>
          </section>
        )}

        {activeTab === 'compare' && (
          <section className="panel wide overflow">
            <div className="panelHeader"><div><h2>Comparador inteligente</h2><p>Digite os preços enviados pelos fornecedores.</p></div>{comparison.bestTotal && <div className="best">Melhor total: {comparison.bestTotal[0]} — {money(comparison.bestTotal[1])}</div>}</div>
            {selected.length === 0 ? <div className="empty">Adicione produtos ao carrinho para iniciar a cotação.</div> : <table><thead><tr><th>Produto</th>{suppliers.map((supplier) => <th key={supplier}>{supplier}</th>)}<th>Menor preço</th></tr></thead><tbody>{selected.map((product) => <tr key={product.id}><td><b>{product.name}</b></td>{suppliers.map((supplier) => { const isWinner = comparison.winners[product.id] === supplier; return <td key={supplier}><input className={isWinner ? 'winnerInput' : ''} value={prices[`${product.id}-${supplier}`] || ''} onChange={(e) => updatePrice(product.id, supplier, e.target.value)} placeholder="R$ 0,00" /></td> })}<td className="winner">{comparison.winners[product.id] || '—'}</td></tr>)}</tbody><tfoot><tr><td><b>Total por empresa</b></td>{suppliers.map((supplier) => <td key={supplier}><b>{money(comparison.totals[supplier])}</b></td>)}<td /></tr></tfoot></table>}
          </section>
        )}

        {activeTab === 'suppliers' && (
          <section className="gridTwo">
            <div className="panel"><h2>Fornecedores cadastrados</h2>{suppliers.map((supplier) => <div key={supplier} className="listItem"><b>{supplier}</b><button onClick={() => setSuppliers(suppliers.filter((item) => item !== supplier))} className="iconBtn"><Trash2 size={18}/></button></div>)}</div>
            <div className="panel"><h2>Novo fornecedor</h2><input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="Nome da empresa"/><button onClick={addNewSupplier} className="btn blue full">Adicionar fornecedor</button></div>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="panel wide"><h2>Histórico de cotações</h2>{history.length === 0 ? <div className="empty">Nenhuma cotação salva ainda.</div> : history.map((item) => <div key={item.id} className="historyItem"><div><b>Cotação salva</b><small>{item.date} • {item.items.length} itens</small></div><b className="winner">{item.bestTotal ? `${item.bestTotal[0]} — ${money(item.bestTotal[1])}` : 'Sem preços'}</b></div>)}</section>
        )}

        {activeTab === 'settings' && (
          <section className="panel wide"><h2>Próximas funções reais</h2><div className="featureGrid"><div><b>Login:</b> acesso por usuário e senha.</div><div><b>Banco em nuvem:</b> Supabase para salvar tudo online.</div><div><b>PDF:</b> gerar cotação em arquivo.</div><div><b>App instalável:</b> transformar em PWA para celular.</div></div></section>
        )}
      </main>
    </div>
  )
}
