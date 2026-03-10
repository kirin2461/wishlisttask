import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi, reservations, contributions } from '@/lib/api';
import type { PublicWishlistView, WishlistItem } from '@/types';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Gift, Package, Users, Check, Loader2, ExternalLink, Heart, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PublicWishlist() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicWishlistView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isContributeDialogOpen, setIsContributeDialogOpen] = useState(false);
  const [anonymousName, setAnonymousName] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservedItems, setReservedItems] = useState<Set<string>>(new Set());
  const [contributedItems, setContributedItems] = useState<Set<string>>(new Set());

  const loadWishlist = useCallback(async () => {
    if (!slug) return;
    try {
      const response = await publicApi.getWishlist(slug);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Wishlist not found');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket(data?.wishlist.id || null);

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'item_added':
        case 'item_deleted':
        case 'item_reserved':
        case 'reservation_cancelled':
        case 'contribution_added':
          loadWishlist();
          break;
      }
    }
  }, [lastMessage, loadWishlist]);

  const handleReserve = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await reservations.create({
        item_id: selectedItem.id,
        anonymous_name: anonymousName || 'Anonymous',
      });
      setReservedItems(prev => new Set(prev).add(selectedItem.id));
      setIsReserveDialogOpen(false);
      setAnonymousName('');
      loadWishlist();
    } catch (error) {
      console.error('Failed to reserve:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async () => {
    if (!selectedItem || !contributionAmount) return;
    setIsSubmitting(true);
    try {
      await contributions.create({
        item_id: selectedItem.id,
        amount: parseFloat(contributionAmount),
        anonymous_name: anonymousName || 'Anonymous',
      });
      setContributedItems(prev => new Set(prev).add(selectedItem.id));
      setIsContributeDialogOpen(false);
      setAnonymousName('');
      setContributionAmount('');
      loadWishlist();
    } catch (error) {
      console.error('Failed to contribute:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReserveDialog = (item: WishlistItem) => {
    setSelectedItem(item);
    setIsReserveDialogOpen(true);
  };

  const openContributeDialog = (item: WishlistItem) => {
    setSelectedItem(item);
    setIsContributeDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <CardContent>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Wishlist Not Found</h1>
            <p className="text-gray-600">{error || 'This wishlist may have been removed or is private.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { wishlist, items, owner_name } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">Wishlist</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{wishlist.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-gray-600">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {owner_name}
            </span>
            {wishlist.occasion && (
              <span>• {wishlist.occasion}</span>
            )}
          </div>
          {wishlist.description && (
            <p className="mt-4 text-gray-700 max-w-2xl">{wishlist.description}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-gray-600">
            {items.length} {items.length === 1 ? 'item' : 'items'} • Click on an item to reserve or contribute
          </p>
        </div>

        {items.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600">This wishlist is empty</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const isReserved = item.is_reserved || reservedItems.has(item.id);
              const hasContributed = contributedItems.has(item.id);
              const userReserved = reservedItems.has(item.id);
              const progress = item.is_group_gift && item.target_amount
                ? Math.min(100, ((item.total_contributed || 0) / item.target_amount) * 100)
                : 0;

              return (
                <Card 
                  key={item.id} 
                  className={`overflow-hidden group transition-all ${
                    isReserved && !item.is_group_gift 
                      ? 'opacity-75 grayscale' 
                      : 'hover:shadow-lg'
                  }`}
                >
                  {item.image_url ? (
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/e5e7eb/9ca3af?text=No+Image';
                        }}
                      />
                      {isReserved && !item.is_group_gift && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-white rounded-full p-3">
                            <Check className="w-8 h-8 text-green-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                      <Package className="w-12 h-12 text-gray-300" />
                      {isReserved && !item.is_group_gift && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="bg-white rounded-full p-3">
                            <Check className="w-8 h-8 text-green-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
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

                    {/* User Action Indicators */}
                    {(userReserved || hasContributed) && (
                      <div className="flex gap-2 mt-2">
                        {userReserved && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <Check className="w-3 h-3" />
                            You reserved this
                          </span>
                        )}
                        {hasContributed && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                            <Heart className="w-3 h-3" />
                            You contributed
                          </span>
                        )}
                      </div>
                    )}

                    {/* Group Gift Progress */}
                    {item.is_group_gift && item.target_amount && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Raised: {formatCurrency(item.total_contributed || 0)}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {formatCurrency(item.target_amount)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {item.contributors_count || 0} contributor(s)
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      {item.is_group_gift ? (
                        <Button
                          onClick={() => openContributeDialog(item)}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          disabled={progress >= 100}
                        >
                          {progress >= 100 ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Fully Funded
                            </>
                          ) : (
                            <>
                              <Heart className="w-4 h-4 mr-1" />
                              Contribute
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => openReserveDialog(item)}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          disabled={isReserved}
                        >
                          {isReserved ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Reserved
                            </>
                          ) : (
                            <>
                              <Gift className="w-4 h-4 mr-1" />
                              I'll Get This
                            </>
                          )}
                        </Button>
                      )}
                      
                      {item.url && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Reserve Dialog */}
      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Gift</DialogTitle>
            <DialogDescription>
              You're about to reserve "{selectedItem?.title}". The wishlist owner won't know who reserved it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (optional)</Label>
              <Input
                id="name"
                placeholder="Anonymous"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                This will be visible to other contributors, but not to the wishlist owner.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReserve}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={isContributeDialogOpen} onOpenChange={setIsContributeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribute to Group Gift</DialogTitle>
            <DialogDescription>
              You're contributing to "{selectedItem?.title}". 
              {selectedItem?.target_amount && (
                <span> Target: {formatCurrency(selectedItem.target_amount)}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Contribution Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrib-name">Your Name (optional)</Label>
              <Input
                id="contrib-name"
                placeholder="Anonymous"
                value={anonymousName}
                onChange={(e) => setAnonymousName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContributeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleContribute}
              disabled={isSubmitting || !contributionAmount || parseFloat(contributionAmount) <= 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Contribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
