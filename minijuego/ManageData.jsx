import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import CircuitForm from '@/components/manage/CircuitForm';
import BikeForm from '@/components/manage/BikeForm';

export default function ManageData() {
  const queryClient = useQueryClient();
  const [editingCircuit, setEditingCircuit] = useState(null); // null | 'new' | circuit object
  const [editingBike, setEditingBike] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: circuits = [], isLoading: loadingC } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => base44.entities.Circuit.list(),
  });

  const { data: bikes = [], isLoading: loadingB } = useQuery({
    queryKey: ['bikes'],
    queryFn: () => base44.entities.Bike.list(),
  });

  const saveCircuit = async (data) => {
    setSaving(true);
    if (editingCircuit === 'new') {
      await base44.entities.Circuit.create(data);
    } else {
      await base44.entities.Circuit.update(editingCircuit.id, data);
    }
    queryClient.invalidateQueries({ queryKey: ['circuits'] });
    setEditingCircuit(null);
    setSaving(false);
  };

  const deleteCircuit = async (id) => {
    await base44.entities.Circuit.delete(id);
    queryClient.invalidateQueries({ queryKey: ['circuits'] });
  };

  const saveBike = async (data) => {
    setSaving(true);
    if (editingBike === 'new') {
      await base44.entities.Bike.create(data);
    } else {
      await base44.entities.Bike.update(editingBike.id, data);
    }
    queryClient.invalidateQueries({ queryKey: ['bikes'] });
    setEditingBike(null);
    setSaving(false);
  };

  const deleteBike = async (id) => {
    await base44.entities.Bike.delete(id);
    queryClient.invalidateQueries({ queryKey: ['bikes'] });
  };

  return (
    <div className="min-h-screen bg-background font-mono p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/Game"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al juego
          </Link>
          <div className="flex-1" />
          <h1 className="font-black italic text-xl uppercase tracking-tight">
            GESTIONAR <span className="text-primary">DATOS</span>
          </h1>
        </div>

        <Tabs defaultValue="circuits" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="circuits">🏁 Circuitos</TabsTrigger>
            <TabsTrigger value="bikes">🏍️ Motos</TabsTrigger>
          </TabsList>

          {/* CIRCUITS TAB */}
          <TabsContent value="circuits" className="space-y-4">
            {editingCircuit ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">
                    {editingCircuit === 'new' ? 'NUEVO CIRCUITO' : 'EDITAR CIRCUITO'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CircuitForm
                    initial={editingCircuit === 'new' ? null : editingCircuit}
                    onSave={saveCircuit}
                    onCancel={() => setEditingCircuit(null)}
                    saving={saving}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setEditingCircuit('new')}
                    className="bg-primary hover:bg-primary/80"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Circuito
                  </Button>
                </div>

                {loadingC ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : circuits.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No hay circuitos. Crea uno para empezar.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {circuits.map(c => (
                      <Card key={c.id} className="bg-card border-border">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{c.flag}</span>
                            <div>
                              <div className="font-bold uppercase tracking-wide">{c.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {c.laps || 5} vueltas · Ancho: {c.track_width || 13} · {(c.waypoints || []).length} puntos
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingCircuit(c)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => deleteCircuit(c.id)}
                              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* BIKES TAB */}
          <TabsContent value="bikes" className="space-y-4">
            {editingBike ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm tracking-widest text-muted-foreground uppercase">
                    {editingBike === 'new' ? 'NUEVA MOTO' : 'EDITAR MOTO'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BikeForm
                    initial={editingBike === 'new' ? null : editingBike}
                    onSave={saveBike}
                    onCancel={() => setEditingBike(null)}
                    saving={saving}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setEditingBike('new')}
                    className="bg-primary hover:bg-primary/80"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Nueva Moto
                  </Button>
                </div>

                {loadingB ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : bikes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No hay motos. Crea una para empezar.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {bikes.map(b => (
                      <Card key={b.id} className="bg-card border-border">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded border border-border"
                              style={{ backgroundColor: '#' + (b.color_hex || 'e10000') }}
                            />
                            <div>
                              <div className="font-bold uppercase tracking-wide">
                                {b.flag} {b.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {b.info} · Vel: {b.max_speed} · Acel: {b.accel} · Freno: {b.brake}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingBike(b)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => deleteBike(b.id)}
                              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}