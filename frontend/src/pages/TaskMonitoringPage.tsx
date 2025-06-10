import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom'; // <--- REMOVIDO (TS6133)
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'baixa' | 'media' | 'alta';
  assignedToMemberId?: { _id: string; name: string; email?: string } | string | null;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'arquivada';
export const ALL_TASK_STATUSES: TaskStatus[] = ['pendente', 'em_andamento', 'concluida', 'arquivada'];

interface TasksApiResponse {
  tasks: Task[];
}
interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'baixa' | 'media' | 'alta';
  assignedToMemberId: string | null;
  dueDate?: string; // <--- CORRIGIDO (TS2790) - tornado opcional
}
interface Member { _id: string; name: string; }
interface MembersApiResponse { members: Member[]; }

const initialTaskFormData: TaskFormData = {
  title: '', description: '', status: 'pendente', priority: 'media', assignedToMemberId: null, dueDate: ''
};

const TaskMonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<TaskStatus | 'todas'>('todas');

  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [currentTaskData, setCurrentTaskData] = useState<TaskFormData>(initialTaskFormData);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formDialogRef = useRef<HTMLDialogElement>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false); // TS6133 - será usado no 'open' do dialog
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const fetchAllTasks = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<TasksApiResponse>(`/tasks?limit=1000`);
      setAllTasks(response.data.tasks);
    } catch (err: any) {
      console.error('Erro ao buscar tarefas:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar as tarefas.');
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllTasks();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (activeStatusFilter === 'todas') {
      setFilteredTasks(allTasks);
    } else {
      setFilteredTasks(allTasks.filter(task => task.status === activeStatusFilter));
    }
  }, [activeStatusFilter, allTasks]);

   useEffect(() => {
    const fetchMembers = async () => {
      if (!isFormModalOpen || availableMembers.length > 0 || !editingTaskId) return; 
      try {
        const response = await api.get<MembersApiResponse>('/members');
        setAvailableMembers(response.data.members);
      } catch (err) {
        console.error('Erro ao buscar membros para atribuição:', err);
        setFormError('Não foi possível carregar os membros da equipa para o formulário.');
      }
    };
    fetchMembers();
  }, [isFormModalOpen, availableMembers.length, editingTaskId]);


  const handleStatusChangeOnTable = async (taskId: string, newStatus: TaskStatus) => {
    const originalTasks = [...allTasks];
    const taskToUpdate = originalTasks.find(t => t._id === taskId);
    if (!taskToUpdate) return;

    const optimisticTasks = originalTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t);
    setAllTasks(optimisticTasks);
    setGeneralMessage(`Status da tarefa "${taskToUpdate.title}" alterado para ${newStatus.replace('_', ' ')}.`);
    setError(null);

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err: any) {
      console.error('Erro ao atualizar status da tarefa:', err);
      setError(err.response?.data?.message || 'Não foi possível atualizar o status da tarefa.');
      setGeneralMessage(null);
      setAllTasks(originalTasks);
    }
  };

  const openEditModal = (task: Task) => {
    setFormError(null);
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
    setIsFormModalOpen(true);
    formDialogRef.current?.showModal();
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    formDialogRef.current?.close();
    setEditingTaskId(null);
    setCurrentTaskData(initialTaskFormData);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentTaskData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => { // Importar FormEvent como type
    e.preventDefault();
    if (!editingTaskId) return;
    setFormError(null);
    setIsSubmittingForm(true);
    setGeneralMessage(null);
    setError(null);

    if (!currentTaskData.title.trim()) {
      setFormError('O título da tarefa é obrigatório.');
      setIsSubmittingForm(false);
      return;
    }
    const payload = { ...currentTaskData };
    if (!payload.description?.trim()) payload.description = '';
    // Se dueDate for string vazia, será removido. Se não, mantém o valor.
    if (payload.dueDate === '') {
        delete payload.dueDate;
    }
    if (payload.assignedToMemberId === '') payload.assignedToMemberId = null;

    try {
      await api.put<{ task: Task; message: string }>(`/tasks/${editingTaskId}`, payload);
      setGeneralMessage(`Tarefa "${payload.title}" atualizada com sucesso.`);
      fetchAllTasks(false); 
      closeFormModal();
    } catch (err: any) {
      console.error('Erro ao editar tarefa:', err);
      setFormError(err.response?.data?.message || 'Não foi possível editar a tarefa.');
    } finally {
      setIsSubmittingForm(false);
    }
  };
  
  const openDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true); // Define o estado
    deleteDialogRef.current?.showModal();
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false); // Define o estado
    deleteDialogRef.current?.close();
    setTaskToDelete(null);
  };
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    setError(null);
    setGeneralMessage(null);
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      setGeneralMessage(`Tarefa "${taskToDelete.title}" excluída com sucesso.`);
      setAllTasks(prev => prev.filter(t => t._id !== taskToDelete._id));
      closeDeleteModal();
    } catch (err: any) {
      console.error('Erro ao excluir tarefa:', err);
      setError(err.response?.data?.message || 'Não foi possível excluir a tarefa.');
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <article aria-busy="true" style={{ textAlign: 'center', marginTop: '2rem' }}>A carregar tarefas...</article>;
  }

  return (
    <div className="monitoring-table-container">
      <hgroup style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Monitoramento de Tarefas</h1>
        <h2>Filtre e gira o status das suas tarefas.</h2>
      </hgroup>

      {generalMessage && (
         <aside role="status" style={{ backgroundColor: 'var(--pico-form-element-valid-background-color, #e8f5e9)', color: 'var(--pico-form-element-valid-color, #2e7d32)', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--pico-form-element-valid-border-color, #a5d6a7)', borderRadius: 'var(--pico-border-radius)'}}>
            {generalMessage}
        </aside>
      )}
       {error && (
         <aside role="alert" style={{ backgroundColor: 'var(--pico-error-background)', color: 'var(--pico-error-color)', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--pico-error-border)', borderRadius: 'var(--pico-border-radius)'}}>
            <strong>Erro:</strong> {error}
        </aside>
      )}

      <nav>
        <ul style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
          <li><strong>Filtrar:</strong></li>
          <li>
            <button role="button" className={activeStatusFilter === 'todas' ? '' : 'secondary outline'} onClick={() => setActiveStatusFilter('todas')}>
              Todas ({allTasks.length})
            </button>
          </li>
          {ALL_TASK_STATUSES.map(status => (
            <li key={status}>
              <button
                role="button"
                className={activeStatusFilter === status ? '' : 'secondary outline'}
                onClick={() => setActiveStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({allTasks.filter(t => t.status === status).length})
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {filteredTasks.length === 0 && !isLoading ? (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Nenhuma tarefa encontrada para o filtro selecionado.</p>
      ) : (
        <div className="overflow-auto" style={{marginTop: '1.5rem'}}>
          <table>
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Prioridade</th>
                <th scope="col">Status Atual</th>
                <th scope="col">Mudar Status</th>
                <th scope="col">Vencimento</th>
                <th scope="col">Atribuída a</th>
                <th scope="col" className="actions-cell">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task._id}>
                  <td data-label="Título">{task.title}</td>
                  <td data-label="Prioridade">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</td>
                  <td data-label="Status Atual">{task.status.replace('_', ' ')}</td>
                  <td data-label="Mudar Status">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChangeOnTable(task._id, e.target.value as TaskStatus)}
                      aria-label={`Mudar status da tarefa ${task.title}`}
                      className="status-select"
                    >
                      {ALL_TASK_STATUSES.map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Vencimento">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/D'}</td>
                  <td data-label="Atribuída a">
                    {typeof task.assignedToMemberId === 'object' && task.assignedToMemberId?.name 
                      ? task.assignedToMemberId.name 
                      : 'Ninguém'}
                  </td>
                  <td data-label="Ações" className="actions-cell">
                    <button className="outline secondary" onClick={() => openEditModal(task)} style={{fontSize: '0.875rem', padding: '0.3rem 0.6rem'}}>Editar</button>
                    <button className="outline contrast" onClick={() => openDeleteModal(task)} style={{fontSize: '0.875rem', padding: '0.3rem 0.6rem'}}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog ref={formDialogRef} onClose={closeFormModal} open={isFormModalOpen}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={(e) => { e.preventDefault(); closeFormModal(); }}></a>
            <h3>Editar Tarefa</h3>
          </header>
          <form onSubmit={handleFormSubmit}>
            <label htmlFor="editTaskTitleTable">Título*</label>
            <input type="text" id="editTaskTitleTable" name="title" value={currentTaskData.title} onChange={handleFormChange} required />
            
            <label htmlFor="editTaskDescriptionTable">Descrição</label>
            <textarea id="editTaskDescriptionTable" name="description" value={currentTaskData.description} onChange={handleFormChange} rows={3}></textarea>
            
            <div className="grid">
              <label htmlFor="editTaskPriorityTable">Prioridade</label>
              <select id="editTaskPriorityTable" name="priority" value={currentTaskData.priority} onChange={handleFormChange}>
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
              </select>
              
              <label htmlFor="editTaskStatusModalTable">Status</label>
              <select id="editTaskStatusModalTable" name="status" value={currentTaskData.status} onChange={handleFormChange}>
                {ALL_TASK_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="grid">
              <label htmlFor="editTaskAssignedToTable">Atribuir a</label>
              <select id="editTaskAssignedToTable" name="assignedToMemberId" value={currentTaskData.assignedToMemberId || ''} onChange={handleFormChange}>
                <option value="">Ninguém</option>
                {availableMembers.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
              </select>
              
              <label htmlFor="editTaskDueDateTable">Vencimento</label>
              <input type="date" id="editTaskDueDateTable" name="dueDate" value={currentTaskData.dueDate} onChange={handleFormChange} />
            </div>
            {formError && <p style={{color: 'var(--pico-form-element-invalid-active-border-color, red)'}}>{formError}</p>}
            <footer>
              <button type="button" className="secondary outline" onClick={closeFormModal} disabled={isSubmittingForm}>Cancelar</button>
              <button type="submit" aria-busy={isSubmittingForm} disabled={isSubmittingForm}>
                {isSubmittingForm ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </footer>
          </form>
        </article>
      </dialog>

      <dialog ref={deleteDialogRef} onClose={closeDeleteModal} open={isDeleteModalOpen}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={(e) => { e.preventDefault(); closeDeleteModal(); }}></a>
            <h3>Confirmar Exclusão</h3>
          </header>
          <p>Tem a certeza de que deseja excluir a tarefa "<strong>{taskToDelete?.title}</strong>"? Esta ação não pode ser desfeita.</p>
          <footer>
            <button type="button" className="secondary outline" onClick={closeDeleteModal} disabled={isDeleting}>Cancelar</button>
            <button type="button" className="contrast" onClick={confirmDeleteTask} aria-busy={isDeleting} disabled={isDeleting}>
              {isDeleting ? 'A excluir...' : 'Excluir Tarefa'}
            </button>
          </footer>
        </article>
      </dialog>

    </div>
  );
};

// Adicionar import de FormEvent se não estiver já no topo do arquivo
import type { FormEvent } from 'react';


export default TaskMonitoringPage;
