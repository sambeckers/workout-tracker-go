import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDeletedWorkoutSessions, useRestoreWorkoutSession, usePermanentlyDeleteWorkoutSession, useEmptyBin } from '@/hooks/useWorkoutData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Bin() {
  const { user } = useAuth();
  const { data: deletedSessions, isLoading } = useDeletedWorkoutSessions();
  const restoreMutation = useRestoreWorkoutSession();
  const permanentDeleteMutation = usePermanentlyDeleteWorkoutSession();
  const emptyBinMutation = useEmptyBin();
  
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading deleted workouts...</div>
      </div>
    );
  }

  const handleRestore = (sessionId: string) => {
    restoreMutation.mutate(sessionId);
  };

  const handlePermanentDelete = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  const confirmPermanentDelete = () => {
    if (sessionToDelete) {
      permanentDeleteMutation.mutate(sessionToDelete);
      setSessionToDelete(null);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workout Bin</h1>
          <p className="text-muted-foreground mt-1">Deleted workouts can be restored or permanently removed</p>
        </div>
        {deletedSessions && deletedSessions.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleEmptyBin}
            disabled={emptyBinMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Empty Bin ({deletedSessions.length})
          </Button>
        )}
      </div>

      {!deletedSessions || deletedSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Bin is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Deleted workouts will appear here</p>
          </CardContent>
        </Card>
      ) : (
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
                      onClick={() => handleRestore(session.session_id)}
                      disabled={restoreMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDelete(session.session_id)}
                      disabled={permanentDeleteMutation.isPending}
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
      )}

      {/* Permanent Delete Confirmation Dialog */}
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
            <AlertDialogAction onClick={confirmPermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
              This action cannot be undone. This will permanently delete all {deletedSessions?.length || 0} workout session(s) in the bin and all associated exercise logs.
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
