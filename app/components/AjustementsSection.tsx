'use client';

import { useState } from 'react';
import { formatFCFA } from '@/app/lib/store';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

export type Ajustement = { label: string; amount: number; type: 'credit' | 'deduction' };

type AddFormProps = {
  type: 'credit' | 'deduction';
  defaultLabel: string;
  onAdd: (a: Ajustement) => void;
  onClose: () => void;
};

function AddForm({ type, defaultLabel, onAdd, onClose }: AddFormProps) {
  const [label, setLabel] = useState(defaultLabel);
  const [amount, setAmount] = useState('');
  const isCredit = type === 'credit';

  function handleAdd() {
    const val = parseFloat(amount.replace(',', '.'));
    if (!label.trim() || isNaN(val) || val <= 0) return;
    onAdd({ label: label.trim(), amount: val, type });
    onClose();
  }

  const color = isCredit ? 'green' : 'red';
  const cls = {
    bg: isCredit ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100',
    label: isCredit ? 'text-green-700' : 'text-red-700',
    btn: isCredit ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500',
  };

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${cls.bg}`}>
      <div>
        <label className={`text-xs mb-1 block ${cls.label}`}>Libellé</label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="text-sm h-8" />
      </div>
      <div>
        <label className={`text-xs mb-1 block ${cls.label}`}>Montant (FCFA)</label>
        <Input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="ex: 5000"
          className="text-sm h-8"
        />
      </div>
      <Button
        size="sm"
        onClick={handleAdd}
        disabled={!label.trim() || !amount}
        className={`w-full text-white h-8 text-xs ${cls.btn}`}
      >
        Ajouter
      </Button>
    </div>
  );
}

type Props = {
  ajustements: Ajustement[];
  onChange: (list: Ajustement[]) => void;
};

export default function AjustementsSection({ ajustements, onChange }: Props) {
  const [openForm, setOpenForm] = useState<'credit' | 'deduction' | null>(null);

  const credits = ajustements.filter((a) => a.type === 'credit');
  const deductions = ajustements.filter((a) => a.type === 'deduction');

  function add(a: Ajustement) {
    onChange([...ajustements, a]);
  }

  function remove(index: number) {
    onChange(ajustements.filter((_, i) => i !== index));
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Ce que le client me doit */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            Il me doit <span className="normal-case font-normal text-stone-400">(ajoute au total)</span>
          </span>
          <button
            onClick={() => setOpenForm(openForm === 'credit' ? null : 'credit')}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
          >
            {openForm === 'credit' ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>
        {credits.length > 0 && (
          <div className="space-y-1 mb-1.5">
            {credits.map((a, i) => {
              const realIdx = ajustements.indexOf(a);
              return (
                <div key={i} className="flex items-center justify-between text-sm bg-green-50 border border-green-100 rounded px-2 py-1.5">
                  <span className="text-stone-600 truncate flex-1">{a.label}</span>
                  <span className="text-green-600 font-medium ml-2 shrink-0">+ {formatFCFA(a.amount)}</span>
                  <button onClick={() => remove(realIdx)} className="text-stone-300 hover:text-red-400 ml-2 font-bold text-base leading-none">×</button>
                </div>
              );
            })}
          </div>
        )}
        {openForm === 'credit' && (
          <AddForm type="credit" defaultLabel="Sandwich non payé" onAdd={add} onClose={() => setOpenForm(null)} />
        )}
      </div>

      {/* Ce que je dois au client */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
            Je lui dois <span className="normal-case font-normal text-stone-400">(soustrait du total)</span>
          </span>
          <button
            onClick={() => setOpenForm(openForm === 'deduction' ? null : 'deduction')}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            {openForm === 'deduction' ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>
        {deductions.length > 0 && (
          <div className="space-y-1 mb-1.5">
            {deductions.map((a, i) => {
              const realIdx = ajustements.indexOf(a);
              return (
                <div key={i} className="flex items-center justify-between text-sm bg-red-50 border border-red-100 rounded px-2 py-1.5">
                  <span className="text-stone-600 truncate flex-1">{a.label}</span>
                  <span className="text-red-600 font-medium ml-2 shrink-0">− {formatFCFA(a.amount)}</span>
                  <button onClick={() => remove(realIdx)} className="text-stone-300 hover:text-red-400 ml-2 font-bold text-base leading-none">×</button>
                </div>
              );
            })}
          </div>
        )}
        {openForm === 'deduction' && (
          <AddForm type="deduction" defaultLabel="Restant facture précédente" onAdd={add} onClose={() => setOpenForm(null)} />
        )}
      </div>
    </div>
  );
}
