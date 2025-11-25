import { CharacterData } from "@/pages/CreateCharacter";

export const generateVeo3Prompt = (data: CharacterData): string => {
  const {
    gender,
    age,
    appearance,
    visual,
    environment,
    posture,
    mood,
    action,
    movement,
    angle,
    lighting,
    voiceTone,
    script,
  } = data;

  return `<?xml version="1.0" encoding="UTF-8"?>
<veo3_prompt>
  <metadata>
    <aspect_ratio>9:16</aspect_ratio>
    <resolution>1080p</resolution>
    <duration>8s</duration>
    <language>pt-BR</language>
  </metadata>
  
  <subject>
    <person>
      <gender>${gender || "Não especificado"}</gender>
      <age_range>${age || "Não especificado"}</age_range>
      <appearance>${appearance || "Não especificado"}</appearance>
      <clothing>${visual || "Não especificado"}</clothing>
      <posture>${posture || "Não especificado"}</posture>
      <expression>${mood || "Neutro"}</expression>
      <action>${action || "Falando para câmera"}</action>
      <eye_contact>Direct to camera</eye_contact>
    </person>
  </subject>
  
  <environment>
    <setting>${environment || "Não especificado"}</setting>
    <context>Professional video content creation setup</context>
  </environment>
  
  <cinematography>
    <framing>Medium close-up, centered subject</framing>
    <camera_movement>${movement || "Estático"}</camera_movement>
    <camera_angle>${angle || "Eye level"}</camera_angle>
    <focus>Sharp focus on subject, slight background blur</focus>
  </cinematography>
  
  <lighting>
    <setup>${lighting || "Professional studio lighting"}</setup>
    <mood>Professional and engaging</mood>
    <quality>High-quality, well-balanced illumination</quality>
  </lighting>
  
  <audio>
    <voice_tone>${voiceTone || "Profissional"}</voice_tone>
    <voice_quality>Clear, professional recording quality</voice_quality>
    <delivery>Natural and engaging pace</delivery>
    <background_music>None</background_music>
  </audio>
  
  <dialogue>
    <language>pt-BR</language>
    <text>${script || "Conteúdo a ser definido"}</text>
    <accent>Brazilian Portuguese</accent>
    <emotion>${mood || "Confiante"}</emotion>
    <pacing>Natural conversational speed for 8-second duration</pacing>
  </dialogue>
  
  <technical_specifications>
    <subtitles>Optional, not required</subtitles>
    <watermarks>None</watermarks>
    <avoid_artifacts>Ensure clean, professional output without glitches</avoid_artifacts>
  </technical_specifications>
</veo3_prompt>`;
};
