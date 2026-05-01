// src/components/Forms/GenericForm.tsx
import React, { useState } from 'react';
import { FormContainer } from './GenericForm';
import { Plus, Trash2 } from 'lucide-react'; // O los iconos que uses

export const CategoryManager = ({ 
  categories, 
  onClose, 
  onSave 
}: { 
  categories: string[], 
  onClose: () => void, 
  onSave: (updated: string[]) => void 
}) => {
  const [list, setList] = useState<string[]>(categories);
  const [newItem, setNewItem] = useState('');

  const addCategory = () => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setList([...list, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeCategory = (index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <FormContainer 
      title="Gestionar Categorías" 
      onClose={onClose} 
      onSubmit={(e) => { e.preventDefault(); onSave(list); }}
    >
      <div className="space-y-4">
        {/* Input para nueva categoría */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="Nueva categoría (ej: Operaciones)"
          />
          <button 
            type="button"
            onClick={addCategory}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de categorías actuales */}
        <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
          {list.length === 0 && (
            <p className="p-3 text-center text-gray-400 text-sm">No hay categorías creadas.</p>
          )}
          {list.map((cat, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white">
              <span className="text-sm font-medium text-gray-700">{cat}</span>
              <button 
                type="button"
                onClick={() => removeCategory(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </FormContainer>
  );
};
