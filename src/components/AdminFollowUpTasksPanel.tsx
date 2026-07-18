import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, Plus, Trash2, AlertTriangle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { AdminTask, TaskStatus, TaskPriority } from '@/types/trialOperations';

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3" /> },
    in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800', icon: <AlertCircle className="h-3 w-3" /> },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3 w-3" /> },
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const cfg = config[status];
  return (
    <Badge className={cfg.color}>
      {cfg.icon}
      <span className="ml-1">{cfg.label}</span>
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const color =
    priority === 'high'
      ? 'bg-red-100 text-red-800'
      : priority === 'medium'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-700';
  return <Badge className={color}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>;
}

export function AdminFollowUpTasksPanel({
  tasks,
  onAdd,
  onUpdate,
  onDelete,
  isAdmin,
}: {
  tasks: AdminTask[];
  onAdd: (task: Omit<AdminTask, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, patch: Partial<AdminTask>) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<AdminTask>>({
    taskTitle: '',
    taskDescription: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'open',
    notes: '',
  });

  const openCount = tasks.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const highPriorityOpen = tasks.filter((t) => t.priority === 'high' && (t.status === 'open' || t.status === 'in_progress')).length;

  const handleAdd = () => {
    if (!newTask.taskTitle?.trim()) return;
    onAdd({
      taskTitle: newTask.taskTitle,
      taskDescription: newTask.taskDescription || '',
      assignedTo: newTask.assignedTo || null,
      dueDate: newTask.dueDate || null,
      priority: (newTask.priority as TaskPriority) || 'medium',
      status: (newTask.status as TaskStatus) || 'open',
      notes: newTask.notes || '',
      completedDate: null,
    });
    setDialogOpen(false);
    setNewTask({
      taskTitle: '',
      taskDescription: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium',
      status: 'open',
      notes: '',
    });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { open: 0, in_progress: 1, overdue: 2, completed: 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <CardTitle className="text-lg">Admin Follow-Up Tasks</CardTitle>
              <p className="text-sm text-muted-foreground">Operational and protocol tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {highPriorityOpen > 0 && (
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {highPriorityOpen} high priority
              </Badge>
            )}
            <Badge variant="secondary">{openCount} open</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Follow-Up Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Task Title *</Label>
                  <Input
                    value={newTask.taskTitle}
                    onChange={(e) => setNewTask((p) => ({ ...p, taskTitle: e.target.value }))}
                    placeholder="e.g. Confirm refrigerator storage temperature"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTask.taskDescription}
                    onChange={(e) => setNewTask((p) => ({ ...p, taskDescription: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <Input
                      value={newTask.assignedTo ?? ''}
                      onChange={(e) => setNewTask((p) => ({ ...p, assignedTo: e.target.value }))}
                      placeholder="Name or email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newTask.dueDate ?? ''}
                      onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v as TaskPriority }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newTask.status}
                      onValueChange={(v) => setNewTask((p) => ({ ...p, status: v as TaskStatus }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full" type="button" disabled={!newTask.taskTitle?.trim()}>
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {sortedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No follow-up tasks.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-[80px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{task.taskTitle}</p>
                        {task.taskDescription && (
                          <p className="text-xs text-muted-foreground">{task.taskDescription}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{task.assignedTo || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Select
                          value={task.status}
                          onValueChange={(v) => onUpdate(task.id, { status: v as TaskStatus, completedDate: v === 'completed' ? new Date().toISOString() : null })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <TaskStatusBadge status={task.status} />
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(task.id)} type="button">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
