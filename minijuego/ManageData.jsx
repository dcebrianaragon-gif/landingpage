import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import CircuitForm from '@/components/manage/CircuitForm';
import BikeForm from '@/components/manage/BikeForm';
import { localData } from '@/data/localData.js';

export default function ManageData() {
  const queryClient = useQueryClient();
  const [editingCircuit, setEditingCircuit] = useState(null);
  const [editingBike, setEditingBike] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: circuits = [], isLoading: loadingC } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => localData.listCircuits(),
  });

  const { data: bikes = [], isLoading: loadingB } = useQuery({
    queryKey: ['bikes'],
    queryFn: () => localData.listBikes(),
  });

  const saveCircuit = async (data) => {
    setSaving(true);
    await localData.saveCircuit(data, editingCircuit === 'new' ? null : editingCircuit.id);
    queryClient.invalidateQueries({ queryKey: ['circuits'] });
    setEditingCircuit(null);
    setSaving(false);
  };

  const deleteCircuit = async (id) => {
    await localData.deleteCircuit(id);
    queryClient.invalidateQueries({ queryKey: ['circuits'] });
  };

  const saveBike = async (data) => {
    setSaving(true);
    await localData.saveBike(data, editingBike === 'new' ? null : editingBike.id);
    queryClient.invalidateQueries({ queryKey: ['bikes'] });
    setEditingBike(null);
    setSaving(false);
  };

  const deleteBike = async (id) => {
    await localData.deleteBike(id);
    queryClient.invalidateQueries({ queryKey: ['bikes'] });
  };

  return (
    <div className="min-h-screen bg-background p-6 font-mono">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Link to="/Game" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Volver al juego
          </Link>
          <div className="flex-1" />
          <h1 className="text-xl font-black italic uppercase tracking-tight">
            GESTIONAR <span className="text-primary">DATOS</span>
          </h1>
        </div>

        <Tabs defaultValue="circuits" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="circuits">Circuitos</TabsTrigger>
            <TabsTrigger value="bikes">Motos</TabsTrigger>
          </TabsList>

          <TabsContent value="circuits" className="space-y-4">
            {editingCircuit ? (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                    {editingCircuit === 'new' ? 'NUEVO CIRCUITO' : 'EDITAR CIRCUITO'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CircuitForm initial={editingCircuit === 'new' ? null : editingCircuit} onSave={saveCircuit} onCancel={() => setEditingCircuit(null)} saving={saving} />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button onClick={() => setEditingCircuit('new')} className="bg-primary hover:bg-primary/80">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo circuito
                  </Button>
                </div>

                {loadingC ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : circuits.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No hay circuitos. Crea uno para empezar.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {circuits.map((c) => (
                      <Card key={c.id} className="border-border bg-card">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{c.flag}</span>
                            <div>
                              <div className="font-bold uppercase tracking-wide">{c.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {c.laps || 5} vueltas - Ancho: {c.track_width || 13} - {(c.waypoints || []).length} puntos
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => setEditingCircuit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => deleteCircuit(c.id)} className="hover:border-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
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

          <TabsContent value="bikes" className="space-y-4">
            {editingBike ? (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                    {editingBike === 'new' ? 'NUEVA MOTO' : 'EDITAR MOTO'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BikeForm initial={editingBike === 'new' ? null : editingBike} onSave={saveBike} onCancel={() => setEditingBike(null)} saving={saving} />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button onClick={() => setEditingBike('new')} className="bg-primary hover:bg-primary/80">
                    <Plus className="mr-2 h-4 w-4" /> Nueva moto
                  </Button>
                </div>

                {loadingB ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : bikes.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No hay motos. Crea una para empezar.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {bikes.map((b) => (
                      <Card key={b.id} className="border-border bg-card">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded border border-border" style={{ backgroundColor: `#${b.color_hex || 'e10000'}` }} />
                            <div>
                              <div className="font-bold uppercase tracking-wide">
                                {b.flag} {b.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {b.info} - Vel: {b.max_speed} - Acel: {b.accel} - Freno: {b.brake}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => setEditingBike(b)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => deleteBike(b.id)} className="hover:border-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
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
