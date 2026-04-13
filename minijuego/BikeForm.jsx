import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

export default function BikeForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    flag: initial?.flag || 'ES',
    info: initial?.info || '',
    max_speed: initial?.max_speed || 2.3,
    accel: initial?.accel || 0.033,
    brake: initial?.brake || 0.065,
    turn: initial?.turn || 0.045,
    lean: initial?.lean || 0.14,
    top_gear: initial?.top_gear || 6,
    color_hex: initial?.color_hex || 'e10000',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const fields = [
    { key: 'max_speed', label: 'VELOCIDAD MAX', min: 1, max: 5, step: 0.1 },
    { key: 'accel', label: 'ACELERACION', min: 0.01, max: 0.1, step: 0.001 },
    { key: 'brake', label: 'FRENADA', min: 0.01, max: 0.15, step: 0.001 },
    { key: 'turn', label: 'GIRO', min: 0.01, max: 0.1, step: 0.001 },
    { key: 'lean', label: 'INCLINACION', min: 0.05, max: 0.3, step: 0.01 },
    { key: 'top_gear', label: 'MARCHAS', min: 4, max: 8, step: 1 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">NOMBRE</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="DUCATI" required className="border-border bg-black/50 uppercase" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">BANDERA</Label>
          <Input value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="ES" className="border-border bg-black/50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">DESCRIPCION</Label>
          <Input value={form.info} onChange={(e) => setForm({ ...form, info: e.target.value })} placeholder="Potencia bruta - V4" className="border-border bg-black/50" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">COLOR (HEX)</Label>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex-shrink-0 rounded border border-border" style={{ backgroundColor: `#${form.color_hex}` }} />
            <Input value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value.replace('#', '') })} placeholder="e10000" className="border-border bg-black/50 font-mono" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label className="text-[9px] tracking-widest text-muted-foreground">{f.label}</Label>
            <Input type="number" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: parseFloat(e.target.value) || 0 })} min={f.min} max={f.max} step={f.step} className="border-border bg-black/50 font-mono text-sm" />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X className="mr-1 h-4 w-4" /> Cancelar
        </Button>
        <Button type="submit" disabled={saving || !form.name} className="bg-primary hover:bg-primary/80">
          <Save className="mr-1 h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
