import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react'; // <--- CORRIGIDO
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Member {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

interface MembersApiResponse {
  members: Member[];
  currentPage: number;
  totalPages: number;
  totalMembers: number;
}

interface MemberFormData {
  name: string;
  email: string;
  role: string;
}

const initialMemberFormData: MemberFormData = {
  name: '',
  email: '',
  role: '',
};

const UserMembersPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentMemberData, setCurrentMemberData] = useState<MemberFormData>(initialMemberFormData);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  const formDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const fetchMembers = async () => {
    if (members.length === 0) setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<MembersApiResponse>('/members');
      setMembers(response.data.members);
    } catch (err: any) {
      console.error('Erro ao buscar membros:', err);
      setError(err.response?.data?.message || 'Não foi possível carregar os membros da equipa.');
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


  const openFormModal = (mode: 'create' | 'edit', member?: Member) => {
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

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    formDialogRef.current?.close();
    setEditingMemberId(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentMemberData(prev => ({ ...prev, [name]: value }));
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

    const payload: MemberFormData = {
        name: currentMemberData.name.trim(),
        email: currentMemberData.email.trim() || '',
        role: currentMemberData.role.trim() || '',
    };
    
    try {
      if (modalMode === 'create') {
        await api.post<{ member: Member; message: string }>('/members', payload);
      } else if (modalMode === 'edit' && editingMemberId) {
        await api.put<{ member: Member; message: string }>(`/members/${editingMemberId}`, payload);
      }
      fetchMembers(); 
      closeFormModal();
    } catch (err: any) {
      console.error(`Erro ao ${modalMode === 'create' ? 'criar' : 'editar'} membro:`, err);
      setFormError(err.response?.data?.message || `Não foi possível ${modalMode === 'create' ? 'criar' : 'editar'} o membro.`);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const openDeleteModal = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
    deleteDialogRef.current?.showModal();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    deleteDialogRef.current?.close();
    setMemberToDelete(null);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.delete(`/members/${memberToDelete._id}`);
      setMembers(prevMembers => prevMembers.filter(m => m._id !== memberToDelete._id));
      closeDeleteModal();
    } catch (err: any) {
      console.error('Erro ao excluir membro:', err);
      setError(err.response?.data?.message || 'Não foi possível excluir o membro.');
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && members.length === 0) {
    return <article aria-busy="true">A carregar membros da equipa...</article>;
  }

  if (error && members.length === 0) {
    return (
      <article>
        <hgroup>
          <h2>Erro ao Carregar Membros</h2>
          <p style={{ color: 'var(--pico-form-element-invalid-active-border-color, red)' }}>{error}</p>
        </hgroup>
        <Link to="/dashboard" role="button" className="secondary">Voltar ao Dashboard</Link>
      </article>
    );
  }

  return (
    <article>
      <hgroup>
        <h1>Meus Membros da Equipa</h1>
        <h2>Adicione e gira os membros da sua equipa.</h2>
      </hgroup>

      {error && members.length > 0 && (
         <aside style={{ backgroundColor: 'var(--pico-error-background)', color: 'var(--pico-error-color)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--pico-error-border)', borderRadius: 'var(--pico-border-radius)'}}>
            <strong>Erro:</strong> {error}
        </aside>
      )}

      <p>
        <button onClick={() => openFormModal('create')} disabled={isFormModalOpen || isDeleteModalOpen}>
          + Adicionar Novo Membro
        </button>
      </p>

      <dialog ref={formDialogRef} onClose={closeFormModal}>
        <article>
          <header>
            <a href="#close" aria-label="Fechar" className="close" onClick={(e) => { e.preventDefault(); closeFormModal(); }}></a>
            <h3>{modalMode === 'create' ? 'Adicionar Novo Membro' : 'Editar Membro'}</h3>
          </header>
          <form onSubmit={handleFormSubmit}>
            <label htmlFor="memberName">
              Nome do Membro*
              <input type="text" id="memberName" name="name" value={currentMemberData.name} onChange={handleFormChange} required placeholder="Nome completo do membro"/>
            </label>
            <label htmlFor="memberEmail">
              Email (Opcional)
              <input type="email" id="memberEmail" name="email" value={currentMemberData.email} onChange={handleFormChange} placeholder="email@exemplo.com"/>
            </label>
            <label htmlFor="memberRole">
              Cargo/Função (Opcional)
              <input type="text" id="memberRole" name="role" value={currentMemberData.role} onChange={handleFormChange} placeholder="Ex: Desenvolvedor, Designer"/>
            </label>
            {formError && (<p style={{ color: 'var(--pico-form-element-invalid-active-border-color, red)' }}>{formError}</p>)}
            <footer>
              <button type="button" className="secondary outline" onClick={closeFormModal} disabled={isSubmittingForm}>Cancelar</button>
              <button type="submit" aria-busy={isSubmittingForm} disabled={isSubmittingForm}>
                {isSubmittingForm ? (modalMode === 'create' ? 'A adicionar...' : 'A guardar...') : (modalMode === 'create' ? 'Adicionar Membro' : 'Guardar Alterações')}
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
            Tem a certeza de que deseja excluir o membro "<strong>{memberToDelete?.name}</strong>"?
            As tarefas atribuídas a este membro serão desassociadas (não excluídas).
            Esta ação não pode ser desfeita.
          </p>
          <footer>
            <button type="button" className="secondary outline" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancelar
            </button>
            <button type="button" className="contrast" onClick={confirmDeleteMember} aria-busy={isDeleting} disabled={isDeleting}>
              {isDeleting ? 'A excluir...' : 'Excluir Membro'}
            </button>
          </footer>
        </article>
      </dialog>

      {members.length === 0 && !isLoading && (<p>Você ainda não adicionou nenhum membro à sua equipa.</p>)}
      {members.length > 0 && (
        <div className="overflow-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Email</th>
                <th scope="col">Cargo/Função</th>
                <th scope="col">Adicionado em</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id}>
                  <td>{member.name}</td>
                  <td>{member.email || 'N/A'}</td>
                  <td>{member.role || 'N/A'}</td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="outline secondary" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}} onClick={() => openFormModal('edit', member)}>
                        Editar
                      </button>
                      <button className="outline contrast" style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}} onClick={() => openDeleteModal(member)}>
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

export default UserMembersPage;

