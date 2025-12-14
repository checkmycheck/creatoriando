import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = 'generators-enabled';

export function useGeneratorsEnabled() {
  // Inicializar do cache para evitar flash
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    console.log('[Generators] Cache inicial:', cached);
    return cached !== null ? cached === 'true' : true;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSetting = async () => {
      try {
        console.log('[Generators] Carregando configuração do banco...');
        
        const { data, error } = await supabase
          .from("theme_settings")
          .select("setting_value")
          .eq("setting_key", "generators_enabled")
          .maybeSingle();

        console.log('[Generators] Resposta do banco:', { data, error });

        if (error) {
          console.error("[Generators] Erro ao carregar:", error);
          setLoading(false);
          return;
        }

        if (data) {
          const enabled = data.setting_value === "true";
          console.log('[Generators] Valor do banco:', enabled);
          setIsEnabled(enabled);
          localStorage.setItem(CACHE_KEY, enabled ? 'true' : 'false');
        } else {
          // Setting doesn't exist, create it with default value true
          console.log('[Generators] Criando configuração padrão...');
          await supabase
            .from("theme_settings")
            .insert({ setting_key: "generators_enabled", setting_value: "true" });
          setIsEnabled(true);
          localStorage.setItem(CACHE_KEY, 'true');
        }
      } catch (error) {
        console.error("[Generators] Erro:", error);
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
          console.log('[Generators] Realtime update:', payload);
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
