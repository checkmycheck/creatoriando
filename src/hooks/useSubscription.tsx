import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionPlan = "free" | "pro" | "enterprise";

interface SubscriptionData {
  plan: SubscriptionPlan;
  characterCount: number;
  canCreateMore: boolean;
  isLoading: boolean;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    plan: "free",
    characterCount: 0,
    canCreateMore: false,
    isLoading: true,
  });

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setSubscription(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Get user profile with subscription info
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan")
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
