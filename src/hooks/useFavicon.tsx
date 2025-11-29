import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFavicon = () => {
  useEffect(() => {
    const applyFavicon = (url: string) => {
      if (!url) return;
      
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      
      // Add new favicon
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = url;
      document.head.appendChild(link);
    };

    const loadFavicon = async () => {
      try {
        // Try to load from localStorage first
        const cached = localStorage.getItem("favicon-url");
        if (cached) {
          applyFavicon(cached);
        }

        // Fetch from database
        const { data, error } = await supabase
          .from("landing_content")
          .select("content")
          .eq("section", "hero")
          .eq("is_active", true)
          .single();

        if (error) throw error;

        const content = data?.content as any;
        const faviconUrl = content?.faviconUrl;
        if (faviconUrl) {
          localStorage.setItem("favicon-url", faviconUrl);
          applyFavicon(faviconUrl);
        }
      } catch (error) {
        console.error("Error loading favicon:", error);
      }
    };

    loadFavicon();

    // Subscribe to changes
    const channel = supabase
      .channel("favicon-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "landing_content",
          filter: "section=eq.hero",
        },
        (payload: any) => {
          const content = payload.new?.content as any;
          const faviconUrl = content?.faviconUrl;
          if (faviconUrl) {
            localStorage.setItem("favicon-url", faviconUrl);
            applyFavicon(faviconUrl);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);
};
