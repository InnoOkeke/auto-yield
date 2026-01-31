'use client';

import { useState } from 'react';
import Modal from './Modal';
import { Target, Flag, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess: () => void;
}

export default function CreateChallengeModal({ isOpen, onClose, userId, onSuccess }: CreateChallengeModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        targetAmount: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/create`, {
                creatorId: userId,
                name: formData.name,
                description: formData.description,
                targetAmount: parseFloat(formData.targetAmount),
            });
            onSuccess();
            onClose();
            setFormData({ name: '', description: '', targetAmount: '' });
        } catch (error) {
            console.error('Failed to create challenge:', error);
            alert('Failed to create challenge. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Start a Challenge">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Goal Name</label>
                    <div className="relative">
                        <Flag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                            required
                            type="text"
                            placeholder="e.g., Summer Trip, New Laptop"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary focus:outline-none transition-all text-foreground"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Target Amount (USDC)</label>
                    <div className="relative">
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <input
                            required
                            type="number"
                            step="0.01"
                            placeholder="500.00"
                            value={formData.targetAmount}
                            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary focus:outline-none transition-all text-foreground"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Description (Optional)</label>
                    <div className="relative">
                        <FileText className="absolute left-4 top-4 w-5 h-5 text-muted" />
                        <textarea
                            placeholder="Tell your friends what this is for..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-foreground/5 border border-foreground/10 focus:border-primary focus:outline-none transition-all text-foreground min-h-[100px]"
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Challenge'}
                </button>
            </form>
        </Modal>
    );
}
