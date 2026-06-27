import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChefHat, Scale, X, FileText } from 'lucide-react';
import DataTable from '../components/DataTable';
import { apiFetch } from '../api/fetch';
import { exportPDF } from '../utils/export';

const UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'kilo', label: 'Kilo (kg)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'libra', label: 'Libra (lb)' },
  { value: 'porcion', label: 'Porción' },
];

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/recipes')
      .then(r => r.json()).then(setRecipes);
  }, []);

  const handleNewRecipe = async (productId) => {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;
    setRecipeProduct({ ...prod, ingredients: [], total_cost: 0 });
    setShowNewRecipe(false);
    setShowRecipeModal(true);
  };

  const handleRecipeClick = async (product) => {
    try {
      const res = await apiFetch(`${__API_URL__}/api/recipes/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setRecipeProduct(data);
      } else {
        setRecipeProduct({ ...product, ingredients: [], total_cost: 0 });
      }
      setShowRecipeModal(true);
    } catch (e) {
      setRecipeProduct({ ...product, ingredients: [], total_cost: 0 });
      setShowRecipeModal(true);
    }
  };

  const columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Producto Preparado' },
    { key: 'unit_price', label: 'Precio Venta', render: r => `$${Number(r.unit_price).toLocaleString('es-CO')}` },
    { key: 'total_cost', label: 'Costo Receta', render: r => `$${Number(r.total_cost).toLocaleString('es-CO')}` },
    {
      key: 'margin', label: 'Margen', render: r => {
        const margin = r.total_cost > 0 ? ((r.unit_price - r.total_cost) / r.unit_price * 100).toFixed(0) : '—';
        return <span className={`font-semibold ${margin > 40 ? 'text-emerald-500' : margin > 20 ? 'text-amber-500' : 'text-rose-500'}`}>{margin}%</span>;
      }
    },
    { key: 'ingredient_count', label: 'Ingredientes', render: r => (
      <span className="text-xs text-slate-500">{r.ingredient_count || 0} items</span>
    )},
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => handleRecipeClick(r)} className="rounded-lg p-1.5 text-slate-500 hover:text-amber-500">
          <ChefHat className="h-3.5 w-3.5" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Recetas</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{recipes.length} productos con receta</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => {
            apiFetch(__API_URL__ + '/api/inventory')
              .then(r => r.json())
              .then(prods => {
                const stockNames = ['LECHE CONDENSADA','SERVILLETA','CUCHARA','VASOS DARNEL','PAPEL PELE','BOLSA','STICKER'];
                setAllProducts(prods.filter(p => (p.unit === 'unidad' || !p.unit) && !stockNames.includes(p.name)));
                setShowNewRecipe(true);
              });
          }}
            className="gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-95">
            <Plus className="h-4 w-4" /> Nueva Receta
          </button>
          <button onClick={() => exportPDF('Recetas', ['Código','Producto','Precio','Costo Receta','Ingredientes'], recipes.map(r => [r.code, r.name, '$' + Number(r.unit_price).toLocaleString('es-CO'), '$' + Number(r.total_cost).toLocaleString('es-CO'), String(r.ingredient_count || 0)]), 'recetas.pdf')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={recipes} searchKeys={['name', 'code']} />

      {showNewRecipe && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowNewRecipe(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Seleccionar Producto</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allProducts.map(p => (
                <button key={p.id} onClick={() => handleNewRecipe(p.id)}
                  className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                  <span className="text-xs text-slate-500">${Number(p.unit_price).toLocaleString('es-CO')}</span>
                </button>
              ))}
              {allProducts.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No hay productos disponibles. Crea uno en Productos primero.</p>
              )}
            </div>
            <button onClick={() => setShowNewRecipe(false)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}

      {showRecipeModal && recipeProduct && (
        <RecipeModal
          product={recipeProduct}
          onClose={() => { setShowRecipeModal(false); setRecipeProduct(null); }}
          onSaved={() => {
            setShowRecipeModal(false);
            setRecipeProduct(null);
            apiFetch(__API_URL__ + '/api/recipes').then(r => r.json()).then(setRecipes);
          }}
        />
      )}
    </div>
  );
}

function RecipeModal({ product, onClose, onSaved }) {
  const [ingredients, setIngredients] = useState(product?.ingredients?.map(i => ({
    ingredient_id: i.ingredient_id,
    ingredient_name: i.ingredient_name,
    grams_quantity: i.grams_quantity,
  })) || []);
  const [allProducts, setAllProducts] = useState([]);
  const [newIng, setNewIng] = useState('');
  const [newGrams, setNewGrams] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/inventory')
      .then(r => r.json())
      .then(prods => setAllProducts(prods.filter(p => p.id !== product.id)))
      .catch(() => setError('Error al cargar ingredientes'));
  }, []);

  const unitLabel = (u) => {
    if (u === 'gramo') return 'g';
    if (u === 'kilo') return 'kg';
    if (u === 'litro') return 'L';
    if (u === 'ml') return 'ml';
    if (u === 'libra') return 'lb';
    return 'und';
  };

  const rawMaterials = allProducts.filter(p =>
    p.unit === 'gramo' || p.unit === 'kilo' || p.unit === 'litro' || p.unit === 'ml' || p.unit === 'libra' || !p.unit
  );

  const addIngredient = () => {
    if (!newIng || !newGrams) return;
    const prod = allProducts.find(p => p.id === newIng);
    if (!prod) return;
    setIngredients([...ingredients, { ingredient_id: prod.id, ingredient_name: prod.name, grams_quantity: parseFloat(newGrams) }]);
    setNewIng('');
    setNewGrams('');
    setError('');
  };

  const removeIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const saveRecipe = async () => {
    if (ingredients.length === 0) {
      setError('Agrega al menos un ingrediente');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(__API_URL__ + '/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, ingredients }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar receta');
        setSaving(false);
        return;
      }
      onSaved();
    } catch (e) {
      setError('Error de conexión');
      setSaving(false);
    }
  };

  const costDivisor = (unit) => {
    if (unit === 'libra') return 500;
    if (unit === 'gramo' || unit === 'ml') return 1;
    if (unit === 'unidad' || unit === 'porcion') return 1;
    return 1000; // kilo, litro
  };

  const totalCost = ingredients.reduce((sum, ing) => {
    const prod = allProducts.find(p => p.id === ing.ingredient_id);
    const div = costDivisor(prod?.unit);
    return sum + (ing.grams_quantity * (prod?.cost_price || 0) / div);
  }, 0);

  const unitPrice = Number(product.unit_price) || 0;
  const margin = unitPrice > 0 ? ((unitPrice - totalCost) / unitPrice * 100).toFixed(1) : '0.0';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-2xl rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Receta: {product.name}</h3>
            <p className="text-xs text-slate-500">Código: {product.code}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600 dark:text-slate-400">Precio: <span className="font-bold text-emerald-500">${unitPrice.toLocaleString('es-CO')}</span></p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Costo: <span className="font-bold text-amber-500">${Number(totalCost).toLocaleString('es-CO')}</span></p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Margen: <span className={`font-bold ${margin > 40 ? 'text-emerald-500' : margin > 20 ? 'text-amber-500' : 'text-rose-500'}`}>{margin}%</span></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
            {error}
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Ingrediente (materia prima)</label>
            {rawMaterials.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-3 py-4 text-center text-sm text-slate-400">
                No hay materias primas. Crea productos con unidad <strong>gramo</strong>, <strong>kilo</strong> o <strong>ml</strong> en Productos primero.
              </div>
            ) : (
              <select value={newIng} onChange={e => setNewIng(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="">Seleccionar...</option>
                {rawMaterials.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.stock || 0} {unitLabel(p.unit)})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Gramos</label>
            <div className="flex gap-2">
              <input type="number" value={newGrams} onChange={e => setNewGrams(e.target.value)} placeholder="g"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              <button onClick={addIngredient} disabled={!newIng || !newGrams}
                className="rounded-xl bg-indigo-500 px-3 py-2.5 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ingrediente</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Cantidad (g)</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Costo</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Agrega ingredientes a la receta</td></tr>
              )}
              {ingredients.map((ing, i) => {
                const prod = allProducts.find(p => p.id === ing.ingredient_id);
                const div = prod?.unit === 'libra' ? 500 : (prod?.unit === 'gramo' || prod?.unit === 'ml' || prod?.unit === 'unidad' || prod?.unit === 'porcion' ? 1 : 1000);
                const cost = ing.grams_quantity * (prod?.cost_price || 0) / div;
                return (
                  <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{ing.ingredient_name || prod?.name}</td>
                    <td className="px-4 py-2.5"><span className="font-medium">{ing.grams_quantity}g</span></td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">${Number(cost).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => removeIngredient(i)} className="text-rose-400 hover:text-rose-600 p-1">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Scale className="h-4 w-4" />
            <span>Total: <strong>{ingredients.reduce((s, i) => s + i.grams_quantity, 0)}g</strong> en {ingredients.length} ingredientes</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-40">Cancelar</button>
            <button onClick={saveRecipe} disabled={saving}
              className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-40">
              {saving ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
