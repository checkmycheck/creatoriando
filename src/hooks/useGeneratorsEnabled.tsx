import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGeneratorsEnabled() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const { data, error } = await supabase
          .from("theme_settings")
          .select("setting_value")
          .eq("setting_key", "generators_enabled")
          .maybeSingle();

        if (!error && data) {
          setIsEnabled(data.setting_value === "true");
        }
      } catch (error) {
        console.error("Error loading generators setting:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSetting();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("generators-setting")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "theme_settings",
          filter: "setting_key=eq.generators_enabled",
        },
        (payload) => {
          setIsEnabled(payload.new.setting_value === "true");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setEnabled = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("theme_settings")
        .update({ setting_value: enabled ? "true" : "false" })
        .eq("setting_key", "generators_enabled");

      if (error) throw error;
      setIsEnabled(enabled);
    } catch (error) {
      console.error("Error updating generators setting:", error);
      throw error;
    }
  };

  return { isEnabled, loading, setEnabled };
}
