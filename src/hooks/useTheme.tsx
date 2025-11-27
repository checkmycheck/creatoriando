import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTheme = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentMode = () => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    };

    const applyThemeColors = (data: Array<{ setting_key: string; setting_value: string; theme_mode: string }>) => {
      const currentMode = getCurrentMode();
      const root = document.documentElement;
      const themeObj: Record<string, Record<string, string>> = { dark: {}, light: {} };
      
      // Apply only colors for current mode
      data.forEach(({ setting_key, setting_value, theme_mode }) => {
        themeObj[theme_mode][setting_key] = setting_value;
        
        if (theme_mode === currentMode) {
          root.style.setProperty(`--${setting_key}`, setting_value);
        }
      });
      
      // Cache both dark and light colors
      localStorage.setItem('theme-colors', JSON.stringify(themeObj));
    };

    // Apply cached theme immediately (synchronous)
    const cachedTheme = localStorage.getItem('theme-colors');
    if (cachedTheme) {
      try {
        const colors = JSON.parse(cachedTheme);
        const currentMode = getCurrentMode();
        const root = document.documentElement;
        
        if (colors[currentMode]) {
          Object.entries(colors[currentMode]).forEach(([key, value]) => {
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
          .select("setting_key, setting_value, theme_mode");

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

    // Listen to theme mode changes
    const handleThemeChange = () => {
      const cachedTheme = localStorage.getItem('theme-colors');
      if (cachedTheme) {
        try {
          const colors = JSON.parse(cachedTheme);
          const currentMode = getCurrentMode();
          const root = document.documentElement;
          
          if (colors[currentMode]) {
            Object.entries(colors[currentMode]).forEach(([key, value]) => {
              root.style.setProperty(`--${key}`, value as string);
            });
          }
        } catch (error) {
          console.error("Error applying theme on mode change:", error);
        }
      }
    };

    window.addEventListener('themechange', handleThemeChange);

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
            
            const currentMode = getCurrentMode();
            
            // Only apply if it matches current mode
            if (theme_mode === currentMode) {
              document.documentElement.style.setProperty(`--${setting_key}`, setting_value);
            }
            
            // Update localStorage cache
            const cachedTheme = localStorage.getItem('theme-colors');
            const themeObj = cachedTheme ? JSON.parse(cachedTheme) : { dark: {}, light: {} };
            if (!themeObj[theme_mode]) themeObj[theme_mode] = {};
            themeObj[theme_mode][setting_key] = setting_value;
            localStorage.setItem('theme-colors', JSON.stringify(themeObj));
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      supabase.removeChannel(channel);
    };
  }, []);

  return { loading };
};
