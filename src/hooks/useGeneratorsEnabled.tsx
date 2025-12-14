import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = 'generators-enabled';

export function useGeneratorsEnabled() {
  // IMPORTANTE: Default TRUE para garantir que menu apareça imediatamente
  // enquanto carrega do banco (melhor UX do que esconder e mostrar depois)
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

        if (error) {
          console.error("[Generators] Erro ao carregar:", error);
          // Em caso de erro, manter habilitado
          setIsEnabled(true);
          setLoading(false);
          return;
        }

        if (data) {
          const enabled = data.setting_value === "true";
          setIsEnabled(enabled);
          localStorage.setItem(CACHE_KEY, enabled ? 'true' : 'false');
        } else {
          // Se não existe, criar com valor padrão true
          await supabase
            .from("theme_settings")
            .insert({ setting_key: "generators_enabled", setting_value: "true" });
          setIsEnabled(true);
          localStorage.setItem(CACHE_KEY, 'true');
        }
      } catch (error) {
        console.error("[Generators] Erro:", error);
        // Em caso de exceção, manter habilitado para não bloquear
        setIsEnabled(true);
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
          const enabled = payload.new.setting_value === "true";
          setIsEnabled(enabled);
          localStorage.setItem(CACHE_KEY, enabled ? 'true' : 'false');
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
      localStorage.setItem(CACHE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
      console.error("Error updating generators setting:", error);
      throw error;
    }
  };

  return { isEnabled, loading, setEnabled };
}
