// frontend/src/pages/TaskMonitoringPage.tsx (VERSÃO FINAL REFINADA COM ACORDEÃO)
import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import TaskCard from '../components/tasks/TaskCard'; // Importa o nosso TaskCard

// --- INTERFACES (Definindo os tipos de dados consistentes) ---
interface Member {
  _id: string;
  name: string;
}

// O tipo Task aqui deve ser o mesmo usado em toda a aplicação
// para evitar inconsistências.
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'baixa' | 'media' | 'alta';
  assignedMemberIds: Member[]; // Corrigido para o nome e tipo corretos
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'arquivada';
const ALL_TASK_STATUSES: TaskStatus[] = ['pendente', 'em_andamento', 'concluida', 'arquivada'];

interface TasksApiResponse { tasks: Task[]; }
interface MembersApiResponse { members: Member[]; }

// Formulário específico para esta página: só status e membros
interface MonitorFormData {
  status: TaskStatus;
  assignedMemberIds: string[];
}

const TaskMonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null); // Guarda a tarefa inteira a ser gerenciada
  const [currentFormData, setCurrentFormData] = useState<MonitorFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<string | null>(null);


  const fetchAllData = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      // Busca tarefas e membros em paralelo para mais eficiência
      const [tasksResponse, membersResponse] = await Promise.all([
        api.get<TasksApiResponse>('/tasks'),
        api.get<MembersApiResponse>('/members')
      ]);
      setAllTasks(tasksResponse.data.tasks);
      setAvailableMembers(membersResponse.data.members);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar os dados de monitoramento.');
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const handleOpenManageModal = (task: Task) => {
    setCurrentTask(task);
    setCurrentFormData({
      status: task.status,
      assignedMemberIds: task.assignedMemberIds.map(m => m._id),
    });
    setFormError(null);
    setIsModalOpen(true);
    dialogRef.current?.showModal();
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    dialogRef.current?.close();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'assignedMemberIds') {
      const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
      setCurrentFormData(prev => prev ? { ...prev, assignedMemberIds: selectedIds } : null);
    } else {
      setCurrentFormData(prev => prev ? { ...prev, [name]: value as TaskStatus } : null);
    }
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentTask || !currentFormData) return;
    
    setFormError(null);
    setIsSubmitting(true);
    setGeneralMessage(null);
    
    try {
      // Envia apenas os campos que podem ser alterados nesta página
      await api.put(`/tasks/${currentTask._id}`, currentFormData);
      setGeneralMessage(`Tarefa "${currentTask.title}" atualizada com sucesso.`);
      fetchAllData(false); // Re-busca todos os dados para atualizar o quadro, sem mostrar o loading principal
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Não foi possível atualizar a tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenDeleteModal = (task: Task) => {
    setTaskToDelete(task);
    deleteDialogRef.current?.showModal();
  };
  
  const handleCloseDeleteModal = () => {
    deleteDialogRef.current?.close();
  };
  
  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      setGeneralMessage(`Tarefa "${taskToDelete.title}" excluída com sucesso.`);
      setAllTasks(prev => prev.filter(t => t._id !== taskToDelete._id));
      handleCloseDeleteModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível excluir a tarefa.');
      handleCloseDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <article aria-busy="true">Carregando quadro de monitoramento...</article>;
  }

  return (
    <article>
      <hgroup>
        <h1>Monitoramento de Tarefas</h1>
        <p>Acompanhe o progresso e altere o status ou os responsáveis pelas tarefas.</p>
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

      {/* Layout de Acordeão por Status */}
      <section>
        {ALL_TASK_STATUSES.map(status => {
          const tasksInStatus = allTasks.filter(task => task.status === status);
          return (
            <details key={status} open={status === 'pendente' || status === 'em_andamento'}>
              <summary>
                <h5 style={{ display: 'inline', margin: 0 }}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  <span style={{ marginLeft: '0.5rem', color: 'var(--pico-muted-color)' }}>
                    ({tasksInStatus.length})
                  </span>
                </h5>
              </summary>
              <div>
                {tasksInStatus.length > 0 ? (
                  <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {tasksInStatus
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(task => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onEdit={() => handleOpenManageModal(task)}
                            onDelete={() => handleOpenDeleteModal(task)}
                          />
                        ))
                    }
                  </div>
                ) : (
                  <p style={{ fontStyle: 'italic', color: 'var(--pico-muted-color)', paddingLeft: '1rem' }}>Nenhuma tarefa neste status.</p>
                )}
              </div>
            </details>
          );
        })}
      </section>

      {/* Modal Simplificado para Edição de Status e Membros */}
      <dialog ref={dialogRef} onClose={handleCloseModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={handleCloseModal}></a>
            <h3>Gerenciar Tarefa: "{currentTask?.title}"</h3>
          </header>
          <form onSubmit={handleFormSubmit}>
            <label htmlFor="status">Alterar Status da Tarefa</label>
            <select id="status" name="status" value={currentFormData?.status || ''} onChange={handleFormChange}>
              {ALL_TASK_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_',' ')}</option>)}
            </select>

            <label htmlFor="assignedMemberIds-monitor">Alterar Membros Atribuídos (Segure Ctrl/Cmd para múltiplos)</label>
            <select
              multiple id="assignedMemberIds-monitor" name="assignedMemberIds"
              value={currentFormData?.assignedMemberIds || []} onChange={handleFormChange} style={{ height: '150px' }}
            >
              {availableMembers.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
            </select>
            
            {formError && <p style={{ color: 'var(--pico-color-red-500)' }}>{formError}</p>}
            
            <footer>
              <button type="button" className="secondary outline" onClick={handleCloseModal} disabled={isSubmitting}>Cancelar</button>
              <button type="submit" aria-busy={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </footer>
          </form>
        </article>
      </dialog>
      
      {/* Modal de Exclusão (reutilizado) */}
      <dialog ref={deleteDialogRef} onClose={handleCloseDeleteModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={handleCloseDeleteModal}></a>
            <h3>Confirmar Exclusão</h3>
          </header>
          <p>Tem certeza que deseja excluir a tarefa "<strong>{currentTask?.title || taskToDelete?.title}</strong>"?</p>
          <footer>
            <button type="button" className="secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>Cancelar</button>
            <button className="contrast" onClick={handleConfirmDeleteTask} aria-busy={isDeleting} disabled={isDeleting}>
              {isDeleting ? '' : 'Excluir Tarefa'}
            </button>
          </footer>
        </article>
      </dialog>
    </article>
  );
};

export default TaskMonitoringPage;

