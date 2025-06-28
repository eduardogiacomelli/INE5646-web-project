import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import TaskCard from '../components/tasks/TaskCard';

// Tipos de dados (mantendo consistência)
export interface Member { _id: string; name: string; }
export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'arquivada';
  priority: 'baixa' | 'media' | 'alta';
  assignedMemberIds: Member[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
interface TasksApiResponse { tasks: Task[]; totalTasks: number; }
interface MembersApiResponse { members: Member[]; }
interface TaskFormData {
  title: string;
  description: string;
  priority: 'baixa' | 'media' | 'alta';
  assignedMemberIds: string[];
  dueDate?: string;
}

const initialTaskFormData: TaskFormData = {
  title: '', description: '', priority: 'media', assignedMemberIds: [], dueDate: '',
};

// Funções auxiliares para datas
const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};
const getMaxDateString = () => {
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  return maxDate.toISOString().split('T')[0];
};

const UserTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTaskData, setCurrentTaskData] = useState<TaskFormData>(initialTaskFormData);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const formDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const fetchTasks = async () => {
    if (tasks.length === 0) setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<TasksApiResponse>('/tasks');
      setTasks(response.data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar as tarefas.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (availableMembers.length > 0) return;
    try {
      const response = await api.get<MembersApiResponse>('/members');
      setAvailableMembers(response.data.members);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
      if (isFormModalOpen) setFormError('Não foi possível carregar a equipe.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchMembers();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOpenFormModal = (mode: 'create' | 'edit', task?: Task) => {
    setModalMode(mode);
    setFormError(null);
    if (mode === 'edit' && task) {
      setCurrentTaskData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assignedMemberIds: task.assignedMemberIds.map(member => member._id),
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      });
      setEditingTaskId(task._id);
    } else {
      setCurrentTaskData(initialTaskFormData);
      setEditingTaskId(null);
    }
    setIsFormModalOpen(true);
    formDialogRef.current?.showModal();
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    formDialogRef.current?.close();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'assignedMemberIds' && e.target instanceof HTMLSelectElement) {
      const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
      setCurrentTaskData(prev => ({ ...prev, assignedMemberIds: selectedIds }));
    } else {
      setCurrentTaskData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmittingForm(true);

    // Validação de nome com mínimo de 3 caracteres
    if (!currentTaskData.title.trim() || currentTaskData.title.trim().length < 3) {
      setFormError('O título da tarefa é obrigatório e deve ter pelo menos 3 caracteres.');
      setIsSubmittingForm(false);
      return;
    }

    const payload: Partial<TaskFormData> & { status?: string } = { ...currentTaskData };
    if (!payload.description?.trim()) payload.description = '';
    
    // Validação de data
    if (payload.dueDate) {
        const tomorrow = new Date(getTomorrowDateString());
        const selectedDate = new Date(payload.dueDate + 'T00:00:00');
        if (selectedDate < tomorrow) {
            setFormError('A data de vencimento não pode ser hoje ou no passado.');
            setIsSubmittingForm(false);
            return;
        }
    } else {
        delete payload.dueDate; // Remove o campo se estiver vazio
    }

    try {
      if (modalMode === 'create') {
        payload.status = 'pendente'; // Status padrão na criação
        await api.post('/tasks', payload);
      } else if (modalMode === 'edit' && editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
      }
      fetchTasks();
      handleCloseFormModal();
    } catch (err: any) {
      setFormError(err.response?.data?.message || `Não foi possível ${modalMode} a tarefa.`);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleOpenDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
    deleteDialogRef.current?.showModal();
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    deleteDialogRef.current?.close();
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      setTasks(prev => prev.filter(t => t._id !== taskToDelete._id));
      handleCloseDeleteModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível excluir a tarefa.');
      handleCloseDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  // FILTRAGEM: Exibe apenas tarefas pendentes ou em andamento nesta página.
  const activeTasks = tasks.filter(task => task.status === 'pendente' || task.status === 'em_andamento');

  if (isLoading) {
    return <article aria-busy="true">Carregando tarefas...</article>;
  }

  return (
    <article>
      <hgroup>
        <h1>Minhas Tarefas Ativas</h1>
        <p>Crie e gerencie suas atividades pendentes e em andamento aqui.</p>
      </hgroup>

      {error && (
        <aside style={{ backgroundColor: 'var(--pico-color-red-200)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--pico-color-red-500)', borderRadius: 'var(--pico-border-radius)'}}>
          <strong>Erro:</strong> {error}
        </aside>
      )}

      <button onClick={() => handleOpenFormModal('create')} disabled={isFormModalOpen || isDeleteModalOpen}>
        + Criar Nova Tarefa
      </button>

      {/* Modal de Criar/Editar Tarefa */}
      <dialog ref={formDialogRef} onClose={handleCloseFormModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={handleCloseFormModal}></a>
            <h3>{modalMode === 'create' ? 'Criar Nova Tarefa' : 'Editar Tarefa'}</h3>
          </header>
          <form onSubmit={handleFormSubmit}>
            <label htmlFor="title">Título* (mín. 3 caracteres)</label>
            <input type="text" id="title" name="title" value={currentTaskData.title} onChange={handleFormChange} required minLength={3} />
            
            <label htmlFor="description">Descrição</label>
            <textarea id="description" name="description" value={currentTaskData.description} onChange={handleFormChange} rows={3}></textarea>
            
            <div className="grid">
                <label htmlFor="priority">Prioridade</label>
                <select id="priority" name="priority" value={currentTaskData.priority} onChange={handleFormChange}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                </select>
                <label htmlFor="dueDate">Data de Vencimento</label>
                <input
                  type="date" id="dueDate" name="dueDate" value={currentTaskData.dueDate || ''}
                  onChange={handleFormChange} min={getTomorrowDateString()} max={getMaxDateString()}
                />
            </div>
            
            <label htmlFor="assignedMemberIds">Atribuir a (Segure Ctrl/Cmd para múltiplos)</label>
            <select
              multiple id="assignedMemberIds" name="assignedMemberIds"
              value={currentTaskData.assignedMemberIds} onChange={handleFormChange} style={{ height: '150px' }}
            >
              {availableMembers.map(member => (
                <option key={member._id} value={member._id}>{member.name}</option>
              ))}
            </select>
            
            {formError && <p style={{ color: 'var(--pico-color-red-500)' }}>{formError}</p>}
            
            <footer>
              <button type="button" className="secondary outline" onClick={handleCloseFormModal} disabled={isSubmittingForm}>Cancelar</button>
              <button type="submit" aria-busy={isSubmittingForm} disabled={isSubmittingForm}>
                {isSubmittingForm ? (modalMode === 'create' ? 'Criando...' : 'Salvando...') : (modalMode === 'create' ? 'Criar Tarefa' : 'Salvar Alterações')}
              </button>
            </footer>
          </form>
        </article>
      </dialog>

      {/* Modal de Exclusão */}
      <dialog ref={deleteDialogRef} onClose={handleCloseDeleteModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={handleCloseDeleteModal}></a>
            <h3>Confirmar Exclusão</h3>
          </header>
          <p>Tem certeza que deseja excluir a tarefa "<strong>{taskToDelete?.title}</strong>"?</p>
          <footer>
            <button type="button" className="secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>Cancelar</button>
            <button className="contrast" onClick={handleConfirmDeleteTask} aria-busy={isDeleting} disabled={isDeleting}>
              {isDeleting ? '' : 'Excluir Tarefa'}
            </button>
          </footer>
        </article>
      </dialog>

      {/* Layout de Cards para Tarefas */}
      <section style={{ marginTop: '2rem' }}>
        {tasks.length === 0 && !isLoading ? (
          <p>Você ainda não tem tarefas. Que tal criar uma?</p>
        ) : activeTasks.length === 0 ? (
          <article style={{ textAlign: 'center' }}>
            <p>Ótimo trabalho! Você não tem tarefas pendentes ou em andamento.</p>
          </article>
        ) : (
          // CORREÇÃO: Estilo inline para criar uma grade responsiva que quebra a linha
          <div 
            className="grid" 
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {activeTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={() => handleOpenFormModal('edit', task)}
                onDelete={() => handleOpenDeleteModal(task)}
              />
            ))}
          </div>
        )}
      </section>
    </article>
  );
};

export default UserTasksPage;

