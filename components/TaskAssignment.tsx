
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Circle,
    Clock,
    Plus,
    Search,
    Trash2,
    User,
    AlertTriangle,
    X,
    Filter,
    ChevronRight,
    ClipboardList,
    Calendar
} from 'lucide-react';
import { Task, Worker } from '../types';

const TaskAssignment: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Task Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'Medium' as Task['priority'],
        deadline: ''
    });

    useEffect(() => {
        // Load tasks
        const savedTasks = localStorage.getItem('buildwise_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));

        // Load workers for assignment dropdown
        const savedWorkers = localStorage.getItem('buildwise_workers');
        if (savedWorkers) setWorkers(JSON.parse(savedWorkers));
    }, []);

    useEffect(() => {
        localStorage.setItem('buildwise_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = () => {
        if (!newTask.title || !newTask.assignedTo) return;

        const task: Task = {
            id: Math.random().toString(36).substr(2, 9),
            ...newTask,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        setTasks([task, ...tasks]);
        setIsAddingTask(false);
        setNewTask({ title: '', description: '', assignedTo: '', priority: 'Medium', deadline: '' });
    };

    const toggleTaskStatus = (id: string) => {
        setTasks(tasks.map(t => {
            if (t.id === id) {
                const nextStatus: Task['status'] =
                    t.status === 'Pending' ? 'In Progress' :
                        t.status === 'In Progress' ? 'Completed' : 'Pending';
                return { ...t, status: nextStatus };
            }
            return t;
        }));
    };

    const deleteTask = (id: string) => {
        if (confirm('Delete this task?')) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-500 text-white';
            case 'High': return 'bg-orange-500 text-white';
            case 'Medium': return 'bg-blue-500 text-white';
            case 'Low': return 'bg-slate-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'Completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'In Progress': return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
            default: return <Circle className="w-5 h-5 text-slate-300" />;
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 rounded-3xl border border-slate-200 shadow-sm gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800">Task Assignment</h2>
                    <p className="text-slate-500 font-medium">Delegate and track site activities</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg hover:bg-indigo-700 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Task
                    </button>
                </div>
            </div>

            {/* Task Creation Modal */}
            {isAddingTask && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl w-full max-w-lg border border-slate-100 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800">Assign New Task</h3>
                            </div>
                            <button onClick={() => setIsAddingTask(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-1">Task Title</label>
                                <input
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                    placeholder="e.g., Reinforcement steel tying"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-1">Detailed Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold h-24 resize-none"
                                    placeholder="Explain exactly what needs to be done..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-1">Assign To</label>
                                    <select
                                        value={newTask.assignedTo}
                                        onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                                    >
                                        <option value="">Select Personnel</option>
                                        {workers.map(w => <option key={w.id} value={w.name}>{w.name} ({w.role})</option>)}
                                        <option value="Subcontractor">Subcontractor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-1">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block px-1">Deadline Date</label>
                                <input
                                    type="date"
                                    value={newTask.deadline}
                                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                />
                            </div>

                            <button
                                onClick={addTask}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Finalize Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tasks List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.length === 0 ? (
                    <div className="col-span-full bg-white/50 border-4 border-dashed border-slate-200 p-20 rounded-[3rem] text-center">
                        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold capitalize">No tasks found matching your search.</p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div
                            key={task.id}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleTaskStatus(task.id)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                        {getStatusIcon(task.status)}
                                    </button>
                                    <button onClick={() => deleteTask(task.id)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-red-500 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h4 className="text-xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors uppercase leading-tight min-h-[3rem]">
                                {task.title}
                            </h4>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Assigned To</p>
                                        <p className="text-sm font-black text-slate-800">{task.assignedTo}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Deadline</p>
                                        <p className="text-sm font-black text-slate-800">{task.deadline || 'No Date'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`mt-8 p-4 rounded-2xl flex items-center justify-between ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                task.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                                }`}>
                                <span className="text-[10px] font-black uppercase tracking-widest">{task.status}</span>
                                <ChevronRight className={`w-4 h-4 transform transition-transform ${task.status === 'In Progress' ? 'animate-bounce-x' : ''
                                    }`} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TaskAssignment;
