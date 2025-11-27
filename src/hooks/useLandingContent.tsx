import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LandingContent {
  id: string;
  section: string;
  content: any;
  display_order: number;
  is_active: boolean;
}

export const useLandingContent = (section?: string) => {
  const [content, setContent] = useState<LandingContent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContent = async () => {
    try {
      let query = supabase
        .from("landing_content")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (section) {
        query = query.eq("section", section);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error loading landing content:", error);
      toast.error("Erro ao carregar conteúdo");
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (id: string, updates: Partial<LandingContent>) => {
    try {
      const { error } = await supabase
        .from("landing_content")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      await loadContent();
      toast.success("Conteúdo atualizado com sucesso!");
      return true;
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error("Erro ao atualizar conteúdo");
      return false;
    }
  };

  const createContent = async (newContent: Omit<LandingContent, "id">) => {
    try {
      const { error } = await supabase
        .from("landing_content")
        .insert(newContent);

      if (error) throw error;
      
      await loadContent();
      toast.success("Conteúdo criado com sucesso!");
      return true;
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("Erro ao criar conteúdo");
      return false;
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("landing_content")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      await loadContent();
      toast.success("Conteúdo deletado com sucesso!");
      return true;
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Erro ao deletar conteúdo");
      return false;
    }
  };

  useEffect(() => {
    loadContent();
  }, [section]);

  return {
    content,
    loading,
    loadContent,
    updateContent,
    createContent,
    deleteContent,
  };
};
