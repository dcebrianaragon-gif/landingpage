import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import WaypointEditor from './WaypointEditor';

export default function CircuitForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    flag: initial?.flag || '🏁',
    laps: initial?.laps || 5,
    track_width: initial?.track_width || 13,
    waypoints: initial?.waypoints || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">NOMBRE</Label>
          <Input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="JEREZ"
            required
            className="bg-black/50 border-border uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">BANDERA</Label>
          <Input
            value={form.flag}
            onChange={e => setForm({ ...form, flag: e.target.value })}
            placeholder="🇪🇸"
            className="bg-black/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">VUELTAS</Label>
          <Input
            type="number"
            value={form.laps}
            onChange={e => setForm({ ...form, laps: parseInt(e.target.value) || 5 })}
            min={1}
            max={30}
            className="bg-black/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs tracking-widest text-muted-foreground">ANCHO DE PISTA</Label>
          <Input
            type="number"
            value={form.track_width}
            onChange={e => setForm({ ...form, track_width: parseFloat(e.target.value) || 13 })}
            min={8}
            max={25}
            className="bg-black/50 border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs tracking-widest text-muted-foreground">TRAZADO DEL CIRCUITO</Label>
        <WaypointEditor
          waypoints={form.waypoints}
          onChange={(wps) => setForm({ ...form, waypoints: wps })}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
        <Button type="submit" disabled={saving || !form.name || form.waypoints.length < 3}
                className="bg-primary hover:bg-primary/80">
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}