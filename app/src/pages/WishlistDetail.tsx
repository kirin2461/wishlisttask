import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { wishlists, items, urlParser } from '@/lib/api';
import type { Wishlist, WishlistItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Link2, Trash2, ExternalLink, Loader2, Package, Gift, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function WishlistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth(); // Verify authentication
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parsingUrl, setParsingUrl] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    url: '',
    price: '',
    image_url: '',
    is_group_gift: false,
    target_amount: '',
  });

  useEffect(() => {
    if (id) {
      loadWishlist();
      loadItems();
    }
  }, [id]);

  const loadWishlist = async () => {
    try {
      const response = await wishlists.get(id!);
      setWishlist(response.data);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      navigate('/dashboard');
    }
  };

  const loadItems = async () => {
    try {
      const response = await items.getByWishlist(id!);
      setWishlistItems(response.data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseUrl = async () => {
    if (!newItem.url) return;
    setParsingUrl(true);
    try {
      const response = await urlParser.parse(newItem.url);
      const data = response.data;
      if (data.title) setNewItem(prev => ({ ...prev, title: data.title }));
      if (data.price) setNewItem(prev => ({ ...prev, price: data.price.toString() }));
      if (data.image_url) setNewItem(prev => ({ ...prev, image_url: data.image_url }));
      if (data.description) setNewItem(prev => ({ ...prev, description: data.description }));
    } catch (error) {
      console.error('Failed to parse URL:', error);
    } finally {
      setParsingUrl(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsAddingItem(true);
    try {
      await items.create({
        wishlist_id: id,
        title: newItem.title,
        description: newItem.description || undefined,
        url: newItem.url || undefined,
        price: newItem.price ? parseFloat(newItem.price) : undefined,
        image_url: newItem.image_url || undefined,
        is_group_gift: newItem.is_group_gift,
        target_amount: newItem.target_amount ? parseFloat(newItem.target_amount) : undefined,
      });
      
      setNewItem({
        title: '',
        description: '',
        url: '',
        price: '',
        image_url: '',
        is_group_gift: false,
        target_amount: '',
      });
      setIsDialogOpen(false);
      loadItems();
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await items.delete(itemId);
      setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const copyLink = () => {
    if (!wishlist) return;
    const url = `${window.location.origin}/w/${wishlist.slug}`;
    navigator.clipboard.writeText(url);
    alert('Public link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!wishlist) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{wishlist.title}</h1>
              {wishlist.occasion && (
                <p className="text-sm text-gray-600">{wishlist.occasion}</p>
              )}
            </div>
            <Button variant="outline" onClick={copyLink}>
              <Link2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Items</h2>
            <p className="text-gray-600 mt-1">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add an item to your wishlist
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Product URL (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="url"
                        placeholder="https://..."
                        value={newItem.url}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleParseUrl}
                        disabled={!newItem.url || parsingUrl}
                      >
                        {parsingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto-fill'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Item name"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add details..."
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        placeholder="https://..."
                        value={newItem.image_url}
                        onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="group-gift"
                        checked={newItem.is_group_gift}
                        onCheckedChange={(checked) => setNewItem({ ...newItem, is_group_gift: checked })}
                      />
                      <Label htmlFor="group-gift" className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Group Gift
                        </div>
                      </Label>
                    </div>
                  </div>

                  {newItem.is_group_gift && (
                    <div className="space-y-2">
                      <Label htmlFor="target_amount">Target Amount</Label>
                      <Input
                        id="target_amount"
                        type="number"
                        step="0.01"
                        placeholder="Amount to raise"
                        value={newItem.target_amount}
                        onChange={(e) => setNewItem({ ...newItem, target_amount: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isAddingItem}>
                    {isAddingItem && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Item
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add items to your wishlist. Your friends will be able to reserve or contribute to them.
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                {item.image_url ? (
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e5e7eb/9ca3af?text=No+Image';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                      {item.price && (
                        <p className="text-lg font-bold text-purple-600 mt-1">
                          {formatCurrency(item.price)}
                        </p>
                      )}
                    </div>
                    {item.is_group_gift && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        <Users className="w-3 h-3" />
                        Group
                      </span>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex gap-2 mt-4">
                    {item.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
