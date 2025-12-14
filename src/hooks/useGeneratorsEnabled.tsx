import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGeneratorsEnabled() {
  // SEMPRE TRUE por padrão - NUNCA esconder menu se não conseguir ler do banco
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(false); // Começa false para não bloquear

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const { data } = await supabase
          .from("theme_settings")
          .select("setting_value")
          .eq("setting_key", "generators_enabled")
          .maybeSingle();

        // ÚNICO caso que desabilita: se explicitamente "false"
        if (data?.setting_value === "false") {
          setIsEnabled(false);
        }
        // Qualquer outro caso (true, null, erro, undefined) = manter TRUE
      } catch {
        // Silenciosamente manter TRUE
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
          const enabled = payload.new.setting_value !== "false";
          setIsEnabled(enabled);
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
