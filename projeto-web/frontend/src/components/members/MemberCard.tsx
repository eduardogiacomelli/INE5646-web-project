// frontend/src/components/members/MemberCard.tsx
import React from 'react';
// Importaremos o tipo 'MemberWithTaskCount' da página que usar este card.
import type { MemberWithTaskCount } from '../../pages/UserMembersPage';

interface MemberCardProps {
  member: MemberWithTaskCount;
  onEdit: () => void;
  onDelete: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit, onDelete }) => {
  // Gera um placeholder de avatar com as iniciais e uma cor de fundo baseada no nome
  const getAvatar = () => {
    const initials = member.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    // Simples hash para gerar uma cor consistente para o mesmo nome
    let hash = 0;
    for (let i = 0; i < member.name.length; i++) {
      hash = member.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    const backgroundColor = `hsl(${h}, 70%, 85%)`; // Cor pastel clara
    const color = `hsl(${h}, 70%, 30%)`; // Cor escura para o texto

    return (
      <div 
        style={{
          width: '50px',
          height: '50px',
          minWidth: '50px', // Garante que não encolha
          borderRadius: '50%',
          backgroundColor,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          textTransform: 'uppercase'
        }}
      >
        {initials}
      </div>
    );
  };

  return (
    <article style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        {getAvatar()}
        <hgroup style={{ margin: 0, overflow: 'hidden' }}>
          <h5 style={{ marginBottom: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</h5>
          {member.role && <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--pico-muted-color)' }}>{member.role}</p>}
        </hgroup>
      </div>
      
      {/* Exibe informações úteis diretamente no card */}
      <div style={{ fontSize: '0.9em', flexGrow: 1 }}>
        {member.email && (
            <p style={{ margin: '0.25rem 0' }}>
                <strong>Email:</strong> <a href={`mailto:${member.email}`}>{member.email}</a>
            </p>
        )}
        {/* Lógica para o contador de tarefas */}
        <p style={{ margin: '0.25rem 0' }}>
            <strong>Tarefas Concluídas:</strong> {typeof member.completedTasks === 'number' ? member.completedTasks : 'Carregando...'}
        </p>
      </div>

      <footer style={{ paddingTop: '1rem', marginTop: 'auto', borderTop: '1px solid var(--pico-muted-border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="outline secondary" onClick={onEdit}>Editar</button>
          <button className="outline contrast" onClick={onDelete}>Excluir</button>
        </div>
      </footer>
    </article>
  );
};

export default MemberCard;

