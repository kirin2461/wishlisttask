import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { wishlists } from '@/lib/api';
import type { Wishlist } from '@/types';
import { AnimatedButton } from '@/components/animations/AnimatedButton';
import { StaggerContainer, StaggerItem } from '@/components/animations/AnimatedCard';
import { AnimatedGift } from '@/components/animations/AnimatedGift';
import { Confetti } from '@/components/animations/Confetti';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Plus, Trash2, ExternalLink, Loader2, 
  Calendar, Package, Gift, LogOut, Sparkles, 
  Users, Copy, Check
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [myWishlists, setMyWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWishlist, setNewWishlist] = useState({ title: '', description: '', occasion: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadWishlists();
  }, []);

  const loadWishlists = async () => {
    try {
      const response = await wishlists.getAll();
      setMyWishlists(response.data);
    } catch (error) {
      console.error('Failed to load wishlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await wishlists.create(newWishlist);
      setMyWishlists([response.data, ...myWishlists]);
      setNewWishlist({ title: '', description: '', occasion: '' });
      setIsDialogOpen(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      navigate(`/wishlist/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create wishlist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wishlist?')) return;
    setDeletingId(id);
    try {
      await wishlists.delete(id);
      setMyWishlists(myWishlists.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete wishlist:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const copyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/w/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const stats = [
    { label: 'Total Wishlists', value: myWishlists.length, icon: Package, color: 'from-purple-500 to-pink-500' },
    { label: 'Shared With', value: '∞', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Gifts Received', value: '0', icon: Gift, color: 'from-green-500 to-emerald-500' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-purple-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Confetti trigger={showConfetti} />

      {/* Header */}
      <motion.header 
        className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <AnimatedGift size="sm" animate />
              <div>
                <h1 className="text-xl font-bold gradient-text">Wishlist</h1>
                <p className="text-xs text-gray-500">Make dreams come true</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.div 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-purple-700 font-medium">{user?.name}</span>
              </motion.div>
              <motion.button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-lg shadow-purple-500/5 border border-gray-100"
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Title and Create Button */}
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900">My Wishlists</h2>
            <p className="text-gray-600 mt-1">
              {myWishlists.length === 0 
                ? 'Create your first wishlist to get started' 
                : `You have ${myWishlists.length} wishlist${myWishlists.length !== 1 ? 's' : ''}`
              }
            </p>
          </motion.div>

          <motion.button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30"
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Plus className="w-5 h-5" />
            New Wishlist
          </motion.button>
        </div>

        {/* Wishlists Grid */}
        {myWishlists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl shadow-purple-500/5">
              <motion.div
                className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Package className="w-16 h-16 text-purple-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No wishlists yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first wishlist and share it with friends and family. 
                They'll be able to reserve gifts or contribute to group gifts!
              </p>
              <AnimatedButton
                onClick={() => setIsDialogOpen(true)}
                icon={<Plus className="w-5 h-5" />}
              >
                Create Your First Wishlist
              </AnimatedButton>
            </div>
          </motion.div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {myWishlists.map((wishlist) => (
                <StaggerItem key={wishlist.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 shadow-lg shadow-purple-500/5 border border-gray-100 cursor-pointer group"
                    onClick={() => navigate(`/wishlist/${wishlist.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                          {wishlist.title}
                        </h3>
                        {wishlist.occasion && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {wishlist.occasion}
                          </div>
                        )}
                      </div>
                      <motion.div
                        className="bg-gradient-to-br from-purple-100 to-pink-100 p-2 rounded-lg"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        <Gift className="w-5 h-5 text-purple-500" />
                      </motion.div>
                    </div>

                    {wishlist.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{wishlist.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Created {format(new Date(wishlist.created_at), 'MMM d, yyyy')}</span>
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <motion.button
                        onClick={() => navigate(`/wishlist/${wishlist.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-medium text-sm hover:bg-purple-100 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </motion.button>
                      <motion.button
                        onClick={() => copyLink(wishlist.slug, wishlist.id)}
                        className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {copiedId === wishlist.id ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(wishlist.id)}
                        disabled={deletingId === wishlist.id}
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {deletingId === wishlist.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerContainer>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Create New Wishlist
            </DialogTitle>
            <DialogDescription>
              Create a wishlist for any occasion and share it with your loved ones
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWishlist} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Birthday Wishlist 2024"
                value={newWishlist.title}
                onChange={(e) => setNewWishlist({ ...newWishlist, title: e.target.value })}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Input
                id="occasion"
                placeholder="e.g., Birthday, Christmas, Wedding"
                value={newWishlist.occasion}
                onChange={(e) => setNewWishlist({ ...newWishlist, occasion: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a personal message or description..."
                value={newWishlist.description}
                onChange={(e) => setNewWishlist({ ...newWishlist, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <motion.button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <AnimatedButton
                type="submit"
                loading={isCreating}
                className="flex-1"
              >
                Create Wishlist
              </AnimatedButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
