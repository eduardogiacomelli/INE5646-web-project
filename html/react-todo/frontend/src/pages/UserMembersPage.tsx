// frontend/src/pages/UserMembersPage.tsx (VERSÃO REFINADA COM CARDS E CORREÇÕES)
import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import MemberCard from '../components/members/MemberCard'; // Importando nosso novo componente

// --- INTERFACES ---
// Exportando para que o MemberCard possa usar
export interface MemberWithTaskCount {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  completedTasks: number; // Adicionando o campo para o contador
}

interface MembersApiResponse {
  members: MemberWithTaskCount[];
  totalMembers: number;
}

interface MemberFormData {
  name: string;
  email: string;
  role: string;
}

const initialMemberFormData: MemberFormData = { name: '', email: '', role: '' };

const UserMembersPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithTaskCount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentMemberData, setCurrentMemberData] = useState<MemberFormData>(initialMemberFormData);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<MemberWithTaskCount | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const formDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const fetchMembers = async () => {
    if (members.length === 0) setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<MembersApiResponse>('/members');
      setMembers(response.data.members);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível carregar os membros.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMembers();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOpenFormModal = (mode: 'create' | 'edit', member?: MemberWithTaskCount) => {
    setModalMode(mode);
    setFormError(null);
    if (mode === 'edit' && member) {
      setCurrentMemberData({
        name: member.name,
        email: member.email || '',
        role: member.role || '',
      });
      setEditingMemberId(member._id);
    } else {
      setCurrentMemberData(initialMemberFormData);
      setEditingMemberId(null);
    }
    setIsFormModalOpen(true);
    formDialogRef.current?.showModal();
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    formDialogRef.current?.close();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMemberData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmittingForm(true);

    if (!currentMemberData.name.trim()) {
      setFormError('O nome do membro é obrigatório.');
      setIsSubmittingForm(false);
      return;
    }
    if (currentMemberData.email.trim() && !/\S+@\S+\.\S+/.test(currentMemberData.email)) {
        setFormError('Por favor, insira um email válido.');
        setIsSubmittingForm(false);
        return;
    }

    const payload = {
        name: currentMemberData.name.trim(),
        email: currentMemberData.email.trim(),
        role: currentMemberData.role.trim(),
    };

    try {
      if (modalMode === 'create') {
        await api.post('/members', payload);
      } else if (modalMode === 'edit' && editingMemberId) {
        await api.put(`/members/${editingMemberId}`, payload);
      }
      fetchMembers();
      handleCloseFormModal();
    } catch (err: any) {
      setFormError(err.response?.data?.message || `Não foi possível ${modalMode} o membro.`);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleOpenDeleteModal = (member: MemberWithTaskCount) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
    deleteDialogRef.current?.showModal();
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    deleteDialogRef.current?.close();
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.delete(`/members/${memberToDelete._id}`);
      setMembers(prev => prev.filter(m => m._id !== memberToDelete._id));
      handleCloseDeleteModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Não foi possível excluir o membro.');
      handleCloseDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <article aria-busy="true">Carregando equipe...</article>;
  }

  return (
    <article>
      <hgroup>
        <h1>Minha Equipe</h1>
        <p>Adicione e gerencie os membros que podem ser atribuídos a tarefas.</p>
      </hgroup>

      {error && (
        <aside style={{ backgroundColor: 'var(--pico-color-red-200)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--pico-color-red-500)', borderRadius: 'var(--pico-border-radius)'}}>
          <strong>Erro:</strong> {error}
        </aside>
      )}

      <button onClick={() => handleOpenFormModal('create')} disabled={isFormModalOpen || isDeleteModalOpen}>
        + Adicionar Novo Membro
      </button>

      {/* Modal de Criar/Editar Membro */}
      <dialog ref={formDialogRef} onClose={handleCloseFormModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={handleCloseFormModal}></a>
            <h3>{modalMode === 'create' ? 'Adicionar Novo Membro' : 'Editar Membro'}</h3>
          </header>
          <form onSubmit={handleFormSubmit}>
            <label htmlFor="memberName">Nome do Membro*</label>
            <input type="text" id="memberName" name="name" value={currentMemberData.name} onChange={handleFormChange} required />
            <label htmlFor="memberEmail">Email</label>
            <input type="email" id="memberEmail" name="email" value={currentMemberData.email} onChange={handleFormChange} />
            <label htmlFor="memberRole">Cargo/Função</label>
            <input type="text" id="memberRole" name="role" value={currentMemberData.role} onChange={handleFormChange} />
            {formError && <p style={{ color: 'var(--pico-color-red-500)' }}>{formError}</p>}
            <footer>
              <button type="button" className="secondary outline" onClick={handleCloseFormModal} disabled={isSubmittingForm}>Cancelar</button>
              <button type="submit" aria-busy={isSubmittingForm} disabled={isSubmittingForm}>
                {isSubmittingForm ? 'Salvando...' : 'Salvar'}
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
            <p>
                Tem certeza que deseja excluir o membro "<strong>{memberToDelete?.name}</strong>"?
                As tarefas atribuídas a este membro serão desassociadas. Esta ação não pode ser desfeita.
            </p>
            <footer>
                <button type="button" className="secondary outline" onClick={handleCloseDeleteModal} disabled={isDeleting}>Cancelar</button>
                <button type="button" className="contrast" onClick={handleConfirmDeleteMember} aria-busy={isDeleting} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Excluir Membro'}
                </button>
            </footer>
        </article>
      </dialog>
      
      {/* Layout de Cards para Membros */}
      <section style={{ marginTop: '2rem' }}>
        {members.length === 0 && !isLoading ? (
          <p>Você ainda não adicionou membros à sua equipe.</p>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {members.map((member) => (
              <MemberCard
                key={member._id}
                member={member}
                onEdit={() => handleOpenFormModal('edit', member)}
                onDelete={() => handleOpenDeleteModal(member)}
              />
            ))}
          </div>
        )}
      </section>
    </article>
  );
};

export default UserMembersPage;

