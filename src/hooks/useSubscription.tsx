import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "free" | "pro" | "enterprise";

interface SubscriptionData {
  plan: SubscriptionPlan;
  characterCount: number;
  canCreateMore: boolean;
  isLoading: boolean;
  credits: number;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    plan: "free",
    characterCount: 0,
    canCreateMore: false,
    isLoading: true,
    credits: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    fetchSubscriptionData();

    if (!userId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel('profile-credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          fetchSubscriptionData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_transactions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchSubscriptionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchSubscriptionData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setSubscription(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Get user profile with subscription info and credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan, credits")
      .eq("id", user.id)
      .single();

    // Get character count
    const { data: characterCountData } = await supabase
      .rpc("get_user_character_count", { user_id: user.id });

    // Check if can create more
    const { data: canCreate } = await supabase
      .rpc("can_create_character", { user_id: user.id });

    setSubscription({
      plan: profile?.subscription_plan || "free",
      characterCount: characterCountData || 0,
      canCreateMore: canCreate || false,
      isLoading: false,
      credits: profile?.credits || 0,
    });
  };

  const getCharacterLimit = () => {
    if (subscription.plan === "free") return 1;
    return Infinity; // Unlimited for pro and enterprise
  };

  return {
    ...subscription,
    characterLimit: getCharacterLimit(),
    refresh: fetchSubscriptionData,
  };
};
