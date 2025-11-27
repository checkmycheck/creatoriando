import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTheme = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyThemeColors = (data: Array<{ setting_key: string; setting_value: string; theme_mode: string }>) => {
      const root = document.documentElement;
      
      // Apply only dark mode colors
      const darkColors = data.filter(item => item.theme_mode === 'dark');
      const themeObj: Record<string, string> = {};
      
      darkColors.forEach(({ setting_key, setting_value }) => {
        themeObj[setting_key] = setting_value;
        root.style.setProperty(`--${setting_key}`, setting_value);
      });
      
      // Cache dark colors
      localStorage.setItem('theme-colors', JSON.stringify({ dark: themeObj }));
    };

    // Apply cached theme immediately (synchronous)
    const cachedTheme = localStorage.getItem('theme-colors');
    if (cachedTheme) {
      try {
        const colors = JSON.parse(cachedTheme);
        const root = document.documentElement;
        
        if (colors.dark) {
          Object.entries(colors.dark).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value as string);
          });
        }
      } catch (error) {
        console.error("Error applying cached theme:", error);
      }
    }

    const loadTheme = async () => {
      try {
        const { data, error } = await supabase
          .from("theme_settings")
          .select("setting_key, setting_value, theme_mode")
          .eq("theme_mode", "dark");

        if (error) throw error;

        if (data) {
          applyThemeColors(data);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();

    // Subscribe to theme changes from admin CMS
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
          if (payload.new && "setting_key" in payload.new && "setting_value" in payload.new && "theme_mode" in payload.new) {
            const { setting_key, setting_value, theme_mode } = payload.new as { 
              setting_key: string; 
              setting_value: string;
              theme_mode: string;
            };
            
            // Only apply dark mode
            if (theme_mode === 'dark') {
              document.documentElement.style.setProperty(`--${setting_key}`, setting_value);
            
              // Update localStorage cache
              const cachedTheme = localStorage.getItem('theme-colors');
              const themeObj = cachedTheme ? JSON.parse(cachedTheme) : { dark: {} };
              if (!themeObj.dark) themeObj.dark = {};
              themeObj.dark[setting_key] = setting_value;
              localStorage.setItem('theme-colors', JSON.stringify(themeObj));
            }
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
