export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  occasion?: string;
  slug: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  title: string;
  description?: string;
  url?: string;
  price?: number;
  image_url?: string;
  is_group_gift: boolean;
  target_amount?: number;
  created_at: string;
  // For public view
  is_reserved?: boolean;
  reservation_count?: number;
  total_contributed?: number;
  contributors_count?: number;
  contributions?: ContributionView[];
}

export interface ContributionView {
  anonymous_name: string;
  amount: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  item_id: string;
  user_id?: string;
  anonymous_name: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  item_id: string;
  user_id?: string;
  amount: number;
  anonymous_name: string;
  created_at: string;
}

export interface PublicWishlistView {
  wishlist: Wishlist;
  items: WishlistItem[];
  owner_name: string;
}
