import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeletedWorkoutSessions, useRestoreWorkoutSession, usePermanentlyDeleteWorkoutSession, useEmptyBin, useDeletedWorkoutTemplates, useRestoreWorkoutTemplate, usePermanentlyDeleteWorkoutTemplate } from '@/hooks/useWorkoutData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, Calendar, Clock, AlertTriangle, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Bin() {
  const { user } = useAuth();
  const { data: deletedSessions, isLoading } = useDeletedWorkoutSessions();
  const { data: deletedTemplates, isLoading: templatesLoading } = useDeletedWorkoutTemplates();
  const restoreSessionMutation = useRestoreWorkoutSession();
  const permanentDeleteSessionMutation = usePermanentlyDeleteWorkoutSession();
  const restoreTemplateMutation = useRestoreWorkoutTemplate();
  const permanentDeleteTemplateMutation = usePermanentlyDeleteWorkoutTemplate();
  const emptyBinMutation = useEmptyBin();
  
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [showEmptyBinDialog, setShowEmptyBinDialog] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view your deleted workouts.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading || templatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading deleted items...</div>
      </div>
    );
  }

  const handleRestoreSession = (sessionId: string) => {
    restoreSessionMutation.mutate(sessionId);
  };

  const handlePermanentDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  const confirmPermanentDeleteSession = () => {
    if (sessionToDelete) {
      permanentDeleteSessionMutation.mutate(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  const handleRestoreTemplate = (templateId: string) => {
    restoreTemplateMutation.mutate(templateId);
  };

  const handlePermanentDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
  };

  const confirmPermanentDeleteTemplate = () => {
    if (templateToDelete) {
      permanentDeleteTemplateMutation.mutate(templateToDelete);
      setTemplateToDelete(null);
    }
  };

  const handleEmptyBin = () => {
    setShowEmptyBinDialog(true);
  };

  const confirmEmptyBin = () => {
    emptyBinMutation.mutate();
    setShowEmptyBinDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Planned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Skipped': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalItems = (deletedSessions?.length || 0) + (deletedTemplates?.length || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bin</h1>
          <p className="text-muted-foreground mt-1">Deleted items can be restored or permanently removed</p>
        </div>
        {totalItems > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleEmptyBin}
            disabled={emptyBinMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Bin ({totalItems})
          </Button>
        )}
      </div>

      {totalItems === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Bin is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Deleted items will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Deleted Workouts Section */}
          {deletedSessions && deletedSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Workouts</h2>
              <div className="grid gap-4">
                {deletedSessions.map((session) => (
            <Card key={session.session_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {session.title || 'Untitled Workout'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(parseISO(session.date), 'MMM dd, yyyy')}
                          </div>
                          {session.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {session.time}
                            </div>
                          )}
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        {session.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {session.notes}
                          </p>
                        )}
                        {session.deleted_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Deleted {format(parseISO(session.deleted_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreSession(session.session_id)}
                      disabled={restoreSessionMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDeleteSession(session.session_id)}
                      disabled={permanentDeleteSessionMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Forever
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Templates Section */}
          {deletedTemplates && deletedTemplates.length > 0 && (
            <div className="space-y-4">
              {deletedSessions && deletedSessions.length > 0 && <Separator />}
              <h2 className="text-xl font-semibold">Templates</h2>
              <div className="grid gap-4">
                {deletedTemplates.map((template) => (
                  <Card key={template.template_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {template.template_name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <div>{(template.exercises||[]).length} exercises</div>
                                <div>Uses: {template.use_count}</div>
                                {template.last_used && (
                                  <div>Last used: {format(parseISO(template.last_used), 'MMM dd, yyyy')}</div>
                                )}
                              </div>
                              {template.notes && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {template.notes}
                                </p>
                              )}
                              {template.deleted_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Deleted {format(parseISO(template.deleted_at), 'MMM dd, yyyy HH:mm')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreTemplate(template.template_id)}
                            disabled={restoreTemplateMutation.isPending}
                            className="flex-1 sm:flex-none"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDeleteTemplate(template.template_id)}
                            disabled={permanentDeleteTemplateMutation.isPending}
                            className="flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permanent Delete Session Confirmation Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Workout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this workout session and all associated exercise logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Template Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Template?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this template and all associated exercise configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDeleteTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Bin Confirmation Dialog */}
      <AlertDialog open={showEmptyBinDialog} onOpenChange={setShowEmptyBinDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Empty Entire Bin?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all {deletedSessions?.length || 0} workout(s) and {deletedTemplates?.length || 0} template(s) in the bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEmptyBin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Empty Bin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
