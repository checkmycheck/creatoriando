import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_VERSION_KEY = "cache-version";

export function useCacheVersion() {
  useEffect(() => {
    const checkCacheVersion = async () => {
      try {
        const { data, error } = await supabase
          .from("theme_settings")
          .select("setting_value")
          .eq("setting_key", "cache_version")
          .maybeSingle();

        if (error || !data) return;

        const serverVersion = data.setting_value;
        const localVersion = localStorage.getItem(CACHE_VERSION_KEY);

        if (localVersion && localVersion !== serverVersion) {
          // Cache version mismatch - clear all caches and reload
          console.log("Cache version mismatch, clearing local data...");
          
          const cacheKeys = [
            'theme-colors',
            'theme-colors-timestamp',
            'user-credits',
            'favicon-url',
            'onboarding-completed',
            'sidebar-state'
          ];
          
          cacheKeys.forEach(key => localStorage.removeItem(key));
          localStorage.setItem(CACHE_VERSION_KEY, serverVersion);
          
          window.location.reload();
          return;
        }

        // Store current version
        if (serverVersion) {
          localStorage.setItem(CACHE_VERSION_KEY, serverVersion);
        }
      } catch (error) {
        console.error("Error checking cache version:", error);
      }
    };

    checkCacheVersion();

    // Subscribe to cache version changes
    const channel = supabase
      .channel("cache-version")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "theme_settings",
          filter: "setting_key=eq.cache_version",
        },
        (payload) => {
          const newVersion = payload.new.setting_value;
          const localVersion = localStorage.getItem(CACHE_VERSION_KEY);
          
          if (localVersion !== newVersion) {
            console.log("Cache version updated remotely, clearing...");
            
            const cacheKeys = [
              'theme-colors',
              'theme-colors-timestamp',
              'user-credits',
              'favicon-url'
            ];
            
            cacheKeys.forEach(key => localStorage.removeItem(key));
            localStorage.setItem(CACHE_VERSION_KEY, newVersion);
            
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
