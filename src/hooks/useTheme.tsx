import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTheme = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apply cached theme immediately (synchronous)
    const cachedTheme = localStorage.getItem('theme-colors');
    if (cachedTheme) {
      try {
        const colors = JSON.parse(cachedTheme);
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value as string);
        });
      } catch (error) {
        console.error("Error applying cached theme:", error);
      }
    }

    const loadTheme = async () => {
      try {
        const { data, error } = await supabase
          .from("theme_settings")
          .select("setting_key, setting_value");

        if (error) throw error;

        if (data) {
          const root = document.documentElement;
          const themeObj: Record<string, string> = {};
          
          data.forEach(({ setting_key, setting_value }) => {
            root.style.setProperty(`--${setting_key}`, setting_value);
            themeObj[setting_key] = setting_value;
          });
          
          // Update localStorage cache
          localStorage.setItem('theme-colors', JSON.stringify(themeObj));
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();

    // Subscribe to theme changes
    const channel = supabase
      .channel("theme-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "theme_settings",
        },
        (payload) => {
          if (payload.new && "setting_key" in payload.new && "setting_value" in payload.new) {
            const { setting_key, setting_value } = payload.new as { setting_key: string; setting_value: string };
            document.documentElement.style.setProperty(`--${setting_key}`, setting_value);
            
            // Update localStorage cache
            const cachedTheme = localStorage.getItem('theme-colors');
            const themeObj = cachedTheme ? JSON.parse(cachedTheme) : {};
            themeObj[setting_key] = setting_value;
            localStorage.setItem('theme-colors', JSON.stringify(themeObj));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { loading };
};
