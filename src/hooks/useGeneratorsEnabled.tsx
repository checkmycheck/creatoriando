import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = 'generators-enabled';

export function useGeneratorsEnabled() {
  // SEMPRE TRUE por padrão - melhor mostrar menu e esconder depois
  // do que não mostrar e usuário não conseguir acessar
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

        // Se houver QUALQUER erro (incluindo RLS), manter habilitado
        if (error) {
          console.warn("[Generators] Erro ao carregar (usando padrão true):", error.message);
          setIsEnabled(true);
          localStorage.setItem(CACHE_KEY, 'true');
          setLoading(false);
          return;
        }

        if (data?.setting_value) {
          const enabled = data.setting_value === "true";
          setIsEnabled(enabled);
          localStorage.setItem(CACHE_KEY, enabled ? 'true' : 'false');
        } else {
          // Se não existe no banco, usar true como padrão
          setIsEnabled(true);
          localStorage.setItem(CACHE_KEY, 'true');
        }
      } catch (err) {
        // Qualquer exceção = manter habilitado
        console.warn("[Generators] Exceção (usando padrão true):", err);
        setIsEnabled(true);
        localStorage.setItem(CACHE_KEY, 'true');
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
