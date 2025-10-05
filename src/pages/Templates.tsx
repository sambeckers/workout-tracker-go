import { useState, useMemo } from 'react';
import { useWorkoutTemplates, useDeleteWorkoutTemplate, useCreateWorkoutTemplate, useUpdateWorkoutTemplate, scoreTemplates } from '@/hooks/useWorkoutData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, Copy, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { generateTemplateName } from '@/utils/templateNaming';
import { useExercises } from '@/hooks/useWorkoutData';

const TemplatesPage = () => {
  const { data: templates = [], isLoading } = useWorkoutTemplates();
  const { data: exercises = [] } = useExercises();
  const deleteTemplate = useDeleteWorkoutTemplate();
  const createTemplate = useCreateWorkoutTemplate();
  const updateTemplate = useUpdateWorkoutTemplate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newExerciseIds, setNewExerciseIds] = useState<string[]>([]);

  const filtered = templates.filter(t => t.template_name.toLowerCase().includes(search.toLowerCase()));
  const scored = useMemo(()=>scoreTemplates(templates).slice(0,5), [templates]);

  const startCreate = () => {
    const smart = generateTemplateName({ existingNames: templates.map(t=>t.template_name), baseSessionName: 'Workout' });
    setNewName(smart);
    setNewNotes('');
    setNewExerciseIds([]);
    setCreateOpen(true);
  };

  const toggleExercise = (id: string) => {
    setNewExerciseIds(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev, id]);
  };

  const handleSave = async () => {
    if(!newName.trim()) { toast.error('Name required'); return; }
    try {
      await createTemplate.mutateAsync({ template_name: newName.trim(), notes: newNotes || null, exercises: newExerciseIds.map((id, idx)=>({ exercise_id: id, exercise_order: idx })) });
      setCreateOpen(false);
    } catch(e){ /* toast in hook */ }
  };

  const startEdit = (id: string) => {
    const t = templates.find(t=>t.template_id===id);
    if(!t) return;
    setEditing(id);
    setNewName(t.template_name);
    setNewNotes(t.notes||'');
    setNewExerciseIds((t.exercises||[]).sort((a,b)=>a.exercise_order-b.exercise_order).map(e=>e.exercise_id));
    setCreateOpen(true);
  };

  const handleUpdate = async () => {
    if(!editing) return;
    try {
      await updateTemplate.mutateAsync({ template_id: editing, template_name: newName.trim(), notes: newNotes || null, exercises: newExerciseIds.map((id, idx)=>({ exercise_id: id, exercise_order: idx })) });
      setCreateOpen(false);
      setEditing(null);
    } catch(e){ /* toast in hook */ }
  };

  const duplicate = async (id: string) => {
    const src = templates.find(t=>t.template_id===id);
    if(!src) return;
    const base = src.template_name.replace(/ \(Copy\)$/i,'');
    const existingNames = templates.map(t=>t.template_name);
    const name = generateTemplateName({ existingNames, baseSessionName: base });
    try {
      await createTemplate.mutateAsync({ template_name: name + ' (Copy)', notes: src.notes||null, exercises: (src.exercises||[]).map(e=>({ exercise_id: e.exercise_id, exercise_order: e.exercise_order })) });
    } catch(e){ /* toast */ }
  };

  const [pendingDelete, setPendingDelete] = useState<string|null>(null);
  const [openDeleteId, setOpenDeleteId] = useState<string|null>(null);
  const remove = async (id: string) => {
    try {
      setPendingDelete(id);
      await deleteTemplate.mutateAsync(id);
      setOpenDeleteId(null);
    } catch(e){ /* toast handled in hook */ }
    finally { setPendingDelete(null); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground">Create and reuse workout templates</p>
        </div>
        <Button onClick={startCreate} className="gap-2"><Plus className="h-4 w-4" />New Template</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates" className="pl-8" />
        </div>
      </div>

      {scored.length>0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recommended</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {scored.map(s=> (
              <Card key={s.template.template_id} className="border-green-300/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between"><span>{s.template.template_name}</span><Badge variant="outline" className="text-xs">{s.reason}</Badge></CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                  <div>{(s.template.exercises||[]).length} exercises</div>
                  <div>Uses: {s.template.use_count}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {filtered.map(t => (
          <Card key={t.template_id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex flex-col gap-2">
                <span className="whitespace-normal break-words leading-snug" title={t.template_name}>{t.template_name}</span>
                <div className="flex gap-1 self-start">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>startEdit(t.template_id)} title="Edit"><Edit2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>duplicate(t.template_id)} title="Duplicate"><Copy className="h-3 w-3" /></Button>
                  <AlertDialog open={openDeleteId===t.template_id} onOpenChange={(o)=> setOpenDeleteId(o? t.template_id : null)}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" disabled={pendingDelete===t.template_id}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove "{t.template_name}" and its exercise list. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={pendingDelete===t.template_id}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={()=>remove(t.template_id)} disabled={pendingDelete===t.template_id} className="bg-destructive hover:bg-destructive/90">
                          {pendingDelete===t.template_id? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{(t.exercises||[]).length} exercises</div>
                <div>Uses: {t.use_count}</div>
                {t.last_used && <div>Last used: {new Date(t.last_used).toLocaleDateString()}</div>}
                {t.notes && <div className="line-clamp-2">{t.notes}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
        {!filtered.length && (
          <div className="text-sm text-muted-foreground col-span-full py-8 text-center">No templates yet.</div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(o)=>{ if(!o){ setEditing(null); } setCreateOpen(o); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing? 'Edit Template':'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1">
              <label className="text-xs font-medium">Name</label>
              <Input value={newName} onChange={e=>setNewName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">Notes</label>
              <textarea value={newNotes} onChange={e=>setNewNotes(e.target.value)} className="w-full text-xs rounded-md border bg-background p-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium">Exercises</div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-auto p-2 border rounded-md">
                {exercises.map(ex=>(
                  <button key={ex.exercise_id} onClick={()=>toggleExercise(ex.exercise_id)} className={`text-[11px] px-2 py-1 rounded border ${newExerciseIds.includes(ex.exercise_id)?'bg-primary text-primary-foreground border-primary':'hover:bg-muted'}`}>{ex.name}</button>
                ))}
              </div>
              {newExerciseIds.length>0 && (
                <div className="text-[11px] text-muted-foreground">Order: {newExerciseIds.map((id,idx)=>`${idx+1}. ${exercises.find(e=>e.exercise_id===id)?.name||'?'}`).join(', ')}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={()=>{ setCreateOpen(false); setEditing(null); }}><X className="h-4 w-4 mr-1" />Cancel</Button>
              {editing ? (
                <Button onClick={handleUpdate} disabled={updateTemplate.isPending}><Save className="h-4 w-4 mr-1" />Save</Button>
              ) : (
                <Button onClick={handleSave} disabled={createTemplate.isPending}><Save className="h-4 w-4 mr-1" />Create</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesPage;
