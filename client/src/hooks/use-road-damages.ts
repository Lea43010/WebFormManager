import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RoadDamage, InsertRoadDamage } from "../../../shared/schema-road-damage";

/**
 * Hook zum Verwalten von Straßenschäden im Frontend
 */
export function useRoadDamages(projectId?: number) {
  const queryClient = useQueryClient();
  
  // Alle Straßenschäden für ein Projekt abrufen
  const {
    data: roadDamages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/projects", projectId, "road-damages"],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await apiRequest(
        "GET", 
        `/api/projects/${projectId}/road-damages`
      );
      return await res.json();
    },
    enabled: !!projectId, // Nur ausführen, wenn projectId vorhanden
  });

  // Straßenschaden-Statistiken für ein Projekt abrufen
  const {
    data: roadDamageStats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/projects", projectId, "road-damages", "stats"],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await apiRequest(
        "GET", 
        `/api/projects/${projectId}/road-damages/stats`
      );
      return await res.json();
    },
    enabled: !!projectId,
  });

  // Mutation zum Erstellen eines neuen Straßenschadens
  const createRoadDamageMutation = useMutation({
    mutationFn: async (data: InsertRoadDamage) => {
      const res = await apiRequest("POST", "/api/road-damages", data);
      return await res.json();
    },
    onSuccess: () => {
      // Nach erfolgreicher Erstellung den Cache invalidieren
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages", "stats"] });
    },
  });

  // Mutation zum Hochladen eines Bildes für einen Straßenschaden
  const uploadRoadDamageImageMutation = useMutation({
    mutationFn: async ({ id, imageFile }: { id: number; imageFile: File }) => {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const res = await fetch(`/api/road-damages/${id}/image`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Fehler beim Hochladen des Bildes");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages"] });
    },
  });

  // Mutation zum Aktualisieren eines Straßenschadens
  const updateRoadDamageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRoadDamage> }) => {
      const res = await apiRequest("PUT", `/api/road-damages/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages", "stats"] });
    },
  });

  // Mutation zum Löschen eines Straßenschadens
  const deleteRoadDamageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/road-damages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages", "stats"] });
    },
  });

  // Mutation für die Spracherkennung (Audio-Upload und Verarbeitung)
  const speechRecognitionMutation = useMutation({
    mutationFn: async ({ 
      audioBlob, 
      projectId, 
      createdBy 
    }: { 
      audioBlob: Blob; 
      projectId: number; 
      createdBy: number 
    }) => {
      const formData = new FormData();
      formData.append("audioFile", audioBlob, "recording.webm");
      formData.append("projectId", projectId.toString());
      formData.append("createdBy", createdBy.toString());
      
      const res = await fetch("/api/road-damages/speech", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Fehler bei der Spracherkennung");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "road-damages", "stats"] });
    },
  });

  return {
    roadDamages,
    roadDamageStats,
    isLoading,
    isLoadingStats,
    error,
    statsError,
    createRoadDamageMutation,
    uploadRoadDamageImageMutation,
    updateRoadDamageMutation,
    deleteRoadDamageMutation,
    speechRecognitionMutation,
  };
}