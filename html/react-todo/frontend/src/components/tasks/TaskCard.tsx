// frontend/src/components/tasks/TaskCard.tsx
import React from 'react';

// Importando os tipos que serão definidos na página que usar este card.
import type { Task } from '../../pages/UserTasksPage';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  // Função para determinar a cor da borda com base na prioridade
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'alta':
        return 'var(--pico-color-red-550, #d32f2f)';
      case 'media':
        return 'var(--pico-color-amber-500, #ffc107)';
      case 'baixa':
        return 'var(--pico-color-green-500, #4caf50)';
      default:
        return 'var(--pico-muted-border-color, #d1d5db)';
    }
  };

  return (
    // O card principal, usando <article> do Pico.css com sombra e fundo definidos
    <article 
      style={{
        borderLeft: `5px solid ${getPriorityColor()}`,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--pico-card-background-color, white)',
        boxShadow: 'var(--pico-card-box-shadow, 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03))'
      }}
    >
      <header>
        {/* Usando hgroup para agrupar o título e a descrição, como você sugeriu */}
        <hgroup style={{ margin: 0 }}>
          <h5 style={{ marginBottom: '0.25rem' }}>{task.title}</h5>
          {task.description && <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--pico-muted-color)' }}>{task.description}</p>}
        </hgroup>
      </header>

      {/* Usamos <details> para criar um "acordeão" que é perfeito para mobile */}
      <details style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
        <summary role="button" className="secondary outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
          Ver Outras Informações
        </summary>
        <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--pico-muted-border-color)' }}>
          <p>
            <strong>Status:</strong> {task.status.replace('_', ' ')}
          </p>
          <p>
            <strong>Atribuída a:</strong> {
              task.assignedMemberIds.length > 0
                ? task.assignedMemberIds.map(m => m.name).join(', ')
                : "Apenas Eu"
            }
          </p>
          <p>
            <strong>Vencimento:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}
          </p>
        </div>
      </details>
      
      <footer style={{ paddingTop: '1rem', marginTop: 'auto', borderTop: '1px solid var(--pico-muted-border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="outline secondary" onClick={onEdit}>Editar</button>
          <button className="outline contrast" onClick={onDelete}>Excluir</button>
        </div>
      </footer>
    </article>
  );
};

export default TaskCard;

