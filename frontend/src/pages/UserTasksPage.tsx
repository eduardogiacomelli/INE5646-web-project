import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react'; // <--- CORRIGIDO
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'arquivada';
  priority: 'baixa' | 'media' | 'alta';
  assignedToMemberId?: { _id: string; name: string; } | string | null;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TasksApiResponse {
  tasks: Task[];
  currentPage: number;
  totalPages: number;
  totalTasks: number;
}

interface Member {
  _id: string;
  name: string;
}

interface MembersApiResponse {
  members: Member[];
}

interface TaskFormData {
  title: string;
  description: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'arquivada';
  priority: 'baixa' | 'media' | 'alta';
  assignedToMemberId: string | null;
  dueDate: string;
}

const initialTaskFormData: TaskFormData = {
  title: '',
  description: '',
  status: 'pendente',
  priority: 'media',
  assignedToMemberId: null,
  dueDate: '',
};

const UserTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTaskData, setCurrentTaskData] = useState<TaskFormData>(initialTaskFormData);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  const formDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const fetchTasks = async () => {
    if (tasks.length === 0) setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<TasksApiResponse>('/tasks');
      setTasks(response.data.tasks);
    } catch (err: any) {
      console.error('Erro ao buscar tarefas:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar as tarefas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!isFormModalOpen || availableMembers.length > 0) return;
      try {
        const response = await api.get<MembersApiResponse>('/members');
        setAvailableMembers(response.data.members);
      } catch (err) {
        console.error('Erro ao buscar membros para atribuição:', err);
      }
    };
    fetchMembers();
  }, [isFormModalOpen, availableMembers.length]);

  const openFormModal = (mode: 'create' | 'edit', task?: Task) => {
    setModalMode(mode);
    setFormError(null);
    if (mode === 'edit' && task) {
      setCurrentTaskData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignedToMemberId: typeof task.assignedToMemberId === 'object' 
                            ? task.assignedToMemberId?._id || null 
                            : task.assignedToMemberId || null,
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

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    formDialogRef.current?.close();
    setEditingTaskId(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmittingForm(true);

    if (!currentTaskData.title.trim()) {
      setFormError('O título da tarefa é obrigatório.');
      setIsSubmittingForm(false);
      return;
    }

    const payload: Partial<TaskFormData> = { ...currentTaskData };
    if (!payload.description?.trim()) payload.description = '';
    if (!payload.dueDate) delete payload.dueDate;
    if (payload.assignedToMemberId === '' || payload.assignedToMemberId === null) {
      payload.assignedToMemberId = null;
    }

    try {
      if (modalMode === 'create') {
        await api.post<{ task: Task; message: string }>('/tasks', payload);
      } else if (modalMode === 'edit' && editingTaskId) {
        await api.put<{ task: Task; message: string }>(`/tasks/${editingTaskId}`, payload);
      }
      fetchTasks(); 
      closeFormModal();
    } catch (err: any) {
      console.error(`Erro ao ${modalMode === 'create' ? 'criar' : 'editar'} tarefa:`, err);
      setFormError(err.response?.data?.message || `Não foi possível ${modalMode === 'create' ? 'criar' : 'editar'} a tarefa.`);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const openDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
    deleteDialogRef.current?.showModal();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    deleteDialogRef.current?.close();
    setTaskToDelete(null);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    setError(null); 
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      setTasks(prevTasks => prevTasks.filter(t => t._id !== taskToDelete._id));
      closeDeleteModal();
    } catch (err: any) {
      console.error('Erro ao excluir tarefa:', err);
      setError(err.response?.data?.message || 'Não foi possível excluir a tarefa.');
      closeDeleteModal(); 
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && tasks.length === 0) {
    return <article aria-busy="true">A carregar tarefas...</article>;
  }

  if (error && tasks.length === 0) { 
    return (
      <article>
        <hgroup>
          <h2>Erro ao Carregar Tarefas</h2>
          <p style={{ color: 'var(--pico-form-element-invalid-active-border-color, red)' }}>{error}</p>
        </hgroup>
        <Link to="/dashboard" role="button" className="secondary">Voltar ao Dashboard</Link>
      </article>
    );
  }

  return (
    <article>
      <hgroup>
        <h1>Minhas Tarefas</h1>
        <h2>Organize e acompanhe as suas atividades aqui.</h2>
      </hgroup>

      {error && tasks.length > 0 && (
         <aside style={{ backgroundColor: 'var(--pico-error-background)', color: 'var(--pico-error-color)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--pico-error-border)', borderRadius: 'var(--pico-border-radius)'}}>
            <strong>Erro:</strong> {error}
        </aside>
      )}

      <p>
        <button onClick={() => openFormModal('create')} disabled={isFormModalOpen || isDeleteModalOpen}>
          + Criar Nova Tarefa
        </button>
      </p>

      <dialog ref={formDialogRef} onClose={closeFormModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={(e) => { e.preventDefault(); closeFormModal(); }}></a>
            <h3>{modalMode === 'create' ? 'Criar Nova Tarefa' : 'Editar Tarefa'}</h3>
          </header>
          <form onSubmit={handleFormSubmit}>
            <label htmlFor="title">
              Título da Tarefa*
              <input type="text" id="title" name="title" value={currentTaskData.title} onChange={handleFormChange} required placeholder="Ex: Desenvolver funcionalidade X"/>
            </label>
            <label htmlFor="description">
              Descrição
              <textarea id="description" name="description" value={currentTaskData.description} onChange={handleFormChange} rows={3} placeholder="Detalhes sobre a tarefa..."></textarea>
            </label>
            <div className="grid">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={currentTaskData.status} onChange={handleFormChange}>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="arquivada">Arquivada</option>
              </select>
              <label htmlFor="priority">Prioridade</label>
              <select id="priority" name="priority" value={currentTaskData.priority} onChange={handleFormChange}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
              </select>
            </div>
            <div className="grid">
              <label htmlFor="assignedToMemberId">
                Atribuir a (Membro)
                <select id="assignedToMemberId" name="assignedToMemberId" value={currentTaskData.assignedToMemberId || ''} onChange={handleFormChange}>
                  <option value="">Ninguém (pessoal)</option>
                  {availableMembers.map(member => ( <option key={member._id} value={member._id}>{member.name}</option> ))}
                </select>
              </label>
              <label htmlFor="dueDate">
                Data de Vencimento
                <input type="date" id="dueDate" name="dueDate" value={currentTaskData.dueDate} onChange={handleFormChange} />
              </label>
            </div>
            {formError && (<p style={{ color: 'var(--pico-form-element-invalid-active-border-color, red)' }}>{formError}</p>)}
            <footer>
              <button type="button" className="secondary outline" onClick={closeFormModal} disabled={isSubmittingForm}>Cancelar</button>
              <button type="submit" aria-busy={isSubmittingForm} disabled={isSubmittingForm}>
                {isSubmittingForm ? (modalMode === 'create' ? 'A criar...' : 'A guardar...') : (modalMode === 'create' ? 'Criar Tarefa' : 'Guardar Alterações')}
              </button>
            </footer>
          </form>
        </article>
      </dialog>

      <dialog ref={deleteDialogRef} onClose={closeDeleteModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={(e) => { e.preventDefault(); closeDeleteModal(); }}></a>
            <h3>Confirmar Exclusão</h3>
          </header>
          <p>
            Tem a certeza de que deseja excluir a tarefa "<strong>{taskToDelete?.title}</strong>"?
            Esta ação não pode ser desfeita.
          </p>
          <footer>
            <button type="button" className="secondary outline" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancelar
            </button>
            <button type="button" className="contrast" onClick={confirmDeleteTask} aria-busy={isDeleting} disabled={isDeleting}>
              {isDeleting ? 'A excluir...' : 'Excluir Tarefa'}
            </button>
          </footer>
        </article>
      </dialog>

      {tasks.length === 0 && !isLoading && (<p>Você ainda não tem nenhuma tarefa registada. Que tal criar uma?</p>)}
      {tasks.length > 0 && (
        <div className="overflow-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Status</th>
                <th scope="col">Prioridade</th>
                <th scope="col">Vencimento</th>
                <th scope="col">Atribuída a</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.title}</td>
                  <td>{task.status.replace('_', ' ')}</td>
                  <td>{task.priority}</td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {typeof task.assignedToMemberId === 'object' && task.assignedToMemberId?.name 
                      ? task.assignedToMemberId.name 
                      : 'Ninguém'
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="outline secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}} onClick={() => openFormModal('edit', task)}>
                        Editar
                      </button>
                      <button className="outline contrast" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}} onClick={() => openDeleteModal(task)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
};

export default UserTasksPage;

